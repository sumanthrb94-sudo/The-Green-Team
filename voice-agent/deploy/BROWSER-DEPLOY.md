# Deploy from the browser — no terminal

Cloud Run builds straight from GitHub. Everything below is point-and-click.

The one-time IAM, the service account and the `SARVAM_API_KEY` secret already
exist in `thegreenteam-17cfc` from the earlier setup, so this picks up from
there.

## 1 · Create the service

<https://console.cloud.google.com/run> → **Create service**

- Select **Continuously deploy from a repository** → **Set up with Cloud Build**
- Repository: `sumanthrb94-sudo/the-green-team` (authorise GitHub if asked)
- Branch: `claude/modcon-telugu-cold-call-script-e8m0g6`
- Build type: **Dockerfile**
- **Source location: `/voice-agent`** ← easy to miss, and it fails without it

## 2 · Service settings

| Field | Value |
|---|---|
| Region | `asia-south1` (Mumbai — closest to Sarvam) |
| Authentication | **Allow unauthenticated invocations** |
| Service account | `voice-agent@thegreenteam-17cfc.iam.gserviceaccount.com` |
| Minimum instances | **1** — a cold start on an incoming call is a dropped call |
| Maximum instances | 10 |
| Request timeout | **3600** — calls hold a connection open; the 300 s default cuts them off |
| Session affinity | **on** |
| Memory | 2 GiB · CPU 1 |

## 3 · Variables and secrets

**Environment variables:**

```
GOOGLE_CLOUD_PROJECT = thegreenteam-17cfc
AGENT_PROJECT        = portfolio
SARVAM_VOICE_ID      = priya
ALLOWED_ORIGINS      = https://thegreenteam.in,https://www.thegreenteam.in
```

**Secret** → *Reference a secret*:

```
SARVAM_API_KEY  →  secret SARVAM_API_KEY, version latest, exposed as env var
```

Press **Create**. First build takes a few minutes.

## 4 · Allow the service to talk to itself

Cloud Run gives you a URL like `https://voice-agent-xxxx.a.run.app`. The test
page is served from that same host, so add it to the allowlist: **Edit &
deploy new revision** → append `,https://voice-agent-xxxx.a.run.app` to
`ALLOWED_ORIGINS`.

## 5 · Use it

Open the `run.app` URL and tap the button. That page carries the widget, so
nothing else needs deploying.

To put it on the live site instead, add to Vercel and redeploy:

```
VITE_AGENT_HOST = https://voice-agent-xxxx.a.run.app
```

## If the build fails

Cloud Run → your service → **Revisions** / **Logs**, or the Cloud Build entry
it links to. The usual cause is a missing source location (step 1) — the build
then runs against the repo root, where there is no Dockerfile.
