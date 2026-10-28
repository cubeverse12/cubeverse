/* MINEVORA 4.1 — standalone navigation, image handling, search and mobile menu.
   Does not require any of the older site-refresh scripts. */
(()=>{"use strict";
const A="../assets/";
const releases="https://github.com/cubeverse12/minevora-launcher/releases/tag/v18.3.4";
const discord="https://discord.gg/M2fZVJBCqh";
const $=(s,root=document)=>root.querySelector(s);
const $$=(s,root=document)=>[...root.querySelectorAll(s)];
const path=(s)=>A+s;
const fallback="site-refresh/guide-install.svg";
const entry=(title,image,desc,alt)=>({title,image,desc,alt:alt||title});
const data={
 wersje:{label:"Wersje i profile",intro:"Wybieraj profile gry Minecraft Java i poznaj obsługiwane typy instalacji.",heading:"Wersje Minecrafta w jednym miejscu",description:"Podgląd konfiguracji: Minecraft Java, Vanilla, Fabric, Forge, NeoForge i Quilt. Rzeczywistą instalację oraz wybór zgodnego loadera wykonuje się w launcherze Windows.",state:"Funkcja aplikacji Windows",hero:entry("Panel wersji","site-refresh/settings-profiles.svg","Profile Minecrafta"),gallery:[
 entry("Profile Minecrafta","site-refresh/settings-profiles.svg","Poglądowa lista wersji i konfiguracji."),
 entry("Uruchomienie aplikacji","launcher-18-3-16/launcher-preview.webp","Wygląd launchera MINEVORA na Windows."),
 entry("Instrukcja instalacji","site-refresh/guide-install.svg","Jak przygotować launcher do gry.")
 ]},
 mody:{label:"Mody i dodatki",intro:"Katalog dodatków i personalizacji gry Minecraft Java.",heading:"Organizuj swoje mody",description:"Podgląd biblioteki modów, dodatków i profili. Instalacja konkretnych modów jest możliwa wyłącznie wtedy, gdy są zgodne z daną wersją gry i typem loadera.",state:"Zależne od zgodności",hero:entry("Katalog modów","site-refresh/mod-catalog.svg","Interfejs biblioteki modów"),gallery:[
 entry("Biblioteka dodatków","site-refresh/mod-catalog.svg","Kategorie dodatków, rozszerzeń i HUD."),
 entry("Wybór profilu","site-refresh/settings-profiles.svg","Zainstalowane wersje i typy Minecrafta."),
 entry("Poradnik instalacji","site-refresh/guide-install.svg","Kroki przygotowania gry.")
 ]},
 minigry:{label:"Minigry",intro:"Poznaj zaplanowane rozgrywki serwera MINEVORA.",heading:"Odkrywaj światy i areny",description:"BedWars, SkyWars, TNT Run, Parkour, Build Battle, Spleef, Duels i Crystal PvP. Są to wizualizacje planowanych trybów. Dostępność na serwerze będzie ogłaszana osobno.",state:"Serwer w przygotowaniu",hero:entry("Świat minigier","launcher-316/minigry.webp","Wizualizacja wysp"),action:{label:"Społeczność Discord",url:discord,external:true},gallery:[
 entry("BedWars","launcher-316/bedwars.webp","Zespołowa obrona łóżka."),
 entry("SkyWars","launcher-316/skywars.webp","Pojedynki na latających wyspach."),
 entry("TNT Run","launcher-316/tnt-run.webp","Bieg po znikających blokach."),
 entry("Parkour","launcher-316/parkour.webp","Tory przeszkód i skoków."),
 entry("Build Battle","launcher-316/build-battle.webp","Budowanie na zadany temat."),
 entry("Spleef","launcher-316/spleef.webp","Utrzymaj się na arenie."),
 entry("Duels","launcher-316/duels.webp","Pojedynki jeden na jednego."),
 entry("Crystal PvP","launcher-316/crystal-pvp.webp","Arena walki w stylu Crystal PvP.")
 ]},
 pvp:{label:"PvP Mode",intro:"Pojedynki, ustawienia HUD i prezentacja aren PvP MINEVORA.",heading:"Walka, która pasuje do Ciebie",description:"Przegląd PvP Mode. Działanie HUD wymaga zgodnej wersji moda i gry. Karty przedstawiają projektowane możliwości; nie są aktywnymi ustawieniami na stronie WWW.",state:"Mod wymaga zgodności",hero:entry("Podgląd PvP Mode","launcher-18-3-16/feature-pvp.webp","Ekran trybów PvP w launcherze"),gallery:[
 entry("PvP HUD","site-refresh/guide-pvp-hud.svg","Poglądowa konfiguracja interfejsu walki."),
 entry("Crystal PvP","launcher-316/crystal-pvp.webp","Arena Crystal PvP."),
 entry("Duels","launcher-316/duels.webp","Arena pojedynków.")
 ]},
 ranking:{label:"Rankingi",intro:"Rangi, postęp, punkty i wizualizacje awansu graczy.",heading:"Droga do wyższej rangi",description:"Podgląd systemu rang i statystyk. Prezentowane ekrany i wartości są demonstracyjne, ponieważ strona nie pobiera na żywo wyników z serwera.",state:"Podgląd demonstracyjny",hero:entry("Ranking graczy","guide/rankingi.webp","Interfejs rankingów"),gallery:[
 entry("Ranga gracza","guide/rankingi.webp","Podgląd profilu i postępu."),
 entry("Animacja awansu","guide/awans.webp","Wizualizacja nowej rangi."),
 entry("Arena rankingowa","launcher-316/rankingi.webp","Wizualizacja przestrzeni rankingowej.")
 ]},
 sklep:{label:"Sklep i marketplace",intro:"Przestrzeń dla map, budowli, dodatków i twórców MINEVORA.",heading:"Mapy, dodatki, projekty",description:"Marketplace jest koncepcją w przygotowaniu. Elementy są ilustracjami poglądowymi — na tej stronie nie można obecnie kupować ani sprzedawać produktów.",state:"W przygotowaniu",hero:entry("Marketplace","site-refresh/marketplace.svg","Kategorie marketplace"),gallery:[
 entry("Mapy i budowle","site-refresh/marketplace.svg","Projekty do odkrywania."),
 entry("Mody i dodatki","site-refresh/mod-catalog.svg","Rozszerzenia do Minecrafta."),
 entry("Skórki graczy","site-refresh/skin-gallery.svg","Pomysły na wygląd postaci.")
 ]},
 studio:{label:"Skin Studio",intro:"Podgląd projektu edytora skinów Minecraft 3D w launcherze Windows.",heading:"Stwórz własną postać",description:"W projekcie Skin Studio: model 3D, warstwy, kolory oraz import i eksport PNG. Strona pokazuje wygląd funkcji, ale nie udostępnia edytora w przeglądarce.",state:"Funkcja launchera",hero:entry("Edytor skinów","guide/skin-studio-plus-2-8.jpg","Ekran projektu Skin Studio"),gallery:[
 entry("Model postaci 3D","site-refresh/skin-editor.svg","Podgląd narzędzi i kolorów."),
 entry("Biblioteka skinów","site-refresh/skin-gallery.svg","Przykłady postaci Minecraft."),
 entry("Skin Studio PLUS","guide/skin-studio-plus-2-8.jpg","Podgląd projektu edytora.")
 ]},
 plus:{label:"MINEVORA PLUS",intro:"Dodatkowe motywy i personalizacja wyglądu launchera.",heading:"Własny styl MINEVORA",description:"PLUS to demonstracja planowanych możliwości, bez aktywnej sprzedaży subskrypcji na tej stronie. Dostępność funkcji zależy od wersji aplikacji.",state:"Wersja demonstracyjna",hero:entry("Motywy PLUS","site-refresh/plus.svg","Podgląd motywów PLUS"),gallery:[
 entry("Motywy kolorystyczne","site-refresh/plus.svg","Nebula, Ocean i Ember — koncepcje."),
 entry("Personalizacja skinów","site-refresh/skin-gallery.svg","Przykładowe warianty postaci.")
 ]},
 opcje:{label:"Ustawienia",intro:"Konfiguracja launchera, profilów, wydajności i motywów.",heading:"Dostosuj MINEVORA",description:"Poniższe grafiki są ilustracjami panelu ustawień aplikacji Windows. Zmiany RAM, wersji i wyglądu zapisuje się w launcherze — nie na tej stronie.",state:"Ustawienia w aplikacji",hero:entry("Panel ustawień","site-refresh/settings-panel.svg","Podgląd ustawień aplikacji"),gallery:[
 entry("Ustawienia aplikacji","site-refresh/settings-panel.svg","Motyw, język i wydajność."),
 entry("Wersje i profile","site-refresh/settings-profiles.svg","Poglądowa konfiguracja instalacji.")
 ]},
 poradnik:{label:"Poradnik",intro:"Pierwsze kroki z MINEVORA — od pobrania do uruchomienia gry.",heading:"Zacznij od instalacji",description:"Otwórz publiczne wydanie, sprawdź wymagania, następnie skonfiguruj profil w aplikacji. Nie wyłączaj zabezpieczeń systemu w celu instalacji niezweryfikowanego oprogramowania.",state:"Instrukcja",hero:entry("Poradnik instalacji","site-refresh/guide-install.svg","Trzy kroki instalacji"),gallery:[
 entry("Instalacja krok po kroku","site-refresh/guide-install.svg","Pobieranie, profil, uruchomienie."),
 entry("Wybór trybu","site-refresh/guide-modes.svg","Poznaj planowane minigry."),
 entry("PvP HUD","site-refresh/guide-pvp-hud.svg","Podgląd konfiguracji interfejsu.")
 ]},
 pobierz:{label:"Pobierz launcher",intro:"Publiczne pliki MINEVORA Launcher dla Windows.",heading:"MINEVORA na komputerze",description:"Weryfikowalne publiczne wydanie na GitHub to 18.3.4 (ZIP). Interfejs pokazany na stronie może pochodzić z nowszej, rozwijanej wersji i nie musi odpowiadać plikowi dostępnym w wydaniu 18.3.4.",state:"Publiczne wydanie 18.3.4",hero:entry("Launcher Windows","launcher-18-3-16/launcher-preview.webp","Przykładowy widok aplikacji"),action:{label:"Otwórz wydanie 18.3.4",url:releases,external:true},gallery:[
 entry("Instalacja","site-refresh/guide-install.svg","Kroki instalacji launchera."),
 entry("Profile","site-refresh/settings-profiles.svg","Przygotowanie Minecraft Java."),
 entry("Skin Studio","guide/skin-studio-plus-2-8.jpg","Podgląd edytora skórek.")
 ]}
};
const routes=["start","wersje","mody","minigry","pvp","ranking","sklep","studio","plus","opcje","poradnik","pobierz"];
const names={start:"Start",...Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.label]))};
const iconLookup={start:"home",wersje:"versions",mody:"default",minigry:"minigames",pvp:"pvp",ranking:"ranking",sklep:"marketplace",studio:"skins",plus:"plus",opcje:"settings",poradnik:"poradnik",pobierz:"download"};
const homeTiles=[
 ["minigry","Minigry","BedWars, SkyWars i więcej","launcher-316/minigry.webp"],
 ["pvp","PvP Mode","Pojedynki i interfejs HUD","launcher-18-3-16/feature-pvp.webp"],
 ["ranking","Rankingi","Rangi i prezentacja awansu","guide/rankingi.webp"],
 ["mody","Mody i dodatki","Katalog modyfikacji Minecrafta","site-refresh/mod-catalog.svg"],
 ["studio","Skin Studio","Podgląd edytora skina 3D","site-refresh/skin-editor.svg"],
 ["sklep","Marketplace","Mapy i dodatki twórców","site-refresh/marketplace.svg"],
 ["plus","MINEVORA PLUS","Motywy i personalizacja","site-refresh/plus.svg"]
];
const content=$("#content"),drawer=$("#drawer"),backdrop=$("#backdrop"),menuButton=$("#menuToggle"),closeButton=$("#drawerClose"),searchInput=$("#siteSearch");
let current="start",searchQuery="",lastFocus=null;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const linkAttrs=(u,external=false)=>'href="'+esc(u)+'"'+(external?' target="_blank" rel="noopener noreferrer"':"");
function image(thing,cls="",eager=false){
 const file=thing.image;
 const fallbackImage=file.startsWith("site-refresh/")?file:
  thing.title.toLowerCase().includes("pvp")?"site-refresh/guide-pvp-hud.svg":
  thing.title.toLowerCase().includes("skin")?"site-refresh/skin-gallery.svg":
  "site-refresh/guide-install.svg";
 return '<img src="'+esc(path(file))+'" data-fallback="'+esc(path(fallbackImage))+'" alt="'+esc(thing.alt||thing.title)+'"'+
 ' width="1050" height="480" loading="'+(eager?"eager":"lazy")+'" decoding="async"'+
 (file.endsWith(".svg")?' class="graphic"':cls?' class="'+esc(cls)+'"':"")+'>';
}
function wireImages(root=content){
 $$("img[data-fallback]",root).forEach(img=>{
  img.addEventListener("error",()=>{
   if(img.dataset.usedFallback)return;
   img.dataset.usedFallback="1";
   img.src=img.dataset.fallback;
   img.classList.add("graphic");
  });
 });
}
function tile(t){
 const [key,title,desc,pic]=t;
 return '<a class="feature-card" href="#'+key+'"><span class="thumb">'+
 image(entry(title,pic,desc))+'</span><span class="feature-card-body"><h3>'+esc(title)+'</h3><p>'+esc(desc)+'</p><span class="go">Odkryj funkcję →</span></span></a>';
}
function galleryCard(e){
 return '<article class="gallery-card"><a class="thumb" '+linkAttrs(path(e.image),true)+' aria-label="Powiększ: '+esc(e.title)+'">'+image(e)+'</a>'+
 '<div class="gallery-desc"><h3>'+esc(e.title)+'</h3><p>'+esc(e.desc)+'</p></div></article>';
}
function routeAction(item){
 const a=item.action||{label:"Sprawdź launcher",url:"#pobierz"};
 return '<a class="btn" '+linkAttrs(a.url,a.external)+'>'+esc(a.label)+'</a>';
}
function page(key){
 const p=data[key];if(!p)return;
 const gallery=p.gallery.map(galleryCard).join("");
 const extra=key==="pobierz"?'<div class="download-notice"><strong>Ważne:</strong> strona WWW jest prezentacją projektu. Uruchamianie Minecrafta, wybór instalacji i logowanie Microsoft działają w aplikacji Windows. Pobieraj tylko pliki z zaufanych źródeł.</div>':"";
 return '<section class="surface" aria-labelledby="page-title"><div class="page-heading"><span class="section-hint">MINEVORA / FUNKCJE</span><h1 id="page-title">'+esc(p.label)+'</h1><p>'+esc(p.intro)+'</p></div>'+
 '<div class="feature-panel"><a class="panel-media" '+linkAttrs(path(p.hero.image),true)+' aria-label="Otwórz obraz: '+esc(p.hero.title)+'">'+image(p.hero,"",true)+'</a>'+
 '<div class="panel-details"><span class="state-tag">'+esc(p.state)+'</span><h2>'+esc(p.heading)+'</h2><p>'+esc(p.description)+'</p>'+routeAction(p)+'</div></div>'+
 extra+'<h2 class="gallery-title">Galeria funkcji</h2><div class="gallery">'+gallery+'</div>'+
 '<div class="footer-actions"><a class="btn secondary" href="#start">Wróć na Start</a><a class="btn subtle" href="#poradnik">Poradnik</a></div>'+
 '<p class="note">Obrazy przedstawiają projekt MINEVORA. Kliknij ilustrację, aby ją powiększyć. Tryby serwera i niektóre funkcje są w przygotowaniu.</p></section>';
}
function home(){
 return '<section class="hero" aria-label="MINEVORA — strona główna">'+
 '<img class="hero-img" src="'+path("website-photos-20261027/home-hero.webp")+'" alt="Fantastyczny świat Minecraft z wyspami MINEVORA" width="1920" height="1020" fetchpriority="high">'+
 '<div class="hero-main"><img src="'+path("minevora_crystal_logo.svg")+'" alt="MINEVORA" width="600" height="200">'+
 '<h1>TWÓJ ŚWIAT. TWOJE ZASADY.</h1><p>Odkrywaj możliwości launchera MINEVORA i przygotuj swój Minecraft Java.</p></div>'+
 '<div class="hero-controls"><div class="selector-group"><label class="select-tile"><span>Wersja Minecraft</span><select id="minecraftVersion" aria-label="Wersja Minecraft">'+
 ['1.21.4','1.21.1','1.20.1'].map(x=>'<option>'+x+'</option>').join("")+'</select></label>'+
 '<label class="select-tile"><span>Typ instalacji</span><select id="minecraftLoader" aria-label="Typ instalacji">'+
 ['Vanilla','Fabric','Forge','NeoForge','Quilt'].map(x=>'<option>'+x+'</option>').join("")+'</select></label></div>'+
 '<a id="playButton" class="hero-play" href="#pobierz" aria-label="GRAJ — informacje o pobraniu launchera"><span aria-hidden="true">▶</span><span>GRAJ<small>Otwórz launcher Windows</small></span></a></div></section>'+
 '<section aria-labelledby="features-title"><div class="home-intro"><div><span class="section-hint">ODKRYWAJ MINEVORA</span><h2 class="section-title" id="features-title">Wybierz swoją przygodę</h2></div>'+
 '<a class="btn secondary" href="#minigry">Zobacz minigry</a></div></section>'+
 '<div class="feature-grid">'+homeTiles.map(tile).join("")+'</div>'+
 '<p class="note">Wybór wersji na stronie jest poglądowy. Konfigurację gry i jej uruchamianie wykonasz po pobraniu launchera Windows.</p>';
}
function searchPage(query){
 const q=query.trim().toLocaleLowerCase("pl");
 if(!q)return '<section class="surface"><h1>Wyszukaj funkcję</h1><p class="note">Wpisz nazwę funkcji lub trybu, np. „Skin Studio”, „BedWars” albo „Forge”.</p></section>';
 const results=Object.entries(data).filter(([key,p])=>
   [p.label,p.intro,p.description,p.heading,...p.gallery.flatMap(x=>[x.title,x.desc])].join(" ").toLocaleLowerCase("pl").includes(q));
 return '<section class="surface"><div class="page-heading"><span class="section-hint">SZUKAJ</span><h1>Wyniki wyszukiwania</h1><p>Fraza: <strong>'+esc(query)+'</strong></p></div>'+
 (results.length?'<div class="search-results">'+results.map(([key,p])=>
 '<a class="search-hit" href="#'+key+'"><span><strong>'+esc(p.label)+'</strong><span>'+esc(p.intro)+'</span></span><b aria-hidden="true">→</b></a>').join("")+'</div>':
 '<div class="empty">Nie znaleziono funkcji. Spróbuj słowa „PvP”, „Skin”, „Mody” lub „Minigry”.</div>')+
 '<div class="footer-actions"><a href="#start" class="btn secondary">Wróć na Start</a></div></section>';
}
function normalize(hash){
 let key=(hash||"").replace(/^#/,"").trim().toLocaleLowerCase("pl");
 const aliases={home:"start",rankings:"ranking",minigames:"minigry",download:"pobierz",settings:"opcje",skins:"studio",marketplace:"sklep"};
 key=aliases[key]||key;
 return routes.includes(key)||key==="szukaj"?key:"start";
}
function updateLinks(route){
 $$('a[data-route]').forEach(a=>{
  const active=a.getAttribute("href")==="#"+route;
  a.classList.toggle("active",active);
  if(active)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");
 });
 $("#currentPage").textContent=names[route]||"Wyszukiwanie";
 document.title="MINEVORA — "+(names[route]||"Wyszukiwanie");
}
function render(){
 current=normalize(location.hash);
 content.innerHTML=current==="start"?home():current==="szukaj"?searchPage(searchQuery):page(current);
 updateLinks(current);wireImages();
 if(current==="start"){
  const v=$("#minecraftVersion"),l=$("#minecraftLoader"),b=$("#playButton");
  [v,l].forEach(el=>el.addEventListener("change",()=>{b.title="Minecraft "+v.value+" / "+l.value+" — wybór poglądowy. Ustaw te opcje w launcherze Windows."}));
  v.dispatchEvent(new Event("change"));
 }
 closeMenu(false);
 window.scrollTo({top:0,behavior:"instant"});
}
function mobile(){
 const vw=window.innerWidth||1000;
 const isTouch=navigator.maxTouchPoints>0||window.matchMedia("(pointer:coarse)").matches;
 const androidMobile=/Android.*Mobile|iPhone|iPod/i.test(navigator.userAgent||"");
 const shortest=Math.min(window.screen?.width||2000,window.screen?.height||2000);
 const forced=vw>950&&vw<=1300&&isTouch&&(androidMobile||shortest<=650);
 document.body.classList.toggle("force-mobile",forced);
 const compact=vw<=950||forced;
 drawer.inert=compact&&!document.body.classList.contains("drawer-open");
 if(!compact&&document.body.classList.contains("drawer-open"))closeMenu(false);
}
function openMenu(){
 lastFocus=document.activeElement;
 document.body.classList.add("drawer-open");backdrop.hidden=false;drawer.inert=false;
 menuButton.setAttribute("aria-expanded","true");closeButton.focus({preventScroll:true});
}
function closeMenu(refocus=false){
 document.body.classList.remove("drawer-open");backdrop.hidden=true;
 menuButton.setAttribute("aria-expanded","false");
 drawer.inert=window.innerWidth<=950||document.body.classList.contains("force-mobile");
 if(refocus&&lastFocus?.isConnected)lastFocus.focus({preventScroll:true});
}
menuButton.addEventListener("click",()=>document.body.classList.contains("drawer-open")?closeMenu(true):openMenu());
closeButton.addEventListener("click",()=>closeMenu(true));
backdrop.addEventListener("click",()=>closeMenu(true));
drawer.addEventListener("click",e=>{if(e.target.closest("a"))closeMenu(false)});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"&&document.body.classList.contains("drawer-open"))closeMenu(true);
 if(e.key==="Tab"&&document.body.classList.contains("drawer-open")){
  const focus=$$('a[href],button:not([disabled])',drawer).filter(el=>el.getClientRects().length);
  if(!focus.length)return;
  if(e.shiftKey&&document.activeElement===focus[0]){e.preventDefault();focus.at(-1).focus();}
  else if(!e.shiftKey&&document.activeElement===focus.at(-1)){e.preventDefault();focus[0].focus();}
 }
 if((e.ctrlKey||e.metaKey)&&e.key.toLocaleLowerCase()==="k"){e.preventDefault();if(window.innerWidth<=950||document.body.classList.contains("force-mobile")){location.hash="szukaj";$("#mobileSearch").focus()}else searchInput.focus();}
});
if(searchInput){
 searchInput.addEventListener("input",e=>{searchQuery=e.target.value;if(searchQuery.trim()){if(location.hash!=="#szukaj")location.hash="szukaj";else renderSearchOnly();}else if(current==="szukaj")renderSearchOnly();});
 searchInput.addEventListener("keydown",e=>{if(e.key==="Enter"&&searchQuery.trim()){location.hash="szukaj";renderSearchOnly();}});
}
function renderSearchOnly(){if(normalize(location.hash)!=="szukaj")return;content.innerHTML=searchPage(searchQuery);updateLinks("szukaj");}
const mobileSearch=$("#mobileSearch");
if(mobileSearch){mobileSearch.addEventListener("input",e=>{searchQuery=e.target.value;searchInput.value=searchQuery;if(location.hash!=="#szukaj")location.hash="szukaj";else renderSearchOnly();});}
let pending=false;
window.addEventListener("resize",()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;mobile()})},{passive:true});
window.addEventListener("hashchange",render);
mobile();render();
})();
