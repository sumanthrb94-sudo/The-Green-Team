"""
GT-THUMB-V42B — A/B variant B: NARRATIVE TRANSFORMATION
=======================================================

Adds two #100-Meta-Animation-Styles techniques to v41:
  #19 Before/After Wipe — Phase 2→3 boundary becomes a DIAGONAL WIPE
      instead of a soft crossfade (forest hero photo wipes off-screen
      reveal the biophilic-villa aerial below). Storytelling reveal —
      "the forest stays · the sanctuary appears"
  #44 Light Leak Burn — At phase 3→4 and phase 4→5 boundaries, a warm
      orange/gold light leak sweeps across the frame, briefly overexposes
      the highlights, then fades to reveal the next phase. Replaces the
      hard ink-wash transitions with a cinematic burn-through.

Conversion thesis: narrative storytelling/transformation appeals to
aspirational buyers — viewers stay through the wipe to see the reveal,
then the light leak punctuates each "act break."

Output: out/greenteam-thumb-v42b-60fps.mp4
"""
from __future__ import annotations

import math
import random
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
    W, H, FPS, TOTAL_S, N_FRAMES, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    P1_END, P2_END, P3_END, P4_END, P5_END,
    DOTS_OUT_START, DOTS_OUT_END,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, init_dust, dust_svg, svg_to_pil, svg_wrap, darken_band,
    stat_card, chip_eyebrow, magazine_chip, leaf_logo_svg,
    phase1_cold_open, phase2_hook1, phase4_chip_stack,
    phase5_brand_reveal, phase6_close,
    REPO,
)

FRAMES_DIR = REPO / "out" / "frames_gt-thumb-v42b"
SILENT_MP4 = REPO / "out" / "_gt-thumb-v42b-silent.mp4"
FINAL_MP4 = REPO / "out" / "greenteam-thumb-v42b-60fps.mp4"
AUDIO_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)


# ─── TECHNIQUE #19: DIAGONAL BEFORE/AFTER WIPE ──────────────────────────
def diagonal_wipe(im_a: Image.Image, im_b: Image.Image,
                  progress: float, angle_deg: float = 12.0,
                  feather: int = 60) -> Image.Image:
    """Wipe im_a off-screen toward bottom-left, revealing im_b underneath.
    The wipe line is angled (default 12°) — cleaner than a perfectly
    horizontal wipe, gives editorial movement. progress 0..1.
    """
    if progress <= 0.001:
        return im_a
    if progress >= 0.999:
        return im_b
    # Build wipe mask: white = show im_a, black = show im_b
    # Line: y = x*tan(angle) + offset
    angle = math.radians(angle_deg)
    tan_a = math.tan(angle)
    # Offset moves from above-the-frame to below-it across progress
    # progress 0 → line starts above top-right corner (everything is im_a)
    # progress 1 → line ends below bottom-left corner (everything is im_b)
    # Use a generous travel distance
    travel = H + W * tan_a + feather * 2
    offset = -W * tan_a - feather + progress * travel
    yy, xx = np.meshgrid(np.arange(H, dtype=np.float32),
                         np.arange(W, dtype=np.float32),
                         indexing='ij')
    # Distance from line (positive = below line = should show im_b)
    d = yy - (xx * tan_a + offset)
    # Feather: linear ramp across `feather` px around 0
    mask = np.clip(0.5 + d / feather, 0.0, 1.0)  # 0 → im_a, 1 → im_b
    mask_u8 = (mask * 255).astype(np.uint8)
    mask_img = Image.fromarray(mask_u8, 'L')
    return Image.composite(im_b, im_a, mask_img)


# ─── TECHNIQUE #44: LIGHT LEAK BURN ─────────────────────────────────────
# Precompute a warm radial gradient that sweeps across the frame.
def light_leak_overlay(t_in_leak: float, leak_duration: float = 0.5,
                       direction: str = "tl_to_br") -> Image.Image:
    """A warm-orange radial gradient that sweeps diagonally across the
    frame, peaks at mid-duration (briefly overexposes the highlights),
    fades by end. Returns RGBA image ready to alpha_composite.
    t_in_leak: 0 → leak_duration. Outside this range returns transparent.
    """
    u = t_in_leak / leak_duration
    if u < 0 or u > 1:
        return Image.new("RGBA", (W, H), (0, 0, 0, 0))

    # The leak center moves across the frame
    if direction == "tl_to_br":
        cx = lerp(-0.2, 1.2, u) * W
        cy = lerp(-0.2, 1.2, u) * H
    else:  # right→left
        cx = lerp(1.2, -0.2, u) * W
        cy = lerp(0.3, 0.7, u) * H

    # Strength: 0 at u=0, peak ~0.65 at u=0.5, 0 at u=1
    strength = math.sin(u * math.pi)

    # Build the radial gradient — warm orange/gold tones
    yy, xx = np.meshgrid(np.arange(H, dtype=np.float32),
                         np.arange(W, dtype=np.float32),
                         indexing='ij')
    dx = xx - cx
    dy = yy - cy
    r = np.sqrt(dx * dx + dy * dy)
    # Falloff: bright near center, fade by ~600 px
    falloff_r = 600
    intensity = np.clip(1.0 - r / falloff_r, 0.0, 1.0)
    intensity = intensity ** 1.5
    intensity *= strength

    # Two-tone warm leak: bright gold core, warm orange outer
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    # Hot core (white-yellow at center)
    arr[..., 0] = (255 * intensity).astype(np.uint8)
    arr[..., 1] = (235 * intensity).astype(np.uint8)
    arr[..., 2] = (180 * intensity).astype(np.uint8)
    arr[..., 3] = (intensity * 220).astype(np.uint8)
    return Image.fromarray(arr, 'RGBA')


