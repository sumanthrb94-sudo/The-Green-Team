"""
GT-THUMB-V41 POSTER — static channel-poster thumbnail (1080×1920)

Used as the cover thumbnail for the V41 reel on IG/YouTube/Linktree.
Single composition combining the hook + biophilic photo + leaf mark +
wordmark + tagline + URL in one editorial poster layout.

Photo: public/gallery/agartha/4.webp (biophilic earth-bag villa wrapped
in living vines) — the strongest "biophilic sanctuary" shot in the repo.

Output: out/greenteam-thumb-v41-poster.jpg
"""
from __future__ import annotations

import io
import math
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
HERO_PHOTO = REPO / "public" / "gallery" / "agartha" / "4.webp"
OUT_FILE = REPO / "out" / "greenteam-thumb-v41-poster.jpg"

W, H = 1080, 1920
CX = W // 2

INK    = "#0e1408"
PAPER  = "#faf9f6"
GT_SAGE      = "#a3b18a"
GT_GOLD      = "#c8a951"
GT_GOLD_DEEP = "#a88a39"

FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"


# Leaf logo paths (copied verbatim from public/logo-the-green-team-original.svg)
LEAF_PATHS = [
    ("M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z", 0.35),  # dim
    ("M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z", 1.00),  # light
]
LEAF_LINE = "M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62"


def load_hero() -> Image.Image:
    """Load and 9:16-crop the biophilic vine villa, ready for vignette + darken."""
    im = Image.open(HERO_PHOTO).convert("RGB")
    iw, ih = im.size
    target_ar = W / H
    if iw / ih > target_ar:
        new_w = int(ih * target_ar)
        l = (iw - new_w) // 2
        # Push crop slightly right to put the villa archway in the lower third
        l = min(iw - new_w, l + int(0.05 * iw))
        im = im.crop((l, 0, l + new_w, ih))
    else:
        new_h = int(iw / target_ar)
        # Push crop UP so vines + tree fill the upper 2/3
        t = max(0, int(0.0 * ih))
        im = im.crop((0, t, iw, t + new_h))
    im = im.resize((W, H), Image.LANCZOS)
    return im


def darken_top_half(im: Image.Image, strength: float = 0.62) -> Image.Image:
    """Top wash gradient — strong at top, fades to clear by y=H*0.50.
    PLUS a localized dark band centered on the hook (y=350..760) so the
    headline + subtitle read against the foliage."""
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        # Gradient 1: top wash
        u1 = max(0.0, 1.0 - y / (H * 0.50))
        a1 = strength * (u1 ** 1.3)
        # Gradient 2: localized band centered at y=560, sigma ~180
        d = (y - 560) / 180.0
        a2 = 0.55 * math.exp(-d * d)
        a = max(a1, a2)
        arr[y, :, 3] = int(255 * min(1.0, a))
    overlay = Image.fromarray(arr, mode="RGBA")
    out = im.convert("RGBA")
    out.alpha_composite(overlay)
    return out.convert("RGB")


def darken_bottom_half(im: Image.Image, strength: float = 0.75) -> Image.Image:
    """Strong dark wash on bottom 55% so the brand reveal sits on near-ink."""
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        u = max(0.0, (y - H * 0.42) / (H * 0.30))
        u = min(1.0, u)
        a = int(255 * strength * u)
        arr[y, :, 3] = a
    overlay = Image.fromarray(arr, mode="RGBA")
    out = im.convert("RGBA")
    out.alpha_composite(overlay)
    return out.convert("RGB")


