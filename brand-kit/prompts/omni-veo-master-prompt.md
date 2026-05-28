# MASTER PROMPT — Google Omni / Veo 3 / Gemini Video Gen
## For BRAND MINT STUDIOS — Editorial Real Estate Visual + Voice-Over Generator

Paste any of these into a Google video-generation model (Veo 3, Gemini Pro
video gen, or Omni-modal). The full master brief below is for context-rich
models; the split scene prompts below it are for Veo 3 (which typically
takes 5-8 second clips).

After Omni renders, drop the file into the repo `out/` folder and tell
the assistant: *"Crop, cut, beat-sync, brand it. Master plate is `out/<filename>.mp4`."*
Post-production (color grade, brand typography overlay, beat-cut to
mrclaps_fashion 99.4 BPM, MODCON + AGARTHA + Green Team channel-partner
attribution, CTA, cinema bars, mobile-compress) is handled by the build
scripts in `brand-kit/video/`.

---

## ── FULL MASTER BRIEF ──────────────────────────────────────────────────

You are generating a 30-35 second editorial real-estate video for The
Green Team — channel partner for forest-adjacent biophilic properties in
Hyderabad, India. The featured property is **AGARTHA**, built by MODCON
Builders: 25 acres on the Narsapur forest boundary, AQI 12, 36 plots,
each pre-planted with 100+ tree varieties, 40 minutes from the Financial
District via the RRR corridor. Winner: Outlook Business Best Sustainable
Eco-Friendly Project 2024.

### Aesthetic
Cinematic editorial — like a luxury real-estate magazine come to life.
Color palette: deep olive greens, warm sandy beige, cream paper, golden
hour light, occasional gold/bronze metallic glints. Mood: contemplative,
unhurried, reverent. Reference: Aman Resorts house style, mixed with
Kinfolk magazine photography.

### Camera
- Slow deliberate moves only — drone glides, slow dolly, gentle Ken Burns
- NEVER shaky, NEVER fast cuts, NEVER zoom-snaps
- Compose for 9:16 vertical natively — do not crop from horizontal
- Long lenses for compressed depth on intimate shots
- Wide lenses for the aerial reveals

### Lighting
- Golden hour (45 min before sunset OR 45 min after sunrise)
- Morning mist rising from foliage / pools
- Late afternoon long shadows
- NO harsh midday sun
- NO artificial interior lighting

### Scene-by-scene

**Scene 1 (0:00–0:04) — Forest opening**
Slow aerial dolly forward, just above the canopy of a dense tropical
forest in Telangana / coastal Karnataka biome. Tall mature deciduous
trees + interspersed pine groves. Sunlight filters through leaves in
golden god-rays. Light mist below the canopy. No people. No buildings.
Just the forest breathing.

**Scene 2 (0:04–0:09) — Property emerges from the forest**
Aerial continues forward, then gently pulls UP and back, revealing
biophilic earth-bag villas nestled INSIDE the forest. The buildings have
curved organic walls, vine-covered facades, living green roofs that blend
with the canopy. The architecture grows OUT of the forest — not on top of
it. Soft golden light.

**Scene 3 (0:09–0:14) — Architecture detail**
Hero shot of a single earth-bag biophilic villa. Curved adobe walls,
arched cutout doors and windows, vines hanging from a green roof. Late
afternoon light raking across the texture of the walls. A figure (back
to camera, silhouette only) walks slowly past, hand brushing a vine.
Contemplative pace.

**Scene 4 (0:14–0:19) — Top-down master plan aerial**
Pure helicopter top-down. Reveals the full master plan: 36 plots
arranged organically (no grid — curves and clusters) around a central
clubhouse with a natural bio-pool. Pathways meander through the trees.
Tree canopy still dominates more than half the frame. Slow rotation /
slight push-in.

**Scene 5 (0:19–0:24) — Sanctuary intimacy**
Eye-level intimate shot at dawn. A yoga pavilion built from bamboo and
thatch sits on the edge of a chemical-free natural pool. Mist rises from
the water. A figure (silhouette only) sits cross-legged in meditation,
back to camera, facing the forest. Birds in the distance. Long silence.

