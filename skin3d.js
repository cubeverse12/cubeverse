/* MINEVORA Skin Studio — dependency-free CSS 3D Minecraft skin editor.
 * Every canvas face maps to a real region of the 64x64 PNG atlas.
 * No server or external JavaScript package is needed.
 */
(() => {
'use strict';
const UNIT = 10, MAX_UNDO = 35;
const skin = document.createElement('canvas');skin.width=64;skin.height=64;
const ctx=skin.getContext('2d',{willReadFrequently:true});ctx.imageSmoothingEnabled=false;
const modelEl=document.getElementById('model');
const modelScene=document.getElementById('modelScene');
const workspace=document.getElementById('workspace');
const viewport=document.getElementById('viewport');
const overlayFlag=document.getElementById('overlayCheck');
const bodyFlag=document.getElementById('bodyCheck');
const colorInput=document.getElementById('colorPicker');
const statusLabel=document.getElementById('statusText');
const MAX_HISTORY=MAX_UNDO;
let undo=[],redo=[],faceCanvases=[],activeLayer='base',tool='brush',color='#0088d8',size=1;
let selectedPreset='steve',modelType='steve',rx=-8,ry=-29,zoom=1,panX=0,panY=0,dragging=false,painting=false,lastXY=null;
let toastTimer=null,saveTimer=null;
const PARTS=[
  {id:'head',dims:[8,8,8],pos:[-4,-16,0],uv:[0,0],upper:[32,0]},
  {id:'body',dims:[8,12,4],pos:[-4,-8,0],uv:[16,16],upper:[16,32]},
  {id:'armR',dims:[4,12,4],pos:[-8,-8,0],uv:[40,16],upper:[40,32]},
  {id:'armL',dims:[4,12,4],pos:[4,-8,0],uv:[32,48],upper:[48,48]},
  {id:'legR',dims:[4,12,4],pos:[-4,4,0],uv:[0,16],upper:[0,32]},
  {id:'legL',dims:[4,12,4],pos:[0,4,0],uv:[16,48],upper:[0,48]}
];
const FACE_ORDER=['front','back','right','left','top','bottom'];
const FACE_MAP={front:([u,v,w,h,d])=>[u+d,v+d,w,h],back:([u,v,w,h,d])=>[u+2*d+w,v+d,w,h],right:([u,v,w,h,d])=>[u,v+d,d,h],left:([u,v,w,h,d])=>[u+d+w,v+d,d,h],top:([u,v,w,h,d])=>[u+d,v,w,d],bottom:([u,v,w,h,d])=>[u+d+w,v,w,d]};
function getFaceAtlas(u,v,w,h,d,face){return FACE_MAP[face]([u,v,w,h,d]);}
function setStatus(s){if(statusLabel)statusLabel.textContent=s;}
function notify(s){let el=document.getElementById('notification');el.textContent=s;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2200);setStatus(s);}
function colorChannels(hex){let h=hex.replace('#','');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16),255];}
function setColor(v){color=v.toLowerCase();colorInput.value=color;document.getElementById('colorHex').textContent=color.toUpperCase();document.querySelectorAll('.swatch').forEach(b=>b.classList.toggle('active',b.dataset.color.toLowerCase()===color));}
function rgbaStr(x){return `rgba(${x[0]},${x[1]},${x[2]},${x[3]/255})`;}
function cloneData(){return ctx.getImageData(0,0,64,64);}
function remember(){undo.push(cloneData());if(undo.length>MAX_HISTORY)undo.shift();redo=[];updateHistory();}
function updateHistory(){document.getElementById('undoBtn').disabled=!undo.length;document.getElementById('redoBtn').disabled=!redo.length;}
function restore(img){ctx.putImageData(img,0,0);renderSkin();}
function undoIt(){if(!undo.length)return;redo.push(cloneData());restore(undo.pop());updateHistory();notify('Cofnięto zmianę');}
function redoIt(){if(!redo.length)return;undo.push(cloneData());restore(redo.pop());updateHistory();notify('Ponowiono zmianę');}
function persist(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem('minevora_skin_16',skin.toDataURL('image/png'));localStorage.setItem('minevora_skin_model',modelType);}catch(_){/* localStorage may be disabled in some WebViews */}},250);}
function createPart(part,overlay){
 const [w,h,d]=part.dims;const arm=part.id==='armL'||part.id==='armR';const W=arm&&modelType==='alex'?3:w;
 const p=document.createElement('div');p.className='part';p.dataset.part=part.id;
 const ex=overlay?0.55:0;
 const width=W*UNIT, height=h*UNIT, depth=d*UNIT;
 p.style.cssText=`left:${(part.pos[0]+(arm&&modelType==='alex'?.5:0))*UNIT}px;top:${part.pos[1]*UNIT}px;width:${width}px;height:${height}px;`;
 if(part.id==='head'){p.style.transform=`translateZ(${0}px)`;}
 const [u,v]=overlay?part.upper:part.uv;
 const uvparts={};for(const f of FACE_ORDER){uvparts[f]=getFaceAtlas(u,v,W,h,d,f);}
 for(const face of FACE_ORDER){
  const [sx,sy,fw,fh]=uvparts[face];if(sx+fw>64||sy+fh>64)continue;
  const c=document.createElement('canvas');c.className='cube-face'+(overlay?' overlay-face':'');c.width=fw;c.height=fh;
  c.dataset.face=face;c.dataset.part=part.id;c.dataset.layer=overlay?'overlay':'base';
  const faceW=(face==='right'||face==='left'?depth:width)+ex*2;
  const faceH=(face==='top'||face==='bottom'?depth:height)+ex*2;
  let zOffset=0,trans='';
  if(face==='front')trans=`translateZ(${depth/2+ex}px)`;
  if(face==='back')trans=`rotateY(180deg) translateZ(${depth/2+ex}px)`;
  if(face==='right')trans=`rotateY(90deg) translateZ(${width/2+ex}px)`;
  if(face==='left')trans=`rotateY(-90deg) translateZ(${width/2+ex}px)`;
  if(face==='top')trans=`rotateX(90deg) translateZ(${height/2+ex}px)`;
  if(face==='bottom')trans=`rotateX(-90deg) translateZ(${height/2+ex}px)`;
  c.style.cssText=`width:${faceW}px;height:${faceH}px;left:${(width-faceW)/2}px;top:${(height-faceH)/2}px;transform:${trans};`;
  c._uv={x:sx,y:sy,w:fw,h:fh};
  c.addEventListener('pointerdown',startPainting);c.addEventListener('pointermove',continuePainting);c.addEventListener('pointerup',stopPainting);c.addEventListener('pointercancel',stopPainting);
  p.appendChild(c);faceCanvases.push(c);
  if(!overlay){
   const pixels=document.createElement('div');pixels.className='pixel-grid';
   pixels.style.cssText=`width:${faceW}px;height:${faceH}px;left:${(width-faceW)/2}px;top:${(height-faceH)/2}px;transform:${trans};`;
   p.appendChild(pixels);c._grid=pixels;
  }
 }
 if(part.id==='armR'||part.id==='armL')p.dataset.arm='yes';
 return p;
}
function buildModel(){
 modelEl.replaceChildren();faceCanvases=[];
 // Overlay after underlying skin: slightly inflated, as in Minecraft.
 for(const part of PARTS){modelEl.appendChild(createPart(part,false));}
 for(const part of PARTS){modelEl.appendChild(createPart(part,true));}
 updateLayerVisibility();applyPose();renderSkin();
}
function updateLayerVisibility(){for(const c of faceCanvases){let overlay=c.dataset.layer==='overlay';
 c.style.visibility=overlay?!overlayFlag.checked?'hidden':'visible':!bodyFlag.checked?'hidden':'visible';
 c.style.pointerEvents=(overlay?activeLayer==='overlay'&&overlayFlag.checked:activeLayer==='base'&&bodyFlag.checked)?'auto':'none';
 if(c._grid)c._grid.style.visibility=bodyFlag.checked?'visible':'hidden';
 }}
