"""
Green Team — AGARTHA location map asset.

Editorial stylised map. NOT a Google-Maps tile. Brand-aligned so the
same asset can sit inside a reel, on the site, in a DM auto-reply, or
on a one-pager PDF without looking like a screenshot.

Geography baked in:
  - AGARTHA pin: Narsapur Reserve Forest boundary (north of Hyderabad)
  - Financial District pin: Gachibowli / HITEC City corridor (city, central-west)
  - RRR (Regional Ring Road) arc: gold dashed connector, north-to-city
  - ORR hint: thin charcoal line down south, no label clutter
  - Forest band: sage block top third with Caladea-italic label
  - Compass: minimalist N
  - Distance chip: "≈ 40 MIN  ·  VIA THE RRR"
  - Brand row: leaf + thegreenteam.in

Outputs (in brand-kit/maps/out/):
  - agartha-location-map.svg              (master vector, 1080x1920)
  - agartha-location-map-reel.png         (1080x1920, IG/Reel/Story)
  - agartha-location-map-square.png       (1080x1080, IG feed)
  - agartha-location-map-landscape.png    (1920x1080, web hero / PDF)

Run:
  python3 brand-kit/maps/build_agartha_location_map.py
"""
from __future__ import annotations

import math
from pathlib import Path

import cairosvg
from PIL import Image

# ─── Brand tokens (mirror brand-kit/video/_lib.py) ──────────────────────
GT_OLIVE_900   = "#1a2410"
GT_OLIVE_800   = "#2d3a1d"
GT_OLIVE_700   = "#4a5c3d"
GT_SAGE        = "#a3b18a"
GT_CREAM       = "#faf9f6"
GT_CASHEW      = "#f2f4f2"
GT_CHARCOAL    = "#1a1c1a"
GT_GOLD        = "#b8860b"
GT_GOLD_LIGHT  = "#c8a951"

FONT_DISPLAY = "'Inter Display', 'Manrope', 'Inter', 'DejaVu Sans', sans-serif"
FONT_MONO    = "'JetBrains Mono', 'DejaVu Sans Mono', monospace"
FONT_SERIF   = "'Caladea', 'Cormorant Garamond', 'Liberation Serif', serif"

# ─── Master canvas (vertical reel-native) ───────────────────────────────
W = 1080
H = 1920

# Pin positions in canvas coords (designed for the vertical layout)
AGARTHA_X, AGARTHA_Y = 660, 640
FIN_X, FIN_Y         = 410, 1280

OUT = Path(__file__).resolve().parent / "out"
OUT.mkdir(parents=True, exist_ok=True)


def topo_lines() -> str:
    """Soft topographic contour suggestion across the canvas."""
    parts = []
    # gentle wavy lines, low opacity
    for i, y0 in enumerate(range(120, H - 120, 90)):
        amp = 14 + (i % 3) * 6
        period = 220 + (i % 4) * 30
        d = f"M -20 {y0} "
        for x in range(0, W + 60, 20):
            yy = y0 + amp * math.sin((x + i * 40) / period * 2 * math.pi)
            d += f"L {x} {yy:.1f} "
        parts.append(
            f'<path d="{d}" fill="none" stroke="{GT_OLIVE_700}" '
            f'stroke-width="1.2" opacity="0.08"/>'
        )
    return "".join(parts)


def forest_band() -> str:
    """Sage-tinted forest area, upper third."""
    return (
        # soft sage block, organic edge
        f'<path d="M 0 0 L {W} 0 L {W} 760 '
        f'C 820 820 720 700 540 740 '
        f'C 360 780 220 720 0 760 Z" '
        f'fill="{GT_SAGE}" opacity="0.42"/>'
        # darker sage fringe for depth
        f'<path d="M 0 720 '
        f'C 220 700 360 760 540 720 '
        f'C 720 680 820 800 {W} 740 L {W} 780 '
        f'C 820 820 720 700 540 740 '
        f'C 360 780 220 720 0 760 Z" '
        f'fill="{GT_OLIVE_700}" opacity="0.18"/>'
        # tree texture suggestion — small triangles scattered
        + "".join(
            f'<polygon points="{x},{y} {x-10},{y+18} {x+10},{y+18}" '
            f'fill="{GT_OLIVE_800}" opacity="0.22"/>'
            for x, y in [
                (140, 380), (210, 250), (300, 410), (380, 320),
                (470, 250), (520, 420), (820, 380), (900, 310),
                (170, 540), (260, 600), (350, 560), (440, 620),
                (560, 580), (760, 540), (870, 600), (960, 560),
            ]
        )
    )


