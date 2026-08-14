<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# The Green Team — v2

Channel-partner platform for forest-adjacent property near Hyderabad — curated
sanctuaries with real property pages, an environmental-intelligence map, a full
admin application, and server-verified security.

**Live:** https://thegreenteam.in · **Stack:** Next.js 15 (App Router) ·
React 19 · TypeScript · Tailwind CSS 4 · Motion · Leaflet · Recharts ·
Firebase Auth + Firestore (Admin SDK server-side)

> v1 (the single-file Vite SPA) is preserved in [`legacy/`](legacy/) and its
> documentation in [`docs/APP-DOCUMENTATION.md`](docs/APP-DOCUMENTATION.md).

## What v2 adds over v1

- **Server-rendered SEO on every route** — per-page metadata, JSON-LD, generated
  sitemap/robots. v1 was a client-side SPA where crawlers saw one set of tags.
- **Real property pages** (`/sanctuaries/agartha|syl|dates-county`) with gallery,
  interactive 36-plot site plan, and per-property invest economics + WhatsApp
  CTAs. The v1 `/list` dead "View Details" and empty `/syl` routes are gone
  (`/syl` 301s to its property page).
- **Real blog** — `/blog/[slug]` pages for all 10 articles with Article JSON-LD.
  v1 rendered posts in a modal with no URL.
- **Full admin app** at `/admin` — overview with charts, lead pipeline with
  status tracking (new → contacted → site visit → closed), property CRUD,
  newsletter + users views, CSV exports.
- **Server-verified security** — admin is decided by the Firebase Admin SDK on
  the server (httpOnly session cookie + `ADMIN_EMAILS` env), not a client-side
  email constant. All Firestore reads/writes go through server routes, so client
  rules can deny everything ([`firestore.rules`](firestore.rules)).
- **Fixed data loss** — the membership form's phone number is now persisted.
- **Local gallery** — the Agartha gallery serves from `public/gallery/agartha/`
  instead of the Wix CDN.
- **Revived dead code** — trust signals section, forests-and-lakes map layer
  (18 reserve-forest/lake polygons) behind a working filter pill.

## Run locally

```bash
npm install
# .env.local — see below
npm run dev            # http://localhost:3000
```

`.env.local` (never committed):

```bash
# Server (Firebase console → Service accounts → Generate key)
FIREBASE_PROJECT_ID="…"
FIREBASE_CLIENT_EMAIL="…"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n…\n-----END PRIVATE KEY-----\n"
ADMIN_EMAILS="admin@example.com"          # comma-separated allow-list

# Client (Firebase console → Project settings → Web app) — optional:
# safe defaults for the production project are compiled in.
NEXT_PUBLIC_FIREBASE_API_KEY="…"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="…"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="…"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="…"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="…"
NEXT_PUBLIC_FIREBASE_APP_ID="…"
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="…"
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` / `npm start` | Production build / serve |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run screenshots` | Regenerates `docs/screenshots/` (run `DEMO_ADMIN=1 DEMO_DATA=1 npm run dev` first — dev-only flags that swap the admin session and datasets for fictional records) |

## Architecture

```
app/
  (site)/            public pages — home, list, map, analytics, blog(+slug),
                     sanctuaries/[id], membership, preinvestor-gold
  admin/             server-guarded admin app (overview, leads, properties, …)
  api/               leads, newsletter, profile, chat (Groot), session,
                     admin/* (mutations + CSV export)
  sitemap.ts robots.ts
components/          nav, home sections, property (gallery/layout/invest),
                     map, auth, chat, admin, membership
lib/
  data/              sanctuaries, journal, map datasets, Agartha site plan,
                     Groot knowledge, contact/WhatsApp links
  firebase/          client.ts (browser SDK) · admin.ts (server SDK)
  server/            session cookies, admin data fetchers, demo data
legacy/              the complete v1 Vite app, for reference
```

Security model: the browser only ever talks to Firebase for **authentication**.
Every Firestore read/write — lead capture, newsletter, profiles, admin — goes
through Next.js server routes using the Admin SDK, with the admin area gated by
a verified session cookie. Publish [`firestore.rules`](firestore.rules) to lock
client access down entirely.

## Deploy (Vercel)

1. Framework preset: **Next.js** (remove any old SPA rewrite config — v1's
   `vercel.json` is gone on purpose; headers live in `next.config.ts`).
2. Set the `FIREBASE_*`, `ADMIN_EMAILS` (and optionally `NEXT_PUBLIC_*`) env
   vars for Production.
3. In Firebase Console: keep Google/Email/Phone providers enabled and the
   production domain in Authentication → Authorized domains.
4. After the first deploy, publish `firestore.rules`.
