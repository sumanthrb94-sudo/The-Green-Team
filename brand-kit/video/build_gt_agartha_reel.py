"""
GT-AGARTHA-REEL — property-focused reel for AGARTHA (by The Green Team)

A 22.0s property reel for AGARTHA specifically (vs. v41/v42 which are
brand idents). Same beat-synced V41 architecture, but the content brief
is the property's facts — copy, photo carousel, stats, brand reveal.

Architecture (inherits V41 primitives, customizes per phase):
  P1 ColdOpen     0.00-2.42s   forest canopy (agartha/14 — tall pines)
  P2 Hook         2.42-6.61s   "WHERE THE FOREST IS THE AMENITY."
  P3 PropertyTour 6.61-10.24s  3-photo carousel with diagonal wipes
                                (biophilic vine villa → pavilion → aerial)
  P4 SpecCard     10.24-13.26s strobe-cut 3 specs on the beat:
                                4.5 ACRES · ORR EX-14 · 10 MIN AIRPORT
  P5 BrandReveal  13.26-18.70s leaf-stroke + "AGARTHA" + "by THE GREEN TEAM"
                                + italic gold "forest-edge sanctuary."
  P6 CTAClose     18.70-22.00s "COMMENT 'AGARTHA' · WE DM THE BRIEF"
                                + cinematic letterbox bars animate in

Output:
  out/agartha-reel-60fps.mp4     (production, CRF 18)
  out/agartha-reel-mobile.mp4    (mobile, CRF 26)
  out/agartha-reel-poster.jpg    (1080×1920 channel poster)
"""
from __future__ import annotations

import io
import math
import random
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import cairosvg
import numpy as np
from PIL import Image, ImageDraw, ImageFont

import build_gt_thumb_v41 as v41
from build_gt_thumb_v41 import (
    W, H, FPS, TOTAL_S, N_FRAMES, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    P1_END, P2_END, P3_END, P4_END, P5_END,
    DOTS_OUT_START, DOTS_OUT_END,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, init_dust, dust_svg, svg_to_pil, svg_wrap, darken_band,
    chip_eyebrow, leaf_logo_svg, LEAF_PATHS, LEAF_DASH,
    REPO,
)

# V42b technique — borrow the diagonal wipe + light leak helpers
import build_gt_thumb_v42b as v42b

FRAMES_DIR = REPO / "out" / "frames_gt-agartha-reel"
FINAL_MP4 = REPO / "out" / "agartha-reel-60fps.mp4"
MOBILE_MP4 = REPO / "out" / "agartha-reel-mobile.mp4"
POSTER_JPG = REPO / "out" / "agartha-reel-poster.jpg"
AUDIO_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)


# ─── AGARTHA CONTENT BRIEF ──────────────────────────────────────────────
PROPERTY_NAME = "AGARTHA"
HOOK_TOP = "WHERE THE FOREST"
HOOK_BOT = "IS THE AMENITY."

# 3 spec cards strobing in phase 4 — Agartha-specific facts
# (NOT to be confused with SYL Residences which is 4.5 acres in Tukkuguda).
# Source: posts-ready/post-gt-agartha-master/meta.txt + thegreenteam.in site.
SPECS = [
    ("PROJECT SIZE",      "25 ACRES",    "NARSAPUR FOREST · 36 PLOTS"),
    ("AIR QUALITY",       "AQI 12",      "AMBIENT 18 dB · SUB-CITY AIR"),
    ("FINANCIAL DISTRICT","40 MIN",      "VIA THE RRR CORRIDOR"),
]

# Tagline for brand reveal
TAGLINE_KICKER = "BY THE GREEN TEAM"
TAGLINE_MAIN   = "forest-edge sanctuary."

# CTA
CTA_LINE_1 = "COMMENT 'AGARTHA'"
CTA_LINE_2 = "WE DM THE BRIEF"


# ─── PHASE OVERRIDES ────────────────────────────────────────────────────
def phase1_cold_open_agartha(t, dust, photos):
    """Same as v41 phase 1 — tall pines forest cold open."""
    return v41.phase1_cold_open(t, dust, photos)


