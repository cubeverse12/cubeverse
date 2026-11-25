/* MINEVORA 1.56.17 guide: accessible progressive enhancements; content works without JS. */
(()=>{"use strict";
 const input=document.getElementById("guideSearch");
 const results=document.getElementById("searchResults");
 const details=Array.from(document.querySelectorAll(".guide-faq details"));
 if(!input||!results||!details.length)return;
 const originals=new Map(details.map(d=>[d,d.textContent]));
 const shortcuts=Array.from(document.querySelectorAll("[data-guide-query]"));
 const toc=Array.from(document.querySelectorAll('.mvg-toc a[href^="#"]'));
 const lang=()=>document.documentElement.lang==="en"?"en":"pl";
 const clean=value=>String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ł/g,"l").toLocaleLowerCase().trim();
 function search(){
   const q=clean(input.value);
   let count=0;
   for(const d of details){
     const hay=clean([originals.get(d),d.textContent,d.dataset.keywords].join(" "));
     const match=q.split(/\s+/).filter(Boolean).every(word=>hay.includes(word));
     d.hidden=!match;
     if(q&&match)d.open=true;
     if(!q)d.open=false;
     if(match)count++;
   }
   if(lang()==="en"){
     const message=q?(count?"Matching answers: "+count:"No results. Try another keyword or error code."):"Search FAQ using an error message or keyword."; if(results.textContent!==message)results.textContent=message;
   }else{
     const message=q?(count?"Znalezione odpowiedzi: "+count:"Brak wyników. Spróbuj innego hasła lub kodu błędu."):"Szukaj w FAQ — wpisz opis problemu albo kod błędu."; if(results.textContent!==message)results.textContent=message;
   }
 }
 function updateLang(){
   const en=lang()==="en";
   input.placeholder=en?"E.g. icons, Microsoft, Fabric, HOST…":"Np. ikony, Microsoft, Fabric, HOST…";
   const names={ikony:en?"Icons":"Ikony",Microsoft:"Microsoft",shadery:en?"Shaders":"Shadery",HOST:"HOST"};
   shortcuts.forEach(el=>{const value=el.dataset.guideQuery; if(value in names&&el.textContent!==names[value])el.textContent=names[value]});
   search();
 }
 function syncToc(){
   const current=location.hash||"#instalacja";
   for(const link of toc){
     if(link.getAttribute("href")===current)link.setAttribute("aria-current","true");
     else link.removeAttribute("aria-current");
   }
 }
 input.addEventListener("input",search);
 shortcuts.forEach(button=>button.addEventListener("click",()=>{
   input.value=button.dataset.guideQuery||"";
   search();
   input.focus();
   input.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
 }));
 document.addEventListener("keydown",event=>{
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
     event.preventDefault();input.focus();input.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});
   }
   if(event.key==="Escape"&&document.activeElement===input){
     input.value="";search();input.blur();
   }
 });
 document.addEventListener("minevora:languagechange",updateLang);
 window.addEventListener("hashchange",syncToc);
 const query=new URLSearchParams(location.search).get("q");
 if(query)input.value=query.slice(0,120);
 syncToc();
 updateLang();
})();
