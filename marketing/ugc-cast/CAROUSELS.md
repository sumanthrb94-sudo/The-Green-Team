# Per-project carousel posts

Run:

```sh
GEMINI_API_KEY=... node scripts/generate-carousels.mjs           # every project
GEMINI_API_KEY=... node scripts/generate-carousels.mjs agartha   # just one
```

4K (~3072 × 3840), 4:5 feed ratio. Change `RATIO` to `'9:16'` at the top of the
script for stories. Output goes to `marketing/ugc-cast/out/<project>/` and is
gitignored — 4K PNGs regenerate, they do not belong in history.

## What is in each set

**Agartha — 6 frames.** Arrival with the host · the planted roofline · the
bamboo arch path · a materials detail · golden hour at the fire pit with the
host · a wide closing card with the host. Sources are the six curated stills in
`marketing/agartha-ugc/`, already picked as the best of the gallery.

**SYL — 5 frames.** Facade into sky · a planted balcony · dusk forecourt with
the host · the street approach · an interior by the glazing with the host.

**Dates County — none, and this is deliberate.** Its gallery has no usable
imagery: `forest.jpg` is an interior overlooking tennis courts and temperate
woodland, `field.jpg` is a green-roofed township aerial, `water.jpg` is a
meadow stream. None of it is Kandukur or the Deccan, and the filenames do not
describe the contents. A carousel built on that shows a buyer a place that does
not exist with our name attached. It needs a site shoot or real renders from
Planet Green; then it takes five frames like the others.

## The bug this script exists to avoid

A source render is **landscape**. A social post is **vertical**. Handing a
landscape still to a generator targeting 4:5 or 9:16 fails one of two ways, and
the first video batch produced both:

- it letterboxes the source, then crops in so hard the building disappears —
  the SYL balcony clip became anonymous repeating slabs;
- or it fills the empty frame by **inventing architecture**. The Agartha
  terrace clip started from a flagstone plunge pool and became a different
  pergola-and-pool scene by the second frame.

The second is not a quality problem. It is a misrepresentation problem — an ad
showing a property we do not represent — which is the exact objection that
keeps Dates County out of the set above.

So every frame is composed vertically **in the generation itself**, from both
references at once, with an explicit instruction to recompose and never extend.
Nothing is ever handed a mismatched aspect ratio. The `FIDELITY` block in the
script is that instruction; do not reword it per shot.

## Other things learned the expensive way

**Serial, not parallel.** Eight concurrent jobs tripped the per-minute quota;
four were rejected outright and had to be re-run, so the throughput gain was
zero. The script sleeps 6s between frames and backs off on failure.

**Watch the output before shipping it.** There is no ffmpeg or image viewer in
a default container. `npm i ffmpeg-static` takes seconds and would have caught
all of the above on frame one instead of after nine generations.

**402 means credits, not rate limiting.** `Your prepayment credits are
depleted` does not clear on its own — top up at <https://ai.studio/projects>.
The script exits immediately on 402 rather than burning retries.

## Rules carried from `README.md`

Sources are **renders**, so nothing may imply completed construction. No price,
rate, appreciation figure or RERA number in the creative. Tara is a host, not a
customer — she never depicts owning or earning. Every placement carries a
visible **"Virtual host · AI-generated"** label.
