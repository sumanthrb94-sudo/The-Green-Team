"""
GT-AGARTHA-BLEND — production reel that interleaves Google Omni / Veo 3
footage with our Agartha property photo plates.

The CEO feedback was: "blend omni shots cuts with our generated video."
Previous v1 (agartha-omni) used Omni for 0-10s then cut to ink. This v2
blends Omni's cinematic drone work with the actual Agartha property
renders so viewers SEE the real property, not just the AI atmosphere.

Architecture (26s total · no slowdown · audio stays natural):

  0:00 - 0:10s  HERO PLATE — Omni footage
                  drone over forest canopy + property reveal
                  editorial chip + hook typewriter
                  Omni native voice-over plays through
  0:10 - 0:13s  PROPERTY TOUR — 3 quick photo cuts (1s each)
                  with diagonal wipes between:
                    vine villa (agartha/4)
                    A-frame thatched villa (agartha/13)
                    aerial trefoil + mandala (agartha/7)
  0:13 - 0:16s  STAT STROBE — 3 specs on beat
                  25 ACRES · AQI 12 · 40 MIN TO FD
  0:16 - 0:20s  BRAND REVEAL — fade to ink, MODCON wordmark + AGARTHA
                  + italic gold "forest-edge sanctuary."
  0:20 - 0:23s  PRESENTED BY THE GREEN TEAM
                  gold rule + caption + leaf stroke draws in + wordmark
                  + CHANNEL PARTNER subscript
  0:23 - 0:26s  CTA CLOSE — "COMMENT 'AGARTHA' / WE DM THE BRIEF"
                  + URL + cinema bars animate in

Audio mix:
  0:00 - 0:10s  Omni's native voice-over + ambient
  0:08 - 0:26s  mrclaps_fashion music bed (crossfades in 8-10s)
  0:23 - 0:26s  music fades out for the close
"""
from __future__ import annotations

import io
import math
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import numpy as np
from PIL import Image

import build_gt_thumb_v41 as v41
from build_gt_thumb_v41 import (
    W, H, FPS, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, svg_to_pil, svg_wrap,
    leaf_logo_svg,
    REPO,
)
from build_gt_agartha_reel import modcon_logo_svg, diagonal_wipe
from build_gt_agartha_omni import (
    DEFS, OMNI_SRC, MUSIC_SRC, OMNI_FRAMES_DIR,
    extract_omni_frames,
)

# ─── OUTPUT PATHS ───────────────────────────────────────────────────────
FRAMES_DIR = REPO / "out" / "frames_gt-agartha-blend"
FINAL_MP4 = REPO / "out" / "agartha-blend-60fps.mp4"
MOBILE_MP4 = REPO / "out" / "agartha-blend-mobile.mp4"
POSTER_JPG = REPO / "out" / "agartha-blend-poster.jpg"

# ─── TIMING ─────────────────────────────────────────────────────────────
HERO_S    = 10.0
TOUR_S    = 3.0
STAT_S    = 3.0
REVEAL_S  = 4.0
PRESENT_S = 3.0
CTA_S     = 3.0

P_HERO_END    = HERO_S                        # 10.0
P_TOUR_END    = P_HERO_END + TOUR_S           # 13.0
P_STAT_END    = P_TOUR_END + STAT_S           # 16.0
P_REVEAL_END  = P_STAT_END + REVEAL_S         # 20.0
P_PRESENT_END = P_REVEAL_END + PRESENT_S      # 23.0
TOTAL_S       = P_PRESENT_END + CTA_S         # 26.0

N_FRAMES      = int(TOTAL_S * FPS)            # 1560
HERO_FRAMES   = int(HERO_S * FPS)             # 600

