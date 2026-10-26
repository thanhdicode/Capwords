#!/usr/bin/env python3
"""Extract the Confirm control glyphs from Gummble sources 012 and 035.

The side buttons sit on source-specific flat mattes and the central checkmark
uses source-specific lavender. This script removes those local mattes, checks
that the same three glyph silhouettes are shared across both captures, and
writes small transparent 1x/@3x assets. It never uses a full-screen capture as
runtime artwork.
"""
from collections import Counter
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "research/gummble/screens"
OUTPUT_DIR = ROOT / "assets/confirm-controls"
SOURCE_IDS = ("012", "035")

# Full-resolution 3x screenshot pixel bounds, with two source pixels of safety
# padding around each glyph so antialiasing is preserved at the asset edge.
GLYPH_BOUNDS = {
    "rotate": (174, 2271, 256, 2331),
    "checkmark": (544, 2266, 637, 2336),
    "crop": (928, 2266, 1004, 2336),
}
# A larger common ROI is used only to compare alpha silhouettes between captures.
SILHOUETTE_ROI = {
    "rotate": (168, 2265, 261, 2334),
    "checkmark": (538, 2261, 643, 2341),
    "crop": (922, 2261, 1010, 2341),
}
BACKGROUND_SAMPLES = {
    "rotate": (260, 2300),
    "checkmark": (590, 2200),
    "crop": (1010, 2300),
}
WHITE_RGB = np.array([255, 254, 255], dtype=np.float32)
MAX_SHARED_ALPHA_MAE = 0.03
ALPHA_CUTOFF = 0.012


def read_source(source_id: str) -> np.ndarray:
    path = SOURCE_DIR / f"{source_id}.png"
    with Image.open(path) as image:
        rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    if rgb.shape[:2] != (2556, 1180):
        raise ValueError(f"Unexpected source dimensions for {path}: {rgb.shape}")
    return rgb


def foreground_rgb(source_id: str, glyph: str, crop: np.ndarray) -> np.ndarray:
    if glyph != "checkmark":
        return WHITE_RGB.copy()
    purple = (
        (crop[..., 2].astype(np.int16) - crop[..., 0].astype(np.int16) > 12)
        & (crop[..., 0] < 230)
        & (crop[..., 2] > 140)
    )
    colors = Counter(map(tuple, crop[purple].reshape(-1, 3).tolist()))
    if not colors:
        raise ValueError(f"No lavender checkmark pixels found in source {source_id}")
    return np.asarray(colors.most_common(1)[0][0], dtype=np.float32)


def extract_alpha(rgb: np.ndarray, matte: np.ndarray, foreground: np.ndarray) -> np.ndarray:
    denominator = foreground - matte
    if np.any(np.abs(denominator) < 1):
        raise ValueError("The measured matte and foreground must differ")
    channel_alpha = (rgb.astype(np.float32) - matte) / denominator
    alpha = np.clip(np.median(channel_alpha, axis=2), 0.0, 1.0)
    alpha[alpha < ALPHA_CUTOFF] = 0.0
    return alpha


def rgba_asset(
    source: np.ndarray,
    source_id: str,
    glyph: str,
    bounds: tuple[int, int, int, int],
) -> tuple[np.ndarray, np.ndarray]:
    x0, y0, x1, y1 = bounds
    crop = source[y0:y1, x0:x1]
    bg_x, bg_y = BACKGROUND_SAMPLES[glyph]
    matte = source[bg_y, bg_x].astype(np.float32)
    foreground = foreground_rgb(source_id, glyph, crop)
    alpha = extract_alpha(crop, matte, foreground)
    rgba = np.empty((*alpha.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(np.rint(foreground), 0, 255).astype(np.uint8)
    rgba[..., 3] = np.clip(np.rint(alpha * 255), 0, 255).astype(np.uint8)
    return rgba, alpha


def save_density_pair(rgba: np.ndarray, source_id: str, glyph: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    stem = f"{source_id}-{glyph}"
    rgba_3x = Image.fromarray(rgba, mode="RGBA")
    rgba_3x.save(OUTPUT_DIR / f"{stem}@3x.png", optimize=True)

    width_1x = max(1, round(rgba.shape[1] / 3))
    height_1x = max(1, round(rgba.shape[0] / 3))
    alpha_3x = Image.fromarray(rgba[..., 3], mode="L")
    alpha_1x = np.asarray(
        alpha_3x.resize((width_1x, height_1x), Image.Resampling.LANCZOS),
        dtype=np.uint8,
    )
    premultiplied_rgb = (
        rgba[..., :3].astype(np.float32) * (rgba[..., 3:4].astype(np.float32) / 255.0)
    ).clip(0, 255).astype(np.uint8)
    premultiplied_1x = np.asarray(
        Image.fromarray(premultiplied_rgb, mode="RGB").resize(
            (width_1x, height_1x), Image.Resampling.LANCZOS
        ),
        dtype=np.float32,
    )
    alpha_float = alpha_1x.astype(np.float32) / 255.0
    rgb_1x = np.zeros_like(premultiplied_1x, dtype=np.uint8)
    visible = alpha_float > 0
    unpremultiplied = np.zeros_like(premultiplied_1x, dtype=np.float32)
    unpremultiplied[visible] = premultiplied_1x[visible] / alpha_float[visible, None]
    rgb_1x[visible] = np.clip(np.rint(unpremultiplied[visible]), 0, 255).astype(np.uint8)
    rgba_1x = np.dstack((rgb_1x, alpha_1x))
    Image.fromarray(rgba_1x, mode="RGBA").save(
        OUTPUT_DIR / f"{stem}.png", optimize=True
    )


def main() -> None:
    sources = {source_id: read_source(source_id) for source_id in SOURCE_IDS}
    extracted: dict[str, dict[str, tuple[np.ndarray, np.ndarray]]] = {
        source_id: {} for source_id in SOURCE_IDS
    }

    for source_id, source in sources.items():
        for glyph, bounds in GLYPH_BOUNDS.items():
            rgba, _ = rgba_asset(source, source_id, glyph, bounds)
            extracted[source_id][glyph] = (rgba, _)

    for glyph, bounds in SILHOUETTE_ROI.items():
        roi_masks = {}
        for source_id, source in sources.items():
            x0, y0, x1, y1 = bounds
            matte_x, matte_y = BACKGROUND_SAMPLES[glyph]
            matte = source[matte_y, matte_x].astype(np.float32)
            foreground = foreground_rgb(source_id, glyph, source[y0:y1, x0:x1])
            roi_masks[source_id] = extract_alpha(
                source[y0:y1, x0:x1], matte, foreground
            )
        alpha_mae = float(
            np.abs(roi_masks["012"] - roi_masks["035"]).mean()
        )
        if alpha_mae > MAX_SHARED_ALPHA_MAE:
            raise ValueError(
                f"Source {glyph} silhouettes differ more than expected: "
                f"alpha MAE {alpha_mae:.4f}"
            )
        print(f"Shared {glyph} silhouette alpha MAE: {alpha_mae:.4f}")

    for source_id in SOURCE_IDS:
        for glyph, (rgba, _) in extracted[source_id].items():
            save_density_pair(rgba, source_id, glyph)
            x0, y0, x1, y1 = GLYPH_BOUNDS[glyph]
            print(
                f"Wrote {source_id}-{glyph}: "
                f"{x1 - x0}x{y1 - y0} @3x, "
                f"{max(1, round((x1 - x0) / 3))}x"
                f"{max(1, round((y1 - y0) / 3))} @1x"
            )


if __name__ == "__main__":
    main()
