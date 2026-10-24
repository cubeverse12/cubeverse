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
function setUser(user) {
  if (btn) btn.hidden = Boolean(user);
  if (logoutBtn) logoutBtn.hidden = !user;
  if (profile) { profile.textContent = user ? "Zalogowano jako: " + (user.name || user.username || "Konto Microsoft") : ""; profile.hidden = !user; }
  if (badge) badge.textContent = user ? "ZALOGOWANO" : "GOŚĆ";
  if (homeCard) homeCard.textContent = user ? "Konto Microsoft połączone na tej stronie" : "Zaloguj przez Microsoft bez dodatkowego hasła";
  status(user ? "Sesja Microsoft aktywna na stronie MINEVORA." : "Nie jesteś zalogowany.");
}
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