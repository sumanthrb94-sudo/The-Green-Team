#!/usr/bin/env bash
# Deploy the voice agent to Cloud Run in Mumbai.
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
  --set-env-vars "GOOGLE_CLOUD_PROJECT=${PROJECT},AGENT_PROJECT=${AGENT_PROJECT:-agartha}" \
  --set-secrets "SARVAM_API_KEY=SARVAM_API_KEY:latest,PLIVO_AUTH_ID=PLIVO_AUTH_ID:latest,PLIVO_AUTH_TOKEN=PLIVO_AUTH_TOKEN:latest"

HOST=$(gcloud run services describe "${SERVICE}" --project "${PROJECT}" \
        --region "${REGION}" --format='value(status.url)' | sed 's|https://||')

# PUBLIC_HOST is only known after the first deploy, so set it and redeploy.
gcloud run services update "${SERVICE}" --project "${PROJECT}" --region "${REGION}" \
  --update-env-vars "PUBLIC_HOST=${HOST}"

echo "==> live at https://${HOST}"
echo "==> point the Plivo application answer_url at https://${HOST}/plivo/answer"

# Notes on the flags that matter:
#   --min-instances 1   a cold start on an inbound call is a dropped call
#   --timeout 3600      calls hold a WebSocket open; the default 5 min cuts them
#   --session-affinity  keeps a call's frames on the instance that owns it
#   --concurrency 10    ~10 simultaneous calls per instance; raise after
#                       measuring CPU under real load, not before
