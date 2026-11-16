/* MINEVORA Slate navigation: highlight the section actually in view.
   Mobile and desktop share the same existing working links. */
(()=>{"use strict";
const links=[...document.querySelectorAll(".mv-rail a[data-rail]")];
if(!links.length)return;
const isGuide=location.pathname.includes("/poradnik/");
const isDownload=location.pathname.includes("/pobierz/");
const sections=[
 ["start","home"],["kategorie-dodatkow","features"],["aktualizacja-15611","features"],
 ["funkcje","features"],["pvp-hud","pvp"],["wyglad","features"],
 ["skin-studio","skin"],["pobierz","download"],["spolecznosc","home"]
].map(([id,rail])=>({node:document.getElementById(id),rail})).filter(x=>x.node);
function setActive(rail){
 for(const link of links){
  if(link.dataset.rail===rail)link.setAttribute("aria-current","page");
  else link.removeAttribute("aria-current");
 }
}
function update(){
 if(isGuide)return setActive("guide");
 if(isDownload)return setActive("download");
 const sample=Math.max(100,Math.min(window.innerHeight*.34,310));
 let active="home";
 for(const {node,rail} of sections){
  const rect=node.getBoundingClientRect();
  if(rect.top<=sample&&rect.bottom>=sample)active=rail;
 }
 setActive(active);
}
let ticking=false;
function schedule(){
 if(ticking)return;
 ticking=true;
 requestAnimationFrame(()=>{ticking=false;update()});
}
addEventListener("scroll",schedule,{passive:true});
addEventListener("resize",schedule,{passive:true});
addEventListener("hashchange",schedule);
update();
})();