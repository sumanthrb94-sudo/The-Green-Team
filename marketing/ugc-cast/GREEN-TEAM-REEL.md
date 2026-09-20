# The Green Team — brand reel (9 shots)

A brand reel, not a project reel. `agartha-ugc/AGARTHA-REEL-10SHOT.md` sells one
place; this one sells the thing we actually are — the people who check a place
before you see it — and uses two projects as evidence.

Same 70/30 shape as that doc, and for the same reason: **a video model generates
one continuous shot per generation.** A reel is cuts, not footage. Nine
generations, one source image each, cut together.

## The cut

Tara appears in three of nine. The other six are the places, moving slowly.

| # | ~Sec | Role | On camera | Source image | Clip |
| --- | --- | --- | --- | --- | --- |
| 1 | 0.0–1.4 | Hook — her, talking, Agartha behind | **Tara** | `tara-agartha-seed.png` | `tara-agartha.mp4` |
| 2 | 1.4–2.4 | The approach | place | `gallery/agartha/11.webp` | `reel-02-approach` |
| 3 | 2.4–3.3 | Terrace + water | place | `gallery/agartha/18.webp` | `reel-03-terrace` |
| 4 | 3.3–4.3 | Golden hour — the feeling | place | `agartha-ugc/05-golden-hour-firepit.jpg` | `reel-04-goldenhour` |
| 5 | 4.3–5.2 | Register change — SYL facade | place | `gallery/syl/syl-facade-sky.webp` | `reel-05-syl-facade` |
| 6 | 5.2–6.1 | Planted balcony, close | place | `gallery/syl/syl-balcony-detail.webp` | `reel-06-syl-balcony` |
| 7 | 6.1–7.1 | SYL at dusk | place | `gallery/syl/syl-exterior-dusk.webp` | `reel-07-syl-dusk` |
| 8 | 7.1–8.2 | Her walking through frame, small | **Tara (wide)** | `seed-tara-wide.png` | `reel-08-tara-wide` |
| 9 | 8.2–10.0 | Her, close, CTA | **Tara** | `tara-agartha-seed.png` | `reel-09-tara-cta` |

**You will use about one second of each eight-second clip.** Generate, scrub,
keep the best second, cut. That ratio is the real cost of the format, not a
sign anything went wrong.

## What she says

Shot 1 — `"Forty-five minutes from Hyderabad. The AQI here is twelve. We check
air, quiet, access and title — before you ever see it."`

Shot 9 — `"Two places near Hyderabad, open to see now. We're not the builder —
we're the ones who check them first."`

Nothing else is spoken. Shots 2–8 are ambient only, and their prompts say so
explicitly, because Veo will invent a voiceover if you leave the question open.

## Why Dates County is not in it

It has no usable imagery. `gallery/dates-county/forest.jpg` is an interior
looking out at tennis courts and temperate forest; `field.jpg` and `water.jpg`
are an aerial of a green-roofed township and a meadow stream. None of it is
Kandukur, none of it is Deccan plateau, and the filenames do not describe the
contents. Cutting that into a reel would show a buyer a place that does not
exist and call it a project we represent — which is the precise thing our own
listing standard forbids, and the kind of representation TG-RERA acts on.

Shoot the site, or get real renders from Planet Green, and it earns three shots.

## Rules carried from `README.md`

Sources are **renders**, so nothing may imply completed construction. No price,
rate, appreciation figure or RERA number in a cut this short. She is a host, not
a customer — she never reports buying, owning or earning. Every placement
carries a visible **"Virtual host · AI-generated"** label.

## Regenerating

Each clip is image-to-video: the source image is the **first frame**, never a
loose "reference". That is what pins a clip to that render instead of the
model's idea of it. The STYLE and SILENT blocks must stay byte-identical across
shots — reworded blocks are where cut-to-cut consistency goes.
