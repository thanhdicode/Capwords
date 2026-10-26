#!/usr/bin/env python3
"""Extract the source-095 paywall background beneath reusable UI components."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/095.png"
OUTPUT = ROOT / "assets/patterns/paywall-marketing-background-095.png"
CAPTURE_SCALE = 3
CONTENT_TOP = 47
CONTENT_BOTTOM = 818
VIEWPORT_WIDTH = 393
# Opaque clone components cover these source capture regions completely.
OPAQUE_COMPONENT_ZONES = {
    "ai_badge": (217, 30, 269, 59),
    "annual_plan": (18, 178, 196, 301),
    "monthly_plan": (199, 178, 379, 301),
    "benefit_card_one": (17, 434, 378, 509),
    "benefit_card_two": (17, 515, 378, 592),
    "benefit_card_three": (17, 594, 378, 675),
    "trial_button": (17, 616, 379, 741),
}
DARK_TEXT_ZONES = {
    "header_copy": ((112, 10, 212, 58), 220),
    "cancel": ((318, 7, 393, 50), 220),
    "headline": ((24, 72, 369, 156), 230),
    "trial_disclosure": ((20, 741, 381, 771), 220),
}
GOLD_TEXT_ZONE = (100, 315, 295, 407)
ANTIALIAS_DILATION_KERNEL = np.ones((3, 3), dtype=np.uint8)
INPAINT_RADIUS = 6


def scaled(bounds: tuple[int, int, int, int]) -> tuple[int, int, int, int]:
    return tuple(value * CAPTURE_SCALE for value in bounds)


def add_local_mask(
    target: np.ndarray,
    bounds: tuple[int, int, int, int],
    local_mask: np.ndarray,
) -> None:
    x0, y0, x1, y1 = scaled(bounds)
    dilated = cv2.dilate(
        local_mask.astype(np.uint8),
        ANTIALIAS_DILATION_KERNEL,
        iterations=1,
    )
    target[y0:y1, x0:x1] = np.maximum(target[y0:y1, x0:x1], dilated)


def main() -> None:
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as image:
        expected = (VIEWPORT_WIDTH * CAPTURE_SCALE, 852 * CAPTURE_SCALE)
        if image.size != expected:
            raise ValueError(f"Unexpected source size: {image.size}")
        background = image.convert("RGBA").crop(
            (
                0,
                CONTENT_TOP * CAPTURE_SCALE,
                VIEWPORT_WIDTH * CAPTURE_SCALE,
                CONTENT_BOTTOM * CAPTURE_SCALE,
            )
        )

    pixels = np.array(background, dtype=np.uint8)
    opaque_mask = np.zeros(pixels.shape[:2], dtype=np.uint8)
    for bounds in OPAQUE_COMPONENT_ZONES.values():
        x0, y0, x1, y1 = scaled(bounds)
        opaque_mask[y0:y1, x0:x1] = 255

    text_mask = np.zeros(pixels.shape[:2], dtype=np.uint8)
    for bounds, cutoff in DARK_TEXT_ZONES.values():
        x0, y0, x1, y1 = scaled(bounds)
        region = pixels[y0:y1, x0:x1, :3].astype(np.float32)
        luminance = (
            region[:, :, 0] * 0.299
            + region[:, :, 1] * 0.587
            + region[:, :, 2] * 0.114
        )
        add_local_mask(text_mask, bounds, luminance < cutoff)

    x0, y0, x1, y1 = scaled(GOLD_TEXT_ZONE)
    region = pixels[y0:y1, x0:x1, :3]
    red, green, blue = region[:, :, 0], region[:, :, 1], region[:, :, 2]
    gold = (
        (red > 130)
        & (green > 70)
        & (blue < 210)
        & ((red.astype(np.int16) - green.astype(np.int16)) > 12)
        & ((green.astype(np.int16) - blue.astype(np.int16)) > 8)
    )
    add_local_mask(text_mask, GOLD_TEXT_ZONE, gold)
    text_mask[opaque_mask > 0] = 0

    repaired = cv2.inpaint(
        pixels[:, :, :3], text_mask, INPAINT_RADIUS, cv2.INPAINT_TELEA
    )
    pixels[:, :, :3] = repaired
    pixels[:, :, 3][opaque_mask > 0] = 0

    Image.fromarray(pixels, "RGBA").save(OUTPUT, format="PNG", optimize=True)
    print(f"Wrote {OUTPUT.relative_to(ROOT)}: {background.width}x{background.height}")


if __name__ == "__main__":
    main()
