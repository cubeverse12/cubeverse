(() => {
'use strict';
let current='home',modsLoaded=false;
const available=new Set(['home','skins','mods','downloads','help']);
function switchPage(page){
 if(!available.has(page))page='home';current=page;
 for(const id of available)document.getElementById(id+'Screen').hidden=id!==page;
 document.querySelectorAll('[data-nav]').forEach(b=>{
  const active=b.dataset.nav===page;b.classList.toggle('active',active);
  if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 if(page==='mods'&&!modsLoaded){modsLoaded=true;window.MinevoraMods.request();}
 document.querySelector('main').scrollTop=0;
 try{history.replaceState(null,'','#'+page)}catch(_){}
}
function boot(){
 try{window.MinevoraSkin.boot();}catch(e){console.error('Skin Studio',e);}
 try{window.MinevoraMods.boot();}catch(e){console.error('Modrinth',e);}
 document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.nav)));
 document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>switchPage(b.dataset.go)));
 document.getElementById('navMods').addEventListener('click',()=>switchPage('mods'));
 document.getElementById('navSkins').addEventListener('click',()=>switchPage('skins'));
 document.getElementById('themeToggle').addEventListener('click',()=>{
  document.body.classList.toggle('warm');
  document.getElementById('themeToggle').textContent=document.body.classList.contains('warm')?'☀':'☾';
 });
 const copyHash=document.getElementById('copyHash');
 if(copyHash)copyHash.addEventListener('click',async()=>{
  const hash=document.getElementById('releaseHash').textContent;
  try{await navigator.clipboard.writeText(hash);copyHash.textContent='Skopiowano!';}
  catch(_){copyHash.textContent='Zaznacz i skopiuj sumę';}
 });
 const query=new URLSearchParams(location.search);
 switchPage(query.get('view')||location.hash.slice(1)||'home');
 if(query.has('embedded'))document.body.classList.add('embedded');
 window.addEventListener('hashchange',()=>switchPage(location.hash.slice(1)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
