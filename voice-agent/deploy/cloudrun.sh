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

# Cloud Shell starts with no default project, which breaks every gcloud command
# you run by hand afterwards. Set it once, here.
if [[ "$(gcloud config get-value project 2>/dev/null)" != "${PROJECT}" ]]; then
  echo "==> setting default project to ${PROJECT}"
  gcloud config set project "${PROJECT}" --quiet
fi

# --- one-time setup ---------------------------------------------------------
if [[ "${1:-}" == "setup" ]]; then
  gcloud services enable run.googleapis.com secretmanager.googleapis.com \
      firestore.googleapis.com artifactregistry.googleapis.com \
      cloudbuild.googleapis.com --project "${PROJECT}"

  gcloud iam service-accounts create voice-agent \
      --display-name="Telugu voice agent" --project "${PROJECT}" 2>/dev/null || true

  # A new service account is not immediately visible to the IAM policy API —
  # binding a role straight after creating it fails with "does not exist".
  # Wait for it to appear rather than racing.
  echo "==> waiting for the service account to propagate"
  for attempt in $(seq 1 30); do
    if gcloud iam service-accounts describe "${SA}" --project "${PROJECT}" \
         >/dev/null 2>&1; then
      break
    fi
    sleep 2
    [[ ${attempt} -eq 30 ]] && { echo "service account never appeared"; exit 1; }
  done

  # Least privilege: Firestore read/write, and read on the secrets it needs.
  # Retried for the same propagation reason — describe can succeed a moment
  # before the policy backend agrees.
  for role in datastore.user secretmanager.secretAccessor; do
    for attempt in $(seq 1 10); do
      if gcloud projects add-iam-policy-binding "${PROJECT}" --quiet \
           --member="serviceAccount:${SA}" --role="roles/${role}" >/dev/null 2>&1; then
        echo "==> granted roles/${role}"
        break
      fi
      sleep 3
      [[ ${attempt} -eq 10 ]] && { echo "could not grant roles/${role}"; exit 1; }
    done
  done

  # `gcloud run deploy --source` builds via Cloud Build, which runs as the
  # project's DEFAULT COMPUTE service account — not the one above. Newer
  # projects no longer auto-grant it the roles it needs, so the build fails
  # with "does not have storage.objects.get access" on the source zip it just
  # uploaded. Grant them here.
  PROJECT_NUMBER=$(gcloud projects describe "${PROJECT}" --format='value(projectNumber)')
  BUILD_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  echo "==> granting build roles to ${BUILD_SA}"
  for role in cloudbuild.builds.builder storage.objectViewer \
              artifactregistry.writer logging.logWriter; do
    for attempt in $(seq 1 5); do
      if gcloud projects add-iam-policy-binding "${PROJECT}" --quiet \
           --member="serviceAccount:${BUILD_SA}" --role="roles/${role}" \
           >/dev/null 2>&1; then
        echo "    roles/${role}"
        break
      fi
      sleep 3
      [[ ${attempt} -eq 5 ]] && echo "    WARNING: could not grant roles/${role}"
    done
  done

  for secret in SARVAM_API_KEY PLIVO_AUTH_ID PLIVO_AUTH_TOKEN; do
    gcloud secrets create "${secret}" --replication-policy=automatic \
        --project "${PROJECT}" 2>/dev/null || true
  done

  # Store the Sarvam key here if it's in the environment, so there is no
  # separate command to get wrong. Reads from the env, never from a file that
  # could be committed.
  if [[ -n "${SARVAM_API_KEY:-}" ]]; then
    printf '%s' "${SARVAM_API_KEY}" | gcloud secrets versions add SARVAM_API_KEY \
        --data-file=- --project "${PROJECT}" >/dev/null
    echo "==> stored SARVAM_API_KEY in Secret Manager"
    echo
    echo "==> setup done. Now run:  $0"
  else
    cat <<EOF

==> setup done, but SARVAM_API_KEY is not set. Do this:

    export SARVAM_API_KEY='<your key>'
    $0 setup      # stores it
    $0            # deploys
EOF
  fi
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
  --set-env-vars "^@^GOOGLE_CLOUD_PROJECT=${PROJECT}@AGENT_PROJECT=${AGENT_PROJECT:-portfolio}@ALLOWED_ORIGINS=${ALLOWED_ORIGINS:-https://thegreenteam.in,https://www.thegreenteam.in}@SARVAM_VOICE_ID=${SARVAM_VOICE_ID:-anushka}" \
  --set-secrets "SARVAM_API_KEY=SARVAM_API_KEY:latest,PLIVO_AUTH_ID=PLIVO_AUTH_ID:latest,PLIVO_AUTH_TOKEN=PLIVO_AUTH_TOKEN:latest"

HOST=$(gcloud run services describe "${SERVICE}" --project "${PROJECT}" \
        --region "${REGION}" --format='value(status.url)' | sed 's|https://||')

# The service's own URL is only known after the first deploy. Both of these
# depend on it: PUBLIC_HOST for the Plivo callbacks, and the origin allowlist
# so the test page served from this very host can open its own WebSocket.
ORIGINS="${ALLOWED_ORIGINS:-https://thegreenteam.in,https://www.thegreenteam.in}"
# ^@^ makes @ the separator. ALLOWED_ORIGINS is itself a comma-separated list,
# and with gcloud's default separator its second entry is parsed as a new
# variable name — which fails with "Bad syntax for dict arg".
gcloud run services update "${SERVICE}" --project "${PROJECT}" --region "${REGION}" \
  --update-env-vars "^@^PUBLIC_HOST=${HOST}@ALLOWED_ORIGINS=https://${HOST},${ORIGINS}"

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
