"""Mobile vs Android 'Desktop site' MINEVORA 5.1 visual regression tests."""
from __future__ import annotations
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/"website-v4-mobile-modes"
OUTPUT.mkdir(exist_ok=True)
BASE="http://127.0.0.1:8767/v4/"
server=subprocess.Popen([sys.executable,"-m","http.server","8767","--bind","127.0.0.1"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)

def boxes(page):
    return page.evaluate("""() => {
      const bb = (selector) => {
        const node=document.querySelector(selector);
        const b=node.getBoundingClientRect();
        const css=getComputedStyle(node);
        return {
          x:Math.round(b.x),y:Math.round(b.y),width:Math.round(b.width),
          height:Math.round(b.height),bottom:Math.round(b.bottom),
          display:css.display,visible:css.visibility!=='hidden'&&css.display!=='none'
        };
      };
      return {
        innerWidth:innerWidth,
        scrollWidth:document.documentElement.scrollWidth,
        nav:bb('#siteNav'),
        menu:bb('#navToggle'),
        heading:bb('#heroTitle'),
        preview:bb('.preview-area'),
        heroCopy:bb('.hero-copy'),
        heroLayoutColumns:getComputedStyle(document.querySelector('.hero-layout')).gridTemplateColumns,
        button:bb('.hero-buttons .btn'),
        stepGrid:getComputedStyle(document.querySelector('.steps')).gridTemplateColumns
      };
    }""")

try:
    for _ in range(25):
        try:
            urlopen(BASE,timeout=1)
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError("Test server not ready")
    records=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
        cases=[
            ("phone-mobile",390,844,True,False),
            ("small-phone-mobile",360,780,True,False),
            ("tablet-mobile",768,1024,True,False),
            ("android-desktop-site",980,850,True,True),
            ("windows-desktop",1440,900,False,True)
        ]
        for label,width,height,is_mobile,desktop in cases:
            context=browser.new_context(
                viewport={"width":width,"height":height},
                device_scale_factor=1 if not is_mobile else 2.5,
                is_mobile=is_mobile,
                has_touch=is_mobile,
                reduced_motion="reduce",
            )
            page=context.new_page()
            errors=[]
            page.on("pageerror",lambda err:errors.append(str(err)))
            page.goto(BASE,wait_until="domcontentloaded")
            page.locator(".preview-shell img").wait_for(state="visible",timeout=12000)
            info=boxes(page)
            assert info["scrollWidth"]<=info["innerWidth"]+2,(label,"horizontal overflow",info)
            expect(page.locator("h1")).to_have_count(1)
            expect(page.locator("#pobierz a[href*='releases/tag/v18.3.7']")).to_have_count(1)
            assert not errors,(label,errors)
            if desktop:
                assert not info["menu"]["visible"],(label,"desktop menu should be full width",info)
                assert info["nav"]["visible"],(label,"full navigation missing",info)
                assert info["preview"]["x"]>=info["heroCopy"]["x"]+info["heroCopy"]["width"]-15,(label,"desktop columns not side-by-side",info)
                assert len(info["heroLayoutColumns"].split())==2,(label,"not two desktop columns",info)
            else:
                assert info["menu"]["visible"],(label,"mobile menu button missing",info)
                assert not info["nav"]["visible"],(label,"mobile nav should start closed",info)
                assert info["preview"]["y"]>info["heroCopy"]["y"]+info["heroCopy"]["height"]-5,(label,"preview should be below heading",info)
                assert info["preview"]["width"]>=info["heroCopy"]["width"]-2,(label,"mobile content has unexpected sizing",info)
                assert info["button"]["height"]>=47,(label,"download button too small",info)
                menu=page.locator("#navToggle")
                menu.click()
                expect(page.locator("#siteNav")).to_be_visible()
                expect(menu).to_have_attribute("aria-expanded","true")
                page.keyboard.press("Escape")
                expect(page.locator("#siteNav")).to_be_hidden()
            page.screenshot(path=str(OUTPUT/(label+".png")),full_page=False,animations="disabled")
            records.append({"mode":label,"viewport":width,"result":"passed","columns":info["heroLayoutColumns"]})
            context.close()
        browser.close()
    (OUTPUT/"modes.json").write_text(json.dumps(records,indent=2),encoding="utf-8")
    print(json.dumps(records,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
