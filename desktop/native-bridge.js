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
      #minevoraDesktopPanel{margin:0 auto;max-width:1100px;border:1px solid #6552aa;
        background:linear-gradient(120deg,#161939,#0c132b);border-radius:16px;
        padding:clamp(18px,3vw,35px);color:#f7f4ff}
      #minevoraDesktopPanel[hidden]{display:none}
      #minevoraDesktopPanel .desktop-row{display:flex;gap:14px;flex-wrap:wrap;align-items:end;margin:20px 0}
      #minevoraDesktopPanel label{display:grid;gap:9px;flex:1 1 175px;font-weight:700;font-size:14px}
      #minevoraDesktopPanel input,#minevoraDesktopPanel select{width:100%;min-height:43px;
        padding:9px 12px;background:#090f28;border:1px solid #7965a8;border-radius:10px;color:#fff}
      #minevoraDesktopPanel button{padding:11px 18px;background:#5b28bd;border:1px solid #ad87f2;
        color:#fff;border-radius:10px;font-weight:800;cursor:pointer}
      #minevoraDesktopPanel button:hover{background:#7535e6}
      #minevoraDesktopPanel h1{font-size:clamp(27px,4vw,46px);margin:0}
      #minevoraDesktopPanel h2{font-size:20px;margin:20px 0 7px}
      #minevoraDesktopPanel p{color:#c3c8e8;line-height:1.55}
      #minevoraDesktopPanel .desktop-status{border:1px solid #564b91;background:#1e224a;
        padding:13px;border-radius:9px;word-wrap:break-word}
      #minevoraDesktopPanel .desktop-profile{display:flex;justify-content:space-between;gap:10px;
        border:1px solid #45456f;padding:12px;border-radius:9px;margin-top:9px}
      #minevoraDesktopPanel .desktop-warning{font-size:12px}
      .native-nav{cursor:pointer}
    `;
    document.head.appendChild(style);

    const navlink = document.createElement("a");
    navlink.className = "navitem native-nav";
    navlink.href = "#launcher";
    const navIcon=document.createElement("img");navIcon.src="assets/icons/download.png";navIcon.alt="";navlink.append(navIcon,document.createTextNode(" Graj / Instalacje"));
    nav.prepend(navlink);

    const panel = document.createElement("section");
    panel.id = "minevoraDesktopPanel";
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
    firstRow.before(panel);
    const byId = id => document.getElementById(id);
    const settings = () => ({version:byId("nativeVersion").value,loader:byId("nativeLoader").value});
    byId("nativePlay").addEventListener("click", () => post("play",settings()));
    byId("nativeInstall").addEventListener("click", () => post("install",settings()));
    byId("nativeCreate").addEventListener("click", () => post("create_profile",{...settings(),name:byId("nativeProfileName").value}));
    byId("nativeLogin").addEventListener("click",()=>post("login"));
    document.querySelectorAll("a[href='#account']").forEach(a=>a.addEventListener("click",e=>{e.preventDefault();e.stopImmediatePropagation();post("web_account")},true));
    byId("nativeSkin").addEventListener("click",()=>post("skin"));
    byId("nativeProfileImport").addEventListener("click",()=>post("profile_import"));
    byId("nativeBulk").addEventListener("click",()=>post("bulk"));
    byId("nativeStopBulk").addEventListener("click",()=>post("stop_bulk"));
    function updateNavigation(){
      const enabled=location.hash === "#launcher";
      panel.hidden=!enabled;
      firstRow.hidden=enabled;
      navlink.classList.toggle("active",enabled);
      if(enabled) window.scrollTo(0,0);
    }
    window.addEventListener("hashchange",updateNavigation);
    navlink.addEventListener("click",()=>setTimeout(updateNavigation,0));
    document.querySelectorAll("a[href='#account'],a[href='#home'],a[href='#minigames'],a[href='#download']")
      .forEach(a=>a.addEventListener("click",()=>setTimeout(updateNavigation,0)));
    updateNavigation();
    const message = text => {byId("nativeStatus").textContent = String(text || "");};
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
        if(typeof event.avatarData==="string" && /^data:image\\/webp;base64,[A-Za-z0-9+/=]+$/.test(event.avatarData) && event.avatarData.length<400000){avatar.src=event.avatarData;avatar.style.display="inline-block"}
        else {avatar.removeAttribute("src");avatar.style.display="none";}
        message("Zaimportowano profil ze strony MINEVORA. Synchronizacja online wymaga jeszcze usługi kont.");
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
