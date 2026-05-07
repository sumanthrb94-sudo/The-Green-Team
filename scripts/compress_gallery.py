#!/usr/bin/env python3
"""Convert all PNG/JPG/JPEG in public/gallery to WebP at q85, max 2400px wide.
Deletes originals after successful conversion."""
import os
import sys
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).parent.parent / "public" / "gallery"
MAX_WIDTH = 2400
QUALITY = 85

total_before = 0
total_after = 0
converted = 0
skipped = 0

for path in ROOT.rglob("*"):
    if not path.is_file():
        continue
    if path.suffix.lower() not in (".png", ".jpg", ".jpeg"):
        continue

    out = path.with_suffix(".webp")
    before = path.stat().st_size
    total_before += before

    try:
        img = Image.open(path)
        if img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGBA")
        else:
            img = img.convert("RGB")

        if img.width > MAX_WIDTH:
            ratio = MAX_WIDTH / img.width
            img = img.resize((MAX_WIDTH, int(img.height * ratio)), Image.LANCZOS)

        img.save(out, "WEBP", quality=QUALITY, method=6)
        after = out.stat().st_size
        total_after += after

        path.unlink()
        converted += 1
        print(f"  {path.relative_to(ROOT)}: {before//1024}KB -> {after//1024}KB ({100*after//before}%)")
    except Exception as e:
        print(f"FAIL {path}: {e}", file=sys.stderr)
        skipped += 1

print(f"\nDone. {converted} converted, {skipped} skipped.")
print(f"Total: {total_before/1024/1024:.1f}MB -> {total_after/1024/1024:.1f}MB ({100*total_after//total_before}%)")