def city_silhouette() -> str:
    """Subtle skyline indicating Hyderabad bottom-quarter."""
    bars = []
    base_y = 1640
    pattern = [40, 70, 50, 90, 60, 110, 50, 80, 60, 100, 45, 75, 55, 95, 50, 85, 60, 70, 50, 90, 55, 75, 65, 95]
    x = 0
    bw = W / len(pattern)
    for h_ in pattern:
        bars.append(
            f'<rect x="{x:.1f}" y="{base_y - h_}" width="{bw - 2:.1f}" '
            f'height="{h_}" fill="{GT_CHARCOAL}" opacity="0.08"/>'
        )
        x += bw
    return "".join(bars)


def orr_arc() -> str:
    """Outer Ring Road hint — thin charcoal sweep around the city pin."""
    return (
        f'<ellipse cx="{FIN_X + 60}" cy="{FIN_Y + 40}" rx="380" ry="180" '
        f'fill="none" stroke="{GT_CHARCOAL}" stroke-width="1.4" '
        f'stroke-dasharray="2 6" opacity="0.28"/>'
        f'<text x="{FIN_X - 290}" y="{FIN_Y + 230}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_MONO}" font-size="20" '
        f'letter-spacing="4" opacity="0.55">ORR</text>'
    )


def rrr_route() -> str:
    """Regional Ring Road — gold dashed connector AGARTHA → city."""
    # bezier curve north-east to south-west
    d = (
        f"M {AGARTHA_X} {AGARTHA_Y} "
        f"C {AGARTHA_X - 40} {AGARTHA_Y + 220}, "
        f"{FIN_X + 280} {FIN_Y - 380}, "
        f"{FIN_X} {FIN_Y}"
    )
    # midpoint on the curve (eyeballed) for the distance chip
    cx_mid, cy_mid = 560, 960
    return (
        # soft glow under the route
        f'<path d="{d}" fill="none" stroke="{GT_GOLD}" stroke-width="14" '
        f'opacity="0.16" stroke-linecap="round"/>'
        # main dashed gold
        f'<path d="{d}" fill="none" stroke="{GT_GOLD}" stroke-width="5" '
        f'stroke-dasharray="14 12" stroke-linecap="round"/>'
        # distance chip
        f'<rect x="{cx_mid - 200}" y="{cy_mid - 38}" width="400" height="76" '
        f'rx="38" ry="38" fill="{GT_CREAM}" stroke="{GT_GOLD}" stroke-width="2"/>'
        f'<text x="{cx_mid}" y="{cy_mid + 12}" '
        f'fill="{GT_OLIVE_900}" font-family="{FONT_MONO}" font-size="26" '
        f'letter-spacing="6" text-anchor="middle" font-weight="700">'
        f'≈ 40 MIN  ·  VIA THE RRR</text>'
        # tiny route label
        f'<text x="{cx_mid}" y="{cy_mid - 50}" '
        f'fill="{GT_GOLD}" font-family="{FONT_MONO}" font-size="16" '
        f'letter-spacing="6" text-anchor="middle">REGIONAL RING ROAD</text>'
    )


