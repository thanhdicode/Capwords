from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/049.png"
OUTPUT = ROOT / "assets/profile-voice-settings-049.png"
SOURCE_SIZE = (1179, 2556)
CROP_BOUNDS = (170, 784, 1012, 1804)


def main() -> None:
    with Image.open(SOURCE) as image:
        if image.size != SOURCE_SIZE:
            raise ValueError(f"Expected source 049 at {SOURCE_SIZE}, got {image.size}")
        image.convert("RGB").crop(CROP_BOUNDS).save(OUTPUT, format="PNG")
    print(f"Wrote {OUTPUT.relative_to(ROOT)} from source-049 crop {CROP_BOUNDS}")


if __name__ == "__main__":
    main()
