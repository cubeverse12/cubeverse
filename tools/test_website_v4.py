"""MINEVORA 4.1 rebuilt website: navigation, mobile UI, galleries and download."""
import json
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website-v4-test-screenshots"
OUT.mkdir(exist_ok=True)
BASE = "http://127.0.0.1:8766/v4/"
ROUTES = {
    "wersje": 3,
    "mody": 3,
    "minigry": 8,
    "pvp": 3,
    "ranking": 3,
    "sklep": 3,
    "studio": 3,
    "plus": 2,
    "opcje": 2,
    "poradnik": 3,
    "pobierz": 3,
}
server = subprocess.Popen(
    [sys.executable, "-m", "http.server", "8766", "--bind", "127.0.0.1"],
    cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT,
)

def checked_images(page):
    imgs = page.locator("#content img")
    for img in imgs.all():
        img.scroll_into_view_if_needed(timeout=4000)
        img.evaluate("img => img.decode().catch(() => {})")
    return page.evaluate("""() => [...document.querySelectorAll('#content img')]
        .filter(img => img.complete && img.naturalWidth === 0)
        .map(img => img.currentSrc || img.src)""")

def no_overflow(page, device, route):
    vals = page.evaluate("""() => ({
        doc: document.documentElement.scrollWidth,
        window: window.innerWidth
    })""")
    assert vals["doc"] <= vals["window"] + 2, (device, route, "overflow", vals)

try:
    for _ in range(50):
        try:
            urlopen(BASE, timeout=1).read(10)
            break
        except OSError:
            time.sleep(.2)
    else:
        raise RuntimeError("Serwer HTTP nie działa")

    output = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--no-sandbox"])
        for device, w, h in [("phone", 393, 852), ("tablet", 768, 1024), ("desktop", 1440, 900)]:
            page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            errors = []
            page.on("pageerror", lambda err: errors.append(str(err)))
            page.goto(BASE + "#start", wait_until="networkidle")
            expect(page.locator("#content .hero")).to_be_visible()
            assert page.locator(".feature-card").count() == 7, (device, "start tiles")
            assert page.locator("#playButton").inner_text().startswith("▶\nGRAJ")
            page.locator("#minecraftVersion").select_option("1.21.1")
            page.locator("#minecraftLoader").select_option("Fabric")
            assert "Fabric" in page.locator("#playButton").get_attribute("title")
            assert not checked_images(page), (device, "start", "broken images")
            no_overflow(page, device, "start")
            page.screenshot(path=str(OUT / f"minevora-rebuild-start-{device}.png"), full_page=True)

            if device == "phone":
                expect(page.locator("#menuToggle")).to_be_visible()
                expect(page.locator("#drawer")).not_to_be_visible()
                page.locator("#menuToggle").click()
                expect(page.locator("#drawer")).to_be_visible(timeout=2500)
                assert page.locator("#menuToggle").get_attribute("aria-expanded") == "true"
                page.locator("#drawerClose").click()
                expect(page.locator("#drawer")).not_to_be_visible(timeout=2500)
                assert page.locator("#menuToggle").get_attribute("aria-expanded") == "false"
            if device == "desktop":
                expect(page.locator("#drawer")).to_be_visible()
                page.locator("#siteSearch").fill("SkyWars")
                expect(page.locator("#content .search-hit")).to_have_count(1)
                assert page.locator("#content .search-hit").get_attribute("href") == "#minigry"

            for route, count in ROUTES.items():
                # On each viewport verify every public page plus all the feature images.
                page.goto(BASE + "#" + route, wait_until="networkidle")
                view = page.locator("#content .surface")
                expect(view).to_be_visible()
                expect(page.locator("#content .page-heading h1")).to_be_visible()
                assert view.locator(".gallery-card").count() == count, (device, route, "gallery", count)
                assert not checked_images(page), (device, route, "broken image")
                no_overflow(page, device, route)
                if device == "phone":
                    grid = page.locator("#content .gallery").evaluate("el => getComputedStyle(el).gridTemplateColumns")
                    assert len(grid.split()) == 1, (device, route, "not one gallery column", grid)
                if route in ("poradnik", "opcje", "studio", "minigry"):
                    page.screenshot(path=str(OUT / f"minevora-rebuild-{route}-{device}.png"), full_page=True)
                if route == "pobierz":
                    assert page.locator("a[href='https://github.com/cubeverse12/minevora-launcher/releases/tag/v18.3.4']").count() >= 1
            assert not errors, (device, "JavaScript errors", errors)
            output.append({"device": device, "routes": len(ROUTES) + 1, "broken_images": 0, "js_errors": 0})
            page.close()

        phone_site = browser.new_context(
            viewport={"width": 980, "height": 850},
            screen={"width": 393, "height": 852},
            device_scale_factor=1, has_touch=True, is_mobile=True,
            user_agent="Mozilla/5.0 (Linux; Android 16; Mobile) AppleWebKit/537.36 Chrome/154.0 Mobile Safari/537.36",
        )
        touch = phone_site.new_page()
        touch.goto(BASE + "#poradnik", wait_until="networkidle")
        assert touch.locator("body").evaluate("x => x.classList.contains('force-mobile')"), "Android desktop site: brak układu mobilnego"
        expect(touch.locator("#menuToggle")).to_be_visible()
        assert touch.locator(".gallery").evaluate("x => getComputedStyle(x).gridTemplateColumns.split(' ').length") == 1
        assert not checked_images(touch), "Android desktop site: zdjęcia"
        no_overflow(touch, "Android desktop site", "poradnik")
        touch.screenshot(path=str(OUT / "minevora-rebuild-android-desktop-mode.png"), full_page=True)
        phone_site.close()

        redirect = browser.new_page()
        redirect.goto("http://127.0.0.1:8766/?rebuilt=1#start", wait_until="domcontentloaded")
        redirect.wait_for_url("**/v4/?rebuilt=1#start", timeout=15000)
        expect(redirect.locator("#content .hero")).to_be_visible()
        redirect.close()

        browser.close()
    (OUT / "rebuild-results.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(output, ensure_ascii=False, indent=2))
finally:
    server.terminate()
    server.wait(timeout=15)
