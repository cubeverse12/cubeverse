/* Keeps the reconstruction banner in sync with the site's PL / EN selector. */
(() => {
  "use strict";
  function updateRebuildStatus() {
    const selector = document.querySelector("[data-minevora-language]");
    const language = selector && selector.value === "en" ? "en" : "pl";
    document.querySelectorAll("#mv-rebuild-status [data-mv-rebuild-en]").forEach((el) => {
      const translation = language === "en" ? el.getAttribute("data-mv-rebuild-en") : el.getAttribute("data-mv-rebuild-pl");
      if (translation && el.textContent !== translation) el.textContent = translation;
    });
  }
  document.addEventListener("DOMContentLoaded", () => {
    updateRebuildStatus();
    const selector = document.querySelector("[data-minevora-language]");
    if (selector) selector.addEventListener("change", () => requestAnimationFrame(updateRebuildStatus));
  });
})();
