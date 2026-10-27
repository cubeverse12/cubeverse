"""Create consistently cropped/sharpened MINEVORA website images from existing licensed repository assets.

Runs in GitHub Actions. Never alters the original images; produces new WebP files in
assets/website-photos-20261027/. Missing or corrupt inputs fail the build.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "website-photos-20261027"
SOURCE = {
    "home-hero": ("assets/enchanted_hero.jpg", (1600, 1000)),
    "home-minigry": ("assets/guide/minigry.webp", (850, 520)),
    "home-pvp": ("assets/guide/pvp-mode.webp", (850, 520)),
    "home-rankingi": ("assets/guide/awans.webp", (850, 520)),
    "home-poradnik": ("assets/launcher/start-hero.webp", (850, 520)),
    "home-plus": ("assets/guide/minevora-plus-demo-2-8.jpg", (850, 520)),
    "home-studio": ("assets/en_skins_highres.jpg", (850, 520)),
}
def enhance(input_path: Path, dest: Path, target: tuple[int, int], key: str):
    with Image.open(input_path) as original:
        original.load()
        im = ImageOps.exif_transpose(original).convert("RGB")
    # Preserve subject at center; don't stretch the asset to a wrong aspect ratio.
    # Upsizing source images is avoided where possible; output dimensions still
    # provide a consistent card layout, so small sources may be LANCZOS-scaled.
    im = ImageOps.fit(im, target, method=Image.Resampling.LANCZOS, centering=(.5, .45))
    im = ImageEnhance.Contrast(im).enhance(1.07)
    im = ImageEnhance.Color(im).enhance(1.12)
    im = im.filter(ImageFilter.UnsharpMask(radius=1.25, percent=125, threshold=3))
    # A restrained purple-blue grade retains actual game imagery and improves
    # contrast with the dark launcher design without artificial heavy filters.
    tint = Image.new("RGB", target, (76, 22, 110))
    im = Image.blend(im, tint, 0.07 if key != "home-hero" else 0.05)
    # Subtle darkening along the bottom to merge into the dark cards/hero.
    veil = Image.new("RGBA", target, (0, 0, 0, 0))
    draw = ImageDraw.Draw(veil)
    steps = 30
    for i in range(steps):
        y0 = int(target[1] * (0.65 + 0.35 * i / steps))
        y1 = int(target[1] * (0.65 + 0.35 * (i + 1) / steps)) + 1
        draw.rectangle((0, y0, target[0], y1), fill=(4, 6, 24, round((i / steps) * 65)))
    im = Image.alpha_composite(im.convert("RGBA"), veil).convert("RGB")
    dest.parent.mkdir(parents=True, exist_ok=True)
    im.save(dest, "WEBP", quality=89, method=6)
    with Image.open(dest) as saved:
        assert saved.size == target and saved.format == "WEBP", dest
    print(f"{dest.relative_to(ROOT)} : {target[0]}x{target[1]} ({dest.stat().st_size} bytes)")
def main():
    for name, (src, size) in SOURCE.items():
        p = ROOT / src
        if not p.is_file():
            raise FileNotFoundError(f"Required original image is missing: {p}")
        enhance(p, OUT / f"{name}.webp", size, name)
if __name__ == "__main__":
    main()
