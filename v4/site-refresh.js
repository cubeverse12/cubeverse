/* MINEVORA v4: prawdziwe widoki funkcji i zdjęcia, bez paneli na ekranie Start. */
(function () {
  'use strict';
  var shell = document.querySelector('.shell');
  var main = document.querySelector('.middle');
  var hero = main && main.querySelector('.hero');
  if (!shell || !main || !hero) return;
  document.body.classList.add('mv-site-refresh');
  /* Usuń kolizje ID ze starymi, informacyjnymi sekcjami pod stroną. */
  ['pobierz','poradnik','wersje','minigry','pvp','ranking','mody','studio','sklep','plus','opcje'].forEach(function(id) {
    var legacy = document.getElementById(id);
    if (legacy) {
      legacy.id = 'mv-legacy-' + id;
      if (id === 'pobierz' || id === 'poradnik') legacy.hidden = true;
    }
  });
  var play = hero.querySelector('.play');
  if (play) {
    var label = play.querySelector('strong');
    var subtitle = play.querySelector('small');
    var symbol = play.querySelector('.tri');
    if (label) label.textContent = 'GRAJ';
    if (subtitle) subtitle.textContent = 'Otwórz launcher Windows';
    if (symbol) symbol.textContent = '▶';
    play.setAttribute('aria-label', 'GRAJ — otwórz informacje o launcherze Windows. Przeglądarka nie uruchamia Minecrafta.');
  }
  /* Pola wyboru pozostają na ekranie Start; wersję w grze ustawia się w aplikacji Windows. */
  var versionSelect = hero.querySelector('select[aria-label="Wersja Minecraft"]');
  var loaderSelect = hero.querySelector('select[aria-label="Typ instalacji"]');
  function updateSelection() {
    if (!play || !versionSelect || !loaderSelect) return;
    var selected = 'Minecraft ' + versionSelect.value + ' / ' + loaderSelect.value;
    play.title = selected + ' — wybór poglądowy na stronie, ustawienia zastosuj w launcherze';
    play.dataset.selectedVersion = versionSelect.value;
    play.dataset.selectedLoader = loaderSelect.value;
  }
  if (versionSelect && loaderSelect) {
    versionSelect.addEventListener('change',updateSelection);
    loaderSelect.addEventListener('change',updateSelection);
    updateSelection();
  }
  var cards = main.querySelector('.cards');
  var dir = '../assets/';
  function pic(name, photo, note) {
    return {name:name, photo:dir+photo, note:note};
  }
  var pages = {
    wersje:{
      title:'Wersje i profile',
      intro:'Własne profile Minecraft Java i obsługa loaderów. Instalacja i uruchamianie odbywają się w aplikacji Windows.',
      subtitle:'Wybieraj swoją konfigurację',
      description:'Vanilla, Fabric, Forge, NeoForge i Quilt. Zdjęcia przedstawiają ekrany MINEVORA; lista obsługiwanych wydań zależy od wersji aplikacji.',
      photos:[pic('Launcher i profile','launcher-18-3-16/launcher-preview.webp','Ekran aplikacji Minecraft Java'),pic('Instalacje i mody','launcher-316/mods.webp','Podgląd menedżera instalacji'),pic('Pierwsze uruchomienie','guide/launcher-windows.webp','Informacje o uruchamianiu launchera')]
    },
    mody:{
      title:'Mody i dodatki',
      intro:'W jednym miejscu: dodatki, profile i narzędzia do personalizacji gry.',
      subtitle:'Przeglądaj możliwości launchera',
      description:'Zdjęcia funkcji w podwyższonej czytelności. Dostępność i automatyczna instalacja modów zależą od zgodności z wybraną wersją gry.',
      photos:[pic('Biblioteka modów','launcher-316/mods.webp','Katalog modów i dodatków'),pic('Mody i zawartość','en_mods_highres.jpg','Podgląd elementów interfejsu'),pic('Poradnik instalacji','launcher-18-3-16/feature-guide.webp','Wskazówki dla nowych graczy')]
    },
    minigry:{
      title:'Minigry',
      intro:'Projektowane tryby na serwerze MINEVORA. Każda karta pokazuje osobny motyw areny.',
      subtitle:'Światy i areny',
      description:'BedWars, SkyWars, TNT Run, Parkour, Build Battle, Spleef i Duels. Serwer oraz mapy pozostają w przygotowaniu.',
      photos:[pic('BedWars','launcher-316/bedwars.webp','Chroń łóżko i współpracuj z drużyną'),pic('SkyWars','launcher-316/skywars.webp','Bitwy na podniebnych wyspach'),pic('TNT Run','launcher-316/tnt-run.webp','Biegaj po znikających blokach'),pic('Parkour','launcher-316/parkour.webp','Tory skoków i próby zręcznościowe'),pic('Build Battle','launcher-316/build-battle.webp','Budowanie na zadany temat'),pic('Spleef','launcher-316/spleef.webp','Utrzymaj się na arenie'),pic('Duels','launcher-316/duels.webp','Pojedynki graczy'),pic('Crystal PvP','launcher-316/crystal-pvp.webp','Zaawansowany tryb PvP')]
    },
    pvp:{
      title:'PvP Mode',
      intro:'Tryby pojedynków, areny i ustawienia HUD — przedstawione na podglądach MINEVORA.',
      subtitle:'Przygotuj się do pojedynku',
      description:'Karty przedstawiają tryby PvP. Dostępność w grze zależy od zgodnego moda i uruchomionego serwera.',
      photos:[pic('PvP Mode','launcher-316/pvp.webp','Przegląd dostępnych stylów walki'),pic('Crystal PvP','launcher-316/crystal-pvp.webp','Wizualizacja trybu Crystal PvP'),pic('Ustawienia PvP','launcher-18-3-16/feature-pvp.webp','Ekran konfiguracji i aren')]
    },
    ranking:{
      title:'Rankingi',
      intro:'Podium, postęp rang i wizualizacja awansu.',
      subtitle:'Rozwijaj swoją rangę',
      description:'Wyniki i punkty w tej prezentacji są demonstracyjne — nie są odczytywane z aktywnego serwera.',
      photos:[pic('Tabela rankingowa','launcher-316/rankingi.webp','Podgląd tabeli i statystyk'),pic('Rangi i postęp','guide/rankingi.webp','Przykładowa rozgrywka rankingowa'),pic('Animacja awansu','guide/awans.webp','Wizualizacja nagrody za awans')]
    },
    sklep:{
      title:'Sklep i marketplace',
      intro:'Planowany katalog map, dodatków, projektów i personalizacji MINEVORA.',
      subtitle:'Twórz, odkrywaj, personalizuj',
      description:'Marketplace jest w przygotowaniu. Zdjęcia mają charakter poglądowy i nie oznaczają dostępności zakupów.',
      photos:[pic('Marketplace','en_marketplace.jpg','Przegląd planowanych kategorii'),pic('Dodatki','en_mods_highres.jpg','Przykładowe projekty i mody'),pic('Skórki','en_skins_highres.jpg','Opcje personalizacji')]
    },
    studio:{
      title:'Skin Studio',
      intro:'Podgląd edytora skinów Minecraft, w tym postaci 3D i eksportu PNG.',
      subtitle:'Własny wygląd postaci',
      description:'Zdjęcia pokazują projekt Skin Studio PLUS w launcherze. Sam edytor działa w aplikacji, nie w przeglądarce.',
      photos:[pic('Skin Studio PLUS','guide/skin-studio-plus-2-8.jpg','Ekran edytora skinów'),pic('Podgląd postaci','launcher-18-3-16/feature-studio.webp','Widok funkcji skórek'),pic('Wybór skinów','en_skins_highres.jpg','Biblioteka i wygląd postaci')]
    },
    plus:{
      title:'MINEVORA PLUS',
      intro:'Dodatkowe motywy i opcje personalizacji — prezentacja demonstracyjna.',
      subtitle:'Motywy interfejsu',
      description:'Funkcje PLUS są prezentowane jako demo; strona nie prowadzi sprzedaży subskrypcji.',
      photos:[pic('MINEVORA PLUS','guide/minevora-plus-demo-2-8.jpg','Podgląd dodatkowych motywów'),pic('Panel PLUS','launcher-18-3-16/feature-plus.webp','Przykładowe funkcje'),pic('Świat MINEVORA','website-photos-20261027/home-hero.webp','Grafika promocyjna projektu')]
    },
    opcje:{
      title:'Ustawienia',
      intro:'Ustawienia profili, dodatków i wyglądu aplikacji Windows.',
      subtitle:'Dostosuj MINEVORA',
      description:'Parametry gry i launchera ustawisz po otwarciu aplikacji Windows. Ta strona służy do zapoznania się z funkcjami.',
      photos:[pic('Launcher','launcher-18-3-16/launcher-preview.webp','Ekran główny'),pic('Instalacje','launcher-316/mods.webp','Wybór dodatków i profili')]
    },
    poradnik:{
      title:'Poradnik MINEVORA',
      intro:'Pierwsze kroki: launcher, wersje, mody, PvP HUD i Skin Studio.',
      subtitle:'Zacznij od instalacji',
      description:'Pobierz publiczne wydanie, sprawdź zgodność z Windows, a następnie otwórz aplikację i skonfiguruj profil. Nie wyłączaj zabezpieczeń systemu, aby uruchamiać niepodpisane pliki.',
      photos:[pic('Uruchamianie','guide/launcher-windows.webp','Instrukcja startu'),pic('Wybór trybu','guide/minigry.webp','Podgląd minigier'),pic('PvP i HUD','guide/pvp-mode.webp','Konfiguracja PvP')]
    },
    pobierz:{
      title:'Pobierz launcher',
      intro:'MINEVORA dla Minecraft Java na Windows. Publiczna wersja na GitHub może różnić się od aktualnych projektów interfejsu.',
      subtitle:'Wydanie publiczne na GitHub',
      description:'Publicznie udostępnione wydanie: 18.3.4 (testowe). Wersja 18.5.0 prezentowana na stronie nie jest tym samym instalatorem. Weryfikuj pliki i zachowaj włączone zabezpieczenia Windows.',
      photos:[pic('Ekran launchera','launcher-18-3-16/launcher-preview.webp','Podgląd interfejsu'),pic('MINEVORA Java','launcher-316/hero.webp','Grafika promocyjna'),pic('Mody','launcher-316/mods.webp','Obsługa instalacji')]
    }
  };
  function htmlEscape(value) {
    return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function photoMarkup(photo, extra) {
    return '<a class="mv-photo '+(extra||'')+'" href="'+htmlEscape(photo.photo)+'" target="_blank" rel="noopener noreferrer" aria-label="Otwórz większy podgląd: '+htmlEscape(photo.name)+'"><img src="'+htmlEscape(photo.photo)+'" alt="'+htmlEscape(photo.name)+' — MINEVORA" loading="lazy" decoding="async"></a>';
  }
  var view = document.createElement('section');
  view.className = 'mv-route-view';
  view.setAttribute('aria-live', 'polite');
  view.hidden = true;
  main.appendChild(view);
  var valid = Object.keys(pages).concat('start');
  var aliases = {home:'start',odkrywaj:'start',rankings:'ranking',minigames:'minigry',download:'pobierz',account:'poradnik',settings:'opcje'};
  var labels = {start:'Start',wersje:'Wersje i profile',mody:'Mody i dodatki',minigry:'Minigry',pvp:'PvP Mode',ranking:'Rankingi',sklep:'Sklep',studio:'Skin Studio',plus:'MINEVORA PLUS',opcje:'Ustawienia',poradnik:'Poradnik',pobierz:'Pobierz'};
  function renderPage(key) {
    var p = pages[key];
    if (!p) return;
    var featured = p.photos[0];
    var rest = p.photos.slice(1);
    var cards = rest.map(function(item){
      return '<article class="mv-shot">'+photoMarkup(item,'')+'<div class="mv-shot-body"><h3>'+htmlEscape(item.name)+'</h3><p>'+htmlEscape(item.note)+'</p></div></article>';
    }).join('');
    var action = '<a class="mv-action" href="#pobierz">Sprawdź launcher</a>';
    if (key === 'pobierz') action = '<a class="mv-action" href="https://github.com/cubeverse12/minevora-launcher/releases/tag/v18.3.4" target="_blank" rel="noopener noreferrer">Otwórz publiczne wydanie na GitHub</a>';
    if (key === 'minigry' || key === 'pvp') action = '<a class="mv-action" href="https://discord.gg/M2fZVJBCqh" target="_blank" rel="noopener noreferrer">Dołącz do społeczności</a>';
    view.innerHTML='<span class="mv-route-kicker">MINEVORA / FUNKCJE LAUNCHERA</span>'+
      '<h1>'+htmlEscape(p.title)+'</h1><p class="mv-route-intro">'+htmlEscape(p.intro)+'</p>'+
      '<div class="mv-route-hero">'+photoMarkup(featured,'mv-hero-photo')+
      '<div><span class="mv-tag">ZDJĘCIA FUNKCJI MINEVORA</span><h2>'+htmlEscape(p.subtitle)+'</h2>'+
      '<p>'+htmlEscape(p.description)+'</p>'+action+'</div></div>'+
      '<h2 class="mv-gallery-title">Galeria funkcji</h2><div class="mv-shot-grid">'+cards+'</div>'+
      '<div class="mv-action-row"><a href="#start" class="mv-action secondary">Wróć do Start</a><a class="mv-action secondary" href="#poradnik">Poradnik</a></div>'+
      '<p class="mv-route-fineprint">Zdjęcia poglądowe z projektu MINEVORA. Kliknij zdjęcie, aby wyświetlić je w oryginalnym rozmiarze. Tryby serwera są w przygotowaniu.</p>';
    view.querySelectorAll('img').forEach(function(img){
      img.addEventListener('error',function(){img.closest('.mv-photo').classList.add('is-missing');});
    });
  }
  function show() {
    var raw = window.location.hash.slice(1).toLowerCase();
    var key = aliases[raw] || raw;
    if (valid.indexOf(key) === -1) key='start';
    document.body.setAttribute('data-mv-view',key);
    view.id = key === 'start' ? 'mv-view-inactive' : key;
    var home=key==='start';
    hero.hidden=!home;
    if (cards) cards.hidden=!home;
    view.hidden=home;
    if (!home) renderPage(key);
    document.title='MINEVORA — '+labels[key];
    shell.querySelectorAll('.menu a[href^="#"],.tabs a[href^="#"]').forEach(function(a){
      var target=(a.getAttribute('href')||'').slice(1).toLowerCase();
      var active=target===key;
      a.classList.toggle('active',active);
      if(active) a.setAttribute('aria-current','page'); else a.removeAttribute('aria-current');
    });
    window.scrollTo({top:0,behavior:'instant'});
  }
  window.addEventListener('hashchange',show);
  show();
})();
