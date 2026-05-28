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
    W, H, FPS, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    P1_END, P2_END, P3_END, P4_END, P5_END,
    DOTS_OUT_START, DOTS_OUT_END,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, init_dust, dust_svg, svg_to_pil, svg_wrap, darken_band,
    chip_eyebrow, leaf_logo_svg, LEAF_PATHS, LEAF_DASH,
    REPO,
)

# Override total runtime for the agartha reel — extends P6 so we have
# room for the "PRESENTED BY THE GREEN TEAM" sequence after AGARTHA lands.
# v41's TOTAL_S was 22.0 (P5_END=18.70, P6 was just 3.30s).
# We extend to 25.0 so P6 = 6.30s, giving:
#   ~1.0s hold on AGARTHA reveal
#   ~2.5s "PRESENTED BY THE GREEN TEAM" + leaf stroke-draws in + wordmark
#   ~2.8s CTA + URL + cinema bars
TOTAL_S = 25.0
N_FRAMES = int(TOTAL_S * FPS)  # 1500 frames @ 60fps


# ─── MODCON LOGO (developer brand mark) ─────────────────────────────────
# Load the official MODCON SVG once and stash the inner content for inline
# embedding in our composition.
def _load_modcon_inner() -> str:
    """Return everything inside the <svg ...> wrapper of modcon-logo.svg."""
    raw = (REPO / "public" / "logos" / "modcon-logo.svg").read_text()
    # Strip the <?xml ?> and the outer <svg ...> ... </svg> tags so we
    # can drop the inner content into our composite SVG.
    start = raw.index(">", raw.index("<svg")) + 1
    end = raw.rindex("</svg>")
    return raw[start:end]


MODCON_VIEWBOX_W = 646.65
MODCON_VIEWBOX_H = 288.10
MODCON_INNER = _load_modcon_inner()


def modcon_logo_svg(cx: int, cy: int, target_w: int, opacity: float = 1.0) -> str:
    """Render the MODCON wordmark logo centered at (cx, cy), scaled so its
    width equals target_w. Uses the official SVG content."""
    if opacity <= 0.001:
        return ""
    scale = target_w / MODCON_VIEWBOX_W
    target_h = MODCON_VIEWBOX_H * scale
    tx = cx - target_w / 2
    ty = cy - target_h / 2
    return (
        f'<g transform="translate({tx:.2f},{ty:.2f}) scale({scale:.5f})" '
        f'opacity="{opacity:.3f}">{MODCON_INNER}</g>'
    )

# V42b technique — borrow the diagonal wipe + light leak helpers.
# NOTE: diagonal_wipe had an inverted offset that left the old image
# visible until very late in the wipe (which made the villa→pavilion
# transition look stuck on the villa). We override with a correctly
# centered implementation below.
import build_gt_thumb_v42b as v42b


def diagonal_wipe(im_a, im_b, progress: float,
                  angle_deg: float = 14.0, feather: int = 80) -> Image.Image:
    """A correct top-to-bottom diagonal wipe.

    At progress=0 the wipe line sits just above the frame top, so
    every visible pixel is BELOW the line → all im_a (old image).
    At progress=1 the line sits just below the frame bottom, so every
    visible pixel is ABOVE the line → all im_b (new image).
    The line is tilted by `angle_deg`, with `feather` px of soft falloff."""
    if progress <= 0.001:
        return im_a
    if progress >= 0.999:
        return im_b
    angle = math.radians(angle_deg)
    tan_a = math.tan(angle)
    # base_y travels from -feather (top, progress=0) to H+feather (bottom, progress=1)
    base_y = -feather + progress * (H + 2 * feather)
    yy, xx = np.meshgrid(np.arange(H, dtype=np.float32),
                         np.arange(W, dtype=np.float32), indexing="ij")
    # Tilt the line around the horizontal center for a symmetric look
    line_y = base_y + (xx - W / 2.0) * tan_a
    # d > 0 when pixel is ABOVE the wipe line (new image revealed)
    d = line_y - yy
    mask = np.clip(0.5 + d / feather, 0.0, 1.0)
    mask_img = Image.fromarray((mask * 255).astype(np.uint8), "L")
    return Image.composite(im_b, im_a, mask_img)

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

