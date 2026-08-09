import asyncio, sys
from playwright.async_api import async_playwright

JOBS = [
    ("print-telugu-script.html", "MODCON-Telugu-Cold-Call-Script.pdf",
     "MODCON Builders &middot; Telugu Cold Call Script &middot; TTS Voice Test"),
    ("print-blueprint.html", "Telugu-Voice-Agent-Blueprint.pdf",
     "Telugu Voice Agent &mdash; Build Blueprint"),
]

FOOT = ("<div style=\"width:100%;font-family:'Noto Sans',sans-serif;font-size:7pt;color:#6b7363;"
        "padding:0 14mm;display:flex;justify-content:space-between;\">"
        "<span>{title}</span><span class='pageNumber'></span></div>")

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/opt/pw-browsers/chromium-1194/chrome-linux/chrome")
        pg = await b.new_page()
        for src, out, title in JOBS:
            await pg.goto(f"file:///{sys.argv[1]}/{src}", wait_until="networkidle")
            await pg.emulate_media(media="print", color_scheme="light")
            await pg.pdf(path=out, format="A4", print_background=True,
                         display_header_footer=True,
                         header_template="<div></div>",
                         footer_template=FOOT.format(title=title),
                         margin={"top":"15mm","bottom":"16mm","left":"0","right":"0"})
            print("ok", out)
        await b.close()

asyncio.run(main())
