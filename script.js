'use strict';
const toggle=document.querySelector('#menu-toggle');
const nav=document.querySelector('#site-nav');
function closeMenu(){nav?.classList.remove('open');toggle?.setAttribute('aria-expanded','false');}
toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const links=[...(nav?.querySelectorAll('a')||[])];
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){links.forEach(a=>{const active=a.getAttribute('href')==='#'+entry.target.id;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}}},{rootMargin:'-18% 0px -72% 0px'});document.querySelectorAll('main section[id]').forEach(s=>observer.observe(s));}
const views={
  Graj:{title:'Uruchom Minecraft Java',subtitle:'Wybierz wersję, loader i profil.',tags:['Vanilla','Fabric','Forge','NeoForge','Quilt'],status:'Oficjalne logowanie Microsoft wymagane'},
  Mody:{title:'Mody i dodatki',subtitle:'Dodawaj lokalne pliki JAR.',tags:['Import JAR','Loader','Wersja gry'],status:'Podstawowa kontrola zgodności'},
  PvP:{title:'PvP Mode',subtitle:'Interfejs walki i statystyki.',tags:['HUD','Klawiatura','Efekty'],status:'W przygotowaniu'},
  'Społeczność':{title:'Społeczność',subtitle:'Discord i ogłoszenia MINEVORA.',tags:['Discord','Nowości'],status:'Zaproszenie dostępne na stronie'},
  'Więcej':{title:'Więcej możliwości',subtitle:'Diagnostyka, profil i ustawienia.',tags:['Java','Microsoft','Diagnostyka'],status:'Wybrane funkcje dostępne'}
};
const display=document.querySelector('#preview-screen');
const original=display?.innerHTML;
for(const tab of document.querySelectorAll('[data-preview]')){
  tab.addEventListener('click',()=>{
    const page=tab.dataset.preview;
    for(const t of document.querySelectorAll('[data-preview]')){const active=t===tab;t.classList.toggle('current',active);t.setAttribute('aria-pressed',String(active));}
    if(page==='Start'){display.innerHTML=original;return;}
    const view=views[page];if(!view)return;
    display.replaceChildren();
    const eyebrow=document.createElement('div');eyebrow.className='preview-kicker';eyebrow.textContent='MINEVORA / '+page.toUpperCase();
    const box=document.createElement('div');box.className='preview-content-card';
    const title=document.createElement('h3');title.textContent=view.title;
    const para=document.createElement('p');para.textContent=view.subtitle;
    const status=document.createElement('p');status.className='preview-copy';status.textContent='● '+view.status;
    const tags=document.createElement('div');tags.className='preview-content-tags';
    for(const name of view.tags){const chip=document.createElement('span');chip.textContent=name;tags.append(chip);}
    box.append(title,para,tags,status);display.append(eyebrow,box);
  });
}