# ─── CONTENT ────────────────────────────────────────────────────────────
PROPERTY_NAME = "AGARTHA"
TAGLINE_MAIN  = "forest-edge sanctuary."
HOOK_LINE_1 = "FORESTS DON'T STAY"
HOOK_LINE_2 = "BY ACCIDENT."
HOOK_TAG    = "they're curated."
SPECS = [
    ("PROJECT SIZE",       "25 ACRES",  "NARSAPUR FOREST · 36 PLOTS"),
    ("AIR QUALITY",        "AQI 12",    "AMBIENT 18 dB"),
    ("FINANCIAL DISTRICT", "40 MIN",    "VIA THE RRR CORRIDOR"),
]
TOUR_PHOTOS = [
    ("villa",    "BIOPHILIC VILLA",       "4.webp"),
    ("thatched", "THATCHED VILLAS",       "13.webp"),
    ("aerial",   "MASTER PLAN",           "7.webp"),
]
CTA_LINE_1 = "COMMENT 'AGARTHA'"
CTA_LINE_2 = "WE DM THE BRIEF"


# ─── HERO OVERLAY (0-10s) — typography over Omni footage ────────────────
# Speech-onset timing for Omni audio (librosa silence segmentation @ 20dB).
# These are the ACTUAL voice-over phrase boundaries Omni rendered, NOT the
# intended timings in the master prompt. Subtitles below are timed to land
# ON these boundaries so audio + visuals stay in sync.
#
# Detected phrases:
#   1.79 → 3.74s   "Forests don't stay by accident."
#   4.32 → 7.11s   "They're curated. Twenty-five acres on the Narsapur..."
#   7.13 → 9.45s   "...forest boundary. Air-quality index — twelve."
VO_P1_START = 1.79   # phrase 1 starts
VO_P1_END   = 3.74   # phrase 1 ends
VO_P2_START = 4.32   # phrase 2 starts (curated + 25 acres)
VO_P2_END   = 7.11
VO_P3_START = 7.13   # phrase 3 starts (Narsapur + AQI 12)
VO_P3_END   = 9.45