def phase2_hook_agartha(t, dust, photos):
    """Phase 2: typewriter the Agartha-specific hook."""
    u = norm(t, P1_END, P2_END)
    # Continue Ken Burns from P1
    im = photos["hero"].ken_burns(
        t, P2_END, start_zoom=1.30, end_zoom=1.10,
        start_cx=0.55, start_cy=0.32, end_cx=0.55, end_cy=0.42,
    )
    headline_y = 1090
    im = darken_band(im, headline_y - 240, headline_y + 240, strength=0.55)

    hook_progress = ease_out_cubic(clamp((u - 0.05) / 0.60))
    full = HOOK_TOP + " " + HOOK_BOT
    n1 = len(HOOK_TOP)
    visible = int(round(hook_progress * len(full)))
    line1 = full[:min(visible, n1)]
    line2 = full[n1 + 1:visible] if visible > n1 else ""
    chip_reveal = ease_out_cubic(clamp(u / 0.30))
    dust_alpha = 0.65

    overlay = (
        v41.DEFS
        + dust_svg(dust, t, alpha_mul=dust_alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "AGARTHA", "01 / 06", chip_reveal)
        + f'<g transform="translate({CX},{headline_y})">'
        + f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="78" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2" '
        f'text-anchor="middle">{line1}</text>'
        + f'<text x="0" y="96" font-family="{FONT_DISPLAY}" font-size="78" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2" '
        f'text-anchor="middle">{line2}</text>'
        + '</g>'
        + f'<line x1="{CX-90}" y1="{headline_y+180}" '
        f'x2="{CX-90 + 180 * clamp((hook_progress-0.85)/0.15)}" '
        f'y2="{headline_y+180}" stroke="{GT_GOLD}" stroke-width="2"/>'
    )
    return im, overlay


