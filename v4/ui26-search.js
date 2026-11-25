(()=>{"use strict";
const normalize=s=>String(s||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l").replace(/[^a-z0-9]+/g," ").trim();
const matches=(value,query)=>normalize(query).split(/\s+/).filter(Boolean).every(word=>normalize(value).includes(word));
function setup(id,selector){
 const wrapper=document.querySelector('[data-mv-search="'+id+'"]'),field=document.getElementById(id),items=[...document.querySelectorAll(selector)];
 if(!wrapper||!field||!items.length)return;
 const reset=wrapper.querySelector("[data-mv-clear]"),out=wrapper.querySelector("output"),empty=wrapper.querySelector("[data-mv-empty]");
 if(!reset||!out||!empty)return;
 const original=new Map(items.map(item=>[item,item.textContent]));
 function apply(){let n=0;for(const item of items){const visible=matches([original.get(item),item.textContent,item.dataset.mvAlias].join(" "),field.value);item.hidden=!visible;if(visible)n++;}out.value=String(n);empty.hidden=n!==0;reset.disabled=!field.value;}
 field.addEventListener("input",apply);
 field.addEventListener("keydown",e=>{if(e.key==="Escape"&&field.value){e.preventDefault();field.value="";apply();}});
 reset.addEventListener("click",()=>{field.value="";apply();field.focus()});
 document.addEventListener("minevora:languagechange",apply);
 wrapper.hidden=false;apply();
}
setup("mv26-feature-search","#ui26-funkcje .mv26-tile");
setup("mv26-guide-search",".mvg-toc a[data-mv-alias]");
})();