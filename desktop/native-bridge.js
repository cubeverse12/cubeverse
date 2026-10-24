/* Loaded only inside the Windows webview. The web page remains unchanged online. */
(function () {
  "use strict";
  if (window.__minevoraNativeBound) return;
  window.__minevoraNativeBound = true;

  function setup(bridge) {
    function send(action, payload) {
      bridge.send(action, JSON.stringify(payload || {}));
    }
    function notify(message) {
      var toast = document.getElementById("toast");
      if (toast) {
        toast.textContent = message;
        toast.hidden = false;
        clearTimeout(toast.__timer);
        toast.__timer = setTimeout(function () { toast.hidden = true; }, 6500);
      }
    }
    function value(selector, fallback) {
      var node = document.querySelector(selector);
      return node ? node.value : fallback;
    }
    function choice(where) {
      return {
        version: value(where === "tab" ? "#tabVersion" : "#gameVersion", "1.21.1"),
        loader: value(where === "tab" ? "#tabLoader" : "#gameLoader", "Fabric").toLowerCase()
      };
    }
    function intercept(id, action, values) {
      var node = document.getElementById(id);
      if (!node) return;
      node.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        send(action, values ? values() : {});
      }, true);
    }
    function makeButton(host, title, action, values) {
      if (!host) return;
      var b = document.createElement("button");
      b.className = "primary";
      b.type = "button";
      b.textContent = title;
      b.style.margin = "8px 8px 0 0";
      b.addEventListener("click", function () { send(action, values ? values() : {}); });
      host.appendChild(b);
    }
    function fillVersions(versions) {
      if (!Array.isArray(versions) || !versions.length) return;
      ["#gameVersion", "#tabVersion", "#newProfileVersion"].forEach(function (selector) {
        var select = document.querySelector(selector);
        if (!select) return;
        var previous = select.value;
        select.replaceChildren();
        versions.forEach(function (version) {
          var option = document.createElement("option");
          option.value = option.textContent = version;
          select.appendChild(option);
        });
        if (versions.includes(previous)) select.value = previous;
      });
    }
    function displayProfiles(profiles) {
      var select = document.getElementById("gameProfile");
      if (select) {
        select.replaceChildren();
        (profiles || []).forEach(function (profile) {
          var option = document.createElement("option");
          option.value = profile.id;
          option.textContent = profile.name + " · " + profile.loader + " " + profile.version;
          select.appendChild(option);
        });
        if (!profiles.length) {
          var empty = document.createElement("option");
          empty.textContent = "Utwórz profil";
          select.appendChild(empty);
        }
      }
      var list = document.getElementById("profileList");
      if (list) {
        list.replaceChildren();
        (profiles || []).forEach(function (profile) {
          var card = document.createElement("div");
          card.className = "profile-example";
          var txt = document.createElement("div");
          var name = document.createElement("b");
          name.textContent = profile.name;
          var detail = document.createElement("p");
          detail.textContent = "Minecraft " + profile.version + " / " +
            profile.loader + " · " + (profile.installed ? "Zainstalowana" : "Do pobrania");
          txt.append(name, detail);
          var state = document.createElement("span");
          state.textContent = profile.installed ? "GOTOWA" : "INSTALACJA";
          card.append(txt, state);
          list.appendChild(card);
        });
      }
    }
    intercept("playBtn", "play", function () { return choice("home"); });
    intercept("tabPlay", "play", function () { return choice("tab"); });
    intercept("createProfile", "create_profile", function () {
      return {
        name: value("#newProfileName", "MINEVORA"),
        version: value("#newProfileVersion", "1.21.1"),
        loader: value("#newProfileLoader", "Vanilla").toLowerCase()
      };
    });
    intercept("addSkinButton", "skin");
    var top = document.querySelector(".user-area");
    makeButton(top, "Zaloguj Microsoft", "login");
    var installation = document.querySelector("#installationsView .create-profile");
    makeButton(installation, "Zainstaluj wybraną wersję", "install", function () {
      return {
        version: value("#newProfileVersion", "1.21.1"),
        loader: value("#newProfileLoader", "Vanilla").toLowerCase()
      };
    });
    makeButton(installation, "Pobierz wszystkie stabilne wersje", "bulk");
    makeButton(installation, "Przerwij pobieranie", "stop_bulk");

    bridge.event.connect(function (raw) {
      var event;
      try { event = JSON.parse(raw); } catch (_) { return; }
      if (event.kind === "versions") fillVersions(event.values);
      if (event.kind === "profiles") displayProfiles(event.profiles || []);
      if (event.kind === "status" || event.kind === "error") notify(event.message);
      if (event.kind === "account") {
        var label = document.querySelector(".user-area strong");
        if (label) label.textContent = event.name;
        notify("Zalogowano: " + event.name);
      }
      if (event.kind === "skin") {
        if (typeof window.MINEVORA_SET_SKIN === "function")
          window.MINEVORA_SET_SKIN(event.url);
        document.querySelectorAll(".skin-thumb img").forEach(function (img) {
          img.src = event.url;
        });
      }
    });
    send("ready");
  }

  var script = document.createElement("script");
  script.src = "qrc:///qtwebchannel/qwebchannel.js";
  script.onload = function () {
    if (!window.qt || !window.qt.webChannelTransport) return;
    new QWebChannel(qt.webChannelTransport, function (channel) {
      setup(channel.objects.nativeLauncher);
    });
  };
  script.onerror = function () {
    var notice = document.getElementById("toast");
    if (notice) {
      notice.textContent = "Nie udało się uruchomić mostu funkcji Windows.";
      notice.hidden = false;
    }
  };
  document.head.appendChild(script);
})();
