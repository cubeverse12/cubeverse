// MINEVORA: Microsoft sign-in on GitHub Pages using MSAL Browser (auth code + PKCE).
// This frontend does not store Minecraft tokens or create a server-side MINEVORA profile.
import { createStandardPublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";
const CLIENT_ID = "72a4154b-5254-4c4b-958f-0a5181a0ad93";
const REDIRECT_URI = "https://cubeverse12.github.io/cubeverse/";
const CLOUD_API = "https://wandering-cell-cf47minevora-profile-api.niedospialirek855.workers.dev/v1/profile";
const CLOUD_SCOPE = "api://9136b5e6-145b-40d0-bbc4-dca668321195/profile.sync";
const btn = document.getElementById("msalLogin");
const logoutBtn = document.getElementById("msalLogout");
const redirectFallback = document.getElementById("msalRedirectFallback");
const state = document.getElementById("accountState");
const profile = document.getElementById("accountProfile");
const badge = document.querySelector(".visitor-badge");
const signInExplanation = document.getElementById("signInExplanation");
const signedInHeading = document.getElementById("signedInHeading");
const homeCard = document.querySelector('a[href="#account"] .feature-copy small');
function status(message) { if (state) state.textContent = message; }
// Public-site-only profile. Never save MSAL tokens or passwords in MINEVORA profile storage.
const playerPanel = document.getElementById("playerProfile");
const playerForm = document.getElementById("profileForm");
const nickField = document.getElementById("profileNick");
const modeField = document.getElementById("profileMode");
const colorField = document.getElementById("profileColor");
const profileMessage = document.getElementById("profileSaveStatus");
const resetButton = document.getElementById("resetProfile");
const photoField = document.getElementById("profilePhoto");
const removePhotoBtn = document.getElementById("removeProfilePhoto");
let currentUser = null;
let pendingAvatarData = null;
let authClient = null;
let cloudBusy = false;
const cloudStatus = document.getElementById("cloudStatus");
const cloudUpload = document.getElementById("cloudUpload");
const cloudDownload = document.getElementById("cloudDownload");
const cloudDelete = document.getElementById("cloudDelete");
const cloudControls = [cloudUpload, cloudDownload, cloudDelete].filter(Boolean);

function accountStorageKey(user) {
  // homeAccountId identifies the account but is not an access token.
  // Keep all saved settings scoped to the currently signed-in Microsoft account.
  const id = typeof user?.homeAccountId === "string" ? user.homeAccountId : "";
  return id && id.length < 300 ? "minevora.player.v1." + id : "";
}
function validNickname(nick) {
  return typeof nick === "string" && /^[a-zA-Z0-9_-]{3,20}$/.test(nick);
}
const modes = ["BedWars", "SkyWars", "Crystal PvP", "Parkour", "TNT Run", "Build Battle", "Spleef", "Duels"];
const colors = ["purple", "blue", "teal", "rose"];
function defaultProfile(user) {
  const proposed = String(user?.name || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 20);
  return { nickname: validNickname(proposed) ? proposed : "GraczMinevora", mode: "BedWars", color: "purple", avatarData: "", createdAt: null };
}
function loadProfile(user) {
  const empty = defaultProfile(user), key = accountStorageKey(user);
  if (!key) return empty;
  try {
    const saved = JSON.parse(localStorage.getItem(key) || "null");
    if (!saved || typeof saved !== "object") return empty;
    return {
      nickname: validNickname(saved.nickname) ? saved.nickname : empty.nickname,
      mode: modes.includes(saved.mode) ? saved.mode : "BedWars",
      color: colors.includes(saved.color) ? saved.color : "purple",
      avatarData: typeof saved.avatarData === "string" && /^data:image\/webp;base64,[a-zA-Z0-9+/=]+$/.test(saved.avatarData) && saved.avatarData.length < 400000 ? saved.avatarData : "",
      createdAt: typeof saved.createdAt === "string" && /^\d{4}-\d{2}-\d{2}T/.test(saved.createdAt) ? saved.createdAt : null
    };
  } catch { return empty; }
}
function paintAvatar(data) {
  const avatar = document.getElementById("profileAvatar");
  if (!avatar) return;
  const photo = data.avatarData || "";
  avatar.classList.toggle("has-photo", Boolean(photo));
  avatar.style.backgroundImage = photo ? `url("${photo}")` : "";
  avatar.textContent = photo ? "" : (data.nickname?.[0] || "M").toUpperCase();
  avatar.dataset.color = data.color;
}
function renderProfile(user, data) {
  if (playerPanel) playerPanel.hidden = !user;
  if (!user) { if (profileMessage) profileMessage.textContent = ""; return; }
  nickField.value = data.nickname;
  modeField.value = data.mode;
  colorField.value = data.color;
  document.getElementById("profileNickname").textContent = data.nickname;
  document.getElementById("profileMicrosoftName").textContent = "Konto Microsoft: " + (user.name || "Połączono");
  paintAvatar(data);
  document.getElementById("profileFavorite").textContent = data.mode;
  document.getElementById("profileSince").textContent = data.createdAt ?
    new Date(data.createdAt).toLocaleDateString("pl-PL") : "Jeszcze nie zapisano";
}
function setUser(user) {
  currentUser = user || null;
  pendingAvatarData = null;
  if (btn) btn.hidden = Boolean(user);
  if (logoutBtn) logoutBtn.hidden = !user;
  if (redirectFallback) redirectFallback.hidden = Boolean(user);
  if (profile) {
    profile.textContent = user ? "Zalogowano jako: " + (user.name || "Konto Microsoft") : "";
    profile.hidden = !user;
  }
  if (badge) badge.textContent = user ? "ZALOGOWANO" : "GOŚĆ";
  if (signInExplanation) signInExplanation.hidden = Boolean(user);
  if (signedInHeading) signedInHeading.hidden = !user;
  if (homeCard) homeCard.textContent = user ? "Konto Microsoft połączone na tej stronie" : "Zaloguj przez Microsoft bez dodatkowego hasła";
  status(user ? "Sesja Microsoft aktywna na stronie MINEVORA." : "Nie jesteś zalogowany.");
  if (playerPanel) renderProfile(user, user ? loadProfile(user) : null);
}
async function makeAvatar(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
    throw new Error("Wybierz obraz PNG, JPG lub WebP o rozmiarze do 5 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error("Nie można odczytać tego zdjęcia."));
      img.src = url;
    });
    if (img.width < 32 || img.height < 32 || img.width > 4096 || img.height > 4096) {
      throw new Error("Zdjęcie musi mieć wymiary od 32 do 4096 pikseli.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Przeglądarka nie obsługuje przetwarzania zdjęć.");
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
    const data = canvas.toDataURL("image/webp", 0.84);
    if (data.length > 400000 || !data.startsWith("data:image/webp;base64,")) {
      throw new Error("Zdjęcie po przetworzeniu jest za duże.");
    }
    return data;
  } finally {
    URL.revokeObjectURL(url);
  }
}
if (photoField) photoField.addEventListener("change", async () => {
  if (!currentUser || !photoField.files?.[0]) return;
  const owner = currentUser;
  profileMessage.textContent = "Przygotowuję zdjęcie…";
  try {
    const data = await makeAvatar(photoField.files[0]);
    if (currentUser !== owner) return;
    pendingAvatarData = data;
    paintAvatar({ nickname: nickField.value, color: colorField.value, avatarData: data });
    profileMessage.textContent = "Zdjęcie gotowe. Kliknij „Zapisz profil”, żeby je zachować.";
  } catch (e) {
    profileMessage.textContent = e.message || "Nie udało się odczytać zdjęcia.";
  } finally { photoField.value = ""; }
});
if (removePhotoBtn) removePhotoBtn.addEventListener("click", () => {
  if (!currentUser) return;
  pendingAvatarData = "";
  paintAvatar({ nickname: nickField.value, color: colorField.value, avatarData: "" });
  profileMessage.textContent = "Zdjęcie zostanie usunięte po kliknięciu „Zapisz profil”.";
});
if (playerForm) playerForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!currentUser) return;
  const nickname = nickField.value.trim();
  if (!validNickname(nickname)) {
    profileMessage.textContent = "Nick musi mieć od 3 do 20 znaków: litery A–Z, cyfry, _ lub -.";
    return;
  }
  const key = accountStorageKey(currentUser);
  if (!key) { profileMessage.textContent = "Nie można przypisać profilu do tego konta."; return; }
  const previous = loadProfile(currentUser);
  const data = {
    nickname,
    mode: modes.includes(modeField.value) ? modeField.value : "BedWars",
    color: colors.includes(colorField.value) ? colorField.value : "purple",
    avatarData: pendingAvatarData === null ? previous.avatarData : pendingAvatarData,
    createdAt: previous.createdAt || new Date().toISOString()
  };
  try {
    localStorage.setItem(key, JSON.stringify(data));
    pendingAvatarData = null;
    renderProfile(currentUser, data);
    profileMessage.textContent = "Profil zapisany w tej przeglądarce. Aby przechowywać kopię online, wybierz „Wyślij zapisany profil do chmury”.";
  } catch { profileMessage.textContent = "Nie udało się zapisać danych w tej przeglądarce."; }
});
if (resetButton) resetButton.addEventListener("click", () => {
  if (!currentUser || !confirm("Usunąć lokalny nick, zdjęcie, tryb i kolor avatara?")) return;
  const key = accountStorageKey(currentUser);
  try {
    if (key) localStorage.removeItem(key);
    pendingAvatarData = null;
    renderProfile(currentUser, defaultProfile(currentUser));
    profileMessage.textContent = "Przywrócono domyślne ustawienia profilu.";
  } catch { profileMessage.textContent = "Nie udało się przywrócić ustawień."; }
});

