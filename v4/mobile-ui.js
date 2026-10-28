/* MINEVORA — mobile layout/controller for narrow and desktop-site Android browsers. */
(function(){
  'use strict';
  var body=document.body, sidebar=document.querySelector('.sidebar'),topbar=document.querySelector('.topbar');
  var shell=document.querySelector('.shell'),main=document.querySelector('.middle');
  if(!body || !sidebar || !topbar || !shell || !main)return;
  var mobilebar=topbar.querySelector('.mv-mobilebar');
  if(!mobilebar){
    mobilebar=document.createElement('div');
    mobilebar.className='mv-mobilebar';
    mobilebar.innerHTML='<button type="button" class="mv-menu-toggle" aria-expanded="false" aria-controls="mv-site-sidebar" aria-label="Otwórz menu MINEVORA">☰</button>'+
       '<a href="#start" class="mv-mobile-brand" aria-label="MINEVORA — Start"><img src="../assets/minevora_crystal_logo.svg" alt="MINEVORA"></a>'+
       '<a href="#pobierz" class="mv-mobile-download">Pobierz</a>';
    topbar.insertBefore(mobilebar,topbar.firstChild);
  }
  sidebar.id='mv-site-sidebar';
  var toggle=mobilebar.querySelector('.mv-menu-toggle');
  var close=sidebar.querySelector('.mv-nav-close');
  if(!close){
    close=document.createElement('button');
    close.type='button';
    close.className='mv-nav-close';
    close.textContent='×';
    close.setAttribute('aria-label','Zamknij menu MINEVORA');
    sidebar.insertBefore(close,sidebar.firstChild);
  }
  var scrim=document.querySelector('.mv-menu-backdrop');
  if(!scrim){
    scrim=document.createElement('button');
    scrim.type='button';
    scrim.className='mv-menu-backdrop';
    scrim.setAttribute('aria-label','Zamknij menu');
    scrim.hidden=true;
    sidebar.insertAdjacentElement('afterend',scrim);
  }
  var hero=main.querySelector('.hero');
  if(hero){
    if(!hero.querySelector('.mv-hero-eyebrow')){
      var eyebrow=document.createElement('div');
      eyebrow.className='mv-hero-eyebrow';
      eyebrow.textContent='TWÓJ ŚWIAT. TWOJE ZASADY.';
      hero.insertBefore(eyebrow,hero.querySelector('.hero-bottom'));
    }
    if(!hero.querySelector('.mv-hero-tagline')){
      var tagline=document.createElement('p');
      tagline.className='mv-hero-tagline';
      tagline.textContent='Wybierz profil, poznaj funkcje i rozpocznij przygodę w MINEVORA.';
      hero.insertBefore(tagline,hero.querySelector('.hero-bottom'));
    }
  }
  var cards=main.querySelector('.cards');
  if(cards&&!main.querySelector('.mv-feature-heading')){
    var h=document.createElement('div');
    h.className='mv-feature-heading';
    h.innerHTML='<div><span>ODKRYWAJ MINEVORA</span><div><strong>Wybierz swoją przygodę</strong></div></div>'+
      '<a href="#minigry">Poznaj minigry →</a>';
    cards.insertAdjacentElement('beforebegin',h);
  }
  function compact(){
    var viewport=window.innerWidth || 1000;
    var coarse=window.matchMedia && window.matchMedia('(pointer:coarse)').matches;
    var touch=(navigator.maxTouchPoints||0)>0 || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');
    var shortScreen=Math.min((window.screen&&window.screen.width)||2000,(window.screen&&window.screen.height)||2000);
    return viewport<=800 || ((coarse||touch) && (viewport<=1600 || shortScreen<=1000));
  }
  function showMenu(open,returnFocus){
    var useMobile=body.classList.contains('mv-compact');
    var active=Boolean(open && useMobile);
    body.classList.toggle('mv-menu-open',active);
    scrim.hidden=!active;
    toggle.setAttribute('aria-expanded',String(active));
    toggle.setAttribute('aria-label',active?'Zamknij menu MINEVORA':'Otwórz menu MINEVORA');
    if(useMobile)sidebar.inert=!active;else sidebar.inert=false;
    if(active){
      close.focus({preventScroll:true});
    } else if(returnFocus && useMobile){
      toggle.focus({preventScroll:true});
    }
  }
  function update(){
    var shouldCompact=compact();
    body.classList.toggle('mv-compact',shouldCompact);
    /* Chrome Android w trybie "wersja na komputer" raportuje szeroki viewport.
       Zastosuj wciąż czytelne karty telefonu na małym ekranie dotykowym. */
    var w=window.innerWidth||1000;
    var minScreen=Math.min((window.screen&&window.screen.width)||2000,(window.screen&&window.screen.height)||2000);
    var coarse=Boolean(window.matchMedia&&window.matchMedia('(pointer:coarse)').matches);
    var mobileUA=/Android.*Mobile|iPhone|iPod/i.test(navigator.userAgent||'');
    var phone=shouldCompact && (w<=580 || (mobileUA&&minScreen<=1100) || (coarse&&minScreen<=1024&&w<=1200));
    body.classList.toggle('mv-phone',phone);
    if(!shouldCompact && body.classList.contains('mv-menu-open'))showMenu(false,false);
    sidebar.inert=shouldCompact && !body.classList.contains('mv-menu-open');
  }
  toggle.addEventListener('click',function(){showMenu(!body.classList.contains('mv-menu-open'),true)});
  close.addEventListener('click',function(){showMenu(false,true)});
  scrim.addEventListener('click',function(){showMenu(false,true)});
  sidebar.addEventListener('click',function(ev){
    var link=ev.target.closest('a');
    if(link && body.classList.contains('mv-compact')) showMenu(false,false);
  });
  window.addEventListener('hashchange',function(){if(body.classList.contains('mv-menu-open'))showMenu(false,false)});
  window.addEventListener('keydown',function(ev){
    if(ev.key==='Escape' && body.classList.contains('mv-menu-open'))showMenu(false,true);
    if(ev.key==='Tab' && body.classList.contains('mv-menu-open')){
      var focusable=[...sidebar.querySelectorAll('a[href],button:not([disabled])')].filter(function(x){return x.getClientRects().length});
      if(!focusable.length)return;
      var first=focusable[0],last=focusable[focusable.length-1];
      if(ev.shiftKey && document.activeElement===first){ev.preventDefault();last.focus()}
      else if(!ev.shiftKey && document.activeElement===last){ev.preventDefault();first.focus()}
    }
  });
  var resizeScheduled=false;
  window.addEventListener('resize',function(){
    if(resizeScheduled)return;
    resizeScheduled=true;
    window.requestAnimationFrame(function(){resizeScheduled=false;update()});
  },{passive:true});
  update();
})();
