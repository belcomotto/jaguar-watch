"""
Batch colorize MapBiomas Gran Chaco land-cover GeoTIFFs.

Pipeline per file:
  1. Reproject source (EPSG:4326 equirectangular) → EPSG:3857 (Web Mercator)
     so the pixel grid is co-registered with the Mapbox satellite basemap.
  2. Map class codes → RGBA using the Collection 5 legend.
  3. Output at TARGET_WIDTH px wide (height computed from the Mercator aspect ratio).

The nodata class (0) is transparent — the irregular Gran Chaco biome boundary
emerges naturally without any separate mask.
"""

import glob
import os
import re
import sys

import numpy as np
import rasterio
from rasterio.crs import CRS
from rasterio.warp import reproject, Resampling, calculate_default_transform, transform_bounds
from rasterio.transform import from_bounds as transform_from_bounds
from PIL import Image

TARGET_WIDTH = 2048   # output px width — height computed from EPSG:3857 aspect ratio

# ── MapBiomas Gran Chaco Collection 5 color table (R, G, B, A) ──────────────
COLORMAP = {
    0:  (  0,   0,   0,   0),   # nodata → transparent
    1:  ( 31, 141,  73, 230),   # Vegetación natural leñosa  #1f8d49
    3:  ( 31, 141,  73, 230),   # Leñosa cerrada             #1f8d49
    4:  (125, 201, 117, 230),   # Leñosa abierta             #7dc975
    45: (128, 122,  64, 230),   # Leñosa dispersa            #807a40
    6:  (  2, 105, 117, 230),   # Leñosa inundable           #026975
    10: (214, 188, 116, 230),   # Veg. natural herbácea      #d6bc74
    12: (214, 188, 116, 230),   # Pastizal                   #d6bc74
    43: (194, 210, 107, 230),   # Pastizal Cerrado           #c2d26b
    42: (165, 179,  91, 230),   # Pastizal Abierto           #a5b35b
    44: (203, 226, 134, 230),   # Pastizal Disperso          #cbe286
    11: ( 81, 151, 153, 230),   # Pastizal Inundable         #519799
    14: (255, 239, 195, 230),   # Área agropecuaria          #ffefc3
    15: (237, 222, 142, 230),   # Pastura                    #edde8e
    18: (233, 116, 237, 230),   # Agricultura                #e974ed
    19: (194, 123, 160, 230),   # Cultivos anuales           #C27BA0
    57: (249, 159, 255, 230),   # Cultivo simple             #f99fff
    58: (216,  70, 144, 230),   # Cultivo múltiple           #d84690
    36: (208, 130, 222, 230),   # Cultivo arbustivo          #d082de
    9:  (122,  89,   0, 230),   # Plantación forestal        #7a5900
    22: (212,  39,  30, 230),   # Área sin vegetación        #d4271e
    23: (255, 160, 122, 230),   # Playas y dunas             #ffa07a
    24: (212,  39,  30, 230),   # Área urbana                #d4271e
    25: (219,  77,  79, 230),   # Otras no vegetadas         #db4d4f
    61: (245, 213, 213, 230),   # Salares                    #f5d5d5
    26: ( 37,  50, 228, 230),   # Cuerpo de agua             #2532e4
    27: (255, 255, 255,   0),   # No observado → transparent
}

LUT = np.zeros((256, 4), dtype=np.uint8)
for code, rgba in COLORMAP.items():
    LUT[code] = rgba

DST_CRS = CRS.from_epsg(3857)


def colorize(tif_path, out_path):
    with rasterio.open(tif_path) as src:
        # Compute natural EPSG:3857 extent and resolution
        _, native_w, native_h = calculate_default_transform(
            src.crs, DST_CRS, src.width, src.height, *src.bounds
        )
        bounds_3857 = transform_bounds(src.crs, DST_CRS, *src.bounds)

        # Scale to TARGET_WIDTH, preserving Mercator aspect ratio
        dst_w = TARGET_WIDTH
        dst_h = round(native_h * dst_w / native_w)
        dst_transform = transform_from_bounds(*bounds_3857, dst_w, dst_h)

        # Reproject directly to the target output resolution (memory-efficient:
        # rasterio reads the source in blocks; destination is only dst_w×dst_h)
        data_3857 = np.zeros((dst_h, dst_w), dtype=np.uint8)
        reproject(
            source=rasterio.band(src, 1),
            destination=data_3857,
            src_transform=src.transform,
            src_crs=src.crs,
            dst_transform=dst_transform,
            dst_crs=DST_CRS,
            resampling=Resampling.nearest,   # must be nearest for categorical data
            src_nodata=0,
            dst_nodata=0,
        )

    # Apply LUT: class codes → RGBA
    rgba = LUT[data_3857]
    img = Image.fromarray(rgba, mode='RGBA')
    img.save(out_path, format='PNG', optimize=False)
    return img.size


# ── Main ──────────────────────────────────────────────────────────────────────

SRC_DIR = "/Users/belencomotto/Desktop/MASTER THESIS/ImepentrableWatch/granchacomapbiomas"
OUT_DIR = "/Users/belencomotto/impenetrable-watch/public/data/mapbiomas"
os.makedirs(OUT_DIR, exist_ok=True)

pattern = os.path.join(SRC_DIR, "*.tif")
files = sorted(glob.glob(pattern))

if not files:
    print("No .tif files found in", SRC_DIR, file=sys.stderr)
    sys.exit(1)

print(f"Processing {len(files)} files → {OUT_DIR}")
print(f"Output: {TARGET_WIDTH}px wide, EPSG:3857 (Web Mercator)")

for tif in files:
    year_match = re.match(r"(\d{4})_", os.path.basename(tif))
    if not year_match:
        continue
    year = year_match.group(1)
    out = os.path.join(OUT_DIR, f"mapbiomas_{year}.png")
    if os.path.exists(out):
        print(f"  {year} — already exists, skipping")
        continue
    size = colorize(tif, out)
    print(f"  {year} — {size[0]}×{size[1]} px → {os.path.basename(out)}")

print("Done.")
