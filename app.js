(() => {
 'use strict';
 const pages=['home','installations','marketplace','download','features','help'];
 const titles={home:'ODKRYWAJ',installations:'INSTALACJE',marketplace:'MARKETPLACE',download:'POBIERANIE',features:'FUNKCJE',help:'POMOC'};
 function openPage(page){
  if(!pages.includes(page))page='home';
  for(const id of pages){document.getElementById(id+'Screen').hidden=id!==page;}
  document.querySelectorAll('[data-link]').forEach(link=>{
   const active=link.dataset.link===page;link.classList.toggle('active',active);
   if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  });
  document.getElementById('locationLabel').textContent=titles[page];
  document.getElementById('webStatus').textContent=page==='download'?'Pobieranie MINEVORA 18.3.3':page==='home'?'Strona gotowa do przeglądania':titles[page];
  window.scrollTo({top:0,behavior:'instant'});
 }
 window.addEventListener('hashchange',()=>openPage(location.hash.slice(1)));
 openPage(location.hash.slice(1));
 document.getElementById('copyHash')?.addEventListener('click',async e=>{
  const hash=document.getElementById('releaseHash').textContent.trim();
  try{await navigator.clipboard.writeText(hash);e.currentTarget.textContent='Skopiowano!'}
  catch(err){e.currentTarget.textContent='Zaznacz kod powyżej';}
 });
})();
