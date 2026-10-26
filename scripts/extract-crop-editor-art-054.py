#!/usr/bin/env python3
"""Extract source-supported crop-editor icons from Gummble captures 011/054.

Only isolated guide/toolbar glyphs are used at runtime; no source screenshot is
rendered as an app screen. Each crop uses its local dark matte and retains the
observed white, gray or selected-blue artwork as alpha-safe 1x/@3x PNG assets.
"""
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE_011 = ROOT / "research/gummble/screens/011.png"
SOURCE_054 = ROOT / "research/gummble/screens/054.png"
OUTPUT_DIR = ROOT / "assets/crop-editor"

# All bounds are measured in native source pixels (the screenshots are 3x).
GLYPH_BOUNDS = {
    "guide": (546, 252, 636, 351),
    "rotate-left": (285, 2343, 354, 2421),
    "reset-crop": (477, 2352, 540, 2421),
    "select-ratio": (663, 2357, 741, 2420),
    "rotate-right": (858, 2343, 927, 2421),
}
SHARED_GLYPHS = ("guide", "rotate-left", "reset-crop", "select-ratio", "rotate-right")
MAX_SHARED_ALPHA_MAE = 18.0


def read_rgb(path: Path) -> np.ndarray:
    with Image.open(path) as image:
        return np.asarray(image.convert("RGB"), dtype=np.uint8)


def crop_for(source: np.ndarray, name: str) -> np.ndarray:
    x0, y0, x1, y1 = GLYPH_BOUNDS[name]
    crop = source[y0:y1, x0:x1]
    if crop.shape[0] % 3 or crop.shape[1] % 3:
        raise ValueError(f"{name} crop must be divisible by source scale 3: {crop.shape}")
    return crop


def estimate_matte(crop: np.ndarray) -> np.ndarray:
    corners = (
        crop[:2, :2],
        crop[:2, -2:],
        crop[-2:, :2],
        crop[-2:, -2:],
    )
    matte_pixels = np.concatenate([corner.reshape(-1, 3) for corner in corners])
    if float(matte_pixels.mean()) > 60:
        raise ValueError("Measured source crop no longer has dark matte corners")
    return np.median(matte_pixels, axis=0).astype(np.float32)


def estimate_foreground(crop: np.ndarray, name: str) -> np.ndarray:
    pixels = crop.astype(np.float32)
    if name == "guide":
        luminance = pixels.mean(axis=2)
        neutral = pixels.max(axis=2) - pixels.min(axis=2) < 24
        candidates = pixels[(luminance > 115) & (luminance < 205) & neutral]
    elif name == "select-ratio-active":
        candidates = pixels[
            (pixels[:, :, 2] - pixels[:, :, 0] > 80)
            & (pixels[:, :, 1] > 70)
            & (pixels[:, :, 2] > 140)
        ]
    else:
        luminance = pixels.mean(axis=2)
        neutral = pixels.max(axis=2) - pixels.min(axis=2) < 22
        candidates = pixels[(luminance > 225) & neutral]
    if not len(candidates):
        raise ValueError(f"Could not identify the {name} foreground color")
    return np.median(candidates, axis=0).astype(np.float32)


def extract_rgba(crop: np.ndarray, name: str) -> tuple[np.ndarray, np.ndarray]:
    matte = estimate_matte(crop)
    foreground = estimate_foreground(crop, name)
    matte_delta = foreground - matte
    denominator = float(np.dot(matte_delta, matte_delta))
    if denominator <= 0:
        raise ValueError(f"Invalid matte/foreground colors for {name}")
    pixels = crop.astype(np.float32)
    alpha = np.clip(((pixels - matte) @ matte_delta) / denominator, 0.0, 1.0)
    # Background texture/compression below this level is not part of the glyph.
    alpha[alpha < 0.035] = 0.0
    alpha_u8 = np.rint(alpha * 255).astype(np.uint8)
    rgba = np.empty((*alpha_u8.shape, 4), dtype=np.uint8)
    rgba[..., :3] = np.clip(np.rint(foreground), 0, 255).astype(np.uint8)
    rgba[..., 3] = alpha_u8
    return rgba, foreground


def write_asset(name: str, source: np.ndarray, source_id: str, output_name: str) -> np.ndarray:
    crop = crop_for(source, name if name != "select-ratio-active" else "select-ratio")
    rgba_3x, foreground = extract_rgba(crop, name)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    image_3x = Image.fromarray(rgba_3x, mode="RGBA")
    output_3x = OUTPUT_DIR / f"{output_name}@3x.png"
    output_1x = OUTPUT_DIR / f"{output_name}.png"
    image_3x.save(output_3x, optimize=True)

    alpha_1x = Image.fromarray(rgba_3x[..., 3], mode="L").resize(
        (rgba_3x.shape[1] // 3, rgba_3x.shape[0] // 3), Image.Resampling.LANCZOS
    )
    alpha = np.asarray(alpha_1x, dtype=np.uint8)
    rgba_1x = np.empty((*alpha.shape, 4), dtype=np.uint8)
    rgba_1x[..., :3] = np.clip(np.rint(foreground), 0, 255).astype(np.uint8)
    rgba_1x[..., 3] = alpha
    Image.fromarray(rgba_1x, mode="RGBA").save(output_1x, optimize=True)
    print(
        f"Wrote {output_name}: {output_1x.relative_to(ROOT)} "
        f"({alpha.shape[1]}x{alpha.shape[0]}), "
        f"{output_3x.relative_to(ROOT)} ({rgba_3x.shape[1]}x{rgba_3x.shape[0]}), "
        f"matte RGB {tuple(np.rint(estimate_matte(crop_for(source, name if name != 'select-ratio-active' else 'select-ratio'))).astype(int))}, "
        f"foreground RGB {tuple(np.rint(foreground).astype(int))}, source {source_id}"
    )
    return rgba_3x[..., 3]


def main() -> None:
    source_011 = read_rgb(SOURCE_011)
    source_054 = read_rgb(SOURCE_054)
    if source_011.shape[0] != source_054.shape[0] or source_011.shape[1] < 927 or source_054.shape[1] < 927:
        raise ValueError("Unexpected 011/054 source screenshot dimensions")

    shared_alpha_mae: dict[str, float] = {}
    for name in SHARED_GLYPHS:
        crop_011 = crop_for(source_011, name)
        crop_054 = crop_for(source_054, name)
        alpha_011, _ = extract_rgba(crop_011, name)
        source_054_variant = "select-ratio-active" if name == "select-ratio" else name
        alpha_054, _ = extract_rgba(crop_054, source_054_variant)
        mae = float(np.abs(alpha_011[..., 3].astype(np.int16) - alpha_054[..., 3].astype(np.int16)).mean())
        shared_alpha_mae[name] = mae
        if mae > MAX_SHARED_ALPHA_MAE:
            raise ValueError(f"011/054 {name} silhouettes differ: alpha MAE {mae:.2f}/255")

    write_asset("guide", source_054, "054", "crop-guide-054")
    write_asset("rotate-left", source_011, "011", "rotate-left-011")
    write_asset("reset-crop", source_011, "011", "reset-crop-011")
    write_asset("select-ratio", source_011, "011", "select-ratio-011")
    write_asset("select-ratio-active", source_054, "054", "select-ratio-active-054")
    write_asset("rotate-right", source_011, "011", "rotate-right-011")
    print("Cross-source alpha MAE /255:", {key: round(value, 3) for key, value in shared_alpha_mae.items()})


if __name__ == "__main__":
    main()
