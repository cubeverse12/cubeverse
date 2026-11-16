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