# Brand reveal copy
# AGARTHA is built by MODCON BUILDERS (the developer).
# The Green Team is the CHANNEL PARTNER — curating + DMing the brief.
DEVELOPER_LINE = "BY MODCON BUILDERS"
TAGLINE_MAIN   = "forest-edge sanctuary."
CHANNEL_PARTNER_LINE = "CURATED BY THE GREEN TEAM  ·  CHANNEL PARTNER"

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
    """Phase 3 — 3-photo carousel with V42b diagonal wipes between three
    VISUALLY DISTINCT shots:
      villa     (4.webp)   vine-covered earth-bag villa — close-up architecture
      pavilion  (13.webp)  A-frame thatched villa — different building style
      aerial    (7.webp)   AERIAL trefoil + mandala gardens — top-down view
    """
    u = norm(t, P2_END, P3_END)
    if u < 0.40:
        im_a = photos["hero"].ken_burns(
            t, P3_END, start_zoom=1.10, end_zoom=1.05,
            start_cx=0.55, start_cy=0.42, end_cx=0.55, end_cy=0.50,
        )
        im_b = photos["villa"].ken_burns(
            t - P2_END, P3_END - P2_END,
            start_zoom=1.05, end_zoom=1.18,
            start_cx=0.50, start_cy=0.55, end_cx=0.55, end_cy=0.50,
        )
        wipe_p = ease_in_out(clamp(u / 0.30))
        im = diagonal_wipe(im_a, im_b, wipe_p, angle_deg=14.0, feather=80)
        active_label = "BIOPHILIC VILLA"
    elif u < 0.70:
        # Vine villa → A-frame thatched villa (architecturally distinct)
        im_a = photos["villa"].ken_burns(
            t - P2_END, P3_END - P2_END,
            start_zoom=1.05, end_zoom=1.18,
            start_cx=0.50, start_cy=0.55, end_cx=0.55, end_cy=0.50,
        )
        im_b = photos["pavilion"].ken_burns(
            t - (P2_END + 0.40 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.04, end_zoom=1.14,
            start_cx=0.50, start_cy=0.50, end_cx=0.55, end_cy=0.55,
        )
        sub_u = (u - 0.40) / 0.30
        wipe_p = ease_in_out(clamp(sub_u))
        im = diagonal_wipe(im_a, im_b, wipe_p, angle_deg=-12.0, feather=80)
        active_label = "THATCHED VILLAS"
    else:
        # A-frame villa → AERIAL trefoil + mandala (top-down view — radically different)
        im_a = photos["pavilion"].ken_burns(
            t - (P2_END + 0.40 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.04, end_zoom=1.14,
            start_cx=0.50, start_cy=0.50, end_cx=0.55, end_cy=0.55,
        )
        im_b = photos["aerial"].ken_burns(
            t - (P2_END + 0.70 * (P3_END - P2_END)),
            (P3_END - P2_END) * 0.30,
            start_zoom=1.02, end_zoom=1.14,
            start_cx=0.50, start_cy=0.50, end_cx=0.50, end_cy=0.50,
        )
        sub_u = (u - 0.70) / 0.30
        wipe_p = ease_in_out(clamp(sub_u))
        im = diagonal_wipe(im_a, im_b, wipe_p, angle_deg=10.0, feather=80)
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
    """Phase 5 — MODCON wordmark fades in (developer's official brand mark),
    then 'AGARTHA' typewriter reveal, then italic gold 'forest-edge sanctuary.'.

    No Green Team leaf here. AGARTHA is built by MODCON, so the developer's
    actual wordmark sits above the property name. The Green Team leaf
    appears later in the close as a small channel-partner attribution mark.
    """
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

    # MODCON logo fades in across u 0.05 → 0.45
    modcon_opacity = ease_out_cubic(clamp((u - 0.05) / 0.40))

    # AGARTHA wordmark types in after MODCON settles
    pname_progress = ease_out_cubic(clamp((u - 0.45) / 0.25))
    pname_visible_n = int(round(pname_progress * len(PROPERTY_NAME)))
    pname_shown = PROPERTY_NAME[:pname_visible_n]

    rule_w = clamp((u - 0.62) / 0.18) * 320

    # "forest-edge sanctuary." italic gold tagline last
    tag_progress = ease_out_cubic(clamp((u - 0.75) / 0.20))

    parts = [
        v41.DEFS,
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>',
        # MODCON developer wordmark (renders the official SVG content)
        modcon_logo_svg(CX, 800, 340, opacity=modcon_opacity),
        # AGARTHA — big editorial display under MODCON
        f'<text x="{CX}" y="1100" font-family="{FONT_DISPLAY}" font-size="140" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="14" '
        f'text-anchor="middle">{pname_shown}</text>',
        # Gold rule under AGARTHA
        f'<line x1="{CX - rule_w/2:.0f}" y1="1140" '
        f'x2="{CX + rule_w/2:.0f}" y2="1140" stroke="{GT_GOLD}" '
        f'stroke-width="2.5"/>',
    ]
    if tag_progress > 0.001:
        clip_w = tag_progress * 700
        parts.append(
            f'<defs><clipPath id="agtag">'
            f'<rect x="{CX-350:.0f}" y="1220" width="{clip_w:.0f}" height="100"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#agtag)">'
            f'<text x="{CX}" y="1300" font-family="{FONT_SERIF}" '
            f'font-size="68" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{TAGLINE_MAIN}</text>'
            f'</g>'
        )
    return im, "".join(parts)


def phase6_cta_close(t, dust, photos):
    """Phase 6 — three sub-beats over 6.30s (slowed to ~8.82s):
      P6a  0.00-0.18  HOLD AGARTHA reveal (the brand block from P5 stays put)
      P6b  0.18-0.62  PRESENTED BY THE GREEN TEAM — divider rule animates in,
                      "PRESENTED BY" caption types in, Green Team LEAF
                      stroke-draws in (path-dim → path-light → veins stagger),
                      "THE GREEN TEAM" wordmark types in, "CHANNEL PARTNER"
                      caption fades in
      P6c  0.62-1.00  CTA + URL fade up + cinematic letterbox bars animate
    """
    u = norm(t, P5_END, TOTAL_S)
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = ink

    # Cinema bars animate in starting at u=0.55 (end of presented-by section)
    bar_h = int(90 * ease_out_cubic(clamp((u - 0.55) / 0.40)))

    cta_t = t - (TOTAL_S - 2.0)
    cta_blink = (
        0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 5.5))
        if cta_t > 0 else 0.0
    )

    # ──  Phase 6a/b: AGARTHA block is HELD but COMPRESSED upward to make
    # room for the presented-by reveal.
    # u=0.0: positions same as end of P5 (modcon@800, agartha@1100, tagline@1300)
    # u=0.40: positions compressed (modcon@600, agartha@850, tagline@1010)
    # then HELD at compressed positions.
    compress = ease_in_out(clamp((u - 0.05) / 0.30))
    modcon_y = int(lerp(800, 580, compress))
    agartha_y = int(lerp(1100, 830, compress))
    rule_y   = int(lerp(1140, 875, compress))
    tagline_y = int(lerp(1300, 970, compress))
    modcon_w = int(lerp(340, 250, compress))

    # ──  Phase 6b: PRESENTED BY THE GREEN TEAM reveal
    # Starts at u=0.20, completes by u=0.65.
    pb_caption_p = ease_out_cubic(clamp((u - 0.20) / 0.10))
    pb_rule_p    = ease_out_cubic(clamp((u - 0.22) / 0.10))
    pb_leaf_draw = ease_out_cubic(clamp((u - 0.28) / 0.18))
    pb_leaf_fill = ease_out_cubic(clamp((u - 0.40) / 0.16))
    pb_wordmark_p = ease_out_cubic(clamp((u - 0.45) / 0.18))
    pb_channel_p  = ease_out_cubic(clamp((u - 0.58) / 0.12))

    wordmark = "THE GREEN TEAM"
    wm_visible_n = int(round(pb_wordmark_p * len(wordmark)))
    wm_shown = wordmark[:wm_visible_n]

    # ──  Phase 6c: CTA + URL fade up
    cta_progress = ease_out_cubic(clamp((u - 0.62) / 0.20))
    sig_progress = ease_out_cubic(clamp((u - 0.72) / 0.22))

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

    # AGARTHA brand block (held + compressed)
    agartha_block = (
        modcon_logo_svg(CX, modcon_y, modcon_w, opacity=1.0)
        + f'<text x="{CX}" y="{agartha_y}" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="10" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX - 130}" y1="{rule_y}" x2="{CX + 130}" y2="{rule_y}" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="{CX}" y="{tagline_y}" font-family="{FONT_SERIF}" '
        f'font-size="52" font-style="italic" '
        f'fill="url(#goldHL)" font-weight="400" '
        f'text-anchor="middle">{TAGLINE_MAIN}</text>'
    )

    # PRESENTED BY THE GREEN TEAM block
    pb_block_parts = []
    # Gold dividing rule above the presented-by section
    if pb_rule_p > 0.001:
        rule_w = pb_rule_p * 280
        pb_block_parts.append(
            f'<line x1="{CX - rule_w/2:.0f}" y1="1080" '
            f'x2="{CX + rule_w/2:.0f}" y2="1080" '
            f'stroke="{GT_GOLD}" stroke-width="2" opacity="0.7"/>'
        )
    # "PRESENTED BY" caption
    if pb_caption_p > 0.001:
        pb_block_parts.append(
            f'<text x="{CX}" y="1140" font-family="{FONT_MONO}" font-size="18" '
            f'fill="{PAPER}" opacity="{pb_caption_p * 0.85:.3f}" letter-spacing="6" '
            f'font-weight="600" text-anchor="middle">PRESENTED BY</text>'
        )
    # Green Team LEAF stroke-draws in then fills
    pb_block_parts.append(
        leaf_logo_svg(CX, 1280, 160, pb_leaf_draw, pb_leaf_fill)
    )
    # "THE GREEN TEAM" wordmark types in
    if wm_shown:
        pb_block_parts.append(
            f'<text x="{CX}" y="1410" font-family="{FONT_DISPLAY}" font-size="50" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
            f'text-anchor="middle">{wm_shown}</text>'
        )
    # "CHANNEL PARTNER" subscript
    if pb_channel_p > 0.001:
        pb_block_parts.append(
            f'<text x="{CX}" y="1450" font-family="{FONT_MONO}" font-size="14" '
            f'fill="{GT_GOLD}" opacity="{pb_channel_p:.3f}" letter-spacing="6" '
            f'font-weight="600" text-anchor="middle">CHANNEL PARTNER</text>'
        )

    # CTA + URL block (bottom)
    cta_block = (
        f'<g transform="translate({CX},1620)" opacity="{cta_progress:.3f}">'
        f'<line x1="-200" y1="-40" x2="200" y2="-40" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{GT_GOLD}" opacity="{cta_blink:.3f}" letter-spacing="4" '
        f'font-weight="700" text-anchor="middle">{CTA_LINE_1}</text>'
        f'<text x="0" y="36" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" letter-spacing="4" font-weight="600" '
        f'text-anchor="middle">{CTA_LINE_2}</text>'
        '</g>'
        f'<text x="{CX}" y="1740" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle" opacity="{sig_progress:.3f}">thegreenteam.in</text>'
    )

    overlay = (
        final_defs
        + agartha_block
        + "".join(pb_block_parts)
        + cta_block
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        # Cinema bars
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
        # Eyebrow chip — attributes the developer + reel context
        f'<g transform="translate(80,360)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text></g>'
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
        # MODCON developer wordmark (the actual builder's mark)
        + modcon_logo_svg(CX, 1110, 280, opacity=1.0)
        # AGARTHA wordmark big
        + f'<text x="{CX}" y="1310" font-family="{FONT_DISPLAY}" font-size="120" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="12" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX-160}" y1="1350" x2="{CX+160}" y2="1350" '
        f'stroke="{GT_GOLD}" stroke-width="2.5"/>'
        # Specs row (Agartha facts)
        + f'<g transform="translate(0,1450)">'
        + f'<text x="200" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">25 ACRES</text>'
        + f'<text x="540" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">AQI 12 · 18 dB</text>'
        + f'<text x="880" y="0" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="2" text-anchor="middle">40 MIN TO FD</text>'
        + '</g>'
        # Signature: small Green Team leaf + channel partner attribution + URL
        + f'<line x1="{CX-200}" y1="1620" x2="{CX+200}" y2="1620" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        + leaf_logo_svg(CX, 1685, 44, 1.0, 1.0)
        + f'<text x="{CX}" y="1740" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="3" '
        f'text-anchor="middle">{CHANNEL_PARTNER_LINE}</text>'
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
    # Photo cast for the reel — chosen for visual distinctness so each
    # phase 3 tour beat lands on an obviously-different building/view.
    # (Previously: villa=4 and aerial=11 were the SAME vine villa from
    # different angles, which made the tour look stuck on one building.)
    photos = {
        "hero":     Photo(REPO / "public" / "gallery" / "agartha" / "14.webp"),  # tall pines — cold open
        "villa":    Photo(REPO / "public" / "gallery" / "agartha" / "4.webp"),   # vine-covered earth-bag villa
        "pavilion": Photo(REPO / "public" / "gallery" / "agartha" / "13.webp"),  # A-frame thatched villa
        "aerial":   Photo(REPO / "public" / "gallery" / "agartha" / "7.webp"),   # AERIAL trefoil + mandala gardens
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

    # Slow the entire output down by 40% (video + audio stay in sync).
    # SLOW_FACTOR = 1.4 means playback is 1/1.4 = 0.7143x speed.
    # 22.0s source frames + 22.0s source audio → 30.8s output.
    SLOW_FACTOR = 1.4
    OUT_DUR = TOTAL_S * SLOW_FACTOR  # 30.8s
    ATEMPO = 1.0 / SLOW_FACTOR        # ~0.7143

    # Production encode (CRF 18) with cover art + 1.4x slowdown
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
            "-filter:v:0", f"setpts={SLOW_FACTOR}*PTS",
            "-filter:a", f"atempo={ATEMPO:.6f},afade=t=out:st={OUT_DUR-1.0:.2f}:d=1.0",
            "-c:v:0", "libx264", "-preset", "slow", "-crf", str(crf),
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-c:v:1", "copy", "-disposition:v:1", "attached_pic",
            "-c:a", "aac", "-b:a", f"{audio_kb}k",
            "-movflags", "+faststart",
            "-t", str(OUT_DUR),
            str(out_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"[{label}] {out_path.name}  "
              f"{out_path.stat().st_size // (1024*1024)} MB  "
              f"({OUT_DUR:.1f}s, slowed {SLOW_FACTOR}x)")


if __name__ == "__main__":
    main()
