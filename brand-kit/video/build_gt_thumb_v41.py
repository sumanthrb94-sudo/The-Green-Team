"""
GT-THUMB-V41 — Green Team brand-identity reel (rebuilt from V40 feedback)

Why v41 (per CEO feedback on v40):
  - V40 dot-coalesce assumed Brand Mint's pixel-shaped M monogram. The leaf
    logo is organic curves; dots clumping toward it produced a vague blob,
    not a recognisable mark. → Logo now draws via SVG stroke-dashoffset
    animation across the three native leaf-path layers. Dots are NEVER
    asked to form the logo.
  - V40 lattice ran behind text and overlapped the type. → Dots are now
    sparse atmosphere drift (not a centered lattice) and FULLY FADE OUT
    by t=11.5s, well before the brand-reveal phase. Text always sits on
    a darkened photo band or solid ink — no grid collisions.
  - V40 was a Brand Mint reskin. → Six phases, each a DIFFERENT motion
    template borrowed from competitor editorial-real-estate ad
    research: typewriter hook, photo crossfade + Ken Burns, stat-card
    slide-in, chip-stack (Lodha amenity grid pattern), SVG stroke
    draw-in (mark reveal), italic gradient tagline + CTA blink.

Audio: synced to mrclaps_fashion (99.4 BPM, "fashion abstract" — chosen
for editorial cadence at 0.604s/beat). Beat grid drives phase boundaries
and per-word reveal ticks.

DELIVERABLE
  - 22.0s · 1080×1920 · 60fps · 1320 frames
  - H.264 libx264 preset slow CRF 18 yuv420p faststart
  - WITH audio (mrclaps_fashion track, trimmed to 22s)
  - Output: out/greenteam-thumb-v41-60fps.mp4

PHASE MAP (boundaries on detected beats)
  P1 ColdOpen     0.00 → 2.42s  forest photo fade up, ambient dust drift
  P2 Hook1        2.42 → 6.48s  "FORESTS DON'T STAY BY ACCIDENT." typewriter
  P3 PhotoStat    6.48 → 10.54s photo crossfade + Ken Burns + stat slide-in
  P4 ChipStack    10.54 → 13.45s 3 magazine chips fly in; dots gone
  P5 BrandReveal  13.45 → 18.67s leaf logo strokes draw in + wordmark + tagline
  P6 Close        18.67 → 22.00s signature + URL + CTA blink + vignette out
"""
from __future__ import annotations

import io
import math
import random
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cairosvg
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
LOGO_SVG_FILE = REPO / "public" / "logo-the-green-team-original.svg"

GAL_AGARTHA = REPO / "public" / "gallery" / "agartha"
GAL_DATES = REPO / "public" / "gallery" / "dates-county"

OUT_DIR = REPO / "out"
FRAMES_DIR = OUT_DIR / "frames_gt-thumb-v41"
SILENT_MP4 = OUT_DIR / "_gt-thumb-v41-silent.mp4"
FINAL_MP4 = OUT_DIR / "greenteam-thumb-v41-60fps.mp4"

AUDIO_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)

# ─── CANVAS + TIMING ────────────────────────────────────────────────────
W, H = 1080, 1920
FPS = 60
TOTAL_S = 22.0
N_FRAMES = int(TOTAL_S * FPS)  # 1320
CX = W // 2
SAFE_TOP = 270
SAFE_BOT = H - 480

# ─── PALETTE (Green Team) ───────────────────────────────────────────────
INK    = "#0e1408"   # deeper than v40 — gives more contrast for cream type
PAPER  = "#faf9f6"
GT_OLIVE_800 = "#2d3a1d"
GT_SAGE      = "#a3b18a"
GT_GOLD      = "#c8a951"
GT_GOLD_DEEP = "#a88a39"
GT_TERRA     = "#8a3d36"

# ─── FONTS ─────────────────────────────────────────────────────────────
FONT_DISPLAY = "'Inter Display', 'Inter', 'Helvetica Neue', 'DejaVu Sans', sans-serif"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"
FONT_MONO    = "'JetBrains Mono', 'IBM Plex Mono', 'DejaVu Sans Mono', monospace"

# ─── BEAT GRID (detected from mrclaps_fashion) ──────────────────────────
# librosa.beat.beat_track on first 30s of the track produced 47 beats at
# 99.4 BPM. The first 8 measured beats:
#   1.184  1.788  2.415  2.995  3.576  4.156  4.737  5.317
# Average step ≈ 0.604s. Extending linearly for the 22s window:
BEAT_STEP = 0.604
BEAT_0 = 1.184  # first detected beat
BEATS = [BEAT_0 + i * BEAT_STEP for i in range(40)]

