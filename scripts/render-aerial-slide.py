#!/usr/bin/env python3
"""
Render an investor-deck slide (1920x1080 PNG) of a sanctuary on real Esri
World Imagery, with the established projects and landmarks around it,
distance rings and straight-line distances.

Needs internet (Esri tiles, Google Fonts) and Pillow:
    pip install pillow
    python3 scripts/render-aerial-slide.py syl out.png

Coordinates for every place come from its map listing (see lib/data/
aerial-scenes.ts); keep the two in step.
"""
import io, math, os, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageDraw, ImageFilter, ImageFont

SCENES = {
    'syl': {
        'name': 'MODCON SYL',
        'title': 'At the heart of South Hyderabad’s villa belt',
        'subtitle': 'MODCON SYL · Near Maheshwaram, South Hyderabad',
        'site': (17.1326227, 78.4783771),
        'rings': [5, 10],
        'projects': [
            ('Hallmark Oakshir', 'Villas', (17.165939, 78.457664)),
            ('Prajay Virgin County', 'Villas & apartments', (17.174722, 78.457222)),
            ('Ramky Discovery City', 'Integrated township', (17.177352, 78.479887)),
            ('Bliss in the Woods', 'Villas · Nestmakers', (17.191994, 78.437067)),
            ('Casagrand Windsor Court', 'Villas', (17.195438, 78.464687)),
            ('Vijayakalpa Kshetra', 'Villas', (17.209812, 78.492938)),
            ('Rukkha Residency', 'Residential', (17.210866, 78.478529)),
            ('Akshita Golden Breeze I', 'Plotted layout', (17.146458, 78.436103)),
            ('Akshita Golden Breeze II', 'Plotted layout', (17.105654, 78.42714)),
        ],
        'landmarks': [
            ('Shivaganga Temple', 'Maheshwaram town', (17.136528, 78.437839)),
            ('ORR Exit 14', 'Tukkuguda', (17.20917, 78.47639)),
            ('Fab City & E-City', 'Raviryal', (17.21611, 78.51306)),
            ('Wonderla', 'ORR Exit 13', (17.217289, 78.528505)),
            ('RGI Airport', 'Shamshabad', (17.240283, 78.429358)),
        ],
    },
}

W, H = 1920, 1080
TILE = 256
GOLD = (200, 169, 81)
INK = (10, 18, 8)
TEAL = (94, 234, 212)
# Satellite by default; for the road-map version run with
#   TILE_URL='https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png' GRADE=0 \
#   CREDIT='Map © OpenStreetMap contributors © CARTO'
TILE_URL = os.environ.get('TILE_URL', 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}')
GRADE = int(os.environ.get('GRADE', '70'))
CREDIT = os.environ.get('CREDIT', 'Imagery © Esri, Maxar, Earthstar Geographics')
FONTS = {
    'display': 'https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf',
    'body': 'https://github.com/google/fonts/raw/main/ofl/inter/Inter%5Bopsz,wght%5D.ttf',
}


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'TheGreenTeam-aerial/1.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()


_font_cache = {}
def font(role, size, weight):
    key = (role, size, weight)
    if key in _font_cache:
        return _font_cache[key]
    path = f'/tmp/{role}.ttf'
    if not os.path.exists(path):
        try:
            open(path, 'wb').write(fetch(FONTS[role]))
        except Exception:
            path = None
    try:
        f = ImageFont.truetype(path, size) if path else ImageFont.truetype('DejaVuSans-Bold.ttf', size)
        try:
            f.set_variation_by_axes([weight] if role == 'display' else [14 if size < 20 else 32, weight])
        except Exception:
            pass
    except Exception:
        f = ImageFont.load_default()
    _font_cache[key] = f
    return f


def project(lat, lng, z):
    s = TILE * 2 ** z
    sn = math.sin(math.radians(lat))
    return ((lng + 180) / 360 * s, (0.5 - math.log((1 + sn) / (1 - sn)) / (4 * math.pi)) * s)


def km(a, b):
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 2 * 6371 * math.asin(math.sqrt(h))


