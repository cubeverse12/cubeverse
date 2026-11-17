/* Replace legacy typographic feature symbols with consistent scalable icons. */
(() => {
  const paths = [
    '<path d="m9 6 10 6-10 6V6Z"/><rect x="3" y="3" width="18" height="18" rx="5"/>',
    '<path d="M8 3h4v3a2 2 0 1 0 4 0V3h5v6h-2a2 2 0 1 0 0 4h2v8h-6v-2a2 2 0 1 0-4 0v2H3v-8h2a2 2 0 1 0 0-4H3V3h5z"/>',
    '<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    '<rect x="6" y="3" width="12" height="18" rx="2"/><rect x="9" y="6" width="6" height="7" rx="1"/><path d="M9 17h6"/>',
    '<circle cx="12" cy="8" r="4"/><path d="M4 21v-3a7 7 0 0 1 16 0v3M7 21h10"/>',
    '<path d="M12 21 4 14a5 5 0 0 1 7-7l1 1 1-1a5 5 0 0 1 7 7z"/>',
    '<path d="M12 2 4 6v6c0 5 3 8 8 10 5-2 8-5 8-10V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    '<path d="M4 5h16v14H4zM8 9h8M8 13h8M8 17h4"/>'
  ];
  const icons = document.querySelectorAll('#funkcje .feature .feature-icon');
  icons.forEach((node,i) => {
    const path=paths[i];
    if (!path) return;
    node.innerHTML='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">'+path+'</svg>';
  });
  document.querySelectorAll('img[src*="minevora-icon-20261028.webp"]').forEach(image => {
    image.src = (image.getAttribute('src').startsWith('../')?'../':'./')+'assets/minevora-wolf-20261116.svg';
  });
  document.documentElement.classList.add('mv-visual-refresh-20261116');
})();


/* Unified 2026 navigation, preview and category pictograms. */
(() => {
  const outlines = {
    play:'<path d="M8 5.5 19 12 8 18.5z"/>',
    instance:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M7 9h10M7 13h7"/>',
    mods:'<path d="M9 3h6v4h4v6h-4v8H9v-8H5V7h4z"/>',
    modpacks:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5"/>',
    datapacks:'<path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7"/>',
    shaders:'<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/>',
    resourcepacks:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10"/>',
    skin:'<circle cx="12" cy="7" r="3"/><path d="M8 11h8l3 4-3 2-2-3v7h-4v-7l-2 3-3-2z"/>',
    servers:'<rect x="4" y="3" width="16" height="8" rx="2"/><rect x="4" y="13" width="16" height="8" rx="2"/><circle cx="8" cy="7" r="1"/><circle cx="8" cy="17" r="1"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="m10 2 4 0 .8 3 2 1 2.6-1.4 2 3.4-2.3 2 .1 3 2.2 2-2 3.4-2.6-1.3-2 1-.8 2.9h-4l-.8-3-2-1-2.6 1.4-2-3.4 2.3-2-.1-3-2.2-2 2-3.4L7.2 6l2-1z"/>'
  };
  const makeIcon = name => '<svg class="mv-new-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">'+(outlines[name]||outlines.instance)+'</svg>';
  const categories=['mods','modpacks','datapacks','shaders','resourcepacks'];
  document.querySelectorAll('.mv-addon-grid .mv-addon').forEach((a,i) => {
    const svg=a.querySelector('svg');
    if(svg && categories[i]) svg.outerHTML=makeIcon(categories[i]);
  });
  const rail=['play','instance','mods','modpacks','servers','instance','settings'];
  document.querySelectorAll('.app-shell .app-rail > span').forEach((el,i)=>{
    el.innerHTML=makeIcon(rail[i]||'instance');
  });
  const previewIcons=['modpacks','mods','modpacks','shaders'];
  document.querySelectorAll('.app-shell .preview-thumb').forEach((el,i)=>{
    el.innerHTML=makeIcon(previewIcons[i]||'modpacks');
  });
  const studio=document.querySelector('#skin-studio .visual-note');
  if(studio)studio.textContent='Wizualizacja koncepcyjna, nie rzeczywisty zrzut ekranu. Podgląd 3D należy sprawdzić w aplikacji Windows.';
  document.querySelectorAll('.mvg-category-grid .mvg-symbol').forEach((el,i)=>{
    if(categories[i]) el.innerHTML=makeIcon(categories[i]);
  });
  document.documentElement.dataset.visualBuild='20261116-complete';
})();