**Scene 6 (0:24–0:30) — Brand-reveal plate**
Slow pull-back to a wide of the forest. The shot composes itself with
NEGATIVE SPACE in the center vertical band — a soft-focus column of
foliage where typography (AGARTHA wordmark + tagline) will be added in
post. Hold the final 2 seconds rock-steady so the brand reveal can lock.

### Voice-over (deep, measured, editorial — *not* hype voice)

Voice direction: Deep, slow, restrained — think David Attenborough
narrating an Aman Resorts campaign. Mid-Atlantic Indian English with
British-leaning vowels. NO upward inflection. NO excited cadence. Long
pauses between sentences. Each line delivered like a sentence in a
museum-wall caption.

```
(0:00–0:03) [silence — only forest ambient]
(0:03–0:08) "Forests don't stay by accident.  ...  They're curated."
(0:08–0:13) "Twenty-five acres on the Narsapur forest boundary."
(0:13–0:18) "Air-quality index — twelve.  Ambient noise — eighteen decibels."
(0:18–0:23) "Thirty-six plots, each pre-planted with one-hundred tree varieties."
(0:23–0:30) "AGARTHA.  ...  A forest-edge sanctuary.  ...  Presented by The Green Team."
```

### Music bed
Subtle ambient instrumental only:
- Solo bansuri / flute OR
- Sub-bass + filtered field-recording (wind in leaves, distant water) OR
- A slow cinematic piano (sustained chords, no melody)
NO drums. NO vocals. Mix bed at -28 LUFS so voice-over sits at -14 LUFS.

### Output specs
- Resolution: 1080×1920 (9:16 vertical)
- Duration: 30-35 seconds
- Frame rate: 60fps preferred (30fps acceptable)
- Codec: H.264 (yuv420p), CRF 18 or visually-lossless equivalent
- Audio: AAC 192k stereo, voice-over baked in
- File: single MP4, no watermark

### Do NOT include
- No people's faces (silhouettes / backs of heads only)
- No prices, no investment figures, no "+%" return numbers on screen (RERA-prudent)
- No competitor brand names or logos
- No on-screen text or typography (handled in post)
- No drone watermarks / model watermarks
- No royalty-free music with vocals
- No clouds racing across sky (looks AI-y)
- No people walking *toward* camera (always away or perpendicular)

---

## ── SPLIT SCENE PROMPTS (for Veo 3 — 5-8s clips) ────────────────────

Run these as six separate generations, then hand off all six clips to
the assistant for stitching + post.

### CLIP 1 (5s) — Forest opening
> Cinematic 9:16 vertical drone shot, slow forward dolly just above the
> canopy of a dense tropical Indian forest. Tall deciduous trees with
> golden hour light filtering through leaves in soft god-rays. Light
> morning mist below the canopy. Camera moves at 0.5 m/s, locked
> horizontal. No people, no buildings. 5 seconds. Aman Resorts house
> aesthetic. 60fps.

### CLIP 2 (5s) — Property reveal
> Cinematic 9:16 vertical drone shot. Continuing forward over a dense
> tropical forest canopy, the drone slowly pulls up and back to reveal
> biophilic earth-bag villas nestled within the trees — curved organic
> walls, vine-covered facades, green living roofs that blend with the
> canopy. Golden hour light. The buildings emerge from the forest, not
> imposed on it. 5 seconds, slow continuous move, 60fps.

### CLIP 3 (5s) — Architecture detail
> Cinematic 9:16 vertical eye-level shot of a single biophilic
> earth-bag villa: curved adobe walls, arched cutout doors and windows,
> vines hanging from a living green roof. Late afternoon raking light
> highlights the wall texture. A solitary figure in linen, back to
> camera, walks slowly past from right to left, hand brushing a vine.
> Slow gentle dolly-in. 5 seconds, 60fps. No face visible.

### CLIP 4 (5s) — Top-down master plan
> Cinematic 9:16 vertical helicopter top-down aerial. A large biophilic
> residential property of 36 plots arranged organically — no grid, only
> curves and clusters — around a central clubhouse with a natural
> chemical-free pool. Meandering pathways through tree canopy that
> covers more than half the frame. Slow clockwise rotation + slight
> push-in. Golden afternoon light. 5 seconds, 60fps.

