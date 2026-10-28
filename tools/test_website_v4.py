"""Testy widoków MINEVORA /v4 na telefonie, tablecie i komputerze."""
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website-v4-test-screenshots"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:8766/v4/"
server = subprocess.Popen(
    [sys.executable, "-m", "http.server", "8766", "--bind", "127.0.0.1"],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT
)

def check_images(page):
    for img in page.locator("img").all():
        if img.is_visible():
            img.scroll_into_view_if_needed()
            img.evaluate("img => img.decode().catch(() => {})")
    return page.evaluate("""() => [...document.images].filter(x => {
      const r=x.getBoundingClientRect();
      return r.width>0 && r.height>0 && (!x.complete || x.naturalWidth===0);
    }).map(x => x.src)""")

try:
    for _ in range(35):
        try:
            urlopen(BASE, timeout=2).read(20)
            break
        except OSError:
            time.sleep(0.35)
    else:
        raise RuntimeError("Lokalny serwer nie uruchomił się")

    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--no-sandbox"])
        for name, width, height in [
            ("phone", 393, 852), ("tablet", 768, 1024), ("desktop", 1648, 928)
        ]:
            page = browser.new_page(viewport={"width": width, "height": height}, device_scale_factor=1)
            errors = []
            page.on("pageerror", lambda exc: errors.append(str(exc)))
            page.goto(BASE + "#start", wait_until="networkidle", timeout=30000)
            assert page.locator(".hero").is_visible(), (name, "brak Start")
            assert page.locator(".mv-site-refresh").count() == 1, (name, "brak nowego stylu")
            assert not page.locator(".right").is_visible(), (name, "stare panele są widoczne")
            assert not page.locator(".cards").is_visible(), (name, "stare panele Start są widoczne")
            assert not check_images(page), (name, "niezaładowane zdjęcia Start")
            page.screenshot(path=str(OUT / f"minevora-start-{name}.png"), full_page=True)

            page.goto(BASE + "#minigry", wait_until="networkidle", timeout=30000)
            assert page.locator(".mv-route-view").is_visible(), (name, "brak widoku minigier")
            assert page.locator(".mv-route-view .mv-photo img").count() >= 8, (name, "brak zdjęć minigier")
            assert not check_images(page), (name, "niezaładowane zdjęcia minigier")
            assert not page.locator(".hero").is_visible(), (name, "Start widoczny w minigrach")
            page.screenshot(path=str(OUT / f"minevora-minigry-{name}.png"), full_page=True)

            for route in ["pvp", "ranking", "studio", "mody", "poradnik", "pobierz"]:
                page.goto(BASE + "#" + route, wait_until="networkidle", timeout=30000)
                view = page.locator(".mv-route-view")
                assert view.is_visible(), (name, route, "zakładka niewidoczna")
                assert page.locator("#" + route).is_visible(), (name, route, "błędny link")
                assert view.locator(".mv-photo img").count() >= 2, (name, route, "brak zdjęć funkcji")
                assert not check_images(page), (name, route, "niezaładowane zdjęcia")
            dimensions = page.evaluate("""() => ({
                width: document.documentElement.scrollWidth,
                viewport: window.innerWidth,
                missing: [...document.images].filter(x => {
                  const b=x.getBoundingClientRect();
                  return b.width>0&&b.height>0&&(!x.complete||x.naturalWidth===0);
                }).map(x=>x.src)
            })""")
            assert dimensions["width"] <= dimensions["viewport"] + 2, (name, "poziomy overflow", dimensions)
            assert not dimensions["missing"], (name, "brakujące obrazy", dimensions)
            assert not errors, (name, "błędy JavaScript", errors)
            results.append({"device": name, **dimensions, "tabs": "OK"})
            page.close()

        home = browser.new_page(viewport={"width": 1280, "height": 850})
        home.goto("http://127.0.0.1:8766/?from=smoke#start", wait_until="domcontentloaded")
        home.wait_for_url("**/v4/?from=smoke#start", timeout=30000)
        assert home.locator(".shell").count() == 1, "Strona główna nie przekierowuje do V4"
        home.close()
        old = browser.new_page()
        old.goto("http://127.0.0.1:8766/v3/?from=smoke#minigry", wait_until="domcontentloaded")
        old.wait_for_url("**/v4/?from=smoke#minigry", timeout=15000)
        old.close()
        legacy = browser.new_page()
        legacy.goto("http://127.0.0.1:8766/?legacy=1#account", wait_until="domcontentloaded")
        legacy.wait_for_timeout(800)
        assert "/v4/" not in legacy.url, "Stary launcher nie powinien być przekierowany"
        legacy.close()
        browser.close()
    (OUT / "results.json").write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(results, ensure_ascii=False, indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
