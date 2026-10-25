/* MINEVORA desktop controls. Local Qt WebChannel only; no remote site gets this bridge. */
(function () {
  "use strict";
  if (window.__minevoraNativeBound) return;
  window.__minevoraNativeBound = true;

  function createControls(bridge) {
    const post = (type, data = {}) => bridge.send(type, JSON.stringify(data));
    const firstRow = document.querySelector(".first-row");
    const nav = document.querySelector(".sidenav");
    const page = document.querySelector("main.page");
    if (!firstRow || !nav || !page) return;

    const style = document.createElement("style");
    style.textContent = `
      .minevora-native-panel{margin:0 auto;max-width:1100px;border:1px solid #6552aa;
        background:linear-gradient(120deg,#161939,#0c132b);border-radius:16px;
        padding:clamp(18px,3vw,35px);color:#f7f4ff}
      .minevora-native-panel[hidden]{display:none}
      .minevora-native-panel .desktop-row{display:flex;gap:14px;flex-wrap:wrap;align-items:end;margin:20px 0}
      .minevora-native-panel label{display:grid;gap:9px;flex:1 1 175px;font-weight:700;font-size:14px}
      .minevora-native-panel input,.minevora-native-panel select{width:100%;min-height:43px;
        padding:9px 12px;background:#090f28;border:1px solid #7965a8;border-radius:10px;color:#fff}
      .minevora-native-panel button{padding:11px 18px;background:#5b28bd;border:1px solid #ad87f2;
        color:#fff;border-radius:10px;font-weight:800;cursor:pointer}
      .minevora-native-panel button:hover{background:#7535e6}
      .minevora-native-panel h1{font-size:clamp(27px,4vw,46px);margin:0}
      .minevora-native-panel h2{font-size:20px;margin:20px 0 7px}
      .minevora-native-panel p{color:#c3c8e8;line-height:1.55}
      .minevora-native-panel .desktop-status{border:1px solid #564b91;background:#1e224a;
        padding:13px;border-radius:9px;word-wrap:break-word}
      .minevora-native-panel .desktop-profile{display:flex;justify-content:space-between;gap:10px;
        border:1px solid #45456f;padding:12px;border-radius:9px;margin-top:9px}
      .minevora-native-panel .desktop-warning{font-size:12px}
      .minevora-native-panel .hud-option{flex:1 1 190px;display:flex;align-items:center;gap:12px;
        border:1px solid #6352a2;background:#121936;border-radius:10px;padding:12px;cursor:pointer}
      .minevora-native-panel .hud-option input[type="checkbox"]{width:20px;height:20px;min-height:20px;accent-color:#9562f1}
      .native-nav{cursor:pointer}
    `;
    document.head.appendChild(style);

    const navlink = document.createElement("a");
    navlink.className = "navitem native-nav";
    navlink.href = "#launcher";
    const navIcon=document.createElement("img");navIcon.src="assets/icons/download.png";navIcon.alt="";navlink.append(navIcon,document.createTextNode(" Graj / Instalacje"));
    const hudNav = document.createElement("a");
    hudNav.className = "navitem native-nav";
    hudNav.href = "#pvp-hud";
    const hudIcon = document.createElement("span");
    hudIcon.textContent = "⚔";
    hudIcon.style.cssText = "display:inline-flex;align-items:center;justify-content:center;width:24px;font-size:20px";
    hudNav.append(hudIcon, document.createTextNode(" PvP HUD"));
    nav.prepend(navlink, hudNav);

    const panel = document.createElement("section");
    panel.id = "minevoraDesktopPanel";
    panel.className = "minevora-native-panel";
    panel.hidden = true;
    panel.setAttribute("aria-label", "MINEVORA Launcher Windows");
    panel.innerHTML = `
      <p style="color:#c89cff;font-weight:900">MINEVORA · WINDOWS 11</p>
      <h1>GRAJ W MINECRAFT</h1>
      <p>Wybierz oficjalną wersję Java i loader. Brakująca wersja pobierze się podczas pierwszego uruchomienia.
      Minecraft Java wymaga konta Microsoft z licencją na grę.</p>
      <div class="desktop-row">
        <label>Wersja Minecraft <select id="nativeVersion"><option value="1.21.1">1.21.1</option></select></label>
        <label>Loader <select id="nativeLoader">
          <option value="vanilla">Vanilla</option><option value="fabric">Fabric</option>
          <option value="forge">Forge</option><option value="neoforge">NeoForge</option>
          <option value="quilt">Quilt</option></select></label>
        <label>Nazwa profilu <input id="nativeProfileName" maxlength="45" value="MINEVORA Minecraft"></label>
      </div>
      <div class="desktop-row">
        <button type="button" id="nativePlay">▶ GRAJ</button>
        <button type="button" id="nativeInstall">⬇ Zainstaluj</button>
        <button type="button" id="nativeCreate">+ Zapisz profil</button>
      </div>
      <h2>Moje konto Minecraft Java</h2>
      <p id="nativeAccount">Nie zalogowano do Minecraft Java. Konto MINEVORA na stronie nie jest jeszcze połączone automatycznie z tym launcherem.</p>
      <p><img id="nativeWebAvatar" alt="Zdjęcie profilu MINEVORA" style="width:64px;height:64px;border-radius:12px;object-fit:cover;display:none;border:2px solid #9673e8"> <span id="nativeWebNickname"></span></p>
      <div class="desktop-row">
        <button type="button" id="nativeLogin">Zaloguj przez Microsoft</button>
        <button type="button" id="nativeSkin">Wczytaj skin PNG</button>
        <button type="button" id="nativeProfileImport">Importuj profil WWW (JSON)</button>
      </div>
      <h2>☁ Konto MINEVORA · Cloudflare</h2>
      <p>Użyj osobnego logowania Microsoft do synchronizacji nicku, zdjęcia, koloru i ulubionej minigry.
      Konto Minecraft Java jest niezależne. Nic nie synchronizuje się automatycznie.</p>
      <div class="desktop-row">
        <button type="button" id="nativeCloudPull">Pobierz profil z chmury</button>
        <button type="button" id="nativeCloudPush">Wyślij lokalny profil do chmury</button>
        <button type="button" id="nativeCloudDisconnect">Rozłącz konto profilu</button>
      </div>
      <p class="desktop-warning">Logowanie otwiera oficjalną przeglądarkę Microsoft.
      W Entra aplikacji MINEVORA Launcher musi być dodany adres „http://localhost” w
      platformie „Aplikacje mobilne i klasyczne”. Nie udostępniaj tokenów, kodów logowania ani haseł.</p>
      <h2>Zapisane instalacje</h2>
      <div id="nativeProfileList"><p>Ładowanie instalacji…</p></div>
      <h2>Instalacja zbiorcza</h2>
      <p class="desktop-warning">Instalacja wszystkich stabilnych wersji może zająć wiele godzin i setki GB.
      Jest opcjonalna i wymaga osobnego potwierdzenia. Nie wszystkie loadery obsługują każdą wersję.</p>
      <div class="desktop-row">
        <button type="button" id="nativeBulk">Pobierz wszystkie wersje</button>
        <button type="button" id="nativeStopBulk">Zatrzymaj po bieżącym pobraniu</button>
      </div>
      <p class="desktop-status" id="nativeStatus" role="status">Uruchamianie MINEVORA…</p>
    `;
    const hudPanel = document.createElement("section");
    hudPanel.id = "minevoraPvpHudPanel";
    hudPanel.className = "minevora-native-panel";
    hudPanel.hidden = true;
    hudPanel.setAttribute("aria-label", "Ustawienia MINEVORA PvP HUD");
    hudPanel.innerHTML = `
      <p style="color:#c89cff;font-weight:900">MINEVORA · PVP HUD · FABRIC 1.21.1</p>
      <h1>⚔ USTAWIENIA PVP HUD</h1>
      <h2>⚔ PvP HUD · HP, głód i jedzenie</h2>
      <p>Ustaw, jakie informacje mają pojawiać się w grze Minecraft. Mod pokazuje prawdziwe wartości,
      nie zmienia HP ani poziomu głodu. Wymagany MINEVORA PvP HUD 2.0.15+ na Fabric 1.21.1.</p>
      <div class="desktop-row">
        <label class="hud-option"><input type="checkbox" id="nativeHudHealth" checked> HP gracza</label>
        <label class="hud-option"><input type="checkbox" id="nativeHudHunger" checked> Poziom głodu</label>
        <label class="hud-option"><input type="checkbox" id="nativeHudFoodCount" checked> Liczba sztuk jedzenia</label>
      </div>
      <div class="desktop-row">
        <button type="button" id="nativeHudLoad">Wczytaj ustawienia moda</button>
        <button type="button" id="nativeHudSave">Zapisz PvP HUD</button>
      </div>
      <p class="desktop-warning">Ustawienia dotyczą profilu Minecraft 1.21.1 na Fabric.
      Mod liczy jedzenie w ekwipunku i drugiej ręce, bez skrzyń ani ekwipunków innych graczy.</p>
      <p class="desktop-status" id="nativeHudStatus" role="status">
        Zaznacz wskaźniki i kliknij „Zapisz PvP HUD”.
      </p>
    `;
    firstRow.before(panel, hudPanel);
    const byId = id => document.getElementById(id);
    const settings = () => ({version:byId("nativeVersion").value,loader:byId("nativeLoader").value});
    byId("nativePlay").addEventListener("click", () => post("play",settings()));
    byId("nativeInstall").addEventListener("click", () => post("install",settings()));
    byId("nativeCreate").addEventListener("click", () => post("create_profile",{...settings(),name:byId("nativeProfileName").value}));
    byId("nativeLogin").addEventListener("click",()=>post("login"));
    document.querySelectorAll("a[href='#account']").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();post("web_account")},true));
    byId("nativeSkin").addEventListener("click",()=>post("skin"));
    byId("nativeProfileImport").addEventListener("click",()=>post("profile_import"));
    byId("nativeCloudPull").addEventListener("click",()=>post("cloud_pull"));
    byId("nativeCloudPush").addEventListener("click",()=>post("cloud_push"));
    byId("nativeCloudDisconnect").addEventListener("click",()=>post("cloud_disconnect"));
    const hudOptions = () => ({
      ...settings(),
      showHealth:byId("nativeHudHealth").checked,
      showHunger:byId("nativeHudHunger").checked,
      showFoodCount:byId("nativeHudFoodCount").checked
    });
    byId("nativeHudLoad").addEventListener("click",()=>post("hud_settings_load",settings()));
    byId("nativeHudSave").addEventListener("click",()=>post("hud_settings_save",hudOptions()));
    byId("nativeBulk").addEventListener("click",()=>post("bulk"));
    byId("nativeStopBulk").addEventListener("click",()=>post("stop_bulk"));
    function updateNavigation(){
      const launcher=location.hash === "#launcher";
      const hud=location.hash === "#pvp-hud";
      panel.hidden=!launcher;
      hudPanel.hidden=!hud;
      firstRow.hidden=launcher || hud;
      navlink.classList.toggle("active",launcher);
      hudNav.classList.toggle("active",hud);
      if(launcher || hud) window.scrollTo(0,0);
    }
    window.addEventListener("hashchange",updateNavigation);
    navlink.addEventListener("click",()=>setTimeout(updateNavigation,0));
    hudNav.addEventListener("click",()=>setTimeout(updateNavigation,0));
    document.querySelectorAll("a[href='#account'],a[href='#home'],a[href='#minigames'],a[href='#download']")
      .forEach(a=>a.addEventListener("click",()=>setTimeout(updateNavigation,0)));
    updateNavigation();
    const message = text => {
      ["nativeStatus","nativeHudStatus"].forEach(id => {
        const node=byId(id);
        if(node)node.textContent=String(text || "");
      });
    };
    bridge.event.connect(raw=>{
      let event;
      try{event=JSON.parse(raw)}catch(_){return}
      if(event.kind==="status"||event.kind==="error")message(event.message);
      if(event.kind==="versions" && Array.isArray(event.values) && event.values.length) {
        const select=byId("nativeVersion"),old=select.value;
        select.replaceChildren();
        event.values.forEach(v=>{if(typeof v!=="string")return;const opt=document.createElement("option");opt.value=v;opt.textContent=v;select.appendChild(opt)});
        if([...select.options].some(o=>o.value===old))select.value=old;
      }
      if(event.kind==="profiles") {
        const list=byId("nativeProfileList");list.replaceChildren();
        const profiles=Array.isArray(event.profiles)?event.profiles:[];
        if(!profiles.length){const p=document.createElement("p");p.textContent="Brak zapisanych profili.";list.appendChild(p)}
        profiles.forEach(p=>{
          const item=document.createElement("div");item.className="desktop-profile";
          const desc=document.createElement("span");desc.textContent=`${p.name} · ${p.version} / ${p.loader}`;
          const status=document.createElement("strong");status.textContent=p.installed?"GOTOWA":"DO POBRANIA";
          item.append(desc,status);list.appendChild(item);
        });
      }
      if(event.kind==="account"){
        byId("nativeAccount").textContent="Połączone konto Minecraft Java: "+String(event.name||"");
        message("Zalogowano do Minecraft Java");
      }
      if(event.kind==="minevora_profile"){
        const nickname=typeof event.nickname==="string"?event.nickname:"";
        if(nickname){byId("nativeProfileName").value=nickname;byId("nativeWebNickname").textContent=nickname;}
        const avatar=byId("nativeWebAvatar");
        if(typeof event.avatarData==="string" && event.avatarData.startsWith("data:image/webp;base64,") && event.avatarData.length<400000){avatar.src=event.avatarData;avatar.style.display="inline-block"}
        else {avatar.removeAttribute("src");avatar.style.display="none";}
        message("Profil MINEVORA załadowany do launchera.");
      }
      if(event.kind==="hud_settings"){
         byId("nativeHudHealth").checked=event.showHealth===true;
         byId("nativeHudHunger").checked=event.showHunger===true;
         byId("nativeHudFoodCount").checked=event.showFoodCount===true;
       }
       if(event.kind==="skin")message("Zapisano skin Minecraft w launcherze.");
    });
    post("ready");
  }
  const script=document.createElement("script");
  script.src="qrc:///qtwebchannel/qwebchannel.js";
  script.addEventListener("load",()=>{
    if(!window.qt?.webChannelTransport) return;
    new QWebChannel(window.qt.webChannelTransport,channel=>createControls(channel.objects.nativeLauncher));
  });
  script.addEventListener("error",()=>{const s=document.getElementById("toast");if(s){s.textContent="Brak połączenia z modułem Windows.";s.hidden=false}});
  document.head.append(script);
})();
