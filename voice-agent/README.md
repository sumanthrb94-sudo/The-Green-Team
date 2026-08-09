# Telugu voice agent

Outbound and inbound Telugu calling agent for The Green Team (MODCON Agartha /
SYL). Sarvam for speech and language, GCP for everything else, Plivo for the
phone line.

Full reasoning — vendor comparison, unit economics, pricing, compliance — is in
the build plan. The script the agent speaks is in `../scripts/voice/`.

```
caller audio ──► Sarvam Saaras v3 STT   (streaming, codemix, VAD + barge-in)
             ──► Sarvam-30B
             ──► TeluguSpeechFilter     (strip controls, cap turn, normalise)
             ──► Sarvam Bulbul v3 TTS   (cloned voice)
             ──► caller
                        │
                        └──► Firestore: outcome, suppression, latency
```

## Layout

| Path | What it is |
|---|---|
| `telugu/numbers.py` | Telugu cardinals on the Indian numbering system (lakh/crore) |
| `telugu/normalize.py` | Digits, currency, units, initialisms → Telugu words |
| `agent/prompt.py` | System prompt state machine + the facts the agent may state |
| `agent/processors.py` | Turn cap, control tokens, the LLM→TTS filter |
| `agent/bot.py` | The pipeline. Browser transport for week 1, Plivo for week 2+ |
| `agent/server.py` | Cloud Run HTTP surface: outbound trigger, Plivo webhooks |
| `agent/compliance.py` | Calling window and suppression list, enforced at dial time |
| `tools/costs.py` | COGS per minute and margin under the pricing card |

## Run it

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env      # fill in SARVAM_API_KEY at minimum

# Week 1 — browser mic, no telephony, no regulatory exposure
.venv/bin/python -m agent.bot --transport webrtc

# Week 2+ — behind Plivo
.venv/bin/uvicorn agent.server:app --port 8080
```

Tests need no API keys and no pipecat — the logic modules import it lazily:

```bash
python3 -m pytest          # 85 tests
```

Cost model:

```bash
python3 -m tools.costs cogs --minutes 2000
python3 -m tools.costs card
```

## Deploy

```bash
deploy/cloudrun.sh setup    # once: APIs, service account, secrets
deploy/cloudrun.sh          # deploy to asia-south1
```

**There is no service-account key file in this deployment, deliberately.**
Cloud Run runs the service as an attached service account and Firestore picks
that up through Application Default Credentials. Do not set
`GOOGLE_APPLICATION_CREDENTIALS` and do not mount a JSON key — a key on disk is
a key that leaks. Secrets come from Secret Manager.

## The four things that make it sound human

Ranked by contribution. Everything else is plumbing.

1. **A cloned voice from a real Telugu speaker** — ~50%. Record a voice actor
   for 15 minutes reading the objection blocks (the sales register, not neutral
   narration), clone in Bulbul v3, set `SARVAM_VOICE_ID`. Until then the stock
   speaker keeps the pipeline runnable but it will not sound like a person.
2. **Number normalisation** — `telugu/normalize.py`, already wired in. `₹68.7 L`
   reaches the TTS as `అరవై ఎనిమిది లక్షల డెబ్బై వేల రూపాయలు`. One mangled
   number ends the illusion.
3. **Sub-800 ms to first audio** — logged per turn by `_wire_latency_logging`,
   with a warning over budget. Watch it from call one.
4. **Short turns** — the prompt asks for 2 sentences; `cap_turn` enforces it,
   because models drift and a 20-second monologue is the clearest tell.

## Compliance, enforced in code

`agent/compliance.py` blocks the two rules that are easy to lose under time
pressure. Both are checked at dial time, so no scheduler bug or manual `curl`
can route around them:

- **Calling window** 09:00–21:00 IST. `/calls/outbound` returns 409 outside it.
- **Suppression list.** When the agent emits `[[DNC]]` the number is hashed and
  written to `call_suppression` immediately, and `/calls/outbound` returns 403
  for it forever. There is no un-suppress path in code on purpose.

Everything else — DLT registration, 140-series numbers, DND scrubbing, AI
disclosure in the opening line — is process, not code. The opening line
discloses the AI; keep it that way.

## Known gaps

- **Not yet run against live Sarvam credentials.** Signatures are verified
  against pipecat 1.7.0 and all modules import cleanly, but no real call has
  been placed. Expect to adjust model ids and the Plivo start-frame field names
  on first contact.
- `PlivoFrameSerializer` gets `streamId` from Plivo's first WebSocket frame;
  the exact nesting is handled defensively but unverified against live traffic.
- Sarvam voice cloning may be enterprise-gated. If it is, the fallback is
  Google Instant Custom Voice at ~₹3.17/min — worse economics, already on the
  GCP bill.
- The Gemini figure in `tools/costs.py` excludes context caching and is an
  upper bound. Measure both LLMs in week 1 before treating the gap as final.
