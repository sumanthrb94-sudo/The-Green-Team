"""
GT-THUMB-V40 — Green Team brand-identity reel (PRODUCTION V40 architecture)

Implements PRODUCTION_V40_SYSTEM.md verbatim — particle lattice, audio-hit
phase grid, monogram coalesce, god-ray bloom, brand-reveal sequence — with
the Brand Mint mint palette swapped for The Green Team's olive/sage/gold
palette and the M monogram swapped for the leaf logo.

DELIVERABLE per V40 spec:
  - 22.0s · 1080×1920 · 60fps · 1320 frames
  - H.264 libx264 preset slow CRF 17 yuv420p faststart
  - Silent (operator drops the audio track in post — visual hits land at
    the documented V40 timestamps so any cinematic track with the same
    hit pattern will sync)
  - Output: out/greenteam-thumb-60fps.mp4

NOTHING about the V40 architecture is changed. Only the swappable
"CONTENT BRIEF" block (palette, brand copy, hooks) is overridden.
"""
from __future__ import annotations

import io
import math
import random
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import cairosvg
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent
LOGO_SVG = REPO / "public" / "logo-the-green-team-original.svg"

OUT_DIR = REPO / "out"
FRAMES_DIR = OUT_DIR / "frames_gt-thumb-v40"
SILENT_MP4 = OUT_DIR / "greenteam-thumb-60fps.mp4"

# ─── CANVAS + TIMING (V40 §2) ───────────────────────────────────────────
W, H = 1080, 1920
FPS = 60
TOTAL_S = 22.0
N_FRAMES = int(TOTAL_S * FPS)  # 1320
CENTER_X = W // 2          # 540
MARK_CY = H // 2 - 60       # 900 — mark anchor above geometric center

# ─── PALETTE (V40 §7 override for Green Team) ───────────────────────────
INK    = "#1a2410"   # deep olive ground (was #070A09)
PAPER  = "#faf9f6"   # cream type
GT_1   = "#dcd5b8"   # softest cream-gold highlight (was MINT_1 #DCFCEC)
GT_2   = "#c8a951"   # gold-light — bright accent  (was MINT_2)
GT_3   = "#a3b18a"   # sage — core brand           (was MINT_3)
GT_4   = "#4a5c3d"   # deep sage shadow            (was MINT_4)
GHOST  = "rgba(250,249,246,0.55)"

# Audio hit grid — visual phase boundaries land on these timestamps (V40 §3)
AUDIO_HITS = [1.90, 5.75, 9.60, 13.45, 15.40, 18.60]

# ─── CONTENT BRIEF (V40 §7) ────────────────────────────────────────────
BRAND_NAME       = "THE GREEN TEAM"
TAGLINE_KICKER   = "WE CURATE FOREST-ADJACENT"
TAGLINE_MAIN     = "sanctuaries."          # italic, gold gradient
SIGNATURE        = "EDITORIAL REAL ESTATE — HYDERABAD · thegreenteam.in"

HOOK_1 = "FORESTS DON'T STAY BY ACCIDENT."
HOOK_2_LEFT  = "THEY'RE"
HOOK_2_RIGHT = "curated."   # italic + gold gradient
HOOK_3 = "ONE SANCTUARY AT A TIME."

# ─── FONTS ─────────────────────────────────────────────────────────────
# V40 calls for Plus Jakarta Sans + JetBrains Mono. Falling back to
# Inter Display / Caladea / DejaVu chain so it renders even without
# the canonical fonts installed.
FONT_DISPLAY = "'Plus Jakarta Sans', 'Inter Display', 'Inter', 'DejaVu Sans', sans-serif"
FONT_MONO    = "'JetBrains Mono', 'DejaVu Sans Mono', monospace"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"


# ─── EASING ────────────────────────────────────────────────────────────
def clamp(v, lo=0.0, hi=1.0):
    return max(lo, min(hi, v))


def smoothstep(edge0, edge1, x):
    t = clamp((x - edge0) / max(edge1 - edge0, 1e-9))
    return t * t * (3 - 2 * t)


def ease_out_cubic(t):
    t = clamp(t)
    return 1 - (1 - t) ** 3


