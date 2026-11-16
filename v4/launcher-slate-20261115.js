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
// The native <details> mobile menu should not stay open after navigation,
// tapping outside, or pressing Escape. No modal overlay or scroll lock.
const mobileMenus=[...document.querySelectorAll(".mobile-nav")];
const closeMenus=()=>{for(const menu of mobileMenus)menu.open=false};
for(const menu of mobileMenus){
 const summary=menu.querySelector("summary");
 const syncExpanded=()=>{if(summary)summary.setAttribute("aria-expanded",String(menu.open))};
 menu.addEventListener("toggle",syncExpanded);
 menu.querySelectorAll(".mobile-items a").forEach(link=>link.addEventListener("click",closeMenus));
 syncExpanded();
}
document.addEventListener("pointerdown",event=>{
 if(mobileMenus.some(menu=>menu.open&&!menu.contains(event.target)))closeMenus();
});
document.addEventListener("keydown",event=>{
 if(event.key==="Escape"&&mobileMenus.some(menu=>menu.open)){
  const menu=mobileMenus.find(m=>m.open);
  closeMenus();
  menu?.querySelector("summary")?.focus();
 }
});
addEventListener("hashchange",closeMenus);
})();