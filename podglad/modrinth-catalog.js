/* MINEVORA live preview: browsable Modrinth catalog. Does not download or install content. */
(function(){
  "use strict";
  const byId=(id)=>document.getElementById(id);
  const search=byId("mpCatalogSearch"), results=byId("mpCatalogResults");
  const status=byId("mpCatalogStatus"), more=byId("mpCatalogMore");
  if(!search||!results||!status||!more)return;
  const types={
    "Mod":{facet:"project_type:mod",label:"mody",project:"mod",icon:"🧩"},
    "Shader":{facet:"project_type:shader",label:"shadery",project:"shader",icon:"🌠"},
    "Resource pack":{facet:"project_type:resourcepack",label:"resource packi",project:"resourcepack",icon:"🎨"},
    "Datapack":{facet:"all_project_types:datapack",label:"datapacki",project:"datapack",icon:"📜"},
    "Modpack":{facet:"project_type:modpack",label:"modpacki",project:"modpack",icon:"📦"}
  };
  let context=null, controller=null, timer=null, requestId=0, offset=0, total=0, busy=false;
  const step=12;
  const label=(txt)=>{status.textContent=txt};
  function urlForIcon(icon){
    if(typeof icon!=="string")return null;
    try{
      const u=new URL(icon);
      if(u.protocol!=="https:")return null;
      if(u.hostname!=="cdn.modrinth.com" && u.hostname!=="cdn-raw.modrinth.com")return null;
      return u.href;
    }catch(e){return null}
  }
  function el(tag,css,txt){
    const n=document.createElement(tag);
    if(css)n.className=css;
    if(txt!==undefined)n.textContent=String(txt);
    return n;
  }
  function mark(text){return el("span","mp-result-meta",text)}
  function safeSlug(item){
    const raw=typeof item.slug==="string"&&/^[a-zA-Z0-9._-]+$/.test(item.slug)?item.slug:null;
    return raw||encodeURIComponent(String(item.project_id||""));
  }
  function draw(hit){
    const type=types[context.type], card=el("article","mp-result");
    const icon=el("div","mp-result-icon",type.icon);
    const src=urlForIcon(hit.icon_url);
    if(src){
      const image=el("img");image.alt="";
      image.loading="lazy";image.decoding="async";
      image.onerror=function(){image.remove();icon.textContent=type.icon};
      image.onload=function(){icon.textContent=""};
      image.src=src;icon.appendChild(image);
    }
    const body=el("div","mp-result-body");
    const header=el("div","mp-result-title",String(hit.title||"Bez nazwy"));
    const desc=el("p","mp-result-description",String(hit.description||"Brak opisu tego dodatku."));
    const meta=el("div","mp-result-metas");
    const supported=Array.isArray(hit.versions) && hit.versions.includes(context.version);
    meta.appendChild(mark((supported?"✓ ":"")+"Minecraft "+context.version));
    if((context.type==="Mod"||context.type==="Modpack") && context.loader!=="Vanilla"){
      meta.appendChild(mark(context.loader.replace(" (plan)","")+" · filtr loadera"));
    }else if(context.type==="Mod"&&context.loader==="Vanilla"){
      meta.appendChild(mark("Vanilla: mod wymaga odpowiedniego loadera"));
    }else{
      meta.appendChild(mark("Sprawdź wymagania przed instalacją"));
    }
    if(hit.author)meta.appendChild(mark("Autor: "+hit.author));
    if(typeof hit.downloads==="number")meta.appendChild(mark("Pobrania: "+new Intl.NumberFormat("pl-PL",{notation:"compact"}).format(hit.downloads)));
    body.append(header,desc,meta);
    const controls=el("div","mp-result-actions");
    const add=el("button","btn tiny","+ Do profilu");add.type="button";
    add.addEventListener("click",function(){
      const detail={
        type:context.type,
        id:String(hit.project_id||""),
        name:String(hit.title||"Bez nazwy"),
        author:String(hit.author||""),
        description:String(hit.description||"").slice(0,240),
        iconUrl:src||"",
        slug:safeSlug(hit),
        accepted:false
      };
      window.dispatchEvent(new CustomEvent("minevora:add-catalog-item",{detail:detail}));
      if(detail.accepted){add.textContent="✓ Dodano";add.disabled=true}
    });
    const page=el("a","mp-result-link","Zobacz w Modrinth");
    page.href="https://modrinth.com/"+type.project+"/"+safeSlug(hit);
    page.target="_blank";page.rel="noopener noreferrer";
    controls.append(add,page);
    card.append(icon,body,controls);
    return card;
  }
  function facets(){
    const arr=[[types[context.type].facet],["versions:"+context.version]];
    if((context.type==="Mod"||context.type==="Modpack") && context.loader!=="Vanilla"){
      arr.push(["categories:"+context.loader.toLowerCase().replace(" (plan)","")]);
    }
    return arr;
  }
  async function load(append){
    if(!context)return;
    if(controller)controller.abort();
    controller=new AbortController();
    const thisId=++requestId, timeout=setTimeout(()=>controller.abort(),15000);
    const q=search.value.trim().slice(0,100);
    if(!append){offset=0;results.replaceChildren()}
    busy=true;more.hidden=true;
    label("Ładowanie "+types[context.type].label+" z katalogu Modrinth…");
    try{
      const url=new URL("https://api.modrinth.com/v2/search");
      url.searchParams.set("query",q);
      url.searchParams.set("facets",JSON.stringify(facets()));
      url.searchParams.set("index",q?"relevance":"downloads");
      url.searchParams.set("limit",String(step));
      url.searchParams.set("offset",String(offset));
      const response=await fetch(url.href,{method:"GET",mode:"cors",signal:controller.signal,headers:{"Accept":"application/json"}});
      if(!response.ok)throw new Error("HTTP "+response.status);
      const data=await response.json();
      if(thisId!==requestId)return;
      const hits=Array.isArray(data.hits)?data.hits:[];
      total=Number.isFinite(data.total_hits)?data.total_hits:0;
      if(!hits.length && !append){
        results.appendChild(el("p","mp-catalog-empty","Brak wyników dla tej wersji i kategorii. Spróbuj innego hasła lub zmień wersję profilu."));
      }else{
        const frame=document.createDocumentFragment();
        hits.forEach(h=>frame.appendChild(draw(h)));
        results.appendChild(frame);
      }
      offset+=hits.length;
      label((hits.length||append)?"Wyniki z Modrinth: "+offset+" z "+total+" · wersja "+context.version:"Nie znaleziono pasujących dodatków.");
      more.hidden=!(hits.length>0&&offset<total);
    }catch(err){
      if(thisId!==requestId)return;
      const message=(err&&err.name==="AbortError")?"Przekroczono czas pobierania danych.":"Nie udało się połączyć z Modrinth. Sprawdź internet albo spróbuj ponownie.";
      label(message);
      more.hidden=true;
      if(!append){
        results.replaceChildren();
        const retry=el("button","btn secondary tiny","Spróbuj ponownie");
        retry.type="button";retry.addEventListener("click",()=>load(false));
        results.appendChild(retry);
      }
    }finally{
      clearTimeout(timeout);
      if(thisId===requestId)busy=false;
    }
  }
  function contextChanged(data){
    if(!data||!types[data.category])return;
    const fresh={type:data.category,version:String(data.version||"1.21.1"),loader:String(data.loader||"Fabric")};
    if(context&&fresh.type===context.type&&fresh.version===context.version&&fresh.loader===context.loader)return;
    context=fresh;
    search.placeholder=fresh.type==="Mod"?"Wpisz np. Sodium, Fabric API…":fresh.type==="Shader"?"Wpisz np. Complementary…":fresh.type==="Resource pack"?"Wpisz np. Faithful…":fresh.type==="Datapack"?"Znajdź datapack…":"Wpisz nazwę modpacka…";
    byId("mpCatalogHeading").textContent="Katalog Modrinth · "+types[context.type].label;
    search.value="";
    load(false);
  }
  window.addEventListener("minevora:catalog-context",e=>contextChanged(e.detail));
  search.addEventListener("input",function(){
    if(timer)clearTimeout(timer);
    timer=setTimeout(()=>load(false),380);
  });
  search.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();if(timer)clearTimeout(timer);load(false)}});
  byId("mpCatalogFind").addEventListener("click",function(){if(timer)clearTimeout(timer);load(false)});
  more.addEventListener("click",function(){if(!busy&&offset<total)load(true)});
})();