def ease_in_out_cubic(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def ease_out_back(t, s=1.70158):
    t = clamp(t) - 1.0
    return t * t * ((s + 1) * t + s) + 1.0


# ─── M_TARGETS extracted from the Green Team leaf SVG ───────────────────
def extract_m_targets(n_targets: int = 392) -> list[tuple[float, float]]:
    """Rasterize the leaf monogram (without its background) and sample
    n_targets foreground points uniformly. These are the coalesce targets
    the particles fly to at HIT 3."""
    svg = LOGO_SVG.read_text()
    # Strip background rect so the leaf renders on transparent canvas
    svg_no_bg = svg.replace(
        '<rect width="100" height="100" rx="20" class="bg"/>', ""
    )
    # Render at a comfortable resolution for sampling
    raster_size = 720
    png_bytes = cairosvg.svg2png(
        bytestring=svg_no_bg.encode(),
        output_width=raster_size, output_height=raster_size,
    )
    im = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    arr = np.array(im)
    alpha = arr[..., 3]
    ys, xs = np.where(alpha > 64)
    if len(xs) < n_targets:
        raise RuntimeError(f"Only {len(xs)} foreground pixels — need {n_targets}")
    # Uniform stride sample
    idx = np.linspace(0, len(xs) - 1, n_targets).astype(int)
    sx = xs[idx].astype(np.float32)
    sy = ys[idx].astype(np.float32)
    # Normalise to [-1, 1] then scale to the leaf draw size on canvas
    cx, cy = raster_size / 2, raster_size / 2
    sx = (sx - cx) / cx
    sy = (sy - cy) / cy
    # Final canvas size for the leaf mark
    leaf_w, leaf_h = 380, 460   # leaf footprint in canvas px
    targets = [
        (CENTER_X + float(x) * leaf_w / 2,
         MARK_CY  + float(y) * leaf_h / 2)
        for x, y in zip(sx, sy)
    ]
    return targets


M_TARGETS = extract_m_targets(392)


# ─── PARTICLE SYSTEM (V40 §4) ──────────────────────────────────────────
N_LATTICE_COLS = 14
N_LATTICE_ROWS = 28
N_PARTICLES = N_LATTICE_COLS * N_LATTICE_ROWS  # 392
SPACING_X = 64
SPACING_Y = 50


@dataclass
class P:
    x: float
    y: float
    z: float
    home_x: float
    home_y: float
    tx: float
    ty: float
    born_t: float
    seed: float


def init_particles(rng: random.Random) -> list[P]:
    parts: list[P] = []
    # Build the lattice (square grid, no hex offset — perfect mirror symmetry)
    x0 = CENTER_X - (N_LATTICE_COLS - 1) * SPACING_X / 2
    y0 = MARK_CY  - (N_LATTICE_ROWS - 1) * SPACING_Y / 2
    raw = []
    for r in range(N_LATTICE_ROWS):
        for c in range(N_LATTICE_COLS):
            x = x0 + c * SPACING_X
            y = y0 + r * SPACING_Y
            z = rng.uniform(-0.20, 0.20)
            raw.append((x, y, z))

    # Birth schedule — sort by distance from MARK_CY (radial wavefront)
    raw_with_d = sorted(
        enumerate(raw),
        key=lambda kv: math.hypot(kv[1][0] - CENTER_X, kv[1][1] - MARK_CY),
    )
    birth = [0.0] * len(raw)
    for rank, (i, _) in enumerate(raw_with_d):
        u = rank / max(len(raw) - 1, 1)
        birth[i] = 1.95 + u * 3.80    # all born by ~5.75s (HIT 2)

    # Proximity-matched M coalesce — greedy nearest-neighbour 1:1
    unclaimed = set(range(len(M_TARGETS)))
    pair = [None] * len(raw)
    # Sort particles also by distance to mark center for stable assignment
    order = sorted(range(len(raw)),
                   key=lambda i: math.hypot(raw[i][0] - CENTER_X, raw[i][1] - MARK_CY))
    for i in order:
        px, py, _ = raw[i]
        best_j, best_d = -1, float("inf")
        for j in unclaimed:
            tx, ty = M_TARGETS[j]
            d = (tx - px) ** 2 + (ty - py) ** 2
            if d < best_d:
                best_d, best_j = d, j
        pair[i] = best_j
        unclaimed.discard(best_j)

    for i, (x, y, z) in enumerate(raw):
        tx, ty = M_TARGETS[pair[i]]
        parts.append(P(
            x=x, y=y, z=z,
            home_x=x, home_y=y,
            tx=tx, ty=ty,
            born_t=birth[i],
            seed=rng.random(),
        ))
    return parts


# Per-frame particle state (computed live from home + breath + coalesce)
def particle_state(p: P, t: float) -> tuple[float, float, float, float]:
    """Return (x, y, alpha, scale) for particle p at time t."""
    if t < p.born_t:
        return p.home_x, p.home_y, 0.0, 0.0

    # Birth pop (squash & stretch happens in render — return scale here)
    age = t - p.born_t
    born_a = clamp(age / 0.30)           # alpha fade-in over 0.3s
    bloom = 1.0 + max(0.0, 1 - age / 0.45) * 1.6   # scale pop, settles by 0.45s

    # Breath drift (5.75 → 9.60) — small bobs around home
    if 5.75 <= t < 9.60:
        u = (t - 5.75) / (9.60 - 5.75)
        wob = 6 * math.sin(2 * math.pi * (u + p.seed))
        x = p.home_x + wob * math.cos(p.seed * 6.28)
        y = p.home_y + wob * math.sin(p.seed * 6.28)
    else:
        x, y = p.home_x, p.home_y

    # COALESCE 9.60 → 13.45 — fly to M target
    if 9.60 <= t < 13.45:
        u = clamp((t - 9.60) / (13.45 - 9.60))
        u_eased = ease_in_out_cubic(u)
        x = p.home_x + (p.tx - p.home_x) * u_eased
        y = p.home_y + (p.ty - p.home_y) * u_eased
    elif t >= 13.45:
        # Locked into the M after landing
        x, y = p.tx, p.ty

    # Z-projection — closer dots are bigger + brighter
    proj_scale = 1.0 + p.z * 0.6           # 0.88 .. 1.12
    return x, y, born_a, proj_scale * bloom


def particle_color(p: P) -> tuple[str, str]:
    """Return (fill, highlight) based on z-tier."""
    if p.z > 0.2:
        return GT_2, GT_1     # closest, brightest (gold)
    if p.z > -0.2:
        return GT_3, GT_2     # mid (sage)
    return GT_4, GT_3         # deepest (dark sage)


# ─── HOOK BUBBLE-GAP BBOX ──────────────────────────────────────────────
HOOK_WINDOWS = [
    # (start, end, x_l, x_r, y_h)  asymmetric bboxes for hook 2 emphasis
    (1.90, 5.40,  -520, 520, 75),
    (5.75, 9.40,  -400, 620, 90),
    (9.60, 11.30, -480, 480, 75),
]


def hook_gap_bbox(t: float) -> Optional[tuple[float, float, float, float, float]]:
    """Return (x0, y0, x1, y1, alpha_factor) for the currently visible hook
    bbox, or None when no hook is on screen. Alpha factor is the strength
    of the lattice opacity reduction inside the rect."""
    for start, end, xl, xr, yh in HOOK_WINDOWS:
        if start <= t < end:
            # Fade alpha factor in and out at the edges of the window
            fade_in = clamp((t - start) / 0.35)
            fade_out = 1 - clamp((t - (end - 0.35)) / 0.35)
            a = fade_in * fade_out
            HOOK_Y = MARK_CY  # 900
            return (CENTER_X + xl, HOOK_Y - yh,
                    CENTER_X + xr, HOOK_Y + yh,
                    a)
    return None


# ─── CAMERA STATE (V40 §5) ─────────────────────────────────────────────
def camera_state(t: float) -> tuple[float, float, float]:
    """Return (scale, tx, ty) per frame. Subtle pushes/pulls per phase."""
    if t < 1.9:
        u = t / 1.9
        return (1.0 + 0.02 * u, 0, 0)
    if t < 5.75:
        u = (t - 1.9) / (5.75 - 1.9)
        return (1.02 + (0.96 - 1.02) * ease_in_out_cubic(u), 0, 0)
    if t < 9.60:
        u = (t - 5.75) / (9.60 - 5.75)
        return (0.96 + (0.98 - 0.96) * u, 0, 0)
    if t < 13.45:
        u = (t - 9.60) / (13.45 - 9.60)
        return (0.98 + (1.05 - 0.98) * ease_in_out_cubic(u), 0, 0)
    if t < 18.60:
        u = (t - 13.45) / (18.60 - 13.45)
        return (1.05 + (1.0 - 1.05) * ease_out_cubic(u), 0, 0)
    return (1.0, 0, 0)


def vignette_strength(t: float) -> float:
    if t < 1.9:   return 0.70
    if t < 5.75:  return 0.40
    if t < 9.60:  return 0.42
    if t < 13.45: return 0.50
    if t < 15.40: return 0.65
    if t < 18.60: return 0.55
    return 0.72


# ─── SVG RENDER PRIMITIVES ─────────────────────────────────────────────
def esc(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
              .replace('"', "&quot;").replace("'", "&apos;"))


def svg_text(text, x, y, size, *, fill=PAPER, font=FONT_DISPLAY,
             weight=900, anchor="middle", letter_spacing=0.0,
             font_style="normal", opacity=1.0):
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="{font}" font-weight="{weight}" font-size="{size}" '
        f'font-style="{font_style}" letter-spacing="{letter_spacing}" '
        f'fill="{fill}" opacity="{opacity:.3f}">{esc(text)}</text>'
    )


