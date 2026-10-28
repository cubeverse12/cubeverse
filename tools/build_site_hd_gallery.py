#!/usr/bin/env python3
"""MINEVORA: non-destructive HD artwork for all raster images displayed by /v4/.

Larger file dimensions and light sharpening improve scaling and compression,
but no upscaler can recreate detail lost in low-quality source files.
Original image files are never modified.
"""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "assets"
OUT = SRC / "site-hd"

# "cover": full-bleed Minecraft environment with centered crop to 16:9.
# "contain": preserve every part of the launcher screenshot and its text.
IMAGES = {
    "website-photos-20261027/home-hero.webp": "cover",
    "launcher-316/minigry.webp": "cover",
    "launcher-316/bedwars.webp": "cover",
    "launcher-316/skywars.webp": "cover",
    "launcher-316/tnt-run.webp": "cover",
    "launcher-316/parkour.webp": "cover",
    "launcher-316/build-battle.webp": "cover",
    "launcher-316/spleef.webp": "cover",
    "launcher-316/duels.webp": "cover",
    "launcher-316/crystal-pvp.webp": "cover",
    "launcher-316/rankingi.webp": "cover",
    "launcher-18-3-16/feature-pvp.webp": "contain",
    "launcher-18-3-16/launcher-preview.webp": "contain",
    "guide/rankingi.webp": "contain",
    "guide/awans.webp": "contain",
    "guide/skin-studio-plus-2-8.jpg": "contain",
}
RESAMPLE = Image.Resampling.LANCZOS


def upscale(source: Image.Image, size: tuple[int, int], mode: str) -> Image.Image:
    image = ImageOps.exif_transpose(source).convert("RGB")
    if mode == "cover":
        result = ImageOps.fit(image, size, method=RESAMPLE, centering=(0.5, 0.50))
    else:
        # The background is intentionally dark; do not blur the actual screenshot.
        background = ImageOps.fit(image, size, method=RESAMPLE)
        background = background.filter(ImageFilter.GaussianBlur(22))
        background = ImageEnhance.Brightness(background).enhance(0.33)
        foreground = ImageOps.contain(image, (size[0]-32, size[1]-32), method=RESAMPLE)
        pos = ((size[0]-foreground.width)//2, (size[1]-foreground.height)//2)
        background.paste(foreground, pos)
        result = background

    # Mild halo-controlled sharpening after resampling; no aggressive AI detail fabrication.
    result = ImageEnhance.Contrast(result).enhance(1.025)
    result = result.filter(ImageFilter.UnsharpMask(radius=1.05, percent=115, threshold=3))
    return result


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    records = {}
    for rel, mode in IMAGES.items():
        src = SRC / rel
        if not src.is_file():
            raise FileNotFoundError(f"Missing original: {src}")
        dest = OUT / (rel.replace("/", "-").rsplit(".", 1)[0] + ".webp")
        size = (1920, 1080) if rel.endswith("home-hero.webp") else (1600, 900)
        with Image.open(src) as original:
            generated = upscale(original, size, mode)
        generated.save(dest, format="WEBP", quality=91, method=6)
        with Image.open(dest) as check:
            check.verify()
        variants = {}
        # Real responsive images, not a 1600px file sent to a 350px mobile card.
        # Source artwork remains unchanged; variants are generated from the source.
        for width, quality in ((640, 79), (960, 81), (1280, 83)):
            if width >= size[0]:
                continue
            target = (width, width * 9 // 16)
            small = upscale(original, target, mode)
            mobile_path = OUT / (dest.stem + f"-{width}.webp")
            small.save(mobile_path, format="WEBP", quality=quality, method=6)
            with Image.open(mobile_path) as verified:
                assert verified.size == target
                verified.verify()
            variants[str(width)] = {
                "file": "site-hd/" + mobile_path.name,
                "width": width,
                "height": target[1],
                "bytes": mobile_path.stat().st_size,
            }
        records[rel] = {
            "file": "site-hd/" + dest.name,
            "width": size[0],
            "height": size[1],
            "mode": mode,
            "bytes": dest.stat().st_size,
            "variants": variants,
        }
        print(f"{rel} -> {dest.name} ({size[0]}x{size[1]}, {dest.stat().st_size:,} B)")
    assert len(records) == len(IMAGES)
    (OUT / "manifest.json").write_text(
        json.dumps({"v": 2, "images": records}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Generated {len(records)} HD images, originals unchanged.")


if __name__ == "__main__":
    main()
