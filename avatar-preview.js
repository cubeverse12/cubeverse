/** Decorative 3D preview. No editor and no external libraries; each face uses the correct vanilla PNG atlas region. */
(() => {
 'use strict';
 const viewport=document.getElementById('characterStage');
 const root=document.getElementById('avatarRoot');
 const container=document.getElementById('avatarModel');
 if(!viewport||!root||!container)return;
 const U=9, TEXTURE='assets/skin_hoodie_64.png';
 const parts=[
  {id:'head',dims:[8,8,8],pos:[-4,-16,0],uv:[0,0]},
  {id:'body',dims:[8,12,4],pos:[-4,-8,0],uv:[16,16]},
  {id:'armR',dims:[4,12,4],pos:[-8,-8,0],uv:[40,16]},
  {id:'armL',dims:[4,12,4],pos:[4,-8,0],uv:[32,48]},
  {id:'legR',dims:[4,12,4],pos:[-4,4,0],uv:[0,16]},
  {id:'legL',dims:[4,12,4],pos:[0,4,0],uv:[16,48]}
 ];
 const faces={
  front:(u,v,w,h,d)=>[u+d,v+d,w,h],
  back:(u,v,w,h,d)=>[u+2*d+w,v+d,w,h],
  right:(u,v,w,h,d)=>[u,v+d,d,h],
  left:(u,v,w,h,d)=>[u+d+w,v+d,d,h],
  top:(u,v,w,h,d)=>[u+d,v,w,d],
  bottom:(u,v,w,h,d)=>[u+d+w,v,w,d]
 };
 let rotationX=-8,rotationY=-32,drag=false,lastX=0,lastY=0;
 const renderRotation=()=>root.style.transform=`rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(1.15)`;
 function build(img){
  container.replaceChildren();
  const crop=document.createElement('canvas');crop.width=64;crop.height=64;
  const cg=crop.getContext('2d',{willReadFrequently:true});cg.imageSmoothingEnabled=false;cg.drawImage(img,0,0);
  for(const part of parts){
   const [w,h,d]=part.dims,[u,v]=part.uv,W=w*U,H=h*U,D=d*U;
   const element=document.createElement('div');element.className='avatar-part';
   element.style.left=`${part.pos[0]*U}px`;element.style.top=`${part.pos[1]*U}px`;
   element.style.width=`${W}px`;element.style.height=`${H}px`;
   for(const [face,get] of Object.entries(faces)){
    const [sx,sy,fw,fh]=get(u,v,w,h,d);
    if(sx<0||sy<0||sx+fw>64||sy+fh>64)throw Error(`Invalid UV: ${part.id} ${face}`);
    const c=document.createElement('canvas');c.className='avatar-face';c.width=fw;c.height=fh;
    const fwpx=(face==='right'||face==='left')?D:W;
    const fhpx=(face==='top'||face==='bottom')?D:H;
    let t='';
    switch(face){
     case 'front':t=`translateZ(${D/2}px)`;break;
     case 'back':t=`rotateY(180deg) translateZ(${D/2}px)`;break;
     case 'left':t=`rotateY(-90deg) translateZ(${W/2}px)`;break;
     case 'right':t=`rotateY(90deg) translateZ(${W/2}px)`;break;
     case 'top':t=`rotateX(90deg) translateZ(${H/2}px)`;break;
     case 'bottom':t=`rotateX(-90deg) translateZ(${H/2}px)`;break;
    }
    c.style.width=fwpx+'px';c.style.height=fhpx+'px';
    c.style.left=(W-fwpx)/2+'px';c.style.top=(H-fhpx)/2+'px';c.style.transform=t;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(crop,sx,sy,fw,fh,0,0,fw,fh);
    element.appendChild(c);
   }
   container.appendChild(element);
  }
  renderRotation();
 }
 const img=new Image();img.onload=()=>{if(img.naturalWidth!==64||img.naturalHeight!==64)throw Error('Expected skin PNG 64x64');build(img)};
 img.onerror=()=>{viewport.setAttribute('aria-label','Podgląd 3D niedostępny: nie załadowano pliku tekstury');};
 img.src=TEXTURE;
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;drag=true;lastX=e.clientX;lastY=e.clientY;viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId);});
 viewport.addEventListener('pointermove',e=>{if(!drag)return;rotationY+=(e.clientX-lastX)*.5;rotationX=Math.max(-35,Math.min(35,rotationX-(e.clientY-lastY)*.25));lastX=e.clientX;lastY=e.clientY;renderRotation();});
 const end=()=>{drag=false;viewport.classList.remove('dragging')};viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
 document.getElementById('rotatePrev').addEventListener('click',()=>{rotationY-=40;renderRotation()});
 document.getElementById('rotateNext').addEventListener('click',()=>{rotationY+=40;renderRotation()});
 viewport.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotationY+=e.key==='ArrowLeft'?-15:15;renderRotation()}});
})();
