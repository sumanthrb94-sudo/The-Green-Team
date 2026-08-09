#!/usr/bin/env bash
# Deploy the voice agent to Cloud Run in Mumbai. This is the default host.
#
# Both channels work here because both stream over WebSockets: the widget
# sends PCM to /web/ws, and Plivo streams call audio to /plivo/stream. Cloud
# Run terminates HTTPS on its own *.run.app hostname with a valid
# certificate, so there is no DNS record to create and no VM to run.
#
# The one thing Cloud Run cannot do is inbound UDP, which rules out the
# WebRTC transport (/web/offer). If you later want WebRTC for its jitter
# resilience on poor mobile networks, deploy/gce.sh puts the agent on a VM
# with the media ports open — at the cost of a VM, a DNS record and a cert.
#
# Credentials: the service runs as a dedicated service account and reads
# secrets from Secret Manager. There is no service-account key file anywhere
# in this deployment — that is deliberate, a key on disk is a key that leaks.

set -euo pipefail

PROJECT="${GOOGLE_CLOUD_PROJECT:-thegreenteam-17cfc}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-voice-agent}"
SA="voice-agent@${PROJECT}.iam.gserviceaccount.com"

echo "==> project=${PROJECT} region=${REGION} service=${SERVICE}"

# --- one-time setup ---------------------------------------------------------
if [[ "${1:-}" == "setup" ]]; then
  gcloud services enable run.googleapis.com secretmanager.googleapis.com \
      firestore.googleapis.com artifactregistry.googleapis.com \
      cloudbuild.googleapis.com --project "${PROJECT}"

  gcloud iam service-accounts create voice-agent \
      --display-name="Telugu voice agent" --project "${PROJECT}" || true

  # Least privilege: Firestore read/write, and read on the secrets it needs.
  gcloud projects add-iam-policy-binding "${PROJECT}" \
      --member="serviceAccount:${SA}" --role="roles/datastore.user"
  gcloud projects add-iam-policy-binding "${PROJECT}" \
      --member="serviceAccount:${SA}" --role="roles/secretmanager.secretAccessor"

  for secret in SARVAM_API_KEY PLIVO_AUTH_ID PLIVO_AUTH_TOKEN; do
    gcloud secrets create "${secret}" --replication-policy=automatic \
        --project "${PROJECT}" 2>/dev/null || true
    echo "    set it with: echo -n '<value>' | gcloud secrets versions add ${secret} --data-file=-"
  done

  echo "==> setup done. Add the secret values, then run: $0 deploy"
  exit 0
fi

# --- deploy -----------------------------------------------------------------
gcloud run deploy "${SERVICE}" \
  --source . \
  --project "${PROJECT}" \
  --region "${REGION}" \
  --service-account "${SA}" \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 10 \
  --concurrency 10 \
  --cpu 1 --memory 2Gi \
  --timeout 3600 \
  --session-affinity \
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT},AGENT_PROJECT=${AGENT_PROJECT:-portfolio},ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://thegreenteam.in,https://www.thegreenteam.in},SARVAM_VOICE_ID=${SARVAM_VOICE_ID:-anushka}" \
  --set-secrets "SARVAM_API_KEY=SARVAM_API_KEY:latest,PLIVO_AUTH_ID=PLIVO_AUTH_ID:latest,PLIVO_AUTH_TOKEN=PLIVO_AUTH_TOKEN:latest"

HOST=$(gcloud run services describe "${SERVICE}" --project "${PROJECT}" \
        --region "${REGION}" --format='value(status.url)' | sed 's|https://||')

# The service's own URL is only known after the first deploy. Both of these
# depend on it: PUBLIC_HOST for the Plivo callbacks, and the origin allowlist
# so the test page served from this very host can open its own WebSocket.
ORIGINS="${ALLOWED_ORIGINS:-https://thegreenteam.in,https://www.thegreenteam.in}"
gcloud run services update "${SERVICE}" --project "${PROJECT}" --region "${REGION}" \
  --update-env-vars "PUBLIC_HOST=${HOST},ALLOWED_ORIGINS=https://${HOST},${ORIGINS}"

cat <<EOF

==> live at https://${HOST}

    Test it right now — open that URL in a browser and click the button.
    The page serves the widget itself, so nothing else needs deploying.

    To put it on the website instead, set this in Vercel and redeploy:
        VITE_AGENT_HOST=https://${HOST}

    Phone leg, later: point the Plivo answer_url at
        https://${HOST}/plivo/answer
EOF

# Notes on the flags that matter:
#   --min-instances 1   a cold start on an inbound call is a dropped call
#   --timeout 3600      calls hold a WebSocket open; the default 5 min cuts them
#   --session-affinity  keeps a call's frames on the instance that owns it
#   --concurrency 10    ~10 simultaneous calls per instance; raise after
#                       measuring CPU under real load, not before