def phase3_property_tour(t, dust, photos):
    """Phase 3 — 3-photo carousel with V42b diagonal wipes between them.
    Photos: vine villa (4) → pavilion (20) → aerial detail (11)."""
    u = norm(t, P2_END, P3_END)
    # Split into 3 sub-windows: 0-0.40, 0.40-0.70, 0.70-1.0
    # First half of each window is the wipe-in, second half holds.
    if u < 0.40:
        # Continuing from hero into vine villa
        im_a = photos["hero"].ken_burns(
            t, P3_END, start_zoom=1.10, end_zoom=1.05,
            start_cx=0.55, start_cy=0.42, end_cx=0.55, end_cy=0.50,
        )
        im_b = photos["villa"].ken_burns(
            t - P2_END, P3_END - P2_END,
            start_zoom=1.05, end_zoom=1.18,
            start_cx=0.50, start_cy=0.55, end_cx=0.55, end_cy=0.50,
        )
        # wipe across u 0.0 → 0.30
        wipe_p = ease_in_out(clamp(u / 0.30))
        im = v42b.diagonal_wipe(im_a, im_b, wipe_p, angle_deg=14.0, feather=80)
        active_label = "BIOPHILIC VILLA"
    elif u < 0.70:
        # Vine villa → pavilion
        im_a = photos["villa"].ken_burns(
            t - P2_END, P3_END - P2_END,
            start_zoom=1.05, end_zoom=1.18,
            start_cx=0.50, start_cy=0.55, end_cx=0.55, end_cy=0.50,
        )
        im_b = photos["pavilion"].ken_burns(
            t - (P2_END + 0.40 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.04, end_zoom=1.12,
            start_cx=0.50, start_cy=0.45, end_cx=0.50, end_cy=0.50,
        )
        sub_u = (u - 0.40) / 0.30
        wipe_p = ease_in_out(clamp(sub_u))
        im = v42b.diagonal_wipe(im_a, im_b, wipe_p, angle_deg=-12.0, feather=80)
        active_label = "PAVILION + CLUBHOUSE"
    else:
        # Pavilion → aerial detail
        im_a = photos["pavilion"].ken_burns(
            t - (P2_END + 0.40 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.04, end_zoom=1.12,
            start_cx=0.50, start_cy=0.45, end_cx=0.50, end_cy=0.50,
        )
        im_b = photos["aerial"].ken_burns(
            t - (P2_END + 0.70 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.06, end_zoom=1.18,
            start_cx=0.45, start_cy=0.50, end_cx=0.55, end_cy=0.50,
        )
        sub_u = (u - 0.70) / 0.30
        wipe_p = ease_in_out(clamp(sub_u))
        im = v42b.diagonal_wipe(im_a, im_b, wipe_p, angle_deg=10.0, feather=80)
        active_label = "MASTER PLAN"

    # Dim band at the bottom for the active label
    im = darken_band(im, 1450, 1700, strength=0.45)
    # Dots fading out
    alpha = 0.65 * (1 - ease_in_out(norm(t, DOTS_OUT_START, DOTS_OUT_END)))

    overlay = (
        v41.DEFS
        + dust_svg(dust, t, alpha_mul=alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "AGARTHA", "02 / 06", 1.0)
        # Active tour label at the bottom
        + f'<g transform="translate(80,1580)">'
        + f'<line x1="0" y1="-32" x2="60" y2="-32" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">'
        f'TOUR · {int(u * 100):02d}</text>'
        + f'<text x="0" y="34" font-family="{FONT_DISPLAY}" font-size="42" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1">'
        f'{active_label}</text>'
        + '</g>'
    )
    return im, overlay


def phase4_specs_strobe(t, dust, photos):
    """Phase 4 — strobe-cut 3 specs (V42c technique) on aerial backdrop."""
    u = norm(t, P3_END, P4_END)
    # Backdrop: aerial photo continues, heavy ink wash
    im = photos["aerial"].ken_burns(
        t - P3_END, P4_END - P3_END,
        start_zoom=1.18, end_zoom=1.30,
        start_cx=0.55, start_cy=0.50, end_cx=0.50, end_cy=0.50,
    )
    # Heavy darken
    wash = Image.new("RGB", (W, H), (14, 20, 8))
    im = Image.blend(im, wash, 0.72)

    # 3 strobe windows, each ~1.0s
    phase_dur = P4_END - P3_END
    chunk = phase_dur / 3.0
    idx = min(2, int((t - P3_END) / chunk))
    chunk_t = (t - P3_END) - idx * chunk
    flash = max(0.0, math.exp(-chunk_t / 0.06) * (1.0 if chunk_t < 0.20 else 0.0))
    flash_alpha = flash * 0.50
    label, value, sublabel = SPECS[idx]

    # Strobe progress dots
    dots = "".join(
        f'<circle cx="{i*22}" cy="18" r="5" '
        f'fill="{GT_GOLD if i == idx else "#3a4a2c"}"/>'
        for i in range(3)
    )

    overlay = (
        v41.DEFS
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "AGARTHA", "03 / 06", 1.0)
        # Strobe progress indicator top-right
        + f'<g transform="translate({W - 200},360)">'
        + f'<text x="0" y="-4" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">'
        f'SPEC {idx + 1:02d} / 03</text>'
        + dots
        + '</g>'
        # Spec card content (centered, large value)
        + f'<rect x="0" y="640" width="{W}" height="640" fill="{INK}" opacity="0.40"/>'
        + f'<rect x="100" y="780" width="4" height="380" fill="{GT_GOLD}"/>'
        + f'<text x="130" y="830" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">{label}</text>'
        + f'<text x="130" y="990" font-family="{FONT_DISPLAY}" font-size="160" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-5">{value}</text>'
        + f'<text x="130" y="1080" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="3">{sublabel}</text>'
        # Beat flash
        + f'<rect width="{W}" height="{H}" fill="{PAPER}" opacity="{flash_alpha:.3f}"/>'
    )
    return im, overlay


def phase5_brand_reveal_agartha(t, dust, photos):
    """Phase 5 — leaf draws in, then 'AGARTHA' big + 'by THE GREEN TEAM'
    smaller + 'forest-edge sanctuary.' italic gold."""
    u = norm(t, P4_END, P5_END)
    fade_out = ease_in_out(clamp(u / 0.30))
    im_photo = photos["aerial"].ken_burns(
        t, P5_END,
        start_zoom=1.30, end_zoom=1.42,
        start_cx=0.50, start_cy=0.50, end_cx=0.50, end_cy=0.50,
    )
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = Image.blend(im_photo, ink, fade_out)
    if fade_out > 0.98:
        im = ink

    draw_p = clamp((u - 0.00) / 0.55)
    fill_p = clamp((u - 0.40) / 0.45)
    leaf_size = 320
    leaf_cy = 750

    # AGARTHA wordmark (big property name) types in after leaf fill starts
    pname_progress = ease_out_cubic(clamp((u - 0.50) / 0.25))
    pname_visible_n = int(round(pname_progress * len(PROPERTY_NAME)))
    pname_shown = PROPERTY_NAME[:pname_visible_n]

    # "by THE GREEN TEAM" subline reveals after property name
    sub_progress = ease_out_cubic(clamp((u - 0.68) / 0.18))

    # "forest-edge sanctuary." italic gold tagline last
    tag_progress = ease_out_cubic(clamp((u - 0.80) / 0.18))

    rule_w = clamp((u - 0.62) / 0.18) * 320

    parts = [
        v41.DEFS,
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>',
        leaf_logo_svg(CX, leaf_cy, leaf_size, draw_p, fill_p),
        # AGARTHA — big editorial display
        f'<text x="{CX}" y="1090" font-family="{FONT_DISPLAY}" font-size="140" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="14" '
        f'text-anchor="middle">{pname_shown}</text>',
        # Gold rule under AGARTHA
        f'<line x1="{CX - rule_w/2:.0f}" y1="1130" '
        f'x2="{CX + rule_w/2:.0f}" y2="1130" stroke="{GT_GOLD}" '
        f'stroke-width="2.5"/>',
    ]
    if sub_progress > 0.001:
        parts.append(
            f'<g transform="translate({CX},1200)" opacity="{sub_progress:.3f}">'
            f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="22" '
            f'fill="{PAPER}" letter-spacing="6" font-weight="600" '
            f'text-anchor="middle">{TAGLINE_KICKER}</text>'
            f'</g>'
        )
    if tag_progress > 0.001:
        clip_w = tag_progress * 700
        parts.append(
            f'<defs><clipPath id="agtag">'
            f'<rect x="{CX-350:.0f}" y="1260" width="{clip_w:.0f}" height="100"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#agtag)">'
            f'<text x="{CX}" y="1340" font-family="{FONT_SERIF}" '
            f'font-size="68" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{TAGLINE_MAIN}</text>'
            f'</g>'
        )
    return im, "".join(parts)


def phase6_cta_close(t, dust, photos):
    """Phase 6 — CTA + cinematic letterbox close."""
    u = norm(t, P5_END, TOTAL_S)
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = ink

    # Cinema bars: animate 0 → 90px each by u=0.36
    bar_h = int(90 * ease_out_cubic(clamp(u / 0.36)))

    # Hold the phase 5 brand block (leaf full + AGARTHA full + tagline full)
    sig_progress = ease_out_cubic(clamp((u - 0.05) / 0.30))
    cta_progress = ease_out_cubic(clamp((u - 0.20) / 0.35))
    cta_t = t - (TOTAL_S - 2.5)
    cta_blink = (
        0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 6.0))
        if cta_t > 0 else 0.0
    )

    final_defs = (
        '<defs>'
        f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient>'
        f'<radialGradient id="vig" cx="0.5" cy="0.5" r="0.85">'
        f'<stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{INK}" stop-opacity="0.78"/>'
        f'</radialGradient>'
        '</defs>'
    )

    overlay = (
        final_defs
        + leaf_logo_svg(CX, 750, 320, 1.0, 1.0)
        + f'<text x="{CX}" y="1090" font-family="{FONT_DISPLAY}" font-size="140" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="14" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX - 160}" y1="1130" x2="{CX + 160}" y2="1130" '
        f'stroke="{GT_GOLD}" stroke-width="2.5"/>'
        + f'<text x="{CX}" y="1200" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="6" font-weight="600" '
        f'text-anchor="middle">{TAGLINE_KICKER}</text>'
        + f'<text x="{CX}" y="1340" font-family="{FONT_SERIF}" '
        f'font-size="68" font-style="italic" '
        f'fill="url(#goldHL)" font-weight="400" '
        f'text-anchor="middle">{TAGLINE_MAIN}</text>'
        # CTA block — two lines
        + f'<g transform="translate({CX},1470)" opacity="{cta_progress:.3f}">'
        + f'<line x1="-200" y1="-50" x2="200" y2="-50" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" opacity="{cta_blink:.3f}" letter-spacing="4" '
        f'font-weight="700" text-anchor="middle">{CTA_LINE_1}</text>'
        + f'<text x="0" y="40" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="4" font-weight="600" '
        f'text-anchor="middle">{CTA_LINE_2}</text>'
        + '</g>'
        + f'<g transform="translate({CX},1640)" opacity="{sig_progress:.3f}">'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        + f'<text x="0" y="34" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
        + '</g>'
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        # Cinema bars on top of everything
        + f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>'
        + f'<rect x="0" y="{H - bar_h}" width="{W}" height="{bar_h}" fill="#000"/>'
    )
    return im, overlay


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(t, dust, photos):
    if t < P1_END:
        base, overlay = phase1_cold_open_agartha(t, dust, photos)
    elif t < P2_END:
        base, overlay = phase2_hook_agartha(t, dust, photos)
    elif t < P3_END:
        base, overlay = phase3_property_tour(t, dust, photos)
    elif t < P4_END:
        base, overlay = phase4_specs_strobe(t, dust, photos)
    elif t < P5_END:
        base, overlay = phase5_brand_reveal_agartha(t, dust, photos)
    else:
        base, overlay = phase6_cta_close(t, dust, photos)

    if overlay:
        svg = svg_wrap(overlay)
        ov = svg_to_pil(svg)
        base = base.convert("RGBA")
        base.alpha_composite(ov)
        base = base.convert("RGB")
    return base


