"""Responsive checks for the current MINEVORA v4 website (phone through desktop)."""
from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website-v4-mobile-modes"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:8767/v4/"
server = subprocess.Popen(
    [sys.executable, "-m", "http.server", "8767", "--bind", "127.0.0.1"],
    cwd=ROOT,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.STDOUT,
)

def measurements(page):
    return page.evaluate("""() => {
      const box = selector => {
        const el=document.querySelector(selector);
        if (!el) throw new Error('Missing element: '+selector);
        const b=el.getBoundingClientRect();
        const style=getComputedStyle(el);
        return {
          x:b.x,y:b.y,width:b.width,height:b.height,right:b.right,bottom:b.bottom,
          visible:style.display!=='none' && style.visibility!=='hidden'
        };
      };
      return {
        innerWidth, scrollWidth:document.documentElement.scrollWidth,
        desktopNav:box('.desktop-nav'),mobileNav:box('.mobile-nav'),
        title:box('.hero h1'),preview:box('.preview-stage'),
        copy:box('.hero-copy'),button:box('.hero .actions .btn'),
        heroGrid:getComputedStyle(document.querySelector('.hero-grid')).gridTemplateColumns,
      };
    }""")

try:
    for _ in range(50):
        try:
            if urlopen(BASE, timeout=1).status == 200:
                break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError("Local website server did not start")

    records = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--no-sandbox"])
        cases = [
            ("phone",390,844,True),
            ("small-phone",360,780,True),
            ("tablet",768,1024,True),
            ("android-desktop-site",980,850,True),
            ("windows-desktop",1440,900,False),
        ]
        for label,width,height,mobile in cases:
            context = browser.new_context(
                viewport={"width":width,"height":height},
                device_scale_factor=2.5 if mobile else 1,
                is_mobile=mobile,has_touch=mobile,reduced_motion="reduce",
            )
            page = context.new_page()
            errors = []
            page.on("pageerror",lambda err:errors.append(str(err)))
            response = page.goto(BASE,wait_until="networkidle")
            assert response and response.status==200,(label,"home page status")
            info = measurements(page)
            assert info["scrollWidth"]<=info["innerWidth"]+2,(label,"horizontal overflow",info)
            expect(page.locator("h1")).to_have_count(1)
            assert "3.0.25" in page.title(),(label,"wrong page version",page.title())
            assert info["preview"]["width"]>100,(label,"preview missing",info)
            assert info["button"]["height"]>=43,(label,"hero button too small",info)
            expect(page.locator('[data-demo-hud-tile]')).to_have_count(5)
            expect(page.locator(".pvp-overhead-hearts")).to_have_count(1)
            if width>=790:
                assert info["desktopNav"]["visible"],(label,"desktop navigation missing",info)
                assert not info["mobileNav"]["visible"],(label,"mobile navigation displayed",info)
                assert info["preview"]["x"]>=info["copy"]["right"]-20,(label,"hero not side by side",info)
            else:
                assert info["mobileNav"]["visible"],(label,"mobile menu missing",info)
                assert not info["desktopNav"]["visible"],(label,"desktop menu displayed",info)
                assert info["preview"]["y"]>=info["copy"]["bottom"]-20,(label,"hero not stacked",info)
                toggle=page.locator(".mobile-nav summary")
                toggle.click()
                expect(page.locator(".mobile-nav")).to_have_attribute("open","")
                toggle.click()
                expect(page.locator(".mobile-nav")).not_to_have_attribute("open","")
            assert not errors,(label,"JS errors",errors)
            page.screenshot(path=str(OUT/(label+".png")),full_page=False,animations="disabled")
            records.append({"case":label,"width":width,"status":"passed"})
            context.close()
        browser.close()
    (OUT/"results.json").write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding="utf-8")
    print(json.dumps(records,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
