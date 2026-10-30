/* MINEVORA 3.0.11 — interactive mockup settings; DOES NOT access Windows launcher */
(()=>{"use strict";
const root=document.documentElement;
const keys={theme:["neon","soft"],density:["normal","compact"],motion:["on","off"]};
const storageKey="minevora-website-preview-v311";
const mediaReduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const initial={theme:"neon",density:"normal",motion:mediaReduced?"off":"on"};
let saved={};
try{saved=JSON.parse(localStorage.getItem(storageKey)||"{}")||{}}catch(e){saved={}}
for(const key of Object.keys(keys)){
 const candidate=saved[key];
 if(keys[key].includes(candidate))initial[key]=candidate;
}
function render(){
 root.dataset.demoTheme=initial.theme;
 root.dataset.demoDensity=initial.density;
 root.dataset.demoMotion=initial.motion;
 document.querySelectorAll("[data-demo-set]").forEach(btn=>{
   const [key,value]=btn.dataset.demoSet.split(":");
   btn.setAttribute("aria-pressed",String(initial[key]===value));
 });
 const label=document.getElementById("previewMode");
 if(label)label.textContent=(initial.theme==="soft"?"Violet Soft":"Violet Neon")+" · "+(initial.density==="compact"?"Kompaktowy":"Standardowy")+" · "+(initial.motion==="off"?"Bez animacji":"Efekty aktywne");
}
document.querySelectorAll("[data-demo-set]").forEach(btn=>{
 btn.addEventListener("click",()=>{
  const [key,value]=btn.dataset.demoSet.split(":");
  if(!Object.hasOwn(keys,key)||!keys[key].includes(value))return;
  initial[key]=value;
  try{localStorage.setItem(storageKey,JSON.stringify(initial))}catch(e){}
  render();
 });
});
render();
})();
