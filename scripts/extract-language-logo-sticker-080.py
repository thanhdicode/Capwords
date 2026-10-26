#!/usr/bin/env python3
"""Extract the source-080 onboarding brand sticker at its captured resolution."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/080.png"
OUTPUT_DIR = ROOT / "assets/onboarding"
SOURCE_VIEWPORT = (1180, 2556)
SOURCE_BACKGROUND_RGB = (246, 244, 247)
LOGO_STICKER_CROP = (480, 313, 700, 533)
DISPLAY_SIZE_1X = (74, 74)
DISPLAY_SIZE_3X = (220, 220)


def main() -> None:
    with Image.open(SOURCE) as source_image:
        if source_image.size != SOURCE_VIEWPORT:
            raise ValueError(
                f"Expected {SOURCE_VIEWPORT} source pixels, got {source_image.size}"
            )
        screenshot = source_image.convert("RGB")
        if screenshot.getpixel((LOGO_STICKER_CROP[0], LOGO_STICKER_CROP[1])) != SOURCE_BACKGROUND_RGB:
            raise ValueError("Logo crop origin no longer matches the source background")
        artwork = screenshot.crop(LOGO_STICKER_CROP)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    artwork.resize(DISPLAY_SIZE_1X, Image.Resampling.LANCZOS).save(
        OUTPUT_DIR / "language-logo-sticker-080.png"
    )
    if artwork.size != DISPLAY_SIZE_3X:
        raise ValueError(f"Unexpected @3x logo size: {artwork.size}")
    artwork.save(OUTPUT_DIR / "language-logo-sticker-080@3x.png")


if __name__ == "__main__":
    main()
