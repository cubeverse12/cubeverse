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
    "Datapack":{facet:"all_project_types:datapack",label:"datapacki",project:"datapack",icon:"📜"}
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

  async function findCompatibleVersion(projectId,selection) {
    if(!/^[A-Za-z0-9]{3,64}$/.test(projectId))throw new Error("Brak prawidłowego identyfikatora projektu.");
    if(selection.type==="Mod"&&selection.loader==="Vanilla")throw new Error("Wybierz Fabric, Forge, NeoForge lub Quilt — mod nie działa na czystym Vanilla.");
    const endpoint=new URL("https://api.modrinth.com/v2/project/"+projectId+"/version");
    endpoint.searchParams.set("game_versions",JSON.stringify([selection.version]));
    if((selection.type==="Mod")&&selection.loader!=="Vanilla"){
      endpoint.searchParams.set("loaders",JSON.stringify([selection.loader.toLowerCase().replace(" (plan)","")]));
    }
    endpoint.searchParams.set("include_changelog","false");
    const timeoutController=new AbortController(),timeout=setTimeout(()=>timeoutController.abort(),12000);
    let versions;
    try {
      const response=await fetch(endpoint.href,{signal:timeoutController.signal,headers:{"Accept":"application/json"}});
      if(!response.ok)throw new Error("Modrinth zwrócił błąd "+response.status+". Spróbuj ponownie.");
      versions=await response.json();
    } catch(err) {
      if(err&&err.name==="AbortError")throw new Error("Nie udało się sprawdzić wersji w ciągu 12 sekund.");
      if(err instanceof TypeError)throw new Error("Nie udało się połączyć z Modrinth w celu sprawdzenia wersji.");
      throw err;
    } finally {clearTimeout(timeout)}
    if(!Array.isArray(versions)||versions.length===0)throw new Error("Brak wydania pasującego do Minecraft "+selection.version+" i wybranego loadera.");
    const compatible=versions.filter(v=>v&&Array.isArray(v.game_versions)&&v.game_versions.includes(selection.version));
    if(!compatible.length)throw new Error("Nie znaleziono potwierdzonej wersji dla Minecraft "+selection.version+".");
    const loader=selection.loader.toLowerCase().replace(" (plan)","");
    const filtered=(selection.type==="Mod")&&selection.loader!=="Vanilla"?
      compatible.filter(v=>Array.isArray(v.loaders)&&v.loaders.includes(loader)):compatible;
    if(!filtered.length)throw new Error("Brak zgodnego wydania dla loadera "+selection.loader+".");
    const stable=filtered.filter(v=>v.version_type==="release");
    const candidates=stable.length?stable:filtered;
    candidates.sort((a,b)=>String(b.date_published||"").localeCompare(String(a.date_published||"")));
    const picked=candidates[0];
    const deps=Array.isArray(picked.dependencies)?picked.dependencies.filter(d=>d&&d.dependency_type==="required").map(d=>({
      projectId:String(d.project_id||"").slice(0,64),
      versionId:String(d.version_id||"").slice(0,64)
    })).slice(0,25):[];
    return {
      versionId:String(picked.id||"").slice(0,64),
      versionNumber:String(picked.version_number||picked.name||"nieznana").slice(0,70),
      channel:String(picked.version_type||"nieznany").slice(0,15),
      gameVersion:selection.version,
      loader:selection.loader,
      dependencies:deps
    };
  }
  function draw(hit){
    const selection={type:context.type,version:context.version,loader:context.loader,profileId:context.profileId};
    const type=types[selection.type], card=el("article","mp-result");
    const icon=el("div","mp-result-icon",type.icon);
    const src=urlForIcon(hit.icon_url);
    if(src){
      const image=el("img");image.alt="";
      image.loading="lazy";image.decoding="async";
      image.onerror=function(){image.remove();icon.textContent=type.icon};
      image.onload=function(){if(image.parentNode===icon){icon.replaceChildren(image)}};
      image.src=src;icon.appendChild(image);
    }
    const body=el("div","mp-result-body");
    const header=el("div","mp-result-title",String(hit.title||"Bez nazwy"));
    const desc=el("p","mp-result-description",String(hit.description||"Brak opisu tego dodatku."));
    const meta=el("div","mp-result-metas");
    const supported=Array.isArray(hit.versions) && hit.versions.includes(context.version);
    meta.appendChild(mark((supported?"✓ ":"")+"Minecraft "+selection.version));
    if((context.type==="Mod") && selection.loader!=="Vanilla"){
      meta.appendChild(mark(selection.loader.replace(" (plan)","")+" · filtr loadera"));
    }else if(selection.type==="Mod"&&selection.loader==="Vanilla"){
      meta.appendChild(mark("Vanilla: mod wymaga odpowiedniego loadera"));
    }else{
      meta.appendChild(mark("Sprawdź wymagania przed instalacją"));
    }
    if(hit.author)meta.appendChild(mark("Autor: "+hit.author));
    if(typeof hit.downloads==="number")meta.appendChild(mark("Pobrania: "+new Intl.NumberFormat("pl-PL",{notation:"compact"}).format(hit.downloads)));
    body.append(header,desc,meta);
    const controls=el("div","mp-result-actions");
    const add=el("button","btn tiny","+ Do profilu");add.type="button";
    add.addEventListener("click",async function(){
      if(add.disabled)return;
      add.disabled=true;add.textContent="Sprawdzam wydanie…";
      let msg=card.querySelector(".mp-version-error");
      if(!msg){msg=el("p","mp-version-error");controls.appendChild(msg)}
      msg.textContent="";
      try {
        const compat=await findCompatibleVersion(String(hit.project_id||""),selection);
        const detail={
          type:selection.type,
          profileId:selection.profileId,
          id:String(hit.project_id||""),
          name:String(hit.title||"Bez nazwy"),
          author:String(hit.author||""),
          description:String(hit.description||"").slice(0,240),
          iconUrl:src||"",
          slug:safeSlug(hit),
          versionId:compat.versionId,
          versionNumber:compat.versionNumber,
          gameVersion:compat.gameVersion,
          loader:compat.loader,
          dependencies:compat.dependencies,
          accepted:false
        };
        window.dispatchEvent(new CustomEvent("minevora:add-catalog-item",{detail}));
        if(!detail.accepted)throw new Error("Nie dodano. Sprawdź, czy ten profil jest nadal otwarty lub czy mod nie został już dodany.");
        add.textContent="✓ Dodano";
      } catch(err) {
        msg.textContent=err&&err.message?err.message:"Nie udało się ustalić zgodnej wersji.";
        add.textContent="+ Do profilu";
        add.disabled=false;
      }
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
    if((context.type==="Mod") && context.loader!=="Vanilla"){
      arr.push(["categories:"+context.loader.toLowerCase().replace(" (plan)","")]);
    }
    return arr;
  }
  async function load(append){
    if(!context)return;
    if(controller)controller.abort();
    controller=new AbortController();
    const activeController=controller;
    const thisId=++requestId, timeout=setTimeout(()=>activeController.abort(),15000);
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
    const fresh={type:data.category,version:String(data.version||"1.21.1"),loader:String(data.loader||"Fabric"),profileId:String(data.profileId||"")};
    if(context&&fresh.type===context.type&&fresh.version===context.version&&fresh.loader===context.loader){context=fresh;return;}
    context=fresh;
    search.placeholder=fresh.type==="Mod"?"Wpisz np. Sodium, Fabric API…":fresh.type==="Shader"?"Wpisz np. Complementary…":fresh.type==="Resource pack"?"Wpisz np. Faithful…":"Znajdź datapack…";
    byId("mpCatalogHeading").textContent="Katalog Modrinth · "+types[context.type].label;
    search.value="";
    load(false);
  }
  window.addEventListener("minevora:catalog-context",e=>contextChanged(e.detail));
  search.addEventListener("input",function(){
    if(timer)clearTimeout(timer);
    label("Aktualizuję listę…");more.hidden=true;
    timer=setTimeout(()=>load(false),380);
  });
  search.addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();if(timer)clearTimeout(timer);load(false)}});
  byId("mpCatalogFind").addEventListener("click",function(){if(timer)clearTimeout(timer);load(false)});
  more.addEventListener("click",function(){if(!busy&&offset<total)load(true)});
})();
