"""
GT-THUMB-V42 POSTERS — A/B variant channel posters

Generates three 1080×1920 static posters (one per A/B variant) that
visually preview each variant's signature technique so the operator
can A/B them on profile thumbnails.

  v42a poster: TEXT-MASK photo-reveal carved out of "GREEN TEAM" + grain
  v42b poster: diagonal before/after split (forest top / villa bottom)
                 with warm light-leak wash
  v42c poster: massive strobe stat ("4.5 ACRES") + 2.35:1 cinema bars

Output:
  out/greenteam-thumb-v42a-poster.jpg
  out/greenteam-thumb-v42b-poster.jpg
  out/greenteam-thumb-v42c-poster.jpg
"""
from __future__ import annotations

import io
import math
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
OUT_DIR = REPO / "out"
HERO_FOREST = REPO / "public" / "gallery" / "agartha" / "14.webp"
HERO_VILLA = REPO / "public" / "gallery" / "agartha" / "4.webp"

W, H = 1080, 1920
CX = W // 2

INK    = "#0e1408"
PAPER  = "#faf9f6"
GT_SAGE = "#a3b18a"
GT_GOLD = "#c8a951"
GT_GOLD_DEEP = "#a88a39"

FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"

LEAF_DIM   = "M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z"
LEAF_LIGHT = "M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z"
LEAF_LINE  = "M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62"


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    for p in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _crop_9x16(im: Image.Image, vshift: float = 0.0) -> Image.Image:
    """Center-crop to 9:16, with vshift in [-0.5..0.5] biasing the crop
    vertically (negative = up)."""
    iw, ih = im.size
    target_ar = W / H
    if iw / ih > target_ar:
        new_w = int(ih * target_ar)
        l = (iw - new_w) // 2
        im = im.crop((l, 0, l + new_w, ih))
    else:
        new_h = int(iw / target_ar)
        t = int((ih - new_h) // 2 + vshift * ih)
        t = max(0, min(ih - new_h, t))
        im = im.crop((0, t, iw, t + new_h))
    return im.resize((W, H), Image.LANCZOS)


def _grain(strength: float = 0.07) -> Image.Image:
    rng = np.random.default_rng(11)
    small = rng.normal(128, 32, (H // 4, W // 4)).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(small, 'L').resize((W, H), Image.NEAREST).convert("RGBA")
    arr = np.asarray(im).copy()
    arr[..., 3] = int(255 * strength)
    return Image.fromarray(arr, 'RGBA')


def _brand_block_svg(leaf_y: int = 1100, wm_y: int = 1325,
                     tagline_y: int = 1432, sig_y: int = 1645,
                     show_cta: bool = True) -> str:
    leaf_size = 230
    half = leaf_size / 2
    scale = leaf_size / 100
    cta = (
        f'<text x="{CX}" y="1795" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="6" '
        f'text-anchor="middle">DM FOR THE BRIEF</text>'
    ) if show_cta else ""
    return (
        f'<g transform="translate({CX - half},{leaf_y - half}) scale({scale:.4f})">'
        f'<path d="{LEAF_DIM}" fill="{PAPER}" opacity="0.35"/>'
        f'<path d="{LEAF_LIGHT}" fill="{PAPER}" opacity="1.0"/>'
        f'<path d="{LEAF_LINE}" fill="none" stroke="{PAPER}" '
        f'stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>'
        f'</g>'
        f'<text x="{CX}" y="{wm_y}" font-family="{FONT_DISPLAY}" font-size="74" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
        f'<line x1="{CX-130}" y1="{wm_y+35}" x2="{CX+130}" y2="{wm_y+35}" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        f'<text x="{CX}" y="{tagline_y}" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
        f'text-anchor="middle">WE CURATE FOREST-ADJACENT SANCTUARIES</text>'
        f'<line x1="{CX-200}" y1="{sig_y-45}" x2="{CX+200}" y2="{sig_y-45}" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        f'<text x="{CX}" y="{sig_y}" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        f'<text x="{CX}" y="{sig_y+40}" font-family="{FONT_MONO}" font-size="24" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
        + cta
    )


# ─── V42A POSTER — Text Mask + Grain ────────────────────────────────────
def build_v42a():
    # Forest photo cropped, used as the photo INSIDE the GREEN TEAM letters
    photo = Image.open(HERO_FOREST).convert("RGB")
    photo = _crop_9x16(photo)

    # Build the text mask (white where letters are)
    mask = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(mask)
    font = _load_font(220)
    # Two lines: GREEN / TEAM
    for line, y in (("GREEN", 700), ("TEAM", 950)):
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = (W - tw) // 2 - bbox[0]
        draw.text((x, y), line, fill=255, font=font)

    # Composite: photo INSIDE the letters, ink elsewhere
    ink_layer = Image.new("RGB", (W, H), (14, 20, 8))
    base = Image.composite(photo, ink_layer, mask)

    # Eyebrow chip top-left + hook above + tagline below + grain overlay
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        '<defs>'
        f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient></defs>'
        # Eyebrow
        f'<g transform="translate(80,360)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">V42A · TEXT-MASK</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">EDITORIAL · 01</text>'
        f'</g>'
        # Hook above the text mask
        f'<text x="{CX}" y="490" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2" '
        f'text-anchor="middle">FORESTS DON\'T STAY BY ACCIDENT.</text>'
        # Tagline below text mask
        f'<text x="{CX}" y="1310" font-family="{FONT_SERIF}" font-size="62" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">curated, not by chance.</text>'
        # Brand block
        + _brand_block_svg(leaf_y=1500, wm_y=1670, tagline_y=1745,
                           sig_y=1845, show_cta=False)
        + '</svg>'
    )
    overlay = Image.open(io.BytesIO(cairosvg.svg2png(
        bytestring=svg.encode("utf-8"), output_width=W, output_height=H
    ))).convert("RGBA")
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    # Grain
    out.alpha_composite(_grain(strength=0.10))
    out = out.convert("RGB")
    target = OUT_DIR / "greenteam-thumb-v42a-poster.jpg"
    out.save(target, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"[v42a] {target.name}  {target.stat().st_size // 1024} KB")


# ─── V42B POSTER — Before/After Split + Light Leak ──────────────────────
def build_v42b():
    forest = _crop_9x16(Image.open(HERO_FOREST).convert("RGB"))
    villa = _crop_9x16(Image.open(HERO_VILLA).convert("RGB"))

    # Diagonal split: top-half + left = forest, bottom-half + right = villa
    angle = math.radians(15)
    tan_a = math.tan(angle)
    offset = H * 0.5 - W * tan_a * 0.5  # line passes through middle
    yy, xx = np.meshgrid(np.arange(H, dtype=np.float32),
                         np.arange(W, dtype=np.float32),
                         indexing='ij')
    d = yy - (xx * tan_a + offset)
    mask = np.clip(0.5 + d / 50, 0, 1)  # tight feather
    mask_img = Image.fromarray((mask * 255).astype(np.uint8), 'L')
    base = Image.composite(villa, forest, mask_img)

    # Warm light-leak wash from top-right corner
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    cx_leak, cy_leak = int(W * 0.85), int(H * 0.15)
    for y in range(H):
        for x in range(0, W, 4):  # stride for speed
            dx = x - cx_leak; dy = y - cy_leak
            r = math.sqrt(dx * dx + dy * dy)
            intensity = max(0.0, 1 - r / 700) ** 1.4
            v = int(intensity * 220)
            arr[y, x:x+4, 0] = 255
            arr[y, x:x+4, 1] = 220
            arr[y, x:x+4, 2] = 150
            arr[y, x:x+4, 3] = v
    leak = Image.fromarray(arr, 'RGBA')
    b2 = base.convert("RGBA")
    b2.alpha_composite(leak)
    base = b2.convert("RGB")

    # Overlay text + brand block
    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        '<defs>'
        f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient>'
        f'<radialGradient id="vig" cx="0.5" cy="0.5" r="0.85">'
        f'<stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{INK}" stop-opacity="0.55"/>'
        f'</radialGradient></defs>'
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        # Soft dark band behind the labels
        f'<rect x="0" y="320" width="{W}" height="140" fill="{INK}" opacity="0.55"/>'
        # "BEFORE" / "AFTER" labels
        f'<text x="60" y="400" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="4">BEFORE — FOREST</text>'
        f'<text x="{W-60}" y="430" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4" '
        f'text-anchor="end">AFTER — SANCTUARY</text>'
        # Eyebrow chip
        f'<g transform="translate(80,540)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">V42B · WIPE + LEAK</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">EDITORIAL · 02</text>'
        f'</g>'
        # Hook
        f'<rect x="0" y="1280" width="{W}" height="180" fill="{INK}" opacity="0.78"/>'
        f'<text x="{CX}" y="1360" font-family="{FONT_DISPLAY}" font-size="72" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2.5" '
        f'text-anchor="middle">THE FOREST STAYS.</text>'
        f'<text x="{CX}" y="1430" font-family="{FONT_SERIF}" font-size="58" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">The sanctuary appears.</text>'
        + _brand_block_svg(leaf_y=1560, wm_y=1715, tagline_y=1780,
                           sig_y=1870, show_cta=False)
        + '</svg>'
    )
    overlay = Image.open(io.BytesIO(cairosvg.svg2png(
        bytestring=svg.encode("utf-8"), output_width=W, output_height=H
    ))).convert("RGBA")
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    out = out.convert("RGB")
    target = OUT_DIR / "greenteam-thumb-v42b-poster.jpg"
    out.save(target, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"[v42b] {target.name}  {target.stat().st_size // 1024} KB")


# ─── V42C POSTER — Strobe Stat + Cinema Bars ────────────────────────────
def build_v42c():
    villa = _crop_9x16(Image.open(HERO_VILLA).convert("RGB"))
    # Heavy darken for the stat card
    arr = np.full((H, W, 4), 0, dtype=np.uint8)
    arr[..., 3] = int(255 * 0.55)
    dark = Image.fromarray(arr, 'RGBA')
    base = villa.convert("RGBA")
    base.alpha_composite(dark)
    base = base.convert("RGB")

    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        '<defs>'
        f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient></defs>'
        # Top cinema bar
        f'<rect x="0" y="0" width="{W}" height="120" fill="#000"/>'
        # Bottom cinema bar
        f'<rect x="0" y="{H-120}" width="{W}" height="120" fill="#000"/>'
        # Eyebrow chip
        f'<g transform="translate(80,250)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">V42C · STROBE + CINEMA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">EDITORIAL · 03</text>'
        f'</g>'
        # Progress dots
        f'<g transform="translate({W-200},250)">'
        f'<text x="0" y="-4" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">01 / 03</text>'
        f'<circle cx="0" cy="18" r="5" fill="{GT_GOLD}"/>'
        f'<circle cx="22" cy="18" r="5" fill="#3a4a2c"/>'
        f'<circle cx="44" cy="18" r="5" fill="#3a4a2c"/>'
        f'</g>'
        # Huge stat
        f'<rect x="100" y="620" width="4" height="380" fill="{GT_GOLD}"/>'
        f'<text x="130" y="670" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">FOREST EDGE — TUKKUGUDA</text>'
        f'<text x="130" y="850" font-family="{FONT_DISPLAY}" font-size="180" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-6">4.5 ACRES</text>'
        f'<text x="130" y="930" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" opacity="0.9" letter-spacing="3">BIOPHILIC · GATED · FOREST-VIEW</text>'
        # Brand block, moved up to leave room for bottom cinema bar
        + _brand_block_svg(leaf_y=1190, wm_y=1380, tagline_y=1455,
                           sig_y=1620, show_cta=False)
        + f'<text x="{CX}" y="1780" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="6" '
        f'text-anchor="middle">DM FOR THE BRIEF</text>'
        + '</svg>'
    )
    overlay = Image.open(io.BytesIO(cairosvg.svg2png(
        bytestring=svg.encode("utf-8"), output_width=W, output_height=H
    ))).convert("RGBA")
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    out = out.convert("RGB")
    target = OUT_DIR / "greenteam-thumb-v42c-poster.jpg"
    out.save(target, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"[v42c] {target.name}  {target.stat().st_size // 1024} KB")


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    build_v42a()
    build_v42b()
    build_v42c()


if __name__ == "__main__":
    main()