def beat_at(idx: int) -> float:
    return BEATS[idx]

# Phase boundaries on beats — chosen to align with strong audio markers
P1_END = beat_at(2)   # 2.42  end of cold open
P2_END = beat_at(9)   # 6.61  end of hook 1
P3_END = beat_at(15)  # 10.24 end of photo+stat
P4_END = beat_at(20)  # 13.26 end of chip stack
P5_END = beat_at(29)  # 18.70 end of brand reveal
# P6: 18.70 → 22.00 = close

# Dots fully gone target: 11.0s (clearly before brand reveal at 13.45s)
DOTS_OUT_START = 8.5
DOTS_OUT_END   = 11.0


# ─── EASING ─────────────────────────────────────────────────────────────
def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))

def lerp(a, b, t):
    return a + (b - a) * t

def ease_in_out(t):
    t = clamp(t)
    return t * t * (3 - 2 * t)

def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3

def ease_in_cubic(t):
    t = clamp(t)
    return t * t * t

def norm(t, t0, t1):
    """Normalise t into [0,1] across the [t0,t1] window."""
    if t1 <= t0:
        return 0.0 if t < t0 else 1.0
    return clamp((t - t0) / (t1 - t0))


# ─── PHOTO LOADING + KEN BURNS ──────────────────────────────────────────
@dataclass
class Photo:
    path: Path
    _full: Optional[Image.Image] = None

    def load(self):
        if self._full is None:
            im = Image.open(self.path).convert("RGB")
            # Pre-resize the longest side to 2400 max for memory
            im.thumbnail((2400, 2400), Image.LANCZOS)
            self._full = im
        return self._full

    def ken_burns(
        self,
        t: float,
        duration: float,
        start_zoom: float = 1.0,
        end_zoom: float = 1.12,
        start_cx: float = 0.5,
        start_cy: float = 0.5,
        end_cx: float = 0.5,
        end_cy: float = 0.45,
    ) -> Image.Image:
        """Return a 1080×1920 crop at time t of the Ken Burns move."""
        im = self.load()
        u = ease_in_out(clamp(t / duration))
        zoom = lerp(start_zoom, end_zoom, u)
        ccx = lerp(start_cx, end_cx, u)
        ccy = lerp(start_cy, end_cy, u)

        sw, sh = im.size
        # Compute the source crop that, when scaled to W×H, has the
        # requested zoom factor. We always fill 1080×1920 (centered).
        # Target aspect = W/H = 9/16
        target_ar = W / H
        # Pick crop size to match target aspect, scaled by zoom
        if sw / sh > target_ar:
            # source is wider — crop horizontally
            ch = sh / zoom
            cw = ch * target_ar
        else:
            cw = sw / zoom
            ch = cw / target_ar
        # Clamp center so crop stays in bounds
        cx_px = clamp(ccx, cw / (2 * sw), 1 - cw / (2 * sw)) * sw
        cy_px = clamp(ccy, ch / (2 * sh), 1 - ch / (2 * sh)) * sh
        l = int(round(cx_px - cw / 2))
        t_ = int(round(cy_px - ch / 2))
        r = int(round(cx_px + cw / 2))
        b = int(round(cy_px + ch / 2))
        crop = im.crop((l, t_, r, b)).resize((W, H), Image.LANCZOS)
        return crop


# ─── DARKEN + VIGNETTE OVERLAY ──────────────────────────────────────────
def darken_band(im: Image.Image, top_y: int, bot_y: int, strength: float = 0.55) -> Image.Image:
    """Apply a vertical-gradient dark band behind a text region (keeps photo
    legible). Strength = peak alpha of the darkening overlay."""
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    # Gaussian-ish gradient centered between top_y and bot_y
    mid = (top_y + bot_y) / 2
    half = max((bot_y - top_y) / 2, 1)
    for y in range(H):
        d = abs(y - mid) / (half * 1.6)
        a = math.exp(-d * d * 1.4)
        arr[y, :, 3] = int(255 * strength * a)
    overlay = Image.fromarray(arr, mode="RGBA")
    out = im.convert("RGBA")
    out.alpha_composite(overlay)
    return out.convert("RGB")


# ─── PARTICLES (ambient drift, not lattice) ─────────────────────────────
@dataclass
class DustParticle:
    x: float
    y: float
    vx: float
    vy: float
    r: float
    life_phase: float  # 0..1 — used for opacity sin breath

