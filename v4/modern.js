/* MINEVORA 5.0 — progressive enhancement only.
   Main content remains fully readable and indexed with JS disabled. */
(()=>{
 "use strict";
 const toggle=document.getElementById("navToggle");
 const nav=document.getElementById("siteNav");
 const tabs=[...document.querySelectorAll("[data-feature]")];
 const panel=document.getElementById("featurePanel");
 const image=document.getElementById("featureImage");
 const tag=document.getElementById("featureTag");
 const title=document.getElementById("featureName");
 const description=document.getElementById("featureDescription");

 const features={
   mody:{
      tag:"01 / MODY",title:"Mody, które pasują do Twojej gry.",
      text:"Przeglądaj koncepcję katalogu dodatków i zarządzania modyfikacjami. Przy instalacji sprawdzaj zgodność moda z wersją Minecrafta oraz wybranym loaderem.",
      image:"../assets/launcher-18-3-7/mods.svg",
      alt:"Wizualizacja panelu modów MINEVORA 18.3.7"
   },
   pvp:{
      tag:"02 / PvP HUD",title:"Twój interfejs. Twoje zasady.",
      text:"Odkryj projekt ustawień HUD: zdrowie, CPS, wyposażenie i przydatne wskaźniki. Faktyczny zakres działania zależy od wersji moda oraz Minecrafta.",
      image:"../assets/launcher-18-3-7/pvp.svg",
      alt:"Wizualizacja konfiguracji PvP HUD MINEVORA 18.3.7"
   },
   studio:{
      tag:"03 / SKIN STUDIO",title:"Nadaj swojej postaci charakter.",
      text:"Skin Studio przedstawia narzędzia projektu edytora postaci Minecraft 3D. Właściwa edycja i eksport PNG odbywają się wewnątrz aplikacji Windows.",
      image:"../assets/launcher-18-3-7/skins.svg",
      alt:"Wizualizacja Skin Studio MINEVORA 18.3.7"
   },
   ranking:{
      tag:"04 / RANKINGI",title:"Obserwuj swój postęp.",
      text:"Przykład wyglądu rang, awansów i statystyk graczy. Pokazane wartości są demonstracyjne — strona nie pobiera wyników z serwera w czasie rzeczywistym.",
      image:"../assets/launcher-18-3-7/ranking.svg",
      alt:"Wizualizacja rankingu graczy MINEVORA 18.3.7"
   }
 };
 function setMenu(open){
   if(!toggle||!nav)return;
   nav.classList.toggle("open",open);
   toggle.setAttribute("aria-expanded",String(open));
   toggle.setAttribute("aria-label",open?"Zamknij menu":"Otwórz menu");
 }
 toggle?.addEventListener("click",()=>setMenu(!nav.classList.contains("open")));
 nav?.addEventListener("click",event=>{
   if(event.target.closest("a"))setMenu(false);
 });
 document.addEventListener("keydown",event=>{
   if(event.key==="Escape")setMenu(false);
 });
 document.addEventListener("pointerdown",event=>{
   if(nav?.classList.contains("open")&&!nav.contains(event.target)&&!toggle?.contains(event.target)){
     setMenu(false);
   }
 });
 window.addEventListener("resize",()=>{if(innerWidth>800)setMenu(false);},{passive:true});

 function activate(name,focus=false){
   const feature=features[name];
   if(!feature||!panel||!image)return;
   for(const button of tabs){
     const chosen=button.dataset.feature===name;
     button.classList.toggle("active",chosen);
     button.setAttribute("aria-selected",String(chosen));
     button.tabIndex=chosen?0:-1;
     if(chosen){
       panel.setAttribute("aria-labelledby",button.id);
       if(focus)button.focus({preventScroll:true});
     }
   }
   tag.textContent=feature.tag;
   title.textContent=feature.title;
   description.textContent=feature.text;
   image.src=feature.image;
   image.alt=feature.alt;
 }
 tabs.forEach((button,index)=>{
   button.addEventListener("click",()=>{
     activate(button.dataset.feature);
     history.replaceState(null,"","#"+button.id);
   });
   button.addEventListener("keydown",event=>{
     const keys={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
     if(!(event.key in keys))return;
     event.preventDefault();
     const next=tabs[(index+keys[event.key]+tabs.length)%tabs.length];
     activate(next.dataset.feature,true);
     history.replaceState(null,"","#"+next.id);
   });
 });
 function followHash(){
   const hash=decodeURIComponent(location.hash.slice(1)).toLowerCase();
   const redirects={
     "poradnik":"./poradnik/",
     "opcje":"./poradnik/",
     "wersje":"#launcher",
     "sklep":"#funkcje",
     "plus":"#studio",
     "minigry":"#start"
   };
   if(Object.prototype.hasOwnProperty.call(redirects,hash)){
     const target=redirects[hash];
     if(target.startsWith("./"))location.replace(target);
     else location.replace(target);
     return;
   }
   if(hash in features)activate(hash);
 }
 window.addEventListener("hashchange",followHash);
 followHash();
})();