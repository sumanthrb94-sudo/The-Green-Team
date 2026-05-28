"""
GT-AGARTHA-OMNI — production reel built on Google Omni / Veo 3 footage

The user generated 10s of cinematic drone footage + voice-over via the
master prompt at brand-kit/prompts/omni-veo-master-prompt.md. This
script wraps that footage into a 25s production-ready reel:

  0:00 - 0:10s  HERO PLATE — Omni footage (drone over forest + property reveal)
                  - Scaled + center-cropped to 9:16 (Veo watermark cropped out)
                  - Frame-doubled 24fps → 60fps
                  - Editorial chip overlay (MODCON AGARTHA · curated by GT)
                  - Hook typewriter that REINFORCES the Omni voice-over:
                      "FORESTS DON'T STAY"  →  "BY ACCIDENT."  →  "they're curated."
  0:10 - 0:13s  STAT STROBE  3 specs flash:
                    25 ACRES · NARSAPUR FOREST · AQI 12 · 40 MIN TO FD
  0:13 - 0:18s  BRAND REVEAL  fade to ink, MODCON wordmark, AGARTHA,
                  italic gold "forest-edge sanctuary."
  0:18 - 0:22s  PRESENTED BY THE GREEN TEAM  leaf stroke-draws in, wordmark,
                  CHANNEL PARTNER subscript
  0:22 - 0:25s  CTA CLOSE  COMMENT 'AGARTHA' · WE DM THE BRIEF · URL
                  + cinema bars animate in

Audio:
  0:00 - 0:10s  Omni's native audio (voice-over + forest ambient)
  0:08 - 0:25s  mrclaps_fashion music bed (crossfades in at 8s, fades out at 24)

Output:
  out/agartha-omni-60fps.mp4     production (CRF 18)
  out/agartha-omni-mobile.mp4    mobile (CRF 26)
  out/agartha-omni-poster.jpg    1080×1920 channel poster
"""
from __future__ import annotations

import io
import math
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

import cairosvg
from PIL import Image

import build_gt_thumb_v41 as v41
from build_gt_thumb_v41 import (
    W, H, FPS, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    svg_to_pil, svg_wrap,
    leaf_logo_svg,
    REPO,
)
from build_gt_agartha_reel import modcon_logo_svg

# ─── INPUTS ─────────────────────────────────────────────────────────────
OMNI_SRC = Path(
    "/root/.claude/uploads/40e1fe76-67d3-47c1-b176-01120bb965a7/"
    "a2b40655-MASTER_PROMPT___Google_Omni__1.mp4"
)
MUSIC_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)

# ─── OUTPUT PATHS ───────────────────────────────────────────────────────
FRAMES_DIR = REPO / "out" / "frames_gt-agartha-omni"
OMNI_FRAMES_DIR = REPO / "out" / "_omni_extracted"
FINAL_MP4 = REPO / "out" / "agartha-omni-60fps.mp4"
MOBILE_MP4 = REPO / "out" / "agartha-omni-mobile.mp4"
POSTER_JPG = REPO / "out" / "agartha-omni-poster.jpg"

# ─── TIMING ─────────────────────────────────────────────────────────────
HERO_S = 10.0
BRAND_S = 15.0
TOTAL_S = HERO_S + BRAND_S  # 25.0s
N_FRAMES = int(TOTAL_S * FPS)        # 1500
HERO_FRAMES = int(HERO_S * FPS)      # 600

# Sub-phase boundaries inside the BRAND section (t-offset from 10.0s)
B_STAT_END    = 13.0  # 10→13: stat strobe
B_REVEAL_END  = 18.0  # 13→18: MODCON + AGARTHA + tagline
B_PRESENT_END = 22.0  # 18→22: PRESENTED BY THE GREEN TEAM
                       # 22→25: CTA close + cinema bars

# ─── CONTENT BRIEF (Agartha — verified facts) ───────────────────────────
PROPERTY_NAME = "AGARTHA"
TAGLINE_MAIN  = "forest-edge sanctuary."

