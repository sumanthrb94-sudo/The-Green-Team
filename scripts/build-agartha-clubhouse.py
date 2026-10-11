#!/usr/bin/env python3
"""
Colour layer for the Agartha clubhouse block on the master plan.

Reads public/agartha-master-plan.webp (black line art), finds the closed
regions inside the central amenity block, and paints them — lake, roads,
lawn, pool, buildings — into public/layouts/agartha-clubhouse.webp, a
transparent image the same size as the plan. /map draws it under the white
line-art overlay, so the clubhouse reads in colour on the satellite imagery.

Region ids come from scipy's labelling of this exact crop, so re-run the
script (and re-check the ids) if the master plan image is ever replaced.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

SRC = 'public/agartha-master-plan.webp'
OUT = 'public/layouts/agartha-clubhouse.webp'

im = Image.open(SRC).convert('L')
W, H = im.size
x0, y0, x1, y1 = int(.44 * W), int(.46 * H), int(.69 * W), int(.84 * H)
a = np.array(im)[y0:y1, x0:x1]
h, w = a.shape

lines = ndi.binary_dilation(a < 170, iterations=1)
lab, n = ndi.label(~lines)
sizes = np.bincount(lab.ravel(), minlength=n + 1)

# The block's outline (crop px): left x=13, right x=295, top y=57, slanted bottom
def inside_block(cx, cy):
    bottom = 480 - (cx - 13) / 282 * 32
    return 13 <= cx <= 295 and 57 <= cy <= bottom

LAKE, ROADS, DECK, BANK, MEADOW, POOL = 19, 12, {69, 83}, 13, 31, 160
OUTSIDE = {1, 2}

PAL = {
    'lawn':   (120, 168, 87, 150),
    'roads':  (216, 199, 159, 225),
    'lake':   (63, 143, 208, 225),
    'deck':   (201, 163, 106, 235),
    'bank':   (79, 138, 63, 190),
    'meadow': (156, 196, 106, 165),
    'pool':   (111, 207, 216, 225),
    'roof':   (184, 103, 74, 235),
}

rgba = np.zeros((h, w, 4), np.uint8)
def paint(mask, key):
    rgba[mask] = PAL[key]

for l in range(1, n + 1):
    if l in OUTSIDE or sizes[l] < 12:
        continue
    ys, xs = np.nonzero(lab == l)
    if not inside_block(xs.mean(), ys.mean()):
        continue
    m = lab == l
    key = ('lake' if l == LAKE else 'roads' if l == ROADS else 'deck' if l in DECK else
           'bank' if l == BANK else 'meadow' if l == MEADOW else 'pool' if l == POOL else 'lawn')
    paint(m, key)

# Buildings: the three retreat pods on the left, two on the loop, the banquet hall
# and the curved arrival building (boxes in crop px, painted where not line art).
yy, xx = np.mgrid[0:h, 0:w]
def ellipse(cx, cy, rx, ry):
    return ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1
roofs = [
    ellipse(43, 298, 13, 22), ellipse(40, 365, 12, 22), ellipse(43, 430, 12, 22),   # retreat pods
    ellipse(103, 335, 13, 21), ellipse(116, 405, 14, 20),                           # pods on the loop
    ellipse(272, 300, 18, 27), ellipse(262, 365, 19, 25),                           # banquet hall
]
for r in roofs:
    paint(r & ~lines & (rgba[..., 3] > 0), 'roof')
# curved arrival building: the arc band left of the reception circle
arc = ((xx - 80) ** 2 + (yy - 195) ** 2 <= 56 ** 2) & ((xx - 80) ** 2 + (yy - 195) ** 2 >= 40 ** 2) & (xx > 55) & (yy > 150) & (yy < 265)
paint(arc & ~lines & (rgba[..., 3] > 0), 'roof')

# Close the 1-2 px gaps under the line art so colour runs to the lines
painted = rgba[..., 3] > 0
dist, (iy, ix) = ndi.distance_transform_edt(~painted, return_indices=True)
grow = (~painted) & (dist <= 3) & lines
rgba[grow] = rgba[iy[grow], ix[grow]]

full = np.zeros((H, W, 4), np.uint8)
full[y0:y1, x0:x1] = rgba
Image.fromarray(full, 'RGBA').save(OUT, 'WEBP', quality=85, method=6)
print('wrote', OUT, 'painted px:', int((full[..., 3] > 0).sum()))
