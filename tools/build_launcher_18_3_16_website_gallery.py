"""Refresh website image set from the source art used by MINEVORA launcher 18.3.16.

Source artwork is bundled in the same launcher release; website outputs are new,
uncropped-by-CSS WebP files with clean badges removed from the game thumbnails.
No claim is made that the UI composite is an actual Windows screenshot.
"""
from pathlib import Path
from PIL import Image, ImageOps, ImageEnhance, ImageDraw, ImageFont, ImageFilter
import math

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUT = ASSETS / "launcher-18-3-16"
OUT.mkdir(parents=True, exist_ok=True)
BG = (9, 11, 29)
VIOLET = (161, 77, 235)
WHITE = (246, 239, 255)
MUTED = (181, 174, 210)

def source(name):
    path = ASSETS / name
    if not path.exists():
        raise FileNotFoundError(path)
    return Image.open(path).convert("RGB")

def fit(name, w, h, crop_top=0):
    im = source(name)
    if crop_top:
        top = int(im.height * crop_top)
        im = im.crop((0, top, im.width, im.height))
    im = ImageOps.fit(im, (w,h), method=Image.Resampling.LANCZOS, centering=(.5,.45))
    return im

def grade(im, amount=0.12):
    im = ImageEnhance.Contrast(im).enhance(1.08)
    im = ImageEnhance.Color(im).enhance(1.08)
    cover = Image.new("RGB", im.size, (37,17,88))
    return Image.blend(im, cover, amount)

