"""
GT-AGARTHA-VILLA-TOUR — production-grade brand layers over a Gemini-Omni
generated villa-tour clip (no voice-over, nature sounds only).

Source:  a23ee698-gemini_generated_video_42cfb641.mp4
           720×1280 · 24fps · 10.005s · h264+aac · Gemini sparkle bottom-right

What this script does:
  1. ffmpeg extract source frames at 60fps, scaled to 1080×1920, with the
     Gemini sparkle delogo'd out.
  2. For each frame, composite a brand-overlay SVG (rendered via cairosvg
     → Pillow alpha_composite) that walks through these phases:

         0.0 – 1.0s   fade-up from black, editorial chip fades in
         1.0 – 3.5s   chip held + hook line typewriter
                        "AT THE EDGE OF / THE NARSAPUR FOREST."
         3.5 – 5.5s   stat strip slides in bottom-left
                        "25 ACRES · AQI 12 · 40 MIN TO FD"
         5.5 – 7.5s   italic gold tagline mask reveal
                        "forest-edge sanctuary."
         7.5 – 10.0s  AGARTHA brand reveal — wordmark types in
                        bottom band, MODCON wordmark above, Green Team
                        leaf + URL below, slim cinema bars animate in.

  3. ffmpeg encode prod (CRF 18) + mobile (CRF 24), mux original Gemini
     audio (nature sounds, no voice-over) back in.

Output:
  out/agartha-villa-tour-60fps.mp4   production
  out/agartha-villa-tour-mobile.mp4  mobile
  out/agartha-villa-tour-poster.jpg  1080×1920 channel-poster cover
"""
from __future__ import annotations

import io
import math
import subprocess
import sys
import time
from pathlib import Path

import cairosvg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))
REPO = ROOT.parent.parent

# ─── INPUT / OUTPUT ─────────────────────────────────────────────────────
GEMINI_SRC = Path(
    "/root/.claude/uploads/5ca808e9-9b24-5b7d-ba58-dfc5e2b3b74b/"
    "a23ee698-gemini_generated_video_42cfb641.mp4"
)
OUT_DIR = REPO / "out"
FRAMES_DIR = OUT_DIR / "frames_gt-agartha-villa-tour"
GEMINI_FRAMES_DIR = OUT_DIR / "_gem_extracted_villa"
FINAL_MP4 = OUT_DIR / "agartha-villa-tour-60fps.mp4"
MOBILE_MP4 = OUT_DIR / "agartha-villa-tour-mobile.mp4"
POSTER_JPG = OUT_DIR / "agartha-villa-tour-poster.jpg"

# ─── TIMING ─────────────────────────────────────────────────────────────
W, H = 1080, 1920
CX = W // 2
FPS = 60
TOTAL_S = 10.0
N_FRAMES = int(TOTAL_S * FPS)  # 600

# Phase boundaries (seconds)
P_CHIP_IN_END = 1.0
P_HOOK_END    = 3.5
P_STATS_END   = 5.5
P_TAG_END     = 7.5
# brand reveal: 7.5 → 10.0

# ─── PALETTE / FONTS ────────────────────────────────────────────────────
INK          = "#0e1408"
PAPER        = "#faf9f6"
GT_SAGE      = "#a3b18a"
GT_GOLD      = "#c8a951"
GT_GOLD_DEEP = "#a88a39"

FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"

# ─── CONTENT BRIEF ──────────────────────────────────────────────────────
PROPERTY_NAME = "AGARTHA"
TAGLINE_MAIN  = "forest-edge sanctuary."
DEVELOPER_LINE = "BY MODCON BUILDERS"
CHANNEL_PARTNER_LINE = "CURATED BY THE GREEN TEAM  ·  CHANNEL PARTNER"

HOOK_LINE_1 = "AT THE EDGE OF"
HOOK_LINE_2 = "THE NARSAPUR FOREST."

STAT_LINE = "25 ACRES  ·  AQI 12  ·  40 MIN TO FD"

