#!/usr/bin/env python3
"""Extract only the Une femme photo window from Gummble source 098."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/098.png"
OUTPUT = ROOT / "assets/stickers/review-portrait-photo-098.png"

# Native-pixel bounds of the source photo, excluding the Polaroid frame.
PHOTO_BOUNDS = (355, 863, 824, 1264)


def main() -> None:
    with Image.open(SOURCE) as image:
        photo = image.convert("RGB").crop(PHOTO_BOUNDS)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    photo.save(OUTPUT, format="PNG", optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: {photo.size[0]}x{photo.size[1]}")


if __name__ == "__main__":
    main()
