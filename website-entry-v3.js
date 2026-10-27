/* MINEVORA RESET 4.0 public website entrypoint.
 * Preserve previous desktop WebChannel launcher and old account tools.
 * Public browser visitors go to the fully rebuilt /v3/ website.
 */
(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  if (params.has("legacy") || params.has("launcher") || params.has("desktop")) return;
  if (location.pathname.includes("/v3/") || location.pathname.includes("/v4/")) return;

  function isDesktopLauncher() {
    const ua = navigator.userAgent || "";
    return document.body?.classList.contains("mv-desktop-mode") ||
      /QtWebEngine|MINEVORA-Desktop|PySide/i.test(ua) ||
      Boolean(window.qt?.webChannelTransport) ||
      Boolean(window.chrome?.webview) ||
      Boolean(window.minevoraDesktopBridge) ||
      Boolean(window.minevoraNative);
  }
  function routePublicBrowser() {
    if (isDesktopLauncher()) return;
    const map = {
      home:"start",minigames:"minigry",pvp:"pvp",
      rankings:"ranking",studio:"studio",plus:"plus",
      download:"pobierz",podglad:"start",
      poradnik:"poradnik",odkrywaj:"start",
      sklep:"sklep",account:"poradnik"
    };
    const target = new URL("./v4/", window.location.href);
    target.search = window.location.search;
    const hash = window.location.hash.slice(1);
    target.hash = "#" + (Object.hasOwn(map,hash) ? map[hash] : (hash||"start"));
    window.location.replace(target.href);
  }
  if (document.readyState === "complete") setTimeout(routePublicBrowser, 350);
  else window.addEventListener("load", () => setTimeout(routePublicBrowser, 350), {once:true});
})();