def render_atmosphere(t: float) -> str:
    """5 large soft sage-fog circles drifting slowly. Always present;
    fades during the lattice reveal so the dots stay readable."""
    fog_alpha = 0.18
    if t < 1.9:
        fog_alpha = 0.30
    elif t < 13.45:
        fog_alpha = 0.18
    else:
        fog_alpha = 0.12
    blobs = []
    for i in range(5):
        cx = CENTER_X + 320 * math.cos(t * 0.20 + i * 1.3)
        cy = MARK_CY + 240 * math.sin(t * 0.16 + i * 1.7)
        r = 320 + 60 * math.sin(t * 0.5 + i)
        col = [GT_4, GT_3, GT_2, GT_3, GT_4][i]
        blobs.append(
            f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.0f}" '
            f'fill="{col}" opacity="{fog_alpha:.3f}" filter="url(#softblur)"/>'
        )
    return "".join(blobs)


def render_god_ray(t: float) -> str:
    """4 angled sage shafts + 1 wide central beam. Window 12.5–16.0,
    peak at HIT 4 (13.45)."""
    if t < 12.5 or t > 16.0:
        return ""
    u = clamp((t - 12.5) / (13.45 - 12.5))
    fade = u if t < 13.45 else 1 - clamp((t - 13.45) / (16.0 - 13.45))
    alpha = 0.55 * fade
    cx, cy = CENTER_X, MARK_CY
    shafts = []
    for ang_deg in (-22, -8, 8, 22):
        ang = math.radians(ang_deg + 270)  # downward beam at +/-
        # A long thin polygon emanating from above the mark
        length = 1400
        width = 60
        x_top = cx + math.cos(ang) * length
        y_top = cy + math.sin(ang) * length
        # perpendicular offsets at the mark side
        px = -math.sin(ang) * width
        py = math.cos(ang) * width
        pts = [
            (cx - px, cy - py),
            (cx + px, cy + py),
            (x_top + px * 0.2, y_top + py * 0.2),
            (x_top - px * 0.2, y_top - py * 0.2),
        ]
        d = "M" + " L".join(f"{x:.1f},{y:.1f}" for x, y in pts) + " Z"
        shafts.append(
            f'<path d="{d}" fill="{GT_2}" opacity="{alpha * 0.5:.3f}" '
            f'filter="url(#softblur)"/>'
        )
    # Wide central beam
    beam_w = 220
    shafts.append(
        f'<rect x="{cx-beam_w/2:.1f}" y="0" width="{beam_w}" height="{cy:.0f}" '
        f'fill="url(#beamGrad)" opacity="{alpha:.3f}"/>'
    )
    return "".join(shafts)


