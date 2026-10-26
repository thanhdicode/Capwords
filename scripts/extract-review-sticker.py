#!/usr/bin/env python3
"""Extract only source-021 sticker artwork; never a full screenshot as runtime UI."""
from pathlib import Path
import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'research/gummble/screens/021.png'
# Source ID: 5b835109-c48b-4fcf-a550-2312a510fef9. No text or UI controls.
crop = np.array(Image.open(source).convert('RGB'))[770:1300, 450:730]
white = (crop.min(axis=2) > 245).astype('uint8') * 255
contours, _ = cv2.findContours(white, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
outline = max(contours, key=cv2.contourArea)
assert cv2.contourArea(outline) > 70000, 'Unexpected source: sticker outline missing'
alpha = np.zeros(white.shape, dtype='uint8')
cv2.drawContours(alpha, [outline], -1, 255, cv2.FILLED)
x, y, width, height = cv2.boundingRect(outline)
rgba = np.dstack((crop, alpha))[y:y+height, x:x+width]
target = ROOT / 'assets/stickers/review-icecream.png'
Image.fromarray(rgba).save(target)
print(target, (width, height))
