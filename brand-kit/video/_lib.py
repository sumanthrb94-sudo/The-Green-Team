"""
Brand Mint Studios — Green Team sub-brand video render library.

Implements the v21-empires-beast system per AI-VIDEO-GENERATION-BRIEF.md:
  - 1080x1920 @ 60fps, 15-17s @ 120 BPM (canonical)
  - MrBeast retention mechanics (flashes, shake, arrows, circles, fast cuts)
  - Brand Mint editorial palette (mints + ink + paper)
  - Voiceless. Music + on-screen type only.

Output is per-frame SVG -> cairosvg PNG -> ffmpeg H.264 mux.

Fonts: Plus Jakarta Sans ExtraBold / Bold, JetBrains Mono Bold.
  If the canonical fonts are not present on the render host, the renderer
  falls back to DejaVu Sans / DejaVu Sans Mono (system bold sans + mono).
  NEVER falls back to a serif family.
"""
from __future__ import annotations

import math
import os
import random
import subprocess
import wave
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Iterable

import cairosvg
import numpy as np

# ─── Canvas ──────────────────────────────────────────────────────────────
W = 1080
H = 1920
FPS = 60
SAFE_TEXT_W = 960   # 60px left/right margin
SAFE_TOP = 240
SAFE_BOTTOM = 480
CX = W // 2
CY = H // 2

# ─── Brand Mint palette (hard-coded canon) ───────────────────────────────
BEAST_BLACK = "#070A09"
BEAST_WHITE = "#F5F1EA"
BEAST_YELLOW = "#7CF6C8"   # mint-2 — accent
BEAST_RED = "#10B981"      # mint-3 — primary brand mint
BEAST_GREEN = "#047857"    # mint-4 — deep accent, winner reveal

# ─── Fonts ───────────────────────────────────────────────────────────────
# cairosvg uses the system font resolver. We declare canonical first; if
# the system lacks them, fontconfig substitutes a sans family (never serif
# because we never name a serif). DejaVu is the documented fallback.
FONT_DISPLAY = "'Plus Jakarta Sans', 'DejaVu Sans', sans-serif"
FONT_BODY = "'Plus Jakarta Sans', 'DejaVu Sans', sans-serif"
FONT_MONO = "'JetBrains Mono', 'DejaVu Sans Mono', monospace"


# ─── Easing ──────────────────────────────────────────────────────────────
def clamp(v: float, lo: float = 0.0, hi: float = 1.0) -> float:
    return max(lo, min(hi, v))


def ease_out_back(t: float, s: float = 1.70158) -> float:
    t = clamp(t)
    t -= 1.0
    return t * t * ((s + 1) * t + s) + 1.0


def ease_out_cubic(t: float) -> float:
    t = clamp(t)
    return 1.0 - (1.0 - t) ** 3


def ease_in_cubic(t: float) -> float:
    t = clamp(t)
    return t ** 3


def ease_in_out_cubic(t: float) -> float:
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


# ─── Beat grid ───────────────────────────────────────────────────────────
@dataclass
class Beat:
    """A single beat boundary. Time in seconds."""
    t: float
    is_impact: bool = False  # triggers camera shake


def beat_grid(bpm: int, total_s: float) -> list[Beat]:
    """Generate every beat boundary across the timeline."""
    beat_s = 60.0 / bpm
    n = int(total_s / beat_s) + 1
    return [Beat(t=i * beat_s) for i in range(n)]


# ─── Frame primitives ────────────────────────────────────────────────────
def shake_offset(t: float, beats: list[Beat], window_s: float = 0.08,
                 amplitude: float = 8.0, seed: int = 0) -> tuple[float, float]:
    """Camera shake — fires for ~80ms after every impact beat."""
    for b in beats:
        if b.is_impact and 0.0 <= t - b.t <= window_s:
            decay = 1.0 - (t - b.t) / window_s
            rng = random.Random(int((b.t + seed) * 10000))
            return (
                (rng.random() * 2 - 1) * amplitude * decay,
                (rng.random() * 2 - 1) * amplitude * decay,
            )
    return (0.0, 0.0)


def flash_alpha(t: float, beats: list[Beat], window_s: float = 0.05) -> float:
    """White-flash overlay alpha — 1-2 frames of pure white at every beat boundary."""
    for b in beats:
        dt = t - b.t
        if 0.0 <= dt <= window_s:
            return 1.0 - (dt / window_s)
    return 0.0


