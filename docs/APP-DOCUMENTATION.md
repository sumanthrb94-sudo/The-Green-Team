# The Green Team — Application Documentation (v1)

> **Historical document — this describes v1.** The application was rebuilt on
> Next.js 15 in August 2026; v1's source now lives in [`legacy/`](../legacy/).
> For the current architecture see the [README](../README.md). The screenshots
> in `docs/screenshots/` have been regenerated for v2.

Implementation walkthrough and screenshot record for **thegreenteam.in**, the
channel-partner platform for forest-adjacent property near Hyderabad.

| | |
|---|---|
| **Live site** | https://thegreenteam.in |
| **Repository** | https://github.com/sumanthrb94-sudo/The-Green-Team |
| **Hosting** | Vercel (SPA rewrites + security headers in [`vercel.json`](../vercel.json)) |
| **Stack** | React 19 · TypeScript · Vite 6 · Tailwind CSS 4 · Motion · Leaflet · Firebase (Auth + Firestore + Analytics) |
| **Screenshots** | 33 images in [`docs/screenshots/`](./screenshots), captured 13 Aug 2026 |
| **Regenerate** | `npm run dev:demo` in one terminal, `npm run screenshots` in another |

---

## 1. Routes and public URLs

Routing is hand-rolled on the History API — there is no router dependency. `App`
maps `window.location.pathname` to a `ViewMode`, pushes state on navigation, and
listens for `popstate`; `vercel.json` rewrites every path to `index.html` so deep
links survive a hard refresh.

| Route | Live URL | View | What it renders |
|---|---|---|---|
| `/` | https://thegreenteam.in/ | `home` | Hero, ecosystem pillars, the TGT advantage, curated sanctuaries, newsletter, footer |
| `/list` | https://thegreenteam.in/list | `list` | Curated Portfolio — every sanctuary as a card with AQI, noise and pricing |
| `/map` | https://thegreenteam.in/map | `map` | Leaflet map: AQI field, RRR corridor ring, junction markers, sanctuary pins |
| `/analytics` | https://thegreenteam.in/analytics | `analytics` | “Edge + Nature” — positioning, the pre-investor phase, the four-point bar |
| `/syl` | https://thegreenteam.in/syl | `syl` | MODCON SYL Residences deep-dive |
| `/preinvestor-gold` | https://thegreenteam.in/preinvestor-gold | `preinvestor-gold` | Pre-Investor Gold tier |
| `/membership` | https://thegreenteam.in/membership | `membership` | Adviser membership application + footer |
| `/blog` | https://thegreenteam.in/blog | `blog` | 10-article SEO index rendered from the in-app `JOURNAL_POSTS` collection |

