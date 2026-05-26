"""
GT-THUMB-V42A — A/B variant A: TEXTURED EDITORIAL
=================================================

Adds two #100-Meta-Animation-Styles techniques to v41:
  #5  Text Mask Video Reveal — Phase 5 brand reveal upgraded so the
      forest photo plays *inside* the cut-out letterforms of "GREEN TEAM"
      as it reveals (text as a photo-mask, not text-on-photo)
  #49 Grain Texture Overlay — subtle per-frame numpy noise composited at
      ~7% opacity across every frame (the single biggest "premium film"
      upgrade — adds editorial weight without changing the layout)

Conversion thesis: premium/editorial cadence wins high-intent luxury
buyers who scan for craft signals (grain texture, magazine framing).

Output: out/greenteam-thumb-v42a-60fps.mp4
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

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# Shared primitives from v41
import build_gt_thumb_v41 as v41
from build_gt_thumb_v41 import (
    W, H, FPS, TOTAL_S, N_FRAMES, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    P1_END, P2_END, P3_END, P4_END, P5_END,
    DOTS_OUT_START, DOTS_OUT_END,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, init_dust, dust_svg, svg_to_pil, svg_wrap, darken_band,
    LEAF_PATHS, LEAF_DASH, leaf_logo_svg,
    phase1_cold_open, phase2_hook1, phase3_photo_stat,
    phase4_chip_stack, phase6_close,
    REPO,
)

FRAMES_DIR = REPO / "out" / "frames_gt-thumb-v42a"
SILENT_MP4 = REPO / "out" / "_gt-thumb-v42a-silent.mp4"
FINAL_MP4 = REPO / "out" / "greenteam-thumb-v42a-60fps.mp4"
AUDIO_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)
POSTER_JPG = REPO / "out" / "greenteam-thumb-v42a-poster.jpg"


# ─── TECHNIQUE #49: FILM GRAIN OVERLAY ──────────────────────────────────
# Precompute multiple grain tiles so we cycle through them per frame
# (purely random per-frame causes flicker; cycling 8 tiles at 60fps gives
# the natural "film grain randomness" without per-frame numpy cost).
def _make_grain_tiles(count: int = 8) -> list[Image.Image]:
    tiles = []
    rng = np.random.default_rng(11)
    for _ in range(count):
        # Low-res grain (270×480 — quarter res), upscaled with nearest-neighbor
        # to give the chunky 35mm-film feel. Pure neutral gray noise.
        small = rng.normal(128, 30, (H // 4, W // 4)).clip(0, 255).astype(np.uint8)
        im = Image.fromarray(small, 'L').resize((W, H), Image.NEAREST)
        tiles.append(im.convert("RGBA"))
    return tiles


GRAIN_TILES: list[Image.Image] = []


def apply_grain(frame: Image.Image, frame_idx: int,
                strength: float = 0.07) -> Image.Image:
    """Composite a grain tile over the frame using soft-light-like blend
    (we approximate by alpha-blending neutral gray noise at low strength —
    visually equivalent to lighting/darkening pixels based on noise)."""
    global GRAIN_TILES
    if not GRAIN_TILES:
        GRAIN_TILES = _make_grain_tiles(8)
    tile = GRAIN_TILES[frame_idx % len(GRAIN_TILES)]
    # Make a copy with adjusted alpha
    arr = np.asarray(tile).copy()
    arr[..., 3] = int(255 * strength)
    grain = Image.fromarray(arr, 'RGBA')
    out = frame.convert("RGBA")
    out.alpha_composite(grain)
    return out.convert("RGB")


# ─── TECHNIQUE #5: TEXT MASK VIDEO REVEAL — Phase 5 OVERRIDE ────────────
# We discard v41's leaf-stroke + wordmark-typewrite reveal. Instead we
# render "THE GREEN TEAM" as a HUGE text mask, and a moving photo plays
# inside the letterforms. The leaf and tagline still appear afterward
# (smaller, below) — but the wordmark IS the photo-reveal moment.

# Cache a font for the text mask. Try Inter Display Black, fall back.
def _load_text_mask_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    ]
    for p in candidates:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()


def _text_mask_alpha(text: str, size: int) -> Image.Image:
    """Render text to a 1080×1920 8-bit alpha mask (white = visible)."""
    mask = Image.new("L", (W, H), 0)
    draw = ImageDraw.Draw(mask)
    font = _load_text_mask_font(size)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x = (W - tw) // 2 - bbox[0]
    y = 720
    draw.text((x, y), text, fill=255, font=font)
    return mask


def phase5_text_mask_reveal(t: float, dust, photos) -> tuple[Image.Image, str]:
    """13.26 → 18.70s — TEXT-MASK PHOTO REVEAL.

    Forest photo zooms slowly behind the canvas. INK fills everything
    EXCEPT where the "THE GREEN TEAM" text is — there the photo shows
    through, like the brand name is carved into the forest itself.
    Then below the text-mask reveal, the leaf mark + tagline slide in.
    """
    u = norm(t, P4_END, P5_END)

    # The "video" inside the text — use the hero forest photo with a
    # slow Ken Burns push-in. This makes the photo INSIDE the letters
    # feel alive (animated).
    photo = photos["hero"].ken_burns(
        t, P5_END, start_zoom=1.10, end_zoom=1.30,
        start_cx=0.55, start_cy=0.35, end_cx=0.55, end_cy=0.45,
    )

    # Build the text mask. Reveal it across u 0.05→0.50 by scaling the
    # mask alpha threshold (the text appears as if 'sliding into focus').
    reveal = ease_out_cubic(clamp((u - 0.05) / 0.45))
    # Slight letter-by-letter reveal via a horizontal gradient mask
    full_mask = _text_mask_alpha("GREEN TEAM", size=200)
    # Apply horizontal sweep: only show mask where x <= reveal * W
    if reveal < 1.0:
        sweep = Image.new("L", (W, H), 0)
        # Hard edge with feather of 80px
        edge_x = int(reveal * (W + 80))
        feather_arr = np.zeros((H, W), dtype=np.uint8)
        for x in range(W):
            if x < edge_x - 80:
                feather_arr[:, x] = 255
            elif x < edge_x:
                feather_arr[:, x] = int(255 * (1 - (edge_x - x) / 80))
            else:
                feather_arr[:, x] = 0
        sweep = Image.fromarray(feather_arr, 'L')
        # Combine: mask AND sweep
        mask_arr = np.asarray(full_mask).astype(np.uint16)
        sweep_arr = np.asarray(sweep).astype(np.uint16)
        combined = (mask_arr * sweep_arr // 255).astype(np.uint8)
        text_mask = Image.fromarray(combined, 'L')
    else:
        text_mask = full_mask

    # Base: deep ink
    ink_layer = Image.new("RGB", (W, H), (14, 20, 8))
    # Composite: photo where mask is bright, ink where mask is dark
    base = Image.composite(photo, ink_layer, text_mask)

    # ── Below the text mask, we still want the leaf logo (smaller) +
    # tagline as a brand block. Pulled forward from v41 phase 5 logic.
    fill_p = clamp((u - 0.45) / 0.35)
    leaf_size = 180
    leaf_cx = CX
    leaf_cy = 1170

    # Tagline reveals after the photo-mask completes
    tag_left = "WE CURATE FOREST-ADJACENT"
    tag_right = "sanctuaries."
    tag_kicker_p = ease_out_cubic(clamp((u - 0.68) / 0.18))
    tag_main_p = ease_out_cubic(clamp((u - 0.78) / 0.18))

    parts = [
        v41.DEFS,
        f'<rect width="{W}" height="{H}" fill="url(#vig)"/>',
        leaf_logo_svg(leaf_cx, leaf_cy, leaf_size, 1.0, fill_p),
    ]
    if tag_kicker_p > 0.001:
        parts.append(
            f'<g transform="translate({CX},1330)" opacity="{tag_kicker_p:.3f}">'
            f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="20" '
            f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
            f'text-anchor="middle">{tag_left}</text>'
            f'</g>'
        )
    if tag_main_p > 0.001:
        clip_w = tag_main_p * 620
        parts.append(
            f'<defs><clipPath id="tc2">'
            f'<rect x="{CX-310:.0f}" y="1370" width="{clip_w:.0f}" height="100"/>'
            f'</clipPath></defs>'
            f'<g clip-path="url(#tc2)">'
            f'<text x="{CX}" y="1440" font-family="{FONT_SERIF}" '
            f'font-size="74" font-style="italic" '
            f'fill="url(#goldHL)" font-weight="400" '
            f'text-anchor="middle">{tag_right}</text>'
            f'</g>'
        )
    return base, "".join(parts)


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(t: float, dust, photos, frame_idx: int) -> Image.Image:
    if t < P1_END:
        base, overlay = phase1_cold_open(t, dust, photos)
    elif t < P2_END:
        base, overlay = phase2_hook1(t, dust, photos)
    elif t < P3_END:
        base, overlay = phase3_photo_stat(t, dust, photos)
    elif t < P4_END:
        base, overlay = phase4_chip_stack(t, dust, photos)
    elif t < P5_END:
        base, overlay = phase5_text_mask_reveal(t, dust, photos)  # OVERRIDE
    else:
        base, overlay = phase6_close(t, dust, photos)
    if overlay:
        svg = svg_wrap(overlay)
        ov = svg_to_pil(svg)
        base = base.convert("RGBA")
        base.alpha_composite(ov)
        base = base.convert("RGB")
    # Apply grain (technique #49) to EVERY frame
    base = apply_grain(base, frame_idx, strength=0.07)
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

    print(f"[v42a] {N_FRAMES} frames · TEXT-MASK + GRAIN")
    t0 = time.time()
    for i in range(N_FRAMES):
        t = i / FPS
        frame = render_frame(t, dust, photos, i)
        frame.save(FRAMES_DIR / f"f{i:05d}.jpg", "JPEG", quality=92)
        if i % 60 == 0 and i > 0:
            el = time.time() - t0
            r = i / el
            eta = (N_FRAMES - i) / r
            print(f"  frame {i}/{N_FRAMES} · {r:.1f} fps · ETA {eta:.0f}s")
    print(f"[render] done in {time.time() - t0:.0f}s")

    # Mux with audio (no -shortest)
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
