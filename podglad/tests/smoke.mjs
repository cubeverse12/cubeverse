// Regression checks for the browser-only MINEVORA preview.
import fs from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";
const html=fs.readFileSync("podglad/index.html","utf8");
const catalog=fs.readFileSync("podglad/modrinth-catalog.js","utf8");
const scripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
assert(scripts.length>=2,"Missing inline app modules");
for(let i=0;i<scripts.length;i++)new vm.Script(scripts[i],{filename:"inline-"+i+".js"});
new vm.Script(catalog,{filename:"modrinth-catalog.js"});
const between=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert(a>=0&&b>a,"Expected region not found: "+start);
 return html.slice(a,b);
};
const nav=between('<nav class="nav"','</nav>');
assert(nav.includes('id="navNewProfile"'),"Missing plus button");
assert(nav.includes('class="nav-section-divider"'),"Missing section separator above Minecraft servers");
assert(nav.indexOf('data-page="pvp"')<nav.indexOf('class="nav-section-divider"'),"Divider must follow PvP Studio");
assert(nav.indexOf('class="nav-section-divider"')<nav.indexOf('data-page="servers"'),"Divider must precede Minecraft servers");
assert(nav.indexOf('data-page="servers"')<nav.indexOf('id="navNewProfile"'),"Plus must be below servers");
assert(nav.indexOf('id="navNewProfile"')<nav.indexOf('data-page="settings"'),"Plus must be above settings");
assert(!nav.includes('data-page="mods"'),"Duplicate mods tab");
assert(html.indexOf('<dialog id="mpDialog"')>html.indexOf('</main></div>'),"Modal must be outside hidden page");
assert(html.includes('window.dispatchEvent(new Event("minevora:new-profile"))'),"Missing plus event");
assert(html.includes('window.addEventListener("minevora:new-profile"'),"Missing modal event");
for(const id of ["mpProfiles","mpCatalogSearch","mpCatalogResults","mpCatalogStatus","mpCatalogMore","mpItemGroups"]) {
 assert(html.includes('id="'+id+'"'),"Missing UI control: "+id);
}
for(const type of ["Mod","Shader","Resource pack","Datapack"]) {
 assert(catalog.includes('"'+type+'"'),"Missing catalog category: "+type);
}
assert(!html.includes('data-type="Modpack"'),"Ready-made modpack must not appear as an add-on category");
assert(!catalog.includes('"Modpack":{facet:'),"Ready-made modpack must not be searched as a profile add-on");
assert(html.includes('var storedTypes=types.concat(["Modpack"])'),"Do not erase previously saved modpack records");
assert(catalog.includes('https://api.modrinth.com/v2/search'),"Missing search endpoint");
assert(catalog.includes('https://api.modrinth.com/v2/project/'),"Missing release verification endpoint");
assert(catalog.includes('versionNumber'),"Missing concrete version display");
assert(catalog.includes('icon.replaceChildren(image)'),"Missing search thumbnail fix");
assert(html.includes('thumb.replaceChildren(image)'),"Missing saved thumbnail fix");
assert(html.includes('d.profileId!==p.id'),"Missing stale profile guard");
assert(html.includes('src="./modrinth-catalog.js"'),"Missing catalog script include");
console.log("MINEVORA preview smoke checks passed ("+scripts.length+" inline scripts + catalog module).");
