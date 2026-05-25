#!/usr/bin/env python3
"""Per-section variable-rate slowdown via split + setpts + concat.

Each section in a build_*.py has a known [start_t, end_t] (in source/canonical
time). The current silent MP4s play that source at 1.521x. This script:

  1. Extracts each section's segment from the current silent MP4 by mapping
     section boundaries through the 1.521x scale.
  2. Applies per-section setpts*w to each segment (extra slowdown weighted
     by how much text is on screen in that section).
  3. Concatenates the segments back into a single silent MP4.

Weights:
  1.00  light  — ≤2 small labels, sparse text → keep current pace
  1.10  medium — 1 line of body + 1 chip/label
  1.20  heavy  — multi-line body + headline + annotations
  1.30  very heavy — full name lockup + tagline + 2 detail lines
"""
from __future__ import annotations

import shutil
import subprocess
import tempfile
from pathlib import Path

OUT = Path("/home/user/The-Green-Team/out")
CURRENT_SLOW = 1.521  # current silent MP4s are at this much vs source

EPISODES = {
    "gt-ep01-aqi": [
        (0.0,   2.0,  1.20, "HOOK"),
        (2.0,   3.5,  1.20, "STAKES"),
        (3.5,   5.0,  1.10, "METHOD"),
        (5.0,   8.0,  1.20, "AWARD"),
        (8.0,  10.5,  1.00, "STATS"),
        (10.5, 13.5,  1.30, "REVEAL"),
        (13.5, 15.5,  1.20, "CTA"),
    ],
    "gt-ep02-sanctuaries": [
        (0.0,   2.0,  1.20, "HOOK"),
        (2.0,   3.5,  1.10, "STAKES"),
        (3.5,   5.0,  1.00, "METHOD"),
        (5.0,   7.0,  1.10, "RANK_3"),
        (7.0,   9.0,  1.10, "RANK_2"),
        (9.0,  12.0,  1.30, "WINNER"),
        (12.0, 16.0,  1.20, "CTA"),
    ],
    "gt-ep03-syl37": [
        (0.0,   2.0,  1.20, "HOOK"),
        (2.0,   3.5,  1.20, "STAKES"),
        (3.5,   5.0,  1.00, "METHOD"),
        (5.0,   8.0,  1.20, "THE_NEXT"),
        (8.0,  10.5,  1.00, "STATS"),
        (10.5, 13.5,  1.20, "WINDOW"),
        (13.5, 15.5,  1.20, "CTA"),
    ],
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print("FAILED:", " ".join(cmd[:5]), "...")
        print(r.stderr[-1500:])
        raise SystemExit(1)


def slow_episode(slug: str, sections: list) -> None:
    src = OUT / f"brandmint-{slug}-silent.mp4"
    if not src.exists():
        print(f"[skip] {src} not found")
        return

    with tempfile.TemporaryDirectory() as td:
        td_p = Path(td)
        seg_paths = []
        for i, (s_a, s_b, w, lbl) in enumerate(sections):
            # Map source-time boundaries → current-timeline boundaries
            t_in = s_a * CURRENT_SLOW
            t_out = s_b * CURRENT_SLOW
            seg = td_p / f"seg_{i:02d}_{lbl}.mp4"
            # Extract this slice, apply setpts=PTS*w in one ffmpeg pass
            run([
                "ffmpeg", "-y",
                "-ss", f"{t_in:.6f}",
                "-to", f"{t_out:.6f}",
                "-i", str(src),
                "-vf", f"setpts=PTS*{w:.4f},fps=60",
                "-an",
                "-c:v", "libx264", "-preset", "slow", "-crf", "22",
                "-pix_fmt", "yuv420p",
                str(seg),
            ])
            seg_paths.append(seg)

        # Build concat list
        list_path = td_p / "list.txt"
        list_path.write_text(
            "\n".join(f"file '{p.as_posix()}'" for p in seg_paths)
        )

        out = td_p / "concat.mp4"
        run([
            "ffmpeg", "-y", "-f", "concat", "-safe", "0",
            "-i", str(list_path),
            "-c:v", "libx264", "-preset", "slow", "-crf", "22",
            "-pix_fmt", "yuv420p", "-movflags", "+faststart",
            str(out),
        ])
        shutil.move(str(out), str(src))

    dur = subprocess.check_output([
        "ffprobe", "-v", "error",
        "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1",
        str(src),
    ], text=True).strip()
    size_kb = src.stat().st_size // 1024
    print(f"[ok] {slug}: {dur}s · {size_kb} KB · "
          + " ".join(f"{lbl}({w:.2f})" for (_, _, w, lbl) in sections))


def main():
    for slug, sections in EPISODES.items():
        slow_episode(slug, sections)


if __name__ == "__main__":
    main()
