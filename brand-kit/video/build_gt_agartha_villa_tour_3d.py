"""
GT-AGARTHA-VILLA-TOUR-3D — depth-aware brand layers over TWO Gemini clips

Clip A (portrait, exterior tour):
    /root/.claude/uploads/.../a23ee698-gemini_generated_video_42cfb641.mp4
    720×1280 · 24fps · 10.005s · Gemini sparkle bottom-right

Clip B (landscape, interior glimpse + sunset):
    /root/.claude/uploads/.../706794c4-gemini_generated_video_c0c6b991.mp4
    1280×720 · 24fps · 10.005s · center-cropped to 9:16 (405×720 → 1080×1920)

Output timeline (12.0s @ 60fps):
    0.0 –  3.0s   Clip B, daytime interior-glimpse through doors
    3.0 –  8.0s   Clip A, portrait exterior tour
    8.0 – 12.0s   Clip B, sunset glow w/ lit pendant lanterns inside
                  (the brand reveal lands here — most cinematic moment)

Each frame goes through depth-aware 3D layering:
    [0] source frame                       (full BG)
    [1] BEHIND-villa caption                 (text covers everything)
    [2] villa cut-out re-pasted              (building "eats" behind text)
    [3] FRONT-villa caption                  (chip / stats / brand on top)
    [4] Green Team leaf badge                (covers ex-Gemini sparkle)
    [5] cinema bars (last ~2s)

Audio: clip B 0–3s → clip A 0–5s → clip B 6–10s, small crossfades at
both cut points, 0.6s fade-out tail.

Output:
    out/agartha-villa-tour-3d-60fps.mp4   production CRF 18
    out/agartha-villa-tour-3d-mobile.mp4  mobile CRF 24
    out/agartha-villa-tour-3d-poster.jpg  channel-poster
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

# ─── INPUTS ─────────────────────────────────────────────────────────────
CLIP_A = Path(  # portrait, exterior tour
    "/root/.claude/uploads/5ca808e9-9b24-5b7d-ba58-dfc5e2b3b74b/"
    "a23ee698-gemini_generated_video_42cfb641.mp4"
)
CLIP_B = Path(  # landscape, interior + sunset
    "/root/.claude/uploads/5ca808e9-9b24-5b7d-ba58-dfc5e2b3b74b/"
    "706794c4-gemini_generated_video_c0c6b991.mp4"
)

OUT_DIR = REPO / "out"
FRAMES_DIR = OUT_DIR / "frames_gt-agartha-villa-tour-3d"
A_FRAMES = OUT_DIR / "_gemA_extracted"   # 720x1280 → 1080x1920
B_FRAMES = OUT_DIR / "_gemB_extracted"   # 1280x720 center-crop → 1080x1920
MATTE_A  = OUT_DIR / "_matte_A"
MATTE_B  = OUT_DIR / "_matte_B"
FINAL_MP4 = OUT_DIR / "agartha-villa-tour-3d-60fps.mp4"
MOBILE_MP4 = OUT_DIR / "agartha-villa-tour-3d-mobile.mp4"
POSTER_JPG = OUT_DIR / "agartha-villa-tour-3d-poster.jpg"

# ─── TIMING ─────────────────────────────────────────────────────────────
W, H = 1080, 1920
CX = W // 2
FPS = 60
SRC_FPS = 24
TOTAL_S = 12.0
N_FRAMES = int(TOTAL_S * FPS)            # 720

# Cut points (in output time)
CUT_B_TO_A_S = 3.0   # 3.0s output → switch to clip A
CUT_A_TO_B_S = 8.0   # 8.0s output → switch back to clip B

# Within each clip, where each section starts (clip-local time)
A_OFFSET = 0.0       # 0..5s of clip A used → mapped to 3..8s of output
B_OFFSET_OPEN = 0.0  # 0..3s of clip B used → mapped to 0..3s of output
B_OFFSET_CLOSE = 6.0 # 6..10s of clip B → mapped to 8..12s of output

# Caption phase boundaries (in OUTPUT time)
P_CHIP_IN_END = 1.0
P_HOOK_END    = 4.5      # hook BEHIND-villa across clip B→A handoff
P_STATS_END   = 6.7      # stats sit over Clip A exterior tour
P_TAG_END     = 8.5      # tagline floats on the cut to sunset
# brand reveal:  8.5 → 12.0  (lands on sunset glow w/ lanterns)

# ─── PALETTE / FONTS ────────────────────────────────────────────────────
INK          = "#0e1408"
PAPER        = "#faf9f6"
GT_SAGE      = "#a3b18a"
GT_GOLD      = "#c8a951"
GT_GOLD_DEEP = "#a88a39"

FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"

# ─── CONTENT ────────────────────────────────────────────────────────────
PROPERTY_NAME = "AGARTHA"
TAGLINE_MAIN  = "forest-edge sanctuary."
CHANNEL_PARTNER_LINE = "CURATED BY THE GREEN TEAM  ·  CHANNEL PARTNER"
HOOK_LINE_1 = "AT THE EDGE OF"
HOOK_LINE_2 = "THE NARSAPUR FOREST."

LEAF_DIM   = "M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z"
LEAF_LIGHT = "M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z"
LEAF_LINE  = "M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62"

# ─── EASING ─────────────────────────────────────────────────────────────
def clamp(x, lo=0.0, hi=1.0): return max(lo, min(hi, x))
def ease_in_out(t):
    t = clamp(t); return t * t * (3 - 2 * t)
def ease_out_cubic(t):
    t = clamp(t); return 1 - (1 - t) ** 3

# ─── SVG WRAP ───────────────────────────────────────────────────────────
DEFS = (
    '<defs>'
    f'<linearGradient id="goldHL" x1="0" y1="0" x2="1" y2="0">'
    f'<stop offset="0" stop-color="{GT_GOLD}"/>'
    f'<stop offset="0.55" stop-color="#e6ce85"/>'
    f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
    f'</linearGradient>'
    f'<linearGradient id="topshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0.45"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0"/>'
    f'</linearGradient>'
    f'<linearGradient id="botshade" x1="0" y1="0" x2="0" y2="1">'
    f'<stop offset="0" stop-color="{INK}" stop-opacity="0"/>'
    f'<stop offset="1" stop-color="{INK}" stop-opacity="0.7"/>'
    f'</linearGradient>'
    '</defs>'
)

def svg_wrap(content: str) -> str:
    return (f'<?xml version="1.0" encoding="UTF-8"?>'
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
            f'viewBox="0 0 {W} {H}">{content}</svg>')

def svg_to_pil(svg_str: str) -> Image.Image:
    if not svg_str.strip().endswith("</svg>"):
        svg_str = svg_wrap(svg_str)
    png = cairosvg.svg2png(bytestring=svg_str.encode("utf-8"),
                           output_width=W, output_height=H)
    return Image.open(io.BytesIO(png)).convert("RGBA")

# ─── MODCON SVG ─────────────────────────────────────────────────────────
def _load_modcon_inner() -> str:
    raw = (REPO / "public" / "logos" / "modcon-logo.svg").read_text()
    start = raw.index(">", raw.index("<svg")) + 1
    end = raw.rindex("</svg>")
    return raw[start:end]

MODCON_INNER = _load_modcon_inner()
MODCON_VBW, MODCON_VBH = 646.65, 288.10

def modcon_svg(cx: int, cy: int, w: int, opacity: float = 1.0) -> str:
    if opacity <= 0.001: return ""
    s = w / MODCON_VBW
    h = MODCON_VBH * s
    return (f'<g transform="translate({cx-w/2:.1f},{cy-h/2:.1f}) scale({s:.5f})" '
            f'opacity="{opacity:.3f}">{MODCON_INNER}</g>')

def leaf_svg(cx: int, cy: int, size: int, opacity: float = 1.0,
             halo: bool = False) -> str:
    if opacity <= 0.001: return ""
    half = size / 2
    scale = size / 100
    out = ""
    if halo:
        out += f'<circle cx="{cx}" cy="{cy}" r="{int(size*0.85)}" fill="{INK}" opacity="0.32"/>'
    out += (f'<g transform="translate({cx-half:.1f},{cy-half:.1f}) scale({scale:.4f})" '
            f'opacity="{opacity:.3f}">'
            f'<path d="{LEAF_DIM}" fill="{PAPER}" opacity="0.35"/>'
            f'<path d="{LEAF_LIGHT}" fill="{PAPER}" opacity="1.0"/>'
            f'<path d="{LEAF_LINE}" fill="none" stroke="{PAPER}" '
            f'stroke-width="1.2" stroke-linecap="round" opacity="0.4"/>'
            f'</g>')
    return out


# ─── EXTRACT ────────────────────────────────────────────────────────────
def extract_clip_a():
    A_FRAMES.mkdir(parents=True, exist_ok=True)
    for f in A_FRAMES.glob("*.jpg"):
        f.unlink()
    cmd = [
        "ffmpeg", "-y", "-i", str(CLIP_A),
        "-vf", f"scale={W}:{H}:flags=lanczos",
        "-an", "-q:v", "2",
        str(A_FRAMES / "a%05d.jpg"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[A] extracted {len(list(A_FRAMES.glob('*.jpg')))} frames")

def extract_clip_b():
    B_FRAMES.mkdir(parents=True, exist_ok=True)
    for f in B_FRAMES.glob("*.jpg"):
        f.unlink()
    # 1280x720 center crop to 405x720 (9:16), then upscale.
    cmd = [
        "ffmpeg", "-y", "-i", str(CLIP_B),
        "-vf", f"crop=405:720:437:0,scale={W}:{H}:flags=lanczos",
        "-an", "-q:v", "2",
        str(B_FRAMES / "b%05d.jpg"),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[B] extracted {len(list(B_FRAMES.glob('*.jpg')))} frames")


# ─── MATTE (rembg u2net) ────────────────────────────────────────────────
def matte_frames(src_dir: Path, dst_dir: Path, label: str,
                 frame_indices: list[int] | None = None):
    """frame_indices: 1-based source indices to matte. None = all."""
    dst_dir.mkdir(parents=True, exist_ok=True)
    src_frames = sorted(src_dir.glob("*.jpg"))
    if not src_frames:
        return
    if frame_indices is not None:
        wanted = {idx for idx in frame_indices if 1 <= idx <= len(src_frames)}
        candidates = [f for i, f in enumerate(src_frames, 1) if i in wanted]
    else:
        candidates = src_frames
    needed = []
    for f in candidates:
        out = dst_dir / (f.stem + ".png")
        if not out.exists():
            needed.append((f, out))
    if not needed:
        print(f"[matte-{label}] cached, skipping")
        return
    from rembg import remove, new_session
    session = new_session("u2net")
    print(f"[matte-{label}] u2net × {len(needed)} frames…")
    t0 = time.time()
    for i, (src, dst) in enumerate(needed):
        img = Image.open(src)
        out = remove(img, session=session, post_process_mask=True,
                     only_mask=True)
        out.save(dst, "PNG", optimize=False)
        if i and i % 30 == 0:
            r = (i + 1) / (time.time() - t0)
            eta = (len(needed) - i - 1) / r
            print(f"  matte-{label} {i+1}/{len(needed)} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[matte-{label}] done in {time.time() - t0:.0f}s")


# ─── TIMELINE MAPPING ───────────────────────────────────────────────────
def map_frame(i: int) -> tuple[Path, Path, str]:
    """Return (gemini_frame_path, matte_path, clip_label) for output frame i."""
    t = i / FPS
    if t < CUT_B_TO_A_S:
        # Clip B opener (0..3s of clip B)
        clip_t = B_OFFSET_OPEN + t
        idx = max(1, min(int(round(clip_t * SRC_FPS)) + 1,
                          len(list(B_FRAMES.glob("*.jpg")))))
        return (B_FRAMES / f"b{idx:05d}.jpg",
                MATTE_B / f"b{idx:05d}.png", "B")
    if t < CUT_A_TO_B_S:
        # Clip A (0..5s of clip A → 3..8s output)
        clip_t = A_OFFSET + (t - CUT_B_TO_A_S)
        idx = max(1, min(int(round(clip_t * SRC_FPS)) + 1,
                          len(list(A_FRAMES.glob("*.jpg")))))
        return (A_FRAMES / f"a{idx:05d}.jpg",
                MATTE_A / f"a{idx:05d}.png", "A")
    # Clip B closer (6..10s of clip B → 8..12s output)
    clip_t = B_OFFSET_CLOSE + (t - CUT_A_TO_B_S)
    idx = max(1, min(int(round(clip_t * SRC_FPS)) + 1,
                      len(list(B_FRAMES.glob("*.jpg")))))
    return (B_FRAMES / f"b{idx:05d}.jpg",
            MATTE_B / f"b{idx:05d}.png", "B")


def collect_needed_matte_indices():
    """Pre-compute which source frames need matting (only the ones the
    timeline actually uses)."""
    a_needed = set()
    b_needed = set()
    for i in range(N_FRAMES):
        t = i / FPS
        if t < CUT_B_TO_A_S:
            idx = max(1, int(round((B_OFFSET_OPEN + t) * SRC_FPS)) + 1)
            b_needed.add(idx)
        elif t < CUT_A_TO_B_S:
            idx = max(1, int(round((A_OFFSET + (t - CUT_B_TO_A_S)) * SRC_FPS)) + 1)
            a_needed.add(idx)
        else:
            idx = max(1, int(round((B_OFFSET_CLOSE + (t - CUT_A_TO_B_S)) * SRC_FPS)) + 1)
            b_needed.add(idx)
    return sorted(a_needed), sorted(b_needed)


# ─── OVERLAY BUILDERS ───────────────────────────────────────────────────
def chip_svg(opacity: float) -> str:
    if opacity <= 0.001: return ""
    return (f'<g transform="translate(80,260)" opacity="{opacity:.3f}">'
            f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
            f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
            f'fill="{PAPER}" font-weight="700" letter-spacing="3">'
            f'MODCON AGARTHA</text>'
            f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="13" '
            f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">'
            f'CURATED · THE GREEN TEAM</text>'
            f'</g>')


def build_behind_layer(t: float) -> str:
    """Caption text that goes BEHIND the villa for the 3D depth bite."""
    parts = [DEFS]
    parts.append(f'<rect width="{W}" height="380" fill="url(#topshade)"/>')

    # HOOK 1.0 → P_HOOK_END — BEHIND
    if 0.9 < t < P_HOOK_END + 0.4:
        l1 = ease_out_cubic(clamp((t - 1.0) / 1.5))
        l2 = ease_out_cubic(clamp((t - 2.5) / 1.5))
        v1 = int(round(l1 * len(HOOK_LINE_1)))
        v2 = int(round(l2 * len(HOOK_LINE_2)))
        line1 = HOOK_LINE_1[:v1]
        line2 = HOOK_LINE_2[:v2]
        hook_op = 1.0 - ease_in_out(clamp((t - P_HOOK_END) / 0.4))
        # Hook sits high in the frame — the thatched roof lower edge cuts
        # into the bottom of the second line on most exterior frames.
        if line1:
            parts.append(
                f'<text x="{CX}" y="780" font-family="{FONT_DISPLAY}" '
                f'font-size="76" fill="{PAPER}" font-weight="800" '
                f'letter-spacing="-1.5" text-anchor="middle" '
                f'opacity="{hook_op:.3f}">{line1}</text>')
        if line2:
            parts.append(
                f'<text x="{CX}" y="870" font-family="{FONT_DISPLAY}" '
                f'font-size="76" fill="{PAPER}" font-weight="800" '
                f'letter-spacing="-1.5" text-anchor="middle" '
                f'opacity="{hook_op:.3f}">{line2}</text>')

    # AGARTHA wordmark BEHIND, brand reveal phase
    if t > P_TAG_END - 0.1:
        u = clamp((t - P_TAG_END) / (TOTAL_S - P_TAG_END))
        ap = ease_out_cubic(clamp((u - 0.10) / 0.50))
        nshown = int(round(ap * len(PROPERTY_NAME)))
        pname = PROPERTY_NAME[:nshown]
        if pname:
            parts.append(
                f'<text x="{CX}" y="1100" font-family="{FONT_DISPLAY}" '
                f'font-size="200" fill="{PAPER}" font-weight="900" '
                f'letter-spacing="14" text-anchor="middle">{pname}</text>')
    return svg_wrap("".join(parts))


def build_front_layer(t: float) -> str:
    """Caption text that goes IN FRONT of the villa (always reads)."""
    parts = [DEFS]

    # Open black fade
    if t < 0.5:
        parts.append(
            f'<rect width="{W}" height="{H}" fill="{INK}" '
            f'opacity="{1.0 - clamp(t/0.5):.3f}"/>')

    # Chip (always front)
    parts.append(chip_svg(ease_out_cubic(clamp((t - 0.2) / 0.7))))

    # STATS — sits over clip A (exterior tour) section
    if P_HOOK_END - 0.1 < t < P_STATS_END + 0.1:
        u_in = ease_out_cubic(clamp((t - P_HOOK_END) / 0.5))
        u_out = ease_in_out(clamp((t - (P_STATS_END - 0.4)) / 0.4))
        op = u_in * (1.0 - u_out)
        dx = (1 - u_in) * -180
        parts.append(
            f'<rect x="0" y="{H-380}" width="{W}" height="380" '
            f'fill="url(#botshade)" opacity="{op * 0.80:.3f}"/>')
        parts.append(
            f'<g transform="translate({80 + dx:.0f},1540)" opacity="{op:.3f}">'
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
            f'</g>')

    # TAGLINE — italic gold "forest-edge sanctuary."
    if P_STATS_END - 0.1 < t < P_TAG_END + 0.1:
        u_in = ease_out_cubic(clamp((t - P_STATS_END) / 0.6))
        u_out = ease_in_out(clamp((t - (P_TAG_END - 0.3)) / 0.3))
        op = u_in * (1.0 - u_out)
        clip_w = u_in * 760
        parts.append(
            f'<rect x="0" y="{H-380}" width="{W}" height="380" '
            f'fill="url(#botshade)" opacity="{op * 0.7:.3f}"/>')
        parts.append(
            f'<defs><clipPath id="tgc">'
            f'<rect x="{CX-380:.0f}" y="1500" width="{clip_w:.0f}" height="140"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#tgc)">'
            f'<text x="{CX}" y="1600" font-family="{FONT_SERIF}" font-size="84" '
            f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
            f'text-anchor="middle">{TAGLINE_MAIN}</text>'
            f'</g>'
            f'<line x1="{CX-180}" y1="1670" x2="{CX-180+360*u_in:.0f}" y2="1670" '
            f'stroke="{GT_GOLD}" stroke-width="2" opacity="{op:.3f}"/>')

    # BRAND REVEAL — MODCON + signature
    if t > P_TAG_END - 0.1:
        u = clamp((t - P_TAG_END) / (TOTAL_S - P_TAG_END))
        # Bottom shade so brand block reads against the sunset glow
        parts.append(
            f'<rect x="0" y="{H-820}" width="{W}" height="820" '
            f'fill="url(#botshade)" opacity="{min(1.0, u*2.0):.3f}"/>')
        modcon_op = ease_out_cubic(clamp((u - 0.05) / 0.35))
        if modcon_op > 0.01:
            parts.append(modcon_svg(CX, 1280, 240, opacity=modcon_op))
        rw = clamp((u - 0.55) / 0.18) * 300
        if rw > 2:
            parts.append(
                f'<line x1="{CX - rw/2:.0f}" y1="1220" '
                f'x2="{CX + rw/2:.0f}" y2="1220" '
                f'stroke="{GT_GOLD}" stroke-width="2"/>')
        sig_op = ease_out_cubic(clamp((u - 0.55) / 0.30))
        if sig_op > 0.01:
            parts.append(leaf_svg(CX, 1580, 56, sig_op))
            parts.append(
                f'<text x="{CX}" y="1650" font-family="{FONT_MONO}" font-size="15" '
                f'fill="{PAPER}" opacity="{sig_op * 0.85:.3f}" letter-spacing="3" '
                f'text-anchor="middle">{CHANNEL_PARTNER_LINE}</text>')
            parts.append(
                f'<text x="{CX}" y="1700" font-family="{FONT_MONO}" font-size="22" '
                f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
                f'text-anchor="middle" opacity="{sig_op:.3f}">thegreenteam.in</text>')
        bar_h = int(70 * ease_out_cubic(clamp(u / 0.4)))
        parts.append(f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>')
        parts.append(f'<rect x="0" y="{H-bar_h}" width="{W}" height="{bar_h}" fill="#000"/>')

    return svg_wrap("".join(parts))


def build_watermark_badge() -> Image.Image:
    """Small Green Team leaf badge with soft halo, positioned bottom-right
    to cover the Gemini sparkle. The same badge sits at the same screen
    location on both clips (sparkles appear in similar corner)."""
    return svg_to_pil(svg_wrap(DEFS + leaf_svg(820, 1830, 130, 0.92, halo=True)))


# ─── PER-FRAME COMPOSITE ────────────────────────────────────────────────
WATERMARK_BADGE: Image.Image = None


def render_frame(i: int) -> Image.Image:
    t = i / FPS
    src_path, matte_path, _ = map_frame(i)

    base = Image.open(src_path).convert("RGBA")
    base.alpha_composite(svg_to_pil(build_behind_layer(t)))
    if matte_path.exists():
        original = Image.open(src_path).convert("RGBA")
        villa_alpha = Image.open(matte_path).convert("L")
        base.paste(original, (0, 0), villa_alpha)
    base.alpha_composite(svg_to_pil(build_front_layer(t)))
    if WATERMARK_BADGE is not None:
        base.alpha_composite(WATERMARK_BADGE)
    return base.convert("RGB")


# ─── POSTER ─────────────────────────────────────────────────────────────
def build_poster():
    # Use one of the sunset glow frames from clip B as the poster
    poster_frame_idx = int(8.0 * SRC_FPS)   # ~ t=8s of clip B
    src_path = B_FRAMES / f"b{poster_frame_idx:05d}.jpg"
    if not src_path.exists():
        src_path = sorted(B_FRAMES.glob("*.jpg"))[-1]
    base = Image.open(src_path).convert("RGB")

    arr = np.zeros((H, W, 4), dtype=np.uint8)
    for y in range(H):
        u = max(0.0, (y - H * 0.42) / (H * 0.40))
        u = min(1.0, u)
        arr[y, :, 3] = int(255 * 0.80 * u ** 1.3)
    rgba = base.convert("RGBA")
    rgba.alpha_composite(Image.fromarray(arr, 'RGBA'))
    base = rgba.convert("RGB")

    svg = svg_wrap(
        DEFS
        + chip_svg(1.0)
        + f'<text x="{CX}" y="1090" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-1.5" '
        f'text-anchor="middle">AT THE EDGE OF</text>'
        + f'<text x="{CX}" y="1170" font-family="{FONT_DISPLAY}" font-size="64" '
        f'fill="{PAPER}" font-weight="900" letter-spacing="-1.5" '
        f'text-anchor="middle">THE NARSAPUR FOREST.</text>'
        + f'<text x="{CX}" y="1255" font-family="{FONT_SERIF}" font-size="48" '
        f'font-style="italic" fill="url(#goldHL)" font-weight="500" '
        f'text-anchor="middle">forest-edge sanctuary.</text>'
        + modcon_svg(CX, 1430, 240, opacity=1.0)
        + f'<text x="{CX}" y="1580" font-family="{FONT_DISPLAY}" font-size="96" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="12" '
        f'text-anchor="middle">AGARTHA</text>'
        + f'<line x1="{CX-130}" y1="1620" x2="{CX+130}" y2="1620" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + leaf_svg(CX, 1700, 50, 1.0)
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
    global WATERMARK_BADGE
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    for f in FRAMES_DIR.glob("*.jpg"):
        f.unlink()

    print(f"[gt-villa-tour-3d-blend] {N_FRAMES} frames · {TOTAL_S}s @ {FPS}fps")
    extract_clip_a()
    extract_clip_b()

    a_idx, b_idx = collect_needed_matte_indices()
    print(f"[matte] need A:{len(a_idx)}  B:{len(b_idx)} mattes")
    matte_frames(A_FRAMES, MATTE_A, "A", a_idx)
    matte_frames(B_FRAMES, MATTE_B, "B", b_idx)

    build_poster()
    WATERMARK_BADGE = build_watermark_badge()

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

    for i in range(30):
        Image.open(POSTER_JPG).save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)

    # Audio: clip B 0-3s → clip A 0-5s → clip B 6-10s, small crossfades.
    # ffmpeg inputs: [0] frames (no audio) · [1] clip A · [2] clip B · [3] poster
    audio_filter = (
        "[2:a]atrim=0:3,asetpts=PTS-STARTPTS,"
        "afade=t=out:st=2.8:d=0.2[ab0];"
        "[1:a]atrim=0:5,asetpts=PTS-STARTPTS,"
        "afade=t=in:st=0:d=0.2,afade=t=out:st=4.8:d=0.2[aa];"
        "[2:a]atrim=6:10,asetpts=PTS-STARTPTS,"
        "afade=t=in:st=0:d=0.2,afade=t=out:st=3.4:d=0.6[ab1];"
        "[ab0][aa][ab1]concat=n=3:v=0:a=1[aout]"
    )
    for label, crf, audio_kb, out_path in (
        ("prod",   18, 192, FINAL_MP4),
        ("mobile", 24,  96, MOBILE_MP4),
    ):
        cmd = [
            "ffmpeg", "-y",
            "-framerate", str(FPS),
            "-i", str(FRAMES_DIR / "f%05d.jpg"),
            "-i", str(CLIP_A),
            "-i", str(CLIP_B),
            "-i", str(POSTER_JPG),
            "-filter_complex", audio_filter,
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
