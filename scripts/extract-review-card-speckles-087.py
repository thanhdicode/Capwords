#!/usr/bin/env python3
"""Extract the antialiased brown paper flecks from Gummble source 087."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/087.png"
OUTPUT = ROOT / "assets/patterns/review-card-speckles-087.png"
OUTPUT_3X = ROOT / "assets/patterns/review-card-speckles-087@3x.png"
OUTPUT_1X_SIZE = (295, 416)

# Native-pixel bounds measured from the largest orange surface component.
CARD_BOUNDS = (148, 652, 1034, 1903)
SURFACE_RGB = np.array([213, 131, 61], dtype=np.float32)
FLECK_COLORS = (
    np.array([146, 87, 37], dtype=np.float32),
    np.array([120, 69, 27], dtype=np.float32),
)
# Content bounds are measured from source 087 and padded to avoid photo/copy bleed.
CONTENT_EXCLUSIONS = (
    (356, 844, 822, 1368),  # flower sticker and white edge
    (320, 1568, 850, 1680),  # Tournesol label
    (414, 1742, 764, 1820),  # phonetics and speaker
)
CARD_EDGE_EXCLUSION = 12
MIN_ALPHA = 0.025
MAX_COLOR_ERROR = 18.0


def main() -> None:
    source = np.asarray(Image.open(SOURCE).convert("RGB"))
    x0, y0, x1, y1 = CARD_BOUNDS
    card = source[y0:y1, x0:x1]

    # Restrict extraction to the measured orange card silhouette, not the deck beneath it.
    r, g, b = card.transpose(2, 0, 1)
    orange = (
        (r > 165)
        & (g > 75)
        & (g < 180)
        & (b < 115)
        & ((r.astype(np.int16) - g.astype(np.int16)) > 40)
    ).astype(np.uint8)
    closed = cv2.morphologyEx(
        orange, cv2.MORPH_CLOSE, np.ones((9, 9), dtype=np.uint8)
    )
    contours, _ = cv2.findContours(
        closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        raise RuntimeError("Could not locate source-087 orange card surface")
    surface_mask = np.zeros_like(orange)
    cv2.drawContours(surface_mask, [max(contours, key=cv2.contourArea)], -1, 1, -1)
    edge_kernel = np.ones(
        (CARD_EDGE_EXCLUSION * 2 + 1, CARD_EDGE_EXCLUSION * 2 + 1),
        dtype=np.uint8,
    )
    surface_mask = cv2.erode(surface_mask, edge_kernel)

    allowed = surface_mask.astype(bool)
    for gx0, gy0, gx1, gy1 in CONTENT_EXCLUSIONS:
        allowed[gy0 - y0 : gy1 - y0, gx0 - x0 : gx1 - x0] = False

    pixels = card.astype(np.float32)
    best_error = np.full(card.shape[:2], np.inf, dtype=np.float32)
    best_alpha = np.zeros(card.shape[:2], dtype=np.float32)
    best_color = np.zeros((*card.shape[:2], 3), dtype=np.uint8)

    for fleck in FLECK_COLORS:
        surface_to_fleck = SURFACE_RGB - fleck
        surface_to_pixel = SURFACE_RGB - pixels
        alpha = np.sum(surface_to_pixel * surface_to_fleck, axis=2) / np.dot(
            surface_to_fleck, surface_to_fleck
        )
        clipped = np.clip(alpha, 0, 1)
        reconstructed = SURFACE_RGB - clipped[:, :, None] * surface_to_fleck
        error = np.linalg.norm(pixels - reconstructed, axis=2)
        use = (
            allowed
            & (alpha >= MIN_ALPHA)
            & (alpha <= 1.05)
            & (error < MAX_COLOR_ERROR)
            & (error < best_error)
        )
        best_error[use] = error[use]
        best_alpha[use] = clipped[use]
        best_color[use] = fleck.astype(np.uint8)

    rgba = np.zeros((*card.shape[:2], 4), dtype=np.uint8)
    rgba[:, :, :3] = best_color
    rgba[:, :, 3] = np.rint(best_alpha * 255).astype(np.uint8)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    high_resolution = Image.fromarray(rgba)
    high_resolution.save(OUTPUT_3X)

    # Pre-filter the web/1x asset with premultiplied alpha to avoid dark RGB bleed.
    alpha = rgba[:, :, 3].astype(np.float32) / 255
    premultiplied = np.rint(rgba[:, :, :3].astype(np.float32) * alpha[:, :, None])
    premultiplied_image = Image.fromarray(premultiplied.astype(np.uint8), "RGB")
    resized_rgb = np.asarray(
        premultiplied_image.resize(OUTPUT_1X_SIZE, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    resized_alpha = np.asarray(
        Image.fromarray(rgba[:, :, 3]).resize(
            OUTPUT_1X_SIZE, Image.Resampling.LANCZOS
        ),
        dtype=np.float32,
    )
    alpha_ratio = np.clip(resized_alpha / 255, 0, 1)
    resized_rgba = np.zeros((*OUTPUT_1X_SIZE[::-1], 4), dtype=np.uint8)
    visible = alpha_ratio > 0.001
    resized_rgba[:, :, :3][visible] = np.rint(
        resized_rgb[visible] / alpha_ratio[visible, None]
    ).clip(0, 255).astype(np.uint8)
    resized_rgba[:, :, 3] = np.rint(resized_alpha).clip(0, 255).astype(np.uint8)
    Image.fromarray(resized_rgba).save(OUTPUT)
    print(
        f"Wrote {OUTPUT.relative_to(ROOT)} ({OUTPUT_1X_SIZE[0]}x{OUTPUT_1X_SIZE[1]}) "
        f"and {OUTPUT_3X.relative_to(ROOT)} ({rgba.shape[1]}x{rgba.shape[0]}): "
        f"{int(np.count_nonzero(rgba[:, :, 3]))} antialiased fleck pixels"
    )


if __name__ == "__main__":
    main()
