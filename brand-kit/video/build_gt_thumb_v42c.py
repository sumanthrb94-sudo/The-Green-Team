"""
GT-THUMB-V42C — A/B variant C: KINETIC TRAILER
==============================================

Adds two #100-Meta-Animation-Styles techniques to v41:
  #98 Strobe Cut on Beat — Phase 3 abandons the single slide-in stat
      card. Instead, 4 stat values STROBE-CUT on each detected audio
      beat (~0.6s apart): 4.5 ACRES → 22,000 SF CLUBHOUSE → BIOPHILIC →
      FOREST EDGE. Each card holds for 2 beats then hard-cuts to the
      next. Pure kinetic punch.
  #100 Cinematic End Frame — Phase 6 close animates 100px horizontal
      black bars in from top and bottom (vertical-friendly letterbox),
      brand mark locks inside the cinema frame. Trailer-cinema close.

Conversion thesis: kinetic energy on the percussion + cinema close
appeals to younger buyers and signals "trailer-grade production." The
hard cuts also work better when the audio bass hits land.

Output: out/greenteam-thumb-v42c-60fps.mp4
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

from PIL import Image

import build_gt_thumb_v41 as v41
from build_gt_thumb_v41 import (
    W, H, FPS, TOTAL_S, N_FRAMES, CX,
    INK, PAPER, GT_SAGE, GT_GOLD, GT_GOLD_DEEP,
    FONT_DISPLAY, FONT_SERIF, FONT_MONO,
    P1_END, P2_END, P3_END, P4_END, P5_END,
    DOTS_OUT_START, DOTS_OUT_END, BEATS,
    clamp, lerp, ease_in_out, ease_out_cubic, norm,
    Photo, init_dust, dust_svg, svg_to_pil, svg_wrap, darken_band,
    chip_eyebrow, leaf_logo_svg,
    phase1_cold_open, phase2_hook1, phase4_chip_stack, phase5_brand_reveal,
    REPO,
)

FRAMES_DIR = REPO / "out" / "frames_gt-thumb-v42c"
SILENT_MP4 = REPO / "out" / "_gt-thumb-v42c-silent.mp4"
FINAL_MP4 = REPO / "out" / "greenteam-thumb-v42c-60fps.mp4"
AUDIO_SRC = Path(
    "/root/.claude/uploads/b2090cf5-6437-484f-9917-f95f6fe7563d/"
    "5de4b633-mrclapsfashionabstract492552.mp3"
)


# ─── TECHNIQUE #98: STROBE CUT ON BEAT (Phase 3 OVERRIDE) ───────────────
# Beats falling inside phase 3 (P2_END=6.61 → P3_END=10.24): beat indices
# 9, 10, 11, 12, 13, 14 (times ~6.61, 7.21, 7.82, 8.42, 9.02, 9.63 — actually
# v41 BEATS is 1.184 + i*0.604 so beat[9]=6.61, beat[10]=7.22, beat[11]=7.82,
# beat[12]=8.43, beat[13]=9.03, beat[14]=9.63). We assign one stat per
# pair of beats (2 beats = 1 stat hold ≈ 1.2s each), 3 stats total in P3.

STAT_DECK = [
    ("FOREST EDGE — TUKKUGUDA", "4.5 ACRES",  "BIOPHILIC · GATED · FOREST-VIEW"),
    ("CHEMICAL-FREE LIVING",    "22 K SFT",   "CLUBHOUSE · NATURAL BIO POOL"),
    ("FOURTH CITY CORRIDOR",    "ORR EX-14",  "10 MIN TO INTL AIRPORT"),
]


def _stat_card_full(label: str, value: str, sublabel: str,
                    flash: float) -> str:
    """Full-screen stat card centred — large value, no slide. `flash`
    is 0..1 hot impact at the cut (1 = bright flash overlay, 0 = settled)."""
    # Flash overlay: bright cream rect that fades from peak alpha to 0
    flash_alpha = max(0.0, flash) * 0.55
    parts = [
        # Backdrop dark band so card reads regardless of underlying photo
        f'<rect x="0" y="640" width="{W}" height="640" fill="{INK}" opacity="0.62"/>',
        # Gold left rule (taller than v41 — 380 px)
        f'<rect x="100" y="780" width="4" height="380" fill="{GT_GOLD}"/>',
        # Mono label (small)
        f'<text x="130" y="830" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="4">{label}</text>',
        # Big value (display)
        f'<text x="130" y="980" font-family="{FONT_DISPLAY}" font-size="140" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="-4">{value}</text>',
        # Sublabel
        f'<text x="130" y="1080" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="3">{sublabel}</text>',
        # Beat-flash overlay
        f'<rect width="{W}" height="{H}" fill="{PAPER}" opacity="{flash_alpha:.3f}"/>',
    ]
    return "".join(parts)


def phase3_strobe(t: float, dust, photos):
    """Phase 3 — strobe-cut stat deck on beats. The aerial photo plays
    underneath with a slow Ken Burns; each stat card cuts in on a beat
    pair, with a brief flash on the cut."""
    u = norm(t, P2_END, P3_END)

    # Underlying photo (aerial villa, slow Ken Burns)
    im = photos["aerial"].ken_burns(
        t - P2_END, P3_END - P2_END,
        start_zoom=1.04, end_zoom=1.20,
        start_cx=0.45, start_cy=0.50, end_cx=0.65, end_cy=0.50,
    )
    # Heavy dim so the stat reads
    im = darken_band(im, 0, H, strength=0.30)

    # Beat windows: divide phase 3 into 3 equal chunks (~1.21s each)
    phase_dur = P3_END - P2_END  # 3.62s
    chunk = phase_dur / 3.0
    idx = min(2, int((t - P2_END) / chunk))
    chunk_t = (t - P2_END) - idx * chunk
    # Flash: hot at chunk_t=0, fades exponentially over 0.18s
    flash = max(0.0, math.exp(-chunk_t / 0.06) * (1.0 if chunk_t < 0.20 else 0.0))

    label, value, sublabel = STAT_DECK[idx]
    # Dust fading out
    alpha = 0.65 * (1 - ease_in_out(norm(t, DOTS_OUT_START, DOTS_OUT_END)))

    overlay = (
        v41.DEFS
        + dust_svg(dust, t, alpha_mul=alpha)
        + f'<rect width="{W}" height="{H}" fill="url(#vig)"/>'
        + chip_eyebrow(80, 360, "EDITORIAL", "02 / 06", 1.0)
        + _stat_card_full(label, value, sublabel, flash)
        # Strobe progress dots — 3 dots showing which stat is active
        + _strobe_progress_dots(idx)
    )
    return im, overlay


def _strobe_progress_dots(active_idx: int) -> str:
    """3 small dots top-right showing strobe position (01/03 etc)."""
    parts = [
        f'<g transform="translate({W - 200},360)">',
        f'<text x="0" y="-4" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3">'
        f'{active_idx + 1:02d} / 03</text>',
    ]
    for i in range(3):
        col = GT_GOLD if i == active_idx else "#3a4a2c"
        parts.append(
            f'<circle cx="{i * 22}" cy="18" r="5" fill="{col}"/>'
        )
    parts.append('</g>')
    return "".join(parts)


# ─── TECHNIQUE #100: CINEMATIC END FRAME (Phase 6 OVERRIDE) ─────────────
def phase6_cinematic_close(t: float, dust, photos):
    """Phase 6 — phase 5's brand reveal HELDS, then 100px black letterbox
    bars animate IN from top and bottom across the first 1.2s of phase 6.
    Inside the cinema frame, signature + URL fade up + CTA blinks."""
    u = norm(t, P5_END, TOTAL_S)

    # Solid ink (same as v41 phase 6)
    ink = Image.new("RGB", (W, H), (14, 20, 8))
    im = ink

    # Cinema bar animation: 0px at u=0 → 100px each by u=0.36
    bar_h = int(100 * ease_out_cubic(clamp(u / 0.36)))
    sig_progress = ease_out_cubic(clamp((u - 0.20) / 0.30))
    sig_op = sig_progress
    cta_t = t - (TOTAL_S - 2.5)
    cta_blink = (
        0.55 + 0.45 * (0.5 + 0.5 * math.sin(cta_t * 6.0))
        if cta_t > 0 else 0.0
    )

    # Reuse phase 5 final-state brand block (leaf full, wordmark full,
    # tagline full). Same SVG content as v41 phase 6 — but with cinema
    # bars on top.
    final_defs = (
        '<defs>'
        f'<linearGradient id="goldHL3" x1="0" y1="0" x2="1" y2="0">'
        f'<stop offset="0" stop-color="{GT_GOLD}"/>'
        f'<stop offset="0.55" stop-color="#e6ce85"/>'
        f'<stop offset="1" stop-color="{GT_GOLD_DEEP}"/>'
        f'</linearGradient>'
        f'<radialGradient id="vig3" cx="0.5" cy="0.5" r="0.85">'
        f'<stop offset="0.55" stop-color="{INK}" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="{INK}" stop-opacity="0.82"/>'
        f'</radialGradient>'
        '</defs>'
    )

    leaf_size = 380
    overlay = (
        final_defs
        + leaf_logo_svg(CX, 780, leaf_size, 1.0, 1.0)
        + f'<g transform="translate({CX},1090)">'
        + f'<text x="0" y="0" font-family="{FONT_DISPLAY}" font-size="78" '
        f'fill="{PAPER}" font-weight="800" letter-spacing="6" '
        f'text-anchor="middle">THE GREEN TEAM</text></g>'
        + f'<line x1="{CX - 130}" y1="1130" x2="{CX + 130}" y2="1130" '
        f'stroke="{GT_GOLD}" stroke-width="2"/>'
        + f'<g transform="translate({CX},1220)">'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="20" '
        f'fill="{PAPER}" letter-spacing="3" font-weight="600" '
        f'text-anchor="middle">WE CURATE FOREST-ADJACENT</text></g>'
        + f'<text x="{CX}" y="1310" font-family="{FONT_SERIF}" '
        f'font-size="74" font-style="italic" '
        f'fill="url(#goldHL3)" font-weight="400" '
        f'text-anchor="middle">sanctuaries.</text>'
        + f'<g transform="translate({CX},1450)" opacity="{sig_op:.3f}">'
        + f'<line x1="-200" y1="-40" x2="200" y2="-40" '
        f'stroke="{GT_SAGE}" stroke-width="1" opacity="0.4"/>'
        + f'<text x="0" y="0" font-family="{FONT_MONO}" font-size="18" '
        f'fill="{PAPER}" opacity="0.85" letter-spacing="4" '
        f'text-anchor="middle">EDITORIAL REAL ESTATE — HYDERABAD</text>'
        + f'<text x="0" y="34" font-family="{FONT_MONO}" font-size="22" '
        f'fill="{GT_GOLD}" font-weight="700" letter-spacing="3" '
        f'text-anchor="middle">thegreenteam.in</text></g>'
        + f'<text x="{CX}" y="1620" font-family="{FONT_MONO}" font-size="16" '
        f'fill="{PAPER}" opacity="{cta_blink:.3f}" letter-spacing="6" '
        f'text-anchor="middle">DM FOR THE BRIEF</text>'
        + f'<rect width="{W}" height="{H}" fill="url(#vig3)"/>'
        # CINEMA BARS — on top of everything
        + f'<rect x="0" y="0" width="{W}" height="{bar_h}" fill="#000"/>'
        + f'<rect x="0" y="{H - bar_h}" width="{W}" height="{bar_h}" fill="#000"/>'
    )

    return im, overlay


# ─── DISPATCH ───────────────────────────────────────────────────────────
def render_frame(t: float, dust, photos) -> Image.Image:
    if t < P1_END:
        base, overlay = phase1_cold_open(t, dust, photos)
    elif t < P2_END:
        base, overlay = phase2_hook1(t, dust, photos)
    elif t < P3_END:
        base, overlay = phase3_strobe(t, dust, photos)          # OVERRIDE
    elif t < P4_END:
        base, overlay = phase4_chip_stack(t, dust, photos)
    elif t < P5_END:
        base, overlay = phase5_brand_reveal(t, dust, photos)
    else:
        base, overlay = phase6_cinematic_close(t, dust, photos)  # OVERRIDE

    if overlay:
        svg = svg_wrap(overlay)
        ov = svg_to_pil(svg)
        base = base.convert("RGBA")
        base.alpha_composite(ov)
        base = base.convert("RGB")
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

    print(f"[v42c] {N_FRAMES} frames · STROBE + CINEMA-END")
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
