# PDF rendering

The two PDFs in `scripts/voice/` are rendered from these HTML sources with headless
Chromium (via Playwright), which is the only path here that shapes Telugu conjuncts
correctly — ReportLab and the default container fonts do not.

## Requirements

Telugu needs a real shaping font; the base image ships only Unifont, which has
coverage but no conjunct formation. Install Noto:

```bash
mkdir -p /usr/local/share/fonts/noto
# Noto Sans Telugu, Noto Sans, Noto Serif, Noto Sans Mono — TTFs from fonts.gstatic.com
fc-cache -f
```

```bash
pip install playwright pypdfium2 pillow
```

Chromium is already present at `/opt/pw-browsers/chromium-1194/` — do not run
`playwright install`.

## Render

```bash
python3 render.py "$(pwd)"
```

Outputs `MODCON-Telugu-Cold-Call-Script.pdf` and `Telugu-Voice-Agent-Blueprint.pdf`.

`print-blueprint.html` is the published artifact page plus an appended print
stylesheet (A4 page box, Noto faces, break rules, white ground).

## Verify before shipping

Always check that Telugu actually shaped — a font fallback failure is silent:

```python
import pypdfium2 as pdfium
d = pdfium.PdfDocument("MODCON-Telugu-Cold-Call-Script.pdf")
d[0].render(scale=1.5).to_pil().save("check.png")   # eyeball for tofu boxes
```
