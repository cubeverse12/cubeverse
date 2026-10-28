const menu=document.getElementById('toggle-menu');const nav=document.getElementById('site-nav');
menu?.addEventListener('click',()=>{const open=nav.classList.toggle('show');menu.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('show');menu?.setAttribute('aria-expanded','false');}));
const links=[...nav.querySelectorAll('a')];const observer=new IntersectionObserver(entries=>{for(const e of entries){if(e.isIntersecting){links.forEach(l=>l.classList.toggle('active',l.hash==='#'+e.target.id));}}},{rootMargin:'-15% 0px -70% 0px'});document.querySelectorAll('main section[id]').forEach(s=>observer.observe(s));
