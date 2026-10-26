#!/usr/bin/env python3
"""Reproducible source crops for an authorized personal study. No whole-screen UI substitutes."""
from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'research/gummble/screens'
OUT=ROOT/'assets/stickers'
OUT.mkdir(parents=True,exist_ok=True)
def cutout(name,source,box,bg=(244,244,244)):
    image=Image.open(SRC/source).convert('RGBA').crop(box)
    data=np.array(image)
    near=np.max(np.abs(data[:,:,:3].astype(int)-np.array(bg)),axis=2)<=7
    h,w=near.shape;seen=np.zeros((h,w),bool)
    q=deque([(x,0) for x in range(w)]+[(x,h-1) for x in range(w)]+[(0,y) for y in range(h)]+[(w-1,y) for y in range(h)])
    while q:
        x,y=q.popleft()
        if x<0 or y<0 or x>=w or y>=h or seen[y,x] or not near[y,x]:continue
        seen[y,x]=True;q.extend([(x-1,y),(x+1,y),(x,y-1),(x,y+1)])
    data[seen,3]=0
    Image.fromarray(data).save(OUT/f'{name}.png')
cutout('flower','015.png',(300,745,885,1390))
cutout('icecream','008.png',(765,1265,980,1595))
source=Image.open(SRC/'008.png').convert('RGBA')
photo=source.transform((280,235),Image.Transform.QUAD,(735,670,726,898,993,914,1007,688),Image.Resampling.BICUBIC)
photo.convert('RGB').save(ROOT/'assets/study-portrait.jpg',quality=95)
frame=Image.new('RGBA',(310,285),'white');frame.paste(photo,(15,15))
frame.rotate(-4,Image.Resampling.BICUBIC,expand=True).save(OUT/'portrait.png')
phone=Image.open(SRC/'004.png').convert('RGBA').crop((267,190,915,1555))
mask=Image.new('L',phone.size,0)
ImageDraw.Draw(mask).rounded_rectangle((0,0,phone.width-1,phone.height-1),radius=122,fill=255)
phone.putalpha(mask);phone.save(ROOT/'assets/onboarding-phone.png')
logo=Image.open(SRC/'003.png').convert('RGBA').crop((450,1000,735,1285))
data=np.array(logo);gray=data[:,:,:3].min(axis=2).astype(int)
data[:,:,3]=np.clip((220-gray)*2,0,255).astype('uint8')
Image.fromarray(data).save(ROOT/'assets/logo-mark.png')
Image.open(SRC/'001.png').convert('RGBA').crop((294,840,888,1434)).save(ROOT/'assets/camera-shutter.png')
print('Extracted source crops: flower, icecream, portrait, shutter, phone, logo')