def hero_overlay_svg(t: float) -> str:
    """Typography overlay synced to Omni's actual voice-over boundaries.

    Sync map:
      0.5 -> chip fades in
      1.79-2.7s  "FORESTS DON'T STAY" line 1 typewriter      (during phrase 1)
      2.7-3.7s   "BY ACCIDENT." line 2 typewriter             (during phrase 1)
      4.3-5.4s   italic gold "they're curated." mask reveal   (during phrase 2 head)
      5.5-7.0s   "25 ACRES" stat preview slides in            (during phrase 2 tail)
      7.1-9.0s   "NARSAPUR FOREST EDGE" stat preview slides   (during phrase 3)
    """
    parts = [DEFS]

    # Top shade for chip
    parts.append(f'<rect width="{W}" height="380" fill="url(#topshade)"/>')

    chip_op = ease_out_cubic(clamp((t - 0.5) / 0.6))
    if chip_op > 0.001:
        parts.append(
            f'<g transform="translate(80,330)" opacity="{chip_op:.3f}">'
            f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
            f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
            f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
            f'MODCON AGARTHA</text>'
            f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
            f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
            f'CURATED · THE GREEN TEAM</text>'
            f'</g>'
        )

    # Bottom shade — present once VO starts so the hook reads on the foliage
    if t > VO_P1_START - 0.2:
        shade_op = ease_out_cubic(clamp((t - (VO_P1_START - 0.2)) / 0.4))
        parts.append(
            f'<rect x="0" y="{H-600}" width="{W}" height="600" '
            f'fill="url(#botshade)" opacity="{shade_op:.3f}"/>'
        )

    # Hook lines — typewriter, locked to VO phrase 1 boundaries
    hook_y = 1280
    # Line 1 spans VO_P1_START .. midpoint
    p1_mid = VO_P1_START + (VO_P1_END - VO_P1_START) * 0.50
    line1_p = ease_out_cubic(clamp((t - VO_P1_START) / (p1_mid - VO_P1_START)))
    # Line 2 spans midpoint .. VO_P1_END
    line2_p = ease_out_cubic(clamp((t - p1_mid) / (VO_P1_END - p1_mid)))

    n1 = max(1, len(HOOK_LINE_1))
    v1 = int(round(line1_p * n1))
    line1 = HOOK_LINE_1[:v1]
    n2 = max(1, len(HOOK_LINE_2))
    v2 = int(round(line2_p * n2))
    line2 = HOOK_LINE_2[:v2]
    if line1:
        parts.append(
            f'<text x="{CX}" y="{hook_y}" font-family="{FONT_DISPLAY}" '
            f'font-size="76" fill="{PAPER}" font-weight="800" '
            f'letter-spacing="-2" text-anchor="middle">{line1}</text>'
        )
    if line2:
        parts.append(
            f'<text x="{CX}" y="{hook_y+92}" font-family="{FONT_DISPLAY}" '
            f'font-size="76" fill="{PAPER}" font-weight="800" '
            f'letter-spacing="-2" text-anchor="middle">{line2}</text>'
        )

    # Gold rule draws in just before italic subtitle (end of phrase 1)
    rule_p = clamp((t - (VO_P1_END - 0.15)) / 0.25)
    if rule_p > 0.001:
        rw = rule_p * 180
        parts.append(
            f'<line x1="{CX - rw/2:.0f}" y1="{hook_y+165}" '
            f'x2="{CX + rw/2:.0f}" y2="{hook_y+165}" '
            f'stroke="{GT_GOLD}" stroke-width="2"/>'
        )

    # Italic gold "they're curated." — mask reveal, locked to VO phrase 2 START
    # (first ~1.1s of phrase 2 = "they're curated.")
    sub_dur = 1.1
    sub_p = ease_out_cubic(clamp((t - VO_P2_START) / sub_dur))
    if sub_p > 0.001:
        clip_w = sub_p * 460
        parts.append(
            f'<defs><clipPath id="subclip">'
            f'<rect x="{CX-230:.0f}" y="{hook_y+200}" width="{clip_w:.0f}" height="80"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#subclip)">'
            f'<text x="{CX}" y="{hook_y+260}" font-family="{FONT_SERIF}" '
            f'font-size="56" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{HOOK_TAG}</text>'
            f'</g>'
        )

    # Stat preview chip #1 — "25 ACRES" — locked to phrase 2 TAIL
    # (Omni voice transitioning from "they're curated" to "twenty-five acres")
    stat1_in = VO_P2_START + 1.3   # ~5.6s
    stat1_p = ease_out_cubic(clamp((t - stat1_in) / 0.8))
    if stat1_p > 0.001:
        # Slide in from left, fade in
        dx = (1 - stat1_p) * -180
        parts.append(
            f'<g transform="translate({80 + dx:.0f},580)" opacity="{stat1_p:.3f}">'
            f'<rect x="0" y="-22" width="4" height="64" fill="{GT_GOLD}"/>'
            f'<text x="18" y="-2" font-family="{FONT_MONO}" font-size="14" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">PROJECT SIZE</text>'
            f'<text x="18" y="34" font-family="{FONT_DISPLAY}" font-size="44" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="-1.5">25 ACRES</text>'
            f'</g>'
        )

    # Stat preview chip #2 — "NARSAPUR FOREST EDGE" — locked to phrase 3 START
    stat2_in = VO_P3_START + 0.1   # ~7.2s
    stat2_p = ease_out_cubic(clamp((t - stat2_in) / 0.8))
    if stat2_p > 0.001:
        dx = (1 - stat2_p) * -180
        parts.append(
            f'<g transform="translate({80 + dx:.0f},700)" opacity="{stat2_p:.3f}">'
            f'<rect x="0" y="-22" width="4" height="64" fill="{GT_GOLD}"/>'
            f'<text x="18" y="-2" font-family="{FONT_MONO}" font-size="14" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">ADDRESS</text>'
            f'<text x="18" y="34" font-family="{FONT_DISPLAY}" font-size="36" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="-1">NARSAPUR FOREST</text>'
            f'</g>'
        )
    return svg_wrap("".join(parts))


def render_hero_frame(i: int) -> Image.Image:
    """Composite Omni frame i with the hero typography overlay."""
    t = i / FPS
    omni_idx = min(i, HERO_FRAMES - 1)
    omni_path = OMNI_FRAMES_DIR / f"o{omni_idx+1:05d}.jpg"
    base = Image.open(omni_path).convert("RGB").convert("RGBA")
    overlay = svg_to_pil(hero_overlay_svg(t))
    base.alpha_composite(overlay)
    return base.convert("RGB")


