"""Browser regression checks for the current MINEVORA 3.0.25 static site.

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
            assert "3.0.25" in page.title()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/"
            assert image_loaded(page,"header .brand img")
            assert page.locator(".app-shell").count()==1
            assert page.locator(".feature-grid").count()==1
            assert page.locator("a[href='./poradnik/']").count()>=1
            assert page.locator("a[href='https://discord.gg/M2fZVJBCqh']").count()>=2
            assert page.locator("[data-minevora-language]").count()==1
            no_overflow(page,label+" Polish home")

            hud=page.locator("[data-demo-hud-toggle]")
            hud.click()
            expect(hud).to_have_attribute("aria-pressed","false")
            expect(page.locator("[data-demo-hud-preview]")).to_have_attribute("data-hud","off")
            hud.click()
            expect(hud).to_have_attribute("aria-pressed","true")

            page.locator("[data-minevora-language]").select_option("en")
            expect(page.locator("html")).to_have_attribute("lang","en")
            expect(page.locator("h1")).to_contain_text("Your Minecraft")
            assert page.evaluate("localStorage.getItem('minevora_site_language')")=="en"
            no_overflow(page,label+" English home")
            page.goto(BASE+"poradnik/",wait_until="networkidle")
            expect(page.locator("h1")).to_contain_text("Launcher installation")
            assert "3.0.25" in page.locator("main").inner_text()
            assert "How to install MINEVORA" in page.title()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/poradnik/"
            assert image_loaded(page,"header .brand img")
            assert page.locator("#faq details").count()>=5
            expect(page.locator("[data-minevora-language]")).to_have_value("en")
            no_overflow(page,label+" English guide")
            page.locator("[data-minevora-language]").select_option("pl")
            expect(page.locator("html")).to_have_attribute("lang","pl")
            expect(page.locator("h1")).to_contain_text("Instalacja launchera")
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
        expect(page.locator("h1")).to_contain_text("Instalacja launchera")
        no_overflow(page,"No-JS guide")
        ctx.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
