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
    "mody": 3,
    "pvp": 1,
    "ranking": 2,
    "studio": 3,
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

def assert_hd_images(page, device, route):
    """Pictures must load real responsive WebP files and never blurry low-res originals."""
    items = page.locator("#content img").all()
    for item in items:
        src = item.get_attribute("src") or ""
        if ".svg" in src:
            continue
        assert "site-hd/" in src, (device, route, "legacy low-resolution raster", src)
        metadata = item.evaluate("""img => ({
            width: img.naturalWidth,
            height: img.naturalHeight,
            current: img.currentSrc,
            srcset: img.getAttribute('srcset') || ''
        })""")
        # With srcset sizes=, naturalWidth reports CSS-density-adjusted width,
        # not necessarily the physical 640/960 source pixel count.
        assert metadata["width"] > 0 and metadata["height"] > 0, (
            device, route, "image unavailable", src, metadata
        )
        assert "site-hd/" in metadata["current"], (device, route, "bad image fallback", metadata)
        assert "-640.webp" in metadata["srcset"] and "-960.webp" in metadata["srcset"], (
            device, route, "missing responsive srcset", metadata
        )


def no_overflow(page, device, route):
    vals = page.evaluate("""() => ({
        doc: document.documentElement.scrollWidth,
        window: window.innerWidth
    })""")
    assert vals["doc"] <= vals["window"] + 2, (device, route, "overflow", vals)

