// MINEVORA: Microsoft sign-in on GitHub Pages using MSAL Browser (auth code + PKCE).
// This frontend does not store Minecraft tokens or create a server-side MINEVORA profile.
import { PublicClientApplication } from "@azure/msal-browser";
const CLIENT_ID = "72a4154b-5254-4c4b-958f-0a5181a0ad93";
const REDIRECT_URI = "https://cubeverse12.github.io/cubeverse/";
const btn = document.getElementById("msalLogin");
const logoutBtn = document.getElementById("msalLogout");
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
    profileMessage.textContent = "Profil zapisany w tej przeglądarce. Synchronizacja z launcherem wymaga serwera kont.";
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
(async () => {
  if (!btn || !logoutBtn) return;
  try {
    const msal = await PublicClientApplication.createPublicClientApplication({
      auth: {
        clientId: CLIENT_ID,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: REDIRECT_URI,
        postLogoutRedirectUri: REDIRECT_URI,
        navigateToLoginRequestUrl: false
      },
      // Keep the MSAL session available when opening MINEVORA in another tab.
      // MSAL, not our profile code, manages encrypted authentication artifacts.
      cache: { cacheLocation: "localStorage" }
    });
    const response = await msal.handleRedirectPromise();
    const signed = response?.account || msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
    if (signed) msal.setActiveAccount(signed);
    setUser(signed);
    // After a successful Microsoft redirect, show the actual account screen.
    if (response?.account && !location.hash) location.hash = "#account";
    btn.disabled = false;
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      status("Otwieram bezpieczne logowanie Microsoft…");
      try {
        await msal.loginRedirect({ scopes: ["openid", "profile"], redirectStartPage: REDIRECT_URI + "#account" });
      } catch (_) {
        btn.disabled = false;
        status("Nie udało się rozpocząć logowania. Sprawdź ustawienia aplikacji Microsoft.");
      }
    });
    logoutBtn.addEventListener("click", async () => {
      logoutBtn.disabled = true;
      try { await msal.logoutRedirect({ postLogoutRedirectUri: REDIRECT_URI }); }
      catch (_) { logoutBtn.disabled = false; status("Wylogowanie nie powiodło się. Spróbuj ponownie."); }
    });
  } catch (e) {
    if (btn) btn.disabled = true;
    status("Logowanie Microsoft jest chwilowo niedostępne. Sprawdź, czy aplikacja w Entra obsługuje osobiste konta Microsoft.");
  }
})();