# Telugu Voice Agent — Build Blueprint

**Goal:** an outbound/inbound Telugu AI calling agent at Outpero-level realism, built on open source, at the lowest defensible cost per minute.
**Researched:** August 2026. Prices are list prices in INR/USD and move — re-check before you commit.
**Context:** built for The Green Team's own lead-response use case (MODCON Agartha / SYL), but the stack is generic.

---

## Part 1 — What Outpero actually is

I read [outpero.com](https://www.outpero.com) and [/telugu-ai-voice-agents](https://www.outpero.com/telugu-ai-voice-agents). Read the two pages together and the shape is unambiguous.

**They are an automation agency, not a voice-AI lab.** The homepage sells three "systems" — Revenue Capture from ₹60,000, Ops Efficiency from ₹1,00,000, Web Capture from ₹50,000 — plus 19 pre-built solutions from ₹14,999. Delivery promise is "live in 2 weeks." That is a services business with a fixed build kit, not a company training speech models.

**The tell is on their own homepage:** the Ops system lists *"Custom n8n/Make Logic"* as a deliverable. n8n is the glue. The voice layer is bought, not built.

### What each claim on the Telugu page maps to

| Their claim | What it actually is |
|---|---|
| "10+ native Telugu voices" in a "Voice Library" | Cloned voices — Telugu voice actors recorded for 30–120 s, run through a cloning TTS. The names (O' శాంతి, గాబ్రా Bhaskar, సహాయ Sahana) are their own labels on cloned assets, not model names. |
| "3-second call" after a Facebook lead form | Meta Lead Ads webhook → n8n → outbound-call API. Nothing exotic; the whole thing is one automation node. |
| "Scale from 10 to 10,000 parallel calls" | That is the *telephony provider's* concurrency (Plivo/Exotel trunk channels), resold. Not their infrastructure. |
| "Transfer the live call to your sales team" | SIP REFER / warm transfer. A checkbox in Vapi, Retell, Bolna and LiveKit alike. |
| "Outpero Voice Hub" — recordings, transcripts, intent scores | A dashboard over the platform's webhook payloads. Recordings and transcripts come free from the voice platform; "intent score" is one LLM call over the transcript after hangup. |
| "Telugu-first tuning… dialects, interruptions, Tanglish" | Prompt engineering + a good cloned voice + endpointing tuned for Telugu. Real work, but prompt-and-config work — not model training. |

**Most likely stack underneath:** a managed voice platform (Vapi / Retell / Bland, or Bolna given the India focus) + ElevenLabs or Sarvam for the cloned Telugu voices + GPT/Gemini for the brain + Plivo or Exotel for Indian PSTN + n8n for CRM glue + a custom Next.js dashboard. Their margin is the gap between ~₹4/min of vendor cost and what they bill.

**This matters because it means the realism is reproducible.** There is no moat. Everything they have, you can assemble — and the parts that make it sound human are cheap.

### Why their demos sound ultra-realistic (the honest breakdown)

Ranked by how much each contributes. This ordering is the single most useful thing in this document.

1. **A cloned voice from a real Telugu speaker (~50% of the effect).** Stock "te-IN" voices from Google/Azure sound like a railway announcement. A 60-second clean recording of an actual Hyderabad salesperson, cloned, sounds like a person — because it *is* a person's timbre, pace and micro-hesitations. This is the whole game. Everything else is polish.
2. **Native-script text normalization (~15%).** `₹68.7 L` must reach the TTS as `అరవై ఎనిమిది లక్షల డెబ్బై వేల`. Every engine mangles digits, currency and initialisms in Indic scripts, and one mangled number destroys the illusion instantly. (Already handled in `modcon-telugu-cold-call.md` — that's why the numbers there are spelled out as words.)
3. **Latency under ~800 ms to first audio (~15%).** Humans start replying in 200–500 ms. Past about a second of silence the caller says "hello?" and the spell breaks. This is an engineering budget, not a model choice.
4. **Short turns (~10%).** Cap the agent at 2 sentences / ~35 Telugu words per turn. The #1 giveaway of a bot is a 20-second uninterrupted monologue. Real salespeople talk in bursts and check in.
5. **Barge-in + backchannels (~5%).** The caller must be able to cut the agent off mid-sentence and have it stop instantly. Sprinkle "హా సర్", "అవును", "సరే" acknowledgements while the LLM thinks.
6. **The phone codec is doing you a favour (~5%).** PSTN audio is 8 kHz μ-law. It strips the high frequencies where TTS artifacts live. The *same* voice that sounds slightly synthetic in a browser demo sounds convincingly human over a phone call. Never judge a voice on studio playback — always A/B it through an actual call.

Corollary: their website demo players are almost certainly full-band studio renders. Judge them on a real call before assuming they're ahead of what you can build in a week.

---

## Part 2 — Three stacks, priced

Assumption for all per-minute maths: one minute of conversation = caller speaks ~25 s, agent speaks ~35 s ≈ 90 Telugu words ≈ **600 characters of TTS**, across ~5 turns. USD converted at ₹88.

### Stack A — Cascade on managed Indic APIs (start here)

```
Plivo/Exotel PSTN ──► LiveKit SIP ──► LiveKit Agents (self-hosted, free)
                                        │
                          ┌─────────────┼─────────────┐
                          ▼             ▼             ▼
                   Sarvam Saarika   Gemini 3.5    Sarvam Bulbul
                       (STT)         Flash (LLM)   (TTS, cloned)
                          │             │             │
                          └─────────────┴─────────────┘
                                        │
                              n8n ──► Supabase (leads, transcripts)
```

| Line item | Rate | ₹ / call-minute |
|---|---|---|
| Outbound PSTN (Plivo, mobile) | ~₹0.71–0.80/min | **0.75** |
| STT — Sarvam Saarika | ₹30/hour of audio | **0.50** |
| LLM — Gemini 3.5 Flash (short turns, cached system prompt) | ~$1/M in, $6/M out | **0.15** |
| TTS — Sarvam Bulbul | ₹30 / 10k chars × 600 chars | **1.80** |
| Orchestration (LiveKit Agents on a ₹1,500/mo VPS, ~20 concurrent) | fixed | **0.05** |
| **Total** | | **≈ ₹3.25/min (~$0.037)** |

TTS is 55% of the bill. That is the number to attack.

### Stack B — Speech-to-speech (fewest parts, best latency, least control)

Gemini Live API native audio: no STT→LLM→TTS chain, ~300 ms response, Telugu supported, ~$0.036/min ≈ ₹3.15. Plus telephony ₹0.75 → **≈ ₹3.90/min**.

Slightly more expensive than Stack A and **you cannot use your own cloned voice** — you get Google's speaker set. Given that the cloned voice is 50% of the realism, this is the wrong trade for a sales agent trying to sound like a specific human. It *is* the right choice for an inbound support/receptionist bot where neutral-but-fast wins. Worth building as a comparison in week 1; it takes an afternoon.

### Stack C — Self-hosted STT + TTS (the cost floor)

Same shape as Stack A, but Saarika and Bulbul are replaced by your own GPU.

| Line item | ₹ / call-minute |
|---|---|
| Outbound PSTN | 0.75 |
| LLM (Gemini Flash, or self-hosted Qwen/Llama to go to ~0) | 0.15 |
| GPU: one L4 24 GB @ $0.39/hr ≈ ₹34/hr, serving STT + TTS for ~10 concurrent calls | **0.06** |
| Orchestration VPS | 0.05 |
| **Total** | **≈ ₹1.00/min (~$0.012)** |

**Break-even vs Stack A:** self-hosting saves ~₹2.25/min. A GPU running 24/7 costs ~₹816/day. You need **~360 call-minutes/day (6 hours of talk time)** to justify it. Below that, managed APIs are strictly cheaper *and* less work.

**Recommendation: build Stack A, instrument it, migrate to Stack C when you cross ~350 call-min/day.** Do not start with Stack C — you will spend three weeks on GPU autoscaling instead of on the conversation, which is where all the actual quality lives.

---

## Part 3 — Component choices, with repos

### Orchestration — pick one

| Repo | License | Why / why not |
|---|---|---|
| **[livekit/agents](https://github.com/livekit/agents)** ⭐ *my pick* | Apache-2.0 | WebRTC room model, **native SIP + phone numbers built in** (2026) — no Twilio bridge needed. Best-in-class turn detection model shipped in-repo. Runs OpenAI's and xAI's production voice. Self-host free; their cloud is ~$0.01/min if you'd rather not. |
| **[pipecat-ai/pipecat](https://github.com/pipecat-ai/pipecat)** | BSD-2 | Pipeline-of-processors model, the largest plugin library, near-daily commits. Choose this if you want to hand-tune every stage (custom Telugu normalizer between LLM and TTS, for example). Slightly more assembly for telephony. |
| **[bolna-ai/bolna](https://github.com/bolna-ai/bolna)** | MIT | India-native: Plivo/Exotel/Vobiz + BYO-SIP, agents defined as JSON, Sarvam integrated. Fastest path to a ringing Indian phone. Caveat: repo README currently says *"we are actively looking for maintainers"* — fine to borrow the telephony servers from, risky as your long-term core. |
| [TEN-framework/ten-framework](https://github.com/TEN-framework/ten-framework) | Apache-2.0 | Strong real-time multimodal, C++/Go core. Heavier to learn; only if you need avatar/video later. |

Framework choice barely affects latency — that's set by your model stack (cascade adds 300–800 ms, speech-to-speech ~300 ms; framework overhead is tens of ms). Choose on telephony and ecosystem, not on speed claims.

### TTS — where the realism lives

| Repo / model | License | Telugu | Verdict |
|---|---|---|---|
| **[ai4bharat/IndicF5](https://github.com/AI4Bharat/IndicF5)** | open | 11 Indian languages incl. Telugu | Trained on 1,417 h of Indian speech (Rasa, IndicTTS, LIMMITS, IndicVoices-R). Reference-audio cloning: give it a clip + that clip's transcript. **The default open-source choice for Telugu.** Not natively streaming — chunk by sentence. |
| **[praxelhq/praxy](https://github.com/praxelhq/praxy)** | Apache-2.0 weights | Te/Ta/Hi + **code-mix**, voice cloning | Chatterbox + a Telugu LoRA, with a published benchmark showing it beating Sarvam Bulbul on Telugu retroflex collapse (26.7% vs 33.3%) and a router that transliterates Tanglish to native script before synthesis — exactly the "Tanglish" problem Outpero advertises. **Caveat: brand new (Apr 2026), zero stars, unproven in production.** Evaluate it, don't bet the build on it yet. |
| **[resemble-ai/chatterbox](https://github.com/resemble-ai/chatterbox)** | MIT | via LoRA (see praxy) | 350M params, sub-200 ms with tuning, emotion control, zero-shot cloning. In blind tests 65% preferred it over ElevenLabs (English). ~8 GB VRAM. Good base to fine-tune. |
| [canopyai/Orpheus-TTS](https://github.com/canopyai/Orpheus-TTS) | Apache-2.0 | needs fine-tune | Llama-based, real streaming, guided emotion. 150M–3B sizes. |
| [hexgrad/kokoro](https://github.com/hexgrad/kokoro) | Apache-2.0 | ✗ | 82M, runs on CPU — but no Telugu and no cloning. Use for English fallback only. |
| Sarvam Bulbul (API) | commercial | ✓ | ₹30/10k chars. Indic-tuned, no GPU to run. The pragmatic Stack-A default. |
| ElevenLabs Multilingual v2 (API) | commercial | ✓ | Best-in-class cloning, ~5–10× Sarvam's price. Use it to *prototype* the voice and prove the concept, then replicate on IndicF5. |

### STT

| Repo / model | Notes |
|---|---|
| **[AI4Bharat IndicConformer](https://github.com/AI4Bharat/IndicConformer)** (600M multilingual) | 22 Indian languages incl. Telugu; the strongest open Indic ASR. Streaming-capable. |
| **[SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)** + a Telugu fine-tune (`vasista22/whisper-telugu-large-v2`) | Easiest path; needs chunking for streaming. Heavier GPU. |
| [collabora/WhisperLive](https://github.com/collabora/WhisperLive) | Ready-made streaming wrapper if you go Whisper. |
| Sarvam Saarika (API) | ₹30/hour. Indic-tuned. Zero ops. Stack-A default. |

### Turn-taking / VAD — do not skip this

| Repo | Why |
|---|---|
| **[snakers4/silero-vad](https://github.com/snakers4/silero-vad)** | The baseline VAD everyone uses. MIT, tiny, CPU. |
| **LiveKit turn detector** (in `livekit/agents`) | Semantic end-of-turn — knows "నేను అనుకుంటున్నాను…" is *not* finished. Cuts false interrupts dramatically. |
| **Smart Turn** (in `pipecat`) | Pipecat's open equivalent. |

Endpointing is the difference between an agent that talks over people and one that doesn't. Budget real tuning time here — it is the most under-rated component in every voice stack.

### Telephony (India)

| Provider | Outbound mobile | Notes |
|---|---|---|
| **Plivo** | ~₹0.71/min, 100 default concurrency | Best API/docs, first-class in Bolna and LiveKit SIP. |
| **Exotel** | ~₹0.80–1.20/min | Most India-native; strong on DLT/compliance paperwork. |
| Direct SIP trunk (Tata/Airtel) | ₹0.60–1.20/min | Cheapest at volume, most paperwork. Only worth it past ~50k min/mo. |
| Twilio India | highest | Don't, for domestic India. |

Inbound DID: ₹0.40–0.90/min. Toll-free inbound: ₹1.20–2.50/min.

### Everything else

- **Automation glue:** [n8n-io/n8n](https://github.com/n8n-io/n8n) — self-host, fair-code. Same tool Outpero uses. Meta Lead Ads → webhook → trigger call.
- **Database + dashboard:** Supabase (already in your stack) for leads/transcripts/recordings; [metabase/metabase](https://github.com/metabase/metabase) or a Next.js page for the "Voice Hub" equivalent.
- **Post-call intelligence:** one Gemini Flash call over the transcript → intent score, budget, objection tags, next action. ~₹0.10/call.

---

## Part 4 — The realism checklist

Ship none of these and you have a robot. Ship all of them and you are at parity.

1. **Clone a real voice.** Hire a Telugu voice actor for two hours. Record 10–15 minutes clean (no room echo, no compression, 48 kHz) reading the objection-handling blocks from `modcon-telugu-cold-call.md` — you want the *sales register*, not neutral narration. Get a signed release covering synthetic reproduction. This one step outranks every model choice below.
2. **Normalize text before TTS.** Numbers, currency, dates, initialisms → Telugu words. Praxy ships `indic_numbers.py` for exactly this; steal it. Never send `₹68.7L` or `AQI 12` raw.
3. **Cap turn length in the system prompt.** "Reply in at most 2 sentences, under 35 Telugu words. Never list more than 3 items." Enforce it — truncate server-side if the LLM overruns.
4. **Stream TTS sentence-by-sentence.** Start speaking on the first sentence while the rest generates. Halves perceived latency for free.
5. **Sub-800 ms first audio.** Instrument every stage. Typical budget: VAD close 250 ms → STT final 150 ms → LLM first token 250 ms → TTS first chunk 150 ms.
6. **Barge-in that actually stops.** On detected speech, kill the audio buffer *immediately*, not at the end of the current chunk.
7. **Filler while thinking.** If the LLM hasn't returned in 400 ms, play a pre-rendered "హా సర్…" / "ఒక్క సెకను సర్…". Pre-render these once; never synthesize them live.
8. **Warm human transfer.** SIP REFER on "మనిషితో మాట్లాడాలి". Test it on day one — it's the single most business-critical path.
9. **Tanglish input handling.** Real callers say "sir, price entha?" Your STT must not drop the English words and your prompt must not correct the caller's register.
10. **Tune on 8 kHz.** Evaluate every voice through a real PSTN call, never through laptop speakers.
11. **Record and re-listen weekly.** Pull 20 real calls, mark every moment you'd have hung up, fix the top 3. This loop is what separates a demo from a product — and it's the only part nobody can sell you.
12. **Disclose the AI in the first sentence.** Not just compliance (it is) — callers who feel deceived hang up harder and complain louder.

---

## Part 5 — India compliance, non-negotiable

Outbound commercial calling in India in 2026 is regulated, actively enforced, and TRAI's own detection models look for synthetic-voice signatures and abnormal call patterns. Over 47,000 numbers were disconnected in Q1 2026 alone, including legitimate businesses with sloppy DLT registration. Penalties run to ₹10 lakh.

Before your first live dial:

- [ ] **Register as a telemarketer on the DLT platform** — entity, sender IDs, *and your call scripts*.
- [ ] **Use the correct number series** — 140 for promotional, 1600 for transactional/service. Calling promotional traffic from a normal 10-digit mobile is the fastest way to get disconnected.
- [ ] **Scrub every list against DND** before each campaign, not once.
- [ ] **Capture and store revocable consent** with timestamp and source. A Meta Lead Ad submission is consent for *that* enquiry — log the lead ID against the call record.
- [ ] **Call only 09:00–21:00 local time.**
- [ ] **Disclose that it's an AI agent** in the opening line, and label synthetic voice per the 2026 IT Rules amendment. Never impersonate a named real person.
- [ ] **Honour opt-out instantly and permanently** — the DNC block (7.7) in the Telugu script exists for this; wire it to a hard suppression list, not a CRM tag.
- [ ] **DPDP Act:** recordings and transcripts are personal data. Define retention, restrict access, and be able to delete on request.

The cheapest stack in the world is worthless if the numbers get cut off in week three.

---

## Part 6 — 14-day build plan

**Days 1–2 · Voice asset.** Book the voice actor. Record 15 min. Clone into ElevenLabs *and* IndicF5 with the same source clip. A/B them on the `modcon-telugu-cold-call.clips.json` set — through a phone call, not speakers. Pick a winner.

**Days 3–4 · Local loop.** LiveKit Agents locally, browser mic, no telephony: Saarika STT → Gemini Flash → your voice. Get a full turn working. Separately spend an afternoon on Gemini Live speech-to-speech as the latency baseline to beat.

**Days 5–6 · Conversation design.** Port the 9 blocks + 7 objection handles from `modcon-telugu-cold-call.md` into the system prompt as a state machine (greet → qualify → pitch → objection → close → book/transfer). Add the turn-length cap and the Telugu text normalizer. This is where the quality is — give it the most time, not the least.

**Days 7–8 · Telephony.** Plivo trunk → LiveKit SIP. Get outbound *and* inbound working. Test warm transfer. Start DLT registration now — approval takes days, and it will be your critical path.

**Days 9–10 · Latency + endpointing.** Instrument the four-stage budget. Add turn detection, barge-in, pre-rendered fillers. Target sub-800 ms. This is the difference between "impressive" and "real".

**Days 11–12 · Data loop.** n8n: Meta Lead Ad → Supabase → trigger call → post-call Gemini summary → back to Supabase. Build the minimal Voice Hub view (calls, duration, outcome, transcript, recording, intent score).

**Days 13–14 · Pilot + regression set.** 50 real calls to consented leads. Listen to all 50. Build a fixed 20-case Telugu regression suite from the failures and re-run it on every prompt change forever.

**Then, and only then:** if you're past ~350 call-min/day, migrate STT+TTS onto an L4 and take the bill from ₹3.25 to ₹1.00/min.

---

## Bottom line

Outpero is a well-executed assembly job on top of bought parts, sold at agency prices. Nothing on that page requires technology you cannot self-host this month.

Your real costs: **~₹3.25/min managed, ~₹1.00/min self-hosted**, plus one voice actor (₹5–15k, one-time) and roughly two weeks of your own build time. The thing that will actually decide whether it sounds ultra-realistic is not which framework you pick — it's the quality of that one voice recording, whether your numbers are spelled out in Telugu, and whether you keep the agent's turns short.

Everything else is plumbing.

---

## Sources

Stack and framework comparisons: [Soniox — voice agent frameworks](https://soniox.com/wiki/voice-agent-frameworks) · [ThinnestAI — open-source voice AI frameworks](https://www.thinnest.ai/blog/open-source-voice-ai-frameworks) · [Evalgent — Pipecat vs LiveKit](https://www.evalgent.com/blog/pipecat-vs-livekit)
Models: [ai4bharat/IndicF5 (HF)](https://huggingface.co/ai4bharat/IndicF5) · [praxelhq/praxy](https://github.com/praxelhq/praxy) · [bolna-ai/bolna](https://github.com/bolna-ai/bolna) · [MarkTechPost — open ASR 2026](https://www.marktechpost.com/2026/07/23/best-open-speech-recognition-asr-models-in-2026-wer-languages-latency-and-license-compared/) · [Speakeasy — open source TTS 2026](https://www.tryspeakeasy.io/blog/open-source-text-to-speech-2026)
Pricing: [Sarvam API pricing](https://www.sarvam.ai/api-pricing) · [Plivo India voice pricing](https://www.plivo.com/voice/pricing/in/) · [Runpod pricing](https://www.runpod.io/pricing) · [Caller Digital — India telephony comparison](https://caller.digital/blog/telephony-partner-voice-ai-india-plivo-exotel-ozonetel-knowlarity-twilio-2026)
Compliance: [TRAI DLT rules for AI calling](https://www.ondial.ai/blog/trai-dlt-ai-calling-india) · [AI cold calling India 2026](https://caller.digital/blog/ai-cold-calling-india-trai-compliant-2026) · [DPDP + TRAI + RBI guide](https://www.autointerviewai.com/blog/ai-calling-india-dpdp-trai-dlt-compliance-complete-guide-2026)
