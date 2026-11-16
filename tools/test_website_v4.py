"""Browser regression checks for the current MINEVORA Slate static site.

Former checks targeted an obsolete 19.0.3 layout, so they could not pass.
This script exercises PL/EN, page navigation, Discord, PvP preview, and phones.
"""
from __future__ import annotations
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"website-v4-test-screenshots"
OUT.mkdir(exist_ok=True)
BASE="http://127.0.0.1:8766/v4/"
server=subprocess.Popen([sys.executable,"-m","http.server","8766","--bind","127.0.0.1"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)

def no_overflow(page,label):
    dimensions=page.evaluate("""() => ({width:innerWidth,doc:document.documentElement.scrollWidth})""")
    if dimensions["doc"]>dimensions["width"]+2:
        offenders=page.evaluate("""() => [...document.querySelectorAll('body *')]
         .map(el=>{const b=el.getBoundingClientRect();return {tag:el.tagName,cls:String(el.className).slice(0,60),right:Math.round(b.right)};})
         .filter(x=>x.right>innerWidth+2).slice(0,12)""")
        raise AssertionError((label,"horizontal overflow",dimensions,offenders))

def image_loaded(page,selector):
    return page.locator(selector).evaluate("(img) => img.complete && img.naturalWidth > 0")

try:
    for _ in range(50):
        try:
            if urlopen(BASE,timeout=1).status==200:break
        except OSError:time.sleep(.2)
    else:raise RuntimeError("Local HTTP server could not start")
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
        for label,width,height in (
            ("small-phone",320,700),("phone",390,844),("large-phone",430,932),
            ("tablet",768,1024),("desktop-site-on-phone",980,800),("desktop",1440,900)
        ):
            ctx=browser.new_context(viewport={"width":width,"height":height})
            page=ctx.new_page()
            errors=[]
            page.on("pageerror",lambda error:errors.append(str(error)))
            response=page.goto(BASE,wait_until="networkidle")
            assert response and response.status==200,(label,"homepage status")
            expect(page.locator("h1")).to_have_count(1)
            expect(page.locator("h1")).to_contain_text("Twój Minecraft")
            assert page.locator("#skin-studio img").get_attribute("src").endswith("20261116.svg")

            assert "Ciemny Łupek" in page.title()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/"
            assert image_loaded(page,"header .brand img")
            assert page.locator(".app-shell").count()==1
            assert page.locator(".feature-grid").count()==1
            assert page.locator(".mv-rail a[data-rail]").count()==7
            assert page.locator(".mv-addon-grid .mv-addon").count()==5
            assert page.locator('link[href*="launcher-slate-20261115.css"]').count()==1
            assert page.locator("a[href='./poradnik/']").count()>=1
            assert page.locator("a[href='https://discord.gg/M2fZVJBCqh']").count()>=2
            assert page.locator("[data-minevora-language]").count()==1
            no_overflow(page,label+" Polish home")
            assert page.locator("[data-demo-hud-tile]").count()==5
            assert page.locator(".pvp-overhead-hearts").count()==1
            assert page.locator('a[href*="v2.0.15-fabric-1.21.1/"]').count()==1
            assert "Prawy Shift" in page.locator("#pvp-hud").inner_text()
            tile=page.locator('[data-demo-hud-tile="fps"]')
            before=tile.evaluate("(el) => el.style.left")
            tile.focus()
            tile.press("ArrowRight")
            after=tile.evaluate("(el) => el.style.left")
            assert before!=after,(label,"HUD tile did not move",before,after)
            page.locator("[data-demo-hud-reset]").click()
            reset_position=tile.evaluate("(el) => el.style.left")
            assert reset_position==before,(label,"HUD tile reset failed")

            hud=page.locator("[data-demo-hud-toggle]")
            hud.click()
            expect(hud).to_have_attribute("aria-pressed","false")
            expect(page.locator("[data-demo-hud-preview]")).to_have_attribute("data-hud","off")
            # Hidden tiles must not remain keyboard-focusable or visible to screen readers.
            for hidden_tile in page.locator("[data-demo-hud-tile]").all():
                expect(hidden_tile).to_be_disabled()
                expect(hidden_tile).to_have_attribute("aria-hidden","true")

            hud.click()
            expect(hud).to_have_attribute("aria-pressed","true")
            expect(tile).to_be_enabled()
            expect(tile).to_have_attribute("aria-hidden","false")


            page.locator("[data-minevora-language]").select_option("en")
            expect(page.locator("html")).to_have_attribute("lang","en")
            expect(page.locator("h1")).to_contain_text("Your Minecraft")
            expect(page.locator("#pvp-hud")).to_contain_text("Hearts above players")
            expect(tile).to_have_attribute("title","Drag the tile or use the arrow keys")
            expect(page.locator("#pvp-hud .pvp-overhead-hearts small")).to_have_text("Player · sample HP")

            expect(page.locator("#pvp-hud .pvp-install-note")).to_contain_text("75–100%")
            expect(page.locator(".hero .lead")).to_contain_text("One place to launch Minecraft Java")
            expect(page.locator(".app-title")).to_have_text("Minecraft add-ons")
            expect(page.locator(".mv-addon-grid .mv-addon").first).to_contain_text("Mods")
            assert page.locator("#skin-studio img").get_attribute("src").endswith("-en.svg")
            assert image_loaded(page,"#skin-studio img")

            expect(page.locator("[data-demo-hud-reset]")).to_have_text("Reset layout")
            assert page.evaluate("localStorage.getItem('minevora_site_language')")=="en"
            no_overflow(page,label+" English home")
            expect(page.locator("#hosting")).to_contain_text("Connect your launcher")
            page.goto(BASE+"host/",wait_until="networkidle")
            assert page.locator("a[href='http://127.0.0.1:8000/']").count()>=1
            assert page.locator("a[href='http://127.0.0.1:8000/podglad/']").count()>=1
            expect(page.locator("html")).to_have_attribute("lang","en")
            expect(page.locator("h1")).to_contain_text("Your server.")
            expect(page.locator(".mv-rail a[data-rail='host']")).to_have_attribute("aria-current","page")
            assert page.locator(".mv-rail a[data-rail]").count()==7
            no_overflow(page,label+" English HOST")
            page.locator("[data-minevora-language]").select_option("pl")
            expect(page.locator("h1")).to_contain_text("Twój serwer.")
            no_overflow(page,label+" Polish HOST")
            page.locator("[data-minevora-language]").select_option("en")

            page.goto(BASE+"poradnik/",wait_until="networkidle")
            expect(page.locator("h1")).to_contain_text("From the first launch.")
            expect(page.locator("#instalacja")).to_contain_text("Start the launcher")
            expect(page.locator("#skin-studio")).to_contain_text("PvP HUD")
            expect(page.locator("#skin-studio")).to_contain_text("Fabric 1.21.1")
            expect(page.locator("#skin-studio")).to_contain_text("A higher scale is rejected")
            expect(page.locator("#skin-studio")).to_contain_text("Right Shift or P")
            expect(page.locator("#skin-studio")).to_contain_text("SHA-256")
            expect(page.locator("#skin-studio")).to_contain_text("never overwrites your files")
            assert "MINEVORA Guide" in page.title()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/poradnik/"
            assert image_loaded(page,"header .brand img")
            assert page.locator("#problemy details").count()>=5
            expect(page.locator("[data-minevora-language]")).to_have_value("en")
            no_overflow(page,label+" English guide")
            page.locator("[data-minevora-language]").select_option("pl")
            expect(page.locator("html")).to_have_attribute("lang","pl")
            expect(page.locator("h1")).to_contain_text("Od pierwszego uruchomienia.")
            expect(page.locator("#instalacja")).to_contain_text("Uruchom launcher")
            assert not errors,(label,"JS exceptions",errors)
            no_overflow(page,label+" Polish guide")
            page.screenshot(path=str(OUT/(label+"-guide.png")),full_page=True,animations="disabled")
            results.append({"device":label,"width":width,"result":"pass"})
            ctx.close()

        ctx=browser.new_context(java_script_enabled=False,viewport={"width":390,"height":844})
        page=ctx.new_page()
        response=page.goto(BASE,wait_until="load")
        assert response and response.status==200
        expect(page.locator("h1")).to_contain_text("Twój Minecraft")
        assert image_loaded(page,"header .brand img")
        no_overflow(page,"No-JS home")
        response=page.goto(BASE+"poradnik/",wait_until="load")
        assert response and response.status==200
        expect(page.locator("h1")).to_contain_text("Od pierwszego uruchomienia.")
        no_overflow(page,"No-JS guide")
        response=page.goto(BASE+"host/",wait_until="load")
        assert response and response.status==200
        no_overflow(page,"No-JS HOST")

        ctx.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
