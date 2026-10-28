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
            if name == "phone":
                assert page.locator(".mv-menu-toggle").is_visible(), "Brak mobilnego przycisku menu"
                assert not page.locator(".sidebar").is_visible(), "Boczne menu przykrywa stronę na telefonie"
                page.locator(".mv-menu-toggle").click()
                page.wait_for_timeout(350)
                state = page.evaluate("""() => ({
                    bodyClass: document.body.className,
                    sidebarDisplay: getComputedStyle(document.querySelector('.sidebar')).display,
                    sidebarVisibility: getComputedStyle(document.querySelector('.sidebar')).visibility,
                    expanded: document.querySelector('.mv-menu-toggle').getAttribute('aria-expanded')
                })""")
                assert page.locator(".sidebar").is_visible(), ("Mobilny panel nie otwiera się", state)
                assert page.locator(".mv-menu-toggle").get_attribute("aria-expanded") == "true"
                page.locator(".mv-nav-close").click()
                page.wait_for_timeout(350)
                assert not page.locator(".sidebar").is_visible(), "Panel nie zamyka się"
                assert page.locator(".mv-menu-toggle").get_attribute("aria-expanded") == "false"
            assert page.locator(".mv-site-refresh").count() == 1, (name, "brak nowego stylu")
            assert not page.locator(".right").is_visible(), (name, "stare panele są widoczne")
            assert page.locator(".cards").is_visible(), (name, "brak zdjęć kafelków Start")
            assert page.locator(".cards .card").count() == 7, (name, "brak 7 kafelków")
            assert page.locator(".play").is_visible(), (name, "przycisk GRAJ jest ukryty")
            assert page.locator(".play strong").inner_text() == "GRAJ", (name, "zmieniono przycisk GRAJ")
            assert page.locator("select[aria-label='Wersja Minecraft']").is_visible(), (name, "brak wyboru wersji")
            assert page.locator("select[aria-label='Typ instalacji']").is_visible(), (name, "brak wyboru loadera")
            page.locator("select[aria-label='Wersja Minecraft']").select_option(label="1.21.4")
            page.locator("select[aria-label='Typ instalacji']").select_option(label="Forge")
            assert "1.21.4" in (page.locator(".play").get_attribute("title") or ""), (name,"wersja nie aktualizuje podglądu")
            assert "Forge" in (page.locator(".play").get_attribute("title") or ""), (name,"loader nie aktualizuje podglądu")
            assert not page.locator(".hero-bottom .options").is_visible(), (name,"zbędny przycisk opcji")
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

        # Android / tryb "Wersja na komputer": szeroki viewport, ale dotykowy ekran.
        forced_desktop = browser.new_context(
            viewport={"width": 980, "height": 800},
            device_scale_factor=1, has_touch=True, is_mobile=True
        )
        touch = forced_desktop.new_page()
        touch.goto(BASE + "#studio", wait_until="networkidle", timeout=30000)
        assert touch.locator("body").evaluate("el => el.classList.contains('mv-compact')"), "Układ kompaktowy nie włącza się dla telefonu"
        assert touch.locator(".mv-menu-toggle").is_visible(), "Menu w trybie desktopowym telefonu jest niedostępne"
        assert not touch.locator(".sidebar").is_visible(), "Menu zasłania stronę w trybie desktopowym telefonu"
        assert touch.locator(".mv-route-view").is_visible()
        assert touch.locator(".mv-route-view h1").evaluate("el => parseFloat(getComputedStyle(el).fontSize)") >= 25, "Za mała czcionka mobilna"
        assert not check_images(touch), "Zdjęcia funkcji na Androidzie nie zostały załadowane"
        assert touch.evaluate("document.documentElement.scrollWidth <= window.innerWidth + 2"), "Poziome przewijanie na Androidzie"
        touch.screenshot(path=str(OUT / "minevora-android-desktop-mode.png"), full_page=True)
        forced_desktop.close()

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