# Validate every new SVG independently of the browser.
from xml.etree import ElementTree as ET
new_illustrations = sorted((ROOT / "assets/launcher-18-3-6").glob("*.svg"))
assert len(new_illustrations) == 9, ("versioned illustrations missing", len(new_illustrations))
for file in new_illustrations:
    root = ET.parse(file).getroot()
    assert root.attrib.get("viewBox") == "0 0 1600 900", (file.name,"incorrect dimensions")
    assert "18.3.7" in file.read_text(encoding="utf-8"), (file.name,"missing version")

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
            assert page.locator(".feature-card").count() == 4, (device, "start tiles")
            assert page.locator("#content").get_attribute("data-ssg-home") == "true"
            assert page.locator("#content h1").count() == 1
            assert page.locator('a[href="#minigry"]').count() == 0, (device, "stara zakładka Minigry")
            for obsolete in ("wersje", "sklep", "plus", "opcje"):
                assert page.locator('a[href="#' + obsolete + '"]').count() == 0, (device, "unused menu entry", obsolete)
            assert page.locator("#funkcje .feature-card").count() == 4
            assert page.locator("#funkcje img[src*='/launcher-18-3-7/']").count() == 4, (device, "mixed home image versions")
            assert page.locator("#pobierz #release-title").is_visible()
            assert "7,0 MB" in page.locator("#pobierz").inner_text()
            assert page.locator("a[href='https://github.com/cubeverse12/minevora-launcher/releases/tag/v18.3.7']").count() >= 1
            assert page.locator("#playButton").inner_text().startswith("▶\nGRAJ")
            if device == "phone":
                # Check the real mobile layout against the approved composition.
                measurements = page.evaluate("""() => {
                    const bounds = q => {
                        const r=document.querySelector(q).getBoundingClientRect();
                        return {top:r.top,bottom:r.bottom,width:r.width,height:r.height};
                    };
                    return {
                        header:bounds('.mobilebar'),
                        hero:bounds('.hero'),
                        logo:bounds('.hero-main>img'),
                        heading:bounds('.hero-main h1'),
                        description:bounds('.hero-main p'),
                        selectors:bounds('.selector-group'),
                        button:bounds('#playButton'),
                        accent:getComputedStyle(document.querySelector('.hero-title-accent')).display
                    };
                }""")
                assert measurements["hero"]["height"] >= 625, measurements
                assert abs(measurements["header"]["bottom"] - measurements["hero"]["top"]) < 5, measurements
                assert measurements["logo"]["bottom"] < measurements["heading"]["top"], measurements
                assert measurements["heading"]["bottom"] <= measurements["description"]["top"] + 2, measurements
                assert measurements["description"]["bottom"] <= measurements["selectors"]["top"] + 2, measurements
                assert measurements["selectors"]["bottom"] < measurements["button"]["top"], measurements
                assert measurements["button"]["bottom"] <= measurements["hero"]["bottom"], measurements
                assert measurements["accent"] == "block", measurements
            page.locator("#minecraftVersion").select_option("1.21.1")
            page.locator("#minecraftLoader").select_option("Fabric")
            assert "Fabric" in page.locator("#playButton").get_attribute("title")
            assert not checked_images(page), (device, "start", "broken images")
            assert_hd_images(page, device, "start")
            no_overflow(page, device, "start")
            page.screenshot(path=str(OUT / f"minevora-rebuild-start-{device}.png"), full_page=True)

            page.goto(BASE + "#pobierz", wait_until="domcontentloaded")
            expect(page.locator("#pobierz #release-title")).to_be_visible()
            assert page.locator("#content .feature-card").count() == 4, (device, "download should not be a JS-only screen")
            no_overflow(page, device, "download anchor")
            page.goto(BASE + "#funkcje", wait_until="domcontentloaded")
            expect(page.locator("#funkcje .feature-card")).to_have_count(4)
            page.goto(BASE + "#start", wait_until="domcontentloaded")
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
                page.locator("#siteSearch").fill("Droga do wyższej rangi")
                expect(page.locator("#content .search-hit")).to_have_count(1)
                assert page.locator("#content .search-hit").get_attribute("href") == "#ranking"

            for route, count in ROUTES.items():
                # On each viewport verify every public page plus all the feature images.
                page.goto(BASE + "#" + route, wait_until="networkidle")
                view = page.locator("#content .surface")
                expect(view).to_be_visible()
                expect(page.locator("#content .page-heading h1")).to_be_visible()
                assert view.locator(".gallery-card").count() == count, (device, route, "gallery", count)
                assert view.locator(".panel-media img[src*='/launcher-18-3-7/']").count() == 1, (device, route, "wrong preview version")
                assert view.locator(".gallery-card img[src*='/launcher-18-3-7/']").count() == count, (device, route, "gallery contains older launcher screenshots")
                assert not view.locator("img[src*='launcher-18-3-16'],img[src*='guide/'],img[src*='site-refresh/']").count()
                if route == "pvp":
                    assert view.locator(".gallery-card h3").all_text_contents() == ["PvP HUD"]
                    assert not view.get_by_text("Crystal PvP", exact=True).count()
                    assert not view.get_by_text("Duels", exact=True).count()
                if route == "ranking":
                    assert view.locator(".gallery-card h3").all_text_contents() == ["Ranga gracza", "Animacja awansu"]
                    assert not view.get_by_text("Arena rankingowa", exact=True).count()
                assert not checked_images(page), (device, route, "broken image")
                assert_hd_images(page, device, route)
                no_overflow(page, device, route)
                if device == "phone":
                    grid = page.locator("#content .gallery").evaluate("el => getComputedStyle(el).gridTemplateColumns")
                    assert len(grid.split()) == 1, (device, route, "not one gallery column", grid)
                if route in ("studio",):
                    page.screenshot(path=str(OUT / f"minevora-rebuild-{route}-{device}.png"), full_page=True)
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
        touch.goto(BASE + "#studio", wait_until="networkidle")
        assert touch.locator("body").evaluate("x => x.classList.contains('force-mobile')"), "Android desktop site: brak układu mobilnego"
        expect(touch.locator("#menuToggle")).to_be_visible()
        touch.goto(BASE + "#start", wait_until="networkidle")
        expect(touch.locator("#content .hero")).to_be_visible()
        assert touch.locator(".hero-title-accent").evaluate("el => getComputedStyle(el).display") == "block"
        assert touch.locator(".hero").evaluate("el => el.getBoundingClientRect().height") >= 625
        touch.goto(BASE + "#studio", wait_until="networkidle")
        assert touch.locator(".gallery").evaluate("x => getComputedStyle(x).gridTemplateColumns.split(' ').length") == 1
        assert not checked_images(touch), "Android desktop site: zdjęcia"
        no_overflow(touch, "Android desktop site", "poradnik")
        touch.screenshot(path=str(OUT / "minevora-rebuild-android-desktop-mode.png"), full_page=True)
        phone_site.close()

        # New standalone guide must be delivered as readable HTML even without JS.
        static = browser.new_context(java_script_enabled=False, viewport={"width": 393, "height": 852})
        nojs = static.new_page()
        landing = nojs.goto(BASE + "?v=20261028-readable&utm_source=chatgpt.com", wait_until="load")
        assert landing.status == 200
        assert nojs.locator("link[rel='canonical']").get_attribute("href") == "https://minevora.pl/v4/"
        assert nojs.locator("h1").count() == 1
        assert nojs.locator(".hero h1").is_visible(), "Brak statycznego nagłówka Start"
        assert nojs.locator("#funkcje .feature-card").count() == 4
        assert nojs.locator("#pobierz").is_visible()
        assert nojs.locator("meta[property='og:image']").get_attribute("content").startswith("https://minevora.pl/assets/")
        assert nojs.locator("meta[name='twitter:card']").get_attribute("content") == "summary_large_image"
        assert not nojs.locator("#content").inner_text().count("Przygotowywanie strony")
        no_overflow(nojs, "no-js", "homepage")
        nojs.screenshot(path=str(OUT / "minevora-home-static-nojs-phone.png"), full_page=True)
        response = nojs.goto(BASE + "poradnik/?v=20261028-readable&utm_source=chatgpt.com", wait_until="load")
        assert response.status == 200
        assert nojs.locator("link[rel=canonical]").get_attribute("href") == "https://minevora.pl/v4/poradnik/"
        assert nojs.title().startswith("Jak zainstalować launcher Minecraft")
        assert nojs.locator("h1").count() == 1
        assert nojs.locator("main .guide-section").count() >= 7
        assert nojs.locator(".guide-faq details").count() >= 9
        assert "Exit Code 1" in nojs.locator("#faq").text_content()
        assert nojs.locator("a[href='#instalacja']").count() >= 1
        assert nojs.locator("a[href='#logowanie']").count() >= 1
        assert nojs.locator("a[href='#faq']").count() >= 1
        assert nojs.locator("main img[src*='/launcher-18-3-7/']").count() == 4
        assert nojs.locator("main img[src*='/launcher-18-3-16/'],main img[src*='site-refresh/']").count() == 0
        assert nojs.locator("script[src='./guide.js']").count() == 1
        assert nojs.locator("meta[name=description]").get_attribute("content")
        no_overflow(nojs, "no-js", "guide")
        nojs.screenshot(path=str(OUT / "minevora-guide-nojs-phone.png"), full_page=True)
        static.close()

        interactive = browser.new_page(viewport={"width": 393, "height": 852})
        interactive.goto(BASE + "poradnik/", wait_until="networkidle")
        interactive.keyboard.press("Control+k")
        expect(interactive.locator("#guideSearch")).to_be_focused()
        interactive.locator("#guideSearch").fill("Exit Code 1")
        expect(interactive.locator(".guide-faq details:not([hidden])")).to_have_count(1)
        assert "Exit Code 1" in interactive.locator(".guide-faq details:not([hidden]) summary").inner_text()
        assert interactive.locator(".guide-faq details:not([hidden])").get_attribute("open") is not None
        interactive.locator("#guideSearch").fill("")
        expect(interactive.locator(".guide-faq details:not([hidden])")).to_have_count(10)
        no_overflow(interactive, "phone", "guide")
        interactive.screenshot(path=str(OUT / "minevora-guide-interactive-phone.png"), full_page=True)
        interactive.close()

        # Existing shared old hash links should go somewhere meaningful.
        for outdated, expected in [
            ("wersje", "#pobierz"),
            ("sklep", "#mody"),
            ("plus", "#studio"),
            ("opcje", "/v4/poradnik/"),
        ]:
            legacy = browser.new_page()
            legacy.goto(BASE + "#" + outdated, wait_until="domcontentloaded")
            if expected.startswith("/v4/"):
                legacy.wait_for_url("**" + expected, timeout=15000)
            else:
                legacy.wait_for_url("**/v4/" + expected, timeout=15000)
            legacy.close()

        legacyGuide = browser.new_page()
        legacyGuide.goto(BASE + "#poradnik", wait_until="domcontentloaded")
        legacyGuide.wait_for_url("**/v4/poradnik/", timeout=15000)
        expect(legacyGuide.locator("h1")).to_be_visible()
        legacyGuide.close()

        homeSeo = browser.new_page()
        homeSeo.goto(BASE + "?v=some-old-version&utm_source=chatgpt.com#start", wait_until="domcontentloaded")
        assert homeSeo.locator("link[rel='canonical']").get_attribute("href") == "https://minevora.pl/v4/"
        assert homeSeo.locator("a[href='./poradnik/']").count() >= 1
        assert homeSeo.locator("a[href='#poradnik']").count() == 0
        homeSeo.close()

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