def agartha_pin() -> str:
    """Big gold leaf-pin with halo + label."""
    x, y = AGARTHA_X, AGARTHA_Y
    return (
        # outer pulse halo
        f'<circle cx="{x}" cy="{y}" r="62" fill="{GT_GOLD}" opacity="0.14"/>'
        f'<circle cx="{x}" cy="{y}" r="44" fill="{GT_GOLD}" opacity="0.22"/>'
        # pin body (teardrop)
        f'<path d="M {x} {y - 60} '
        f'C {x + 36} {y - 60}, {x + 36} {y - 12}, {x + 18} {y + 12} '
        f'L {x} {y + 42} '
        f'L {x - 18} {y + 12} '
        f'C {x - 36} {y - 12}, {x - 36} {y - 60}, {x} {y - 60} Z" '
        f'fill="{GT_GOLD}" stroke="{GT_CREAM}" stroke-width="3"/>'
        # leaf inside the pin
        f'<path d="M {x - 12} {y - 30} '
        f'C {x - 4} {y - 44}, {x + 12} {y - 40}, {x + 12} {y - 22} '
        f'C {x + 12} {y - 8}, {x - 4} {y - 4}, {x - 12} {y - 14} '
        f'C {x - 16} {y - 20}, {x - 16} {y - 24}, {x - 12} {y - 30} Z" '
        f'fill="{GT_CREAM}" opacity="0.95"/>'
        f'<line x1="{x - 8}" y1="{y - 18}" x2="{x + 8}" y2="{y - 32}" '
        f'stroke="{GT_GOLD}" stroke-width="1.4"/>'
        # ground shadow
        f'<ellipse cx="{x}" cy="{y + 56}" rx="22" ry="5" '
        f'fill="{GT_CHARCOAL}" opacity="0.22"/>'
        # label block
        f'<text x="{x + 70}" y="{y - 18}" '
        f'fill="{GT_OLIVE_900}" font-family="{FONT_DISPLAY}" font-size="46" '
        f'font-weight="800" letter-spacing="2">AGARTHA</text>'
        f'<text x="{x + 70}" y="{y + 14}" '
        f'fill="{GT_OLIVE_800}" font-family="{FONT_MONO}" font-size="20" '
        f'letter-spacing="4">25 ACRES  ·  AQI 12</text>'
        f'<text x="{x + 70}" y="{y + 46}" '
        f'fill="{GT_OLIVE_700}" font-family="{FONT_SERIF}" font-size="26" '
        f'font-style="italic">on the Narsapur forest boundary</text>'
    )


def financial_district_pin() -> str:
    """Small ash pin for Financial District."""
    x, y = FIN_X, FIN_Y
    return (
        f'<circle cx="{x}" cy="{y}" r="20" fill="{GT_CHARCOAL}" '
        f'stroke="{GT_CREAM}" stroke-width="3"/>'
        f'<circle cx="{x}" cy="{y}" r="6" fill="{GT_CREAM}"/>'
        f'<text x="{x - 28}" y="{y + 60}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_DISPLAY}" font-size="34" '
        f'font-weight="700" letter-spacing="1">FINANCIAL DISTRICT</text>'
        f'<text x="{x - 28}" y="{y + 90}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_MONO}" font-size="18" '
        f'letter-spacing="3" opacity="0.7">HYDERABAD  ·  GACHIBOWLI</text>'
    )


def compass() -> str:
    """Tiny N compass top-right."""
    cx, cy = 990, 200
    return (
        f'<circle cx="{cx}" cy="{cy}" r="42" fill="{GT_CREAM}" '
        f'stroke="{GT_OLIVE_900}" stroke-width="2"/>'
        # north arrow gold up
        f'<polygon points="{cx},{cy - 28} {cx - 10},{cy + 6} {cx + 10},{cy + 6}" '
        f'fill="{GT_GOLD}"/>'
        # south arrow dark down
        f'<polygon points="{cx},{cy + 28} {cx - 8},{cy + 4} {cx + 8},{cy + 4}" '
        f'fill="{GT_CHARCOAL}" opacity="0.6"/>'
        f'<text x="{cx}" y="{cy - 38}" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_DISPLAY}" font-size="20" font-weight="700" '
        f'text-anchor="middle">N</text>'
    )


def header() -> str:
    """Top crown caption + thin gold rule."""
    return (
        f'<text x="60" y="120" fill="{GT_GOLD}" '
        f'font-family="{FONT_MONO}" font-size="22" letter-spacing="8" '
        f'font-weight="700">LOCATION  MAP</text>'
        f'<text x="60" y="160" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_DISPLAY}" font-size="46" font-weight="800" '
        f'letter-spacing="-1">Where AGARTHA sits.</text>'
        f'<rect x="60" y="186" width="120" height="3" fill="{GT_GOLD}"/>'
        # forest label inside the sage band
        f'<text x="60" y="320" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_MONO}" font-size="20" letter-spacing="6" '
        f'opacity="0.78" font-weight="700">NARSAPUR  RESERVE  FOREST</text>'
    )


def footer() -> str:
    """GT mark + URL + legend."""
    return (
        # divider
        f'<line x1="60" y1="1740" x2="{W - 60}" y2="1740" '
        f'stroke="{GT_OLIVE_900}" stroke-width="1.2" opacity="0.3"/>'
        # legend
        f'<circle cx="80" cy="1790" r="10" fill="{GT_GOLD}"/>'
        f'<text x="104" y="1797" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">AGARTHA</text>'
        f'<circle cx="280" cy="1790" r="8" fill="{GT_CHARCOAL}"/>'
        f'<text x="300" y="1797" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">CITY ANCHOR</text>'
        f'<line x1="510" y1="1790" x2="555" y2="1790" stroke="{GT_GOLD}" '
        f'stroke-width="3" stroke-dasharray="8 6"/>'
        f'<text x="568" y="1797" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">RRR ROUTE</text>'
        # brand mark + URL
        f'<text x="60" y="1860" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_DISPLAY}" font-size="30" font-weight="800" '
        f'letter-spacing="2">GREEN  TEAM</text>'
        f'<text x="{W - 60}" y="1860" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_MONO}" font-size="22" letter-spacing="4" '
        f'text-anchor="end">thegreenteam.in</text>'
    )


