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
                img.scroll_into_view_if_needed()
                img.evaluate("img => img.decode().catch(() => {})")
            page.evaluate("window.scrollTo({top:0,behavior:'instant'})")
            page.wait_for_timeout(180)
            metrics = page.evaluate("""() => ({
                scrollWidth:document.documentElement.scrollWidth,
                viewport:window.innerWidth,
                imageFailures:[...document.images].filter(x => !x.complete || x.naturalWidth === 0).map(x => x.src),
                cards:document.querySelectorAll('.game-card').length,
                heading:document.querySelector('h1')?.textContent.trim(),
                heroHeight:document.querySelector('.hero-panel')?.getBoundingClientRect().height
            })""")
            assert metrics["scrollWidth"] <= metrics["viewport"] + 2, f"{label}: horizontal overflow: {metrics}"
            assert not metrics["imageFailures"], f"{label}: missing images: {metrics['imageFailures']}"
            assert metrics["cards"] == 8, f"{label}: expected 8 game cards, found {metrics['cards']}"
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
        browser.close()
    (ARTIFACTS/"results.json").write_text(json.dumps(results, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
    server.terminate()
    server.wait(timeout=10)