def render_shockwave(t: float) -> str:
    """2 concentric sage rings scaling outward, fired 0.7s after each hit."""
    out = []
    for hit in AUDIO_HITS:
        dt = t - hit
        if 0 < dt < 0.7:
            for offset, ring_color, base_alpha in [(0, GT_2, 0.6), (0.08, GT_3, 0.4)]:
                rt = dt - offset
                if rt <= 0:
                    continue
                u = clamp(rt / 0.7)
                r = 40 + u * 520
                a = base_alpha * (1 - u)
                out.append(
                    f'<circle cx="{CENTER_X}" cy="{MARK_CY}" r="{r:.0f}" '
                    f'fill="none" stroke="{ring_color}" stroke-width="4" '
                    f'opacity="{a:.3f}"/>'
                )
    return "".join(out)


def render_lens_flare(t: float) -> str:
    """Horizontal sage band sweeping across canvas, fired 0.4s after each hit."""
    out = []
    for hit in AUDIO_HITS:
        dt = t - hit
        if 0 < dt < 1.0:
            u = clamp(dt / 1.0)
            cx = -200 + u * (W + 400)
            alpha = 0.55 * (1 - u) * smoothstep(0.0, 0.2, u)
            out.append(
                f'<rect x="{cx-180}" y="{MARK_CY-30}" width="360" height="60" '
                f'fill="{GT_1}" opacity="{alpha:.3f}" filter="url(#softblur)"/>'
            )
    return "".join(out)


