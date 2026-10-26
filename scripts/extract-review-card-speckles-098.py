#!/usr/bin/env python3
"""Extract antialiased charcoal paper flecks from Gummble source 098."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/098.png"
OUTPUT = ROOT / "assets/patterns/review-card-speckles-098.png"

# Measured native-pixel bounds from the 1179x2556 (3x) source capture.
CARD_BOUNDS = (125, 620, 1054, 1932)
POLAROID_BOUNDS = (311, 818, 868, 1374)
POLAROID_EXCLUSION_PADDING = 6
SURFACE_RGB = np.array([102, 99, 92], dtype=np.float32)
FLECK_RGB = np.array([61, 54, 43], dtype=np.float32)
MIN_ALPHA = 0.025


def main() -> None:
    source = np.asarray(Image.open(SOURCE).convert("RGB"))
    x0, y0, x1, y1 = CARD_BOUNDS
    card = source[y0:y1, x0:x1].astype(np.float32)

    allowed = np.ones(card.shape[:2], dtype=bool)
    px0, py0, px1, py1 = POLAROID_BOUNDS
    padding = POLAROID_EXCLUSION_PADDING
    allowed[
        py0 - y0 - padding : py1 - y0 + padding,
        px0 - x0 - padding : px1 - x0 + padding,
    ] = False

    # Rebuild source antialiasing as opacity over the measured flat surface.
    surface_to_fleck = SURFACE_RGB - FLECK_RGB
    surface_to_pixel = SURFACE_RGB - card
    alpha = np.sum(surface_to_pixel * surface_to_fleck, axis=2) / np.dot(
        surface_to_fleck, surface_to_fleck
    )
    alpha = np.clip(alpha, 0, 1)
    alpha[~allowed | (alpha < MIN_ALPHA)] = 0

    rgba = np.zeros((*card.shape[:2], 4), dtype=np.uint8)
    rgba[:, :, :3] = FLECK_RGB.astype(np.uint8)
    rgba[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUTPUT)
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)}: "
        f"{int(np.count_nonzero(rgba[:, :, 3]))} antialiased fleck pixels"
    )


if __name__ == "__main__":
    main()
