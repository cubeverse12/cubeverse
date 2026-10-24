(()=>{'use strict';
const routes={home:"STRONA GŁÓWNA",play:"GRAJ",minigames:"MINIGRY",marketplace:"MARKETPLACE",download:"POBIERANIE"};
const views=[...document.querySelectorAll('[data-view]')];
function navigate(){const name=Object.hasOwn(routes,location.hash.slice(1))?location.hash.slice(1):'home';
  for(const v of views)v.hidden=v.dataset.view!==name;
  for(const a of document.querySelectorAll('[data-route]')){const on=a.dataset.route===name;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  document.getElementById('sectionName').textContent=routes[name];
  document.title='MINEVORA — '+routes[name];
  window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',navigate);document.getElementById('backBtn').addEventListener('click',()=>location.hash='home');
navigate();
let toastTimer;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4200)}
function safeGet(key,defaultValue){try{const v=localStorage.getItem(key);return v?JSON.parse(v):defaultValue}catch(e){return defaultValue}}
function safeSet(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
const goods=[
  {name:'Zamek Fantasy',cat:'budowle',icon:'🏰',cost:'150 MVC',desc:'Przykładowa budowla Minecraft'},
  {name:'Wyspa przygód',cat:'mapy',icon:'🗺️',cost:'BEZPŁATNE',desc:'Przykładowa mapa eksploracyjna'},
  {name:'PvP Arena',cat:'mapy',icon:'⚔️',cost:'90 MVC',desc:'Projekt mapy do pojedynków'},
  {name:'Economy',cat:'pluginy',icon:'⚙️',cost:'250 MVC',desc:'Przykładowy plugin serwerowy'},
  {name:'Custom Blocks',cat:'mody',icon:'🧱',cost:'BEZPŁATNE',desc:'Projekt niestandardowych bloków'}
];
const shopGrid=document.getElementById('shopGrid'),shopSearch=document.getElementById('shopSearch'),shopFilter=document.getElementById('shopFilter');
function renderShop(){shopGrid.replaceChildren();const phrase=shopSearch.value.toLocaleLowerCase('pl'),cat=shopFilter.value;
  const filtered=goods.filter(p=>(cat==='all'||cat===p.cat)&&(p.name.toLocaleLowerCase('pl').includes(phrase)||p.desc.toLocaleLowerCase('pl').includes(phrase)));
  filtered.forEach(p=>{const article=document.createElement('article');const ico=document.createElement('span'),h=document.createElement('strong'),small=document.createElement('small'),description=document.createElement('p');
    ico.textContent=p.icon;h.textContent=p.name;small.textContent=p.cost+' • DEMO';description.textContent=p.desc;
    article.append(ico,h,description,small);shopGrid.append(article)});
  if(!filtered.length){const empty=document.createElement('p');empty.className='subtext';empty.textContent='Brak produktów pasujących do wyszukiwania.';shopGrid.append(empty)}
}
shopSearch.addEventListener('input',renderShop);shopFilter.addEventListener('change',renderShop);renderShop();
})();