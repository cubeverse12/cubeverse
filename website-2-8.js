/* MINEVORA 2.8: visual preview only, no billing or login. */
(()=>{'use strict';
  const preview=document.getElementById('mv28ThemePreview');
  const label=document.getElementById('mv28ThemeTitle');
  const buttons=[...document.querySelectorAll('[data-mv28-theme]')];
  if (!preview || !label || !buttons.length) return;
  const allowed={nebula:'NEBULA',ocean:'OCEAN',ember:'EMBER'};
  for(const button of buttons){
    button.addEventListener('click',()=>{
      const value=button.getAttribute('data-mv28-theme');
      if(!Object.hasOwn(allowed,value))return;
      preview.dataset.theme=value;
      label.textContent=allowed[value];
      for(const b of buttons)b.setAttribute('aria-pressed',String(b===button));
    });
  }
})();
