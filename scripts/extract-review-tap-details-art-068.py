#!/usr/bin/env python3
"""Extract the source-068 Review hand and cue icon as transparent artwork."""
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "research/gummble/screens/068.png"
image = cv2.imread(str(SOURCE), cv2.IMREAD_COLOR)
if image is None or image.shape[:2] != (2556, 1180):
    raise SystemExit("Expected the 1180×2556 Gummble source-068 screenshot")
rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

# The hand is the largest orange component in this measured card-local region.
hand_roi = (450, 1280, 735, 1620)
x0, y0, x1, y1 = hand_roi
roi_hsv = hsv[y0:y1, x0:x1]
orange = cv2.inRange(
    roi_hsv,
    np.array([5, 65, 140], dtype=np.uint8),
    np.array([28, 255, 255], dtype=np.uint8),
)
count, labels, stats, _ = cv2.connectedComponentsWithStats(orange, 8)
components = [row for row in stats[1:] if row[cv2.CC_STAT_AREA] > 10_000]
if not components:
    raise SystemExit("Source-068 hand silhouette was not found in its measured region")
component = max(components, key=lambda row: row[cv2.CC_STAT_AREA])
label = 1 + int(np.where((stats[1:] == component).all(axis=1))[0][0])
core = (labels == label).astype(np.uint8) * 255
# Recover the full hand interior, including its low-saturation highlights.
contours, _ = cv2.findContours(core, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
outline = max(contours, key=cv2.contourArea)
core.fill(0)
cv2.drawContours(core, [outline], -1, 255, cv2.FILLED)
pad = 16
border_kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21))
outer = cv2.dilate(core, border_kernel)
ys, xs = np.where(outer > 0)
left, right = max(int(xs.min()) - pad, 0), min(int(xs.max()) + pad + 1, x1 - x0)
top, bottom = max(int(ys.min()) - pad, 0), min(int(ys.max()) + pad + 1, y1 - y0)
hand_rgb = rgb[y0 + top : y0 + bottom, x0 + left : x0 + right].copy()
core_crop = core[top:bottom, left:right] > 0
outer_crop = outer[top:bottom, left:right] > 0
hand_rgba = np.zeros((*outer_crop.shape, 4), dtype=np.uint8)
hand_rgba[:, :, :3] = 255
hand_rgba[core_crop, :3] = hand_rgb[core_crop]
hand_rgba[:, :, 3] = cv2.GaussianBlur(
    outer_crop.astype(np.uint8) * 255, (3, 3), 0.65
)
hand_path = ROOT / "assets/stickers/review-tap-hand-068.png"
Image.fromarray(hand_rgba).save(hand_path)

# The circular tactile/detail glyph is isolated from the source on its flat screen background.
icon_box = (358, 473, 398, 513)
ix0, iy0, ix1, iy1 = icon_box
icon_rgb = rgb[iy0:iy1, ix0:ix1].copy()
edge = np.concatenate(
    [
        icon_rgb[:8].reshape(-1, 3),
        icon_rgb[-8:].reshape(-1, 3),
        icon_rgb[8:-8, :8].reshape(-1, 3),
        icon_rgb[8:-8, -8:].reshape(-1, 3),
    ],
    axis=0,
)
background = np.median(edge, axis=0)
distance = np.linalg.norm(icon_rgb.astype(np.float32) - background, axis=2)
alpha = np.clip((distance - 2.0) * (255.0 / 24.0), 0, 255).astype(np.uint8)
icon_rgba = np.dstack((icon_rgb, alpha))
icon_path = ROOT / "assets/review-tap-details-icon-068.png"
Image.fromarray(icon_rgba).save(icon_path)

print(f"{hand_path.relative_to(ROOT)}: {hand_rgba.shape[1]}×{hand_rgba.shape[0]} px")
print(f"{icon_path.relative_to(ROOT)}: {icon_rgba.shape[1]}×{icon_rgba.shape[0]} px")
