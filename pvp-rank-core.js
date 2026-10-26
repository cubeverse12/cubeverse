/* MINEVORA PvP — pure local demonstration score logic, NOT a server ranking. */
(function(root, factory){
  'use strict';
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.MinevoraPvPRanks=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const MODES=Object.freeze({
    classic:{name:'Klasyczne PvP',description:'Pojedynki jeden na jednego, klasyczny ekwipunek i dynamiczne starcia na arenie.'},
    crystal:{name:'Crystal PvP',description:'Zapowiedziane pojedynki z wykorzystaniem kryształów Endu, pozycji i refleksu.'},
    sword:{name:'Sword PvP',description:'Walki na miecze, kontrola dystansu i wyczucie czasu ataków.'},
    axe:{name:'Axe PvP',description:'Taktyka topora, tarczy i dobrze wymierzonych ataków.'},
    uhc:{name:'UHC PvP',description:'Elementy przetrwania, ograniczone zasoby i walka o zwycięstwo.'}
  });
  const TIERS=Object.freeze([
    {name:'REKRUT',threshold:0,color:'#9eaed8',shine:'#f1f5ff',icon:'✧'},
    {name:'BRĄZ',threshold:120,color:'#b97648',shine:'#ffda9f',icon:'◆'},
    {name:'SREBRO',threshold:300,color:'#b4cde4',shine:'#fff',icon:'❖'},
    {name:'ZŁOTO',threshold:560,color:'#f1b341',shine:'#fff3aa',icon:'★'},
    {name:'DIAMENT',threshold:900,color:'#49d7f2',shine:'#b6faff',icon:'✦'},
    {name:'MISTRZ',threshold:1400,color:'#a475ff',shine:'#edceff',icon:'♛'},
    {name:'LEGENDA',threshold:2000,color:'#fa69ce',shine:'#ffe2fa',icon:'✹'}
  ]);
  function clampPoints(points){const n=Number(points);return Number.isFinite(n)?Math.max(0,Math.min(999999,Math.floor(n))):0;}
  function getTier(points){const p=clampPoints(points);let index=0;for(let i=0;i<TIERS.length;i++)if(p>=TIERS[i].threshold)index=i;return index;}
  function getProgress(points){const p=clampPoints(points),index=getTier(p),tier=TIERS[index],next=TIERS[index+1]||null;
    const percent=next?Math.round((p-tier.threshold)/(next.threshold-tier.threshold)*100):100;
    return {index,tier,next,points:p,percent,missing:next?next.threshold-p:0};
  }
  function applyMatch(points,result){
    const before=getProgress(points);
    if(result!=='win'&&result!=='loss')return {...before,before:before.index,promoted:false};
    const after=getProgress(before.points+(result==='win'?40:-15));
    return {...after,before:before.index,promoted:after.index>before.index};
  }
  function demoSeed(mode){if(!Object.prototype.hasOwnProperty.call(MODES,mode))return 95;return mode==='classic'?95:mode==='crystal'?277:mode==='sword'?525:mode==='axe'?87:875;}
  return Object.freeze({MODES,TIERS,clampPoints,getTier,getProgress,applyMatch,demoSeed});
});
