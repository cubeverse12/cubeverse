/* Accessible mobile navigation for MINEVORA Pages. No changes to desktop launcher routing. */
(() => {
  'use strict';
  if (!document.querySelector('.mv-mobile-menu-toggle')) return;
  const openButton = document.getElementById('mvMobileMenuOpen');
  const closeButton = document.getElementById('mvMobileMenuClose');
  const backdrop = document.getElementById('mvMobileScrim');
  const sidebar = document.getElementById('mvSiteSidebar');
  if (!openButton || !closeButton || !backdrop || !sidebar) return;
  const isMobile = () => window.matchMedia('(max-width:919px)').matches;
  const isDesktopApp = () => document.body.classList.contains('mv-desktop-mode');
  let previouslyFocused = null;
  function setOpen(open, restoreFocus = true) {
    const show = Boolean(open && isMobile() && !isDesktopApp());
    if (show) previouslyFocused = document.activeElement;
    document.body.classList.toggle('mv-mobile-nav-open', show);
    openButton.setAttribute('aria-expanded', String(show));
    sidebar.setAttribute('aria-hidden', String(!show && isMobile()));
    if (show) closeButton.focus();
    else if (restoreFocus && previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
  }
  if (isMobile() && !isDesktopApp()) sidebar.setAttribute('aria-hidden', 'true');
  openButton.addEventListener('click', () => setOpen(true));
  closeButton.addEventListener('click', () => setOpen(false));
  backdrop.addEventListener('click', () => setOpen(false));
  sidebar.addEventListener('click', e => {if (e.target.closest('a')) setOpen(false, false);});
  window.addEventListener('hashchange', () => setOpen(false, false));
  window.addEventListener('resize', () => {
    if (!isMobile() || isDesktopApp()) setOpen(false, false);
    sidebar.removeAttribute('aria-hidden');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && document.body.classList.contains('mv-mobile-nav-open')) setOpen(false);
    if (e.key !== 'Tab' || !document.body.classList.contains('mv-mobile-nav-open')) return;
    const focusables = [...sidebar.querySelectorAll('button:not([disabled]),a[href]')];
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {e.preventDefault();last.focus();}
    else if (!e.shiftKey && document.activeElement === last) {e.preventDefault();first.focus();}
  });
})();
