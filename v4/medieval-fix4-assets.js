/* Optional asset deployment: retain existing valid imagery until files are published. */
(()=>{const current=document.currentScript;const base=new URL("assets/",current.src);const banner=new URL("minevora-banner-rc32-fix4.webp",base);const logo=new URL("minevora-logo-rc32-fix4.png",base);
const captions={pl:"Kolorowy wilk w zbroi, zamek i leśny krajobraz — grafika z RC32 Medieval FIX 4. Podgląd ilustracji, nie zrzut aplikacji.",en:"Full-colour armoured wolf, castle and forest landscape from RC32 Medieval FIX 4. Artwork preview, not an app screenshot."};
const load=(url,ready)=>{const i=new Image();i.onload=()=>ready(url.href,i);i.src=url.href};
document.addEventListener("DOMContentLoaded",()=>{
 const setCaption=()=>{const c=document.querySelector("[data-medieval-caption]");if(c&&c.dataset.loaded==="yes")c.textContent=captions[document.documentElement.lang==="en"?"en":"pl"]};
 load(banner,(url,i)=>{for(const el of document.querySelectorAll("[data-medieval-banner]")){el.src=url;el.width=i.naturalWidth;el.height=i.naturalHeight;el.alt="MINEVORA — Medieval Forest";}const c=document.querySelector("[data-medieval-caption]");if(c){c.dataset.loaded="yes";setCaption();}});
 load(logo,url=>{for(const el of document.querySelectorAll('img[src*="minevora-app-icon-launcher-1-56-12.png"]')){if(!el.closest("#archiwum-wygladu"))el.src=url;}for(const el of document.querySelectorAll('link[rel="icon"],link[rel="apple-touch-icon"]'))el.href=url;});
 document.addEventListener("minevora:languagechange",setCaption);
});})();
