#!/usr/bin/env python3
"""Extract only the three sparkle ornaments from the source-039 toast.

The toast's flat #373737 surface is removed from small, source-measured ROIs;
its neutral gray antialiasing is retained as alpha over the same design surface.
The source image is never used as a runtime screen background.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/039.png"
OUTPUT_1X = ROOT / "assets/patterns/collection-toast-sparkles-039.png"
OUTPUT_3X = ROOT / "assets/patterns/collection-toast-sparkles-039@3x.png"

# The source capture is 3x. Toast bounds begin at (10, 723) in full-screen pt:
# x=30 px, y=47 safe-area + 676 content px; sprite canvas is 80x80 pt.
SOURCE_TOAST_ORIGIN_3X = (30, 2169)
SPRITE_SIZE_3X = 240
BACKGROUND_RGB = np.array([55.0, 55.0, 55.0], dtype=np.float32)
SPARKLE_RGB = np.array([167.0, 167.0, 167.0], dtype=np.float32)
# Coordinates in 1x toast-local points, measured around the three ornaments.
SPARKLE_ROIS_PT = (
    (14, 12, 25, 23),
    (67, 10, 78, 21),
    (57, 60, 68, 72),
)


def extract_sprite() -> Image.Image:
    source = Image.open(SOURCE).convert("RGB")
    ox, oy = SOURCE_TOAST_ORIGIN_3X
    crop = np.asarray(
        source.crop((ox, oy, ox + SPRITE_SIZE_3X, oy + SPRITE_SIZE_3X)),
        dtype=np.float32,
    )
    sprite = np.zeros((SPRITE_SIZE_3X, SPRITE_SIZE_3X, 4), dtype=np.uint8)

    for x0, y0, x1, y1 in SPARKLE_ROIS_PT:
        bounds = (x0 * 3, y0 * 3, x1 * 3, y1 * 3)
        x0p, y0p, x1p, y1p = bounds
        pixels = crop[y0p:y1p, x0p:x1p]
        luminance = pixels.mean(axis=2)
        neutral = pixels.max(axis=2) - pixels.min(axis=2) <= 28
        alpha = np.clip(
            (luminance - BACKGROUND_RGB.mean())
            / (SPARKLE_RGB.mean() - BACKGROUND_RGB.mean()),
            0.0,
            1.0,
        )
        alpha[(luminance < 67) | ~neutral] = 0.0
        rgba = np.empty((*alpha.shape, 4), dtype=np.uint8)
        rgba[..., :3] = SPARKLE_RGB.astype(np.uint8)
        rgba[..., 3] = np.round(alpha * 255).astype(np.uint8)
        sprite[y0p:y1p, x0p:x1p] = rgba

    return Image.fromarray(sprite, mode="RGBA")


def main() -> None:
    sprite_3x = extract_sprite()
    OUTPUT_3X.parent.mkdir(parents=True, exist_ok=True)
    sprite_3x.save(OUTPUT_3X, optimize=True)
    sprite_1x = sprite_3x.resize((80, 80), Image.Resampling.LANCZOS)
    sprite_1x.save(OUTPUT_1X, optimize=True)
    print(f"Wrote {OUTPUT_1X} (80x80)")
    print(f"Wrote {OUTPUT_3X} (240x240)")


if __name__ == "__main__":
    main()