# ─── TOUR PHASE (10-13s) — 3 Agartha photos with diagonal wipes ─────────
def render_tour_frame(i: int, photos: dict[str, Photo]) -> Image.Image:
    """Quick property tour. Each photo holds for 1s with a 0.3s wipe
    between adjacent photos. Active label bottom-left."""
    t = i / FPS
    bt = t - P_HERO_END   # 0..3
    chunk = TOUR_S / 3.0  # 1.0s per photo

    # Determine current photo + next-photo wipe progress
    idx_f = bt / chunk
    idx = min(2, int(idx_f))
    sub_u = idx_f - idx
    # The wipe-in happens during the first 30% of each chunk
    wipe_p = ease_in_out(clamp(sub_u / 0.30)) if idx > 0 else 1.0

    if idx == 0:
        # First photo: cross-fade from Omni final frame
        omni_final = Image.open(OMNI_FRAMES_DIR / f"o{HERO_FRAMES:05d}.jpg"
                                 ).convert("RGB")
        photo_key = TOUR_PHOTOS[0][0]
        im_b = photos[photo_key].ken_burns(
            bt, TOUR_S, start_zoom=1.05, end_zoom=1.18,
            start_cx=0.50, start_cy=0.55, end_cx=0.55, end_cy=0.50,
        )
        im = diagonal_wipe(omni_final, im_b, wipe_p,
                           angle_deg=14.0, feather=80)
        active_label = TOUR_PHOTOS[0][1]
    else:
        # Subsequent photos: wipe between adjacent photo plates
        prev_key = TOUR_PHOTOS[idx - 1][0]
        curr_key = TOUR_PHOTOS[idx][0]
        # Both photos use their own slight Ken Burns (continuous over TOUR_S)
        im_a = photos[prev_key].ken_burns(
            bt, TOUR_S, start_zoom=1.05, end_zoom=1.20,
            start_cx=0.50, start_cy=0.50, end_cx=0.55, end_cy=0.55,
        )
        im_b = photos[curr_key].ken_burns(
            bt - idx * chunk, TOUR_S - idx * chunk,
            start_zoom=1.04, end_zoom=1.14,
            start_cx=0.50, start_cy=0.50, end_cx=0.55, end_cy=0.55,
        )
        angle = [-12, 10][idx - 1]
        im = diagonal_wipe(im_a, im_b, wipe_p, angle_deg=angle, feather=80)
        active_label = TOUR_PHOTOS[idx][1]

    # Bottom darken band for the label
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        if y < 1450:
            continue
        d = abs(y - 1580) / 130.0
        a = 0.55 * math.exp(-d * d)
        arr[y, :, 3] = int(255 * min(1.0, a))
    band = Image.fromarray(arr, 'RGBA')
    out = im.convert("RGBA")
    out.alpha_composite(band)
    im = out.convert("RGB")

    # Tour label overlay
    overlay = svg_wrap(
        DEFS
        + f'<g transform="translate(80,1580)">'
        + f'<line x1="0" y1="-32" x2="60" y2="-32" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">'
        f'TOUR · {idx+1:02d} / 03</text>'
        + f'<text x="0" y="34" font-family="{FONT_DISPLAY}" font-size="40" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-1">'
        f'{active_label}</text>'
        + '</g>'
        # Eyebrow chip held over
        + f'<g transform="translate(80,330)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
        f'MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text>'
        f'</g>'
    )
    ov = svg_to_pil(overlay)
    out = im.convert("RGBA")
    out.alpha_composite(ov)
    return out.convert("RGB")