def init_dust(rng: random.Random, n: int = 90) -> list[DustParticle]:
    parts = []
    for _ in range(n):
        parts.append(DustParticle(
            x=rng.uniform(0, W),
            y=rng.uniform(0, H),
            vx=rng.uniform(-6, 6),       # px/sec
            vy=rng.uniform(8, 22),        # px/sec downward drift
            r=rng.uniform(1.4, 3.2),
            life_phase=rng.uniform(0, 1),
        ))
    return parts

def dust_svg(particles: list[DustParticle], t: float, alpha_mul: float) -> str:
    """Render the dust particles as SVG circles at time t. alpha_mul scales
    global opacity (used to fade dots OUT across DOTS_OUT_START..DOTS_OUT_END)."""
    if alpha_mul <= 0.001:
        return ""
    out = []
    for p in particles:
        # Linear drift, wrap to canvas
        x = (p.x + p.vx * t) % W
        y = (p.y + p.vy * t) % H
        # Twinkle: sinusoidal breath
        b = 0.45 + 0.55 * (0.5 + 0.5 * math.sin(2 * math.pi * (p.life_phase + t * 0.35)))
        a = clamp(b * alpha_mul, 0, 1)
        col = GT_SAGE
        out.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{p.r:.2f}" '
                   f'fill="{col}" opacity="{a:.3f}"/>')
    return "".join(out)


# ─── SVG OVERLAY RENDERER ───────────────────────────────────────────────
def svg_to_pil(svg_str: str) -> Image.Image:
    """Render an SVG string (transparent BG) to a 1080×1920 RGBA PIL image."""
    png = cairosvg.svg2png(
        bytestring=svg_str.encode("utf-8"),
        output_width=W, output_height=H,
    )
    return Image.open(io.BytesIO(png)).convert("RGBA")


def svg_wrap(content: str, bg: Optional[str] = None) -> str:
    bgrect = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ""
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'{bgrect}'
        f'{content}'
        f'</svg>'
    )


# ─── COMPETITOR-TEMPLATE PRIMITIVES ─────────────────────────────────────
def chip_eyebrow(x: int, y: int, label: str, serial: str, reveal: float) -> str:
    """Editorial serial chip — top-left "EDITORIAL · 01" pattern.
    reveal: 0..1 — slides in from left and fades."""
    if reveal <= 0.001:
        return ""
    dx = (1 - reveal) * -200
    op = reveal
    return (
        f'<g transform="translate({x + dx:.1f},{y})" opacity="{op:.3f}">'
        f'<rect x="0" y="-22" width="6" height="44" fill="{GT_GOLD}"/>'
        f'<text x="22" y="-4" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="3">{label}</text>'
        f'<text x="22" y="20" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="3">{serial}</text>'
        f'</g>'
    )


def typewriter(text: str, x: int, y: int, size: int, fill: str,
               family: str, weight: str, anchor: str, progress: float,
               letter_spacing: float = 0.0) -> str:
    """Reveal `text` progressively from left, like a typewriter. Progress
    0..1 maps to how many characters of `text` are visible."""
    n = max(1, len(text))
    visible_n = int(round(progress * n))
    shown = text[:visible_n]
    if not shown:
        return ""
    cursor = ""
    if 0.02 < progress < 0.98:
        # blinking cursor right after the last visible char
        cursor = (
            f'<rect x="0" y="-{int(size*0.85)}" width="3" height="{int(size*0.9)}" '
            f'fill="{fill}" opacity="0.85"/>'
        )
    return (
        f'<g transform="translate({x},{y})">'
        f'<text font-family="{family}" font-size="{size}" fill="{fill}" '
        f'font-weight="{weight}" text-anchor="{anchor}" '
        f'letter-spacing="{letter_spacing}">{shown}</text>'
        f'<g transform="translate({text_advance(shown, size)*(1 if anchor!="middle" else 0):.0f},0)">'
        f'{cursor if anchor!="middle" else ""}</g>'
        f'</g>'
    )


def text_advance(text: str, size: int) -> float:
    """Rough advance width — used only for cursor placement (not exact)."""
    return len(text) * size * 0.52