# ─── EASING ─────────────────────────────────────────────────────────────
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def ease_in_out(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)

def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3

def norm(t, t0, t1):
    if t1 <= t0:
        return 0.0 if t < t0 else 1.0
    return clamp((t - t0) / (t1 - t0))

# ─── MODCON SVG (developer mark, embedded inline at brand reveal) ───────
def _load_modcon_inner() -> str:
    raw = (REPO / "public" / "logos" / "modcon-logo.svg").read_text()
    start = raw.index(">", raw.index("<svg")) + 1
    end = raw.rindex("</svg>")
    return raw[start:end]

MODCON_VIEWBOX_W = 646.65
MODCON_VIEWBOX_H = 288.10
MODCON_INNER = _load_modcon_inner()

def modcon_logo_svg(cx: int, cy: int, target_w: int, opacity: float = 1.0) -> str:
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

# Green Team leaf logo (used small as channel-partner mark in close)
LEAF_DIM   = "M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z"
LEAF_LIGHT = "M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z"
LEAF_LINE  = "M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62"

def leaf_static_svg(cx: int, cy: int, size: int, opacity: float = 1.0) -> str:
    if opacity <= 0.001:
        return ""
    half = size / 2
    scale = size / 100
    return (
        f'<g transform="translate({cx-half:.1f},{cy-half:.1f}) scale({scale:.4f})" '
        f'opacity="{opacity:.3f}">'
        f'<path d="{LEAF_DIM}" fill="{PAPER}" opacity="0.35"/>'
        f'<path d="{LEAF_LIGHT}" fill="{PAPER}" opacity="1.0"/>'
        f'<path d="{LEAF_LINE}" fill="none" stroke="{PAPER}" '
        f'stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>'
        f'</g>'
    )

# ─── SVG WRAP + DEFS ────────────────────────────────────────────────────
DEFS = (
    '<defs>'
    f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
    f'<stop offset="0" stop-color="{GT_GOLD}"/>'
    f'<stop offset="0.55" stop-color="#e6ce85"/>'
    f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
    f'</linearGradient>'
    f'<linearGradient id="topshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0.55"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0"/>'
    f'</linearGradient>'
    f'<linearGradient id="botshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0.75"/>'
    f'</linearGradient>'
    '</defs>'
)

def svg_wrap(content: str) -> str:
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">{content}</svg>'
    )