def glow(im, strength=0.25):
    w,h=im.size
    fx=Image.new("RGBA",(w,h), (0,0,0,0))
    d=ImageDraw.Draw(fx)
    d.ellipse((-w//5,-h//2,w//2,h//2), fill=(127,38,239,int(strength*65)))
    d.ellipse((w*3//5,h//3,w*6//5,h*9//7),fill=(39,34,154,int(strength*55)))
    fx=fx.filter(ImageFilter.GaussianBlur(max(18,w//30)))
    return Image.alpha_composite(im.convert("RGBA"),fx).convert("RGB")

def save(image, name, quality=88):
    p = OUT / name
    image.save(p, "WEBP", quality=quality, method=6)
    print(str(p.relative_to(ROOT)),p.stat().st_size)

def font(size, bold=True):
    paths=(
      ["/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf","/usr/share/fonts/truetype/liberation2/LiberationSans-Bold.ttf"]
      if bold else
      ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf","/usr/share/fonts/truetype/liberation2/LiberationSans-Regular.ttf"]
    )
    for path in paths:
        if Path(path).exists(): return ImageFont.truetype(path,size)
    return ImageFont.load_default()

def roundrect(draw, rect, fill, outline=None, radius=15, width=1):
    draw.rounded_rectangle(rect,radius=radius,fill=fill,outline=outline,width=width)

# New banner, based on the actual launcher portal art. It deliberately differs
# from the older Enchanted Hero visual on the current website.
im=fit("minigames/hero-portal.webp",1600,950)
im=glow(grade(im,.10), .5)
save(im,"hero.webp",91)

# Game images: crop the top band containing the outdated baked-in "WKRÓTCE".
# Status is now accessible HTML text, not part of the picture.
modes=["bedwars","skywars","crystal-pvp","parkour","tnt-run","build-battle","spleef","duels"]
for mode in modes:
    im=fit("minigames/"+mode+".webp",768,470,crop_top=.19)
    im=glow(grade(im,.08),.25)
    save(im,"game-"+mode+".webp",88)

features={
    "pvp":"website-photos-20261027/home-pvp.webp",
    "ranking":"website-photos-20261027/home-rankingi.webp",
    "studio":"guide/skin-studio-plus-2-8.jpg",
    "plus":"website-photos-20261027/home-plus.webp",
    "guide":"website-photos-20261027/home-poradnik.webp",
}
for title, path in features.items():
    im=fit(path,950,570)
    im=glow(grade(im,.08),.25)
    save(im,"feature-"+title+".webp",90)

# Reconstructed launcher 18.3.16 UI composition using its actual world/arena
# illustrations, provided as a faithful graphic preview, not an app screenshot.
W,H=1440,860
canvas=Image.new("RGB",(W,H),BG);d=ImageDraw.Draw(canvas)
d.rectangle((0,0,200,H),fill=(8,10,29))
d.line((200,0,200,H),fill=(76,48,115),width=2)
d.rectangle((201,0,W,62),fill=(13,13,35))
d.line((201,61,W,61),fill=(84,51,125),width=1)
d.text((22,18),"◆ MINEVORA",font=font(20),fill=(229,199,255))
for k,v in enumerate(["Start","Minigry","PvP","Launcher","Skin Studio","Rankingi","PLUS"]):
    d.text((222+k*136,24),v,font=font(13,k==0),fill=WHITE if k==0 else MUTED)
d.rectangle((223,58,268,61),fill=VIOLET)
for idx,label in enumerate(["Start","Graj / Wersje","Mody i dodatki","Skiny 3D","Minigry","PvP HUD","Rankingi","Discord","Ustawienia"]):
    y=95+idx*52
    if idx==0: roundrect(d,(13,y-9,185,y+32),(58,27,95),(162,82,219),10,2)
    d.text((28,y),label,font=font(15,idx==0),fill=WHITE if idx==0 else MUTED)
roundrect(d,(14,704,187,790),(35,21,70),(150,74,220),12,2)
d.text((27,718),"◆ MINEVORA PLUS",font=font(13),fill=WHITE)
d.text((27,744),"Motywy / DEMO",font=font(11,False),fill=MUTED)

hero=fit("website-photos-20261027/home-hero.webp",1200,389)
canvas.paste(hero,(218,78))
shade=Image.new("RGBA",(1200,389),(10,7,31,80))
shadow=canvas.crop((218,78,1418,467)).convert("RGBA")
shadow=Image.alpha_composite(shadow,shade).convert("RGB")
canvas.paste(shadow,(218,78))
d=ImageDraw.Draw(canvas)
roundrect(d,(220,78,1418,468),None,(143,79,202),18,3)
roundrect(d,(567,95,1053,125),(16,10,37),(143,83,212),14,2)
d.text((635,101),"MINEVORA 3.0   •   LAUNCHER WINDOWS",font=font(14),fill=WHITE)
big=font(70)
msg="MINEVORA"
tw=d.textbbox((0,0),msg,font=big)[2]
d.text(((218+1418-tw)//2,170),msg,font=big,fill=WHITE,stroke_width=3,stroke_fill=(67,23,111))
msg="WIĘCEJ NIŻ MINECRAFT"
f=font(33);tw=d.textbbox((0,0),msg,font=f)[2]
d.text(((218+1418-tw)//2,265),msg,font=f,fill=WHITE)
roundrect(d,(608,342,872,390),(129,33,224),(230,172,255),12,2)
d.text((679,356),"▶  GRAJ",font=font(21),fill=WHITE)
d.text((631,409),"Serwer w przygotowaniu",font=font(13),fill=(240,203,251))
roundrect(d,(218,482,1418,549),(28,22,53),(93,57,136),12,2)
d.text((237,496),"GRAJ / WYBIERZ WERSJĘ",font=font(13),fill=(221,193,253))
for left,label in [(240,"Wersja Minecraft"),(535,"Vanilla ▼"),(765,"▶ GRAJ"),(985,"Instaluj i graj")]:
    right=min(left+235,1400)
    roundrect(d,(left,516,right,540),(57,33,97) if left==765 else (17,18,42),(127,70,182),6)
    d.text((left+12,519),label,font=font(12),fill=WHITE)
d.text((222,565),"ODKRYWAJ ŚWIAT MINEVORA",font=font(12),fill=(207,157,250))
d.text((221,588),"Wybierz swoją przygodę",font=font(25),fill=WHITE)
for idx,(name,label) in enumerate(zip(modes[:4],["BedWars","SkyWars","Crystal PvP","Parkour"])):
    left=220+idx*304
    roundrect(d,(left,632,left+291,835),(21,22,48),(89,54,130),12,2)
    pic=fit("minigames/"+name+".webp",287,144,crop_top=.19)
    canvas.paste(pic,(left+2,634))
    d.text((left+13,788),label,font=font(19),fill=WHITE)
save(canvas,"launcher-preview.webp",90)
