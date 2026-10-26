/* PvP Mode: accessible local demonstration, no real-server stats or play/queue action. */
(()=>{
  'use strict';
  const core=window.MinevoraPvPRanks;
  if(!core)return;
  const $=id=>document.getElementById(id);
  if(!$('pvRankMode'))return;
  const STORAGE_KEY='minevora-pvp-v2-demo-only';
  const MODE_KEYS=Object.keys(core.MODES);
  let chosenMode='classic';
  let state=loadDemo();
  function loadDemo(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
      if(saved && saved.version===1 && saved.points && typeof saved.points==='object'){
        const points={};
        for(const mode of MODE_KEYS)points[mode]=Object.prototype.hasOwnProperty.call(saved.points,mode)?core.clampPoints(saved.points[mode]):core.demoSeed(mode);
        return {version:1,points};
      }
    }catch(_e){}
    return {version:1,points:Object.fromEntries(MODE_KEYS.map(mode=>[mode,core.demoSeed(mode)]))};
  }
  function saveDemo(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}catch(_e){/* private or restricted browser mode */}}
  function modeTitle(mode){return core.MODES[mode]?.name||core.MODES.classic.name}
  function setMode(mode){
    if(!Object.prototype.hasOwnProperty.call(core.MODES,mode))return;
    chosenMode=mode;
    $('pvRankMode').value=mode;
    document.querySelectorAll('[data-pvp-mode]').forEach(btn=>{
      const selected=btn.dataset.pvpMode===mode;
      btn.classList.toggle('active',selected);
      btn.setAttribute('aria-pressed',String(selected));
    });
    $('pvSelectedMode').textContent=modeTitle(mode);
    $('pvSelectedDescription').textContent=core.MODES[mode].description+' Tryb planowany na przyszłość.';
    $('pvCurrentModeLabel').textContent=modeTitle(mode);
    render();
  }
  function render(){
    const progress=core.getProgress(state.points[chosenMode]);
    const rankNode=$('pvRankEmblem'),tier=progress.tier;
    rankNode.style.setProperty('--rank-color',tier.color);
    rankNode.style.setProperty('--rank-shine',tier.shine);
    rankNode.dataset.rank=String(progress.index);
    $('pvRankIcon').textContent=tier.icon;
    $('pvRankName').textContent=tier.name;
    $('pvRankPoints').textContent=progress.points.toLocaleString('pl-PL')+' RP';
    $('pvNextRankText').textContent=progress.next?'Do rangi '+progress.next.name+': '+progress.missing+' RP':'Najwyższa dostępna ranga!';
    $('pvRankLow').textContent=tier.name;
    $('pvRankHigh').textContent=progress.next?.name||'MAX • LEGENDA';
    $('pvProgressFill').style.width=progress.percent+'%';
    $('pvRankProgress').setAttribute('aria-valuenow',String(progress.percent));
    renderTiers(progress.index);
    renderLeaderboard(progress.points);
  }
  function renderTiers(active){
    const parent=$('pvRankTiers');parent.replaceChildren();
    for(let i=0;i<core.TIERS.length;i++){
      const tier=core.TIERS[i];
      const item=document.createElement('div');item.className='pv-tier';
      item.dataset.current=String(i===active);
      item.style.setProperty('--tier-color',tier.color);
      const icon=document.createElement('span');icon.className='pv-tier-symbol';icon.textContent=tier.icon;
      const name=document.createElement('strong');name.textContent=tier.name;
      const threshold=document.createElement('small');threshold.textContent=tier.threshold+' RP';
      item.append(icon,name,threshold);parent.append(item);
    }
  }
  function examplePlayers(mode){
    // All players below are named as fictional test accounts to prevent confusion.
    const offs={classic:0,crystal:115,sword:240,axe:15,uhc:320}[mode]||0;
    return [
      {name:'Testowy_Gracz_01',points:1240+offs},
      {name:'Testowy_Gracz_02',points:1040+offs},
      {name:'Testowy_Gracz_03',points:920+offs},
      {name:'Testowy_Gracz_04',points:645+offs},
      {name:'Testowy_Gracz_05',points:425+offs},
      {name:'Testowy_Gracz_06',points:275+offs},
      {name:'Testowy_Gracz_07',points:120+offs}
    ];
  }
  function renderLeaderboard(points){
    const people=[...examplePlayers(chosenMode),{name:'TY · DEMO',points,self:true}].sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name));
    const podium=$('pvPodium');podium.replaceChildren();
    // Podium visually sorted in a second / first / third arrangement.
    for(const place of [2,1,3]){
      const p=people[place-1];
      const card=document.createElement('div');card.className='pv-podium-person';card.dataset.place=String(place);
      const medal=document.createElement('span');medal.className='pv-podium-medal';medal.textContent=['🥇','🥈','🥉'][place-1];
      const name=document.createElement('strong');name.textContent=p.name;
      const score=document.createElement('span');score.textContent=p.points.toLocaleString('pl-PL')+' RP';
      card.append(medal,name,score);podium.append(card);
    }
    const rows=$('pvLeaderRows');rows.replaceChildren();
    people.forEach((person,index)=>{
      if(index<3&&!person.self)return;
      const row=document.createElement('div');row.className='pv-leader-row';if(person.self)row.dataset.self='true';
      const rank=document.createElement('span');rank.className='pv-leader-index';rank.textContent='#'+(index+1);
      const name=document.createElement('strong');name.textContent=person.name;
      const score=document.createElement('span');score.textContent=person.points.toLocaleString('pl-PL')+' RP';
      row.append(rank,name,score);rows.append(row);
    });
  }
  const modal=$('pvPromotionDialog');
  const particles=$('pvPromoteParticles');
  function showPromotion(tier,preview){
    if(!tier||!modal)return;
    $('pvPromoteTitle').textContent=tier.name+'!';
    $('pvPromoteDescription').textContent=preview?'Podgląd animacji awansu — bez zmiany punktów.':'Gratulacje! Awans w lokalnej symulacji PvP.';
    const shield=$('pvPromoteShield');
    shield.style.setProperty('--promo-color',tier.color);
    shield.style.setProperty('--promo-shine',tier.shine);
    $('pvPromoteSymbol').textContent=tier.icon;
    particles.replaceChildren();
    for(let i=0;i<42;i++){
      const particle=document.createElement('i');
      // Deterministic, evenly dispersed decorations; not data-driven from users.
      particle.style.setProperty('--x',((i*47)%100)+'%');
      particle.style.setProperty('--size',(3+i%6)+'px');
      particle.style.setProperty('--rot',((i*29)%180)+'deg');
      particle.style.setProperty('--duration',(2+(i%5)*.29)+'s');
      particle.style.setProperty('--delay',(-.15*(i%13))+'s');
      particle.style.setProperty('--color',i%3===0?'#d4b1ff':i%3===1?tier.color:'#87e2ff');
      particles.append(particle);
    }
    if(typeof modal.showModal==='function'){
      if(!modal.open)modal.showModal();
    }else{modal.setAttribute('open','');}
  }
  function closePromotion(){if(typeof modal.close==='function'&&modal.open)modal.close();else modal.removeAttribute('open')}
  function match(kind){
    const before=state.points[chosenMode];
    const result=core.applyMatch(before,kind);
    state.points[chosenMode]=result.points;
    saveDemo();render();
    const delta=result.points-before;
    $('pvStatus').textContent=(kind==='win'?'Zwycięstwo (demo): ':'Porażka (demo): ')+(delta>0?'+':'')+delta+' RP. To tylko lokalna symulacja, nie prawdziwy mecz.';
    if(result.promoted)showPromotion(result.tier,false);
  }
  document.querySelectorAll('[data-pvp-mode]').forEach(button=>button.addEventListener('click',()=>setMode(button.dataset.pvpMode)));
  $('pvRankMode').addEventListener('change',event=>setMode(event.target.value));
  $('pvDemoWin').addEventListener('click',()=>match('win'));
  $('pvDemoLoss').addEventListener('click',()=>match('loss'));
  $('pvResetDemo').addEventListener('click',()=>{
    state={version:1,points:Object.fromEntries(MODE_KEYS.map(mode=>[mode,core.demoSeed(mode)]))};
    saveDemo();render();
    $('pvStatus').textContent='Zresetowano dane lokalnej symulacji. Nie zmieniono żadnego wyniku serwera.';
  });
  $('pvPreviewPromotion').addEventListener('click',()=>{
    const progress=core.getProgress(state.points[chosenMode]);
    showPromotion(progress.next||progress.tier,true);
  });
  $('pvPromotionClose').addEventListener('click',closePromotion);
  modal.addEventListener('click',event=>{if(event.target===modal)closePromotion()});
  window.addEventListener('hashchange',()=>{if(modal.open)closePromotion()});
  setMode('classic');
})();