def svg_body() -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">'
        # parchment bg
        f'<rect width="{W}" height="{H}" fill="{GT_CREAM}"/>'
        # subtle topo
        + topo_lines()
        # forest band
        + forest_band()
        # city silhouette
        + city_silhouette()
        # ORR ring
        + orr_arc()
        # RRR route + distance chip
        + rrr_route()
        # AGARTHA pin
        + agartha_pin()
        # Financial District pin
        + financial_district_pin()
        # Compass
        + compass()
        # Header
        + header()
        # Footer
        + footer()
        + "</svg>"
    )


def main() -> None:
    svg = svg_body()
    svg_path = OUT / "agartha-location-map.svg"
    svg_path.write_text(svg, encoding="utf-8")
    print(f"[svg] {svg_path.name}  {svg_path.stat().st_size // 1024} KB")

    # reel-native PNG (1080×1920) — direct render
    reel_path = OUT / "agartha-location-map-reel.png"
    cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=W, output_height=H,
        write_to=str(reel_path),
    )
    print(f"[reel] {reel_path.name}  {reel_path.stat().st_size // 1024} KB  1080×1920")

    # square PNG — render at native then center-crop
    sq_src = OUT / "_sq_src.png"
    cairosvg.svg2png(
        bytestring=svg.encode("utf-8"),
        output_width=W, output_height=H,
        write_to=str(sq_src),
    )
    im = Image.open(sq_src).convert("RGB")
    # crop centered around the route midpoint (covers AGARTHA pin + chip + city)
    crop_top = 420
    crop = im.crop((0, crop_top, W, crop_top + W))
    sq_path = OUT / "agartha-location-map-square.png"
    crop.save(sq_path, "PNG")
    sq_src.unlink()
    print(f"[sq]  {sq_path.name}  {sq_path.stat().st_size // 1024} KB  1080×1080")

    # landscape 1920×1080 — re-render via a landscape-rebuilt SVG
    land_svg = svg_body_landscape()
    land_path = OUT / "agartha-location-map-landscape.png"
    cairosvg.svg2png(
        bytestring=land_svg.encode("utf-8"),
        output_width=1920, output_height=1080,
        write_to=str(land_path),
    )
    (OUT / "agartha-location-map-landscape.svg").write_text(
        land_svg, encoding="utf-8"
    )
    print(f"[land] {land_path.name}  {land_path.stat().st_size // 1024} KB  1920×1080")


