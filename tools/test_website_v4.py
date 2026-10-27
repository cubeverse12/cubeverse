"""Browser smoke test for the new standalone MINEVORA 4.0 website."""
import os,time,json,subprocess,sys
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"website-v4-test-screenshots"
OUT.mkdir(exist_ok=True)
server=subprocess.Popen([sys.executable,"-m","http.server","8766","--bind","127.0.0.1"],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.STDOUT)
try:
 for i in range(35):
  try:
   urlopen("http://127.0.0.1:8766/v4/",timeout=2).read(20)
   break
  except OSError:time.sleep(.35)
 else:raise RuntimeError("Local test server unavailable")
 results=[]
 with sync_playwright() as p:
  browser=p.chromium.launch(channel="chrome",headless=True,args=["--no-sandbox"])
  for name,width,height in [("phone",393,852),("tablet",768,1024),("desktop",1648,928)]:
   page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
   errors=[];page.on("pageerror",lambda exc:errors.append(str(exc)))
   page.goto("http://127.0.0.1:8766/v4/",wait_until="networkidle",timeout=30000)
   for img in page.locator("img").all():
    if img.is_visible():
     img.scroll_into_view_if_needed()
     img.evaluate("img => img.decode().catch(() => {})")
   measurements=page.evaluate("""() => ({
    width:document.documentElement.scrollWidth,
    viewport:window.innerWidth,
    cards:document.querySelectorAll('.cards .card').length,
    missing:[...document.images].filter(x=>{const b=x.getBoundingClientRect();return b.width>0&&b.height>0&&(!x.complete||x.naturalWidth===0)}).map(x=>x.src),
    hasSidebar:!!document.querySelector('.sidebar'),
    hasHero:!!document.querySelector('.hero'),
    hasRail:!!document.querySelector('.right'),
    hasDownload:!!document.getElementById('pobierz')
   })""")
   assert measurements["width"]<=measurements["viewport"]+2,(name,"overflow",measurements)
   assert measurements["cards"]>=7,(name,"cards missing",measurements)
   assert measurements["hasHero"] and measurements["hasRail"] and measurements["hasDownload"],measurements
   assert not measurements["missing"],(name,"missing images",measurements["missing"])
   assert not errors,(name,"javascript errors",errors)
   page.goto("http://127.0.0.1:8766/v4/#pobierz",wait_until="domcontentloaded",timeout=25000)
   assert page.locator("#pobierz").is_visible()
   page.screenshot(path=str(OUT/f"minevora-v4-{name}.png"),full_page=True)
   results.append({"device":name,**measurements})
   page.close()
  # Public home and bookmarked V3 paths must land on the NEW site.
  home=browser.new_page(viewport={"width":1280,"height":850})
  home.goto("http://127.0.0.1:8766/?from=smoke#start",wait_until="domcontentloaded",timeout=25000)
  home.wait_for_url("**/v4/?from=smoke#start",timeout=30000)
  assert home.locator(".shell").count()==1,"Public homepage failed to show V4"
  home.close()
  old=browser.new_page()
  old.goto("http://127.0.0.1:8766/v3/?from=smoke#minigry",wait_until="domcontentloaded",timeout=25000)
  old.wait_for_url("**/v4/?from=smoke#minigry",timeout=12000)
  old.close()
  legacy=browser.new_page()
  legacy.goto("http://127.0.0.1:8766/?legacy=1#account",wait_until="domcontentloaded")
  legacy.wait_for_timeout(800)
  assert "/v4/" not in legacy.url,"Legacy account must remain accessible"
  legacy.close()
  browser.close()
 (OUT/"results.json").write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding="utf-8")
 print(json.dumps(results,ensure_ascii=False,indent=2))
finally:
 server.terminate();server.wait(timeout=15)
