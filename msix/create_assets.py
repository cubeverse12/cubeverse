"""Resize the project's original MINEVORA wolf logo for Windows package assets.
No external images, downloads, or credentials are required.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


SIZES = {
    "StoreLogo.png": (50, 50),
    "Square44x44Logo.png": (44, 44),
    "Square44x44Logo.scale-200.png": (88, 88),
    "Square44x44Logo.scale-400.png": (176, 176),
    "Square44x44Logo.targetsize-256.png": (256, 256),
    "Square150x150Logo.png": (150, 150),
    "Square150x150Logo.scale-200.png": (300, 300),
    "Square150x150Logo.scale-400.png": (600, 600),
}


def generate(source: Path, destination: Path) -> None:
    destination.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = original.convert("RGBA")
        for filename, size in SIZES.items():
            # Preserve the proportions and transparency of the owner's logo.
            resized = image.copy()
            resized.thumbnail(size, Image.Resampling.LANCZOS)
            canvas = Image.new("RGBA", size, (0, 0, 0, 0))
            canvas.alpha_composite(
                resized, dest=((size[0] - resized.width) // 2,
                               (size[1] - resized.height) // 2)
            )
            canvas.save(destination / filename, "PNG", optimize=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--destination", type=Path, required=True)
    args = parser.parse_args()
    generate(args.source, args.destination)
