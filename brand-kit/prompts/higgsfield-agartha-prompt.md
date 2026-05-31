# MASTER PROMPT — Higgsfield (free tier) · AGARTHA × The Green Team

Higgsfield's edge over Veo / Sora / Pika is **realistic human walkovers
with stable character identity**. Their preset library (Drift, Crash,
Robo, Vertigo, Walk POV) is doing the heavy lifting — your text prompt
only describes the scene. Free tier typically gives you ~3 generations
per day, 5–8 seconds each, with watermark. Spend credits like cash.

Lead with **ONE primary shot** that tells the whole brand story (a
character walks through forest → reaches the property → looks out at
the sanctuary). If credits remain, run the two backups.

---

## ── PRIMARY SHOT — burn your first credit on this ────────────────────

**Higgsfield UI settings:**
- Preset / Camera Style: **DRIFT** (forward dolly, slow)
- VFX: **none** (no light leak, no bokeh — keep it editorial)
- Aspect Ratio: **9:16 vertical**
- Duration: **5s** (free tier maximum)
- Motion strength: **medium** (avoid jitter)
- Seed: **lock it** so you can regenerate the same character if needed

**Prompt text (paste exactly):**

```
A woman in flowing cream linen walks slowly away from camera along a stone
path through dense tropical forest at golden hour. Tall biophilic earth-bag
villas with vine-covered walls and green living roofs are visible through
the trees ahead. Soft morning mist rises from the path. The camera drifts
forward behind her at a calm, contemplative pace. Aman Resorts house style.
Editorial real estate film. No face visible — only her back. Cinematic
9:16 vertical, 5 seconds.
```

**Why this is the right first burn:**
- Drift forward + character walking away = the strongest signal Higgsfield
  has for "stable scene + stable human." Failure rate is lowest here.
- "Back to camera, no face" eliminates the AI face-coherence problem
  (the most common reason free-tier generations look uncanny).
- Linen + golden hour + forest = generative AI's comfort zone (lots of
  training data, low chance of artifacts).
- Single shot tells the whole brand: curated forest → editorial buyer
  → biophilic sanctuary. One credit, full narrative.

---

## ── BACKUP A — if you have a second credit ──────────────────────────

**Preset:** ROBO ARM (slow tilt down)
**Aspect:** 9:16
**Duration:** 5s

**Prompt:**

```
Top-down drone view slowly tilts down over a dense tropical forest canopy
at golden hour, gradually revealing a cluster of biophilic earth-bag
villas with curved walls and green living roofs nestled inside the trees.
Mist rising. Soft warm light raking through leaves. No people, no logos,
no text. Aman Resorts house style. Cinematic 9:16 vertical, 5 seconds.
```

This gives you the "drone reveal" moment to intercut between the
character walkover and the wider property context.

---

## ── BACKUP B — if you have a third credit ──────────────────────────

**Preset:** SLOW PUSH (gentle dolly-in)
**Aspect:** 9:16
**Duration:** 5s

**Prompt:**

```
A woman in cream linen sits cross-legged on the floor of a bamboo and
thatch yoga pavilion at dawn, back to camera, facing a chemical-free
natural pool. Heavy mist rises from the water. A wall of forest beyond.
Birds in the distance. Camera pushes in very slowly. Back of her head
only — no face. Aman Resorts brand-film aesthetic. Cinematic 9:16
vertical, 5 seconds.
```

This is the "sanctuary moment" — the editorial payoff of why someone
chooses Agartha over the financial district.

---

## ── FREE-TIER PLAYBOOK (spend credits like cash) ─────────────────────

1. **Lock the seed on shot 1.** If the character looks right, save that
   seed number so backup B can match her identity. Higgsfield won't
   guarantee identity across generations but the seed gets you ~70%
   there.

2. **Vertical 9:16 always.** Don't generate 16:9 and crop — you waste
   credits on pixels you'll throw away.

3. **5 seconds, not 8.** Free tier often charges 1 credit for 5s and
   2 credits for 8s. The extra 3 seconds rarely pays for itself.

4. **Avoid prompts that ask for:**
   - Text on screen (Higgsfield can't render text reliably)
   - Specific brand logos / signage (same)
   - Visible faces (free tier has identity drift)
   - More than one person in frame (instant generation failures)
   - Smooth camera arcs longer than 180° (use Drift not Orbit)

5. **If a generation fails or looks uncanny:** don't waste credits
   regenerating with the same prompt. Re-read the prompt and remove
   the offending detail. Common culprits: "facing camera," "smile,"
   "hand gesture," "tropical bird flies past."

6. **Watermark removal:** free tier has a Higgsfield watermark at the
   bottom-right. When you send me the rendered file, I'll crop it out
   when I composite the brand overlays in the build pipeline (the
   center-crop to 9:16 will already cut into it).

---

## ── HAND-OFF TO ME (after Higgsfield renders) ───────────────────────

Place the rendered MP4(s) in `out/raw/higgsfield/` and tell me:

> "Higgsfield primary shot is in `out/raw/higgsfield/primary.mp4`.
> Stitch it into a 22-second AGARTHA reel using `build_gt_agartha_omni`
> as the template. Hook overlay reinforces the visual but no voice-over
> on the Higgsfield footage. Music: mrclaps_fashion. Brand reveal +
> PRESENTED BY THE GREEN TEAM + CTA on the back end."

The build script will:
- Center-crop to 9:16 (auto-removes the Higgsfield watermark)
- Frame-double 24fps → 60fps
- Composite hook typewriter + editorial chip
- Cut to MODCON + AGARTHA brand reveal
- Add PRESENTED BY THE GREEN TEAM leaf animation
- Mux with the mrclaps_fashion music bed
- Output prod + mobile MP4 + poster JPG

---

## ── IF FREE-TIER QUALITY ISN'T ENOUGH ────────────────────────────────

Higgsfield free tier sometimes can't deliver editorial-grade footage
for the FOREST/biophilic look (it's better at urban / lifestyle).
Two fallbacks:

1. **Upgrade to Higgsfield Pro for one month** (~$25–$35). Removes
   watermark, gives 1080p, gives more credits, and unlocks longer
   clips. Worth it for one campaign cycle.

2. **Use Veo 3 for the forest scenes (cleaner generative forest), then
   use Higgsfield only for the character walkover.** Hybrid approach.
   Cheapest path to a complete reel: 1 Higgsfield credit for the
   character shot + 1 Veo 3 generation for the property reveal.
