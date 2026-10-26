#!/usr/bin/env python3
"""Extract the antialiased paper flecks from the source-094 Review card."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/094.png"
OUTPUT = ROOT / "assets/patterns/review-card-speckles-094.png"
OUTPUT_3X = ROOT / "assets/patterns/review-card-speckles-094@3x.png"
OUTPUT_1X_SIZE = (309, 437)

# Bounds of the largest orange card component measured in source 094.
CARD_BOUNDS = (125, 620, 1054, 1932)
SURFACE_RGB = np.array([209, 130, 58], dtype=np.float32)
FLECK_COLORS = (
    np.array([146, 87, 37], dtype=np.float32),
    np.array([120, 69, 27], dtype=np.float32),
    np.array([99, 69, 42], dtype=np.float32),
    np.array([73, 73, 68], dtype=np.float32),
)
# Exclude only source artwork and lettering; preserve open paper for real source grain.
CONTENT_EXCLUSIONS = (
    (330, 760, 850, 1380),  # flower sticker, white edge and captured shadow
    (300, 1400, 890, 1620),  # Tournesol title and antialiasing
    (385, 1660, 810, 1845),  # phonetics and speaker glyph
)
CARD_EDGE_EXCLUSION = 12
MIN_ALPHA = 0.025
MAX_COLOR_ERROR = 22.0


def main() -> None:
    source = np.asarray(Image.open(SOURCE).convert("RGB"))
    x0, y0, x1, y1 = CARD_BOUNDS
    card = source[y0:y1, x0:x1]

    # Locate the orange paper component before excluding artwork and its edge.
    red, green, blue = card.transpose(2, 0, 1)
    orange = (
        (red > 165)
        & (green > 75)
        & (green < 180)
        & (blue < 120)
        & ((red.astype(np.int16) - green.astype(np.int16)) > 35)
    ).astype(np.uint8)
    closed = cv2.morphologyEx(
        orange, cv2.MORPH_CLOSE, np.ones((9, 9), dtype=np.uint8)
    )
    contours, _ = cv2.findContours(
        closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    if not contours:
        raise RuntimeError("Could not locate source-094 orange card surface")
    card_mask = np.zeros_like(orange)
    cv2.drawContours(card_mask, [max(contours, key=cv2.contourArea)], -1, 1, -1)
    edge_kernel = np.ones(
        (CARD_EDGE_EXCLUSION * 2 + 1, CARD_EDGE_EXCLUSION * 2 + 1),
        dtype=np.uint8,
    )
    card_mask = cv2.erode(card_mask, edge_kernel)

    allowed = card_mask.astype(bool)
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
    Image.fromarray(rgba).save(OUTPUT_3X)

    # Downsample premultiplied color and alpha separately to prevent dark fringes.
    alpha = rgba[:, :, 3].astype(np.float32) / 255
    premultiplied = np.rint(rgba[:, :, :3].astype(np.float32) * alpha[:, :, None])
    resized_rgb = np.asarray(
        Image.fromarray(premultiplied.astype(np.uint8), "RGB").resize(
            OUTPUT_1X_SIZE, Image.Resampling.LANCZOS
        ),
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
