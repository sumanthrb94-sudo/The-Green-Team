"""
GT-EP03 — "THE +37% NUMBER" · The Pre-Investor Episode
─────────────────────────────────────────────────────────
Spotlight format · 120 BPM · 15.5s · 1080x1920 @ 60fps

CONTENT BRIEF:

episode:
  slug: "gt-ep03-syl37"
  bpm: 120
  length_s: 15.5
  format: spotlight

content:
  hook: "AGARTHA INVESTORS GAINED +37% IN 18 MONTHS."
  stakes: "PRE-INVESTOR PHASE = 20-30% BELOW EVENTUAL MARKET RATE."
  method: "SCOUT · VERIFY · GATE TO INSIDERS"
  spotlight:
    name: "MODCON SYL RESIDENCES"
    proof: "TUKKUGUDA · ORR EXIT-14 · 4.5 ACRES BIOPHILIC"
    stats:
      - {n: "₹4,499", u: "/SFT"}
      - {n: "4.5", u: "ACRES"}
      - {n: "10 min", u: "AIRPORT"}

cta:
  keyword: "SYL"
  deliverable: "next-18-months pre-investor brief"
  vertical: "FOREST REAL ESTATE"

provenance:
  sources:
    - "The Green Team site copy (Agartha investors +37% in 18 months claim)"
    - "MODCON SYL Residences listing (₹4,499/SFT, 4.5 acres, Tukkuguda ORR Exit-14)"
  notes: "The +37% number is sourced from site copy. Render only uses it as a
          historical reference; CTA gates to the live newsletter."
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

#  beats 0-3   (0.0-2.0s)  HOOK    — "AGARTHA INVESTORS +37% IN 18 MONTHS"
#  beats 4-6   (2.0-3.5s)  STAKES  — pre-investor pricing rule
#  beats 7-9   (3.5-5.0s)  METHOD  — SCOUT · VERIFY · GATE
#  beats 10-15 (5.0-8.0s)  THE NEXT — "SYL RESIDENCES IS NEXT"
#  beats 16-20 (8.0-10.5s) STATS  — ₹4,499/SFT · 4.5 acres · 10 min airport
#  beats 21-26 (10.5-13.5s) REVEAL — "MODCON SYL RESIDENCES"
#  beats 27-30 (13.5-15.5s) CTA    — keyword SYL

IMPACT_BEATS = [0, 4, 7, 10, 16, 17, 18, 21, 27]
LOGO = ROOT.parent / "logo" / "the-green-team-monogram.svg"


def frame(t_norm: float, t: float) -> str:
    parts: list[str] = []

    on_green_stage = 10.5 <= t < 13.5
    eyebrow_color = BEAST_YELLOW if on_green_stage else BEAST_BLACK
    eyebrow_alpha = clamp(t / 0.4)
    parts.append(
        f'<g opacity="{eyebrow_alpha:.3f}">'
        f'{kicker("THE GREEN TEAM · EDITORIAL REAL ESTATE", y=SAFE_TOP + 10, color=eyebrow_color)}'
        f'</g>'
    )

    # ─────────────────────────────────────────────────────────────────────
    # HOOK (0.0s - 2.0s) — the +37% number is the entire frame-1 hook
    # ─────────────────────────────────────────────────────────────────────
    if t < 2.0:
        parts.append(svg_text("AGARTHA INVESTORS:", CX, 520, 56,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        # The big yellow chip with +37%
        chip_y = 760
        slam = clamp((t - 0.0) / 0.3)
        sc = ease_out_back(slam)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3.5) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-440}" y="{chip_y-170}" width="880" height="320" '
            f'rx="30" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("+37%", CX, chip_y+70, 240, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-6)}'
            f'</g>'
        )

        parts.append(svg_text("IN 18 MONTHS.", CX, 1130, 70,
                              fill=BEAST_GREEN, font=FONT_DISPLAY,
                              stroke=BEAST_BLACK, stroke_w=4))

        if t > 0.5:
            arrow_alpha = clamp((t - 0.5) / 0.3)
            parts.append(
                f'<g opacity="{arrow_alpha:.3f}">'
                f'{hand_arrow(CX+520, 1010, CX+280, 800, stroke_w=12, seed=29, color=BEAST_RED)}'
                f'</g>'
            )
        if t > 1.0:
            ca = clamp((t - 1.0) / 0.4)
            parts.append(
                f'<g opacity="{ca:.3f}">'
                f'{hand_circle(CX, 760, 380, 130, stroke_w=11, seed=12, color=BEAST_RED)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STAKES (2.0s - 3.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 3.5:
        parts.append(svg_text("THE PRE-INVESTOR RULE:", CX, 580, 50,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=10))

        slam = clamp((t - 2.0) / 0.35)
        sc = ease_out_back(slam)
        chip_y = 820
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({sc:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-460}" y="{chip_y-150}" width="920" height="280" '
            f'rx="28" fill="{BEAST_GREEN}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("20–30%", CX, chip_y+10, 130, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=4)}'
            f'{svg_text("BELOW EVENTUAL MARKET RATE", CX, chip_y+90, 32, fill=BEAST_WHITE, font=FONT_MONO, letter_spacing=4)}'
            f'</g>'
        )

        if t > 2.6:
            a = clamp((t - 2.6) / 0.35)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("WHEN YOU BUY BEFORE RERA.", CX, 1230, 44, fill=BEAST_BLACK, font=FONT_DISPLAY)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # METHOD (3.5s - 5.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 5.0:
        parts.append(svg_text("OUR PROCESS:", CX, 660, 50,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=12))

        steps = [
            (3.6, "SCOUT", BEAST_BLACK, 850),
            (4.0, "VERIFY", BEAST_GREEN, 1010),
            (4.4, "GATE TO INSIDERS", BEAST_RED, 1170),
        ]
        for start_t, text, col, y in steps:
            if t < start_t:
                continue
            a = clamp((t - start_t) / 0.25)
            sc = ease_out_back(clamp((t - start_t) / 0.3))
            parts.append(
                f'<g opacity="{a:.3f}" transform="translate({CX},{y}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'{svg_text(text, CX, y, 84 if y < 1100 else 70, fill=col, font=FONT_DISPLAY)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # THE NEXT (5.0s - 8.0s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 8.0:
        parts.append(svg_text("THE NEXT OPPORTUNITY:", CX, 520, 50,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=10))

        # Black ink slab with the project name
        ay = 700
        slam = clamp((t - 5.0) / 0.4)
        sc = ease_out_back(slam)
        block_w, block_h = 980, 520
        bx = CX - block_w / 2
        by = ay
        parts.append(
            f'<g transform="translate({CX},{by + block_h/2}) rotate(-2) scale({sc:.3f}) translate({-CX},{-(by + block_h/2)})">'
            f'<rect x="{bx}" y="{by}" width="{block_w}" height="{block_h}" '
            f'rx="28" fill="{BEAST_BLACK}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("MODCON SYL", CX, by + 180, 110, fill=BEAST_WHITE, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=0)}'
            f'{svg_text("RESIDENCES", CX, by + 320, 110, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=0)}'
            f'{svg_text("TUKKUGUDA · ORR EXIT-14", CX, by + 430, 32, fill=BEAST_WHITE, font=FONT_MONO, letter_spacing=4)}'
            f'</g>'
        )

        if t > 6.5:
            a = clamp((t - 6.5) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("4.5 ACRES BIOPHILIC · 10 MIN AIRPORT", CX, 1330, 32, fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # STATS (8.0s - 10.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 10.5:
        parts.append(svg_text("THE NUMBERS:", CX, 500, 46,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=10))

        chips = [
            (8.0,  "₹4,499",  "/SFT",       BEAST_YELLOW, 730, -4),
            (8.45, "4.5",     "ACRES",      BEAST_RED,    1010, 3),
            (8.9,  "10 MIN",  "TO AIRPORT", BEAST_GREEN,  1290, -3),
        ]
        for start, n, u, col, y, rot in chips:
            if t < start:
                continue
            sc = ease_out_back(clamp((t - start) / 0.35))
            inverse = col in (BEAST_GREEN, BEAST_RED)
            parts.append(
                f'<g transform="translate({CX},{y}) rotate({rot}) scale({sc:.3f}) translate({-CX},{-y})">'
                f'<rect x="{CX-380}" y="{y-130}" width="760" height="260" '
                f'rx="26" fill="{col}" stroke="{BEAST_BLACK}" stroke-width="9"/>'
                f'{svg_text(n, CX-150, y+30, 130, fill=(BEAST_WHITE if inverse else BEAST_BLACK), font=FONT_DISPLAY, letter_spacing=-4)}'
                f'{svg_text(u, CX+180, y+10, 44, fill=(BEAST_WHITE if inverse else BEAST_BLACK), font=FONT_MONO, weight=700, letter_spacing=4)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # REVEAL (10.5s - 13.5s)
    # ─────────────────────────────────────────────────────────────────────
    elif t < 13.5:
        parts.insert(0, f'<rect x="0" y="0" width="{W}" height="{H}" fill="{BEAST_GREEN}"/>')

        parts.append(svg_text("YOU'RE STILL IN THE WINDOW.", CX, 540, 46,
                              fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=8))

        scale = ease_out_back(clamp((t - 10.5) / 0.5))
        name_pt = fit_to_width("RESIDENCES", SAFE_TEXT_W - 60, start_pt=160, floor_pt=80)
        parts.append(
            f'<g transform="translate({CX},900) scale({scale:.3f}) translate({-CX},{-900})">'
            f'{svg_text("MODCON SYL", CX, 830, 130, fill=BEAST_WHITE, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'{svg_text("RESIDENCES", CX, 990, name_pt, fill=BEAST_YELLOW, font=FONT_DISPLAY, stroke=BEAST_BLACK, stroke_w=8)}'
            f'</g>'
        )

        if t > 11.4:
            a = clamp((t - 11.4) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{svg_text("PRE-INVESTOR PHASE · LIVE NOW", CX, 1190, 42, fill=BEAST_WHITE, font=FONT_MONO, letter_spacing=8)}'
                f'{svg_text("RESERVED FOR NEWSLETTER MEMBERS", CX, 1250, 30, fill=BEAST_YELLOW, font=FONT_MONO, letter_spacing=6)}'
                f'</g>'
            )

        if t > 12.0:
            a = clamp((t - 12.0) / 0.4)
            parts.append(
                f'<g opacity="{a:.3f}">'
                f'{hand_circle(CX, 990, 540, 100, stroke_w=12, seed=66, color=BEAST_YELLOW)}'
                f'</g>'
            )

    # ─────────────────────────────────────────────────────────────────────
    # CTA (13.5s - 15.5s)
    # ─────────────────────────────────────────────────────────────────────
    else:
        parts.append(svg_text("COMMENT", CX, 540, 56,
                              fill=BEAST_BLACK, font=FONT_MONO, letter_spacing=12))

        chip_y = 740
        pulse = 1.0 + 0.04 * (1 if int((t - 13.5) * 4) % 2 == 0 else -1)
        parts.append(
            f'<g transform="translate({CX},{chip_y}) rotate(-3) scale({pulse:.3f}) translate({-CX},{-chip_y})">'
            f'<rect x="{CX-300}" y="{chip_y-110}" width="600" height="220" '
            f'rx="28" fill="{BEAST_YELLOW}" stroke="{BEAST_BLACK}" stroke-width="10"/>'
            f'{svg_text("‘SYL’", CX, chip_y+40, 160, fill=BEAST_BLACK, font=FONT_DISPLAY, letter_spacing=-2)}'
            f'</g>'
        )

        parts.append(svg_text("— WE DM THE NEXT", CX, 990, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))
        parts.append(svg_text("18-MONTHS BRIEF.", CX, 1050, 46,
                              fill=BEAST_BLACK, font=FONT_DISPLAY))

        logo_size = 180
        logo_y = 1220
        logo_x = W - 60 - logo_size
        parts.append(embed_logo(LOGO, logo_x, logo_y, logo_size))
        parts.append(svg_text("THE GREEN TEAM", 80, logo_y + 70, 38,
                              fill=BEAST_BLACK, font=FONT_DISPLAY,
                              anchor="start", letter_spacing=-1))
        parts.append(svg_text("THEGREENTEAM.IN", 80, logo_y + 120, 24,
                              fill=BEAST_BLACK, font=FONT_MONO,
                              anchor="start", letter_spacing=8))
        parts.append(svg_text("FOLLOW @THE.GREEN.TEAM__", 80, logo_y + 165, 22,
                              fill=BEAST_GREEN, font=FONT_MONO,
                              anchor="start", letter_spacing=6))

    return "".join(parts)


def main(bpm: int = 120, length_s: float = 15.5) -> None:
    spec = RenderSpec(
        slug="gt-ep03-syl37",
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
