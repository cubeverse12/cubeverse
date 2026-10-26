(()=>{'use strict';
const routes={home:"STRONA GŁÓWNA",odkrywaj:"O PROJEKCIE",sklep:"SKLEP · WKRÓTCE",minigames:"MINIGRY",pvp:"PVP MODE",rankings:"RANKINGI",account:"MOJE KONTO",poradnik:"PORADNIK",podglad:"PODGLĄD LAUNCHERA",download:"POBIERANIE"};
const views=[...document.querySelectorAll('[data-view]')];
function navigate(){const name=Object.hasOwn(routes,location.hash.slice(1))?location.hash.slice(1):'home';
  for(const v of views)v.hidden=v.dataset.view!==name;
  for(const a of document.querySelectorAll('[data-route]')){const on=a.dataset.route===name;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  document.getElementById('sectionName').textContent=routes[name];
  document.title='MINEVORA — '+routes[name];
  window.scrollTo({top:0,behavior:'instant'});
  if(name==="account") {const profile=document.getElementById("playerProfile"); if(profile && !profile.hidden) profile.scrollIntoView({behavior:"auto",block:"start"});}
}
window.addEventListener('hashchange',navigate);document.getElementById('backBtn').addEventListener('click',()=>location.hash='home');
navigate();
document.querySelectorAll('a[href="#account"]').forEach(a=>a.addEventListener('click',()=>{
  // Do not rely solely on hashchange: clicking the currently selected page
  // must always re-open the profile view and focus its content.
  location.hash='account';
  navigate();
}));
let toastTimer;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4200)}
function safeGet(key,defaultValue){try{const v=localStorage.getItem(key);return v?JSON.parse(v):defaultValue}catch(e){return defaultValue}}
function safeSet(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
})();