def render_particles(t: float, particles: list[P]) -> str:
    """The 392 dots + their highlights, with hook bubble-gap masking."""
    gap = hook_gap_bbox(t)
    out = []
    for p in particles:
        x, y, alpha, scale = particle_state(p, t)
        if alpha <= 0.01 or scale <= 0.01:
            continue
        # Bubble-gap mask
        if gap is not None:
            gx0, gy0, gx1, gy1, gap_a = gap
            # Compute normalised distance from rect center
            cx_b = (gx0 + gx1) / 2
            cy_b = (gy0 + gy1) / 2
            hw = (gx1 - gx0) / 2
            hh = (gy1 - gy0) / 2
            nx = abs(x - cx_b) / max(hw, 1)
            ny = abs(y - cy_b) / max(hh, 1)
            edge = max(nx, ny)
            inside = 1 - smoothstep(0.92, 1.05, edge)
            alpha *= (1 - inside * gap_a)
            if alpha <= 0.01:
                continue

        fill, hl = particle_color(p)
        r = 8.5 * scale
        out.append(
            f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{r:.2f}" '
            f'fill="{fill}" opacity="{alpha:.3f}"/>'
        )
        # Specular highlight — suppressed during/after COALESCE so the M is clean
        if t < 9.5:
            hl_r = max(r * 0.30, 1.2)
            hl_alpha = alpha * 0.85
            out.append(
                f'<circle cx="{x - r*0.35:.1f}" cy="{y - r*0.35:.1f}" '
                f'r="{hl_r:.2f}" fill="{hl}" opacity="{hl_alpha:.3f}"/>'
            )
    return "".join(out)


def render_mark(t: float) -> str:
    """Disc + leaf monogram + outer glow. Disc fills at HIT 4 (13.45),
    stroke draws, leaf settles. Rises slightly during NAME phase."""
    if t < 12.0:
        return ""
    # Land phase 12.0 → 13.45
    if t < 13.45:
        u = clamp((t - 12.0) / (13.45 - 12.0))
        disc_r = 220 * ease_out_cubic(u)
        disc_alpha = 0.0
        leaf_alpha = 0.0
    elif t < 15.40:
        # Disc fills, stroke draws, leaf settles
        u = clamp((t - 13.45) / (15.40 - 13.45))
        disc_r = 220
        disc_alpha = 0.55 * ease_out_cubic(u)
        leaf_alpha = ease_out_cubic(u)
    elif t < 18.60:
        # NAME phase — mark rises slightly
        u = clamp((t - 15.40) / (18.60 - 15.40))
        disc_r = 220 - 8 * u
        disc_alpha = 0.55 - 0.10 * u
        leaf_alpha = 1.0
    else:
        # Hold
        disc_r = 212
        disc_alpha = 0.45
        leaf_alpha = 1.0

    # Slight rise during NAME for the editorial layout
    rise = -50 * smoothstep(15.40, 17.0, t)
    cx, cy = CENTER_X, MARK_CY + rise

    parts = []
    # Outer glow
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="{disc_r + 80}" '
        f'fill="url(#markGlow)" opacity="{disc_alpha * 0.6:.3f}"/>'
    )
    # Disc
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="{disc_r}" '
        f'fill="{GT_4}" opacity="{disc_alpha:.3f}" '
        f'stroke="{GT_2}" stroke-width="4" stroke-opacity="{disc_alpha + 0.2:.3f}"/>'
    )
    # The leaf monogram — embed the SVG as an <image> data URI
    leaf_size = 380
    leaf_x = cx - leaf_size / 2
    leaf_y = cy - leaf_size / 2
    # Use the bare-leaf (no background) variant
    svg_text = LOGO_SVG.read_text().replace(
        '<rect width="100" height="100" rx="20" class="bg"/>', ""
    )
    import base64
    b64 = base64.b64encode(svg_text.encode()).decode()
    parts.append(
        f'<image x="{leaf_x:.1f}" y="{leaf_y:.1f}" '
        f'width="{leaf_size}" height="{leaf_size}" opacity="{leaf_alpha:.3f}" '
        f'href="data:image/svg+xml;base64,{b64}"/>'
    )
    return "".join(parts)


