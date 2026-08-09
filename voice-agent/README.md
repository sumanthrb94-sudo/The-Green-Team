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

## No local machine? Use Cloud Shell

Everything below assumes a terminal. If you don't have one, open
**[shell.cloud.google.com](https://shell.cloud.google.com)** — it runs in the
browser, it's free, and `gcloud` is already signed in as you.

```bash
git clone -b claude/modcon-telugu-cold-call-script-e8m0g6 \
    https://github.com/sumanthrb94-sudo/the-green-team.git
cd the-green-team/voice-agent

./deploy/cloudrun.sh setup
printf '%s' '<your sarvam key>' | gcloud secrets versions add SARVAM_API_KEY --data-file=-
./deploy/cloudrun.sh
```

It prints an `https://…run.app` URL. **Open it and click the button** — that
page serves the widget itself, so there is nothing else to deploy and nothing
to install. Roughly five minutes, most of it the first container build.

## Do this first: is the voice right?

Everything else is plumbing until you've heard it. One command, no deploy, no
telephony:

```bash
export SARVAM_API_KEY=...
python3 -m tools.voice_preview            # 3 clips x 4 stock voices → out/
python3 -m tools.voice_preview --all --voices <your-cloned-id>
```

Listen on a phone speaker, not monitors — the call is 8 kHz and that's what
the customer hears. Score against the checklist in
`../scripts/voice/modcon-telugu-cold-call.md`: numerals, initialisms, the
సర్ at clause ends, and whether `07c-price` still sounds warm under pushback.

Pick a winner, set `SARVAM_VOICE_ID`, then run the live agent below.

## Live demo in front of a client

```bash
cp .env.example .env                      # set SARVAM_API_KEY, SARVAM_VOICE_ID
.venv/bin/uvicorn agent.server:app --port 8080
```

Open <http://localhost:8080/> → click the button → talk. That is the demo.

To demo through the real website instead, add `VITE_AGENT_HOST=http://localhost:8080`
to the site's `.env` and run `npm run dev` — the call button appears on
thegreenteam site itself, and if the client is on a property page the agent
opens already knowing which one.

For a client demo that isn't on your laptop, deploy the agent first
(`deploy/cloudrun.sh`) and point `VITE_AGENT_HOST` at the Cloud Run URL.

## What the agent knows

The whole portfolio, from `agent/prompt.py` — mirroring `SANCTUARIES` in
`src/App.tsx`:

| | Location | Price | AQI |
|---|---|---|---|
| MODCON Agartha | Narsapur forest boundary | from ₹68.7 L | 12 |
| MODCON SYL Residences | Tukkuguda, ORR Exit-14 | ₹4,499/SFT | 22 |
| Dates County | Kandukur, Srisailam Hwy | ₹18,000/sq yd | 18 |

Plus who The Green Team is, the AQI-under-25 and 45-minute criteria, and that
the developer pays the commission, not the buyer.

On a property page the agent talks about that project. Everywhere else it
takes the whole portfolio and routes: farm and clean air → Agartha; apartment
near the airport → SYL; large villa plot or land banking → Dates County. It
pitches exactly one, never all three.

## Two channels, one pipeline

**Web ships first.** A browser agent on your own site never touches a telecom
network, so no DLT registration, 140-series number or DND scrub applies — it
can go live while DLT is still processing. The phone leg needs DLT before any
outbound dial.

The web channel has two transports behind the same pipeline. **WebSocket
(default)** streams PCM and runs on Cloud Run — no VM, no DNS, no certificate
to manage. **WebRTC** (`?gt_transport=webrtc` or `data-transport="webrtc"`)
needs UDP and therefore a VM, but handles packet loss better. Both are covered
by `tests/test_e2e_web.py`.

Only the transport differs. The prompt, turn cap, normalizer and endpointing
are shared, so what you tune on the website carries over to the phone
unchanged. The one deliberate difference is the opening move: a web visitor
clicked "talk to us", so the agent skips the cold-call permission ask
(`agent/prompt.py`, `_STATE_1`).

## Run it

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
cp .env.example .env      # fill in SARVAM_API_KEY at minimum

.venv/bin/uvicorn agent.server:app --port 8080
```

Then open <http://localhost:8080/> and talk to it. The same process serves the
Plivo webhooks once you have a trunk.

Embed on the live site:

```html
<script src="https://<agent-host>/web/widget.js"
        data-agent-host="https://<agent-host>"
        data-project="agartha"
        data-rera="<reg-no>"></script>
```

Set `ALLOWED_ORIGINS` to the sites permitted to embed it. Never `*` — that
lets any site mount your agent and spend your Sarvam credits.

Tests need no API keys and no pipecat — the logic modules import it lazily:

```bash
python3 -m pytest          # 85 tests
```

Cost model:

```bash
python3 -m tools.costs cogs --minutes 2000
python3 -m tools.costs card
```

## Hosting the agent

You need a host only when the demo isn't on your own laptop.

**Cloud Run, no DNS, no VM.** The widget streams PCM over a WebSocket, so it
runs anywhere HTTPS and WebSockets are terminated. Cloud Run gives you a
`*.run.app` hostname with a valid certificate out of the box — which matters,
because browsers refuse `getUserMedia` on a plain-HTTP origin.

```bash
cd voice-agent
gcloud auth login
./deploy/cloudrun.sh setup                                   # APIs, SA, secrets
printf '%s' '<sarvam key>' | gcloud secrets versions add SARVAM_API_KEY --data-file=-
./deploy/cloudrun.sh                                         # prints the URL
```

Then set `VITE_AGENT_HOST=https://voice-agent-xxxx.a.run.app` in Vercel and
redeploy the site. That's the whole deployment — the Vercel site and the agent
are separate services, and this env var is the only link between them.

The same service handles the phone leg when DLT clears; Plivo streams over a
WebSocket too.

### If you later want WebRTC

`deploy/gce.sh` puts the agent on a VM with the media ports open. WebRTC
brings its own jitter buffer and packet-loss concealment, so it degrades more
gracefully on bad mobile networks — at the cost of a VM (~₹1,150/mo), a DNS
record and a certificate. Cloud Run cannot do it: WebRTC media is UDP and
Cloud Run takes no inbound UDP. Switch a page with `?gt_transport=webrtc` to
compare them on the same deployment.

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

## Compliance

### What applies where

| Obligation | Web | Phone |
|---|---|---|
| DLT, 140-series, DND scrub | no | yes, before any dial |
| 09:00–21:00 window | no | yes |
| AI disclosure (IT Rules 2026) | **yes** | yes |
| DPDP notice + consent before recording | **yes** | yes |
| TG-RERA agent registration | **yes** | yes |

Anything that dials a phone number pulls the web channel back under DLT — a
callback to confirm a booking, a click-to-call bridge. Booking inside the app
is clean; ringing to confirm is not.

### Enforced in code

`agent/compliance.py` blocks the two phone rules that are easiest to lose under
time pressure, at dial time, so no scheduler bug or manual `curl` routes around
them:

- **Calling window** 09:00–21:00 IST — `/calls/outbound` returns 409 outside it.
- **Suppression list** — when the agent emits `[[DNC]]` the number is hashed and
  written to `call_suppression` immediately, and `/calls/outbound` returns 403
  for it forever. There is no un-suppress path in code, on purpose.

On the web side, the widget shows the AI disclosure and the recording notice
**before** `getUserMedia` is called — notice has to precede collection, not sit
in a policy page nobody opens. Don't reorder that.

### RERA

`RERA_AGENT_REG_NO` is empty until TG-RERA registration comes through, and the
prompt then instructs the agent to defer rather than state a number it doesn't
have. `test_no_number_is_ever_fabricated` guards it. Set the env var and the
widget's `data-rera` attribute once you have it.

## Before any demo

```bash
python3 -m tools.preflight
```

Exercises the real APIs with your real credentials: key valid, voice id
accepted, LLM answering, normalizer converting, all three projects loaded. The
failures it catches — bad key, wrong voice id, unreachable LLM — otherwise
show up as thirty seconds of silence in front of a client. Exits non-zero on
failure, so it works in a pre-deploy hook.

## Known gaps

- **Not yet run against live Sarvam credentials.** Signatures are verified
  against pipecat 1.7.0, all modules import cleanly, and `tools/preflight.py`
  will tell you in ten seconds whether the live APIs agree — but no real
  conversation has happened yet. Expect to adjust model ids on first contact.
- `PlivoFrameSerializer` gets `streamId` from Plivo's first WebSocket frame;
  the nesting is handled defensively but unverified against live traffic. This
  affects the phone leg only.
- Sarvam voice cloning may be enterprise-gated. If it is, the fallback is
  Google Instant Custom Voice at ~₹3.17/min — worse economics, already on the
  GCP bill.
- The Gemini figure in `tools/costs.py` excludes context caching and is an
  upper bound. Measure both LLMs before treating the gap as final.
- Concurrency on one `e2-small` is untested. `MAX_WEB_SESSIONS` defaults to 20;
  watch CPU under real load before trusting that.
