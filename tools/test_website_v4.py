"""MINEVORA 19.0.3 static website — browser, interaction and responsive QA."""
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
server=subprocess.Popen(
    [sys.executable,"-m","http.server","8766","--bind","127.0.0.1"],
    cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT
)

def no_overflow(page, label):
    dimensions=page.evaluate("""() => ({
        viewport: innerWidth,
        document: document.documentElement.scrollWidth
    })""")
    assert dimensions["document"]<=dimensions["viewport"]+2,(label,"horizontal overflow",dimensions)

def image_is_loaded(page,selector):
    return page.locator(selector).evaluate("(img) => img.complete && img.naturalWidth > 0")

try:
    for _ in range(50):
        try:
            urlopen(BASE,timeout=1).read(10)
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError("HTTP test server did not start")
    results=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
        for label,width,height in [
            ("small-phone",320,700),("phone",390,844),("large-phone",430,932),
            ("tablet",768,1024),("desktop-site-on-phone",980,800),("desktop",1440,900)
        ]:
            page=browser.new_page(viewport={"width":width,"height":height})
            errors=[]
            page.on("pageerror",lambda e: errors.append(str(e)))
            response=page.goto(BASE,wait_until="networkidle")
            assert response.status==200
            expect(page.locator("h1")).to_have_count(1)
            expect(page.locator("h1")).to_contain_text("Twój Minecraft")
            expect(page.locator("h1")).to_contain_text("Twoje zasady")
            assert "19.0.3" in page.title()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/"
            assert page.locator("nav#mainNav a").count()==6
            assert page.locator("a[href='#studio']").count()==0
            assert page.locator(".feature").count()==4
            assert page.locator("#wiecej .extra-card").count()==6
            assert page.locator("a[href='./poradnik/']").count()>=1
            assert image_is_loaded(page,"header .brand img")
            assert image_is_loaded(page,".app-brand img")
            assert page.locator(".app-frame").is_visible()
            assert "unified-19-0-3.css" in page.content()
            no_overflow(page,label+" initial")
            bounds=page.evaluate("""() => {
                const box=(sel) => {
                    const b=document.querySelector(sel).getBoundingClientRect();
                    return {x:b.x, y:b.y, width:b.width,height:b.height,right:b.right,bottom:b.bottom};
                };
                return {copy:box(".hero-copy"),preview:box(".visual")};
            }""")
            if width>760:
                assert bounds["preview"]["x"]>=bounds["copy"]["right"]-16,(label,"desktop split",bounds)
            else:
                assert bounds["preview"]["y"]>=bounds["copy"]["bottom"]-15,(label,"mobile stack",bounds)
            tab=page.locator(".pv-nav[data-tab='Graj']")
            tab.click()
            expect(tab).to_have_attribute("aria-pressed","true")
            expect(page.locator("#appMain")).to_contain_text("Uruchom Minecraft Java")
            page.locator(".pv-nav[data-tab='Więcej']").click()
            expect(page.locator("#appMain")).to_contain_text("Skin Studio 2D")
            page.locator(".pv-nav[data-tab='Start']").click()
            expect(page.locator("#appMain")).to_contain_text("Twój Minecraft")
            if width<=760:
                expect(page.locator("#menuBtn")).to_be_visible()
                expect(page.locator("#mainNav")).to_be_hidden()
                page.locator("#menuBtn").click()
                expect(page.locator("#mainNav")).to_be_visible()
                page.keyboard.press("Escape")
                expect(page.locator("#mainNav")).to_be_hidden()
            else:
                expect(page.locator("#menuBtn")).to_be_hidden()
                expect(page.locator("#mainNav")).to_be_visible()
            no_overflow(page,label+" interacted")
            assert not errors,(label,"JavaScript error",errors)
            page.screenshot(path=str(OUT/(label+"-home.png")),full_page=True,animations="disabled")
            results.append({"device":label,"width":width,"errors":errors,"status":"passed"})
            page.close()

        nojs=browser.new_context(java_script_enabled=False,viewport={"width":390,"height":844})
        page=nojs.new_page()
        response=page.goto(BASE+"?utm_source=check#start",wait_until="load")
        assert response.status==200
        expect(page.locator("h1")).to_have_count(1)
        expect(page.locator(".feature")).to_have_count(4)
        no_overflow(page,"no-js home")
        response=page.goto(BASE+"poradnik/",wait_until="load")
        assert response.status==200
        assert "19.0.3" in page.title()
        expect(page.locator(".guide-card")).to_have_count(5)
        assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/poradnik/"
        expect(page.locator("#faq details")).to_have_count(5)
        assert image_is_loaded(page,"header .brand img")
        no_overflow(page,"no-js guide")
        page.screenshot(path=str(OUT/"guide-mobile.png"),full_page=True,animations="disabled")
        nojs.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