# ─── SVG fragment helpers ────────────────────────────────────────────────
def svg_text(text: str, x: float, y: float, size: float, *,
             fill: str = BEAST_BLACK, stroke: str | None = None,
             stroke_w: float = 0.0, font: str = FONT_DISPLAY,
             weight: int = 900, anchor: str = "middle",
             letter_spacing: float = -2.0) -> str:
    """Stroked + filled headline text."""
    stroke_attr = ""
    if stroke and stroke_w > 0:
        stroke_attr = (
            f' stroke="{stroke}" stroke-width="{stroke_w}" '
            f'stroke-linejoin="round" paint-order="stroke fill"'
        )
    return (
        f'<text x="{x}" y="{y}" text-anchor="{anchor}" '
        f'font-family="{font}" font-weight="{weight}" font-size="{size}" '
        f'letter-spacing="{letter_spacing}" fill="{fill}"{stroke_attr}>'
        f'{escape(text)}</text>'
    )


def escape(s: str) -> str:
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
              .replace('"', "&quot;").replace("'", "&apos;"))


def fit_to_width(text: str, max_w_px: float, start_pt: float,
                 floor_pt: float = 22, char_ratio: float = 0.55) -> float:
    """Crude width fit — shrink font until estimated width fits SAFE_TEXT_W.

    char_ratio approximates average glyph width / em for an ExtraBold sans.
    """
    pt = start_pt
    while pt > floor_pt and len(text) * pt * char_ratio > max_w_px:
        pt -= 1
    return pt


def hand_arrow(x1: float, y1: float, x2: float, y2: float,
               color: str = BEAST_RED, stroke_w: float = 12,
               wobble: float = 18.0, seed: int = 0) -> str:
    """Sketchy hand-drawn bezier arrow with imperfect head."""
    rng = random.Random(seed)
    # control points biased perpendicular to the line for a curve
    mx, my = (x1 + x2) / 2, (y1 + y2) / 2
    dx, dy = x2 - x1, y2 - y1
    L = math.hypot(dx, dy) or 1.0
    nx, ny = -dy / L, dx / L
    bulge = (rng.random() * 2 - 1) * wobble + L * 0.18
    c1x, c1y = mx + nx * bulge + (rng.random() - 0.5) * wobble, my + ny * bulge + (rng.random() - 0.5) * wobble
    # arrowhead
    ang = math.atan2(y2 - c1y, x2 - c1x)
    h = 38
    spread = 0.55
    hx1 = x2 - h * math.cos(ang - spread)
    hy1 = y2 - h * math.sin(ang - spread)
    hx2 = x2 - h * math.cos(ang + spread)
    hy2 = y2 - h * math.sin(ang + spread)
    return (
        f'<path d="M{x1:.1f},{y1:.1f} Q{c1x:.1f},{c1y:.1f} {x2:.1f},{y2:.1f}" '
        f'fill="none" stroke="{color}" stroke-width="{stroke_w}" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
        f'<path d="M{hx1:.1f},{hy1:.1f} L{x2:.1f},{y2:.1f} L{hx2:.1f},{hy2:.1f}" '
        f'fill="none" stroke="{color}" stroke-width="{stroke_w}" '
        f'stroke-linecap="round" stroke-linejoin="round"/>'
    )


def hand_circle(cx: float, cy: float, rx: float, ry: float, *,
                color: str = BEAST_RED, stroke_w: float = 10, seed: int = 0,
                passes: int = 2) -> str:
    """Imperfect hand-drawn circle — multi-pass bezier with wobble."""
    rng = random.Random(seed)
    out = []
    for p in range(passes):
        pts = []
        steps = 14
        wob = 7 + p * 4
        for i in range(steps + 1):
            a = (i / steps) * 2 * math.pi + p * 0.15
            r_x = rx + rng.uniform(-wob, wob)
            r_y = ry + rng.uniform(-wob, wob)
            pts.append((cx + r_x * math.cos(a), cy + r_y * math.sin(a)))
        d = f"M{pts[0][0]:.1f},{pts[0][1]:.1f} "
        for x, y in pts[1:]:
            d += f"L{x:.1f},{y:.1f} "
        d += "Z"
        out.append(
            f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{stroke_w}" '
            f'stroke-linecap="round" stroke-linejoin="round" opacity="0.85"/>'
        )
    return "".join(out)


