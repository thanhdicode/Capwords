from pathlib import Path

from PIL import Image


SOURCE = Path("research/gummble/screens/065.png")
OUTPUT = Path("assets/gummble-source-065-photo-crop.png")
SOURCE_SIZE = (1180, 2556)
PHOTO_BOUNDS = (0, 500, 1180, 2150)


def main() -> None:
    with Image.open(SOURCE) as image:
        if image.size != SOURCE_SIZE:
            raise ValueError(f"Expected source size {SOURCE_SIZE}, got {image.size}")
        photo = image.crop(PHOTO_BOUNDS)
        if photo.size != (1180, 1650):
            raise ValueError(f"Unexpected photo crop size: {photo.size}")
        photo.save(OUTPUT, format="PNG", optimize=True)


if __name__ == "__main__":
    main()
