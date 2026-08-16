# Analytics, experiments, reviews & performance

What was added in the post-launch pass, and the two env vars that have to be
set before any of the measurement actually reports.

## Turn it on

Three keys, all optional — every one of them degrades to a silent no-op when
absent, which is the correct behaviour locally and on previews.

| Env var | Where it comes from | Without it |
| --- | --- | --- |
| `NEXT_PUBLIC_GA_ID` | analytics.google.com → Admin → Data streams → measurement ID (`G-…`) | No events at all |
| `NEXT_PUBLIC_CLARITY_ID` | clarity.microsoft.com → new project → tracking-code ID. Free, no card | No heatmaps or session recordings |
| `NEXT_PUBLIC_GSC_VERIFICATION` | search.google.com/search-console → add property → HTML tag method | Nothing, if the property is verified by DNS instead |

Set them in Vercel for Production, Preview and Development.

**`NEXT_PUBLIC_GA_ID` is not the same thing as `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`.**
That Firebase value has been in the config the whole time and looks like GA4,
but `getAnalytics()` was never called anywhere, so it never sent a single
event. `lib/analytics.ts` is the real implementation and is deliberately
independent of Firebase.

## Events

`lib/analytics.ts` exposes `track.*`. Names match GA4's recommended events
where one exists, so Google's built-in reports and Ads conversion imports
understand them without custom mapping.

| Call | GA4 event | Fires when |
| --- | --- | --- |
| `track.lead(source, bracket?)` | `generate_lead` | Adviser-call form succeeds — the primary conversion |
| `track.siteVisit(source, propertyId?)` | `generate_lead` | Site-visit request |
| `track.subscribe(source)` | `sign_up` | Newsletter subscribe succeeds |
| `track.whatsapp(source)` | `contact_whatsapp` | Outbound WhatsApp tap |
| `track.viewProperty(id, name?)` | `view_item` | Sanctuary page viewed |
| `track.brochure(id)` | `file_download` | Brochure/layout download |
| `track.review(rating, id?)` | `submit_review` | Review submitted |
| `track.experiment(id, variant)` | `experiment_impression` | An A/B variant rendered |

Conversions fire **after the write succeeds**, never on click — a conversion
counted on click is inflated by every failed submit.

`markConverted(kind)` tags the Clarity session so you can filter recordings to
the sessions that converted. That is the point of a heatmap tool: watching the
sessions that converted and the ones that nearly did, not the average of all.

### Mark these as conversions in GA4

GA4 does not treat them as conversions automatically. Admin → Events → toggle
"Mark as key event" on `generate_lead` and `sign_up`. Without that step the
data arrives but no conversion reporting exists.

## A/B testing

No third-party script. Variant is assigned server-side from a cookie set in
`middleware.ts` and rendered into the HTML, so there is no flash of the control
variant and no layout shift — the usual failure of client-side A/B tools is
that they damage the page they are meant to improve.

Live experiment — `adviser_cta` in `lib/experiments.ts`: does naming the
outcome ("Get Pricing & Availability") beat naming the mechanic ("Request
Adviser Call")? Hypothesis is that pricing is what every visitor arrived for
and the thing the site deliberately never publishes.

It runs on `/adviser-call` only, **not** the home page. Reading the bucketing
cookie forces dynamic rendering, and the home page is on ISR (`revalidate =
300`); trading everyone's TTFB for a CTA test would cost more than the test can
win. `/adviser-call` is the dedicated conversion destination and where paid
traffic should land, so it is the right place to measure.

To read results: GA4 → Explore → free-form, breakdown by the `variant_id`
parameter from `experiment_impression`, measured against `generate_lead`.

Adding one: add to `EXPERIMENTS`, read with `getVariant()` in a server
component, render `<ExperimentImpression>` so GA4 can segment by it.

## Reviews

Submissions at `/reviews` → `reviews` collection with `status: 'pending'`.
Nothing is public until approved in **Admin → Reviews**. Unmoderated review
widgets on property sites are spam magnets, and a published review carries
legal weight an anonymous form post does not.

`aggregateRating` JSON-LD appears on a sanctuary page **only when real approved
reviews exist**. Emitting an aggregateRating with nothing behind it is exactly
the structured-data abuse Google issues manual actions for, so no reviews means
no rating markup — not a fabricated one.

There are no seeded testimonials. Share `/reviews` with buyers right after a
site visit, which is the one moment they are willing to write something.

## Performance

`npm run speed` measures transferred bytes and LCP on a mobile viewport with
~4G throttling, against a running server. Exits non-zero over budget, so it can
gate a deploy.

```
npm run build && npm start
npm run speed                        # or: npm run speed -- https://thegreenteam.in
```

Budgets: total ≤ 2500KB, images ≤ 1800KB, LCP ≤ 2500ms.

### Images

`npm run optimize:images` reports; `npm run optimize:images:write` applies.
Two things happen: every file under `public/` is recompressed in place (paths
unchanged, so no reference breaks), and responsive variants are generated
beside it at 400/800/1200px, listed in `lib/image-manifest.json`.

The platform image optimizer is unavailable on this plan — it returned 402 —
so `next.config.ts` previously set `images: { unoptimized: true }`. That meant
no `srcset` either, and a **1600px render was being downloaded into a 224px
card on mobile**. It now uses a custom loader (`lib/image-loader.ts`) that
picks from the pre-generated variants, giving real responsive images with no
runtime optimizer involved.

Measured on the home page, mobile, throttled:

| | page weight | images | LCP |
| --- | --- | --- | --- |
| Before | 2680 KB | 2434 KB | 2712 ms |
| After | 1143 KB | 897 KB | 1644 ms |

Source files in `public/` went 41.5 MB → 12.6 MB.

**Run `npm run optimize:images:write` after adding any image.** A new file
without variants still works — the loader passes anything missing from the
manifest straight through — but it ships at full size to every device.

## Map tiles

`components/map/SanctuaryMap.tsx` is Leaflet, with four base layers. All free,
all correctly attributed, none requiring an API key or a billing account.

| Layer | Source | Licence | Native max zoom |
| --- | --- | --- | --- |
| Dark | CARTO dark_all | OSM contributors © CARTO | 20 |
| Satellite | Esri World Imagery | © Esri, Maxar, Earthstar Geographics | 19 |
| Terrain | OpenTopoMap | CC-BY-SA, OSM + SRTM | 17 |
| Light | CARTO Voyager | OSM contributors © CARTO | 20 |

The satellite layer previously pointed at `mt1.google.com/vt/lyrs=s`, which is
**Google's undocumented internal tile server, not a public API**. Scraping it
breaks the Maps terms of service and can be cut off without warning; the
`© Google Maps` attribution string did not make it licensed. It is now Esri
World Imagery — free with attribution, and the standard satellite basemap in
the Leaflet ecosystem.

Terrain was added because for a brand selling forest-adjacent land, canopy and
elevation say more than a road map does.

`maxNativeZoom` is set per layer because each provider stops at a different
level. Without it Leaflet requests tiles that do not exist and the map goes
blank when a visitor zooms past the provider's limit; with it, Leaflet upscales
the last real tile instead.

Leaflet's attribution control is left enabled deliberately — Esri and
OpenTopoMap both require visible attribution.

The admin Users tab links out to OpenStreetMap rather than Google Maps.

**Not verifiable from the build sandbox:** its proxy blocks every tile host,
including the CARTO ones already live in production. Layer switching, request
URLs and hosts were verified in a headless browser (correct hosts requested, no
call to any Google endpoint), but the imagery itself has to be eyeballed on a
real deploy.