function renderSkin(){for(const c of faceCanvases){let v=c._uv;let g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;g.drawImage(skin,v.x,v.y,v.w,v.h,0,0,v.w,v.h);}drawPreview(document.getElementById('basePreview'),false);drawPreview(document.getElementById('extraPreview'),true);persist();}
function drawPreview(canvas,overlay){let g=canvas.getContext('2d');g.clearRect(0,0,64,64);g.imageSmoothingEnabled=false;
 let parts=[['head',16,1],['body',16,17],['armR',8,17],['armL',24,17],['legR',16,41],['legL',20,41]];
 for(let [id,x,y] of parts){let p=PARTS.find(t=>t.id===id),[w,h,d]=p.dims;let W=(modelType==='alex'&&id.startsWith('arm'))?3:w;let [u,v]=overlay?p.upper:p.uv;let [sx,sy,sw,sh]=getFaceAtlas(u,v,W,h,d,'front');g.drawImage(skin,sx,sy,sw,sh,x,y,sw,sh);}
}
function startPainting(e){if(e.button!==0)return;
 e.stopPropagation();e.preventDefault();
 if(tool==='picker'){pick(e);return;}
 remember();painting=true;dragging=false;lastXY=null;e.currentTarget.setPointerCapture(e.pointerId);paintAt(e);}