def is_in_light_leak_window(t: float) -> tuple[bool, float, float, str]:
    """Returns (active, t_in_leak, duration, direction)."""
    # Leak 1: at P3→P4 transition, centered on P3_END
    # Leak 2: at P4→P5 transition, centered on P4_END
    # Each lasts 0.6s, starting 0.30s before the boundary
    duration = 0.6
    if abs(t - P3_END) < duration / 2 + 0.05:
        return True, t - (P3_END - duration / 2), duration, "tl_to_br"
    if abs(t - P4_END) < duration / 2 + 0.05:
        return True, t - (P4_END - duration / 2), duration, "rl_diag"
    return False, 0.0, 0.0, "tl_to_br"


# ─── OVERRIDE PHASE 3 — replace crossfade with diagonal wipe ───────────
def phase3_photo_stat_wipe(t: float, dust, photos):
    """Same content as v41 phase 3 (stat card slide-in) but the
    photo-A → photo-B blend is a DIAGONAL WIPE instead of a crossfade."""
    u = norm(t, P2_END, P3_END)

    # Wipe progress: same window as the original crossfade (first 0.5)
    wipe_prog = ease_in_out(clamp(u / 0.5))

    im_a = photos["hero"].ken_burns(
        t, P3_END, start_zoom=1.10, end_zoom=1.05,
        start_cx=0.55, start_cy=0.42, end_cx=0.55, end_cy=0.50,
    )
    im_b = photos["aerial"].ken_burns(
        t - P2_END, P3_END - P2_END,
        start_zoom=1.04, end_zoom=1.18,
        start_cx=0.45, start_cy=0.50, end_cx=0.65, end_cy=0.50,
    )
    im = diagonal_wipe(im_a, im_b, wipe_prog, angle_deg=14.0, feather=80)

    # Darken band for the stat card
    im = darken_band(im, 760, 1180, strength=0.50)

    # Dots fade-out (same as v41)
    alpha = 0.65 * (1 - ease_in_out(norm(t, DOTS_OUT_START, DOTS_OUT_END)))

    # Stat card slide-in (same as v41)
    stat_progress = ease_out_cubic(clamp((u - 0.25) / 0.45))

    overlay = (
        v41.DEFS
        + dust_svg(dust, t, alpha_mul=alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "EDITORIAL", "02 / 06", 1.0)
        + stat_card(110, 980, stat_progress,
                    "FOREST EDGE — TUKKUGUDA",
                    "4.5 ACRES",
                    "BIOPHILIC · GATED · FOREST-VIEW")
    )
    return im, overlay


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(t: float, dust, photos) -> Image.Image:
    if t < P1_END:
        base, overlay = phase1_cold_open(t, dust, photos)
    elif t < P2_END:
        base, overlay = phase2_hook1(t, dust, photos)
    elif t < P3_END:
        base, overlay = phase3_photo_stat_wipe(t, dust, photos)  # OVERRIDE
    elif t < P4_END:
        base, overlay = phase4_chip_stack(t, dust, photos)
    elif t < P5_END:
        base, overlay = phase5_brand_reveal(t, dust, photos)
    else:
        base, overlay = phase6_close(t, dust, photos)

    if overlay:
        svg = svg_wrap(overlay)
        ov = svg_to_pil(svg)
        base = base.convert("RGBA")
        base.alpha_composite(ov)
        base = base.convert("RGB")

    # Light leak burn at P3→P4 and P4→P5 boundaries
    active, t_in, dur, direction = is_in_light_leak_window(t)
    if active:
        leak = light_leak_overlay(t_in, dur, direction)
        b2 = base.convert("RGBA")
        b2.alpha_composite(leak)
        base = b2.convert("RGB")

    return base


def main():
    FRAMES_DIR.mkdir(parents=True, exist_ok=True)
    rng = random.Random(11)
    dust = init_dust(rng)
    photos = {
        "hero":   Photo(REPO / "public" / "gallery" / "agartha" / "14.webp"),
        "aerial": Photo(REPO / "public" / "gallery" / "agartha" / "4.webp"),
    }
    for p in photos.values():
        p.load()

    print(f"[v42b] {N_FRAMES} frames · WIPE + LIGHT-LEAK")
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

    cmd = [
        "ffmpeg", "-y", "-framerate", str(FPS),
        "-i", str(FRAMES_DIR / "f%05d.jpg"),
        "-i", str(AUDIO_SRC),
        "-c:v", "libx264", "-preset", "slow", "-crf", "18",
        "-pix_fmt", "yuv420p", "-movflags", "+faststart",
        "-c:a", "aac", "-b:a", "192k",
        "-af", f"afade=t=out:st={TOTAL_S - 1.0:.2f}:d=1.0",
        "-t", str(TOTAL_S),
        str(FINAL_MP4),
    ]
    subprocess.run(cmd, check=True, capture_output=True)
    print(f"[done] {FINAL_MP4}")


if __name__ == "__main__":
    main()
