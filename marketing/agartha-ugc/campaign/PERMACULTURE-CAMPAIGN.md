# Agartha — permaculture campaign, 5 films

Five voiceover films, one per permaculture pillar. Built for the
`voiceover-skill-mastery` format: 1080×1920, ~30–33s, word-synced captions,
three real-world clips per film at fixed slots, SFX bed.

Every claim below is sourced from repo data — `lib/data/agartha-layout.ts`,
`lib/data/sanctuaries.ts`, `lib/data/faq.ts` — not invented for the campaign.
If a spec changes in those files, the affected script changes too.

## What Agartha actually does (the source facts)

| Feature | Where it's from |
| --- | --- |
| On-site Goshala, integrated animal husbandry | `agartha-layout.ts` → `goshala` hotspot |
| 100+ tree varieties, pre-planted per plot | same |
| Advanced drip irrigation, every plot | same + `sanctuaries.ts` features |
| Vegetable beds + spiral herbal garden | same — described as "your private edible forest" |
| Farm-to-table dining, 36,000 sq ft clubhouse | `agartha-layout.ts` → `amenity-core` |
| Narsapur forest boundary, native dry deciduous, bird corridors | `agartha-layout.ts` → `forest-buffer` |
| 25 acres, 36 plots, near RRR, 40 min from Financial District | `sanctuaries.ts` |

## Hard constraints — apply to all five

- **No pricing, no rates, no rupee figures, no appreciation or ROI language,
  no RERA number.** The repo holds ₹8,500/sq yd, ₹68.7 L, +37.1% etc. None of
  it goes in a script. The only spoken figure across the campaign is
  "forty minutes," plus "over a hundred varieties" in Film 1 (a developer spec
  about their own product, not a market statistic).
- **No statistics that invite "source?"** — AQI 12 and 18 dB are real and in
  the repo, but they're measurement claims. Keep them out of the voiceover;
  put them on-screen as type if they're needed at all.
- **These are renders.** Never "already built," "move in now." Present or
  future tense about the plan, not the finished thing.
- **Maintenance is a paid service.** `faq.ts` is explicit that the managed-farm
  arrangement "is a service with terms and a cost, both set by the developer."
  Film 2 must not imply it's free or included.
- Clip prompts: no people, no faces, no hands, no text, no logos, no readable
  screens. Objects and spaces only.

## Read pace and length

The client reads at **~2.25 words/sec**, measured from their two delivered
files (56 words / 23.96s and ~36 words / 16.2s) — noticeably faster than the
skill's 2.05 default. Recheck against each new recording and adjust.

**Target ~58–62 words ≈ 26–28s of voice.** The animated outro adds 4s, so a
finished film lands at ~30–32s. Writing to the skill's raw 70-word target
would push these past 35s.

## The outro carries the CTA — scripts must not

`marketing/agartha-ugc/reel/outro-animated.mp4` ends every film with
**COMMENT "PRICE"** and *or DM us to book a site visit* on screen, held for
4s with a pulsing button. So none of the scripts below end with a spoken
"Comment X" line — the voice saying what the card already says is exactly
the never-show-the-same-words-twice failure the format is built to avoid.

Every script therefore **ends on its question** and hands off to the outro.
The question is still the engagement driver; the card is still the
conversion. They just don't overlap.

Per-film comment tracking is lost by using one shared CTA word. If that
matters more than the duplication, re-render the outro per film with a
different word in the `.pill` — cheap, it's one text edit and a re-render.

## Shared palette line — append to every clip prompt

> *muted desaturated palette, deep forest green and warm kraft brown, soft
> overcast daylight from one side, shallow depth of field, subtle film grain,
> no text or branding anywhere*

---

# Film 1 — The land is already planted

**Pillar:** 100+ tree varieties, pre-planted before handover.
**Objection it kills:** "farmland means starting from bare dirt and waiting."

```
Most farmland is sold as dirt. You plant it. You wait ten years. Maybe.

Forty minutes out of Hyderabad, Agartha does it backwards.

The trees go in before you sign.
Over a hundred varieties per plot.
Drip lines already running. Roots already holding the soil.

That's permaculture — the farm gets designed before it gets sold.

Plant a farm, or inherit one?
```

~61 words · ~27s voice · ~31s with outro

| Slot | Job | Clip |
| --- | --- | --- |
| **A** ~15–25% | The world of the problem: raw, empty | Bare tilled earth, boundary stone, nothing growing. Static locked-off, very slow drift in. **New generation.** |
| **B** ~45–60% | The turn: intervention | Young sapling with a drip emitter beside it, water darkening the soil. Slow push in. **New generation.** |
| **C** ~75–90% | Resolution: established, ordered | Mature planted rows under canopy. Existing bamboo-path clip works. |

---

# Film 2 — Who farms it when you're not there

**Pillar:** Goshala + animal husbandry, land managed as a working farm.
**Objection it kills:** the single biggest farmland fear — absentee neglect.

```
Farmland rarely fails because people stop caring. It fails because they live
two hours away.

Agartha runs as a working farm, not a parked asset.

An on-site Goshala. Animal husbandry feeding the soil back.
Drip irrigation on every plot.
Someone there on the days you're not.

The land keeps working whether or not you make it out that weekend.

Farmed, or just owned?
```

~63 words · ~28s voice · ~32s with outro

**Compliance note:** the script says the land "keeps working" and never that
the management is included or free. `faq.ts` is explicit that it carries
developer-set terms and cost — that conversation belongs in the DM reply,
not in the film.