function continuePainting(e){if(!painting||!e.buttons)return;if(e.currentTarget.dataset.layer!==activeLayer)return;paintAt(e);}
function stopPainting(e){if(painting){painting=false;lastXY=null;renderSkin();}}
function xyAt(e){const c=e.currentTarget,uv=c._uv;
 // offsetX/Y are local element-space coordinates even when CSS perspective is applied.
 const x=Math.max(0,Math.min(uv.w-1,Math.floor(e.offsetX/c.clientWidth*uv.w)));
 const y=Math.max(0,Math.min(uv.h-1,Math.floor(e.offsetY/c.clientHeight*uv.h)));
 return {x:uv.x+x,y:uv.y+y,loX:uv.x,loY:uv.y,hiX:uv.x+uv.w,hiY:uv.y+uv.h};}
function pick(e){const {x,y}=xyAt(e);let d=ctx.getImageData(x,y,1,1).data;if(d[3]<10){notify('Ten piksel jest przezroczysty');return;}const h='#'+[d[0],d[1],d[2]].map(n=>n.toString(16).padStart(2,'0')).join('');setColor(h);notify(`Pobrano kolor ${h.toUpperCase()}`);}
function paintAt(e){const p=xyAt(e);
 if(lastXY&&lastXY.x===p.x&&lastXY.y===p.y)return;
 if(tool==='bucket') {floodFill(p);painting=false;lastXY=null;renderSkin();return;}
 const col=tool==='eraser'?[0,0,0,0]:colorChannels(color);
 if(lastXY){let dx=p.x-lastXY.x,dy=p.y-lastXY.y,n=Math.max(Math.abs(dx),Math.abs(dy));for(let i=0;i<=n;i++) paintPixel(Math.round(lastXY.x+dx*(i/Math.max(1,n))),Math.round(lastXY.y+dy*(i/Math.max(1,n))),col,p);}
 else paintPixel(p.x,p.y,col,p);
 lastXY={x:p.x,y:p.y};renderSkin();
}
function paintPixel(x,y,col,r){for(let ox=0;ox<size;ox++)for(let oy=0;oy<size;oy++){const nx=x+ox,ny=y+oy;if(nx<r.loX||nx>=r.hiX||ny<r.loY||ny>=r.hiY)continue;ctx.fillStyle=rgbaStr(col);if(col[3]===0)ctx.clearRect(nx,ny,1,1);else ctx.fillRect(nx,ny,1,1);}}
function floodFill(p){const img=ctx.getImageData(0,0,64,64),data=img.data,idx=(p.y*64+p.x)*4,orig=[...data.slice(idx,idx+4)],replacement=tool==='eraser'?[0,0,0,0]:colorChannels(color);
 if(orig.every((x,i)=>x===replacement[i]))return;const seen=new Uint8Array(4096),stack=[[p.x,p.y]];
 while(stack.length){let [x,y]=stack.pop();if(x<p.loX||x>=p.hiX||y<p.loY||y>=p.hiY)continue;let i=y*64+x;if(seen[i])continue;seen[i]=1;let k=i*4;if(orig.some((q,j)=>data[k+j]!==q))continue;for(let j=0;j<4;j++)data[k+j]=replacement[j];stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);}
 ctx.putImageData(img,0,0);
}
function rotate(){modelScene.style.transform=`translate3d(${panX}px,${panY}px,0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${zoom})`;}
function applyPose(){const pose=document.getElementById('stance').value;
 modelEl.querySelectorAll('.part').forEach(p=>{const arm=p.dataset.arm==='yes',leg=p.dataset.part.startsWith('leg'),right=p.dataset.part.endsWith('R');let angle=0,z=0;
 if(pose==='walk'){if(leg||arm)angle=(right?-1:1)*(arm?15:-17);}
 if(pose==='pose'){if(arm)angle=right?-25:25;if(leg)angle=right?8:-8;}
 if(pose==='tpose'&&arm){z=right?-70:70;}
 p.style.transform=`rotateX(${angle}deg) rotateZ(${z}deg)`;p.style.transformOrigin=`center ${leg?'top':'12px'}`;
 });}