# ─── Landscape variant — separate layout so labels don't break ──────────
def svg_body_landscape() -> str:
    LW, LH = 1920, 1080
    AX, AY = 1280, 360
    CX_, CY_ = 600, 720
    # rrr curve mid
    mx, my = 940, 580
    parts = []
    parts.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{LW}" height="{LH}" '
        f'viewBox="0 0 {LW} {LH}">'
        f'<rect width="{LW}" height="{LH}" fill="{GT_CREAM}"/>'
    )
    # subtle topo
    for i, y0 in enumerate(range(80, LH - 60, 70)):
        amp = 12 + (i % 3) * 5
        period = 280
        d = f"M -20 {y0} "
        for x in range(0, LW + 60, 22):
            yy = y0 + amp * math.sin((x + i * 60) / period * 2 * math.pi)
            d += f"L {x} {yy:.1f} "
        parts.append(
            f'<path d="{d}" fill="none" stroke="{GT_OLIVE_700}" '
            f'stroke-width="1.2" opacity="0.07"/>'
        )
    # forest band — top-right block
    parts.append(
        f'<path d="M 700 0 L {LW} 0 L {LW} 540 '
        f'C 1500 580 1200 480 1050 520 '
        f'C 900 560 800 480 700 540 Z" '
        f'fill="{GT_SAGE}" opacity="0.42"/>'
    )
    # tree dots
    for x, y in [
        (1150, 140), (1240, 200), (1340, 160), (1450, 230),
        (1560, 180), (1700, 240), (1800, 180), (1620, 320),
        (1180, 320), (1330, 380), (1450, 360), (1720, 410),
    ]:
        parts.append(
            f'<polygon points="{x},{y} {x-10},{y+18} {x+10},{y+18}" '
            f'fill="{GT_OLIVE_800}" opacity="0.22"/>'
        )
    parts.append(
        f'<text x="1180" y="100" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_MONO}" font-size="20" letter-spacing="6" '
        f'opacity="0.78" font-weight="700">NARSAPUR  RESERVE  FOREST</text>'
    )
    # city silhouette bottom-left
    parts.append('<g opacity="0.10">')
    pattern = [40, 70, 50, 90, 60, 110, 50, 80, 60, 100, 45, 75, 55, 95, 50, 85]
    bw = 760 / len(pattern)
    base_y = 1000
    for i, h_ in enumerate(pattern):
        parts.append(
            f'<rect x="{i * bw:.1f}" y="{base_y - h_}" '
            f'width="{bw - 2:.1f}" height="{h_}" fill="{GT_CHARCOAL}"/>'
        )
    parts.append("</g>")
    # ORR ring around city
    parts.append(
        f'<ellipse cx="{CX_ + 40}" cy="{CY_ + 20}" rx="320" ry="180" '
        f'fill="none" stroke="{GT_CHARCOAL}" stroke-width="1.4" '
        f'stroke-dasharray="2 6" opacity="0.28"/>'
        f'<text x="{CX_ + 280}" y="{CY_ + 220}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_MONO}" font-size="20" '
        f'letter-spacing="4" opacity="0.55">ORR</text>'
    )
    # RRR curve
    d = (
        f"M {AX} {AY} C {AX - 60} {AY + 200}, "
        f"{CX_ + 220} {CY_ - 280}, {CX_} {CY_}"
    )
    parts.append(
        f'<path d="{d}" fill="none" stroke="{GT_GOLD}" stroke-width="14" '
        f'opacity="0.16" stroke-linecap="round"/>'
        f'<path d="{d}" fill="none" stroke="{GT_GOLD}" stroke-width="5" '
        f'stroke-dasharray="14 12" stroke-linecap="round"/>'
        # distance chip
        f'<rect x="{mx - 220}" y="{my - 38}" width="440" height="76" '
        f'rx="38" ry="38" fill="{GT_CREAM}" stroke="{GT_GOLD}" stroke-width="2"/>'
        f'<text x="{mx}" y="{my + 12}" '
        f'fill="{GT_OLIVE_900}" font-family="{FONT_MONO}" font-size="26" '
        f'letter-spacing="6" text-anchor="middle" font-weight="700">'
        f'≈ 40 MIN  ·  VIA THE RRR</text>'
        f'<text x="{mx}" y="{my - 50}" '
        f'fill="{GT_GOLD}" font-family="{FONT_MONO}" font-size="16" '
        f'letter-spacing="6" text-anchor="middle">REGIONAL RING ROAD</text>'
    )
    # AGARTHA pin (top-right)
    parts.append(
        f'<circle cx="{AX}" cy="{AY}" r="62" fill="{GT_GOLD}" opacity="0.14"/>'
        f'<circle cx="{AX}" cy="{AY}" r="44" fill="{GT_GOLD}" opacity="0.22"/>'
        f'<path d="M {AX} {AY - 60} '
        f'C {AX + 36} {AY - 60}, {AX + 36} {AY - 12}, {AX + 18} {AY + 12} '
        f'L {AX} {AY + 42} '
        f'L {AX - 18} {AY + 12} '
        f'C {AX - 36} {AY - 12}, {AX - 36} {AY - 60}, {AX} {AY - 60} Z" '
        f'fill="{GT_GOLD}" stroke="{GT_CREAM}" stroke-width="3"/>'
        f'<path d="M {AX - 12} {AY - 30} '
        f'C {AX - 4} {AY - 44}, {AX + 12} {AY - 40}, {AX + 12} {AY - 22} '
        f'C {AX + 12} {AY - 8}, {AX - 4} {AY - 4}, {AX - 12} {AY - 14} '
        f'C {AX - 16} {AY - 20}, {AX - 16} {AY - 24}, {AX - 12} {AY - 30} Z" '
        f'fill="{GT_CREAM}" opacity="0.95"/>'
        f'<line x1="{AX - 8}" y1="{AY - 18}" x2="{AX + 8}" y2="{AY - 32}" '
        f'stroke="{GT_GOLD}" stroke-width="1.4"/>'
        f'<ellipse cx="{AX}" cy="{AY + 56}" rx="22" ry="5" '
        f'fill="{GT_CHARCOAL}" opacity="0.22"/>'
        f'<text x="{AX + 70}" y="{AY - 18}" '
        f'fill="{GT_OLIVE_900}" font-family="{FONT_DISPLAY}" font-size="46" '
        f'font-weight="800" letter-spacing="2">AGARTHA</text>'
        f'<text x="{AX + 70}" y="{AY + 14}" '
        f'fill="{GT_OLIVE_800}" font-family="{FONT_MONO}" font-size="20" '
        f'letter-spacing="4">25 ACRES  ·  AQI 12</text>'
        f'<text x="{AX + 70}" y="{AY + 46}" '
        f'fill="{GT_OLIVE_700}" font-family="{FONT_SERIF}" font-size="26" '
        f'font-style="italic">on the Narsapur forest boundary</text>'
    )
    # Financial District pin (left-center)
    parts.append(
        f'<circle cx="{CX_}" cy="{CY_}" r="20" fill="{GT_CHARCOAL}" '
        f'stroke="{GT_CREAM}" stroke-width="3"/>'
        f'<circle cx="{CX_}" cy="{CY_}" r="6" fill="{GT_CREAM}"/>'
        f'<text x="{CX_ + 36}" y="{CY_ + 8}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_DISPLAY}" font-size="34" '
        f'font-weight="700" letter-spacing="1">FINANCIAL DISTRICT</text>'
        f'<text x="{CX_ + 36}" y="{CY_ + 38}" '
        f'fill="{GT_CHARCOAL}" font-family="{FONT_MONO}" font-size="18" '
        f'letter-spacing="3" opacity="0.7">HYDERABAD  ·  GACHIBOWLI</text>'
    )
    # Compass top-right corner
    cx, cy = 1830, 130
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="42" fill="{GT_CREAM}" '
        f'stroke="{GT_OLIVE_900}" stroke-width="2"/>'
        f'<polygon points="{cx},{cy - 28} {cx - 10},{cy + 6} {cx + 10},{cy + 6}" '
        f'fill="{GT_GOLD}"/>'
        f'<polygon points="{cx},{cy + 28} {cx - 8},{cy + 4} {cx + 8},{cy + 4}" '
        f'fill="{GT_CHARCOAL}" opacity="0.6"/>'
        f'<text x="{cx}" y="{cy - 38}" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_DISPLAY}" font-size="20" font-weight="700" '
        f'text-anchor="middle">N</text>'
    )
    # Header top-left
    parts.append(
        f'<text x="80" y="90" fill="{GT_GOLD}" '
        f'font-family="{FONT_MONO}" font-size="22" letter-spacing="8" '
        f'font-weight="700">LOCATION  MAP</text>'
        f'<text x="80" y="140" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_DISPLAY}" font-size="46" font-weight="800" '
        f'letter-spacing="-1">Where AGARTHA sits.</text>'
        f'<rect x="80" y="166" width="120" height="3" fill="{GT_GOLD}"/>'
    )
    # Footer band
    parts.append(
        f'<line x1="80" y1="990" x2="{LW - 80}" y2="990" '
        f'stroke="{GT_OLIVE_900}" stroke-width="1.2" opacity="0.3"/>'
        f'<circle cx="100" cy="1030" r="10" fill="{GT_GOLD}"/>'
        f'<text x="124" y="1037" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">AGARTHA</text>'
        f'<circle cx="300" cy="1030" r="8" fill="{GT_CHARCOAL}"/>'
        f'<text x="320" y="1037" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">CITY ANCHOR</text>'
        f'<line x1="530" y1="1030" x2="575" y2="1030" stroke="{GT_GOLD}" '
        f'stroke-width="3" stroke-dasharray="8 6"/>'
        f'<text x="588" y="1037" fill="{GT_CHARCOAL}" '
        f'font-family="{FONT_MONO}" font-size="18" letter-spacing="3">RRR ROUTE</text>'
        f'<text x="{LW - 80}" y="1037" fill="{GT_OLIVE_900}" '
        f'font-family="{FONT_MONO}" font-size="22" letter-spacing="4" '
        f'text-anchor="end">thegreenteam.in</text>'
    )
    parts.append("</svg>")
    return "".join(parts)


if __name__ == "__main__":
    main()