def build_overlay_svg() -> str:
    """Editorial poster overlay — hook, leaf, wordmark, tagline, URL."""
    parts = []
    parts.append(
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
        f'<stop offset="1" stop-color="{INK}" stop-opacity="0.65"/>'
        f'</radialGradient>'
        '</defs>'
    )
    # Vignette
    parts.append(f'<rect width="{W}" height="{H}" fill="url(#vig)"/>')

    # Editorial eyebrow chip (top-left)
    parts.append(
        f'<g transform="translate(80,360)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">EDITORIAL</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">CHANNEL · 01</text>'
        f'</g>'
    )

    # Hook headline — 2 lines, big & bold. Moved UP to sit on the cleaner
    # upper sky portion of the photo (above the vines).
    parts.append(
        f'<g transform="translate({CX},470)">'
        f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="92" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-3" '
        f'text-anchor="middle">FORESTS DON\'T</text>'
        f'<text x="0" y="100" font-family="{FONT_DISPLAY}" font-size="92" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-3" '
        f'text-anchor="middle">STAY BY ACCIDENT.</text>'
        f'</g>'
    )
    # Gold rule under hook
    parts.append(
        f'<line x1="{CX-90}" y1="610" x2="{CX+90}" y2="610" '
        f'stroke="{GT_GOLD}" stroke-width="3"/>'
    )

    # Italic gold subtitle: "They're curated." — moved into the dark wash
    # zone (around y=720) where the gradient transitions to dark for stronger
    # contrast against the gold.
    parts.append(
        f'<text x="{CX}" y="700" font-family="{FONT_SERIF}" '
        f'font-size="62" font-style="italic" '
        f'fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">They\'re curated.</text>'
    )

    # Leaf mark (filled, no stroke — final state)
    leaf_cx = CX
    leaf_cy = 1100
    leaf_size = 230
    half = leaf_size / 2
    scale = leaf_size / 100
    parts.append(
        f'<g transform="translate({leaf_cx - half:.1f},{leaf_cy - half:.1f}) '
        f'scale({scale:.4f})">'
        f'<path d="{LEAF_PATHS[0][0]}" fill="{PAPER}" opacity="0.35"/>'
        f'<path d="{LEAF_PATHS[1][0]}" fill="{PAPER}" opacity="1.0"/>'
        f'<path d="{LEAF_LINE}" fill="none" stroke="{PAPER}" '
        f'stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>'
        f'</g>'
    )

    # Wordmark
    parts.append(
        f'<text x="{CX}" y="1325" font-family="{FONT_DISPLAY}" font-size="74" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
    )
    # Gold rule under wordmark
    parts.append(
        f'<line x1="{CX-130}" y1="1360" x2="{CX+130}" y2="1360" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
    )
    # Tagline
    parts.append(
        f'<text x="{CX}" y="1432" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
        f'text-anchor="middle">WE CURATE FOREST-ADJACENT SANCTUARIES</text>'
    )

    # Signature line (sage rule + mono caption)
    parts.append(
        f'<line x1="{CX-200}" y1="1600" x2="{CX+200}" y2="1600" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        f'<text x="{CX}" y="1645" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        f'<text x="{CX}" y="1685" font-family="{FONT_MONO}" font-size="24" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
    )

    # CTA at bottom
    parts.append(
        f'<text x="{CX}" y="1795" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="6" '
        f'text-anchor="middle">DM FOR THE BRIEF</text>'
    )

    parts.append('</svg>')
    return "".join(parts)


def main():
    OUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    # 1. Load photo, crop to 9:16
    base = load_hero()
    # 2. Apply darken bands (top for hook readability, bottom for brand block)
    base = darken_top_half(base, strength=0.50)
    base = darken_bottom_half(base, strength=0.82)
    # 3. Render overlay SVG and composite
    svg = build_overlay_svg()
    png_bytes = cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=W, output_height=H,
    )
    overlay = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    out = base.convert("RGBA")
    out.alpha_composite(overlay)
    out = out.convert("RGB")
    # 4. Save as quality JPG (compact, sharp at 1080×1920)
    out.save(OUT_FILE, format="JPEG", quality=92, optimize=True, progressive=True)
    print(f"[done] {OUT_FILE}  ({OUT_FILE.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
