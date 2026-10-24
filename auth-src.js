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
let currentUser = null;

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
  return { nickname: validNickname(proposed) ? proposed : "GraczMinevora", mode: "BedWars", color: "purple", createdAt: null };
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
      createdAt: typeof saved.createdAt === "string" && /^\\d{4}-\\d{2}-\\d{2}T/.test(saved.createdAt) ? saved.createdAt : null
    };
  } catch { return empty; }
}
function renderProfile(user, data) {
  if (playerPanel) playerPanel.hidden = !user;
  if (!user) { if (profileMessage) profileMessage.textContent = ""; return; }
  nickField.value = data.nickname;
  modeField.value = data.mode;
  colorField.value = data.color;
  document.getElementById("profileNickname").textContent = data.nickname;
  document.getElementById("profileMicrosoftName").textContent = "Konto Microsoft: " + (user.name || "Połączono");
  const avatar = document.getElementById("profileAvatar");
  avatar.textContent = data.nickname[0].toUpperCase();
  avatar.dataset.color = data.color;
  document.getElementById("profileFavorite").textContent = data.mode;
  document.getElementById("profileSince").textContent = data.createdAt ?
    new Date(data.createdAt).toLocaleDateString("pl-PL") : "Jeszcze nie zapisano";
}
function setUser(user) {
  currentUser = user || null;
  if (btn) btn.hidden = Boolean(user);
  if (logoutBtn) logoutBtn.hidden = !user;
  if (profile) {
    profile.textContent = user ? "Zalogowano jako: " + (user.name || "Konto Microsoft") : "";
    profile.hidden = !user;
  }
  if (badge) badge.textContent = user ? "ZALOGOWANO" : "GOŚĆ";
  if (homeCard) homeCard.textContent = user ? "Konto Microsoft połączone na tej stronie" : "Zaloguj przez Microsoft bez dodatkowego hasła";
  status(user ? "Sesja Microsoft aktywna na stronie MINEVORA." : "Nie jesteś zalogowany.");
  if (playerPanel) renderProfile(user, user ? loadProfile(user) : null);
}
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
    createdAt: previous.createdAt || new Date().toISOString()
  };
  try {
    localStorage.setItem(key, JSON.stringify(data));
    renderProfile(currentUser, data);
    profileMessage.textContent = "Profil zapisany w tej przeglądarce. Synchronizacja z launcherem wymaga serwera kont.";
  } catch { profileMessage.textContent = "Nie udało się zapisać danych w tej przeglądarce."; }
});
if (resetButton) resetButton.addEventListener("click", () => {
  if (!currentUser || !confirm("Usunąć zapisany na tym urządzeniu nick, tryb i kolor avatara?")) return;
  const key = accountStorageKey(currentUser);
  try {
    if (key) localStorage.removeItem(key);
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
      cache: { cacheLocation: "sessionStorage" }
    });
    const response = await msal.handleRedirectPromise();
    const signed = response?.account || msal.getActiveAccount() || msal.getAllAccounts()[0] || null;
    if (signed) msal.setActiveAccount(signed);
    setUser(signed);
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