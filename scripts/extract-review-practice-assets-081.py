#!/usr/bin/env python3
"""Extract source-081 Review speckles and speaking-microphone artwork."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/081.png"
CARD_OUTPUT = ROOT / "assets/patterns/review-card-speckles-081.png"
CARD_OUTPUT_3X = ROOT / "assets/patterns/review-card-speckles-081@3x.png"
MIC_OUTPUT = ROOT / "assets/stickers/review-microphone-ring-081.png"
MIC_OUTPUT_3X = ROOT / "assets/stickers/review-microphone-ring-081@3x.png"

# Source-pixel bounds measured from the 1180×2556 capture (3× logical viewport).
CARD_BOUNDS = (125, 620, 1055, 1932)
CARD_SURFACE_RGB = np.array([223, 228, 231], dtype=np.float32)
CARD_FLECK_COLORS = tuple(
    np.array(color, dtype=np.float32)
    for color in (
        (118, 120, 123),
        (130, 134, 137),
        (143, 147, 150),
        (157, 158, 161),
        (170, 170, 168),
        (175, 175, 176),
    )
)
# Exclude only the source sticker; white labels and phonetics do not match the dark fleck palette.
CARD_ARTWORK_EXCLUSION = (440, 760, 740, 1310)
CARD_TEXT_REGIONS = ((240, 1350, 950, 1710), (330, 1695, 860, 1900))
CARD_TEXT_EDGE_RADIUS = 6
CARD_EDGE_EXCLUSION = 8
CARD_MIN_ALPHA = 0.025
CARD_MAX_COLOR_ERROR = 22.0
CARD_1X_SIZE = (310, 437)

MIC_BOUNDS = (420, 2120, 760, 2460)
MIC_ART_CENTER = (590, 2290)
MIC_ART_RADIUS = 167
MIC_ALPHA_DIFFERENCE = 2
SCREEN_BACKGROUND_RGB = np.array([246, 244, 247], dtype=np.uint8)
MIC_1X_SIZE = (113, 113)


def save_premultiplied_downsample(rgba: np.ndarray, size: tuple[int, int], output: Path) -> None:
    alpha = rgba[:, :, 3].astype(np.float32) / 255
    premultiplied = np.rint(rgba[:, :, :3].astype(np.float32) * alpha[:, :, None])
    resized_rgb = np.asarray(
        Image.fromarray(premultiplied.astype(np.uint8), "RGB").resize(
            size, Image.Resampling.LANCZOS
        ),
        dtype=np.float32,
    )
    resized_alpha = np.asarray(
        Image.fromarray(rgba[:, :, 3]).resize(size, Image.Resampling.LANCZOS),
        dtype=np.float32,
    )
    alpha_ratio = np.clip(resized_alpha / 255, 0, 1)
    resized_rgba = np.zeros((*size[::-1], 4), dtype=np.uint8)
    visible = alpha_ratio > 0.001
    resized_rgba[:, :, :3][visible] = np.rint(
        resized_rgb[visible] / alpha_ratio[visible, None]
    ).clip(0, 255).astype(np.uint8)
    resized_rgba[:, :, 3] = np.rint(resized_alpha).clip(0, 255).astype(np.uint8)
    output.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(resized_rgba).save(output)


def extract_card_speckles(source: np.ndarray) -> int:
    x0, y0, x1, y1 = CARD_BOUNDS
    card = source[y0:y1, x0:x1]
    height, width = card.shape[:2]
    allowed = np.ones((height, width), dtype=bool)
    allowed[:CARD_EDGE_EXCLUSION, :] = False
    allowed[-CARD_EDGE_EXCLUSION:, :] = False
    allowed[:, :CARD_EDGE_EXCLUSION] = False
    allowed[:, -CARD_EDGE_EXCLUSION:] = False
    gx0, gy0, gx1, gy1 = CARD_ARTWORK_EXCLUSION
    allowed[gy0 - y0 : gy1 - y0, gx0 - x0 : gx1 - x0] = False
    text_edge = cv2.getStructuringElement(
        cv2.MORPH_ELLIPSE,
        (CARD_TEXT_EDGE_RADIUS * 2 + 1, CARD_TEXT_EDGE_RADIUS * 2 + 1),
    )
    for tx0, ty0, tx1, ty1 in CARD_TEXT_REGIONS:
        region = source[ty0:ty1, tx0:tx1]
        white_ink = np.all(region >= 242, axis=2).astype(np.uint8)
        halo = cv2.dilate(white_ink, text_edge) > 0
        local = allowed[ty0 - y0 : ty1 - y0, tx0 - x0 : tx1 - x0]
        local[halo] = False

    pixels = card.astype(np.float32)
    surface_to_pixel = CARD_SURFACE_RGB - pixels
    best_error = np.full((height, width), np.inf, dtype=np.float32)
    best_alpha = np.zeros((height, width), dtype=np.float32)
    best_color = np.zeros((height, width, 3), dtype=np.uint8)

    for fleck in CARD_FLECK_COLORS:
        surface_to_fleck = CARD_SURFACE_RGB - fleck
        alpha = np.sum(surface_to_pixel * surface_to_fleck, axis=2) / np.dot(
            surface_to_fleck, surface_to_fleck
        )
        clipped = np.clip(alpha, 0, 1)
        reconstructed = CARD_SURFACE_RGB - clipped[:, :, None] * surface_to_fleck
        error = np.linalg.norm(pixels - reconstructed, axis=2)
        use = (
            allowed
            & (alpha >= CARD_MIN_ALPHA)
            & (alpha <= 1.05)
            & (error < CARD_MAX_COLOR_ERROR)
            & (error < best_error)
        )
        best_error[use] = error[use]
        best_alpha[use] = clipped[use]
        best_color[use] = fleck.astype(np.uint8)

    component_count, labels, stats, _ = cv2.connectedComponentsWithStats(
        (best_alpha > 0.03).astype(np.uint8), 8
    )
    for component in range(1, component_count):
        _, _, component_width, component_height, area = stats[component]
        if component_width > 24 or component_height > 24 or area > 350:
            best_alpha[labels == component] = 0

    rgba = np.zeros((*card.shape[:2], 4), dtype=np.uint8)
    rgba[:, :, :3] = best_color
    rgba[:, :, 3] = np.rint(best_alpha * 255).astype(np.uint8)
    CARD_OUTPUT_3X.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(CARD_OUTPUT_3X)
    save_premultiplied_downsample(rgba, CARD_1X_SIZE, CARD_OUTPUT)
    return int(np.count_nonzero(rgba[:, :, 3]))


def extract_microphone(source: np.ndarray) -> int:
    x0, y0, x1, y1 = MIC_BOUNDS
    crop = source[y0:y1, x0:x1]
    difference = np.max(
        np.abs(crop.astype(np.int16) - SCREEN_BACKGROUND_RGB.astype(np.int16)),
        axis=2,
    )
    crop_y, crop_x = np.ogrid[y0:y1, x0:x1]
    cx, cy = MIC_ART_CENTER
    artwork = (crop_x - cx) ** 2 + (crop_y - cy) ** 2 <= MIC_ART_RADIUS**2
    rgba = np.zeros((*crop.shape[:2], 4), dtype=np.uint8)
    rgba[:, :, :3] = crop
    # Keep non-background source pixels only inside the measured circle, excluding the hint above it.
    rgba[:, :, 3] = np.where(
        artwork & (difference > MIC_ALPHA_DIFFERENCE), 255, 0
    ).astype(np.uint8)
    MIC_OUTPUT_3X.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(rgba).save(MIC_OUTPUT_3X)
    save_premultiplied_downsample(rgba, MIC_1X_SIZE, MIC_OUTPUT)
    return int(np.count_nonzero(rgba[:, :, 3]))


def main() -> None:
    source = np.asarray(Image.open(SOURCE).convert("RGB"))
    if source.shape[:2] != (2556, 1180):
        raise RuntimeError(f"Unexpected source-081 dimensions: {source.shape[1]}×{source.shape[0]}")
    if tuple(source[100, 100]) != tuple(SCREEN_BACKGROUND_RGB):
        raise RuntimeError("Source-081 screen background changed; remeasure the matte")

    card_pixels = extract_card_speckles(source)
    mic_pixels = extract_microphone(source)
    print(
        f"Wrote source-081 card flecks ({card_pixels} alpha pixels) to "
        f"{CARD_OUTPUT.relative_to(ROOT)} and @3x; "
        f"wrote microphone ring ({mic_pixels} alpha pixels) to "
        f"{MIC_OUTPUT.relative_to(ROOT)} and @3x"
    )


if __name__ == "__main__":
    main()