def stat_chip(x: float, y: float, number: str, unit: str, *,
              rotate_deg: float = -4.0, scale: float = 1.0,
              chip_w: float = 520, chip_h: float = 170,
              fill: str = BEAST_YELLOW, stroke: str = BEAST_BLACK,
              stroke_w: float = 8) -> str:
    """Slammed yellow pill with number + unit. Use scale for slam-in easing."""
    tx = x - chip_w / 2
    ty = y - chip_h / 2
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({rotate_deg}) '
        f'scale({scale:.3f}) translate({-x:.1f},{-y:.1f})">'
        f'<rect x="{tx:.1f}" y="{ty:.1f}" width="{chip_w}" height="{chip_h}" '
        f'rx="22" fill="{fill}" stroke="{stroke}" stroke-width="{stroke_w}" '
        f'stroke-linejoin="round"/>'
        f'{svg_text(number, x, y + 6, 92, fill=BEAST_BLACK, font=FONT_MONO, weight=700, letter_spacing=-4)}'
        f'{svg_text(unit, x, y + 70, 28, fill=BEAST_BLACK, font=FONT_MONO, weight=700, letter_spacing=2)}'
        f'</g>'
    )


def builder_card(x: float, y: float, rank: int, name: str, sub: str, *,
                 scale: float = 1.0, rotate_deg: float = -2.0,
                 card_w: float = 920, card_h: float = 380) -> str:
    """Yellow rotated countdown card. Rank big, name fit-to-width, sub mono."""
    tx = x - card_w / 2
    ty = y - card_h / 2
    name_pt = fit_to_width(name, card_w - 80, start_pt=78, floor_pt=36)
    return (
        f'<g transform="translate({x:.1f},{y:.1f}) rotate({rotate_deg}) '
        f'scale({scale:.3f}) translate({-x:.1f},{-y:.1f})">'
        f'<rect x="{tx:.1f}" y="{ty:.1f}" width="{card_w}" height="{card_h}" '
        f'rx="28" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10" '
        f'stroke-linejoin="round"/>'
        f'{svg_text(f"#{rank}", tx + 70, ty + 130, 110, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-4)}'
        f'{svg_text(name, x, ty + 230, name_pt, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-3)}'
        f'{svg_text(sub, x, ty + 320, 32, fill=BEAST_BLACK, font=FONT_MONO, weight=700, letter_spacing=2)}'
        f'</g>'
    )


def kicker(text: str, y: float = SAFE_TOP + 20, color: str = BEAST_BLACK) -> str:
    """Small mono eyebrow text up top."""
    return svg_text(text, CX, y, 26, fill=color, font=FONT_MONO,
                    weight=700, letter_spacing=8)


# ─── Logo embed ──────────────────────────────────────────────────────────
def embed_logo(svg_path: Path, x: float, y: float, size: float,
               opacity: float = 1.0) -> str:
    """Embed canonical brand monogram via <image> with base64 data URI."""
    import base64
    data = svg_path.read_bytes()
    b64 = base64.b64encode(data).decode("ascii")
    return (
        f'<image x="{x:.1f}" y="{y:.1f}" width="{size}" height="{size}" '
        f'opacity="{opacity:.3f}" '
        f'href="data:image/svg+xml;base64,{b64}"/>'
    )


# ─── Frame assembly ──────────────────────────────────────────────────────
def frame_wrap(body_svg: str, *, bg: str = BEAST_WHITE,
               shake: tuple[float, float] = (0.0, 0.0),
               flash: float = 0.0) -> str:
    sx, sy = shake
    flash_rect = ""
    if flash > 0.001:
        flash_rect = (
            f'<rect x="0" y="0" width="{W}" height="{H}" '
            f'fill="{BEAST_WHITE}" opacity="{flash:.3f}"/>'
        )
    return (
        f'<?xml version="1.0" encoding="UTF-8"?>'
        f'<svg xmlns="http://www.w3.org/2000/svg" '
        f'xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'width="{W}" height="{H}" viewBox="0 0 {W} {H}">'
        f'<rect x="0" y="0" width="{W}" height="{H}" fill="{bg}"/>'
        f'<g transform="translate({sx:.2f},{sy:.2f})">'
        f'{body_svg}'
        f'</g>'
        f'{flash_rect}'
        f'</svg>'
    )


# ─── Render driver ───────────────────────────────────────────────────────
@dataclass
class RenderSpec:
    slug: str
    bpm: int
    length_s: float
    fps: int = FPS
    out_root: Path = field(default_factory=lambda: Path("out"))

    @property
    def total_frames(self) -> int:
        return int(self.length_s * self.fps)

    @property
    def frames_dir(self) -> Path:
        return self.out_root / f"frames_{self.slug}"

    @property
    def audio_path(self) -> Path:
        return self.out_root / f"_audio_{self.slug}.wav"

    @property
    def silent_video_path(self) -> Path:
        return self.out_root / f"brandmint-{self.slug}-silent.mp4"

    @property
    def final_video_path(self) -> Path:
        return self.out_root / f"brandmint-{self.slug}-{self.bpm}bpm.mp4"


