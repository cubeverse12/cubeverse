(() => {
  "use strict";
  const btn = document.getElementById("menuToggle");
  const close = document.getElementById("navClose");
  const nav = document.getElementById("mobileNav");
  const scrim = document.getElementById("navScrim");
  if (!btn || !close || !nav || !scrim) return;

  let lastFocused = null;
  const isOpen = () => nav.classList.contains("open");

  function toggle(open) {
    const next = Boolean(open && window.matchMedia("(max-width:900px)").matches);
    if (next && !isOpen()) lastFocused = document.activeElement;
    nav.classList.toggle("open", next);
    nav.setAttribute("aria-hidden", String(!next));
    nav.inert = !next;
    scrim.hidden = !next;
    btn.setAttribute("aria-expanded", String(next));
    btn.setAttribute("aria-label", next ? "Zamknij menu" : "Otwórz menu");
    document.body.classList.toggle("menu-open", next);
    if (next) close.focus({preventScroll:true});
    else if (lastFocused && document.contains(lastFocused)) {
      lastFocused.focus({preventScroll:true});
      lastFocused = null;
    }
  }

  btn.addEventListener("click", () => toggle(!isOpen()));
  close.addEventListener("click", () => toggle(false));
  scrim.addEventListener("click", () => toggle(false));
  nav.addEventListener("click", e => {
    if (e.target.closest("a[href]")) toggle(false);
  });
  window.addEventListener("hashchange", () => toggle(false));
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900 && isOpen()) toggle(false);
  });
  document.addEventListener("keydown", e => {
    if (!isOpen()) return;
    if (e.key === "Escape") {
      e.preventDefault();
      toggle(false);
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [...nav.querySelectorAll('a[href],button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Highlight links to currently viewed sections without changing navigation.
  const topLinks = [...document.querySelectorAll('.desktop-nav a[href^="#"]')];
  const sections = [...document.querySelectorAll('main section[id]')];
  if ("IntersectionObserver" in window && topLinks.length) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of topLinks) {
          const active = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("active", active);
          if (active) a.setAttribute("aria-current", "location");
          else a.removeAttribute("aria-current");
        }
      }
    }, {rootMargin:"-80px 0px -65% 0px", threshold:0});
    sections.forEach(s => observer.observe(s));
  }

  // Support old MINEVORA route fragments when a link points straight to /v3/.
  const aliases = {
    home:"start", minigames:"minigry", rankings:"ranking",
    studio:"studio", download:"pobierz", poradnik:"pomoc",
    podglad:"launcher", odkrywaj:"start"
  };
  // A malformed URL fragment must not disable the rest of the page's controls.
  let old = location.hash.slice(1);
  try { old = decodeURIComponent(old); } catch (_) { old = ""; }
  if (Object.prototype.hasOwnProperty.call(aliases,old) && aliases[old] !== old) {
    history.replaceState(null, "", location.pathname + location.search + "#" + aliases[old]);
    document.getElementById(aliases[old])?.scrollIntoView({block:"start"});
  }
})();