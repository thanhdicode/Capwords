#!/usr/bin/env python3
"""Extract the captured source-089 retry-feedback star at its original 3× pixels."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/089.png"
OUTPUT = ROOT / "assets/stickers/review-feedback-star-089.png"
# Tight crop around the native star, with a one-pixel high-resolution safety margin.
ICON_BOX = (244, 1663, 341, 1765)
EXPECTED_SOURCE_SIZE = (1179, 2556)


def main() -> None:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Missing source capture: {SOURCE}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(SOURCE) as source:
        if source.size != EXPECTED_SOURCE_SIZE:
            raise ValueError(
                f"Expected {EXPECTED_SOURCE_SIZE} source pixels, got {source.size}"
            )
        source.crop(ICON_BOX).save(OUTPUT, optimize=True)

    print(f"Extracted {ICON_BOX} from {SOURCE.name} -> {OUTPUT}")


if __name__ == "__main__":
    main()