/* Private profile cloud sync. Disabled by default: only explicit user clicks
   obtain delegated API consent or transfer locally saved profile data. */
function cloudMessage(message) { if (cloudStatus) cloudStatus.textContent = message; }
function cloudLock(locked) {
  cloudBusy = locked;
  cloudControls.forEach(button => { button.disabled = locked; });
}
async function cloudToken(owner) {
  if (!authClient || !owner) throw new Error("Najpierw zaloguj się do Microsoft.");
  const req = { account: owner, scopes: [CLOUD_SCOPE] };
  let result;
  try {
    result = await authClient.acquireTokenSilent(req);
  } catch (error) {
    if (!(error instanceof InteractionRequiredAuthError)) throw error;
    result = await authClient.acquireTokenPopup({
      ...req, redirectUri: REDIRECT_URI + "auth-popup.html"
    });
  }
  if (currentUser !== owner || !result?.accessToken) {
    throw new Error("Sesja Microsoft zmieniła się. Zaloguj się ponownie.");
  }
  return result.accessToken;
}
function checkedCloudProfile(value) {
  if (!value || !validNickname(value.nickname) ||
      !modes.includes(value.mode) || !colors.includes(value.color) ||
      typeof value.avatarData !== "string" ||
      (value.avatarData !== "" &&
       (!/^data:image\/webp;base64,[a-zA-Z0-9+/=]+$/.test(value.avatarData) ||
        value.avatarData.length > 400000))) {
    throw new Error("Serwer zwrócił nieprawidłowe dane profilu.");
  }
  return { nickname: value.nickname, mode: value.mode,
           color: value.color, avatarData: value.avatarData };
}
async function cloudRequest(method, owner, payload) {
  const token = await cloudToken(owner);
  // The token is used only as an Authorization header, never logged or stored
  // with the profile. The backend verifies issuer, signature, audience and scope.
  const opts = {
    method,
    headers: { Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(20000)
  };
  if (method === "PUT") {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(payload);
  }
  const result = await fetch(CLOUD_API, opts);
  const reply = await result.json().catch(() => ({}));
  if (currentUser !== owner) throw new Error("Zmieniono konto Microsoft podczas synchronizacji.");
  if (!result.ok) {
    const publicErrors = {
      authentication_required: "Serwer nie zaakceptował tokenu Microsoft. Sprawdź zgodę profile.sync.",
      storage_unavailable: "Baza profili jest chwilowo niedostępna.",
      invalid_profile: "Dane profilu nie przeszły weryfikacji serwera.",
      profile_too_large: "Zdjęcie lub profil są zbyt duże.",
      auth_configuration_error: "Konfiguracja API Microsoft wymaga poprawki."
    };
    throw new Error(publicErrors[reply?.error] || "Synchronizacja nie powiodła się (HTTP " + result.status + ").");
  }
  return reply;
}
async function doCloudAction(operation) {
  if (cloudBusy || !currentUser || !authClient) return;
  const owner = currentUser;
  const storageKey = accountStorageKey(owner);
  if (!storageKey) { cloudMessage("Brak identyfikatora profilu Microsoft."); return; }
  if (operation === "upload" && pendingAvatarData !== null) {
    cloudMessage("Najpierw kliknij „Zapisz profil”, aby uwzględnić zmianę zdjęcia.");
    return;
  }
  if (operation === "upload" && !confirm(
      "Czy zapisać kopię profilu (nick, minigra, kolor, opcjonalne zdjęcie) " +
      "na prywatnym koncie MINEVORA w Cloudflare? Dane pozostaną tam do ich zmiany lub usunięcia.")) return;
  if (operation === "delete" && !confirm(
      "Usunąć Twój profil z chmury? Kopia zapisana w tej przeglądarce pozostanie bez zmian.")) return;
  cloudLock(true);
  cloudMessage("Trwa autoryzacja Microsoft i łączenie z prywatnym API…");
  try {
    if (operation === "upload") {
      const p = checkedCloudProfile(loadProfile(owner));
      await cloudRequest("PUT", owner, p);
      cloudMessage("Profil bezpiecznie zapisany w chmurze. Można pobrać go na innym urządzeniu.");
    } else if (operation === "download") {
      const result = await cloudRequest("GET", owner);
      if (!result.profile) {
        cloudMessage("W chmurze nie ma jeszcze profilu dla tego konta. Najpierw wyślij zapisany profil.");
        return;
      }
      const remote = checkedCloudProfile(result.profile);
      if (!confirm("Zastąpić lokalny nick, zdjęcie i ustawienia profilem z chmury?")) {
        cloudMessage("Pobieranie anulowane. Lokalny profil nie został zmieniony.");
        return;
      }
      const old = loadProfile(owner);
      const next = { ...remote, createdAt: old.createdAt || new Date().toISOString() };
      localStorage.setItem(storageKey, JSON.stringify(next));
      pendingAvatarData = null;
      renderProfile(owner, next);
      cloudMessage("Pobrano profil z chmury i zapisano w tej przeglądarce.");
    } else if (operation === "delete") {
      await cloudRequest("DELETE", owner);
      cloudMessage("Usunięto profil z chmury. Lokalny profil pozostał bez zmian.");
    }
  } catch (error) {
    // Never print or expose OAuth access tokens or raw login responses.
    const code = typeof error?.errorCode === "string" ? error.errorCode.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 50) : "";
    const message = code ? "Autoryzacja Microsoft: " + code : (error?.message || "Nieznany błąd synchronizacji.");
    cloudMessage(message);
  } finally {
    cloudLock(false);
  }
}
if (cloudUpload) cloudUpload.addEventListener("click", () => void doCloudAction("upload"));
if (cloudDownload) cloudDownload.addEventListener("click", () => void doCloudAction("download"));
if (cloudDelete) cloudDelete.addEventListener("click", () => void doCloudAction("delete"));

