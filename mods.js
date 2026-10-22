(() => {
'use strict';
const API='https://api.modrinth.com/v2/search';
let type='mod',page=0,total=0,limit=20,searchTimer=null,requestId=0;
const el=id=>document.getElementById(id);
const featured=el('featuredMods'),list=el('modList');
const samples=[
 {title:'Fabric API',slug:'fabric-api',author:'modmuss50',description:'Biblioteka interfejsów API dla modów Fabric.',downloads:null,icon_url:null},
 {title:'Sodium',slug:'sodium',author:'CaffeineMC',description:'Mod optymalizujący wydajność renderowania Minecrafta.',downloads:null,icon_url:null},
 {title:'Iris Shaders',slug:'iris',author:'coderbot',description:'Obsługa shaderów w Minecraft Java Edition.',downloads:null,icon_url:null},
 {title:'Entity Culling',slug:'entityculling',author:'tr7zw',description:'Optymalizacja renderowania niewidocznych obiektów.',downloads:null,icon_url:null},
 {title:'Mod Menu',slug:'modmenu',author:'Prospector',description:'Wygodne menu zainstalowanych modów.',downloads:null,icon_url:null},
 {title:'Cloth Config API',slug:'cloth-config',author:'shedaniel',description:'Biblioteka ekranów ustawień modów.',downloads:null,icon_url:null}
];
function fmtNum(n){return Number.isFinite(n)?new Intl.NumberFormat('pl-PL',{notation:'compact',maximumFractionDigits:1}).format(n):'—'}
function safeUrl(url,fallback){try{let u=new URL(url);if(u.protocol==='https:'||u.protocol==='http:')return u.href}catch(_){ }return fallback;}
function linkFor(item){let slug=encodeURIComponent(String(item.slug||item.project_id||''));return `https://modrinth.com/${type}/${slug}`;}
function iconFor(item){let img=document.createElement(item.icon_url?'img':'div');img.className='mod-icon'+(item.icon_url?'':' fallback');if(item.icon_url){img.src=safeUrl(item.icon_url,'');img.alt='';img.loading='lazy';img.onerror=()=>{img.replaceWith(Object.assign(document.createElement('div'),{className:'mod-icon fallback',textContent:'⬡'}))};}else img.textContent='⬡';return img;}
function installButton(item){let b=document.createElement('button');b.className='mod-download';b.textContent='↧  POBIERZ';b.title='Otwórz projekt na Modrinth, aby wybrać wersję i pobrać plik';b.addEventListener('click',()=>{window.open(linkFor(item),'_blank','noopener,noreferrer');});return b;}
function createCard(item,small=false){let wrap=document.createElement('article');wrap.className=small?'featured-mod':'mod-card';
 if(small){let header=document.createElement('div');header.className='featured-head';header.appendChild(iconFor(item));let cap=document.createElement('div');cap.style.minWidth='0';let name=document.createElement('div');name.className='mod-title';name.textContent=item.title;cap.append(name);let d=document.createElement('p');d.textContent=item.description||'';cap.append(d);header.append(cap);wrap.append(header,installButton(item));return wrap;}
 wrap.append(iconFor(item));let info=document.createElement('div');info.className='mod-body';let a=document.createElement('a');a.className='mod-name';a.href=linkFor(item);a.target='_blank';a.rel='noopener noreferrer';a.textContent=item.title;
 const by=document.createElement('span');by.className='mod-author';by.textContent='  by '+(item.author||'Modrinth');a.append(by);info.append(a);
 const d=document.createElement('div');d.className='mod-desc';d.textContent=item.description||'Projekt Modrinth';info.append(d);
 let meta=document.createElement('div');meta.className='mod-meta';meta.textContent='↧ '+(item.downloads==null?'—':fmtNum(item.downloads)+' pobrań')+'    ♡ '+(item.follows==null?'—':fmtNum(item.follows)+' obserwujących');info.append(meta);
 wrap.append(info,installButton(item));return wrap;}
function render(items,shownFallback){featured.replaceChildren();list.replaceChildren();if(!items.length){list.innerHTML='<div class="loading-state">Brak wyników — zmień zapytanie lub filtry.</div>';return;}
 items.slice(0,4).forEach(i=>featured.append(createCard(i,true)));items.forEach(i=>list.append(createCard(i,false)));
 if(shownFallback){let info=document.createElement('p');info.className='error-state';info.textContent='Podgląd przykładowych projektów — katalog Modrinth jest chwilowo niedostępny. Przyciski otwierają strony projektów w serwisie Modrinth.';list.prepend(info);}
}
function facets(){let arr=[['project_type:'+type]];let v=el('modVersion').value;if(v)arr.push(['versions:'+v]);let loaders=[...document.querySelectorAll('.loader:checked')].map(c=>'categories:'+c.value);if(loaders.length)arr.push(loaders);let cats=[...document.querySelectorAll('.category:checked')].map(c=>'categories:'+c.value);if(cats.length)arr.push(cats);return arr;}
async function request(){let token=++requestId,query=el('modSearch').value.trim();el('modCounter').textContent='Ładowanie…';featured.innerHTML='<span class="loading-state">Wyszukiwanie…</span>';list.replaceChildren();
 const params=new URLSearchParams({query,facets:JSON.stringify(facets()),index:el('modSort').value,limit:String(limit),offset:String(page*limit)});
 try{let abort=new AbortController();let timer=setTimeout(()=>abort.abort(),9000);let r;try{r=await fetch(API+'?'+params,{signal:abort.signal,headers:{Accept:'application/json'}})}finally{clearTimeout(timer)};
 if(!r.ok)throw Error('Modrinth API: '+r.status);let data=await r.json();if(token!==requestId)return;
 total=data.total||0;el('modCounter').textContent=`${new Intl.NumberFormat('pl-PL').format(total)} wyników`;el('pageIndicator').textContent=`${page+1} / ${Math.max(1,Math.ceil(total/limit))}`;el('prevPage').disabled=page===0;el('nextPage').disabled=(page+1)*limit>=total;render(data.hits||[],false);
 }catch(e){if(token!==requestId)return;total=0;el('modCounter').textContent='Brak połączenia z Modrinth';el('pageIndicator').textContent='Podgląd';el('prevPage').disabled=true;el('nextPage').disabled=true;let filtered=samples.filter(s=>(s.title+' '+s.description).toLowerCase().includes(query.toLowerCase()));render(filtered.length?filtered:query?[]:samples,true);}
}
function reset(){page=0;request()}
function boot(){document.querySelectorAll('[data-type]').forEach(b=>b.addEventListener('click',()=>{type=b.dataset.type;document.querySelectorAll('[data-type]').forEach(c=>c.classList.toggle('active',c===b));reset()}));
 el('modSearch').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(reset,360)});
 for(let id of ['modVersion','modSort','modLimit'])el(id).addEventListener('change',()=>{limit=Number(el('modLimit').value);reset()});
 document.querySelectorAll('.loader,.category').forEach(b=>b.addEventListener('change',reset));
 el('clearFilters').addEventListener('click',()=>{el('modVersion').value='';document.querySelectorAll('.loader,.category').forEach(i=>i.checked=false);reset()});
 el('prevPage').addEventListener('click',()=>{if(page>0){page--;request()}});
 el('nextPage').addEventListener('click',()=>{if((page+1)*limit<total){page++;request()}});
 // Populate immediately with a clearly marked sample while fetching live data.
 render(samples,true);el('modCounter').textContent='Katalog Modrinth';
 }
window.MinevoraMods={boot,request};
})();