def render_hook(t: float) -> str:
    """3 editorial subtitle hooks — each locked to an audio hit."""
    HOOK_Y = MARK_CY  # 900
    out = []

    # Hook 1: BRANDS DON'T COMPOUND BY ACCIDENT.
    if 1.90 <= t < 5.40:
        u = (t - 1.90) / 0.6
        fade = clamp(u) if t < 5.05 else 1 - clamp((t - 5.05) / 0.35)
        # letter-spacing settles 0.30 → 0.10em over the window
        ls = 0.30 - 0.20 * clamp((t - 1.90) / 2.0)
        out.append(svg_text(
            HOOK_1, CENTER_X, HOOK_Y + 8, 42, fill=PAPER,
            font=FONT_MONO, weight=700,
            letter_spacing=f"{ls:.3f}em",
            opacity=fade,
        ))

    # Hook 2: THEY'RE [italic] curated.
    if 5.75 <= t < 9.40:
        u = (t - 5.75) / 0.6
        fade = clamp(u) if t < 9.05 else 1 - clamp((t - 9.05) / 0.35)
        # scale-punch on entry
        scale_pop = 1.0 + 0.06 * (1 - clamp((t - 5.75) / 0.5))
        # split layout — left "THEY'RE" caps, right "curated." italic gradient
        left_x = CENTER_X - 200
        right_x = CENTER_X - 120
        out.append(
            f'<g transform="translate({CENTER_X},{HOOK_Y}) scale({scale_pop:.3f}) translate({-CENTER_X},{-HOOK_Y})" '
            f'opacity="{fade:.3f}">'
            f'{svg_text(HOOK_2_LEFT, left_x, HOOK_Y + 8, 64, fill=PAPER, font=FONT_DISPLAY, weight=900, anchor="end", letter_spacing="-0.02em")}'
            f'{svg_text(HOOK_2_RIGHT, right_x, HOOK_Y + 12, 80, fill="url(#goldGrad)", font=FONT_DISPLAY, weight=700, anchor="start", font_style="italic", letter_spacing="-0.02em")}'
            f'</g>'
        )

    # Hook 3: ONE SANCTUARY AT A TIME.  (with mint accent dot — gold here)
    if 9.60 <= t < 11.30:
        u = (t - 9.60) / 0.5
        fade = clamp(u) if t < 11.0 else 1 - clamp((t - 11.0) / 0.3)
        ls = 0.18 - 0.10 * clamp((t - 9.60) / 1.0)
        out.append(svg_text(
            HOOK_3, CENTER_X, HOOK_Y + 8, 48,
            fill=PAPER, font=FONT_DISPLAY, weight=900,
            letter_spacing=f"{ls:.3f}em", opacity=fade,
        ))
        # accent dot
        dot_a = fade * clamp((t - 9.85) / 0.3)
        out.append(
            f'<circle cx="{CENTER_X}" cy="{HOOK_Y + 45}" r="6" '
            f'fill="{GT_2}" opacity="{dot_a:.3f}"/>'
        )
    return "".join(out)


