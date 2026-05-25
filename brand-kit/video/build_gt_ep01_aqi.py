"""
GT-EP01 — "FOREST MATH" · The AQI Proof Episode
─────────────────────────────────────────────────────────
Spotlight format · 120 BPM · 15.5s · 1080x1920 @ 60fps

CONTENT BRIEF (Section 7 of AI-VIDEO-GENERATION-BRIEF.md):

episode:
  slug: "gt-ep01-aqi"
  bpm: 120
  length_s: 15.5
  format: spotlight

content:
  hook: "ONLY 1 IN 100 HYDERABAD PROJECTS HAS AQI UNDER 25."
  stakes: "CITY AIR: 100–180. OUR MINIMUM: 25. CURRENT: 12."
  method: "VERIFIED · CURATED · INDEPENDENT"
  spotlight:
    name: "MODCON AGARTHA"
    proof: "OUTLOOK ECO AWARD 2024 · NARSAPUR FOREST"
    stats:
      - {n: "12", u: "AQI"}
      - {n: "18", u: "dB NOISE"}
      - {n: "25", u: "ACRES"}

cta:
  keyword: "GREEN"
  deliverable: "full AQI + noise verification doc"
  vertical: "FOREST REAL ESTATE"

provenance:
  sources:
    - "Outlook Business 2024 Eco-Friendly Project Award (public record)"
    - "The Green Team site: thegreenteam.in (AQI 12, 18 dB, 25 acres)"
    - "MODCON Builders MODCON Agartha listing"
  notes: "All stats cross-checked against site copy + Outlook Business 2024."
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from _lib import (  # noqa: E402
    BEAST_BLACK, BEAST_GREEN, BEAST_RED, BEAST_WHITE, BEAST_YELLOW,
    CX, CY, FONT_DISPLAY, FONT_MONO, H, SAFE_TEXT_W, SAFE_TOP, W,
    RenderSpec, builder_card, clamp, ease_in_cubic, ease_out_back,
    ease_out_cubic, embed_logo, escape, fit_to_width, hand_arrow,
    hand_circle, kicker, render_video, stat_chip, svg_text,
)

# ─── Beat sheet ──────────────────────────────────────────────────────────
# 120 BPM -> 0.5s per beat. 31 beats = 15.5s.
#
#  beats 0-3  (0.0-2.0s)  HOOK     — "ONLY 1 IN 100 PROJECTS HAS AQI < 25"
#  beats 4-6  (2.0-3.5s)  STAKES   — "CITY 100–180 // YOU? AQI 25 LIMIT"
#  beats 7-9  (3.5-5.0s)  METHOD   — "VERIFIED · CURATED · INDEPENDENT"
#  beats 10-15 (5.0-8.0s) AWARD    — "OUTLOOK ECO AWARD 2024"
#  beats 16-20 (8.0-10.5s) STATS   — 3 stat chips slam in (AQI 12 / 18 dB / 25 ACRES)
#  beats 21-26 (10.5-13.5s) REVEAL — "MODCON AGARTHA" big with 8px stroke
#  beats 27-30 (13.5-15.5s) CTA    — keyword GREEN + Green Team monogram

IMPACT_BEATS = [0, 4, 7, 10, 16, 17, 18, 21, 27]

LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"


# ─── Frame composer ──────────────────────────────────────────────────────
def frame(t_norm: float, t: float) -> str:
    """Return the body SVG for time t (seconds)."""
    parts: list[str] = []

    # ── Persistent eyebrow (visible throughout, light fade in beat 0) ───
    # During the green REVEAL stage we recolor it to yellow for legibility.
    on_green_stage = 10.5 <= t < 13.5
    eyebrow_color = BEAST_YELLOW if on_green_stage else BEAST_BLACK
    eyebrow_alpha = clamp(t / 0.4)
    parts.append(
        f'<g opacity="{eyebrow_alpha:.3f}">'
        f'{kicker("THE GREEN TEAM · EDITORIAL REAL ESTATE", y=SAFE_TOP + 10, color=eyebrow_color)}'
        f'</g>'
    )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 0-3 — HOOK (0.0s - 2.0s)
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        # Frame-1 hook (visible at t=0). No fade-in delay.
        # 3 lines, stroked. Yellow chip behind "1 IN 100" key phrase.

        # Yellow block behind the key phrase
        block_w = 820
        block_h = 170
        block_x = CX - block_w / 2
        block_y = 580
        rot = -3.5
        parts.append(
            f'<g transform="translate({CX},{block_y + block_h/2}) rotate({rot}) '
            f'translate({-CX},{-(block_y + block_h/2)})">'
            f'<rect x="{block_x}" y="{block_y}" width="{block_w}" height="{block_h}" '
            f'rx="20" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="8"/>'
            f'</g>'
        )

        parts.append(svg_text("ONLY", CX, 470, 110,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        # Big yellow-block phrase (on yellow chip)
        parts.append(svg_text("1 IN 100", CX, block_y + 130, 130,
                              fill=BEAST_BLACK, font=FONT_DISPLAY,
                              stroke=BEAST_BLACK, stroke_w=0))
        parts.append(svg_text("HYDERABAD PROJECTS", CX, 880, 64,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        parts.append(svg_text("HAS AQI UNDER 25.", CX, 960, 64,
                              fill=BEAST_RED, font=FONT_DISPLAY,
                              stroke=BEAST_BLACK, stroke_w=4))

        # Hand-drawn red arrow pointing at "AQI UNDER 25"
        if t > 0.4:
            seed = 41
            arrow_alpha = clamp((t - 0.4) / 0.3)
            parts.append(
                f'<g opacity="{arrow_alpha:.3f}">'
                f'{hand_arrow(CX + 420, 1080, CX + 200, 980, stroke_w=11, seed=seed)}'
                f'</g>'
            )

        # Hand-drawn red circle around "1 IN 100"
        if t > 0.8:
            circle_alpha = clamp((t - 0.8) / 0.4)
            parts.append(
                f'<g opacity="{circle_alpha:.3f}">'
                f'{hand_circle(CX, block_y + 90, 380, 110, stroke_w=10, seed=7)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 4-6 — STAKES (2.0s - 3.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        u = (t - 2.0) / 1.5
        a = ease_out_cubic(clamp(u * 2))

        parts.append(svg_text("CITY HYDERABAD AIR:", CX, 700, 54,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        # Slam chip — "100–180 AQI"
        slam_t = clamp((t - 2.0) / 0.35)
        scale = ease_out_back(slam_t)
        parts.append(stat_chip(CX, 880, "100–180", "UNHEALTHY",
                               rotate_deg=-4, scale=scale,
                               chip_w=620, chip_h=180,
                               fill=BEAST_RED))
        # Below: our standard
        if t > 2.5:
            a2 = clamp((t - 2.5) / 0.4)
            parts.append(
                f'<g opacity="{a2:.3f}">'
                f'{svg_text("OUR MINIMUM STANDARD:", CX, 1140, 52, fill=BEAST_BLACK, font=FONT_DISPLAY)}'
                f'{stat_chip(CX, 1320, "<25", "AQI", rotate_deg=3, scale=ease_out_back(clamp((t-2.5)/0.35)), chip_w=480, chip_h=180, fill=BEAST_YELLOW)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 7-9 — METHOD (3.5s - 5.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        u = (t - 3.5) / 1.5
        a = ease_out_cubic(clamp(u * 2))

        parts.append(svg_text("HOW WE FIND THEM:", CX, 760, 52,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        words = ["VERIFIED", "·", "CURATED", "·", "INDEPENDENT"]
        # Stack vertically, each fades in on its own beat
        ys = [920, 1020, 1120, 1220, 1320]
        # Word 1 at 3.5s, word 2 at 4.0s, word 3 at 4.5s
        word_times = [3.5, 3.55, 4.0, 4.05, 4.5]
        sizes = [88, 56, 88, 56, 88]
        for w, y, wt, sz in zip(words, ys, word_times, sizes):
            wa = clamp((t - wt) / 0.25)
            color = BEAST_GREEN if w != "·" else BEAST_RED
            parts.append(
                f'<g opacity="{wa:.3f}">'
                f'{svg_text(w, CX, y, sz, fill=color, font=FONT_DISPLAY)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 10-15 — AWARD (5.0s - 8.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 8.0:
        u = (t - 5.0) / 3.0
        a = ease_out_cubic(clamp(u * 3))

        # Kicker mono eyebrow above the block (extra context line)
        parts.append(svg_text("THE PROOF:", CX, 540, 46,
                              fill=BEAST_BLACK, font=FONT_MONO,
                              letter_spacing=10))
        parts.append(svg_text("(PUBLIC RECORD · OUTLOOK BUSINESS 2024)",
                              CX, 600, 22, fill=BEAST_BLACK,
                              font=FONT_MONO, letter_spacing=5))

        # Award block — green deep accent. Two-line, generous spacing.
        ay = 700
        slam_t = clamp((t - 5.0) / 0.4)
        sc = ease_out_back(slam_t)
        block_w, block_h = 940, 540
        bx = CX - block_w / 2
        by = ay
        parts.append(
            f'<g transform="translate({CX},{by + block_h/2}) rotate(-2) '
            f'scale({sc:.3f}) translate({-CX},{-(by + block_h/2)})">'
            f'<rect x="{bx}" y="{by}" width="{block_w}" height="{block_h}" '
            f'rx="28" fill="{BEAST_GREEN}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("WINNER", CX, by + 90, 44, fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=14)}'
            f'{svg_text("OUTLOOK ECO", CX, by + 230, 84, fill=BEAST_WHITE, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=4)}'
            f'{svg_text("AWARD 2024", CX, by + 410, 100, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=4)}'
            f'</g>'
        )

        if t > 5.8:
            ca = clamp((t - 5.8) / 0.4)
            parts.append(
                f'<g opacity="{ca:.3f}">'
                f'{hand_circle(CX, by + 410, 360, 80, stroke_w=12, seed=99)}'
                f'</g>'
            )

        # Subline (below the bigger block)
        if t > 6.5:
            sa = clamp((t - 6.5) / 0.4)
            parts.append(
                f'<g opacity="{sa:.3f}">'
                f'{svg_text("BEST SUSTAINABLE PROJECT — INDIA", CX, 1340, 34, fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 16-20 — STATS (8.0s - 10.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 10.5:
        parts.append(svg_text("THE NUMBERS:", CX, 520, 46,
                              fill=BEAST_BLACK, font=FONT_MONO,
                              letter_spacing=10))

        chips = [
            (8.0,  "12",   "AQI",       BEAST_YELLOW, 750),
            (8.45, "18",   "dB NOISE",  BEAST_RED, 1050),
            (8.9,  "25",   "ACRES",     BEAST_GREEN, 1350),
        ]
        rotations = [-4, 3, -3]
        for (start, n, u, col, y), rot in zip(chips, rotations):
            if t < start:
                continue
            slam = clamp((t - start) / 0.35)
            sc = ease_out_back(slam)
            fillcol = col
            text_inverse = (col == BEAST_GREEN or col == BEAST_RED)
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) '
                f'scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-360}" y="{y-130}" width="720" height="260" '
                f'rx="26" fill="{fillcol}" stroke="{BEAST_BLACK}" stroke-width="9"/>'
                f'{svg_text(n, CX-150, y+30, 150, fill=(BEAST_WHITE if text_inverse else BEAST_BLACK), font=FONT_MONO, weight=700, letter_spacing=-4)}'
                f'{svg_text(u, CX+170, y+10, 50, fill=(BEAST_WHITE if text_inverse else BEAST_BLACK), font=FONT_MONO, weight=700, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 21-26 — REVEAL (10.5s - 13.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 13.5:
        u = (t - 10.5) / 3.0

        # Dark stage for the reveal — paint over via a green panel
        parts.insert(0,
            f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BEAST_GREEN}"/>'
        )

        parts.append(svg_text("THE 1 IN 100:", CX, 560, 52,
                              fill=BEAST_YELLOW, font=FONT_MONO,
                              letter_spacing=14))

        # Big name reveal with stroke
        scale = ease_out_back(clamp((t - 10.5) / 0.6))
        name_pt = fit_to_width("MODCON AGARTHA", SAFE_TEXT_W - 40, start_pt=170, floor_pt=80)
        parts.append(
            f'<g transform="translate({CX},900) scale({scale:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON", CX, 850, name_pt, fill=BEAST_WHITE, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'{svg_text("AGARTHA", CX, 1010, name_pt, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'</g>'
        )

        if t > 11.5:
            a = clamp((t - 11.5) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("NARSAPUR FOREST · 25 ACRES", CX, 1200, 46, fill=BEAST_WHITE, font=FONT_MONO, letter_spacing=10)}'
                f'{svg_text("36 PLOTS · 100+ TREE VARIETIES", CX, 1270, 38, fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=8)}'
                f'</g>'
            )

        if t > 12.0:
            a = clamp((t - 12.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 1010, 540, 110, stroke_w=12, seed=44, color=BEAST_YELLOW)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # BEAT 27-30 — CTA (13.5s - 15.5s)
    # ─────────────────────────────────────────────────────────────────────
    else:
        u = (t - 13.5) / 2.0
        a = ease_out_cubic(clamp(u * 2))

        # Paper background returns. Pulse on monogram.
        parts.append(svg_text("COMMENT", CX, 560, 56,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=12))

        # Yellow chip with the keyword
        chip_y = 760
        pulse = 1.0 + 0.04 * (0.5 + 0.5 * (1 if int((t - 13.5) * 4) % 2 == 0 else -1))
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-380}" y="{chip_y-110}" width="760" height="220" '
            f'rx="28" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("‘GREEN’", CX, chip_y+40, 160, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("— WE DM THE FULL AQI", CX, 980, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        parts.append(svg_text("+ NOISE VERIFICATION DOC.", CX, 1040, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        # Brand block — monogram + sub-brand line, kept inside safe area.
        # SAFE_BOTTOM = 480 means y must be <= H - 480 = 1440 for content.
        logo_size = 180
        logo_y = 1220
        # Monogram on the right
        logo_x = W - 60 - logo_size  # right margin = 60
        parts.append(embed_logo(LOGO, logo_x, logo_y, logo_size))

        # Wordmark + URL on the left, vertically centered against the monogram
        text_anchor_x = 80
        parts.append(svg_text("THE GREEN TEAM", text_anchor_x, logo_y + 70, 38,
                              fill=BEAST_BLACK, font=FONT_DISPLAY,
                              anchor="start", letter_spacing=-1))
        parts.append(svg_text("THEGREENTEAM.IN", text_anchor_x, logo_y + 120, 24,
                              fill=BEAST_BLACK, font=FONT_MONO,
                              anchor="start", letter_spacing=8))
        parts.append(svg_text("FOLLOW @THE.GREEN.TEAM__", text_anchor_x, logo_y + 165, 22,
                              fill=BEAST_GREEN, font=FONT_MONO,
                              anchor="start", letter_spacing=6))

    return "".join(parts)


def SAFE_BOTTOM_pad() -> int:
    """Avoid Reels caption bar. Per brief Section 2: SAFE_BOTTOM = 480."""
    return 380  # we go a little higher than 480 to fit the monogram + handle


# ─── Entry point ─────────────────────────────────────────────────────────
def main(bpm: int = 120, length_s: float = 15.5) -> None:
    spec = RenderSpec(
        slug="gt-ep01-aqi",
        bpm=bpm,
        length_s=length_s,
        out_root=ROOT.parent.parent / "out",
    )
    spec.out_root.mkdir(parents=True, exist_ok=True)
    render_video(spec, frame, impact_beats=IMPACT_BEATS)


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--bpm", type=int, default=120)
    p.add_argument("--length", type=float, default=15.5)
    args = p.parse_args()
    main(bpm=args.bpm, length_s=args.length)