function setLayer(l){activeLayer=l;document.getElementById('bodyPreview').classList.toggle('active',l==='base');document.getElementById('overlayPreview').classList.toggle('active',l==='overlay');updateLayerVisibility();notify(l==='base'?'Malujesz warstwę Body':'Malujesz warstwę Overlay');}
function setTool(t){tool=t;document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===t));document.getElementById('currentTool').textContent=({brush:'Pędzel',eraser:'Gumka',picker:'Pipeta',bucket:'Wypełnienie'})[t];setStatus('Narzędzie: '+document.getElementById('currentTool').textContent);}
function shade(hex,amount){let rgb=colorChannels(hex);return `rgb(${rgb.slice(0,3).map(v=>Math.min(255,Math.max(0,v+amount))).join(',')})`;}
function makePreset(type){const c=document.createElement('canvas');c.width=64;c.height=64;const g=c.getContext('2d');g.clearRect(0,0,64,64);
 if(type==='blank')return c;
 let zombie=type==='zombie',alex=type==='alex';let skinTone=zombie?'#649761':alex?'#e7b89c':'#b98058',hair=zombie?'#29513c':alex?'#bd783e':'#302115';
 let shirt=zombie?'#4776a3':alex?'#7fb969':'#13a59e',jeans=zombie?'#44398a':alex?'#6b5c70':'#3e379d',shoe=zombie?'#33334a':alex?'#423d4a':'#35323c';
 function seed(a,b){return Math.abs(Math.sin((a+1)*12.9898+(b+1)*78.233)*43758.5453)%1;}
 function face(uv,w,h,d,f,col,noise=11){const [x,y,fw,fh]=getFaceAtlas(...uv,w,h,d,f);for(let py=0;py<fh;py++)for(let px=0;px<fw;px++){let variation=Math.round((seed(px+x,py+y)-.5)*noise);g.fillStyle=shade(col,variation);g.fillRect(x+px,y+py,1,1);}return [x,y,fw,fh];}
 function paintPart(uv,w,h,d,colors){for(const f of FACE_ORDER){face(uv,w,h,d,f,colors[f]||colors.front||colors,12);}}
 const head={front:skinTone,back:hair,left:skinTone,right:skinTone,top:hair,bottom:shade(skinTone,-14)};
 paintPart([0,0],8,8,8,head);
 for(let f of ['right','left']){let [x,y,w,h]=getFaceAtlas(0,0,8,8,8,f);g.fillStyle=hair;g.fillRect(x,y,w,3);g.fillRect(x,y+3,1,2);}
 let [fx,fy]=getFaceAtlas(0,0,8,8,8,'front');g.fillStyle=hair;g.fillRect(fx,fy,8,2);g.fillRect(fx,fy+2,2,1);g.fillRect(fx+6,fy+2,2,1);
 g.fillStyle=zombie?'#a23a38':'#faf5ef';g.fillRect(fx+1,fy+3,2,2);g.fillRect(fx+5,fy+3,2,2);
 g.fillStyle=zombie?'#a82323':alex?'#588b8d':'#3b418d';g.fillRect(fx+2,fy+3,1,2);g.fillRect(fx+5,fy+3,1,2);
 g.fillStyle=zombie?'#47723e':shade(skinTone,-26);g.fillRect(fx+3,fy+5,2,1);
 if(!alex&&!zombie){g.fillStyle='#4f2e1e';g.fillRect(fx+2,fy+6,4,1);g.fillRect(fx+3,fy+7,2,1);}
 paintPart([16,16],8,12,4,{front:shirt,back:shade(shirt,-6),right:shade(shirt,-9),left:shade(shirt,-3),top:shirt,bottom:shade(shirt,-15)});
 for(let id of ['armR','armL']){let uv=id==='armR'?[40,16]:[32,48],w=alex?3:4;paintPart(uv,w,12,4,{front:skinTone,back:shade(skinTone,-7),left:skinTone,right:skinTone,top:shirt,bottom:shade(skinTone,-10)});for(let f of ['front','back','right','left']){let [x,y,bw]=getFaceAtlas(...uv,w,12,4,f);g.fillStyle=shirt;g.fillRect(x,y,bw,4);}}
 for(let uv of [[0,16],[16,48]]){paintPart(uv,4,12,4,{front:jeans,back:shade(jeans,-6),left:jeans,right:jeans,top:jeans,bottom:shoe});for(let f of ['front','back','right','left']){let [x,y,bw,bh]=getFaceAtlas(...uv,4,12,4,f);g.fillStyle=shoe;g.fillRect(x,y+bh-2,bw,2);}}
 return c;
}
function refreshPresets(){document.querySelectorAll('.preset').forEach(el=>{let generated=makePreset(el.dataset.preset),mini=el.querySelector('canvas');let g=mini.getContext('2d');g.clearRect(0,0,64,64);g.imageSmoothingEnabled=false;g.drawImage(generated,8,8,8,8,10,5,44,44);});}
function selectPreset(name){remember();const preset=makePreset(name);ctx.clearRect(0,0,64,64);ctx.drawImage(preset,0,0);selectedPreset=name;if(name==='alex')modelType='alex';else if(modelType==='alex'&&name==='steve')modelType='steve';document.getElementById('modelType').value=modelType;document.querySelectorAll('.preset').forEach(b=>b.classList.toggle('selected',b.dataset.preset===name));buildModel();notify('Załadowano skin: '+name);}
function exportSkin(){let link=document.createElement('a');link.download='MINEVORA_skin_64x64.png';link.href=skin.toDataURL('image/png');document.body.appendChild(link);link.click();link.remove();notify('Pobrano PNG 64×64');}
async function importSkin(file){if(!file)return; if(file.type!=='image/png'&&!file.name.toLowerCase().endsWith('.png')){notify('Wybierz plik PNG');return;}
 const url=URL.createObjectURL(file);try{let img=new Image();img.src=url;await img.decode();if(img.width!==64||![32,64].includes(img.height)){notify('Obsługiwane są PNG 64×64 i starsze 64×32');return;}
 remember();ctx.clearRect(0,0,64,64);ctx.drawImage(img,0,0);
 if(img.height===32){
  // Copy the original arms/legs to the modern per-limb atlas positions.
  // Legacy skins do not contain overlay/body second-layer slots.
  const original=document.createElement('canvas');original.width=64;original.height=64;
  original.getContext('2d').drawImage(skin,0,0);
  function mirrorLimb(oldU,oldV,newU,newV){
   const source=original;
   const opposite={front:'front',back:'back',right:'left',left:'right',top:'top',bottom:'bottom'};
   for(let f of FACE_ORDER){
    const [sx,sy,fw,fh]=getFaceAtlas(oldU,oldV,4,12,4,opposite[f]);
    const [dx,dy,dw,dh]=getFaceAtlas(newU,newV,4,12,4,f);
    ctx.save();ctx.translate(dx+dw,dy);ctx.scale(-1,1);
    ctx.drawImage(source,sx,sy,fw,fh,0,0,dw,dh);ctx.restore();
   }
  }
  mirrorLimb(0,16,16,48);mirrorLimb(40,16,32,48);
 }
 document.getElementById('skinFileName').textContent=file.name.length>22?file.name.slice(0,18)+'…':file.name;
 document.querySelectorAll('.preset').forEach(p=>p.classList.remove('selected'));buildModel();notify('Wczytano: '+file.name);
 }catch(err){notify('Błąd odczytu PNG: '+String(err.message||err));}finally{URL.revokeObjectURL(url);}}