def render_chyron(t: float) -> str:
    """01/02/03 phase label upper-left."""
    windows = [("01", 1.50, 5.40), ("02", 5.55, 9.40), ("03", 9.45, 11.30)]
    for label, start, end in windows:
        if start <= t < end:
            fade_in = clamp((t - start) / 0.3)
            fade_out = 1 - clamp((t - (end - 0.3)) / 0.3)
            a = fade_in * fade_out
            x = 90
            y = 270
            # Underline rule draws across as the chyron enters
            rule_u = clamp((t - start) / 0.6)
            rule_w = 88 * rule_u
            return (
                f'<g opacity="{a:.3f}">'
                f'{svg_text("PHASE", x, y, 22, fill=PAPER, font=FONT_MONO, weight=700, anchor="start", letter_spacing="0.18em")}'
                f'{svg_text(label, x, y + 100, 110, fill=PAPER, font=FONT_DISPLAY, weight=900, anchor="start", letter_spacing="-0.05em")}'
                f'<line x1="{x}" y1="{y + 124}" x2="{x + rule_w:.0f}" y2="{y + 124}" '
                f'stroke="{GT_2}" stroke-width="4" stroke-linecap="round"/>'
                f'</g>'
            )
    return ""


def render_shot_text(t: float) -> str:
    """Brand-reveal stack after the mark lands."""
    if t < 14.0:
        return ""
    out = []
    # Above the mark — kicker
    kicker_a = clamp((t - 15.55) / 0.5)
    if kicker_a > 0:
        out.append(svg_text(
            TAGLINE_KICKER, CENTER_X, MARK_CY - 380, 28,
            fill=GT_3, font=FONT_MONO, weight=700,
            letter_spacing="0.30em", opacity=kicker_a,
        ))

    # Below the mark — BRAND wordmark (settles on HIT 5 = 15.40s)
    word_a = clamp((t - 15.05) / 0.6)
    if word_a > 0:
        u = clamp((t - 15.05) / 0.9)
        ls = 0.45 - 0.39 * ease_out_cubic(u)  # 0.45 → 0.06em
        out.append(svg_text(
            BRAND_NAME, CENTER_X, MARK_CY + 280, 82,
            fill=PAPER, font=FONT_DISPLAY, weight=900,
            letter_spacing=f"{ls:.3f}em", opacity=word_a,
        ))

    # Italic gradient verb — pulses on HIT 6 (18.60)
    verb_a = clamp((t - 18.20) / 0.45)
    if verb_a > 0:
        # Pulse animation on the hit
        dt = t - 18.60
        pulse = 1.0
        if -0.1 <= dt <= 0.4:
            pulse = 1.0 + 0.10 * (1 - clamp(dt / 0.4))
        out.append(
            f'<g transform="translate({CENTER_X},{MARK_CY + 380}) scale({pulse:.3f}) '
            f'translate({-CENTER_X},{-(MARK_CY + 380)})">'
            f'{svg_text(TAGLINE_MAIN, CENTER_X, MARK_CY + 400, 96, fill="url(#goldGrad)", font=FONT_DISPLAY, weight=700, font_style="italic", letter_spacing="-0.03em", opacity=verb_a)}'
            f'</g>'
        )

    # Signature line with cursor
    sig_a = clamp((t - 19.5) / 0.5)
    if sig_a > 0:
        # Blinking cursor
        cursor_on = int((t - 19.5) * 2) % 2 == 0
        cursor = " |" if cursor_on and t < 21.0 else "  "
        out.append(svg_text(
            SIGNATURE + cursor, CENTER_X, MARK_CY + 500, 22,
            fill=GT_3, font=FONT_MONO, weight=700,
            letter_spacing="0.18em", opacity=sig_a,
        ))
    return "".join(out)


def render_thumbnail_overlay(t: float) -> str:
    """Held brand poster on the first frame; fades out 0.6 → 1.85s."""
    if t > 1.85:
        return ""
    if t < 0.6:
        a = 1.0
    else:
        a = 1 - clamp((t - 0.6) / 1.25)
    if a < 0.01:
        return ""

    out = []
    # Leaf mark large, centered
    leaf_size = 280
    cx, cy = CENTER_X, MARK_CY
    svg_text_str = LOGO_SVG.read_text().replace(
        '<rect width="100" height="100" rx="20" class="bg"/>', ""
    )
    import base64
    b64 = base64.b64encode(svg_text_str.encode()).decode()
    out.append(
        f'<image x="{cx - leaf_size/2:.1f}" y="{cy - leaf_size/2 - 40:.1f}" '
        f'width="{leaf_size}" height="{leaf_size}" opacity="{a:.3f}" '
        f'href="data:image/svg+xml;base64,{b64}"/>'
    )
    # Brand name
    out.append(svg_text(
        BRAND_NAME, cx, cy + 220, 76,
        fill=PAPER, font=FONT_DISPLAY, weight=900,
        letter_spacing="-0.02em", opacity=a,
    ))
    # Tagline
    out.append(svg_text(
        "where the forest stays.", cx, cy + 290, 36,
        fill=GT_2, font=FONT_SERIF, weight=400, font_style="italic", opacity=a,
    ))
    # Signature
    out.append(svg_text(
        SIGNATURE, cx, cy + 400, 22,
        fill=GT_3, font=FONT_MONO, weight=700,
        letter_spacing="0.18em", opacity=a,
    ))
    return "".join(out)