# ─── POSTER GENERATOR ───────────────────────────────────────────────────
def build_poster():
    """Static 1080×1920 channel poster for the Agartha reel."""
    photo = Image.open(REPO / "public" / "gallery" / "agartha" / "4.webp").convert("RGB")
    iw, ih = photo.size
    target_ar = W / H
    if iw / ih > target_ar:
        nw = int(ih * target_ar)
        l = (iw - nw) // 2
        photo = photo.crop((l, 0, l + nw, ih))
    else:
        nh = int(iw / target_ar)
        t = (ih - nh) // 2
        photo = photo.crop((0, t, iw, t + nh))
    photo = photo.resize((W, H), Image.LANCZOS)

    # Strong darken to anchor type
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        # Localized band y=420..820 for hook
        d = (y - 620) / 220.0
        a_band = 0.62 * math.exp(-d * d)
        # Bottom dark wash for brand block
        u_bot = max(0.0, (y - H * 0.55) / (H * 0.30))
        a_bot = 0.78 * min(1.0, u_bot) ** 1.4
        a = max(a_band, a_bot)
        arr[y, :, 3] = int(255 * min(1.0, a))
    overlay = Image.fromarray(arr, 'RGBA')
    base = photo.convert("RGBA")
    base.alpha_composite(overlay)
    base = base.convert("RGB")

    svg = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        '<defs>'
        f'<linearGradient id="gh" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient></defs>'
        # Eyebrow chip
        f'<g transform="translate(80,360)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'BY THE GREEN TEAM</text></g>'
        # Hook (2 lines)
        f'<text x="{CX}" y="540" font-family="{FONT_DISPLAY}" font-size="86" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2.5" '
        f'text-anchor="middle">{HOOK_TOP}</text>'
        f'<text x="{CX}" y="640" font-family="{FONT_DISPLAY}" font-size="86" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2.5" '
        f'text-anchor="middle">{HOOK_BOT}</text>'
        # Gold rule
        f'<line x1="{CX-90}" y1="690" x2="{CX+90}" y2="690" '
        f'stroke="{GT_GOLD}" stroke-width="3"/>'
        # Italic gold subline
        f'<text x="{CX}" y="770" font-family="{FONT_SERIF}" font-size="58" '
        f'font-style="italic" fill="url(#gh)" font-weight="500" '
        f'text-anchor="middle">{TAGLINE_MAIN}</text>'
        # Leaf (small)
        + leaf_logo_svg(CX, 1100, 220, 1.0, 1.0)
        # AGARTHA wordmark big
        + f'<text x="{CX}" y="1340" font-family="{FONT_DISPLAY}" font-size="120" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="12" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX-160}" y1="1380" x2="{CX+160}" y2="1380" '
        f'stroke="{GT_GOLD}" stroke-width="2.5"/>'
        + f'<text x="{CX}" y="1450" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" letter-spacing="5" font-weight="600" '
        f'text-anchor="middle">{TAGLINE_KICKER}</text>'
        # Specs row at the bottom (Agartha facts)
        + f'<g transform="translate(0,1620)">'
        + f'<text x="200" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">25 ACRES</text>'
        + f'<text x="540" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">AQI 12 · 18 dB</text>'
        + f'<text x="880" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">40 MIN TO FD</text>'
        + '</g>'
        # Signature
        + f'<line x1="{CX-200}" y1="1700" x2="{CX+200}" y2="1700" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        + f'<text x="{CX}" y="1750" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        + f'<text x="{CX}" y="1790" font-family="{FONT_MONO}" font-size="24" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
        + '</svg>'
    )
    ov = Image.open(io.BytesIO(cairosvg.svg2png(
        bytestring=svg.encode("utf-8"), output_width=W, output_height=H
    ))).convert("RGBA")
    final = base.convert("RGBA")
    final.alpha_composite(ov)
    final = final.convert("RGB")
    POSTER_JPG.parent.mkdir(parents=True, exist_ok=True)
    final.save(POSTER_JPG, "JPEG", quality=92, optimize=True, progressive=True)
    print(f"[poster] {POSTER_JPG.name}  {POSTER_JPG.stat().st_size // 1024} KB")


# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    # Build poster first (cheap, useful for first-frame replacement)
    build_poster()

    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(11)
    dust = init_dust(rng)
    # Photo cast for the reel
    photos = {
        "hero":     Photo(REPO / "public" / "gallery" / "agartha" / "14.webp"),  # pines
        "villa":    Photo(REPO / "public" / "gallery" / "agartha" / "4.webp"),   # vine villa
        "pavilion": Photo(REPO / "public" / "gallery" / "agartha" / "20.webp"),  # pergola+palms
        "aerial":   Photo(REPO / "public" / "gallery" / "agartha" / "11.webp"),  # aerial detail
    }
    for p in photos.values():
        p.load()

    print(f"[agartha-reel] {N_FRAMES} frames @ {FPS}fps · {TOTAL_S}s")
    t0 = time.time()
    for i in range(N_FRAMES):
        t = i / FPS
        frame = render_frame(t, dust, photos)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time() - t0:.0f}s")

    # Replace first 30 frames with poster (gallery thumbnail trick)
    for i in range(30):
        target = FRAMES_DIR / f"f{i:05d}.jpg"
        Image.open(POSTER_JPG).save(target, "JPEG", quality=92)

    # Production encode (CRF 18) with cover art
    for label, crf, audio_kb, out_path in (
        ("prod",   18, 192, FINAL_MP4),
        ("mobile", 26,  96, MOBILE_MP4),
    ):
        cmd = [
            "ffmpeg", "-y", "-framerate", str(FPS),
            "-i", str(FRAMES_DIR / "f%05d.jpg"),
            "-i", str(AUDIO_SRC),
            "-i", str(POSTER_JPG),
            "-map", "0:v:0", "-map", "1:a:0", "-map", "2:v:0",
            "-c:v:0", "libx264", "-preset", "slow", "-crf", str(crf),
            "-pix_fmt", "yuv420p",
            "-c:v:1", "copy", "-disposition:v:1", "attached_pic",
            "-c:a", "aac", "-b:a", f"{audio_kb}k",
            "-af", f"afade=t=out:st={TOTAL_S - 1.0:.2f}:d=1.0",
            "-movflags", "+faststart",
            "-t", str(TOTAL_S),
            str(out_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"[{label}] {out_path.name}  "
              f"{out_path.stat().st_size // (1024*1024)} MB")


if __name__ == "__main__":
    main()
