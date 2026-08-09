# Cloud Run, asia-south1 (Mumbai) — closest region to both the callers and
# Sarvam's India-hosted inference.
FROM python:3.11-slim

# Silero VAD needs libgomp; ffmpeg covers audio codec conversion.
RUN apt-get update && apt-get install -y --no-install-recommends \
        libgomp1 ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Warm the Silero model into the image so the first call of a cold start
# doesn't pay for the download.
RUN python -c "from pipecat.audio.vad.silero import SileroVADAnalyzer; SileroVADAnalyzer()" || true

ENV PYTHONUNBUFFERED=1 PORT=8080
EXPOSE 8080

# One worker: each instance holds live WebSocket calls, so concurrency is
# managed by Cloud Run's --concurrency, not by forking workers.
CMD exec uvicorn agent.server:app --host 0.0.0.0 --port ${PORT} --workers 1
