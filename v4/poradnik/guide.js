/* Optional progressive enhancement. Full guide is already in static HTML. */
(()=>{"use strict";
 const input=document.getElementById("guideSearch");
 const results=document.getElementById("searchResults");
 const details=[...document.querySelectorAll(".guide-faq details")];
 if(!input||!results)return;
 const clean=s=>String(s||"").toLocaleLowerCase("pl").trim();
 function filter(){
   const q=clean(input.value);
   let found=0;
   details.forEach(d=>{
     const hay=clean(d.textContent)+" "+clean(d.dataset.keywords);
     const match=!q||hay.includes(q);
     d.hidden=!match;
     if(match)found++;
     if(q&&match)d.open=true;
     else if(!q)d.open=false;
   });
   results.textContent=q?(found?"Znaleziono odpowiedzi: "+found:"Brak wyników. Spróbuj innego hasła lub kodu błędu."):"Szukaj w FAQ — wpisz opis problemu albo kod błędu.";
 }
 input.addEventListener("input",filter);
 document.addEventListener("keydown",event=>{
   if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"){
     event.preventDefault();
     input.focus();
     input.scrollIntoView({behavior:"smooth",block:"center"});
   }
   if(event.key==="Escape"&&document.activeElement===input){
     input.value="";
     filter();
     input.blur();
   }
 });
 const param=new URLSearchParams(location.search).get("q");
 if(param){input.value=param;filter()}
 else filter();
})();