(async () => {
  if (!btn || !logoutBtn) return;
  try {
    const msal = await createStandardPublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/consumers",
        redirectUri: REDIRECT_URI + "auth-popup.html",
        postLogoutRedirectUri: REDIRECT_URI,
        navigateToLoginRequestUrl: true
      },
      // Keep the MSAL session available when opening MINEVORA in another tab.
      // MSAL, not our profile code, manages encrypted authentication artifacts.
      cache: { cacheLocation: "localStorage" }
    });
    authClient = msal;
    const response = await msal.handleRedirectPromise();
    const signed = response?.account || msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
    if (signed) msal.setActiveAccount(signed);
    setUser(signed);
    // After a successful Microsoft redirect, show the actual account screen.
    if (response?.account && !location.hash) location.hash = "#account";
    btn.disabled = false;
    // A popup keeps the main site loaded, so a completed sign-in updates the
    // player profile immediately even if full-page redirects fail in Chrome.
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      status("Otwieram okno logowania Microsoft…");
      try {
        const response = await msal.loginPopup({ scopes: ["openid", "profile"], redirectUri: REDIRECT_URI + "auth-popup.html" });
        if (!response?.account) throw new Error("Brak konta po zalogowaniu.");
        msal.setActiveAccount(response.account);
        setUser(response.account);
        location.hash = "#account";
        document.getElementById("playerProfile")?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (e) {
        btn.disabled = false;
        const code = typeof e?.errorCode === "string" ? e.errorCode.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 70) : "";
        status("Logowanie nie powiodło się" + (code ? " (kod: " + code + ")" : " (kod: popup_unknown)") + ". Wyślij nam wyłącznie ten kod błędu, bez danych logowania.");
      }
    });
    if (redirectFallback) {
      redirectFallback.disabled = false;
      redirectFallback.addEventListener("click", async () => {
        redirectFallback.disabled = true;
        status("Przekierowuję do Microsoft…");
        try {
          await msal.loginRedirect({ scopes: ["openid", "profile"], redirectUri: REDIRECT_URI + "auth-popup.html", redirectStartPage: REDIRECT_URI + "#account" });
        } catch (e) {
          redirectFallback.disabled = false;
          const code = typeof e?.errorCode === "string" ? e.errorCode.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 70) : "";
          status("Nie udało się otworzyć Microsoft" + (code ? " (kod: " + code + ")" : " (kod: redirect_unknown)") + ". Wyślij kod błędu.");
        }
      });
    }
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try { await msal.logoutRedirect({ postLogoutRedirectUri: REDIRECT_URI }); }
      catch (_) { logoutBtn.disabled = false; status("Wylogowanie nie powiodło się. Spróbuj ponownie."); }
    });
  } catch (e) {
    if (btn) btn.disabled = true;
    const code = typeof e?.errorCode === "string" ? e.errorCode.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 70) : "init_failed";
    status("Błąd inicjalizacji Microsoft (kod: " + code + "). Nie zmieniaj ustawień Entra; prześlij ten kod.");
  }
})();