def stat_card(x: int, y: int, slide: float, label: str, value: str,
              sublabel: str) -> str:
    """Lodha-template stat card: slides in from right edge with a thin
    gold left rule. slide 0..1."""
    if slide <= 0.001:
        return ""
    dx = (1 - slide) * 400
    op = slide
    return (
        f'<g transform="translate({x + dx:.0f},{y})" opacity="{op:.3f}">'
        f'<rect x="0" y="-110" width="3" height="220" fill="{GT_GOLD}"/>'
        f'<text x="20" y="-58" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{GT_GOLD}" font-weight="600" letter-spacing="4">{label}</text>'
        f'<text x="20" y="14" font-family="{FONT_DISPLAY}" font-size="76" '
        f'fill="{PAPER}" font-weight="700" letter-spacing="-2">{value}</text>'
        f'<text x="20" y="60" font-family="{FONT_MONO}" font-size="14" '
        f'fill="{PAPER}" opacity="0.7" letter-spacing="2">{sublabel}</text>'
        f'</g>'
    )


def magazine_chip(x: int, y: int, w: int, h: int, slide: float,
                  label: str, value: str, num: str) -> str:
    """Magazine-style amenity chip — slides in from below, gold border, mono num."""
    if slide <= 0.001:
        return ""
    dy = (1 - slide) * 80
    op = slide
    return (
        f'<g transform="translate({x},{y + dy:.0f})" opacity="{op:.3f}">'
        f'<rect x="0" y="0" width="{w}" height="{h}" fill="none" '
        f'stroke="{GT_GOLD}" stroke-width="1.5"/>'
        f'<text x="20" y="32" font-family="{FONT_MONO}" font-size="13" '
        f'fill="{GT_GOLD}" letter-spacing="3">{num}</text>'
        f'<text x="20" y="{h-46:.0f}" font-family="{FONT_DISPLAY}" '
        f'font-size="34" fill="{PAPER}" font-weight="700" '
        f'letter-spacing="-0.5">{value}</text>'
        f'<text x="20" y="{h-18:.0f}" font-family="{FONT_MONO}" '
        f'font-size="12" fill="{GT_SAGE}" letter-spacing="2">{label}</text>'
        f'</g>'
    )


# ─── LEAF LOGO STROKE-DRAW ──────────────────────────────────────────────
# The 3 leaf-path d-strings, copied from public/logo-the-green-team-original.svg
# (viewBox 0 0 100 100). We render the leaf at a configurable size.
LEAF_PATHS = [
    # path-dim: outline of left/larger leaf
    ("M50 90C50 90 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 90Z",
     # We use dim path as the FIRST drawn outline (looks softer / atmospheric).
     "dim"),
    # path-light: outline of right/brighter leaf
    ("M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z",
     "light"),
    # path-line: the central veins (already a stroke in original)
    ("M50 90L50 45M50 90C50 90 44 72 34 62M50 90C50 90 56 72 66 62",
     "line"),
]
# Approximate stroke lengths in viewBox units (100×100). Used for the
# stroke-dashoffset draw-in. The two leaf outlines are ~270 units each;
# the vein line group is ~135 units (3 short segments). These don't have
# to be exact — we just need a value larger than the actual length to
# produce a clean reveal.
LEAF_DASH = {"dim": 380, "light": 380, "line": 200}


def leaf_logo_svg(cx: int, cy: int, size: int,
                  draw_progress: float, fill_progress: float) -> str:
    """Render the leaf logo at (cx,cy), `size` px square.

    Stage 1 (draw_progress 0→1): each path is rendered as a STROKE that
    draws in via stroke-dashoffset (like a hand-sketched outline).

    Stage 2 (fill_progress 0→1): the path-dim then path-light fills
    appear, ramping up to native opacity. The veins stay as stroke.
    """
    if draw_progress <= 0.001 and fill_progress <= 0.001:
        return ""
    half = size / 2
    # The viewBox is 0..100, so a transform places it correctly.
    scale = size / 100
    g_open = (
        f'<g transform="translate({cx - half:.1f},{cy - half:.1f}) '
        f'scale({scale:.4f})">'
    )
    parts = [g_open]
    dim_d, _ = LEAF_PATHS[0]
    light_d, _ = LEAF_PATHS[1]
    line_d, _ = LEAF_PATHS[2]

    # Stage 2 fills (rendered first so strokes layer on top)
    if fill_progress > 0.001:
        a_dim = clamp(0.35 * fill_progress)
        a_lit = clamp(1.0 * fill_progress)
        parts.append(
            f'<path d="{dim_d}" fill="{PAPER}" opacity="{a_dim:.3f}"/>'
        )
        parts.append(
            f'<path d="{light_d}" fill="{PAPER}" opacity="{a_lit:.3f}"/>'
        )

    # Stage 1 strokes (drawn over fills so the outline is always visible
    # during the reveal). They stagger: dim first, light second, veins last.
    if draw_progress > 0.001:
        # split progress across 3 staggered sub-draws (0..0.45, 0.30..0.80, 0.65..1.0)
        sub = [
            ease_out_cubic(norm(draw_progress, 0.00, 0.45)),
            ease_out_cubic(norm(draw_progress, 0.30, 0.80)),
            ease_out_cubic(norm(draw_progress, 0.65, 1.00)),
        ]
        for (d, kind), p in zip(LEAF_PATHS, sub):
            dash = LEAF_DASH[kind]
            off = dash * (1 - p)
            opacity = 0.85 if kind != "line" else 0.95
            sw = 1.2 if kind == "line" else 0.8
            # Once fills land (fill_progress >= 0.6), fade the outline out
            stroke_fade = 1.0 - clamp((fill_progress - 0.6) / 0.4)
            opacity *= stroke_fade
            if opacity <= 0.001:
                continue
            parts.append(
                f'<path d="{d}" fill="none" stroke="{PAPER}" '
                f'stroke-width="{sw}" stroke-linecap="round" '
                f'stroke-dasharray="{dash}" stroke-dashoffset="{off:.2f}" '
                f'opacity="{opacity:.3f}"/>'
            )
    parts.append("</g>")
    return "".join(parts)


