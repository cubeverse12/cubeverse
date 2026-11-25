/* Interactive PvP HUD tile layout demo on the website only.
   The actual Fabric mod stores independent layout preferences in Minecraft config. */
(()=>{
  "use strict";
  const scene=document.querySelector(".pvp-demo-v215");
  const reset=document.querySelector("[data-demo-hud-reset]");
  const cancelActive=new Map();
  if(!scene || !reset)return;
  const defaults={fps:[.03,.18],cps:[.03,.35],combo:[.94,.18],armor:[.03,.76],potions:[.94,.76]};
  const tiles=Array.from(scene.querySelectorAll("[data-demo-hud-tile]"));
  // Keep invisible HUD tiles out of keyboard navigation and screen readers.
  // The hide/show control only changes this website preview, never the Minecraft mod.
  const syncTileVisibility=()=>{
    const hidden=scene.dataset.hud==="off";
    for(const tile of tiles){
      if(hidden)cancelActive.get(tile)?.();
      tile.disabled=hidden;
      tile.setAttribute("aria-hidden",String(hidden));
    }
  };
  new MutationObserver(syncTileVisibility).observe(scene,{
    attributes:true,attributeFilter:["data-hud"]
  });
  syncTileVisibility();

  const storageKey="minevora_pvp_demo_positions_v215";
  const clamp=(v)=>Math.max(0,Math.min(1,v));
  const positions={};
  try{
    const stored=JSON.parse(localStorage.getItem(storageKey)||"{}");
    for(const tile of tiles){
      const key=tile.dataset.demoHudTile;
      const arr=stored[key];
      positions[key]=Array.isArray(arr)&&arr.length===2&&arr.every(n=>Number.isFinite(n))
        ? [clamp(arr[0]),clamp(arr[1])] : defaults[key].slice();
    }
  }catch{
    for(const tile of tiles)positions[tile.dataset.demoHudTile]=defaults[tile.dataset.demoHudTile].slice();
  }
  const maxOffsets=(tile)=>[
    Math.max(0,scene.clientWidth-tile.offsetWidth),
    Math.max(0,scene.clientHeight-tile.offsetHeight)
  ];
  const renderTile=(tile)=>{
    const [maxX,maxY]=maxOffsets(tile);
    const [x,y]=positions[tile.dataset.demoHudTile];
    tile.style.left=Math.round(x*maxX)+"px";
    tile.style.top=Math.round(y*maxY)+"px";
    tile.style.right="auto";
    tile.style.bottom="auto";
  };
  const render=()=>{if(scene.clientWidth>0&&scene.clientHeight>0)tiles.forEach(renderTile);};
  let scheduled=false;
  const scheduleRender=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;render();});};
  const save=()=>{
    try{localStorage.setItem(storageKey,JSON.stringify(positions));}catch{}
  };
  for(const tile of tiles){
    let active=null;
    const key=tile.dataset.demoHudTile;
    tile.title="Przeciągnij kafelek lub użyj strzałek";
    tile.setAttribute("aria-keyshortcuts","ArrowUp ArrowDown ArrowLeft ArrowRight");

    tile.addEventListener("pointerdown",(event)=>{
      if(tile.disabled||active||event.isPrimary===false||(event.button!==0&&event.pointerType==="mouse"))return;
      event.preventDefault();
      const b=tile.getBoundingClientRect();
      active={pointerId:event.pointerId,offsetX:event.clientX-b.left,offsetY:event.clientY-b.top,original:positions[key].slice()};
      tile.classList.add("is-dragging");
      try{tile.setPointerCapture(event.pointerId);}catch{active=null;tile.classList.remove("is-dragging");return;}
      tile.focus({preventScroll:true});
    });
    tile.addEventListener("pointermove",(event)=>{
      if(!active||active.pointerId!==event.pointerId)return;
      if(event.pointerType==="mouse"&&!(event.buttons&1)){end(true);return;}
      const bounds=scene.getBoundingClientRect();
      const [maxX,maxY]=maxOffsets(tile);
      const x=event.clientX-bounds.left-active.offsetX;
      const y=event.clientY-bounds.top-active.offsetY;
      positions[key]=[maxX?clamp(x/maxX):0,maxY?clamp(y/maxY):0];
      renderTile(tile);
    });
    const end=(commit)=>{
      if(!active)return;
      const state=active;active=null;
      tile.classList.remove("is-dragging");
      if(!commit){positions[key]=state.original;renderTile(tile);}
      else save();
      try{if(tile.hasPointerCapture(state.pointerId))tile.releasePointerCapture(state.pointerId);}catch{}
    };
    cancelActive.set(tile,()=>end(false));
    tile.addEventListener("pointerup",e=>{if(active?.pointerId===e.pointerId)end(true);});
    for(const name of ["pointercancel","lostpointercapture"]){
      tile.addEventListener(name,e=>{if(active?.pointerId===e.pointerId)end(false);});
    }
    tile.addEventListener("blur",()=>end(false));
    tile.addEventListener("keydown",(event)=>{
      if(event.key==="Escape"&&active){event.preventDefault();end(false);return;}
      if(tile.disabled||active)return;
      const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
      if(!delta)return;
      event.preventDefault();
      const [maxX,maxY]=maxOffsets(tile);
      const speed=event.shiftKey?10:3;
      positions[key]=[
        maxX?clamp(positions[key][0]+delta[0]*speed/maxX):0,
        maxY?clamp(positions[key][1]+delta[1]*speed/maxY):0
      ];
      renderTile(tile);
      save();
    });
  }
  reset.addEventListener("click",()=>{
    for(const tile of tiles){cancelActive.get(tile)?.();positions[tile.dataset.demoHudTile]=defaults[tile.dataset.demoHudTile].slice();}
    render();save();
  });
  if(typeof ResizeObserver!=="undefined"){const observer=new ResizeObserver(scheduleRender);observer.observe(scene);for(const tile of tiles)observer.observe(tile);}
  else window.addEventListener("resize",scheduleRender,{passive:true});
  document.addEventListener("minevora:languagechange",scheduleRender);
  window.addEventListener("blur",()=>{for(const cancel of cancelActive.values())cancel();});
  render();
  // A resized viewport cannot leave a tile off-screen: render is calculated
  // from current available space, and all normalized coordinates are clamped.
  syncTileVisibility();
})();
