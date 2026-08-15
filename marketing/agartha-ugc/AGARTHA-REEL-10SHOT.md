# MODCON Agartha — 10-shot Instagram review reel

Replaces the single-shot approach. Same hard rules: **no prices, no rates, no
appreciation figures, no RERA number, no "investment/returns" language**, and
nothing that implies the homes are already built — these are renders.

---

## Why ten uploads showed you one place

A video model generates **one continuous shot per generation**. Reference images
are not played in sequence — they are blended into a single scene, and the
strongest one dominates. Ten seconds of unbroken footage can only be in one
place, so nine of your images were averaged into the background of the tenth.

A reel is not one shot. It is ten cuts. So: **ten generations, one image each,
cut together.** That is also why real property reels look the way they do.

Two things follow, and they matter more than any wording below:

**Use each image as the start frame, not as a "reference".** If your tool offers
image-to-video (a first-frame input), use it. That is what locks the clip to
*that* render instead of a model's idea of it. Text prompting with an attached
reference is much weaker.

**You will use ~1 second of each 8-second clip.** That is normal. Generate,
scrub, keep the best second, cut. Ten generations for a ten-second reel is the
actual cost of this format.

---

## The shape: place-dominant, 70/30

You asked for the place to carry it. So the face appears in three shots, and one
more has you walking through frame — the other six are pure location.

| # | ~Sec | Role | On camera | Suggested image |
| --- | --- | --- | --- | --- |
| 1 | 0.0–1.2 | Hook — you, talking, place behind | **You** | arrival / thatched villa |
| 2 | 1.2–2.1 | The approach | place | bamboo arch path |
| 3 | 2.1–3.0 | Facade reveal | place | wide establishing |
| 4 | 3.0–4.0 | The roof — the "wait, what" beat | place | hero green-roof house |
| 5 | 4.0–5.0 | You walking through frame, small in shot | **You (wide)** | hero house / lawn |
| 6 | 5.0–5.9 | Texture — materials up close | place | pergola courtyard detail |
| 7 | 5.9–6.8 | Water / planting | place | lily pond or garden |
| 8 | 6.8–7.8 | Living space glimpse | place | terrace or glass/bedroom |
| 9 | 7.8–8.8 | Golden hour — the feeling | place | fire pit at sunset |
| 10 | 8.8–10.0 | You, close, CTA | **You** | pergola or fire pit |

Map your ten uploads onto these ten roles. If two of your images serve the same
role, keep the better one and let another role take two shots.

---

## Blocks to paste identically into every generation

Consistency across ten clips comes from these being byte-identical. Do not
reword them between shots.

**STYLE block — every shot, all ten:**

```
Vertical 9:16, phone-shot Instagram reel footage. Authentic creator review, NOT
a real-estate commercial. Handheld with visible micro-shake, slightly imperfect
framing, natural colour, no cinematic grade, no music, no motion graphics, no
text overlay, no logo, no watermark, no slow-motion, no drone, no gimbal glide.
Photoreal. Warm natural Indian daylight.
```

**EXCLUDE block — every shot, all ten:**

```
STRICTLY EXCLUDE: any price, any rupee symbol or currency, any numeral shown or
spoken, any percentage, any RERA or registration number, any "investment",
"returns" or "appreciation" wording, any burned-in subtitle or caption, any
additional buildings, pools, fountains, signage or vehicles not present in the
source image, any additional people.
```

**CHARACTER block — only in shots 1, 5 and 10:**

```
CHARACTER: the person in the character reference image. Keep their face,
hairline, skin tone, build and features consistent and photoreal. Same plain
linen shirt in an earthy neutral colour, no logos, in every shot they appear in.
They are the only person on camera.
```

---

## The ten shot prompts

Each is: **start frame = that image**, then STYLE + the SETTING/CAMERA line
below + EXCLUDE (+ CHARACTER where marked).

**Shot 1 — hook** *(+ CHARACTER)*
```
The person stands in the drive in front of the thatched villa, coconut palms
behind. Medium shot, camera held by a friend at chest height, ~1.5 m away.
They look straight to camera and start talking mid-thought, casual, half-smiling.
Small handheld drift. Morning light.
```

**Shot 2 — the approach**
```
Camera walks forward along the stone path under the bamboo archway, planting in
green and crimson pressing in on both sides. POV walking pace, handheld sway,
a leaf brushes the lens in the foreground. No people in frame.
```

