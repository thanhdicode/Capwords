"""Extract exact language-flag artwork from the Gummble 052 source capture.

The source screenshot is 1179/1180×2556 px at 3×. Crop bounds below were
measured around the eight flag symbols in its language grid. Output PNGs are
stored at @3x so the app can render them at the source's 40×30 pt icon frame.
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/052.png"
OUTPUT = ROOT / "assets/source-language-flags"
LOGICAL_ICON_SIZE = (40, 30)
SOURCE_ICON_SIZE = (LOGICAL_ICON_SIZE[0] * 3, LOGICAL_ICON_SIZE[1] * 3)

# Source-pixel bounds in (left, top, right, bottom) order.
FLAG_CROPS = {
    "zh": (253, 971, 374, 1061),
    "en": (808, 971, 927, 1061),
    "en-GB": (253, 1331, 374, 1421),
    "fr": (807, 1331, 928, 1421),
    "es": (253, 1691, 375, 1781),
    "ja": (788, 1691, 904, 1781),
    "ko": (253, 2071, 375, 2161),
    "de": (808, 2071, 928, 2161),
}


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing source capture: {SOURCE}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        if source.size != (1180, 2556):
            raise ValueError(f"Unexpected source dimensions: {source.size}")
        for code, bounds in FLAG_CROPS.items():
            crop = source.crop(bounds)
            high_density = crop.resize(SOURCE_ICON_SIZE, Image.Resampling.LANCZOS)
            standard_density = crop.resize(LOGICAL_ICON_SIZE, Image.Resampling.LANCZOS)
            high_density_path = OUTPUT / f"flag-{code}@3x.png"
            standard_density_path = OUTPUT / f"flag-{code}.png"
            high_density.save(high_density_path, format="PNG", optimize=True)
            standard_density.save(
                standard_density_path, format="PNG", optimize=True
            )
            print(
                f"{code}: {bounds} -> {standard_density_path.relative_to(ROOT)} "
                f"({LOGICAL_ICON_SIZE[0]}×{LOGICAL_ICON_SIZE[1]} px), "
                f"{high_density_path.relative_to(ROOT)} "
                f"({SOURCE_ICON_SIZE[0]}×{SOURCE_ICON_SIZE[1]} px)"
            )


if __name__ == "__main__":
    main()