# Hook overlay that REINFORCES the Omni voice-over track
HOOK_LINE_1 = "FORESTS DON'T STAY"
HOOK_LINE_2 = "BY ACCIDENT."
HOOK_TAG    = "they're curated."

# Strobe specs (3 cuts inside the 3s stat phase)
SPECS = [
    ("PROJECT SIZE",      "25 ACRES",    "NARSAPUR FOREST · 36 PLOTS"),
    ("AIR QUALITY",       "AQI 12",      "AMBIENT 18 dB"),
    ("FINANCIAL DISTRICT","40 MIN",      "VIA THE RRR CORRIDOR"),
]

CTA_LINE_1 = "COMMENT 'AGARTHA'"
CTA_LINE_2 = "WE DM THE BRIEF"
CHANNEL_PARTNER_LINE = "CURATED BY THE GREEN TEAM  ·  CHANNEL PARTNER"


# ─── STEP 1: PRE-EXTRACT OMNI FRAMES (60fps, 1080x1920) ─────────────────
def extract_omni_frames():
    """ffmpeg: scale Omni 1280x720 to fill 9:16 (cropping the Veo watermark
    out of frame in the process), frame-double to 60fps, output JPG sequence."""
    OMNI_FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    # Clear stale frames
    for f in OMNI_FRAMES_DIR.glob("*.jpg"):
        f.unlink()
    # scale=-2:1920 → keeps aspect, fits height to 1920 → 3413×1920
    # crop=1080:1920 → center-crops to 9:16 (cuts the lower-right Veo watermark out)
    # fps=60 → frame-doubles from 24fps source
    cmd = [
        "ffmpeg", "-y", "-i", str(OMNI_SRC),
        "-vf", f"scale=-2:{H},crop={W}:{H},fps={FPS}",
        "-an", "-q:v", "2",
        str(OMNI_FRAMES_DIR / "o%05d.jpg"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    n = len(list(OMNI_FRAMES_DIR.glob("*.jpg")))
    print(f"[omni] extracted {n} frames at {FPS}fps to {OMNI_FRAMES_DIR}")
    return n


# ─── HERO OVERLAY (0-10s) — typography on top of Omni footage ───────────
DEFS = (
    '<defs>'
    f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
    f'<stop offset="0" stop-color="{GT_GOLD}"/>'
    f'<stop offset="0.55" stop-color="#e6ce85"/>'
    f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
    f'</linearGradient>'
    f'<linearGradient id="topshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0.65"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0"/>'
    f'</linearGradient>'
    f'<linearGradient id="botshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0.7"/>'
    f'</linearGradient>'
    '</defs>'
)


def hero_overlay_svg(t: float) -> str:
    """SVG overlay for 0-10s. Composited over the Omni frame.

    Layout:
      top-shade band (gradient) — for the eyebrow chip
      eyebrow chip at y=360       "MODCON AGARTHA · CURATED · THE GREEN TEAM"
      bottom-shade band (gradient) — for the hook typewriter
      hook headline at y=1240-1400 — types in across 2-7s
      italic gold subtitle at y=1450 — types in at 7-9s
    """
    parts = [DEFS]

    # Top shade band so the chip reads against bright sky
    parts.append(f'<rect width="{W}" height="380" fill="url(#topshade)"/>')

    # Editorial eyebrow chip — fades up at 0.5s
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

    # Bottom shade band for the hook (only after t=2s when hook starts)
    if t > 1.5:
        shade_op = ease_out_cubic(clamp((t - 1.5) / 0.5))
        # Draw bottom gradient at higher strength
        parts.append(
            f'<rect x="0" y="{H-600}" width="{W}" height="600" '
            f'fill="url(#botshade)" opacity="{shade_op:.3f}"/>'
        )

    # Hook typewriter — reveals across 2.0 → 6.5s
    # Sync to Omni voice "Forests don't stay by accident."
    # Line 1 reveals 2.0 → 4.5, Line 2 reveals 4.5 → 6.5
    hook_y = 1280
    line1_p = ease_out_cubic(clamp((t - 2.0) / 2.5))
    line2_p = ease_out_cubic(clamp((t - 4.5) / 2.0))

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

    # Gold rule that draws in across 6.3 → 7.0s
    rule_p = clamp((t - 6.3) / 0.7)
    if rule_p > 0.001:
        rw = rule_p * 180
        parts.append(
            f'<line x1="{CX - rw/2:.0f}" y1="{hook_y+165}" '
            f'x2="{CX + rw/2:.0f}" y2="{hook_y+165}" '
            f'stroke="{GT_GOLD}" stroke-width="2"/>'
        )

    # Italic gold subtitle — reveals 7.0 → 8.5s ("they're curated.")
    sub_p = ease_out_cubic(clamp((t - 7.0) / 1.5))
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

    return svg_wrap("".join(parts))


def render_hero_frame(i: int) -> Image.Image:
    """Composite Omni frame i with the hero typography overlay."""
    t = i / FPS
    # Load the corresponding Omni frame
    omni_idx = min(i, HERO_FRAMES - 1)
    omni_path = OMNI_FRAMES_DIR / f"o{omni_idx+1:05d}.jpg"
    base = Image.open(omni_path).convert("RGB").convert("RGBA")
    # Overlay the typography
    overlay = svg_to_pil(hero_overlay_svg(t))
    base.alpha_composite(overlay)
    return base.convert("RGB")


# ─── BRAND OVERLAY (10-25s) — full scenes on ink ────────────────────────
def render_brand_frame(i: int) -> Image.Image:
    """t∈[10, 25). Renders full scene on ink (no Omni footage here)."""
    t = i / FPS
    bt = t - HERO_S  # 0 → 15

    # Hard ink background
    ink_color = (14, 20, 8)
    base = Image.new("RGB", (W, H), ink_color)

    if bt < (B_STAT_END - HERO_S):
        # 10-13s — STAT STROBE on ink
        sub_t = bt
        chunk = (B_STAT_END - HERO_S) / 3.0
        idx = min(2, int(sub_t / chunk))
        chunk_t = sub_t - idx * chunk
        flash = max(0.0, math.exp(-chunk_t / 0.06) * (1.0 if chunk_t < 0.20 else 0.0))
        flash_alpha = flash * 0.50
        label, value, sublabel = SPECS[idx]
        dots = "".join(
            f'<circle cx="{j*22}" cy="18" r="5" '
            f'fill="{GT_GOLD if j == idx else "#3a4a2c"}"/>'
            for j in range(3)
        )
        svg = svg_wrap(
            DEFS
            # Eyebrow held over from hero
            + f'<g transform="translate(80,330)">'
            f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
            f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
            f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
            f'MODCON AGARTHA</text>'
            f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
            f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
            f'CURATED · THE GREEN TEAM</text>'
            f'</g>'
            # Progress dots top-right
            + f'<g transform="translate({W - 200},330)">'
            f'<text x="0" y="-4" font-family="{FONT_MONO}" font-size="16" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">'
            f'SPEC {idx + 1:02d} / 03</text>'
            f'{dots}'
            f'</g>'
            # Spec card content
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
        ov = svg_to_pil(svg)
        out = base.convert("RGBA")
        out.alpha_composite(ov)
        return out.convert("RGB")

    elif bt < (B_REVEAL_END - HERO_S):
        # 13-18s — AGARTHA brand reveal
        u = (bt - (B_STAT_END - HERO_S)) / ((B_REVEAL_END - B_STAT_END))  # 0..1
        modcon_op = ease_out_cubic(clamp((u - 0.05) / 0.40))
        pname_p = ease_out_cubic(clamp((u - 0.40) / 0.30))
        pname_visible_n = int(round(pname_p * len(PROPERTY_NAME)))
        pname_shown = PROPERTY_NAME[:pname_visible_n]
        rule_w = clamp((u - 0.55) / 0.18) * 320
        tag_p = ease_out_cubic(clamp((u - 0.70) / 0.25))
        svg = svg_wrap(
            DEFS
            + modcon_logo_svg(CX, 800, 340, opacity=modcon_op)
            + f'<text x="{CX}" y="1100" font-family="{FONT_DISPLAY}" font-size="140" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="14" '
            f'text-anchor="middle">{pname_shown}</text>'
            + f'<line x1="{CX - rule_w/2:.0f}" y1="1140" '
            f'x2="{CX + rule_w/2:.0f}" y2="1140" stroke="{GT_GOLD}" '
            f'stroke-width="2.5"/>'
            + (f'<defs><clipPath id="agtag">'
               f'<rect x="{CX-350:.0f}" y="1220" width="{tag_p * 700:.0f}" height="100"/>'
               f'</clipPath></defs>'
               f'<g clip-path="url(#agtag)">'
               f'<text x="{CX}" y="1300" font-family="{FONT_SERIF}" '
               f'font-size="68" font-style="italic" '
               f'fill="url(#goldHL)" font-weight="400" '
               f'text-anchor="middle">{TAGLINE_MAIN}</text>'
               f'</g>' if tag_p > 0.001 else '')
        )
        ov = svg_to_pil(svg)
        out = base.convert("RGBA")
        out.alpha_composite(ov)
        return out.convert("RGB")

    elif bt < (B_PRESENT_END - HERO_S):
        # 18-22s — PRESENTED BY THE GREEN TEAM
        u = (bt - (B_REVEAL_END - HERO_S)) / ((B_PRESENT_END - B_REVEAL_END))  # 0..1
        # Hold AGARTHA reveal at the TOP (compressed)
        modcon_y = 480
        agartha_y = 720
        rule_y = 760
        tag_y = 860
        # Dividing rule animates
        div_rule_w = ease_out_cubic(clamp((u - 0.05) / 0.15)) * 280
        # PRESENTED BY caption
        pb_caption_p = ease_out_cubic(clamp((u - 0.05) / 0.15))
        # Leaf stroke draws in
        pb_leaf_draw = ease_out_cubic(clamp((u - 0.15) / 0.30))
        pb_leaf_fill = ease_out_cubic(clamp((u - 0.32) / 0.25))
        # THE GREEN TEAM wordmark
        pb_wordmark_p = ease_out_cubic(clamp((u - 0.40) / 0.30))
        wordmark = "THE GREEN TEAM"
        wm_visible_n = int(round(pb_wordmark_p * len(wordmark)))
        wm_shown = wordmark[:wm_visible_n]
        pb_channel_p = ease_out_cubic(clamp((u - 0.70) / 0.20))

        parts = [DEFS]
        # AGARTHA block compressed at top
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
        # Gold dividing rule
        parts.append(
            f'<line x1="{CX - div_rule_w/2:.0f}" y1="990" '
            f'x2="{CX + div_rule_w/2:.0f}" y2="990" '
            f'stroke="{GT_GOLD}" stroke-width="2" opacity="0.7"/>'
        )
        # PRESENTED BY caption
        if pb_caption_p > 0.001:
            parts.append(
                f'<text x="{CX}" y="1050" font-family="{FONT_MONO}" font-size="18" '
                f'fill="{PAPER}" opacity="{pb_caption_p * 0.85:.3f}" '
                f'letter-spacing="6" font-weight="600" text-anchor="middle">'
                f'PRESENTED BY</text>'
            )
        # Green Team LEAF stroke-draws in
        parts.append(leaf_logo_svg(CX, 1200, 180, pb_leaf_draw, pb_leaf_fill))
        # THE GREEN TEAM wordmark
        if wm_shown:
            parts.append(
                f'<text x="{CX}" y="1340" font-family="{FONT_DISPLAY}" font-size="50" '
                f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
                f'text-anchor="middle">{wm_shown}</text>'
            )
        # CHANNEL PARTNER
        if pb_channel_p > 0.001:
            parts.append(
                f'<text x="{CX}" y="1380" font-family="{FONT_MONO}" font-size="14" '
                f'fill="{GT_GOLD}" opacity="{pb_channel_p:.3f}" letter-spacing="6" '
                f'font-weight="600" text-anchor="middle">CHANNEL PARTNER</text>'
            )
        svg = svg_wrap("".join(parts))
        ov = svg_to_pil(svg)
        out = base.convert("RGBA")
        out.alpha_composite(ov)
        return out.convert("RGB")

    else:
        # 22-25s — CTA close + cinema bars
        u = (bt - (B_PRESENT_END - HERO_S)) / (TOTAL_S - B_PRESENT_END)  # 0..1
        bar_h = int(90 * ease_out_cubic(clamp(u / 0.40)))
        cta_progress = ease_out_cubic(clamp(u / 0.40))
        sig_progress = ease_out_cubic(clamp((u - 0.20) / 0.40))
        cta_t = bt - (BRAND_S - 2.0)
        cta_blink = (
            0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 5.5))
            if cta_t > 0 else 0.55
        )

        parts = [DEFS]
        # Held AGARTHA at top
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
        # Held PRESENTED BY block
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
        # CTA fades in
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
        # URL
        parts.append(
            f'<text x="{CX}" y="1650" font-family="{FONT_MONO}" font-size="22" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
            f'text-anchor="middle" opacity="{sig_progress:.3f}">thegreenteam.in</text>'
        )
        # Cinema bars
        parts.append(f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>')
        parts.append(f'<rect x="0" y="{H-bar_h}" width="{W}" height="{bar_h}" fill="#000"/>')

        svg = svg_wrap("".join(parts))
        ov = svg_to_pil(svg)
        out = base.convert("RGBA")
        out.alpha_composite(ov)
        return out.convert("RGB")


# ─── POSTER ─────────────────────────────────────────────────────────────
def build_poster():
    """Static 1080×1920 poster — uses Omni's most cinematic frame as backdrop."""
    # Use the property-reveal frame (~9.5s in source = ~570 in extracted 60fps)
    omni_idx = min(int(9.5 * FPS), HERO_FRAMES - 1)
    omni_path = OMNI_FRAMES_DIR / f"o{omni_idx+1:05d}.jpg"
    base = Image.open(omni_path).convert("RGB")
    # Heavy darken for the bottom 60% so brand block reads
    import numpy as np
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
        # Eyebrow
        + f'<g transform="translate(80,330)">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text></g>'
        # Hook
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
        # MODCON + AGARTHA brand mark
        + modcon_logo_svg(CX, 1340, 260, opacity=1.0)
        + f'<text x="{CX}" y="1500" font-family="{FONT_DISPLAY}" font-size="100" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="10" '
        f'text-anchor="middle">{PROPERTY_NAME}</text>'
        + f'<line x1="{CX-130}" y1="1540" x2="{CX+130}" y2="1540" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        # Presented by
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
    print(f"[gt-agartha-omni] {N_FRAMES} frames @ {FPS}fps · {TOTAL_S}s")

    # Step 1: extract Omni frames
    extract_omni_frames()

    # Step 2: build poster
    build_poster()

    # Step 3: render every frame
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()

    t0 = time.time()
    for i in range(N_FRAMES):
        if i < HERO_FRAMES:
            frame = render_hero_frame(i)
        else:
            frame = render_brand_frame(i)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time() - t0:.0f}s")

    # Step 4: replace first 30 frames with poster (gallery thumbnail trick)
    for i in range(30):
        target = FRAMES_DIR / f"f{i:05d}.jpg"
        Image.open(POSTER_JPG).save(target, "JPEG", quality=92)

    # Step 5: mux video + audio. Audio is a crossfade of Omni's native
    # audio (voice + music, 0-10s) into mrclaps_fashion (8-25s).
    # The complex audio filter does:
    #   [1:a]: trim Omni to 10s, fade out last 2s (starting at 8s)
    #   [2:a]: trim music to ~17s, delay 8s, fade in 8-10s, fade out 23-25s
    #   amix: combine the two

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
            "[2:a]atrim=0:17,asetpts=PTS-STARTPTS,adelay=8000|8000,"
            "afade=t=in:st=8:d=2,afade=t=out:st=23:d=2[music];"
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
