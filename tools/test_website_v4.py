"""MINEVORA 5.0 modern static landing: Chrome QA on phone/tablet/desktop."""
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

def no_overflow(page,device):
    info=page.evaluate("""() => ({
       viewport:window.innerWidth,
       document:document.documentElement.scrollWidth
    })""")
    assert info["document"]<=info["viewport"]+2,(device,"horizontal overflow",info)

def broken_images(page):
    return page.evaluate("""async () => {
        const images=[...document.querySelectorAll('main img')];
        // A lazy image below the viewport might never start loading:
        // request it explicitly before calling decode(), with a bounded wait.
        images.forEach(img => { img.loading='eager'; });
        await Promise.all(images.map(img => Promise.race([
            img.decode().catch(() => {}),
            new Promise(resolve => setTimeout(resolve, 4000))
        ])));
        return images.filter(img => !img.complete || img.naturalWidth===0).map(img=>img.src);
    }""")

try:
    for _ in range(40):
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
        for label,w,h in [("small-phone",320,700),("phone",390,844),("large-phone",430,932),("tablet",768,1024),("desktop-site-on-phone",980,800),("desktop",1440,900)]:
            desktop_android=label=="desktop-site-on-phone"
            page=browser.new_page(
                viewport={"width":w,"height":h},
                device_scale_factor=2 if desktop_android else 1,
                is_mobile=desktop_android,
                has_touch=desktop_android,
                user_agent=("Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36" if desktop_android else None),
            )
            js_errors=[]
            page.on("pageerror",lambda error:js_errors.append(str(error)))
            page.goto(BASE+"#start",wait_until="networkidle")
            expect(page.locator("h1")).to_have_count(1)
            expect(page.locator("h1")).to_contain_text("Twój Minecraft")
            expect(page.locator("h1")).to_contain_text("Twoje zasady")
            expect(page.locator(".preview-shell img")).to_be_visible()
            assert page.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/"
            assert page.locator("meta[name=description]").get_attribute("content")
            assert page.locator(".feature-tab").count()==4
            assert page.locator("#mody").get_attribute("aria-selected")=="true"
            assert page.locator(".feature-stage img").get_attribute("src").endswith("/launcher-18-3-7/mods.svg")
            assert page.locator("#pobierz .btn[href*='v18.3.7']").count()==1
            assert page.locator("a[href='./poradnik/']").count()>=2
            assert page.locator("a[href*='#minigry']").count()==0
            assert not broken_images(page),(label,broken_images(page))
            no_overflow(page,label+" home")
            # The Android Chrome "Desktop site" setting should keep the
            # same side-by-side composition as a real computer.
            geometry=page.evaluate("""() => {
                const el=sel=>document.querySelector(sel).getBoundingClientRect();
                const a=el('.hero-copy'), b=el('.preview-area');
                return {copy:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},
                        preview:{left:b.left,right:b.right,top:b.top,bottom:b.bottom}};
            }""")
            if w>800:
                assert geometry["copy"]["right"]<=geometry["preview"]["left"]+3,(label,"desktop columns",geometry)
                assert geometry["preview"]["right"]<=w+3,(label,"image clipped horizontally",geometry)
            else:
                assert geometry["preview"]["top"]>=geometry["copy"]["bottom"]-3,(label,"mobile should stack",geometry)
                assert geometry["preview"]["right"]<=w+3,(label,"mobile image clipped",geometry)
            page.screenshot(path=str(OUT/("minevora-5-"+label+"-home.png")),full_page=True)
            for feature,image in [
                ("pvp","pvp.svg"),("studio","skins.svg"),("ranking","ranking.svg"),("mody","mods.svg")
            ]:
                tab=page.locator("#"+feature)
                tab.click()
                assert tab.get_attribute("aria-selected")=="true",(label,feature,"not selected")
                assert page.locator("#featureImage").get_attribute("src").endswith("/launcher-18-3-7/"+image)
                assert page.locator("#featurePanel").get_attribute("aria-labelledby")==feature
                assert page.evaluate("location.hash")=="#"+feature
                assert not broken_images(page),(label,feature,"bad images")
                no_overflow(page,label+" "+feature)
            if label in ("desktop","desktop-site-on-phone"):
                page.locator("#mody").focus()
                page.keyboard.press("ArrowRight")
                expect(page.locator("#pvp")).to_have_attribute("aria-selected","true")
                expect(page.locator("#navToggle")).to_be_hidden()
                expect(page.locator("#siteNav")).to_be_visible()
            else:
                expect(page.locator("#navToggle")).to_be_visible()
                expect(page.locator("#siteNav")).to_be_hidden()
                page.locator("#navToggle").click()
                expect(page.locator("#siteNav")).to_be_visible()
                expect(page.locator("#navToggle")).to_have_attribute("aria-expanded","true")
                page.keyboard.press("Escape")
                expect(page.locator("#siteNav")).to_be_hidden()
                page.locator("#navToggle").click()
                page.locator("#siteNav a[href='#funkcje']").click()
                expect(page.locator("#siteNav")).to_be_hidden()
                no_overflow(page,label+" mobile menu")
            assert not js_errors,(label,js_errors)
            results.append({"device":label,"viewport":w,"js_errors":js_errors,"broken_images":[]})
            page.close()

        # Landing must remain usable to crawlers or browsers without JS.
        context=browser.new_context(java_script_enabled=False,viewport={"width":390,"height":844})
        nojs=context.new_page()
        response=nojs.goto(BASE+"?utm_source=chatgpt.com&v=legacy#start",wait_until="load")
        assert response.status==200
        assert nojs.locator("h1").count()==1
        assert nojs.locator(".feature-stage h3").count()==1
        assert nojs.locator("#pobierz a[href*='releases/tag/v18.3.7']").count()==1
        assert nojs.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/"
        assert nojs.locator("main section").count()>=5
        no_overflow(nojs,"phone no JavaScript")
        assert not broken_images(nojs)
        nojs.screenshot(path=str(OUT/"minevora-5-static-nojs.png"),full_page=True)
        nojs.goto(BASE+"poradnik/",wait_until="load")
        assert nojs.locator("main .guide-section").count()>=7
        assert nojs.locator(".guide-faq details").count()>=9
        assert nojs.locator("link[rel='canonical']").get_attribute("href")=="https://minevora.pl/v4/poradnik/"
        context.close()

        # Old links remain useful after replacing the legacy SPA.
        for old,expected in [("wersje","#launcher"),("sklep","#funkcje"),("plus","#studio"),("minigry","#start"),("poradnik","/v4/poradnik/")]:
            page=browser.new_page()
            page.goto(BASE+"#"+old,wait_until="domcontentloaded")
            page.wait_for_url("**"+expected,timeout=12000)
            page.close()
        for route in ["pvp","studio","ranking"]:
            page=browser.new_page()
            page.goto(BASE+"#"+route,wait_until="networkidle")
            expect(page.locator("#"+route)).to_have_attribute("aria-selected","true")
            page.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
