(()=>{'use strict';
const routes={home:"STRONA GŁÓWNA",versions:"GRAJ / WERSJE",installations:"INSTALACJE",minigames:"MINIGRY",marketplace:"MARKETPLACE",launcherAccount:"MOJE KONTO",skins:"SKÓRKI",settings:"USTAWIENIA",discord:"DISCORD",download:"POBIERANIE"};
const views=[...document.querySelectorAll('[data-view]')];
function navigate(){const name=Object.hasOwn(routes,location.hash.slice(1))?location.hash.slice(1):'home';
  for(const v of views)v.hidden=v.dataset.view!==name;
  for(const a of document.querySelectorAll('[data-route]')){const on=a.dataset.route===name;a.classList.toggle('active',on);if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')}
  document.getElementById('sectionName').textContent=routes[name];
  document.getElementById('homeExtra').hidden=name!=='home';document.title='MINEVORA — '+routes[name];
  if(name==='skins')document.getElementById('characterStage').setAttribute('aria-label','Obracana postać Minecraft 3D z animacjami. Użyj myszki lub strzałek.');
  window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',navigate);document.getElementById('backBtn').addEventListener('click',()=>location.hash='home');
navigate();
let toastTimer;function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4200)}
function safeGet(key,defaultValue){try{const v=localStorage.getItem(key);return v?JSON.parse(v):defaultValue}catch(e){return defaultValue}}
function safeSet(key,v){try{localStorage.setItem(key,JSON.stringify(v))}catch(e){}}
let profiles=safeGet('minevora_ref_profiles',[{name:'MINEVORA',version:'1.21.4',loader:'Fabric'},{name:'Vanilla',version:'1.21.1',loader:'Vanilla'}]);
if(!Array.isArray(profiles))profiles=[];
profiles=profiles.filter(p=>p&&typeof p.name==='string'&&typeof p.version==='string'&&typeof p.loader==='string').slice(0,30);
const profileList=document.getElementById('profileList'),chooseProfile=document.getElementById('gameProfile');
function updateProfiles(){profileList.replaceChildren();chooseProfile.replaceChildren();
  if(!profiles.length){const n=document.createElement('p');n.className='subtext';n.textContent='Nie masz jeszcze profili. Utwórz pierwszą instalację poniżej.';profileList.append(n)}
  for(const [i,p] of profiles.entries()){
    const row=document.createElement('div');row.className='profile-item';
    const info=document.createElement('div'),title=document.createElement('b'),meta=document.createElement('p');
    title.textContent=p.name;meta.textContent='Minecraft '+p.version+' • '+p.loader+' — demonstracja';
    info.append(title,meta);const remove=document.createElement('button');remove.type='button';remove.textContent='Usuń';remove.setAttribute('aria-label','Usuń '+p.name);
    remove.addEventListener('click',()=>{profiles.splice(i,1);safeSet('minevora_ref_profiles',profiles);updateProfiles()});
    row.append(info,remove);profileList.append(row);
    const opt=document.createElement('option');opt.value=String(i);opt.textContent=p.name;chooseProfile.append(opt);
  }
}
updateProfiles();
document.getElementById('createProfile').addEventListener('click',()=>{
  if(profiles.length>=30){toast('Limit podglądu: 30 profili. Usuń poprzedni profil.');return}
  const name=document.getElementById('newProfileName').value.trim()||'Moja instalacja';
  profiles.push({name,version:document.getElementById('newProfileVersion').value,loader:document.getElementById('newProfileLoader').value});
  safeSet('minevora_ref_profiles',profiles);updateProfiles();chooseProfile.value=String(profiles.length-1);
  document.getElementById('newProfileName').value='';toast('Profil zapisany w tej przeglądarce — to nie jest instalacja gry.');
});
const gameVersion=document.getElementById('gameVersion'),gameLoader=document.getElementById('gameLoader'),tabVersion=document.getElementById('tabVersion'),tabLoader=document.getElementById('tabLoader');
const selectors=[gameVersion,gameLoader,tabVersion,tabLoader];
function updateSummary(){document.getElementById('profileSummary').textContent='Minecraft Java '+tabVersion.value+' • '+tabLoader.value+' — przykład'}
function syncSelectors(changed){
  const isVersion=changed===gameVersion||changed===tabVersion;
  (isVersion?[gameVersion,tabVersion]:[gameLoader,tabLoader]).forEach(el=>{if(el!==changed)el.value=changed.value});
  if(document.getElementById('rememberVersion').checked)safeSet('minevora_ref_choices',{version:gameVersion.value,loader:gameLoader.value});
  updateSummary()
}
selectors.forEach(el=>el.addEventListener('change',()=>syncSelectors(el)));
const choices=safeGet('minevora_ref_choices',null);
if(choices&&typeof choices.version==='string'&&[...gameVersion.options].some(o=>o.value===choices.version)){gameVersion.value=choices.version;tabVersion.value=choices.version}
if(choices&&typeof choices.loader==='string'&&[...gameLoader.options].some(o=>o.value===choices.loader)){gameLoader.value=choices.loader;tabLoader.value=choices.loader}
updateSummary();
document.getElementById('rememberVersion').addEventListener('change',e=>{if(e.target.checked)safeSet('minevora_ref_choices',{version:gameVersion.value,loader:gameLoader.value});else try{localStorage.removeItem('minevora_ref_choices')}catch(e){}});
chooseProfile.addEventListener('change',()=>{const p=profiles[+chooseProfile.value];if(!p)return;
  for(const el of [gameVersion,tabVersion]){if([...el.options].some(o=>o.value===p.version))el.value=p.version}
  for(const el of [gameLoader,tabLoader]){if([...el.options].some(o=>o.value===p.loader))el.value=p.loader}
  updateSummary();
});
function playDemo(){location.hash='versions';document.getElementById('playInfo').textContent='MINEVORA WWW to podgląd. Aby uruchomić Minecraft Java, potrzebujesz działającej aplikacji Windows.';toast('Podgląd WWW: nie można uruchomić Minecrafta w przeglądarce.')}
document.getElementById('playBtn').addEventListener('click',playDemo);document.getElementById('tabPlay').addEventListener('click',playDemo);
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
const stage=document.getElementById('characterStage'),model=document.getElementById('avatarModel');
const skinFilters=['none','hue-rotate(75deg)','hue-rotate(180deg)','hue-rotate(260deg)'];
document.querySelectorAll('[data-skin]').forEach(b=>b.addEventListener('click',()=>{
  const i=Number(b.dataset.skin);model.style.filter=skinFilters[i]||'none';
  document.querySelectorAll('[data-skin]').forEach(other=>other.classList.toggle('picked',other===b));
  toast(i===0?'Wybrano oryginalną skórkę demonstracyjną.':'To jedynie wariant kolorów podglądu, nie nowa zapisana skórka.');
}));
document.getElementById('addSkinButton').addEventListener('click',()=>{location.hash='skins';toast('Własne pliki PNG będzie można dodać w aplikacji Windows.')});
document.getElementById('animationsBtn').addEventListener('click',()=>{location.hash='skins';toast('Wybierz animację w zakładce Skórki.')});
document.getElementById('threeDBtn').addEventListener('click',()=>{stage.focus();toast('Przeciągnij postać myszką lub użyj strzałek ← →.')});
document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>{
  stage.dataset.motion=b.dataset.motion;document.querySelectorAll('[data-motion]').forEach(other=>other.setAttribute('aria-pressed',other===b?'true':'false'));
}));
const effectCheck=document.getElementById('effectCheck'),motionCheck=document.getElementById('motionCheck');
const setting=safeGet('minevora_ref_settings',{glow:true,motion:true});
if(setting&&typeof setting==='object'){effectCheck.checked=setting.glow!==false;motionCheck.checked=setting.motion!==false}
function applySettings(){document.body.classList.toggle('no-glow',!effectCheck.checked);document.body.classList.toggle('no-motion',!motionCheck.checked);
  if(document.getElementById('rememberSettings').checked)safeSet('minevora_ref_settings',{glow:effectCheck.checked,motion:motionCheck.checked})}
effectCheck.addEventListener('change',applySettings);motionCheck.addEventListener('change',applySettings);applySettings();
})();