# ─── DEFS (gradients used throughout) ───────────────────────────────────
DEFS = (
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


# ─── PHASE RENDERERS ────────────────────────────────────────────────────
# Each phase returns (base_pil, overlay_svg_str). The base_pil is a 1080×1920
# RGB Pillow image (photo composition + darken bands). The overlay_svg_str is
# rendered transparent and composited on top via alpha_composite.

def phase1_cold_open(t: float, dust: list[DustParticle],
                     photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """0.00 → 2.42s — forest photo fades up from black, slow dolly down."""
    u = norm(t, 0.0, P1_END)
    # Photo (Agartha "8.webp" - sweeping forest aerial). Slow zoom out.
    im = photos["hero"].ken_burns(
        t, P1_END, start_zoom=1.18, end_zoom=1.06,
        start_cx=0.5, start_cy=0.42, end_cx=0.5, end_cy=0.50,
    )
    # Fade up from black: at u=0 → full black, at u=0.6 → photo. Cinematic.
    fade_up = ease_out_cubic(clamp(u / 0.6))
    if fade_up < 0.999:
        black = Image.new("RGB", (W, H), (5, 7, 4))
        im = Image.blend(black, im, fade_up)
    # Dust drift
    overlay = (
        DEFS
        + dust_svg(dust, t, alpha_mul=ease_out_cubic(u) * 0.75)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
    )
    return im, overlay


def phase2_hook1(t: float, dust: list[DustParticle],
                 photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """2.42 → 6.61s — "FORESTS DON'T STAY BY ACCIDENT." typewriter hook."""
    u = norm(t, P1_END, P2_END)
    # Continue the hero photo Ken Burns from where phase 1 left off
    im = photos["hero"].ken_burns(
        t, P2_END, start_zoom=1.06, end_zoom=1.14,
        start_cx=0.5, start_cy=0.50, end_cx=0.5, end_cy=0.58,
    )
    # Darken a horizontal band where the headline sits
    headline_y = 1090
    im = darken_band(im, headline_y - 240, headline_y + 240, strength=0.55)

    # Typewriter the hook. Reveal across u = 0.05 → 0.65 (then hold).
    hook_progress = ease_out_cubic(clamp((u - 0.05) / 0.60))
    hook_str = "FORESTS DON'T STAY"
    hook_str2 = "BY ACCIDENT."
    # Split into two lines, typewrite line 1 then line 2
    full = hook_str + " " + hook_str2
    n1 = len(hook_str)
    visible = int(round(hook_progress * len(full)))
    line1 = full[:min(visible, n1)]
    line2 = full[n1+1:visible] if visible > n1 else ""

    # Eyebrow chip top-left
    chip_reveal = ease_out_cubic(clamp((u - 0.0) / 0.30))

    dust_alpha = 0.65  # dots strong here but well-behaved
    overlay = (
        DEFS
        + dust_svg(dust, t, alpha_mul=dust_alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "EDITORIAL", "01 / 06", chip_reveal)
        # Headline (two lines)
        + f'<g transform="translate({CX},{headline_y})">'
        + f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="74" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2" '
        f'text-anchor="middle">{line1}</text>'
        + f'<text x="0" y="92" font-family="{FONT_DISPLAY}" font-size="74" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2" '
        f'text-anchor="middle">{line2}</text>'
        + '</g>'
        # Thin gold rule beneath, draws in across line 2
        + f'<line x1="{CX-90}" y1="{headline_y+180}" '
        f'x2="{CX-90 + 180 * clamp((hook_progress-0.85)/0.15)}" '
        f'y2="{headline_y+180}" stroke="{GT_GOLD}" stroke-width="2"/>'
    )
    return im, overlay


def phase3_photo_stat(t: float, dust: list[DustParticle],
                      photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """6.61 → 10.24s — crossfade to aerial photo, stat card slides in from right.
    Dots start fading out across DOTS_OUT_START..DOTS_OUT_END."""
    u = norm(t, P2_END, P3_END)
    # Crossfade between photos across the first 0.6 of the phase
    fade = ease_in_out(clamp(u / 0.5))
    # Hero photo (continuing zoom)
    im_a = photos["hero"].ken_burns(
        t, P3_END, start_zoom=1.14, end_zoom=1.20,
        start_cx=0.5, start_cy=0.58, end_cx=0.5, end_cy=0.62,
    )
    # New aerial photo
    im_b = photos["aerial"].ken_burns(
        t - P2_END, P3_END - P2_END,
        start_zoom=1.04, end_zoom=1.18,
        start_cx=0.45, start_cy=0.50, end_cx=0.65, end_cy=0.50,
    )
    im = Image.blend(im_a, im_b, fade)
    # Darken right-side band for the stat card
    band = darken_band(im, 760, 1180, strength=0.50)
    im = band

    # Dots fade-out
    alpha = 0.65 * (1 - ease_in_out(norm(t, DOTS_OUT_START, DOTS_OUT_END)))

    # Stat card slides in across u 0.30 → 0.70
    stat_progress = ease_out_cubic(clamp((u - 0.25) / 0.45))

    # Eyebrow chip persists ("EDITORIAL · 02/06")
    chip_reveal = 1.0

    overlay = (
        DEFS
        + dust_svg(dust, t, alpha_mul=alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "EDITORIAL", "02 / 06", chip_reveal)
        + stat_card(110, 980, stat_progress,
                    "FOREST EDGE — TUKKUGUDA",
                    "4.5 ACRES",
                    "BIOPHILIC · GATED · FOREST-VIEW")
    )
    return im, overlay


def phase4_chip_stack(t: float, dust: list[DustParticle],
                      photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """10.24 → 13.26s — magazine chip stack. Dots fully gone now (overlay
    alpha is 0). Photo dims and an ink wash layers up to prep for brand reveal."""
    u = norm(t, P3_END, P4_END)
    im = photos["aerial"].ken_burns(
        t, P4_END,
        start_zoom=1.18, end_zoom=1.30,
        start_cx=0.65, start_cy=0.50, end_cx=0.50, end_cy=0.50,
    )
    # Increasing ink wash to push photo back
    wash_alpha = lerp(0.40, 0.78, ease_in_out(u))
    ink_layer = Image.new("RGB", (W, H), (14, 20, 8))
    im = Image.blend(im, ink_layer, wash_alpha)

    # 3 chips staggered. Each chip slides in 0.18s after the previous.
    chip_w, chip_h = 280, 180
    gap = 24
    total_w = chip_w * 3 + gap * 2
    base_x = (W - total_w) // 2
    chip_y = 1280
    chip_data = [
        ("01", "BIOPHILIC", "DESIGN"),
        ("02", "GATED", "COMMUNITY"),
        ("03", "FOREST", "VIEW"),
    ]
    chips_svg = ""
    for i, (num, value, label) in enumerate(chip_data):
        start = 0.10 + i * 0.20
        prog = ease_out_cubic(clamp((u - start) / 0.40))
        x = base_x + i * (chip_w + gap)
        chips_svg += magazine_chip(x, chip_y, chip_w, chip_h, prog,
                                   label, value, num)

    # Headline above chips
    hl_progress = ease_out_cubic(clamp((u - 0.0) / 0.35))
    hl_dy = (1 - hl_progress) * 30
    hl_op = hl_progress
    headline = "WHAT WE CURATE"
    sub = "Three non-negotiables — every property we list passes them."

    overlay = (
        DEFS
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "EDITORIAL", "03 / 06", 1.0)
        + f'<g transform="translate({CX},{1080 + hl_dy:.0f})" '
        f'opacity="{hl_op:.3f}">'
        + f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="80" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-2.5" '
        f'text-anchor="middle">{headline}</text>'
        + f'<text x="0" y="50" font-family="{FONT_SERIF}" font-size="26" '
        f'fill="{PAPER}" opacity="0.8" font-style="italic" '
        f'text-anchor="middle">{sub}</text>'
        + '</g>'
        + chips_svg
    )
    return im, overlay


def phase5_brand_reveal(t: float, dust: list[DustParticle],
                        photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """13.26 → 18.70s — photos fade fully to INK. Leaf logo strokes draw in,
    then fills appear. Wordmark + italic gold tagline reveal."""
    u = norm(t, P4_END, P5_END)
    # Photo→ink: across first 0.3 of phase
    fade_out = ease_in_out(clamp(u / 0.30))
    im_photo = photos["aerial"].ken_burns(
        t, P5_END,
        start_zoom=1.30, end_zoom=1.42,
        start_cx=0.50, start_cy=0.50, end_cx=0.50, end_cy=0.50,
    )
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = Image.blend(im_photo, ink, fade_out)
    # Once fully ink, stay
    if fade_out > 0.98:
        im = ink

    # Leaf logo: draw 0..0.55, fill 0.40..0.85
    draw_p = clamp((u - 0.00) / 0.55)
    fill_p = clamp((u - 0.40) / 0.45)
    leaf_size = 380
    leaf_cx = CX
    leaf_cy = 780

    # Wordmark types in after the leaf fill starts
    wordmark = "THE GREEN TEAM"
    wm_progress = ease_out_cubic(clamp((u - 0.55) / 0.25))
    wm_visible_n = int(round(wm_progress * len(wordmark)))
    wm_shown = wordmark[:wm_visible_n]

    # Italic gold tagline reveals after wordmark
    tag_left = "WE CURATE FOREST-ADJACENT"
    tag_right = "sanctuaries."
    tag_kicker_progress = ease_out_cubic(clamp((u - 0.72) / 0.18))
    tag_main_progress = ease_out_cubic(clamp((u - 0.82) / 0.16))

    # Thin animated rule under wordmark
    rule_w = clamp((u - 0.65) / 0.18) * 260

    overlay_parts = [
        DEFS,
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>',
        leaf_logo_svg(leaf_cx, leaf_cy, leaf_size, draw_p, fill_p),
        # Wordmark
        f'<g transform="translate({CX},1090)">'
        f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="78" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">{wm_shown}</text>'
        f'</g>',
        # Gold rule
        f'<line x1="{CX - rule_w/2:.0f}" y1="1130" '
        f'x2="{CX + rule_w/2:.0f}" y2="1130" stroke="{GT_GOLD}" '
        f'stroke-width="2"/>',
    ]

    # Tagline: two parts
    if tag_kicker_progress > 0.001:
        op = tag_kicker_progress
        overlay_parts.append(
            f'<g transform="translate({CX},1220)" opacity="{op:.3f}">'
            f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="20" '
            f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
            f'text-anchor="middle">{tag_left}</text>'
            f'</g>'
        )
    if tag_main_progress > 0.001:
        # Mask reveal — clip rect grows left→right. Width sized to fit the
        # full italic "sanctuaries." at 74pt (~580px).
        clip_w = tag_main_progress * 620
        overlay_parts.append(
            f'<defs><clipPath id="tagclip">'
            f'<rect x="{CX-310:.0f}" y="1240" width="{clip_w:.0f}" height="100"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#tagclip)">'
            f'<text x="{CX}" y="1310" font-family="{FONT_SERIF}" '
            f'font-size="74" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{tag_right}</text>'
            f'</g>'
        )

    return im, "".join(overlay_parts)


def phase6_close(t: float, dust: list[DustParticle],
                 photos: dict[str, Photo]) -> tuple[Image.Image, str]:
    """18.70 → 22.00s — composition holds, signature line + URL fade in, soft
    vignette breath out."""
    u = norm(t, P5_END, TOTAL_S)
    # Final ink background (constant)
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = ink

    # All elements from end of phase 5 are HELD (leaf full, wordmark full,
    # tagline full). We re-render them at their final states.
    leaf_size = 380
    leaf_cx = CX
    leaf_cy = 780

    sig_progress = ease_out_cubic(clamp((u - 0.05) / 0.30))
    sig_op = sig_progress
    # CTA blink in last 1.5s
    cta_t = t - (TOTAL_S - 2.5)
    cta_blink = 0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 6.0)) if cta_t > 0 else 0.0

    # Vignette breath: deepen toward the end
    vig_strength = lerp(0.65, 0.88, ease_in_out(u))

    final_defs = (
        '<defs>'
        f'<linearGradient id="goldHL2" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient>'
        f'<radialGradient id="vig2" cx="0.5" cy="0.5" r="0.85">'
        f'<stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{INK}" stop-opacity="{vig_strength:.3f}"/>'
        f'</radialGradient>'
        '</defs>'
    )

    overlay = (
        final_defs
        + leaf_logo_svg(leaf_cx, leaf_cy, leaf_size, 1.0, 1.0)
        + f'<g transform="translate({CX},1090)">'
        + f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="78" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM</text>'
        + '</g>'
        + f'<line x1="{CX - 130}" y1="1130" x2="{CX + 130}" y2="1130" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<g transform="translate({CX},1220)">'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
        f'text-anchor="middle">WE CURATE FOREST-ADJACENT</text>'
        + '</g>'
        + f'<text x="{CX}" y="1310" font-family="{FONT_SERIF}" '
        f'font-size="74" font-style="italic" '
        f'fill="url(#goldHL2)" font-weight="400" '
        f'text-anchor="middle">sanctuaries.</text>'
        # Signature line
        + f'<g transform="translate({CX},1450)" opacity="{sig_op:.3f}">'
        + f'<line x1="-200" y1="-40" x2="200" y2="-40" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.4"/>'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        + f'<text x="0" y="34" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text>'
        + '</g>'
        # CTA blink at bottom
        + f'<text x="{CX}" y="1620" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="{cta_blink:.3f}" letter-spacing="6" '
        f'text-anchor="middle">DM FOR THE BRIEF</text>'
        + f'<rect width="{W}" height="{H}" fill="url(#vig2)"/>'
    )
    return im, overlay


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(t: float, dust: list[DustParticle],
                 photos: dict[str, Photo]) -> Image.Image:
    if t < P1_END:
        base, overlay = phase1_cold_open(t, dust, photos)
    elif t < P2_END:
        base, overlay = phase2_hook1(t, dust, photos)
    elif t < P3_END:
        base, overlay = phase3_photo_stat(t, dust, photos)
    elif t < P4_END:
        base, overlay = phase4_chip_stack(t, dust, photos)
    elif t < P5_END:
        base, overlay = phase5_brand_reveal(t, dust, photos)
    else:
        base, overlay = phase6_close(t, dust, photos)

    # Composite SVG overlay onto base
    if overlay:
        svg_str = svg_wrap(overlay)
        overlay_pil = svg_to_pil(svg_str)
        base = base.convert("RGBA")
        base.alpha_composite(overlay_pil)
        return base.convert("RGB")
    return base


# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(11)
    dust = init_dust(rng, n=90)

    # Pick best hero + aerial photos (we just verified these load)
    photos = {
        "hero":   Photo(GAL_AGARTHA / "8.webp"),    # forest aerial 2400x1691
        "aerial": Photo(GAL_AGARTHA / "11.webp"),   # 2400x1691
    }
    # Force-load and pre-resize so the first frame isn't slow
    for p in photos.values():
        p.load()

    print(f"[gt-thumb-v41] {N_FRAMES} frames @ {FPS}fps · {TOTAL_S}s")
    print(f"  phase boundaries: P1={P1_END:.2f} P2={P2_END:.2f} "
          f"P3={P3_END:.2f} P4={P4_END:.2f} P5={P5_END:.2f}")
    print(f"  dots fade: {DOTS_OUT_START:.1f}s → {DOTS_OUT_END:.1f}s")
    t0 = time.time()
    for i in range(N_FRAMES):
        t = i / FPS
        frame = render_frame(t, dust, photos)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", format="JPEG",
                   quality=92, optimize=False)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time()-t0:.0f}s")

    # Mux silent first (for debugging) then add audio
    silent_cmd = [
        "ffmpeg", "-y", "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "f%05d.jpg"),
        "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-t", str(TOTAL_S),
        str(SILENT_MP4),
    ]
    subprocess.run(silent_cmd, check=True, capture_output=True)

    # Add audio (trim to 22.0s, fade out last 1.0s for a clean tail)
    audio_cmd = [
        "ffmpeg", "-y",
        "-i", str(SILENT_MP4),
        "-i", str(AUDIO_SRC),
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-af", f"afade=t=out:st={TOTAL_S-1.0:.2f}:d=1.0",
        "-t", str(TOTAL_S),
        "-shortest",
        str(FINAL_MP4),
    ]
    subprocess.run(audio_cmd, check=True, capture_output=True)
    print(f"[done] {FINAL_MP4}")


if __name__ == "__main__":
    main()
