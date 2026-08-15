# MODCON Agartha — UGC video ad prompts (Gemini omni)

**Hard rule baked into every prompt below: no prices, no per-sq-yd rates, no
appreciation figures, no RERA number, no "investment/returns" language.** The ad
sells the feeling and the location; the number is a conversation, not a caption.

**Second rule:** these are architectural *renders*, not photographs of finished
homes. Say "coming up next to the Narsapur forest", never "already built" or
"move in now".

---

## 0. What to upload

Upload in this order — order matters, the model refers to them as image 1…7.

| # | File | Role in the ad |
| --- | --- | --- |
| 1 | *your own photo* | **Character reference.** Clear, well-lit, front-facing, head + shoulders, plain background, no sunglasses, no other faces in frame. |
| 2 | `01-hero-green-roof-house.jpg` | Hero / money shot — biomorphic earth-toned home, ivy-covered green roof, tree-shaped door, lily pond |
| 3 | `02-wide-establishing.jpg` | Wide establishing — full facade, curved ramp, bamboo-railed terrace, open lawn |
| 4 | `03-bamboo-arch-path.jpg` | Walking beat — bamboo-arched stone path through planted garden |
| 5 | `04-arrival-thatched-villa.jpg` | Arrival beat — thatched A-frame villa, coconut palms, drive |
| 6 | `05-golden-hour-firepit.jpg` | Emotional close — golden hour, timber pergola, sunken fire pit |
| 7 | `06-pergola-courtyard-detail.jpg` | Texture beat — dark stone wall, terracotta pots, agave, glass |

If your character reference is weak, everything else fails — re-shoot it before
you re-prompt. One face, even lighting, neutral expression.

---

## 1. Single-shot prompt (start here)

Most video models give you one ~8-second clip per generation. This is the one
clip to make first — it is the whole ad if you only ship one.

```
Vertical 9:16 short-form social video, 8 seconds, single continuous handheld
shot. Authentic creator-filmed UGC look — NOT a corporate real-estate
advertisement.

CHARACTER: the person in image 1. Keep their face, hairline, skin tone, build
and features consistent and photoreal for the entire clip. They are the only
person on camera. Dressed simply — plain linen or cotton shirt, earthy neutral
colour, no logos, no suit, no blazer.

SETTING: they are standing outdoors at the property shown in image 2 — a
low-rise earth-toned home with a living ivy-covered green roof, an organically
curved tree-shaped timber door, a flagstone path and a small lily pond, with
mature trees and dense forest canopy behind. Warm late-afternoon Indian light,
soft dappled shade moving across them, real depth of field, natural colour.

CAMERA: filmed on a phone held at chest height by a friend, roughly 1.5 m away.
Loose handheld micro-shake, a small natural reframe as they gesture. Starts on
a medium shot of them, drifts slightly to reveal the green roof and the door
behind them. No drone, no crane, no gimbal glide, no zoom punch, no cuts.

PERFORMANCE: they speak straight to camera, relaxed and conversational, like
they are sending a video to a friend. Half-smile, real eye contact, one small
hand gesture toward the house. Natural pace, not presenter-energy.

DIALOGUE (spoken clearly in this exact wording, natural Indian English accent):
"I keep coming back to this one. Forty minutes out of Hyderabad, and the
loudest thing here is the birds."

AUDIO: their voice, close and slightly roomy as a phone mic would record it.
Background — layered birdsong, leaves in wind, faint water. No music bed, no
voiceover, no sound effects.

TEXT ON SCREEN: none.

STRICTLY EXCLUDE: any price, any number with a rupee sign, any percentage or
figure, any RERA or registration number, any "investment", "returns" or
"appreciation" wording, any logo or watermark, any subtitles or captions burned
in, any second person, any stock-footage polish, any cinematic colour grade,
any lens flare, any slow-motion.
```

---

## 2. Five-clip sequence (the full 30–35 s ad)

Generate each separately, then cut them together in order. Keep the CHARACTER
and STRICTLY EXCLUDE blocks identical in all five — that is what holds your face
consistent across clips.

### Clip 1 — Hook (0–7 s) · use image 5 (`04-arrival-thatched-villa.jpg`)

```
Vertical 9:16, 7 seconds, handheld phone UGC. The person from image 1, walking
slowly toward camera along the drive shown in image 5 — thatched A-frame villa,
coconut palms, low villas behind, warm morning light. Camera walks backwards
ahead of them, loose handheld, slightly low. They speak to camera mid-stride,
casual, a little amused:
"Everyone told me you can't get quiet this close to the city."
Audio: their voice on a phone mic, birds, footsteps on gravel, light wind. No
music. No text on screen. No prices, no numbers, no figures of any kind.
Photoreal, natural colour, no cinematic grade.
```

### Clip 2 — The place (7–14 s) · use image 4 (`03-bamboo-arch-path.jpg`)