function boot(){
 refreshPresets();const storageKey='minevora_skin_16';let loaded=false;
 try{let saved=localStorage.getItem(storageKey);let savedType=localStorage.getItem('minevora_skin_model');if(savedType==='alex')modelType='alex';if(saved){let img=new Image();img.onload=()=>{ctx.drawImage(img,0,0);document.getElementById('modelType').value=modelType;buildModel();};img.src=saved;loaded=true;}}catch(_){/* First session */}
 if(!loaded)ctx.drawImage(makePreset('steve'),0,0);
 document.getElementById('modelType').value=modelType;
 buildModel();setColor(color);updateHistory();rotate();
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.cube-face')||e.button!==0)return;dragging=true;viewport.setPointerCapture(e.pointerId);viewport.style.cursor='grabbing';viewport._point=[e.clientX,e.clientY];});
 viewport.addEventListener('pointermove',e=>{if(!dragging)return;const [x,y]=viewport._point;ry+=(e.clientX-x)*.52;rx=Math.max(-75,Math.min(75,rx-(e.clientY-y)*.45));viewport._point=[e.clientX,e.clientY];rotate();});
 viewport.addEventListener('pointerup',()=>{dragging=false;viewport.style.cursor='grab';});
 viewport.addEventListener('pointercancel',()=>{dragging=false;viewport.style.cursor='grab';});
 viewport.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.55,Math.min(2.4,zoom*(e.deltaY>0?.92:1.08)));rotate();},{passive:false});
 document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>setTool(b.dataset.tool)));
 document.getElementById('brushSize').addEventListener('change',e=>size=Number(e.target.value));
 colorInput.addEventListener('input',e=>setColor(e.target.value));
 const presets=['#0088d8','#00ec76','#ffdf05','#ff8f17','#f74142','#e909b0','#ffffff','#101010','#b9825a','#6b35ae'];
 let swatches=document.getElementById('swatches');presets.forEach(c=>{let b=document.createElement('button');b.className='swatch';b.style.background=c;b.dataset.color=c;b.title=c;b.ariaLabel='Kolor '+c;b.addEventListener('click',()=>setColor(c));swatches.appendChild(b)});setColor(color);
 document.getElementById('bodyPreview').addEventListener('click',()=>setLayer('base'));
 document.getElementById('overlayPreview').addEventListener('click',()=>{overlayFlag.checked=true;document.getElementById('layerCheck').checked=true;setLayer('overlay')});
 document.getElementById('undoBtn').addEventListener('click',undoIt);document.getElementById('redoBtn').addEventListener('click',redoIt);
 document.getElementById('downloadBtn').addEventListener('click',exportSkin);document.getElementById('saveBtn').addEventListener('click',exportSkin);
 document.getElementById('uploadBtn').addEventListener('click',()=>document.getElementById('skinInput').click());
 document.getElementById('skinInput').addEventListener('change',e=>{importSkin(e.target.files[0]);e.target.value='';});
 document.getElementById('modelType').addEventListener('change',e=>{modelType=e.target.value;buildModel();notify('Model: '+modelType)});
 document.getElementById('stance').addEventListener('change',applyPose);
 document.getElementById('gridCheck').addEventListener('change',e=>workspace.classList.toggle('show-grid',e.target.checked));
 overlayFlag.addEventListener('change',e=>{document.getElementById('layerCheck').checked=e.target.checked;updateLayerVisibility();});
 document.getElementById('layerCheck').addEventListener('change',e=>{overlayFlag.checked=e.target.checked;updateLayerVisibility();});
 bodyFlag.addEventListener('change',updateLayerVisibility);
 document.getElementById('rotateLeft').addEventListener('click',()=>{ry-=45;rotate()});
 document.getElementById('rotateRight').addEventListener('click',()=>{ry+=45;rotate()});
 document.getElementById('zoomIn').addEventListener('click',()=>{zoom=Math.min(2.4,zoom+0.15);rotate()});
 document.getElementById('zoomOut').addEventListener('click',()=>{zoom=Math.max(.55,zoom-0.15);rotate()});
 document.getElementById('resetView').addEventListener('click',()=>{rx=-8;ry=-29;zoom=1;panX=panY=0;rotate();notify('Przywrócono widok')});
 document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>selectPreset(b.dataset.preset)));
 document.addEventListener('keydown',e=>{if(document.activeElement?.matches('input, select, textarea'))return;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undoIt();return;}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redoIt();return;}
 if(['b','g','e','i'].includes(e.key.toLowerCase()))setTool({b:'brush',g:'bucket',e:'eraser',i:'picker'}[e.key.toLowerCase()]);
 });
}
window.MinevoraSkin={boot,makePreset,importSkin,exportSkin,getCanvas:()=>skin,getSnapshot:()=>skin.toDataURL('image/png'),setTool};
})();