### CLIP 5 (5s) — Yoga pavilion at dawn
> Cinematic 9:16 vertical eye-level shot at dawn. A bamboo + thatch yoga
> pavilion on the edge of a chemical-free natural pool. Heavy mist
> rising from the water. A solitary figure in white linen sits
> cross-legged in meditation on the pavilion floor, back to camera,
> facing a wall of forest. Birds heard in the distance. Camera locked,
> very slow gentle push-in. 5 seconds, 60fps. No face visible.

### CLIP 6 (5s) — Brand-reveal plate
> Cinematic 9:16 vertical wide drone shot of a dense forest canopy at
> golden hour. The composition has deliberate NEGATIVE SPACE in the
> center vertical band — a soft-focus column of foliage. Camera pulls
> back very slowly for the first 3 seconds, then holds locked rock-steady
> for the final 2 seconds. Mist rising. No people. No buildings.
> 5 seconds, 60fps.

---

## ── VOICE-OVER GEN PROMPT (ElevenLabs / Veo native audio) ────────────

```
Voice: deep male, mid-40s, British-Indian accent, measured cadence.
       Aman Resorts brand-film voice. David Attenborough restraint.
Tempo: 110 words per minute (slow). Pause 0.8s between sentences.
Audio: dry, untreated, 48kHz 24-bit WAV. Mono.

SCRIPT:
[3-second pause for forest ambient]
"Forests don't stay by accident. ...They're curated."
[0.8s pause]
"Twenty-five acres on the Narsapur forest boundary."
[0.8s pause]
"Air-quality index — twelve. Ambient noise — eighteen decibels."
[0.8s pause]
"Thirty-six plots, each pre-planted with one-hundred tree varieties."
[0.8s pause]
"AGARTHA.  ...  A forest-edge sanctuary."
[0.6s pause]
"Presented by The Green Team."
```

---

## ── REUSE FOR OTHER PROPERTIES ───────────────────────────────────────

To generate for a different property (SYL Residences, SYL Commercial,
Dates County, etc.), swap these fields:

| Field            | Agartha                              | SYL Residences                      |
|------------------|--------------------------------------|--------------------------------------|
| PROPERTY_NAME    | AGARTHA                              | SYL RESIDENCES                       |
| DEVELOPER        | MODCON Builders                      | MODCON Builders                      |
| LOCATION         | Narsapur forest boundary             | Tukkuguda, ORR Exit-14               |
| SIZE             | 25 acres, 36 plots                   | 4.5 acres, villaments                 |
| AIR QUALITY      | AQI 12, 18 dB                        | (n/a — different USP)                |
| DISTANCE         | 40 min to FD via RRR                 | 10 min to international airport      |
| HOOK             | "Where the forest is the amenity."   | "Where forests come to the balcony." |
| TAGLINE          | forest-edge sanctuary.               | biophilic villaments.                |
| CTA              | COMMENT 'AGARTHA'                    | COMMENT 'SYL'                        |

For the brand-ident (no property — just The Green Team brand reel):
- PROPERTY_NAME = THE GREEN TEAM
- DEVELOPER     = (omit "presented by" line — Green Team IS the brand)
- HOOK          = "Forests don't stay by accident. They're curated."
- TAGLINE       = sanctuaries.

---

## ── POST-PRODUCTION HAND-OFF ─────────────────────────────────────────

After Omni / Veo 3 generates the raw clips, place them in `out/raw/`
and tell the assistant:

> "Raw plates from Omni are in `out/raw/clip-{1..6}.mp4`. Stitch them
> with the existing v41 architecture: P1=clip1 (cold open), P2=clip2
> (hook lands), P3=clips 3-4 (tour), P4=clip4 (specs backdrop),
> P5=clip6 (brand reveal plate). Beat-sync to mrclaps_fashion 99.4 BPM.
> Bake the AGARTHA brand reveal, MODCON developer attribution, and
> PRESENTED BY THE GREEN TEAM sequence per `build_gt_agartha_reel.py`.
> Slow 1.4× at encode. Output: production + mobile MP4 + poster JPG."

The build script will handle everything from there — color grade,
typography overlay, beat cut, audio sync, cinema bars, CTA, cover art,
mobile compress.
