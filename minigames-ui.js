(()=>{
  'use strict';
  const info = {"bedwars": ["BedWars", "Przejmuj wyspy, zabezpieczaj łóżko i walcz zespołowo."], "skywars": ["SkyWars", "Rywalizacja na podniebnych wyspach i szybkie pojedynki."], "crystal-pvp": ["Crystal PvP", "Tryb szybkich pojedynków nastawiony na Crystal PvP."], "parkour": ["Parkour", "Tory zręcznościowe, skoki i wyzwania na czas."], "tnt-run": ["TNT Run", "Biegaj po arenie i unikaj bloków, które znikają pod stopami."], "build-battle": ["Build Battle", "Rywalizuj kreatywnie i buduj na wylosowany temat."], "spleef": ["Spleef", "Zbijaj bloki pod rywalami, żeby pozostać na arenie."], "duels": ["Duels", "Sprawdź swoje umiejętności w pojedynkach jeden na jednego."]};
  const dialog=document.getElementById('mvModeDialog');
  if(!dialog)return;
  const nameNode=document.getElementById('mvModeTitle');
  const descriptionNode=document.getElementById('mvModeDescription');
  const imageNode=document.getElementById('mvDialogImage');
  document.querySelectorAll('.mv-mode-card[data-mode]').forEach(card=>{
    card.addEventListener('click',()=>{
      const slug=card.dataset.mode;
      if(!Object.prototype.hasOwnProperty.call(info,slug))return;
      nameNode.textContent=info[slug][0];
      descriptionNode.textContent=info[slug][1]+ ' Serwer MINEVORA jest nadal w przygotowaniu.';
      imageNode.src='assets/minigames/'+slug+'.webp';
      if(typeof dialog.showModal==='function')dialog.showModal();
      else dialog.setAttribute('open','');
    });
  });
  document.getElementById('mvDialogClose')?.addEventListener('click',()=>dialog.close?.());
  dialog.addEventListener('click', e=>{if(e.target===dialog)dialog.close?.()});
  window.addEventListener('hashchange',()=>{if(dialog.open)dialog.close?.()});
})();
