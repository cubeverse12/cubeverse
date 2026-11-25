(()=>{"use strict";
const field=document.getElementById("shop-search"),buttons=[...document.querySelectorAll(".shop-filters [data-filter]")],cards=[...document.querySelectorAll(".shop-card")],count=document.getElementById("shop-count"),empty=document.getElementById("shop-empty"),reset=document.getElementById("shop-reset");
if(!field||!count||!empty||!reset||!cards.length)return;
const normalize=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l").replace(/[^a-z0-9]+/g," ").trim();
const matches=(s,q)=>normalize(q).split(/\s+/).filter(Boolean).every(word=>normalize(s).includes(word));
const aliases={"rig":"rig rigi blender animacja animation postać character","plugin":"plugin pluginy paper java kod źródłowy source code","build":"budowle budowa build mapa lobby minecraft"};
let cat="all";
function apply(){let n=0;for(const card of cards){const category=card.dataset.category;const visible=(cat==="all"||category===cat)&&matches([card.dataset.search,aliases[category],card.textContent].join(" "),field.value);card.hidden=!visible;if(visible)n++;}count.value=String(n);empty.hidden=n!==0;reset.disabled=!field.value&&cat==="all";}
function select(category){cat=category;for(const b of buttons)b.setAttribute("aria-pressed",String(b.dataset.filter===cat));apply();}
function clear(){field.value="";select("all");}
for(const b of buttons)b.addEventListener("click",()=>select(b.dataset.filter));
field.addEventListener("input",apply);
field.addEventListener("keydown",event=>{if(event.key==="Escape"&&(field.value||cat!=="all")){event.preventDefault();clear();}});
reset.addEventListener("click",()=>{clear();field.focus();});
document.addEventListener("minevora:languagechange",apply);
reset.hidden=false;apply();
})();