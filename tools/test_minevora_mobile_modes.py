"""MINEVORA 19.0.3 responsive — phone, tablet, desktop-site and desktop tests."""
from __future__ import annotations
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"website-v4-mobile-modes"
OUT.mkdir(exist_ok=True)
BASE="http://127.0.0.1:8767/v4/"
server=subprocess.Popen([sys.executable,"-m","http.server","8767","--bind","127.0.0.1"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)

def boxes(page):
    return page.evaluate("""() => {
        const bb=(s)=>{const e=document.querySelector(s),b=e.getBoundingClientRect(),c=getComputedStyle(e);
          return {x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,display:c.display,visible:c.display!=='none'&&c.visibility!=='hidden'};};
        return {innerWidth,scrollWidth:document.documentElement.scrollWidth,nav:bb('#mainNav'),
          menu:bb('#menuBtn'),title:bb('#heroTitle'),preview:bb('.visual'),copy:bb('.hero-copy'),
          heroGrid:getComputedStyle(document.querySelector('.hero')).gridTemplateColumns,
          button:bb('.hero .actions .button'),steps:getComputedStyle(document.querySelector('.steps')).gridTemplateColumns};
    }""")

try:
    for _ in range(50):
        try:
            urlopen(BASE,timeout=1).read(10)
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError("HTTP server not ready")
    records=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
        cases=[
            ("phone",390,844,True,False),
            ("small-phone",360,780,True,False),
            ("tablet",768,1024,True,True),
            ("android-desktop-site",980,850,True,True),
            ("windows-desktop",1440,900,False,True)
        ]
        for label,width,height,mobile,desktop in cases:
            context=browser.new_context(
                viewport={"width":width,"height":height},
                device_scale_factor=2.5 if mobile else 1,is_mobile=mobile,has_touch=mobile,
                reduced_motion="reduce"
            )
            page=context.new_page()
            errors=[]
            page.on("pageerror",lambda err:errors.append(str(err)))
            page.goto(BASE,wait_until="networkidle")
            info=boxes(page)
            assert info["scrollWidth"]<=info["innerWidth"]+2,(label,"horizontal overflow",info)
            expect(page.locator("h1")).to_have_count(1)
            assert "19.0.3" in page.title()
            assert info["preview"]["width"]>100,(label,"preview missing")
            assert info["button"]["height"]>=43,(label,"button too small",info)
            if desktop:
                assert not info["menu"]["visible"],(label,"desktop menu button visible",info)
                assert info["nav"]["visible"],(label,"desktop navigation missing",info)
                assert info["preview"]["x"]>=info["copy"]["right"]-16,(label,"desktop hero not side-by-side",info)
                assert len(info["heroGrid"].split())==2,(label,"two-column desktop layout missing",info)
            else:
                assert info["menu"]["visible"],(label,"mobile toggle missing",info)
                assert not info["nav"]["visible"],(label,"mobile menu should start closed",info)
                assert info["preview"]["y"]>=info["copy"]["bottom"]-15,(label,"mobile hero not stacked",info)
                toggle=page.locator("#menuBtn")
                toggle.click()
                expect(page.locator("#mainNav")).to_be_visible()
                expect(toggle).to_have_attribute("aria-expanded","true")
                page.keyboard.press("Escape")
                expect(page.locator("#mainNav")).to_be_hidden()
            assert not errors,(label,errors)
            page.screenshot(path=str(OUT/(label+".png")),full_page=False,animations="disabled")
            records.append({"case":label,"width":width,"status":"passed","columns":info["heroGrid"]})
            context.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(records,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
