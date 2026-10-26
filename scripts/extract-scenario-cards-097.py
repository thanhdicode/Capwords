"""Extract source 097's card-fan illustration crop for the intro sheet."""
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/097.png"
OUTPUT = ROOT / "assets/scenario-memory-cards-097.png"
SOURCE_SIZE = (1180, 2556)
# Tight source-space bounds around the five-card illustration, including its
# pale sheet-colored margin and shadows but excluding surrounding copy/actions.
ILLUSTRATION_CROP = (48, 637, 1132, 1482)

with Image.open(SOURCE) as image:
    if image.size != SOURCE_SIZE:
        raise ValueError(f"Unexpected source-097 size: {image.size}")
    image.crop(ILLUSTRATION_CROP).save(OUTPUT, optimize=True)

print(f"Wrote {OUTPUT.relative_to(ROOT)} from {SOURCE.relative_to(ROOT)}")
