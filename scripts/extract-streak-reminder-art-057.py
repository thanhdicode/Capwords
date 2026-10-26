#!/usr/bin/env python3
"""Extract source-057 streak and calendar artwork with a row-local alpha matte."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/057.png"
ARTWORK_CROPS = {
    "streak-sign-mascot-057": ((450, 750, 735, 1020), (95, 90)),
    "streak-calendar-active-057": ((676, 2245, 787, 2356), (37, 37)),
}


def extract_transparent_crop(image_rgb: np.ndarray, crop_box: tuple[int, int, int, int]) -> np.ndarray:
    x0, y0, x1, y1 = crop_box
    crop = image_rgb[y0:y1, x0:x1]
    if crop.size == 0:
        raise SystemExit(f"Empty source crop: {crop_box}")
    # The screen background changes slightly by row. Estimate it from the clear
    # side margins so enclosed white sticker panels remain opaque artwork.
    edge_pixels = np.concatenate((crop[:, :12], crop[:, -12:]), axis=1)
    background = np.median(edge_pixels, axis=1).astype(np.float32)
    distance = np.linalg.norm(crop.astype(np.float32) - background[:, None, :], axis=2)
    alpha = np.clip((distance - 1.5) * (255.0 / 6.5), 0, 255).astype(np.uint8)
    rgba = np.dstack((crop, alpha))
    rgba[alpha == 0, :3] = 0
    return rgba


image = cv2.imread(str(SOURCE), cv2.IMREAD_COLOR)
if image is None or image.shape[:2] != (2556, 1180):
    raise SystemExit("Expected the 1180×2556 Gummble source-057 screenshot")
image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

for name, (crop_box, logical_size) in ARTWORK_CROPS.items():
    rgba = extract_transparent_crop(image_rgb, crop_box)
    base_path = ROOT / "assets" / f"{name}.png"
    density_path = ROOT / "assets" / f"{name}@3x.png"
    Image.fromarray(rgba).save(density_path)
    Image.fromarray(rgba).resize(logical_size, Image.Resampling.LANCZOS).save(base_path)
    print(f"{base_path.relative_to(ROOT)}: {logical_size[0]}×{logical_size[1]} px")
    print(f"{density_path.relative_to(ROOT)}: {rgba.shape[1]}×{rgba.shape[0]} px")
