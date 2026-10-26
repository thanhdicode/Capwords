from pathlib import Path

import cv2
import numpy as np


SOURCE = Path("research/gummble/screens/012.png")
OUTPUT = Path("assets/gummble-source-012-photo-crop.png")
SOURCE_SIZE = (1180, 2556)
PHOTO_CORNERS = np.float32(
    [[303, 824], [916, 870], [881, 1388], [272, 1338]]
)
PHOTO_SIZE = (614, 519)
PHOTO_DESTINATION = np.float32(
    [[0, 0], [PHOTO_SIZE[0], 0], [PHOTO_SIZE[0], PHOTO_SIZE[1]], [0, PHOTO_SIZE[1]]]
)


def main() -> None:
    source = cv2.imread(str(SOURCE))
    if source is None:
        raise FileNotFoundError(SOURCE)
    if (source.shape[1], source.shape[0]) != SOURCE_SIZE:
        raise ValueError(f"Expected source size {SOURCE_SIZE}, got {source.shape[1::-1]}")
    transform = cv2.getPerspectiveTransform(PHOTO_CORNERS, PHOTO_DESTINATION)
    photo = cv2.warpPerspective(
        source,
        transform,
        PHOTO_SIZE,
        flags=cv2.INTER_CUBIC,
    )
    if not cv2.imwrite(str(OUTPUT), photo):
        raise OSError(f"Could not write {OUTPUT}")


if __name__ == "__main__":
    main()
