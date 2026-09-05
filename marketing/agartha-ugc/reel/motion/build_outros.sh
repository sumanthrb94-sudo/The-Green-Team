#!/usr/bin/env bash
# Render one outro per campaign CTA word. Identical card and identical SFX bed —
# only the word inside the pill changes, so they're drop-in swappable in an edit.
set -e

WORK=/tmp/claude-0/-home-user-The-Green-Team/de3e9eba-edd3-596d-a92c-fbc8b45665ba/scratchpad/reel-build
M=/home/user/The-Green-Team/marketing/agartha-ugc/reel/motion
OUT="$WORK/outros_multi"
SRC="$M/outro-motion.html"
SFX="$WORK/outro_v2/outro_sfx.m4a"
mkdir -p "$OUT"
export CHROMIUM_PATH=/opt/pw-browsers/chromium
cd /home/user/The-Green-Team

for WORD in PLANTED FARMED WATER EDIBLE FOREST PRICE; do
  lc=$(echo "$WORD" | tr '[:upper:]' '[:lower:]')
  html="$OUT/outro-$lc.html"

  # swap only the pill's word; everything else byte-identical to the source card
  sed "s/COMMENT &ldquo;PRICE&rdquo;/COMMENT \&ldquo;${WORD}\&rdquo;/" "$SRC" > "$html"
  grep -q "COMMENT &ldquo;${WORD}&rdquo;" "$html" || { echo "FAIL: word swap missed for $WORD"; exit 1; }

  node "$M/capture.cjs" "$html" 120 "$OUT/frames_$lc"

  ffmpeg -y -framerate 30 -i "$OUT/frames_$lc/frame_%05d.png" -frames:v 120 \
    -c:v libx264 -pix_fmt yuv420p -crf 18 -preset medium "$OUT/v_$lc.mp4" -loglevel error

  ffmpeg -y -i "$OUT/v_$lc.mp4" -i "$SFX" -map 0:v -map 1:a \
    -c:v copy -c:a aac -b:a 192k -shortest "$OUT/outro-$lc.mp4" -loglevel error

  rm -rf "$OUT/frames_$lc"
  printf '%-8s ' "$WORD"
  ffprobe -v error -show_entries format=duration -show_entries stream=width,height \
    -of csv=p=0 "$OUT/outro-$lc.mp4" | tr '\n' ' '
  echo
done

echo "ALL DONE"