```
Vertical 9:16, 7 seconds, handheld phone UGC. The person from image 1 walking
away from camera then turning back, under the bamboo archway over the stone path
shown in image 4, deep planting in green and crimson on both sides. Camera
follows a step behind, handheld, brushing past a leaf in the foreground.
They half-turn and say over their shoulder:
"This is a forest that was already here. They built around it."
Audio: voice, dense birdsong, leaves. No music. No text on screen. No prices,
no numbers.
```

### Clip 3 — The home (14–22 s) · use images 2 and 3

```
Vertical 9:16, 8 seconds, handheld phone UGC. The person from image 1 standing
at the curved tree-shaped timber door of the home in image 2, one hand resting
on the frame, the ivy-covered green roof and lily pond visible behind them; the
wider facade and bamboo-railed terrace of image 3 in the background.
They look up at the roof, then back to camera, genuinely impressed:
"The roof is alive. That's grass and creeper growing on top of the house."
Camera tilts up with their gaze then settles back on them. Loose handheld.
Audio: voice, birds, faint water from the pond. No music. No text on screen.
No prices, no numbers, no RERA reference.
```

### Clip 4 — The feeling (22–29 s) · use image 6 (`05-golden-hour-firepit.jpg`)

```
Vertical 9:16, 7 seconds, handheld phone UGC. Golden hour. The person from image
1 sitting on the low stone bench beside the sunken fire pit under the timber
pergola shown in image 6, cream villa behind, long warm light raking across.
Relaxed, leaning forward, elbows on knees, talking quietly to camera:
"Come see it at this hour. That's when it gets you."
Camera set down low and slightly wonky, small handheld drift, lens catching warm
light naturally. Audio: voice, evening birds, a soft crackle from the fire pit.
No music. No text on screen. No prices, no numbers.
```

### Clip 5 — Close + CTA (29–35 s) · use image 7 (`06-pergola-courtyard-detail.jpg`)

```
Vertical 9:16, 6 seconds, handheld phone UGC. The person from image 1 standing
in the pergola courtyard of image 7 — dark stone wall, terracotta pots, agave,
glass behind. Medium close-up, camera slightly closer than the other clips.
They speak directly to camera, warm and unhurried:
"If you want to see it, message us. We'll walk you through it ourselves."
On the last second only, simple clean sans-serif text appears low in frame:
"thegreenteam.in — book a free adviser call"
Audio: voice, birds, wind. No music.
STRICTLY EXCLUDE: any price, rupee figure, percentage, RERA number, "investment"
or "returns" wording, logo animation, or any other on-screen text.
```

---

## 3. Script alternatives (swap the dialogue, keep everything else)

Pick one lane and stay in it across all five clips — mixing registers is what
makes UGC read as fake.

**Lane A — the sceptic (highest converting)**
1. "Everyone told me you can't get quiet this close to the city."
2. "This is a forest that was already here. They built around it."
3. "The roof is alive — that's grass growing on top of the house."
4. "Come see it at this hour. That's when it gets you."
5. "If you want to see it, message us. We'll walk you through it ourselves."

**Lane B — the personal one**
1. "I've been looking for two years. I stopped looking after this."
2. "Forty minutes from the city and my phone goes quiet."
3. "My kids would grow up climbing these."
4. "This is the part I can't explain over a phone call."
5. "Book a call and come stand here yourself."

**Lane C — the direct one**
1. "Three things I check before I take anyone to a site. This one passed all three."
2. "One — the trees were here first."
3. "Two — the air. You feel the difference before anyone tells you."
4. "Three — you can be back in the city before dinner."
5. "Message us if you want to see it. No pressure, no pitch."

---

## 4. If Gemini drifts (the four failure modes and their fixes)

| What goes wrong | Add this to the prompt |
| --- | --- |
| Your face changes between clips | "Face must match image 1 exactly: same jawline, same hairline, same skin tone, same eye shape. Do not stylise, slim, lighten or age the face." |
| It looks like a TV commercial | "Amateur phone footage. Slightly imperfect framing, head not centred, visible handheld shake, no colour grade, no music, no motion graphics." |
| It invents a number anyway | "Absolutely no numerals spoken or shown, except the words 'forty minutes'. No currency symbol may appear anywhere in the frame or audio." |
| The backdrop stops matching the images | "The environment must match the supplied reference image exactly — same building form, same roof, same materials, same planting. Do not invent additional buildings, pools, fountains, cars or people." |

---

## 5. Before you publish

- Watch it once with the sound off — if any number appears in frame, re-generate.
- Watch it once with the sound on — if any figure is spoken, re-generate.
- Confirm nothing implies the homes are built and ready today.
- Land every version on the same destination: the free adviser call at
  `thegreenteam.in/adviser-call`, or WhatsApp. Never a price.
