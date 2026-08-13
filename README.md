<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Green Team

Channel-partner platform for forest-adjacent property near Hyderabad — curated
sanctuaries, an environmental map, member pricing and an admin dashboard.

**Live:** https://thegreenteam.in · **Stack:** React 19 · TypeScript · Vite 6 ·
Tailwind CSS 4 · Leaflet · Firebase (Auth + Firestore)

## Documentation

- **[docs/APP-DOCUMENTATION.md](docs/APP-DOCUMENTATION.md)** — implementation
  walkthrough, route/URL map, data model, and 33 signed-in screenshots.
- **[docs/PROMPT-app-documentation.md](docs/PROMPT-app-documentation.md)** — the
  reusable prompt that generates this kind of documentation in any app repo.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
cp .env.example .env.local   # fill in your Firebase web-app config
npm run dev                  # http://localhost:3000
```

Firebase console prerequisites: enable the Google, Email/Password and Phone
providers, add your domain to the authorised-domains list, and publish Firestore
rules for the `users`, `leads`, `newsletter` and `properties` collections.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm run preview` | Production build / preview |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run dev:demo` | Demo build on :4173 — boots signed in, no Firebase credentials needed |
| `npm run screenshots` | Regenerates `docs/screenshots/` against the demo build |

The demo build ([`vite.demo.config.ts`](vite.demo.config.ts)) aliases the
`firebase/*` imports to in-memory stand-ins in
[`scripts/demo-firebase/`](scripts/demo-firebase) so the documentation
screenshots can show authenticated screens without real credentials or real user
data. It is never used by `npm run build`.

## Deploy

Vercel builds `npm run build` and serves `dist/`; SPA rewrites, security headers
and asset caching are configured in [`vercel.json`](vercel.json). Set the
`VITE_FIREBASE_*` variables in the Vercel project settings before deploying.