Supporting endpoints: [`/sitemap.xml`](https://thegreenteam.in/sitemap.xml),
[`/robots.txt`](https://thegreenteam.in/robots.txt),
[`/site.webmanifest`](https://thegreenteam.in/site.webmanifest).

Outbound links wired into the UI: WhatsApp `https://wa.me/919700144003`,
`mailto:hello@thegreenteam.in`, Instagram `@the.green.team__`, and the developer
brochure `https://www.modconbuilders.com/agartha`.

---

## 2. Screenshots — signed-in walkthrough

All 33 screenshots below were captured against the real application code in an
**authenticated session**: admin for the dashboard surfaces, member elsewhere.
Only the last five document the signed-out entry point, because that is what they
are about. Authentication and Firestore are served by in-memory stand-ins so no
production credentials or real customer records are involved — see
[§7](#7-how-these-screenshots-were-produced).

### 2.1 Home, signed in

| | |
|---|---|
| ![Signed-in home](./screenshots/01-home-signed-in.jpg) | **01** — Landing page inside an authenticated admin session. The navbar carries the `ADMIN` badge and the account avatar instead of a sign-in prompt. |
| ![Ecosystem pillars](./screenshots/02-home-ecosystem-pillars.jpg) | **02** — The ecosystem pillars section that frames the AQI / noise / commute thesis. |
| ![Curated sanctuaries](./screenshots/03-home-curated-sanctuaries.jpg) | **03** — Curated sanctuaries on the home page. A signed-in user counts as subscribed, so member pricing renders unblurred with no newsletter gate. |
| ![Footer](./screenshots/04-home-footer.jpg) | **04** — Footer: route links, contact channels and the inline newsletter capture that writes into the `newsletter` collection. |

### 2.2 Account and session state

| | |
|---|---|
| ![Admin drawer](./screenshots/05-account-drawer-admin.jpg) | **05** — Account drawer for the signed-in admin: identity block with the “Admin” role line, the Admin Dashboard entry, sanctuary shortcuts and sign-out. |
| ![Member drawer](./screenshots/23-account-drawer-member.jpg) | **23** — The same drawer for a non-admin member. The role line reads “Member” and the Admin Dashboard entry is gone — it is gated on the signed-in email. |
| ![Signed-out drawer](./screenshots/29-account-drawer-signed-out.jpg) | **29** — The signed-out drawer, with the Sign In call to action. This is the state every screenshot above starts from. |

### 2.3 Portfolio and property detail

| | |
|---|---|
| ![Sanctuaries list](./screenshots/06-sanctuaries-list.jpg) | **06** — `/list`: every curated sanctuary with its verified metrics and member price. |
| ![Detail gallery](./screenshots/07-property-detail-gallery.jpg) | **07** — Property detail overlay for MODCON Agartha, Gallery tab (22 photos). Header keeps the member price pinned; tabs switch to Layout Plan and Invest. |
| ![Detail invest](./screenshots/08-property-detail-invest.jpg) | **08** — Invest tab: AQI / noise / commute telemetry, the ₹8,500 per sq yd price ladder from 808 to 4,800 sq yds, the biomorphic construction add-on and the WhatsApp enquiry CTAs. |
| ![Detail layout](./screenshots/09-property-detail-layout.jpg) | **09** — Layout Plan tab: the interactive 36-plot site plan, each plot selectable for its own investment snapshot. |

### 2.4 Map

| | |
|---|---|
| ![Map](./screenshots/10-map-live.jpg) | **10** — `/map`: the live AQI field, the RRR corridor ring, key junctions and the three sanctuaries. The grey grid is a placeholder basemap — raster tiles are blocked in the capture sandbox; production loads them normally. |
| ![Map popup](./screenshots/11-map-marker-popup.jpg) | **11** — A sanctuary marker popup, with a direct hand-off into the full property overlay. |

### 2.5 Editorial and tier pages

| | |
|---|---|
| ![Analytics](./screenshots/12-analytics-edge-nature.jpg) | **12** — `/analytics`: channel-partner positioning and the pre-investor phase explainer. |
| ![Analytics scrolled](./screenshots/13-analytics-scrolled.jpg) | **13** — “Four things every property must pass” — forest adjacency, AQI under 25, design quality and a 45-minute commute. |
| ![SYL](./screenshots/14-syl-residences.jpg) | **14** — `/syl`: the MODCON SYL Residences page with its own gallery and layout. |
| ![Pre-investor gold](./screenshots/15-preinvestor-gold.jpg) | **15** — `/preinvestor-gold`: the pre-investor tier and what early entry buys. |
| ![Membership](./screenshots/16-membership.jpg) | **16** — `/membership`: the adviser membership application. |
| ![Blog](./screenshots/17-blog-index.jpg) | **17** — `/blog`: the SEO article index. |

### 2.6 Admin dashboard (admin session only)

| | |
|---|---|
| ![Admin properties](./screenshots/18-admin-properties.jpg) | **18** — Properties tab: Firestore-backed listings with live/draft toggles, edit and delete. Tab counters show how many documents sit behind each collection. |
| ![Admin leads](./screenshots/19-admin-leads.jpg) | **19** — Leads tab: every capture point (property overlay, chatbot, map popup, sign-up) writes here through `saveLead()`, streamed live via `onSnapshot`. |
| ![Admin newsletter](./screenshots/20-admin-newsletter.jpg) | **20** — Newsletter tab: subscribers tagged by the surface that captured them (`modal`, `inline`, `mobile_quick`). |
| ![Admin users](./screenshots/21-admin-users.jpg) | **21** — Users tab: profiles written on first sign-in, including the silently captured geolocation and a Google Maps deep link per user. |
| ![Admin form](./screenshots/22-admin-property-form.jpg) | **22** — The property editor — the full `PropertyInput` form that writes a new document into `properties` and, once marked live, onto the public pages. |

### 2.7 Concierge, theme and mobile

| | |
|---|---|
| ![Chatbot](./screenshots/24-chatbot-member.jpg) | **24** — “Groot”, the concierge chatbot, open in a member session. Answers are matched against the same sanctuary dataset the pages render from. |
| ![Dark mode](./screenshots/25-dark-mode-sanctuaries.jpg) | **25** — Dark theme, signed in. The preference persists in `localStorage` and toggles a class on `<html>`, so every token-driven colour flips at once. |
| ![Mobile home](./screenshots/26-mobile-home-signed-in.jpg) | **26** — Mobile (390×844), signed in: the bottom tab bar replaces desktop navigation, avatar stays in the top bar. |
| ![Mobile list](./screenshots/27-mobile-sanctuaries.jpg) | **27** — Mobile portfolio: the same cards reflowed to one column, member pricing still unlocked. |
| ![Mobile map](./screenshots/28-mobile-map.jpg) | **28** — Mobile map, with the metric strip pinned above the tab bar. |

### 2.8 Authentication flow

| | |
|---|---|
| ![Auth modal](./screenshots/30-auth-modal.jpg) | **30** — The sign-in modal: Google, email/password and phone OTP, all three wired to Firebase Authentication. |
| ![Phone OTP](./screenshots/31-auth-phone-otp.jpg) | **31** — Phone sign-in. The number is normalised to E.164 (+91 assumed for 10-digit input) before `signInWithPhoneNumber`, backed by an invisible reCAPTCHA verifier. |
| ![Email sign-up](./screenshots/32-auth-email-signup.jpg) | **32** — Email sign-up filled in. `createUserWithEmailAndPassword` runs, then the app upserts a user profile and records a “New Sign-up” lead. |
| ![Profile capture](./screenshots/33-profile-capture-new-user.jpg) | **33** — Straight after sign-up: the profile capture modal that writes name / occupation / city into `users` and triggers the silent geolocation write. |

---

## 3. Implementation

### 3.1 Shape of the codebase

```
src/
  main.tsx            React 19 entry — mounts <App/>
  App.tsx             the entire UI (~6.9k lines): data constants, ~25 components, the App shell
  index.css           Tailwind 4 layer + design tokens (surface/on-surface/primary/outline…)
  lib/
    firebase.ts       SDK init, guarded so missing env vars degrade instead of crashing
    users.ts          users collection — upsert / read / list
    leads.ts          leads + newsletter — write, one-shot read, live subscription
    properties.ts     properties collection — live subscription + CRUD
    utils.ts          cn() — clsx + tailwind-merge
public/               galleries, layouts, logos, sitemap.xml, robots.txt, manifest
scripts/
  compress_gallery.py gallery WebP compression
  capture-screenshots.mjs   the runner that produced §2
  demo-firebase/      in-memory firebase/* stand-ins used only by the demo build
```

Everything renders from one component tree in `App.tsx`. Constants at the top —
`SANCTUARIES`, the blog collection, map geometry — are plain module-level data, so
the app has no content backend to boot.

### 3.2 Rendering and navigation

`App` holds a `ViewMode` union (`home | map | list | analytics | syl | membership |
preinvestor-gold | blog`) derived from `window.location.pathname`. `handleViewChange`
pushes history state and swaps the view; a `popstate` listener keeps the back button
honest. Each view change also rewrites `<title>`, the meta description, Open Graph
tags and `<link rel="canonical">` so shared links preview correctly per route.

The scroll container is an inner `<main className="overflow-y-auto">`, not the
document — worth knowing for any tooling that assumes page-level scroll (it is why
the screenshot runner scrolls `main` explicitly instead of using full-page capture).

View transitions run through `AnimatePresence` + `motion.div`; the map, overlays and
drawers are portalled/fixed layers above the scroll container.

### 3.3 Authentication

`src/lib/firebase.ts` initialises the SDK only when `VITE_FIREBASE_API_KEY` is
present, exporting `null` otherwise and logging a warning — a missing-env deploy
renders the marketing site instead of a white screen.

Three sign-in paths, all in `AuthModal`:

- **Google** — `signInWithPopup`, falling back to `signInWithRedirect` when the popup
  is blocked (mobile). `getRedirectResult` is drained on boot to complete that round trip.
- **Email/password** — `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`,
  with error codes mapped to human sentences by `friendlyAuthError`.
- **Phone OTP** — an invisible `RecaptchaVerifier` plus `signInWithPhoneNumber`; the
  number is normalised to E.164 first (bare 10-digit input is assumed +91).

`onAuthStateChanged` restores sessions on reload. On every successful sign-in
(`handleAuthSuccess`) the app: upserts the user profile, shows the profile-capture
modal to new users, writes a `New Sign-up` lead, and — 1.5 s later — asks for
geolocation and silently stores `lat`/`lng`/`accuracy` if granted.

Admin is a client-side email comparison against `ADMIN_EMAIL` in `App.tsx`; matching
unlocks the navbar badge and the dashboard. That is a UI gate only — see §6.

### 3.4 Data model (Firestore)

| Collection | Written by | Read by |
|---|---|---|
| `users` | `upsertUserProfile` on sign-in + the profile modal | Admin → Users tab (`getAllUsers`) |
| `leads` | `saveLead` from the sign-up flow, property overlay, chatbot, map popup, cards | Admin → Leads tab (`subscribeLeads`, live) |
| `newsletter` | `saveNewsletter` from the modal, inline block and mobile quick-capture | Admin → Newsletter tab (`subscribeNewsletter`, live) |
| `properties` | Admin property editor (`createProperty` / `updateProperty` / `deleteProperty`) | The whole app via `subscribeProperties`, merged with the hardcoded `SANCTUARIES` |

Live properties from Firestore are merged with the built-in list into
`allSanctuaries`, so the portfolio can be extended from the admin panel without a
deploy, while the three flagship sanctuaries stay in code.

### 3.5 Access gating

`effectivelySubscribed = isSubscribed || !!authUser`. Newsletter subscription is
remembered in `localStorage` (`gt_subscribed`), and any signed-in user is treated as
subscribed — which is why every screenshot in §2 shows pricing and metrics unblurred.
Unsubscribed visitors get blurred member pricing and a newsletter prompt on the
gated sanctuaries.

### 3.6 Map layer

`react-leaflet` with a raster basemap plus app-drawn overlays: an AQI heat field
(`Circle` stack), the RRR corridor ring and radial connectors (`Polygon`/`Polyline`),
junction markers, and custom sanctuary markers with popups. `MapController`,
`ZoomTracker` and `MapVisibilityTracker` handle programmatic fly-to, zoom-dependent
detail and lazy invalidation when the map view becomes visible.

### 3.7 Presentation layer

Tailwind CSS 4 via `@tailwindcss/vite`, driven by semantic tokens
(`surface`, `on-surface`, `primary`, `secondary`, `outline`) declared in `index.css`.
Dark mode toggles a `dark` class on `<html>` and persists to `localStorage`
(`gt_dark`). Motion handles view transitions, drawer/modal springs and card hovers.
Icons are `lucide-react`; forms use `react-hook-form`.

### 3.8 SEO, PWA and delivery

`index.html` ships the full meta set — description, keywords, geo signals, canonical,
Open Graph, Twitter card — and the app rewrites the per-route subset on navigation.
`public/` carries `sitemap.xml`, `robots.txt` and `site.webmanifest` (standalone
display, brand theme colour). `vercel.json` adds SPA rewrites, `nosniff`,
`X-Frame-Options: SAMEORIGIN`, a referrer policy, a permissions policy that allows
only geolocation, and immutable caching for hashed assets and images.
`vite.config.ts` splits `firebase`, `leaflet` and `motion` into separate chunks.

---

## 4. Running it locally

```bash
npm install
cp .env.example .env.local     # fill in the Firebase web-app config
npm run dev                    # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Vite dev server on :3000 |
| `npm run build` / `npm run preview` | Production build / preview |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run dev:demo` | Demo build on :4173 — signed-in, no Firebase credentials (§7) |
| `npm run screenshots` | Regenerates `docs/screenshots/` against the demo build |

Required environment variables (Vercel project settings and `.env.local`):
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`, and optionally `VITE_FIREBASE_MEASUREMENT_ID`.

Firebase console prerequisites: enable Google, Email/Password and Phone providers,
add the production domain to the authorised domains list, and publish Firestore
rules covering the four collections above.

---

## 5. Deployment

Vercel builds `npm run build` and serves `dist/` with the rewrites and headers from
`vercel.json`. A deploy is complete when: the env vars are set for the target
environment, `thegreenteam.in` is in the Firebase authorised-domain list, and
`/sitemap.xml` plus `/robots.txt` resolve on the production host.

---

## 6. Observations worth acting on

Recorded here rather than changed, since this pass is documentation only.

1. **`/list` cards can't open the detail overlay.** In the `list` view the card's
   `onOpen` is a stub (`{/* PropertyDetailOverlay handles this via URL/State */}`),
   so “View Details” does nothing on that route. The overlay is reachable from the
   home cards, the map popups, the footer and the account drawer — which is how
   screenshot 07 was captured.
2. **The Agartha gallery depends on `static.wixstatic.com`.** Compressed local copies
   of the same assets already exist in `public/gallery/agartha/`; pointing the gallery
   at them would remove a third-party dependency from the highest-value view.
3. **`ADMIN_EMAIL` is a client-side constant.** It controls UI only. Anything that
   must not leak has to be enforced by Firestore security rules — the panel reads
   `users`, `leads` and `newsletter` in full.
4. **Geolocation is captured silently after sign-in** and stored per user. Worth a
   line in a privacy notice, since the admin panel surfaces coordinates and accuracy.
5. **`JOURNAL_POSTS_OLD` is dead code** — three articles defined at `src/App.tsx:265`
   and never referenced. The live index renders `JOURNAL_POSTS` (10 articles).
6. **`App.tsx` is ~6.9k lines.** Splitting the leaf components (`AdminDashboard`,
   `PropertyDetailOverlay`, `SanctuaryMapLayout`, `AuthModal`) into `src/components/`
   would make review and lazy-loading practical without changing behaviour.

---

## 7. How these screenshots were produced

Screenshots of an authenticated product normally require real credentials and real
customer data. Neither belongs in a public repository, so the capture runs against a
**demo build** that swaps the Firebase SDK for local stand-ins:

- [`vite.demo.config.ts`](../vite.demo.config.ts) aliases `firebase/app`,
  `firebase/auth`, `firebase/firestore` and `firebase/analytics` to
  [`scripts/demo-firebase/`](../scripts/demo-firebase). No application source is
  modified, and the production build never resolves these aliases.
- [`scripts/demo-firebase/auth.ts`](../scripts/demo-firebase/auth.ts) implements the
  exact auth surface `App.tsx` imports, with the signed-in identity read from
  `localStorage.gt_demo_auth` (`admin` / `member` / absent). All three sign-in paths
  — Google, email/password, phone OTP with code `123456` — complete against it.
- [`scripts/demo-firebase/firestore.ts`](../scripts/demo-firebase/firestore.ts) is an
  in-memory document store seeded with **fictional** properties, leads, newsletter
  entries and users, so the admin dashboard renders realistic structure without any
  real person's data. Every name, email and phone number in screenshots 18–22 is
  invented; the `example.in` domain is reserved for exactly this purpose.
- [`scripts/capture-screenshots.mjs`](../scripts/capture-screenshots.mjs) drives
  Playwright through the sequence in §2 at 1440×900 and 390×844, granting
  geolocation (Gachibowli) and pinning locale `en-IN` / `Asia/Kolkata`.

Two sandbox substitutions are visible in the images and are called out in their
captions: map basemap tiles are replaced with a neutral grid (the host blocks the
tile CDN), and the Agartha gallery is served from the repository's own local mirror
instead of `static.wixstatic.com`. Everything else — layout, copy, pricing logic,
gating, admin behaviour — is the real application code.

To regenerate the whole set:

```bash
npm run dev:demo        # terminal 1 — http://localhost:4173
npm run screenshots     # terminal 2 — rewrites docs/screenshots/
```

`docs/screenshots/index.json` carries the filename → caption map, so the section
above can be regenerated mechanically.
