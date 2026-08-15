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

## Read pace

The client reads at **~2.25 words/sec**, measured from their two delivered
files (56 words / 23.96s and ~36 words / 16.2s) — noticeably faster than the
skill's 2.05 default. Scripts below are 70–75 words, landing ~31–33s. Recheck
this against each new recording and adjust.

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

That's not landscaping. That's permaculture — the farm gets designed before
it gets sold.

Plant a farm, or inherit one?

Comment PLANTED — I'll send you the layout.
```

~70 words · ~31s

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

Comment FARMED — I'll send you how the estate runs it.
```

~72 words · ~32s

**Compliance note:** the CTA deliberately says "how the estate runs it" —
the reply is where the paid-service terms get explained. The script never
says the management is included or free.

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
Water to the roots, not into the air.

It's the least romantic part of permaculture and the part that decides
everything else.

A water plan, or a water hope?

Comment WATER — I'll send you the site plan.
```

~74 words · ~33s

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

Herbs at the door.
Vegetables you didn't drive anywhere for.
A farm-to-table kitchen for the evenings you don't cook.

Permaculture calls it an edible forest. It just means the land feeds the
people living on it.

Do you grow anything you actually eat?

Comment EDIBLE — I'll send you the planting list.
```

~75 words · ~33s

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

Agartha sits on the Narsapur forest boundary — native dry deciduous,
already standing.

The permaculture design works with that forest instead of replacing it.
Paths bend around what was already growing.

Every other film in this series is about what we planted.
This one is about what we didn't touch.

Trees, or a forest?

Comment FOREST — I'll send you the walkthrough.
```

~72 words · ~32s

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

The five CTA words are all different (PLANTED · FARMED · WATER · EDIBLE ·
FOREST), so comment volume per film is separately measurable. That's the
point of varying them.

## Per-film build loop

Per the skill: record the voiceover against the exact script text above,
generate the two or three new clips, send both back. Then transcribe → align
→ render → mix → encode → verify, and ship with the check numbers (A/B/D/E/F/G
+ peak level) measured from the encoded MP4.
