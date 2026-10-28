/* Progressive enhancement for MINEVORA's independent feature showcase.
   No external dependencies, no tracking and no automatic downloads. */
(() => {
  "use strict";
  const data = {
    mody: {
      src: "../assets/launcher-18-3-7/mods.svg",
      alt: "Wizualizacja katalogu modów MINEVORA",
      description: "Podgląd katalogu dodatków, zarządzania modami i zgodnymi profilami Minecraft Java.",
      label: "Zobacz Mody",
      href: "#mody"
    },
    pvp: {
      src: "../assets/launcher-18-3-7/pvp.svg",
      alt: "Wizualizacja interfejsu PvP HUD MINEVORA",
      description: "Projekt ustawień interfejsu PvP HUD. Dostępność zależy od wersji Minecrafta i zgodnego moda.",
      label: "Zobacz PvP Mode",
      href: "#pvp"
    },
    studio: {
      src: "../assets/launcher-18-3-7/skins.svg",
      alt: "Wizualizacja Skin Studio MINEVORA",
      description: "Projekt edytora wyglądu postaci Minecraft 3D, dostępnego w aplikacji Windows.",
      label: "Zobacz Skin Studio",
      href: "#studio"
    }
  };
  function selectFeature(key, focus) {
    if (!Object.prototype.hasOwnProperty.call(data, key)) return;
    const section = document.querySelector(".mv-deep-dive");
    if (!section) return;
    const tabs = [...section.querySelectorAll(".mv-show-tab")];
    const selected = tabs.find(t => t.dataset.show === key);
    const img = document.getElementById("mv-show-img");
    const desc = document.getElementById("mv-show-description");
    const link = document.getElementById("mv-show-link");
    if (!selected || !img || !desc || !link) return;
    tabs.forEach(t => {
      const active = t === selected;
      t.setAttribute("aria-selected", String(active));
      t.tabIndex = active ? 0 : -1;
    });
    const item = data[key];
    img.src = item.src;
    img.alt = item.alt;
    desc.textContent = item.description;
    link.href = item.href;
    link.replaceChildren(document.createTextNode(item.label + " ↗"));
    if (focus) selected.focus({preventScroll:true});
  }
  document.addEventListener("click", event => {
    const tab = event.target.closest(".mv-show-tab");
    if (tab) selectFeature(tab.dataset.show, false);
  });
  document.addEventListener("keydown", event => {
    const tab = event.target.closest(".mv-show-tab");
    if (!tab || !["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tabs = [...tab.parentElement.querySelectorAll(".mv-show-tab")];
    const idx = tabs.indexOf(tab);
    const newIndex = event.key === "Home" ? 0
      : event.key === "End" ? tabs.length - 1
      : (idx + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault();
    selectFeature(tabs[newIndex].dataset.show, true);
  });
})();
