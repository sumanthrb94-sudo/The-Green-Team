# Reusable prompt — "document this app with signed-in screenshots"

Paste the block below into Claude Code (or any coding agent with shell + browser
access) in **any repository where you built an application**. Fill in the four
placeholders at the top; everything else is generic.

This repo is the worked example: it produced
[`docs/APP-DOCUMENTATION.md`](./APP-DOCUMENTATION.md) and 33 signed-in screenshots
in [`docs/screenshots/`](./screenshots).

---

## The prompt

````text
Document this application end to end, with logged-in screenshots, and push the result.

CONTEXT (fill these in; if a value is unknown, work it out from the repo and say what you inferred)
- Live URL(s):            <https://example.com>
- Repo / branch to push:  <owner/repo> · <branch-name>
- Product in one line:    <what this app is for and who uses it>
- Roles to document:      <e.g. visitor, member, admin>

WHAT I WANT
1. A documentation file at docs/APP-DOCUMENTATION.md that explains the implementation —
   not a feature list, but how the thing actually works.
2. At least 10 screenshots (aim for 20–30 if the app has that many surfaces) in
   docs/screenshots/, embedded in that file with a caption each.
3. THE SCREENSHOTS MUST SHOW A SIGNED-IN SESSION. A logged-out marketing page is not
   acceptable except for the shots that specifically document the login flow itself.
   Cover every authenticated role listed above, including admin/dashboard surfaces.
4. Every relevant URL collected in one table: live site, each route/deep link, repo,
   deploy target, sitemap/robots/manifest, and any outbound links the UI depends on.
5. Everything committed and pushed to the branch above. Do not open a pull request
   unless I ask.

HOW TO GET LOGGED-IN SCREENSHOTS WITHOUT REAL CREDENTIALS
Do not ask me for a password, and do not put real credentials or real customer data in
the repo. Instead simulate the signed-in state, in this order of preference:
  a. If the project already has a test/dev/mock auth mode, a seed script, or an emulator
     (Firebase emulator, Supabase local, MSW, a fixtures file), use it.
  b. Otherwise add a DEMO BUILD that swaps the auth/data layer for in-memory stand-ins,
     without modifying application source:
       - a separate build config (e.g. vite.demo.config.ts / next.config.demo.mjs /
         a webpack alias / a DI switch) that aliases the auth + database SDK modules to
         local stand-ins under scripts/demo-*/;
       - the stand-ins implement exactly the API surface the app imports, and read which
         identity to boot as from localStorage or an env var, so the runner can pick
         visitor / member / admin;
       - seed the fake database with clearly fictional but realistic records (use
         example.com / example.in addresses) so dashboards and tables render with
         structure, not empty states.
     Make it impossible for this to reach production: separate config file, never
     referenced by the real build/deploy command, and say so in a header comment.
  c. If neither is feasible, ask me for a throwaway staging account before falling back
     to logged-out screenshots.

CAPTURE RULES
- Write the capture as a committed, re-runnable script (Playwright preferred), e.g.
  scripts/capture-screenshots.mjs, wired to an npm script. I want to regenerate this set
  later with one command.
- Desktop 1440x900 and mobile 390x844. JPEG ~80% quality so the repo stays small —
  keep the whole set well under ~10 MB and report the total.
- Name files NN-kebab-case-description.ext in walkthrough order, and write a
  docs/screenshots/index.json mapping filename to caption.
- Drive the real UI: click into modals, open drawers, switch dashboard tabs, open detail
  overlays, toggle dark mode. Do not screenshot the same view twice under different names.
- Verify each shot: assert an expected element is visible before capturing, print a
  warning when it is not, and check for duplicate images. Then LOOK at the images
  yourself and fix any that are blank, mid-animation, or missing their content.
- Wait for images/fonts/tiles to load before capturing.
- If the sandbox blocks a third-party asset (map tiles, a CDN, remote images), either
  serve a local equivalent from the repo or a neutral placeholder — and say so in the
  caption and in the doc. Never present a substituted asset as the real thing.

WHAT THE DOCUMENTATION MUST COVER
- Header table: live URL, repo, hosting, stack, screenshot count/date, regenerate command.
- Route/URL table: path, live URL, what renders there, and how routing actually works.
- The screenshot walkthrough, grouped by area, one caption per image explaining what the
  reader is looking at and which role sees it.
- Implementation, in enough depth that a new engineer can navigate:
    * file/directory map with one line each
    * rendering + navigation model
    * authentication: every sign-in path, session restore, what happens on first login
    * data model: each table/collection, who writes it, who reads it
    * authorisation/gating: what unlocks what, and where it is enforced
    * any specialised subsystem (maps, chat, payments, realtime, uploads)
    * styling/theming, SEO/meta, PWA, caching and security headers
- Local setup: install, env vars (names only, never values), scripts table, and any
  external console setup required (providers to enable, domains to allowlist, rules to publish).
- Deployment: build command, host, and what "done" looks like.
- An honest "observations worth acting on" section: dead code, stubbed handlers, hardcoded
  gates, third-party dependencies in critical paths, privacy-sensitive captures, oversized
  files. Report them; do not fix them in this pass unless I ask.
- A section explaining exactly how the screenshots were produced, which parts are simulated,
  and which two or three things differ from production.

GROUND RULES
- Accuracy over polish. Read the code before describing it; never document behaviour you
  have not seen run. If something is stubbed or broken, say so plainly instead of
  writing it up as if it works.
- No secrets, no real user data, no real credentials — in screenshots, seeds or docs.
- Do not refactor the application while documenting it. Additive files only
  (docs/, scripts/, a demo build config, an npm script, a .gitignore exception).
- Commit with a clear message, push to the branch above, and then tell me: the total
  screenshot count and size, what is simulated, what you could not capture and why.
````

---

## Notes from running this on The Green Team

- **`fullPage: true` is a trap** when the app scrolls an inner container instead of the
  document — it silently returns a viewport-sized image. Check what actually scrolls and
  scroll it explicitly.
- **Assert before you capture.** Several early shots looked plausible but were the page
  behind an unopened drawer. An `expect` check per screenshot plus a duplicate-hash pass
  caught all of them.
- **Selectors: prefer what the user sees.** Tab labels carrying counts (`Leads (6)`) are
  more stable anchors than class names, but they need exact-match regexes so a background
  element with similar text is not clicked instead.
- **Seed data does most of the work.** An admin dashboard screenshotted against an empty
  database documents nothing; the same view with a dozen fictional records documents the
  whole data model.