def render_video(spec: RenderSpec, frame_fn: Callable[[float, float], str],
                 impact_beats: Iterable[int] = ()) -> None:
    """Render all frames + audio + mux.

    frame_fn(t_norm, t_sec) -> body SVG (without the <svg> wrapper).
    impact_beats: indices of beats that trigger camera shake.
    """
    spec.frames_dir.mkdir(parents=True, exist_ok=True)
    beats = beat_grid(spec.bpm, spec.length_s)
    impact_set = set(impact_beats)
    for i, b in enumerate(beats):
        b.is_impact = i in impact_set

    print(f"[render] {spec.slug} — {spec.total_frames} frames @ {spec.fps}fps "
          f"({spec.length_s}s, {spec.bpm} BPM, {len(beats)} beats)")

    for i in range(spec.total_frames):
        t_sec = i / spec.fps
        t_norm = t_sec / spec.length_s
        sx, sy = shake_offset(t_sec, beats)
        flash = flash_alpha(t_sec, beats)
        body = frame_fn(t_norm, t_sec)
        svg = frame_wrap(body, shake=(sx, sy), flash=flash)
        out_png = spec.frames_dir / f"f{i:05d}.png"
        cairosvg.svg2png(bytestring=svg.encode("utf-8"),
                         output_width=W, output_height=H,
                         write_to=str(out_png))
        if i % 60 == 0:
            print(f"  frame {i}/{spec.total_frames}")

    print(f"[render] frames done -> {spec.frames_dir}")
    render_audio(spec)
    mux(spec)


def render_audio(spec: RenderSpec) -> None:
    """Render a ducked beat-synth WAV. Click + low sub on every beat.

    This is a SYNC track — not a music bed. Drop your licensed music on top
    in post; the click track guarantees the BPM grid matches the visual cuts.
    """
    sr = 48000
    n = int(spec.length_s * sr)
    left = np.zeros(n, dtype=np.float32)
    right = np.zeros(n, dtype=np.float32)
    beats = beat_grid(spec.bpm, spec.length_s)

    for i, b in enumerate(beats):
        start = int(b.t * sr)
        # Two layers: a tight click (high freq) + a sub thump (low freq).
        click_dur = int(0.04 * sr)
        sub_dur = int(0.18 * sr)
        if start + sub_dur >= n:
            continue
        t_click = np.arange(click_dur) / sr
        env_click = np.exp(-t_click * 80) * 0.35
        click = np.sin(2 * np.pi * 2200 * t_click) * env_click
        t_sub = np.arange(sub_dur) / sr
        env_sub = np.exp(-t_sub * 14) * (0.55 if i % 4 == 0 else 0.35)
        sub = np.sin(2 * np.pi * 70 * t_sub) * env_sub
        # Place
        left[start:start + click_dur] += click
        right[start:start + click_dur] += click
        left[start:start + sub_dur] += sub
        right[start:start + sub_dur] += sub

    # Soft limit -3dB
    peak = max(np.max(np.abs(left)), np.max(np.abs(right)), 1e-9)
    target = 10 ** (-3 / 20)
    if peak > target:
        left *= target / peak
        right *= target / peak

    stereo = np.stack([left, right], axis=1)
    stereo16 = (stereo * 32767).astype(np.int16)
    with wave.open(str(spec.audio_path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(stereo16.tobytes())
    print(f"[audio] {spec.audio_path}")


def mux(spec: RenderSpec) -> None:
    """ffmpeg H.264 + AAC mux per brief Section 8."""
    frames_glob = str(spec.frames_dir / "f%05d.png")
    cmd_silent = [
        "ffmpeg", "-y", "-framerate", str(spec.fps), "-i", frames_glob,
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        str(spec.silent_video_path),
    ]
    subprocess.run(cmd_silent, check=True, capture_output=True)
    print(f"[mux] silent -> {spec.silent_video_path}")

    cmd_final = [
        "ffmpeg", "-y", "-framerate", str(spec.fps), "-i", frames_glob,
        "-i", str(spec.audio_path),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart", "-shortest",
        str(spec.final_video_path),
    ]
    subprocess.run(cmd_final, check=True, capture_output=True)
    print(f"[mux] final  -> {spec.final_video_path}")


def cleanup_frames(spec: RenderSpec) -> None:
    """Wipe PNG frames after mux — reclaim disk."""
    for p in spec.frames_dir.glob("f*.png"):
        p.unlink()
    try:
        spec.frames_dir.rmdir()
    except OSError:
        pass
