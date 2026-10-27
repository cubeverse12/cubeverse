#!/usr/bin/env python3
"""Build refreshed MINEVORA 3.0 website pictures from actual launcher image assets.

Input is the public MINEVORA 18.3.4 SHARP release (visual assets identical
to the originals reused in launcher 18.3.16). Images are decorative gameplay
illustrations, not captured live server gameplay or screenshots of a running app.
"""
from __future__ import annotations
from PIL import Image, ImageOps, ImageDraw, ImageFont, ImageEnhance
from pathlib import Path
import sys

source = Path(sys.argv[1])
target = Path(__file__).resolve().parents[1] / "assets" / "launcher-316"
target.mkdir(parents=True, exist_ok=True)

mapped = {
    "hero":("enchanted_hero.jpg",(1600,920)),
    "bedwars":("en_bedwars.jpg",(920,550)),
    "skywars":("en_skywars.jpg",(920,550)),
    "crystal-pvp":("en_crystal_1v1.jpg",(920,550)),
    "parkour":("en_parkour.jpg",(920,550)),
    "tnt-run":("en_tntrun.jpg",(920,550)),
    "build-battle":("en_buildbattle.jpg",(920,550)),
    "spleef":("en_spleef.jpg",(920,550)),
    "duels":("en_duels.jpg",(920,550)),
    "pvp":("en_pvp.jpg",(1160,770)),
    "rankingi":("en_ranking.jpg",(1160,770)),
    "minigry":("en_minigames.jpg",(960,600)),
    "poradnik":("en_versions.jpg",(960,600)),
    "mods":("en_marketplace.jpg",(960,600)),
    "portal":("minevora_section_portal.jpg",(1080,730))
}
for name,(original,size) in mapped.items():
    src = source / original
    if not src.exists(): raise FileNotFoundError(src)
    with Image.open(src) as im:
        im = ImageOps.fit(im.convert("RGB"),size,method=Image.Resampling.LANCZOS,centering=(.5,.5))
        im = ImageEnhance.Contrast(im).enhance(1.045)
        im.save(target/f"{name}.webp","WEBP",quality=88,method=6)
        print(name, (target/f"{name}.webp").stat().st_size)

# Concept visual for PLUS. Deliberately not a fake app screenshot.
def font(size,bold=False):
    path=("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else
          "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(path,size)

def concept(out,title,subtitle,mode):
    width,height=1100,700
    with Image.open(source/"en_skins_highres.jpg") as bg:
        im=ImageOps.fit(bg.convert("RGB"),(width,height),method=Image.Resampling.LANCZOS)
    d=ImageDraw.Draw(im,"RGBA")
    d.rounded_rectangle((45,45,1055,655), radius=30, fill=(13,12,40,188),outline=(198,119,255,170),width=4)
    for off in range(3):
        d.rounded_rectangle((80+off*4,93+off*4,1020-off*4,615-off*4),radius=25,outline=(144,62,255,80-off*20),width=2)
    if mode=="plus":
        d.polygon([(550,170),(620,265),(700,175),(765,300),(350,300),(418,180),(490,265)],fill=(147,74,250,236),outline=(219,177,255,230),width=4)
        d.rounded_rectangle((345,308,769,348),radius=10,fill=(199,129,255,222))
    else:
        # Minecraft-inspired generic block figure, not a screenshot of editor.
        d.rectangle((500,160,655,330),fill=(218,167,123,255),outline=(255,238,205,250),width=5)
        d.rectangle((490,160,665,218),fill=(76,49,111,255))
        d.rectangle((520,240,545,265),fill=(30,43,90,255))
        d.rectangle((610,240,635,265),fill=(30,43,90,255))
        d.rectangle((500,335,655,480),fill=(120,76,215,255),outline=(208,154,255,255),width=4)
        d.rectangle((460,347,495,485),fill=(125,82,209,255))
        d.rectangle((665,347,700,485),fill=(125,82,209,255))
    bbox=d.textbbox((0,0),title,font=font(58,True)); x=(width-(bbox[2]-bbox[0]))//2
    d.text((x,514),title,font=font(58,True),fill=(255,246,255,255),stroke_width=2,stroke_fill=(65,27,103,255))
    bbox=d.textbbox((0,0),subtitle,font=font(21));x=(width-(bbox[2]-bbox[0]))//2
    d.text((x,595),subtitle,font=font(21),fill=(204,184,236,255))
    im.save(target/f"{out}.webp","WEBP",quality=86,method=6)

concept("studio","SKIN STUDIO","Grafika koncepcyjna - funkcja launchera", "studio")
concept("plus","MINEVORA PLUS","Grafika koncepcyjna - wersja demonstracyjna", "plus")
print("Success: 17 unique images from launcher art")
