"""Browser smoke tests for MINEVORA 3.0 public website."""
import json
import os
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = ROOT / "website-v3-test-screenshots"
ARTIFACTS.mkdir(exist_ok=True)
server = subprocess.Popen([sys.executable, "-m", "http.server", "8765", "--bind", "127.0.0.1"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.STDOUT)
try:
    for _ in range(30):
        try:
            urlopen("http://127.0.0.1:8765/v3/", timeout=2).read(30)
            break
        except OSError:
            time.sleep(0.5)
    else:
        raise RuntimeError("Local HTTP server did not respond")

    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(channel="chrome", headless=True, args=["--no-sandbox"])
        for label, width, height in [("phone", 393, 852), ("tablet", 768, 1024), ("desktop", 1440, 900)]:
            page = browser.new_page(viewport={"width":width,"height":height}, device_scale_factor=1)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto("http://127.0.0.1:8765/v3/", wait_until="networkidle", timeout=45000)
            page.evaluate("document.fonts.ready")
            for img in page.locator("img").all():
                if not img.is_visible():
                    continue
                img.scroll_into_view_if_needed()
                img.evaluate("img => img.decode().catch(() => {})")
            page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            page.wait_for_timeout(180)
            metrics = page.evaluate("""() => ({
                scrollWidth:document.documentElement.scrollWidth,
                viewport:window.innerWidth,
                imageFailures:[...document.images].filter(x => {
                    const rect = x.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0 && (!x.complete || x.naturalWidth === 0);
                }).map(x => x.src),
                cards:document.querySelectorAll('.game-card').length,
                heading:document.querySelector('h1')?.textContent.trim(),
                heroHeight:document.querySelector('.hero-panel')?.getBoundingClientRect().height
            })""")
            assert metrics["scrollWidth"] <= metrics["viewport"] + 2, f"{label}: horizontal overflow: {metrics}"
            assert not metrics["imageFailures"], f"{label}: missing images: {metrics['imageFailures']}"
            assert metrics["cards"] == 8, f"{label}: expected 8 game cards, found {metrics['cards']}"
            dashboard = page.locator(".mv-launcher-home")
            assert dashboard.count() == 1 and dashboard.is_visible(), f"{label}: dashboard not visible"
            assert page.locator(".mv-tile").count() == 8, f"{label}: missing launcher navigation cards"
            assert page.locator(".mv-hero-play").get_attribute("href") == "#pobierz", f"{label}: missing download CTA"
            assert page.locator('.mv-home-center .mv-hero').is_visible(), f"{label}: missing target hero"
            assert page.locator(".mv-home-rail").is_visible(), f"{label}: missing account / updates rail"
            page.locator(".mv-home-center").screenshot(path=str(ARTIFACTS/f"minevora-3-dashboard-{label}.png"))
            assert not errors, f"{label}: JavaScript errors {errors}"
            if label != "desktop":
                toggle=page.get_by_role("button",name="Otwórz menu")
                toggle.click()
                assert page.locator("#mobileNav").get_attribute("aria-hidden") == "false"
                page.keyboard.press("Escape")
                assert page.locator("#mobileNav").get_attribute("aria-hidden") == "true"
            page.screenshot(path=str(ARTIFACTS/f"minevora-3-{label}.png"), full_page=True)
            results.append({"device":label,**metrics})
            page.close()

        # The public domain's root should redirect to v3, preserving old route intent.
        root_page = browser.new_page(viewport={"width":393,"height":852})
        root_page.goto("http://127.0.0.1:8765/?utm=smoke#minigames", wait_until="domcontentloaded")
        root_page.wait_for_url("**/v3/?utm=smoke#minigry", timeout=25000)
        assert root_page.locator("#minigry").count() == 1
        root_page.close()

        # Old account page stays available by explicit opt-in.
        old_page = browser.new_page(viewport={"width":393,"height":852})
        old_page.goto("http://127.0.0.1:8765/?legacy=1#account", wait_until="domcontentloaded")
        old_page.wait_for_timeout(1300)
        assert "/v3/" not in old_page.url, "Legacy account was unexpectedly redirected"
        old_page.close()

        # QtWebEngine user agents keep the previous launcher-compatible page.
        native_page = browser.new_page(user_agent="Mozilla/5.0 QtWebEngine/6.12 MINEVORA-Desktop")
        native_page.goto("http://127.0.0.1:8765/#home", wait_until="domcontentloaded")
        native_page.wait_for_timeout(1300)
        assert "/v3/" not in native_page.url, "Desktop launcher should not be redirected"
        native_page.close()
        browser.close()
    (ARTIFACTS/"results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=10)