| Slot | Job | Clip |
| --- | --- | --- |
| **A** ~15–25% | Neglect — the world of the problem | Weed-choked plot behind a rusted fence, boundary stones half-buried. Static, imperceptible drift. **New generation.** |
| **B** ~45–60% | The turn: the farm working | Goshala — cattle shed interior, feed, straw, compost heap steaming in cool air. Slow drift sideways. **New generation.** |
| **C** ~75–90% | Resolution: tended and calm | Pergola courtyard, terracotta, raking warm light. Existing pergola clip. |

---

# Film 3 — Water

**Pillar:** drip irrigation laid before handover.
**Objection it kills:** "green in the brochure, dead by summer."

```
Every farm plot near Hyderabad looks green in the brochure. Ask what it looks
like in April.

Water decides whether farmland stays farmland.

At Agartha the drip lines are laid before handover.
Every plot. Not a borewell and good luck.

The least romantic part of permaculture — and the part that decides
everything.

A water plan, or a water hope?
```

~59 words · ~26s voice · ~30s with outro

| Slot | Job | Clip |
| --- | --- | --- |
| **A** ~15–25% | The world of the problem: dry | Cracked dry earth, brittle stubble, hard overhead light. Static. **New generation.** |
| **B** ~45–60% | The turn: the mechanism | Macro on a drip emitter, a bead forming and falling, soil darkening. Slow push. **New generation.** |
| **C** ~75–90% | Resolution: lush, opposite of A | Dense green canopy, dappled light. Existing bamboo-path clip. |

---

# Film 4 — You can eat it

**Pillar:** vegetable beds, spiral herbal garden, farm-to-table.
**Objection it kills:** "a farm plot is decoration I'll never use."

```
A garden you look at is a hobby. A garden you eat from is something else.

Agartha plots come with vegetable beds and a spiral herbal garden.

Vegetables you didn't drive anywhere for.
A farm-to-table kitchen for the evenings you don't cook.

Permaculture calls that an edible forest. It just means the land feeds the
people living on it.

Do you grow anything you actually eat?
```

~64 words · ~28s voice · ~32s with outro

| Slot | Job | Clip |
| --- | --- | --- |
| **A** ~15–25% | The world: ornamental only | A clipped ornamental lawn — pretty, sterile, nothing edible. Static, observational. **New generation.** |
| **B** ~45–60% | The turn: it's food | Spiral herb garden from above, herbs moving in wind; ripe vegetables on the plant. Slow drift. **New generation.** |
| **C** ~75–90% | Resolution: the table | Farm-to-table setting — plates, produce, warm evening light, no people. **New generation**, or existing golden-hour footage. |

---

# Film 5 — The forest was there first

**Pillar:** Narsapur boundary, native dry deciduous, bird corridors.
**Role:** campaign closer. Everything before this was about what was *added*;
this one is about what was *left alone*.

```
Most projects clear the forest, then plant saplings and call it green.

Agartha sits on the Narsapur forest boundary. Native dry deciduous,
already standing.

The permaculture design works with that forest instead of replacing it.
Paths bend around what was already growing.

Stand in it and the loudest thing all day is birds.

So — trees, or a forest?
```

~58 words · ~26s voice · ~30s with outro

**This is the one to record first.** All three clip slots are already
covered by existing footage, so it can go from voiceover to finished film
without waiting on any generation.

| Slot | Job | Clip |
| --- | --- | --- |
| **A** ~15–25% | The world: wild forest, nothing built | Existing bamboo-path clip — dense canopy, no structure in frame. |
| **B** ~45–60% | The turn: forest becomes property | Existing aerial drone clip — pulls back from structure into forest context. |
| **C** ~75–90% | Resolution: ordered, human, warm | Existing pergola-courtyard clip — stone, terracotta, warm light. Visually opposite to A's wild green. |

**Film 5 needs zero new clips** — all three slots are covered by footage
already in `marketing/agartha-ugc/`. Shoot it first if you want one in the
can quickly.

---

## Production order

Recommended, if they don't all ship at once:

1. **Film 5** — no new clips needed, ships immediately.
2. **Film 2** — the strongest objection-killer; the Goshala clip is the most
   distinctive thing in the campaign.
3. **Film 1** — establishes the "designed before sold" idea the others lean on.
4. **Film 3** — water; hardest clip to make look good, needs macro work.
5. **Film 4** — edible; the warmest, best as a closer if 5 runs earlier.

All five currently share the outro's one CTA word, so comment volume tells
you the campaign is working but not which film did the work. If you want
per-film attribution, re-render the outro with a different word per film
(PLANTED · FARMED · WATER · EDIBLE · FOREST) — it's a one-line text edit in
`motion/outro-motion.html` plus a re-render, and the SFX cues don't move.

## Per-film build loop

Record the voiceover against the exact script text above, generate whatever
new clips that film needs, send both back. Then: transcribe → align → render
→ mix → encode → verify, append `reel/outro-animated.mp4`, and ship with the
check numbers measured from the encoded MP4.

Two things to carry into every build, both learned the hard way here:

- **`amix` needs `normalize=0`.** Without it, every input is divided by the
  input count, so adding an SFX bed silently drops the voice ~10 dB. Measure
  the voice region of the finished MP4, not just the overall peak.
- **Chain crossfade offsets off fixed target durations**, not off each merge
  step's measured duration, or the total drifts long and needs a corrective
  trim. Both traps are written up in `reel/README.md`.