def svg_to_pil(svg_str: str) -> Image.Image:
    png = cairosvg.svg2png(bytestring=svg_str.encode("utf-8"),
                           output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGBA")

# ─── STEP 1: extract Gemini frames (delogo + scale + 60fps) ─────────────
def extract_gemini_frames():
    GEMINI_FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for f in GEMINI_FRAMES_DIR.glob("*.jpg"):
        f.unlink()
    # Source 720×1280, Gemini sparkle observed in bottom-right ~x=460 y=1130
    # span ~260x140 to fully cover it across frames where the sparkle drifts.
    cmd = [
        "ffmpeg", "-y", "-i", str(GEMINI_SRC),
        "-vf", f"delogo=x=455:y=1115:w=255:h=140,scale={W}:{H}:flags=lanczos,fps={FPS}",
        "-an", "-q:v", "2",
        str(GEMINI_FRAMES_DIR / "g%05d.jpg"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    n = len(list(GEMINI_FRAMES_DIR.glob("*.jpg")))
    print(f"[gemini] extracted {n} frames")
    return n

# ─── OVERLAY BUILDERS ───────────────────────────────────────────────────
def chip_svg(opacity: float) -> str:
    if opacity <= 0.001:
        return ""
    return (
        f'<g transform="translate(80,260)" opacity="{opacity:.3f}">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
        f'MODCON AGARTHA</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
        f'CURATED · THE GREEN TEAM</text>'
        f'</g>'
    )

def render_frame(i: int) -> Image.Image:
    t = i / FPS

    # Load Gemini frame
    src_path = GEMINI_FRAMES_DIR / f"g{i+1:05d}.jpg"
    if not src_path.exists():
        last = sorted(GEMINI_FRAMES_DIR.glob("*.jpg"))[-1]
        src_path = last
    base = Image.open(src_path).convert("RGBA")

    parts = [DEFS]
    # Top shade band (subtle, helps chip read)
    parts.append(f'<rect width="{W}" height="380" fill="url(#topshade)"/>')

    # ── Phase: chip fade-up
    chip_op = ease_out_cubic(clamp((t - 0.2) / 0.7))
    parts.append(chip_svg(chip_op))

    # Open fade-up from black for first 0.5s
    fade_in_op = clamp(t / 0.5)  # 0 → 1
    if fade_in_op < 1.0:
        parts.append(
            f'<rect width="{W}" height="{H}" fill="{INK}" '
            f'opacity="{1.0 - fade_in_op:.3f}"/>'
        )

    # ── Phase: HOOK (1.0 → 3.5s)
    if t < P_HOOK_END + 0.1:
        # Bottom shade for hook
        if t > 0.9:
            shade_op = ease_out_cubic(clamp((t - 0.9) / 0.6))
            parts.append(
                f'<rect x="0" y="{H-560}" width="{W}" height="560" '
                f'fill="url(#botshade)" opacity="{shade_op:.3f}"/>'
            )
        hook_y = 1380
        # line1 reveals 1.0 → 2.1, line2 reveals 2.1 → 3.2
        l1 = ease_out_cubic(clamp((t - 1.0) / 1.1))
        l2 = ease_out_cubic(clamp((t - 2.1) / 1.1))
        v1 = int(round(l1 * len(HOOK_LINE_1)))
        v2 = int(round(l2 * len(HOOK_LINE_2)))
        line1 = HOOK_LINE_1[:v1]
        line2 = HOOK_LINE_2[:v2]
        # Hook stays on until it slides out at 3.5s
        hook_alpha = 1.0 - ease_in_out(clamp((t - P_HOOK_END) / 0.2))
        if line1:
            parts.append(
                f'<text x="{CX}" y="{hook_y}" font-family="{FONT_DISPLAY}" '
                f'font-size="64" fill="{PAPER}" font-weight="800" '
                f'letter-spacing="-1.5" text-anchor="middle" '
                f'opacity="{hook_alpha:.3f}">{line1}</text>'
            )
        if line2:
            parts.append(
                f'<text x="{CX}" y="{hook_y+80}" font-family="{FONT_DISPLAY}" '
                f'font-size="64" fill="{PAPER}" font-weight="800" '
                f'letter-spacing="-1.5" text-anchor="middle" '
                f'opacity="{hook_alpha:.3f}">{line2}</text>'
            )

    # ── Phase: STATS (3.5 → 5.5s)
    if P_HOOK_END - 0.1 < t < P_STATS_END + 0.1:
        # Slide in from left, fade out at end
        u_in = ease_out_cubic(clamp((t - P_HOOK_END) / 0.5))
        u_out = ease_in_out(clamp((t - (P_STATS_END - 0.4)) / 0.4))
        op = u_in * (1.0 - u_out)
        dx = (1 - u_in) * -180

        # Bottom shade for stats
        parts.append(
            f'<rect x="0" y="{H-460}" width="{W}" height="460" '
            f'fill="url(#botshade)" opacity="{op * 0.85:.3f}"/>'
        )
        parts.append(
            f'<g transform="translate({80 + dx:.0f},1500)" opacity="{op:.3f}">'
            f'<rect x="0" y="-30" width="4" height="120" fill="{GT_GOLD}"/>'
            f'<text x="20" y="-2" font-family="{FONT_MONO}" font-size="16" '
            f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">'
            f'NARSAPUR FOREST  ·  TELANGANA</text>'
            f'<text x="20" y="50" font-family="{FONT_DISPLAY}" font-size="40" '
            f'fill="{PAPER}" font-weight="800" letter-spacing="-0.5">'
            f'25 ACRES  ·  AQI 12</text>'
            f'<text x="20" y="84" font-family="{FONT_MONO}" font-size="16" '
            f'fill="{PAPER}" opacity="0.85" letter-spacing="3">'
            f'40 MIN TO FINANCIAL DISTRICT  ·  VIA THE RRR</text>'
            f'</g>'
        )

    # ── Phase: TAGLINE (5.5 → 7.5s) — italic gold "forest-edge sanctuary."
    if P_STATS_END - 0.1 < t < P_TAG_END + 0.1:
        u_in = ease_out_cubic(clamp((t - P_STATS_END) / 0.6))
        u_out = ease_in_out(clamp((t - (P_TAG_END - 0.3)) / 0.3))
        op = u_in * (1.0 - u_out)
        clip_w = u_in * 760
        # Bottom shade
        parts.append(
            f'<rect x="0" y="{H-380}" width="{W}" height="380" '
            f'fill="url(#botshade)" opacity="{op * 0.75:.3f}"/>'
        )
        parts.append(
            f'<defs><clipPath id="tgclip">'
            f'<rect x="{CX-380:.0f}" y="1500" width="{clip_w:.0f}" height="140"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#tgclip)">'
            f'<text x="{CX}" y="1600" font-family="{FONT_SERIF}" font-size="84" '
            f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
            f'text-anchor="middle">{TAGLINE_MAIN}</text>'
            f'</g>'
            # Thin gold rule under
            f'<line x1="{CX-180}" y1="1670" x2="{CX-180+360*u_in:.0f}" y2="1670" '
            f'stroke="{GT_GOLD}" stroke-width="2" opacity="{op:.3f}"/>'
        )

    # ── Phase: BRAND REVEAL (7.5 → 10.0s)
    if t > P_TAG_END - 0.1:
        u = clamp((t - P_TAG_END) / 2.0)  # 0..1 across 2s

        # Slim cinema bars animate in
        bar_h = int(70 * ease_out_cubic(clamp(u / 0.4)))

        # Bottom heavy shade for brand block
        parts.append(
            f'<rect x="0" y="{H-820}" width="{W}" height="820" '
            f'fill="url(#botshade)" opacity="{min(1.0, u*2.0):.3f}"/>'
        )

        # MODCON logo
        modcon_op = ease_out_cubic(clamp((u - 0.05) / 0.35))
        if modcon_op > 0.01:
            parts.append(modcon_logo_svg(CX, 1180, 260, opacity=modcon_op))

        # AGARTHA wordmark
        ap = ease_out_cubic(clamp((u - 0.30) / 0.30))
        nshown = int(round(ap * len(PROPERTY_NAME)))
        pname = PROPERTY_NAME[:nshown]
        if pname:
            parts.append(
                f'<text x="{CX}" y="1370" font-family="{FONT_DISPLAY}" '
                f'font-size="110" fill="{PAPER}" font-weight="800" '
                f'letter-spacing="12" text-anchor="middle">{pname}</text>'
            )
        # Gold rule under AGARTHA
        rw = clamp((u - 0.50) / 0.18) * 280
        if rw > 2:
            parts.append(
                f'<line x1="{CX - rw/2:.0f}" y1="1405" '
                f'x2="{CX + rw/2:.0f}" y2="1405" '
                f'stroke="{GT_GOLD}" stroke-width="2"/>'
            )

        # Channel partner sig — small leaf + CURATED line + URL
        sig_op = ease_out_cubic(clamp((u - 0.55) / 0.30))
        if sig_op > 0.01:
            parts.append(leaf_static_svg(CX, 1490, 56, sig_op))
            parts.append(
                f'<text x="{CX}" y="1560" font-family="{FONT_MONO}" font-size="15" '
                f'fill="{PAPER}" opacity="{sig_op * 0.85:.3f}" letter-spacing="3" '
                f'text-anchor="middle">{CHANNEL_PARTNER_LINE}</text>'
            )
            parts.append(
                f'<text x="{CX}" y="1610" font-family="{FONT_MONO}" font-size="22" '
                f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
                f'text-anchor="middle" opacity="{sig_op:.3f}">thegreenteam.in</text>'
            )

        # Cinema bars on top
        parts.append(f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>')
        parts.append(f'<rect x="0" y="{H-bar_h}" width="{W}" height="{bar_h}" fill="#000"/>')

    svg = svg_wrap("".join(parts))
    overlay = svg_to_pil(svg)
    base.alpha_composite(overlay)
    return base.convert("RGB")

# ─── POSTER ─────────────────────────────────────────────────────────────
def build_poster():
    # Use a strong mid-tour frame as the poster backdrop
    src_path = GEMINI_FRAMES_DIR / f"g{int(4.0*FPS):05d}.jpg"
    if not src_path.exists():
        src_path = sorted(GEMINI_FRAMES_DIR.glob("*.jpg"))[-1]
    base = Image.open(src_path).convert("RGB")

    # Heavy bottom darken for brand block
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        u = max(0.0, (y - H * 0.40) / (H * 0.40))
        u = min(1.0, u)
        arr[y, :, 3] = int(255 * 0.80 * u ** 1.3)
    overlay = Image.fromarray(arr, 'RGBA')
    rgba = base.convert("RGBA")
    rgba.alpha_composite(overlay)
    base = rgba.convert("RGB")

    svg = svg_wrap(
        DEFS
        + chip_svg(1.0)
        # Hook
        + f'<text x="{CX}" y="1090" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-1.5" '
        f'text-anchor="middle">AT THE EDGE OF</text>'
        + f'<text x="{CX}" y="1170" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-1.5" '
        f'text-anchor="middle">THE NARSAPUR FOREST.</text>'
        + f'<text x="{CX}" y="1255" font-family="{FONT_SERIF}" font-size="48" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">forest-edge sanctuary.</text>'
        # MODCON + AGARTHA
        + modcon_logo_svg(CX, 1430, 240, opacity=1.0)
        + f'<text x="{CX}" y="1580" font-family="{FONT_DISPLAY}" font-size="96" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="12" '
        f'text-anchor="middle">AGARTHA</text>'
        + f'<line x1="{CX-130}" y1="1620" x2="{CX+130}" y2="1620" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        # Sig
        + leaf_static_svg(CX, 1700, 50, 1.0)
        + f'<text x="{CX}" y="1770" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="3" '
        f'text-anchor="middle">{CHANNEL_PARTNER_LINE}</text>'
        + f'<text x="{CX}" y="1820" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
    )
    ov = svg_to_pil(svg)
    rgba = base.convert("RGBA")
    rgba.alpha_composite(ov)
    rgba.convert("RGB").save(POSTER_JPG, "JPEG", quality=92,
                              optimize=True, progressive=True)
    print(f"[poster] {POSTER_JPG.name}  {POSTER_JPG.stat().st_size // 1024} KB")

# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()

    print(f"[gt-agartha-villa-tour] {N_FRAMES} frames · {TOTAL_S}s @ {FPS}fps")
    extract_gemini_frames()
    build_poster()

    t0 = time.time()
    for i in range(N_FRAMES):
        frame = render_frame(i)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time() - t0:.0f}s")

    # Replace first 30 frames with poster (gallery thumbnail behavior)
    for i in range(30):
        Image.open(POSTER_JPG).save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)

    # Mux with original Gemini audio (nature sounds only — no VO).
    for label, crf, audio_kb, out_path in (
        ("prod",   18, 192, FINAL_MP4),
        ("mobile", 24,  96, MOBILE_MP4),
    ):
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(FPS),
            "-i", str(FRAMES_DIR / "f%05d.jpg"),
            "-i", str(GEMINI_SRC),       # original audio source
            "-i", str(POSTER_JPG),       # attached cover art
            "-map", "0:v:0", "-map", "1:a:0", "-map", "2:v:0",
            "-af", f"afade=t=out:st={TOTAL_S-0.6:.2f}:d=0.6",
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