**Shot 3 — facade reveal**
```
Camera pans slowly left to right across the full facade — curved ramp, bamboo
railed terrace, open lawn. Handheld, slightly uneven pan speed, as if the person
filming is turning on the spot. No people in frame.
```

**Shot 4 — the roof**
```
Camera tilts up from the flagstone path to the living roof — grass and ivy
growing across the top of the house — then holds. Handheld, a small overshoot
and correction on the tilt. Dappled light moving. No people in frame.
```

**Shot 5 — you in the space** *(+ CHARACTER)*
```
Wide shot. The person walks slowly left to right across the lawn in front of the
house, small in frame, not looking at camera, hands in pockets. Camera static-ish
handheld, letting them cross. The house and its green roof fill most of the
frame. They occupy less than a fifth of it.
```

**Shot 6 — texture**
```
Close, slow handheld push toward the dark stone wall, terracotta pots and agave
in the pergola courtyard. Shallow depth of field, warm light raking across the
stone texture. No people in frame.
```

**Shot 7 — water and planting**
```
Low camera near the lily pond, water surface in the foreground catching light,
planting and the house soft behind. Small handheld drift. Faint ripples.
No people in frame.
```

**Shot 8 — living space glimpse**
```
Camera moves slowly past the glass, catching the reflection of trees on it and
the room dimly visible beyond. Handheld walking pace, parallax across the frame.
No people in frame.
```

**Shot 9 — golden hour**
```
Golden hour. Camera set low beside the sunken fire pit under the timber pergola,
long warm light raking across the stone benches, villa behind. Very slow
handheld drift. Embers or soft smoke. No people in frame.
```

**Shot 10 — CTA** *(+ CHARACTER)*
```
The person stands in the pergola courtyard, medium close-up, closer than any
other shot. They speak directly to camera, warm and unhurried, then stop and
just look at camera for the final beat. Evening light.
```

---

## Audio: record it once, lay it over everything

Ten generated clips give you ten disjointed audio beds — that alone will make the
reel read as AI. Do this instead:

1. **Record the voiceover yourself, on your phone, in one take.** Your real voice
   is the single highest-trust element in a review reel and costs nothing.
2. Lay it across all ten cuts as one continuous track.
3. Keep a low bed of ambient birdsong underneath. Mute the generated audio.
4. No music. A review reel with a music bed reads as an ad.

**The script — one continuous read, ~10 seconds, no numbers:**

> "Okay so this is the one I keep coming back to. Forty minutes out of Hyderabad —
> the trees here were already here, they built around them. That roof is alive,
> that's actually growing. Come see it at this hour. Message us, we'll walk you
> through it ourselves."

Only "forty minutes" is a figure, and it is spoken, never shown. Nothing else
numeric goes in the audio or the frame.

---

## Edit recipe

- Cut on the **beat of your own speech**, not on a fixed 1-second grid — the cut
  should land where you breathe. That single habit is most of the difference
  between a reel and a slideshow.
- Hold shot 1 slightly longer than the rest; hold shot 10 longest. The middle
  eight can be fast.
- Add your text overlay **in the editor, not in the generation**. One line, last
  1.5 seconds: `thegreenteam.in — book a free adviser call`. Models render text
  badly and will misspell it.
- Export 1080×1920, 30 fps.

---

## If you truly need it in one generation

Ten places will not fit. Two or three will, via a continuous walking reveal:

```
Vertical 9:16, 8 seconds, one continuous handheld walking shot, phone-shot reel
footage. Camera walks forward along a stone path under a bamboo archway with
dense green and crimson planting, emerges into an opening, and continues toward
a low earth-toned home with a living ivy-covered green roof and a curved
tree-shaped timber door, a lily pond to the left. The camera keeps moving the
whole time — no cuts. Walking-pace sway, natural parallax as planting passes the
lens, warm late-afternoon light, photoreal, natural colour, no grade, no music,
no people in frame.
```

Then cut that together with two or three others. It is the same method, just
fewer, longer pieces.

---

## Before you publish

- Watch muted: any numeral, any currency symbol in frame → re-generate that shot.
- Watch with sound: any figure spoken beyond "forty minutes" → re-record.
- Check nothing implies completed construction.
- Confirm your face is recognisably the same in shots 1, 5 and 10.
- One destination only: the free adviser call at `thegreenteam.in/adviser-call`,
  or WhatsApp. Never a price.