# ─── STAT STROBE (13-16s) — 3 specs cut on beats ────────────────────────
def render_stat_frame(i: int, photos: dict[str, Photo]) -> Image.Image:
    """Strobe-cut 3 specs over the aerial photo backdrop (heavily darkened)."""
    t = i / FPS
    bt = t - P_TOUR_END  # 0..3
    chunk = STAT_S / 3.0   # 1.0s per spec
    idx = min(2, int(bt / chunk))
    chunk_t = bt - idx * chunk
    flash = max(0.0, math.exp(-chunk_t / 0.06) * (1.0 if chunk_t < 0.20 else 0.0))
    flash_alpha = flash * 0.50
    label, value, sublabel = SPECS[idx]

    # Backdrop: aerial photo with heavy ink wash
    im = photos["aerial"].ken_burns(
        bt + 1.0, STAT_S + 1.0,
        start_zoom=1.14, end_zoom=1.24,
        start_cx=0.50, start_cy=0.50, end_cx=0.50, end_cy=0.50,
    )
    wash = Image.new("RGB", (W, H), (14, 20, 8))
    im = Image.blend(im, wash, 0.72)

    dots = "".join(
        f'<circle cx="{j*22}" cy="18" r="5" '
        f'fill="{GT_GOLD if j == idx else "#3a4a2c"}"/>'
        for j in range(3)
    )

    overlay = svg_wrap(
        DEFS
        + f'<g transform="translate(80,330)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
        f'MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text>'
        f'</g>'
        + f'<g transform="translate({W - 200},330)">'
        f'<text x="0" y="-4" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">'
        f'SPEC {idx + 1:02d} / 03</text>'
        f'{dots}'
        f'</g>'
        + f'<rect x="100" y="780" width="4" height="380" fill="{GT_GOLD}"/>'
        + f'<text x="130" y="830" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">{label}</text>'
        + f'<text x="130" y="990" font-family="{FONT_DISPLAY}" font-size="160" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-5">{value}</text>'
        + f'<text x="130" y="1080" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="3">{sublabel}</text>'
        + f'<rect width="{W}" height="{H}" fill="{PAPER}" opacity="{flash_alpha:.3f}"/>'
    )
    ov = svg_to_pil(overlay)
    out = im.convert("RGBA")
    out.alpha_composite(ov)
    return out.convert("RGB")


# ─── BRAND REVEAL (16-20s) — MODCON + AGARTHA + tagline on ink ──────────
def render_reveal_frame(i: int) -> Image.Image:
    t = i / FPS
    bt = t - P_STAT_END   # 0..4
    u = bt / REVEAL_S      # 0..1

    base = Image.new("RGB", (W, H), (14, 20, 8))
    modcon_op = ease_out_cubic(clamp((u - 0.05) / 0.40))
    pname_p = ease_out_cubic(clamp((u - 0.40) / 0.30))
    pname_visible_n = int(round(pname_p * len(PROPERTY_NAME)))
    pname_shown = PROPERTY_NAME[:pname_visible_n]
    rule_w = clamp((u - 0.55) / 0.18) * 320
    tag_p = ease_out_cubic(clamp((u - 0.70) / 0.25))

    parts = [
        DEFS,
        modcon_logo_svg(CX, 800, 340, opacity=modcon_op),
        f'<text x="{CX}" y="1100" font-family="{FONT_DISPLAY}" font-size="140" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="14" '
        f'text-anchor="middle">{pname_shown}</text>',
        f'<line x1="{CX - rule_w/2:.0f}" y1="1140" '
        f'x2="{CX + rule_w/2:.0f}" y2="1140" stroke="{GT_GOLD}" '
        f'stroke-width="2.5"/>',
    ]
    if tag_p > 0.001:
        parts.append(
            f'<defs><clipPath id="agtag">'
            f'<rect x="{CX-350:.0f}" y="1220" width="{tag_p * 700:.0f}" '
            f'height="100"/></clipPath></defs>'
            f'<g clip-path="url(#agtag)">'
            f'<text x="{CX}" y="1300" font-family="{FONT_SERIF}" '
            f'font-size="68" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{TAGLINE_MAIN}</text>'
            f'</g>'
        )
    overlay = svg_wrap("".join(parts))
    ov = svg_to_pil(overlay)
    out = base.convert("RGBA")
    out.alpha_composite(ov)
    return out.convert("RGB")


