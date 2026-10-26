#!/usr/bin/env python3
"""Extract the isolated idle-shutter illustration shared by Gummble 009/034.

The measured source crop is a 100 pt control at 3x capture resolution. The
source's near-black screen matte is sampled from its top-left pixel and removed;
the 1x derivative is downsampled in premultiplied space to avoid fringes.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_034 = ROOT / "research/gummble/screens/034.png"
SHARED_SOURCE_009 = ROOT / "research/gummble/screens/009.png"
CROP_BOUNDS = (441, 2151, 741, 2451)
SOURCE_ICON_PIXELS = 300
WEB_ICON_PIXELS = 100
MAX_SHARED_CROP_MAE = 1.0
OUTPUT_1X = ROOT / "assets/camera-shutter-capture.png"
OUTPUT_3X = ROOT / "assets/camera-shutter-capture@3x.png"


def read_capture_crop(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with Image.open(path) as image:
        rgb_image = image.convert("RGB")
        background = np.asarray(rgb_image.getpixel((0, 0)), dtype=np.int16)
        crop = np.asarray(rgb_image.crop(CROP_BOUNDS), dtype=np.uint8)
    if crop.shape != (SOURCE_ICON_PIXELS, SOURCE_ICON_PIXELS, 3):
        raise ValueError(f"Unexpected crop shape for {path}: {crop.shape}")
    return crop, background


def unpremultiply(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    alpha_float = alpha.astype(np.float32) / 255.0
    result = np.zeros_like(rgb, dtype=np.uint8)
    visible = alpha_float > 0
    scaled = np.zeros_like(rgb, dtype=np.float32)
    scaled[visible] = rgb[visible].astype(np.float32) / alpha_float[visible, None]
    result[visible] = np.clip(np.rint(scaled[visible]), 0, 255).astype(np.uint8)
    return result


def main() -> None:
    source, background = read_capture_crop(SOURCE_034)
    shared, _ = read_capture_crop(SHARED_SOURCE_009)
    source_mae = float(np.abs(source.astype(np.int16) - shared.astype(np.int16)).mean())
    if source_mae > MAX_SHARED_CROP_MAE:
        raise ValueError(
            f"The 009/034 shutter crops no longer match: mean RGB error {source_mae:.3f}"
        )

    # Source RGB was composited against the sampled near-black screen. Removing
    # that matte gives the premultiplied foreground used for alpha-safe resize.
    foreground = np.clip(source.astype(np.int16) - background, 0, 255).astype(np.uint8)
    alpha_3x = np.max(foreground, axis=2).astype(np.uint8)
    rgba_3x = np.dstack((unpremultiply(foreground, alpha_3x), alpha_3x))
    Image.fromarray(rgba_3x, "RGBA").save(OUTPUT_3X, optimize=True)

    premultiplied_1x = Image.fromarray(foreground, "RGB").resize(
        (WEB_ICON_PIXELS, WEB_ICON_PIXELS), Image.Resampling.LANCZOS
    )
    alpha_1x_image = Image.fromarray(alpha_3x, "L").resize(
        (WEB_ICON_PIXELS, WEB_ICON_PIXELS), Image.Resampling.LANCZOS
    )
    premultiplied_pixels = np.asarray(premultiplied_1x, dtype=np.uint8)
    alpha_1x = np.asarray(alpha_1x_image, dtype=np.uint8)
    rgba_1x = np.dstack((unpremultiply(premultiplied_pixels, alpha_1x), alpha_1x))
    Image.fromarray(rgba_1x, "RGBA").save(OUTPUT_1X, optimize=True)

    print(f"Source 009/034 crop mean RGB error: {source_mae:.3f}")
    print(f"Sampled screenshot background RGB: {tuple(int(v) for v in background)}")
    print(f"Wrote {OUTPUT_1X.relative_to(ROOT)} ({WEB_ICON_PIXELS}×{WEB_ICON_PIXELS})")
    print(f"Wrote {OUTPUT_3X.relative_to(ROOT)} ({SOURCE_ICON_PIXELS}×{SOURCE_ICON_PIXELS})")


if __name__ == "__main__":
    main()
