#!/usr/bin/env python3
"""Extract source-095 benefit icons as transparent high-resolution assets."""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/095.png"
OUTPUT_DIR = ROOT / "assets/stickers"
CAPTURE_SCALE = 3
# Logical full-screen bounds measured from the 393x852 reference viewport.
ICON_BOUNDS = {
    "infinity": (40, 501, 79, 532),
    "book": (40, 575, 79, 613),
    "lock": (46, 660, 78, 699),
}
BACKGROUND_ALPHA_CUTOFF = 32


def remove_white_matte(image: Image.Image) -> Image.Image:
    pixels = np.asarray(image.convert("RGB"), dtype=np.float32)
    alpha = 255 - pixels.min(axis=2)
    alpha[alpha < BACKGROUND_ALPHA_CUTOFF] = 0
    safe_alpha = np.maximum(alpha, 1)
    foreground = np.clip(
        (pixels - (255 - alpha[..., None])) * (255 / safe_alpha[..., None]),
        0,
        255,
    ).astype(np.uint8)
    foreground[alpha == 0] = 0
    return Image.fromarray(np.dstack((foreground, alpha.astype(np.uint8))), "RGBA")


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        if source.size != (393 * CAPTURE_SCALE, 852 * CAPTURE_SCALE):
            raise ValueError(f"Unexpected source dimensions: {source.size}")
        for name, bounds in ICON_BOUNDS.items():
            native_bounds = tuple(value * CAPTURE_SCALE for value in bounds)
            crop = source.crop(native_bounds)
            output = OUTPUT_DIR / f"paywall-benefit-{name}-095.png"
            remove_white_matte(crop).save(output, format="PNG", optimize=True)
            print(f"Wrote {output.relative_to(ROOT)}: {crop.size}")


if __name__ == "__main__":
    main()