# ─── PRESENTED BY (20-23s) ──────────────────────────────────────────────
def render_presented_frame(i: int) -> Image.Image:
    t = i / FPS
    bt = t - P_REVEAL_END   # 0..3
    u = bt / PRESENT_S        # 0..1

    base = Image.new("RGB", (W, H), (14, 20, 8))

    # AGARTHA block compressed upward to make room
    modcon_y = 480
    agartha_y = 720
    rule_y = 760
    tag_y = 860

    div_rule_w = ease_out_cubic(clamp((u - 0.05) / 0.15)) * 280
    pb_caption_p = ease_out_cubic(clamp((u - 0.05) / 0.15))
    pb_leaf_draw = ease_out_cubic(clamp((u - 0.15) / 0.30))
    pb_leaf_fill = ease_out_cubic(clamp((u - 0.32) / 0.25))
    pb_wordmark_p = ease_out_cubic(clamp((u - 0.40) / 0.30))
    wordmark = "THE GREEN TEAM"
    wm_visible_n = int(round(pb_wordmark_p * len(wordmark)))
    wm_shown = wordmark[:wm_visible_n]
    pb_channel_p = ease_out_cubic(clamp((u - 0.70) / 0.20))

    parts = [DEFS]
    parts.append(modcon_logo_svg(CX, modcon_y, 250, opacity=1.0))
    parts.append(
        f'<text x="{CX}" y="{agartha_y}" font-family="{FONT_DISPLAY}" '
        f'font-size="100" fill="{PAPER}" font-weight="800" letter-spacing="10" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
    )
    parts.append(
        f'<line x1="{CX-130}" y1="{rule_y}" x2="{CX+130}" y2="{rule_y}" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
    )
    parts.append(
        f'<text x="{CX}" y="{tag_y}" font-family="{FONT_SERIF}" '
        f'font-size="48" font-style="italic" fill="url(#goldHL)" '
        f'font-weight="400" text-anchor="middle">{TAGLINE_MAIN}</text>'
    )
    parts.append(
        f'<line x1="{CX - div_rule_w/2:.0f}" y1="990" '
        f'x2="{CX + div_rule_w/2:.0f}" y2="990" '
        f'stroke="{GT_GOLD}" stroke-width="2" opacity="0.7"/>'
    )
    if pb_caption_p > 0.001:
        parts.append(
            f'<text x="{CX}" y="1050" font-family="{FONT_MONO}" font-size="18" '
            f'fill="{PAPER}" opacity="{pb_caption_p * 0.85:.3f}" '
            f'letter-spacing="6" font-weight="600" text-anchor="middle">'
            f'PRESENTED BY</text>'
        )
    parts.append(leaf_logo_svg(CX, 1200, 180, pb_leaf_draw, pb_leaf_fill))
    if wm_shown:
        parts.append(
            f'<text x="{CX}" y="1340" font-family="{FONT_DISPLAY}" font-size="50" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
            f'text-anchor="middle">{wm_shown}</text>'
        )
    if pb_channel_p > 0.001:
        parts.append(
            f'<text x="{CX}" y="1380" font-family="{FONT_MONO}" font-size="14" '
            f'fill="{GT_GOLD}" opacity="{pb_channel_p:.3f}" letter-spacing="6" '
            f'font-weight="600" text-anchor="middle">CHANNEL PARTNER</text>'
        )
    overlay = svg_wrap("".join(parts))
    ov = svg_to_pil(overlay)
    out = base.convert("RGBA")
    out.alpha_composite(ov)
    return out.convert("RGB")