# ─── FRAME COMPOSER ────────────────────────────────────────────────────
def render_frame(t: float, particles: list[P]) -> str:
    sc, tx, ty = camera_state(t)
    vig = vignette_strength(t)
    fade = 1 - clamp((t - 21.4) / 0.6)  # final ink fade 21.4 → 22.0

    # Inner content rendered with camera transform
    content = (
        render_atmosphere(t)
        + render_god_ray(t)
        + render_particles(t, particles)
        + render_mark(t)
        + render_shockwave(t)
        + render_lens_flare(t)
    )

    overlays = (
        render_hook(t)
        + render_chyron(t)
        + render_shot_text(t)
        + render_thumbnail_overlay(t)
    )

    # SVG defs (gradients, filters) — present every frame
    defs = (
        f'<defs>'
        f'<filter id="softblur" x="-50%" y="-50%" width="200%" height="200%">'
        f'<feGaussianBlur in="SourceGraphic" stdDeviation="40"/></filter>'
        f'<linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_1}"/>'
        f'<stop offset="0.5" stop-color="{GT_2}"/>'
        f'<stop offset="1" stop-color="{GT_3}"/>'
        f'</linearGradient>'
        f'<linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">'
        f'<stop offset="0" stop-color="{GT_1}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{GT_2}" stop-opacity="0.9"/>'
        f'</linearGradient>'
        f'<radialGradient id="markGlow" cx="0.5" cy="0.5" r="0.5">'
        f'<stop offset="0" stop-color="{GT_2}" stop-opacity="0.9"/>'
        f'<stop offset="1" stop-color="{GT_2}" stop-opacity="0"/>'
        f'</radialGradient>'
        f'<radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">'
        f'<stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{INK}" stop-opacity="{vig:.3f}"/>'
        f'</radialGradient>'
        f'</defs>'
    )

    return (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'{defs}'
        f'<rect width="{W}" height="{H}" fill="{INK}"/>'
        # Camera transform on the content layer
        f'<g transform="translate({CENTER_X},{MARK_CY}) scale({sc:.4f}) '
        f'translate({-CENTER_X + tx},{-MARK_CY + ty})">'
        f'{content}'
        f'</g>'
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        f'{overlays}'
        f'<rect width="{W}" height="{H}" fill="{INK}" opacity="{(1-fade):.3f}"/>'
        f'</svg>'
    )


# ─── MAIN ──────────────────────────────────────────────────────────────
def main():
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(7)
    particles = init_particles(rng)
    print(f"[gt-thumb-v40] {N_FRAMES} frames @ {FPS}fps · {TOTAL_S}s · "
          f"{len(particles)} particles · {len(M_TARGETS)} M-targets")

    t0 = time.time()
    for i in range(N_FRAMES):
        t = i / FPS
        svg = render_frame(t, particles)
        png_bytes = cairosvg.svg2png(
            bytestring=svg.encode("utf-8"),
            output_width=W, output_height=H,
        )
        # Save as JPEG (faster + smaller; quality 92 is visually lossless
        # at 1080×1920 for this content)
        im = Image.open(io.BytesIO(png_bytes)).convert("RGB")
        im.save(FRAMES_DIR / f"f{i:05d}.jpg", format="JPEG", quality=92,
                optimize=False)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")

    print(f"[render] done in {time.time()-t0:.0f}s")

    # Mux — silent (no canonical audio file in repo; operator drops their
    # track in post; visual hits land at the V40 timestamps).
    cmd = [
        "ffmpeg", "-y", "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "f%05d.jpg"),
        "-an",
        "-c:v", "libx264", "-preset", "slow", "-crf", "17",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-t", str(TOTAL_S),
        str(SILENT_MP4),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[done] {SILENT_MP4}")


if __name__ == "__main__":
    main()