def main(scene_id, out):
    sc = SCENES[scene_id]
    site = sc['site']
    pts = [site] + [p[2] for p in sc['projects']] + [p[2] for p in sc['landmarks']]
    # keep the inner ring whole
    r0 = min(sc['rings']) * 1.05
    dlat, dlng = r0 / 110.95, r0 / (111.32 * math.cos(math.radians(site[0])))
    pts += [(site[0] + dlat, site[1]), (site[0] - dlat, site[1]), (site[0], site[1] + dlng), (site[0], site[1] - dlng)]

    # map area: right of the side panel
    panel = 560
    mx0, mx1, my0, my1 = panel + 60, W - 60, 150, H - 70
    ref = [project(*p, 0) for p in pts]
    minx, maxx = min(p[0] for p in ref), max(p[0] for p in ref)
    miny, maxy = min(p[1] for p in ref), max(p[1] for p in ref)
    fz = min(math.log2((mx1 - mx0) / (maxx - minx)), math.log2((my1 - my0) / (maxy - miny)), 16)
    tz = min(18, math.ceil(fz))
    k = 2 ** (fz - tz)
    cx_w = (minx + maxx) / 2 * 2 ** tz
    cy_w = (miny + maxy) / 2 * 2 ** tz
    ox, oy = (mx0 + mx1) / 2, (my0 + my1) / 2

    def to_px(ll):
        x, y = project(*ll, tz)
        return ox + (x - cx_w) * k, oy + (y - cy_w) * k

    # imagery for the whole canvas
    x0 = math.floor((cx_w - ox / k) / TILE); x1 = math.floor((cx_w + (W - ox) / k) / TILE)
    y0 = math.floor((cy_w - oy / k) / TILE); y1 = math.floor((cy_w + (H - oy) / k) / TILE)
    canvas = Image.new('RGB', (W, H), (27, 36, 20))
    jobs = [(tx, ty) for tx in range(x0, x1 + 1) for ty in range(y0, y1 + 1)]
    tile_dir = os.environ.get('TILE_DIR')  # offline testing only
    def get(job):
        tx, ty = job
        try:
            data = open(os.path.join(tile_dir, 'tile.png'), 'rb').read() if tile_dir else fetch(TILE_URL.format(z=tz, x=tx, y=ty))
            return job, Image.open(io.BytesIO(data)).convert('RGB')
        except Exception:
            return job, None
    missing = 0
    with ThreadPoolExecutor(16) as ex:
        for (tx, ty), img in ex.map(get, jobs):
            if img is None:
                missing += 1
                continue
            size = math.ceil(TILE * k) + 1
            canvas.paste(img.resize((size, size), Image.LANCZOS),
                         (round(ox + (tx * TILE - cx_w) * k), round(oy + (ty * TILE - cy_w) * k)))
    if missing:
        print(f'warning: {missing} tiles missing', file=sys.stderr)

    # grade: darken overall, much more under the side panel
    base = canvas.convert('RGBA')
    shade = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shade)
    sd.rectangle([0, 0, W, H], fill=(6, 12, 4, GRADE))
    for i in range(panel + 140):
        a = 225 if i < panel else int(225 * (1 - (i - panel) / 140))
        sd.line([(i, 0), (i, H)], fill=(8, 14, 6, a))
    base = Image.alpha_composite(base, shade)
    d = ImageDraw.Draw(base, 'RGBA')

    sx, sy = to_px(site)
    px_per_km = to_px((site[0], site[1] + 1 / (111.32 * math.cos(math.radians(site[0])))))[0] - sx

    # rings
    for r_km in sc['rings']:
        r = r_km * px_per_km
        steps = int(2 * math.pi * r / 14)
        for i in range(0, steps, 2):
            a0, a1 = 2 * math.pi * i / steps, 2 * math.pi * (i + 1) / steps
            d.line([(sx + r * math.cos(a0), sy + r * math.sin(a0)), (sx + r * math.cos(a1), sy + r * math.sin(a1))],
                   fill=(255, 255, 255, 150), width=2)
        f = font('body', 18, 700)
        t = f'{r_km} km'
        tw = d.textlength(t, font=f)
        d.text((sx - tw / 2, sy + r + 8), t, font=f, fill=(255, 255, 255, 220))

    taken = []
    def overlaps(a, b):
        return a[0] < b[2] and b[0] < a[2] and a[1] < b[3] and b[1] < a[3]

    site_card = (sx - 150, sy - 132, sx + 150, sy - 66)
    taken += [site_card, (sx - 26, sy - 66, sx + 26, sy + 4)]

    items = [(n, k_, ll, 'project') for n, k_, ll in sc['projects']] + [(n, k_, ll, 'landmark') for n, k_, ll in sc['landmarks']]
    items = sorted(items, key=lambda it: km(site, it[2]))
    # reserve every dot first so labels never cover another place's dot
    dots = {it[0]: to_px(it[2]) for it in items}
    for (x, y) in dots.values():
        taken.append((x - 11, y - 11, x + 11, y + 11))

    labels = []
    for name, kind, ll, cat in items:
        x, y = dots[name]
        dist = km(site, ll)
        dtxt = f'{dist:.1f} km'
        fn, fs = font('display', 22, 800), font('body', 16, 500)
        bw = max(d.textlength(name, font=fn), d.textlength(f'{kind} · {dtxt}', font=fs)) + 28
        bh = 60
        cands = []
        for g in (16, 70, 140):
            cands += [(x + g, y - bh / 2), (x - g - bw, y - bh / 2), (x - bw / 2, y + g), (x - bw / 2, y - g - bh),
                      (x + g * .7, y + g * .7), (x - g * .7 - bw, y + g * .7), (x + g * .7, y - g * .7 - bh), (x - g * .7 - bw, y - g * .7 - bh)]
        def ok(b):
            r = (b[0], b[1], b[0] + bw, b[1] + bh)
            if r[0] < panel + 20 or r[2] > W - 20 or r[1] < 20 or r[3] > H - 60:
                return False
            if any(overlaps(r, t) for t in taken if t != (x - 11, y - 11, x + 11, y + 11)):
                return False
            ex_, ey_ = min(max(x, r[0]), r[2]), min(max(y, r[1]), r[3])
            for s in range(1, 20):
                q = (x + (ex_ - x) * s / 20, y + (ey_ - y) * s / 20)
                if any(overlaps((q[0], q[1], q[0] + 1, q[1] + 1), t) for t in taken if t != (x - 11, y - 11, x + 11, y + 11)):
                    return False
            return True
        b = next((c for c in cands if ok(c)), cands[0])
        rect = (b[0], b[1], b[0] + bw, b[1] + bh)
        taken.append(rect)
        labels.append((name, kind, dtxt, cat, x, y, rect))

    # leader lines, then dots, then labels
    for name, kind, dtxt, cat, x, y, r in labels:
        ex_, ey_ = min(max(x, r[0]), r[2]), min(max(y, r[1]), r[3])
        if math.hypot(ex_ - x, ey_ - y) > 20:
            d.line([(x, y), (ex_, ey_)], fill=(255, 255, 255, 210), width=2)
    for name, kind, dtxt, cat, x, y, r in labels:
        if cat == 'project':
            d.ellipse([x - 10, y - 10, x + 10, y + 10], fill=TEAL + (255,), outline=INK + (255,), width=3)
        else:
            d.rectangle([x - 8, y - 8, x + 8, y + 8], fill=(255, 255, 255, 255), outline=INK + (255,), width=3)
    for name, kind, dtxt, cat, x, y, r in labels:
        d.rounded_rectangle(r, 10, fill=(10, 18, 8, 225), outline=(TEAL + (170,)) if cat == 'project' else None, width=2)
        d.text((r[0] + 14, r[1] + 8), name, font=font('display', 22, 800), fill=(255, 255, 255, 255))
        fs = font('body', 16, 500)
        d.text((r[0] + 14, r[1] + 36), f'{kind} · ', font=fs, fill=(255, 255, 255, 185))
        d.text((r[0] + 14 + d.textlength(f'{kind} · ', font=fs), r[1] + 36), dtxt, font=font('body', 16, 700), fill=GOLD + (255,))

    # the site
    pin = Image.new('RGBA', (90, 120), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pin)
    pd.ellipse([13, 6, 77, 70], fill=GOLD + (255,), outline=(255, 255, 255, 255), width=5)
    pd.polygon([(20, 52), (70, 52), (45, 112)], fill=GOLD + (255,))
    pd.line([(20, 54), (45, 112), (70, 54)], fill=(255, 255, 255, 255), width=5)
    pd.ellipse([33, 26, 57, 50], fill=INK + (255,))
    shadow = pin.split()[3].filter(ImageFilter.GaussianBlur(6)).point(lambda a: int(a * .55))
    base.paste((0, 0, 0), (int(sx - 45 + 3), int(sy - 112 + 6)), shadow)
    base.alpha_composite(pin, (int(sx - 45), int(sy - 112)))
    d = ImageDraw.Draw(base, 'RGBA')
    d.rounded_rectangle([site_card[0], site_card[1] - 14, site_card[2], site_card[3] - 14], 14, fill=GOLD + (255,))
    fn = font('display', 30, 800)
    tw = d.textlength(sc['name'], font=fn)
    d.text((sx - tw / 2, site_card[1] - 6), sc['name'], font=fn, fill=INK)
    fl = font('body', 15, 700)
    t = 'OUR PROJECT'
    d.text((sx - d.textlength(t, font=fl) / 2, site_card[1] + 30), t, font=fl, fill=INK)

    # side panel copy
    x = 70
    d.text((x, 80), 'THE GREEN TEAM', font=font('body', 18, 700), fill=GOLD)
    y = 130
    for line in wrap(d, sc['title'], font('display', 54, 800), panel - 110):
        d.text((x, y), line, font=font('display', 54, 800), fill=(255, 255, 255))
        y += 66
    y += 10
    d.text((x, y), sc['subtitle'], font=font('body', 20, 500), fill=(255, 255, 255, 200))
    y += 64
    n = len(sc['projects'])
    near = sorted(km(site, p[2]) for p in sc['projects'])
    within10 = sum(1 for v in near if v <= 10)
    stats = [(str(n), 'established residential projects mapped'), (str(within10), 'of them within 10 km of SYL'),
             (f"{km(site, sc['landmarks'][-1][2]):.0f} km", 'to RGI Airport, straight line')]
    for big, small in stats:
        d.text((x, y), big, font=font('display', 46, 800), fill=GOLD)
        d.text((x, y + 56), small, font=font('body', 18, 500), fill=(255, 255, 255, 210))
        y += 104
    # legend
    y = H - 170
    d.ellipse([x, y + 4, x + 20, y + 24], fill=TEAL, outline=INK, width=3)
    d.text((x + 34, y + 2), 'Residential project', font=font('body', 18, 600), fill=(255, 255, 255))
    d.rectangle([x + 2, y + 50, x + 18, y + 66], fill=(255, 255, 255), outline=INK, width=3)
    d.text((x + 34, y + 46), 'Landmark & infrastructure', font=font('body', 18, 600), fill=(255, 255, 255))
    d.text((x, H - 70), 'Distances are straight-line from SYL. Locations from public map listings.',
           font=font('body', 13, 400), fill=(255, 255, 255, 150))
    d.text((x, H - 48), CREDIT, font=font('body', 13, 400), fill=(255, 255, 255, 150))

    # scale bar + north arrow
    bar = 2 * px_per_km
    bx, by = W - 60 - bar, H - 44
    d.rectangle([bx, by, bx + bar, by + 4], fill=(255, 255, 255))
    d.rectangle([bx, by - 8, bx + 3, by + 4], fill=(255, 255, 255))
    d.rectangle([bx + bar - 3, by - 8, bx + bar, by + 4], fill=(255, 255, 255))
    f = font('body', 16, 700)
    d.text((W - 60 - d.textlength('2 km', font=f), by - 30), '2 km', font=f, fill=(255, 255, 255))
    nx, ny = W - 70, 70
    d.polygon([(nx, ny - 28), (nx + 13, ny + 10), (nx, ny + 2), (nx - 13, ny + 10)], fill=(255, 255, 255))
    f = font('display', 18, 800)
    d.text((nx - d.textlength('N', font=f) / 2, ny + 16), 'N', font=f, fill=(255, 255, 255))

    base.convert('RGB').save(out, 'PNG', optimize=True)
    print('wrote', out, 'zoom', round(fz, 2))


def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    return lines + [cur]


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'syl', sys.argv[2] if len(sys.argv) > 2 else 'aerial-slide.png')
