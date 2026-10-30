/* MINEVORA 3.0.20: interactive website-only appearance preview.
   No Minecraft launcher settings, accounts or files are changed here. */
(()=>{
  "use strict";
  const shell=document.querySelector(".app-shell");
  const themeButtons=[...document.querySelectorAll("[data-preview-theme]")];
  const compact=document.querySelector("[data-preview-compact]");
  const motion=document.querySelector("[data-preview-motion]");
  if(!shell||themeButtons.length!==2||!compact||!motion)return;
  const reduced=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const state={theme:"neon",compact:false,motion:!reduced};
  const update=()=>{
    shell.classList.toggle("is-soft",state.theme==="soft");
    shell.classList.toggle("is-compact",state.compact);
    shell.classList.toggle("is-animated",state.motion&&!reduced);
    themeButtons.forEach(btn=>btn.setAttribute("aria-pressed",String(btn.dataset.previewTheme===state.theme)));
    compact.setAttribute("aria-pressed",String(state.compact));
    motion.setAttribute("aria-pressed",String(state.motion&&!reduced));
    motion.textContent=state.motion&&!reduced?"Animacje: włączone":"Animacje: wyłączone";
  };
  themeButtons.forEach(btn=>btn.addEventListener("click",()=>{
    state.theme=btn.dataset.previewTheme==="soft"?"soft":"neon";
    update();
  }));
  compact.addEventListener("click",()=>{state.compact=!state.compact;update();});
  motion.addEventListener("click",()=>{if(reduced)return;state.motion=!state.motion;update();});
  if(reduced){motion.disabled=true;motion.title="Animacje są ograniczone przez ustawienia dostępności systemu.";}
  update();
})();

/* Only the public site preview changes. This does not control the actual mod. */
(()=>{
  "use strict";
  const button=document.querySelector("[data-demo-hud-toggle]");
  const preview=document.querySelector("[data-demo-hud-preview]");
  if(!button||!preview)return;
  let showing=true;
  button.addEventListener("click",()=>{
    showing=!showing;
    preview.dataset.hud=showing?"on":"off";
    button.setAttribute("aria-pressed",String(showing));
    button.textContent=showing?"Ukryj HUD (podgląd)":"Pokaż HUD (podgląd)";
  });
})();
