'use strict';
const nav=document.querySelector('#mainNav');
const menu=document.querySelector('#menuBtn');
function closeMenu(){nav?.classList.remove('open');menu?.setAttribute('aria-expanded','false');}
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu();});
const sections=[...(document.querySelectorAll('main section[id]'))],links=[...(nav?.querySelectorAll('a')||[])];
if('IntersectionObserver' in window){const obs=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>{const ok=a.getAttribute('href')==='#'+e.target.id;a.classList.toggle('active',ok);if(ok)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});}});},{rootMargin:'-15% 0px -70% 0px'});sections.forEach(s=>obs.observe(s));}
const screens={
 Graj:['Uruchom Minecraft Java','Wersja gry, loader i zapisany profil.',['Vanilla','Fabric','Forge','Quilt'],'Konto Microsoft i Java sprawdzane w aplikacji'],
 Mody:['Mody i dodatki','Biblioteka lokalnych plików JAR.',['Import JAR','Profil','Loader'],'Podstawowa kontrola zgodności'],
 PvP:['PvP Mode','Personalizacja ustawień HUD.',['HUD','Efekty','Klawisze'],'Integracja z Minecraftem w przygotowaniu'],
 'Społeczność':['Społeczność','Discord i informacje o projekcie.',['Discord','Ogłoszenia'],'Zaproszenie dostępne na stronie'],
 'Więcej':['Dodatkowe funkcje','Profile, statystyki, Skin Studio 2D i diagnostyka.',['Skin Studio 2D','Profile','Statystyki'],'Minigry, Together i Marketplace w przygotowaniu']
};
const display=document.querySelector('#appMain'),original=display?.innerHTML;
document.querySelectorAll('[data-tab]').forEach(b=>b.addEventListener('click',()=>{
document.querySelectorAll('[data-tab]').forEach(x=>{const active=x===b;x.classList.toggle('sel',active);x.setAttribute('aria-pressed',String(active));});
if(!display)return;
const name=b.dataset.tab;
if(name==='Start'){display.innerHTML=original;return;}
const info=screens[name];if(!info)return;
display.replaceChildren();
const kicker=document.createElement('p');kicker.className='app-kicker';kicker.textContent='✦ MINEVORA / '+name.toUpperCase();
const title=document.createElement('h2');title.textContent=info[0];
const p=document.createElement('p');p.textContent=info[1];
const chips=document.createElement('div');chips.className='pills';info[2].forEach(s=>{const sp=document.createElement('span');sp.textContent=s;chips.append(sp);});
const state=document.createElement('p');state.className='app-kicker';state.textContent='● '+info[3];
display.append(kicker,title,p,chips,state);
}));