# ─── CTA CLOSE (23-26s) ────────────────────────────────────────────────
def render_cta_frame(i: int) -> Image.Image:
    t = i / FPS
    bt = t - P_PRESENT_END   # 0..3
    u = bt / CTA_S             # 0..1

    base = Image.new("RGB", (W, H), (14, 20, 8))
    bar_h = int(90 * ease_out_cubic(clamp(u / 0.40)))
    cta_progress = ease_out_cubic(clamp(u / 0.40))
    sig_progress = ease_out_cubic(clamp((u - 0.20) / 0.40))
    cta_t = bt - (CTA_S - 2.0)
    cta_blink = (
        0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 5.5))
        if cta_t > 0 else 0.55
    )

    parts = [DEFS]
    parts.append(modcon_logo_svg(CX, 480, 250, opacity=1.0))
    parts.append(
        f'<text x="{CX}" y="720" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="10" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
    )
    parts.append(
        f'<line x1="{CX-130}" y1="760" x2="{CX+130}" y2="760" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
    )
    parts.append(
        f'<text x="{CX}" y="860" font-family="{FONT_SERIF}" font-size="48" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="400" '
        f'text-anchor="middle">{TAGLINE_MAIN}</text>'
    )
    parts.append(
        f'<line x1="{CX-140}" y1="990" x2="{CX+140}" y2="990" '
        f'stroke="{GT_GOLD}" stroke-width="2" opacity="0.7"/>'
    )
    parts.append(
        f'<text x="{CX}" y="1050" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="6" '
        f'font-weight="600" text-anchor="middle">PRESENTED BY</text>'
    )
    parts.append(leaf_logo_svg(CX, 1200, 180, 1.0, 1.0))
    parts.append(
        f'<text x="{CX}" y="1340" font-family="{FONT_DISPLAY}" font-size="50" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
    )
    parts.append(
        f'<text x="{CX}" y="1380" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" letter-spacing="6" font-weight="600" '
        f'text-anchor="middle">CHANNEL PARTNER</text>'
    )
    parts.append(
        f'<g transform="translate({CX},1520)" opacity="{cta_progress:.3f}">'
        f'<line x1="-200" y1="-40" x2="200" y2="-40" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.45"/>'
        f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" opacity="{cta_blink:.3f}" letter-spacing="4" '
        f'font-weight="700" text-anchor="middle">{CTA_LINE_1}</text>'
        f'<text x="0" y="38" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{PAPER}" letter-spacing="4" font-weight="600" '
        f'text-anchor="middle">{CTA_LINE_2}</text>'
        f'</g>'
    )
    parts.append(
        f'<text x="{CX}" y="1650" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle" opacity="{sig_progress:.3f}">thegreenteam.in</text>'
    )
    parts.append(f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>')
    parts.append(f'<rect x="0" y="{H-bar_h}" width="{W}" height="{bar_h}" fill="#000"/>')

    overlay = svg_wrap("".join(parts))
    ov = svg_to_pil(overlay)
    out = base.convert("RGBA")
    out.alpha_composite(ov)
    return out.convert("RGB")


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(i: int, photos: dict[str, Photo]) -> Image.Image:
    t = i / FPS
    if t < P_HERO_END:
        return render_hero_frame(i)
    if t < P_TOUR_END:
        return render_tour_frame(i, photos)
    if t < P_STAT_END:
        return render_stat_frame(i, photos)
    if t < P_REVEAL_END:
        return render_reveal_frame(i)
    if t < P_PRESENT_END:
        return render_presented_frame(i)
    return render_cta_frame(i)


# ─── POSTER ─────────────────────────────────────────────────────────────
def build_poster():
    """Same poster as agartha-omni — uses Omni's property-reveal frame."""
    omni_idx = min(int(9.5 * FPS), HERO_FRAMES - 1)
    omni_path = OMNI_FRAMES_DIR / f"o{omni_idx+1:05d}.jpg"
    base = Image.open(omni_path).convert("RGB")
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        u = max(0.0, (y - H * 0.30) / (H * 0.45))
        u = min(1.0, u)
        a = int(255 * 0.78 * u ** 1.4)
        arr[y, :, 3] = a
    overlay = Image.fromarray(arr, mode='RGBA')
    base = base.convert("RGBA")
    base.alpha_composite(overlay)
    base = base.convert("RGB")

    svg = svg_wrap(
        DEFS
        + f'<g transform="translate(80,330)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text></g>'
        + f'<text x="{CX}" y="990" font-family="{FONT_DISPLAY}" font-size="80" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2.5" '
        f'text-anchor="middle">FORESTS DON\'T STAY</text>'
        + f'<text x="{CX}" y="1080" font-family="{FONT_DISPLAY}" font-size="80" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-2.5" '
        f'text-anchor="middle">BY ACCIDENT.</text>'
        + f'<line x1="{CX-90}" y1="1130" x2="{CX+90}" y2="1130" '
        f'stroke="{GT_GOLD}" stroke-width="3"/>'
        + f'<text x="{CX}" y="1200" font-family="{FONT_SERIF}" font-size="54" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">they\'re curated.</text>'
        + modcon_logo_svg(CX, 1340, 260, opacity=1.0)
        + f'<text x="{CX}" y="1500" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="10" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX-130}" y1="1540" x2="{CX+130}" y2="1540" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<text x="{CX}" y="1610" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="5" '
        f'text-anchor="middle">PRESENTED BY</text>'
        + leaf_logo_svg(CX, 1690, 80, 1.0, 1.0)
        + f'<text x="{CX}" y="1790" font-family="{FONT_DISPLAY}" font-size="36" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="5" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
        + f'<text x="{CX}" y="1820" font-family="{FONT_MONO}" font-size="12" '
        f'fill="{GT_GOLD}" letter-spacing="4" font-weight="600" '
        f'text-anchor="middle">CHANNEL PARTNER</text>'
        + f'<text x="{CX}" y="1875" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
    )
    ov = svg_to_pil(svg)
    out = base.convert("RGBA")
    out.alpha_composite(ov)
    out.convert("RGB").save(POSTER_JPG, "JPEG", quality=92,
                            optimize=True, progressive=True)
    print(f"[poster] {POSTER_JPG.name}  {POSTER_JPG.stat().st_size // 1024} KB")


# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    print(f"[gt-agartha-blend] {N_FRAMES} frames @ {FPS}fps · {TOTAL_S}s")

    # Step 1: extract Omni frames if not already cached
    if not OMNI_FRAMES_DIR.exists() or len(list(OMNI_FRAMES_DIR.glob("*.jpg"))) < HERO_FRAMES:
        extract_omni_frames()
    else:
        print(f"[omni] reusing {len(list(OMNI_FRAMES_DIR.glob('*.jpg')))} cached frames")

    # Step 2: build poster
    build_poster()

    # Step 3: load Agartha photo cast
    photos = {
        "villa":    Photo(REPO / "public" / "gallery" / "agartha" / "4.webp"),
        "thatched": Photo(REPO / "public" / "gallery" / "agartha" / "13.webp"),
        "aerial":   Photo(REPO / "public" / "gallery" / "agartha" / "7.webp"),
    }
    for p in photos.values():
        p.load()

    # Step 4: render frames
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()

    t0 = time.time()
    for i in range(N_FRAMES):
        frame = render_frame(i, photos)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time() - t0:.0f}s")

    # Step 5: replace first 30 frames with poster
    for i in range(30):
        Image.open(POSTER_JPG).save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)

    # Step 6: mux with audio (Omni 0-10s → mrclaps_fashion crossfade 8-26s)
    for label, crf, audio_kb, out_path in (
        ("prod",   18, 192, FINAL_MP4),
        ("mobile", 26,  96, MOBILE_MP4),
    ):
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(FPS),
            "-i", str(FRAMES_DIR / "f%05d.jpg"),
            "-i", str(OMNI_SRC),
            "-i", str(MUSIC_SRC),
            "-i", str(POSTER_JPG),
            "-filter_complex",
            "[1:a]atrim=0:10,asetpts=PTS-STARTPTS,afade=t=out:st=8:d=2[omni];"
            "[2:a]atrim=0:18,asetpts=PTS-STARTPTS,adelay=8000|8000,"
            "afade=t=in:st=8:d=2,afade=t=out:st=24:d=2[music];"
            "[omni][music]amix=inputs=2:duration=longest:dropout_transition=0,"
            "alimiter=limit=0.95[aout]",
            "-map", "0:v:0", "-map", "[aout]", "-map", "3:v:0",
            "-c:v:0", "libx264", "-preset", "slow", "-crf", str(crf),
            "-pix_fmt", "yuv420p",
            "-c:v:1", "copy", "-disposition:v:1", "attached_pic",
            "-c:a", "aac", "-b:a", f"{audio_kb}k",
            "-movflags", "+faststart",
            "-t", str(TOTAL_S),
            str(out_path),
        ]
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"[{label}] {out_path.name}  "
              f"{out_path.stat().st_size // (1024*1024)} MB")


if __name__ == "__main__":
    main()
