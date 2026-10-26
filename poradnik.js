/* MINEVORA - navigation within the Poradnik without disturbing the SPA hash routing. */
(() => {
  'use strict';
  document.querySelectorAll('[data-guide-target]').forEach(link => {
    link.addEventListener('click', event => {
      const target = document.getElementById(link.dataset.guideTarget);
      if (!target) return;
      event.preventDefault();
      if (location.hash !== '#poradnik') {
        location.hash = 'poradnik';
        requestAnimationFrame(() => target.scrollIntoView({behavior:'smooth',block:'start'}));
      } else target.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
})();
