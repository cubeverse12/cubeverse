/* MINEVORA Slate website: active sidebar links and translated labels.
   Navigation and source-download buttons are ordinary links, not mock game actions. */
(()=>{"use strict";
const links=[...document.querySelectorAll(".mv-rail a[data-rail]")];
function update(){
 const hash=decodeURIComponent(location.hash||"");
 let current=location.pathname.includes("/poradnik/")?"guide":location.pathname.includes("/pobierz/")?"download":hash==="#funkcje"||hash==="#wyglad"?"features":hash==="#skin-studio"?"skin":hash==="#pvp-hud"?"pvp":"home";
 for(const link of links){if(link.dataset.rail===current)link.setAttribute("aria-current","page");else link.removeAttribute("aria-current");}
}
addEventListener("hashchange",update);update();
/* The shared i18n controller owns all PL/EN text changes, including sidebar labels. */
})();
