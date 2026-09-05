# The portal structure, and email

Two things added in the same pass: the site became browsable by category and
delivery stage, and every email it collects now lands in Resend so campaigns
can go out.

## Portal — categories and stages

**The positioning did not change.** `/standard` still says "a portal lists
everything and lets you sort it out; we do the opposite", and that stays true.
Categories are how a buyer who already knows what they want reaches it in one
click — not a promise of volume. A category holding three superb things reads
as selective. Thirty mediocre things would read as 99acres.

| Route | What it is |
| --- | --- |
| `/list` | The hub. Category cards, then every property with a stage filter. |
| `/explore/villas` | Villas & Villaments |
| `/explore/plots` | Plots & Farmland |
| `/explore/investments` | Investment Opportunities — appreciation *history*, never promised returns |

Each category page carries its own title, meta description, canonical, and a
`CollectionPage` + `ItemList` JSON-LD, so they rank for "villas near hyderabad"
and "farm plots hyderabad" on their own.

### The three fields on every property

Defined in `lib/data/categories.ts`, editable in Admin → Properties:

| Field | Values | Meaning |
| --- | --- | --- |
| `category` | `villas` · `plots` | Primary asset class. One per property. |
| `stage` | `ongoing` · `completed` · `upcoming` | Where delivery stands. Drives the stage filter. |
| `investment` | `true` / `false` | Whether it also appears under Investments. A villa can be both. |

**Empty stages are shown, not hidden.** Every listed property is ongoing today,
so the Completed tab has nothing in it. A tab that silently disappeared would
imply completed stock we are choosing not to show; "nothing here clears the
bar yet" with a link to `/standard` is the honest version.

### The live site reads Firestore, not the code

`getPortfolio()` replaces the in-code entry with the Firestore document
wholesale. Tagging `lib/data/sanctuaries.ts` alone changes nothing live — the
browse pages would filter on fields the documents lack and every category
would look empty. `scripts/tag-portal-fields.ts` copies exactly the three
fields onto the live documents and touches nothing else:

    npx tsx --env-file=.env.local scripts/tag-portal-fields.ts          # dry run
    npx tsx --env-file=.env.local scripts/tag-portal-fields.ts --write

New properties added in the admin carry the fields from the form, so this is
only needed for properties that predate them.

Groot knows the structure too (`portalChunks` in `lib/rag/corpus.ts`) — run
`npm run kb:index` after changing categories or tags.

## Email — Resend

### What was created (2026-09-05, via the Resend connector)

| Thing | Value |
| --- | --- |
| Domain | `thegreenteam.in` — region `ap-northeast-1`, **not yet verified** |
| Segment · Newsletter | `33fabb78-210b-4449-8b3c-294287839791` |
| Segment · Members | `bb04dfb8-e608-4401-a957-ac0ef02be9d2` |
| API key | `thegreenteam.in website`, sending access. In `.env.local`; add to Vercel. |

### DNS records — required before anything sends

Add these at the DNS provider for `thegreenteam.in`. Until they resolve, the
domain stays `not_started` and every send is refused.

| Type | Name | Value | Priority |
| --- | --- | --- | --- |
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC5T36eQxUpCGjHIqLGKaJUreQ0AgKTftQrp2AghSr/6aekX/gG6pRZIKrPknTAoDbEgReaYzzmqp5bc/5f5Cbv+taAIu9+FFJiuvyRWD67toZLK6VLTQMIZTFnEoVi+hFr0TRSlAv13D2YVgy9v1q2hMYRwra4cI9cRdY5ayLN6QIDAQAB` | — |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |

Then verify in the Resend dashboard (or via the connector's `verify-domain`).

### Env vars — all three, in Vercel for Production and Preview

    RESEND_API_KEY
    RESEND_SEGMENT_NEWSLETTER
    RESEND_SEGMENT_MEMBERS

Without the key every sync is a silent no-op — the correct behaviour on
previews, where test sign-ups must not pollute the real list.

### What syncs where

| Event | Firestore (source of truth) | Resend (mirror) |
| --- | --- | --- |
| Newsletter tick | `newsletter` | contact → **Newsletter** segment, `source` property |
| Google sign-in / profile save | `users/{uid}` | contact → **Members** segment, with name, phone, city, occupation |

Sync is fire-and-forget (`lib/server/resend.ts`): a subscribe or sign-in must
succeed even if Resend is down. Errors go to Vercel logs, never to the visitor.
Addresses ending `.test` or containing `example.` are dropped so the QA suites
never reach the real list.

**Phone numbers.** Google sign-in yields an email, not a phone. The
post-sign-in profile card now asks for one (optional, loosely validated — the
adviser confirms it on the call). It is stored on the user document and sent to
Resend as a contact property.

### The sync could not be exercised from the build sandbox

`api.resend.com` is egress-blocked here. The helper tries the account-level
`/contacts` endpoint and falls back to the per-audience shape on a 4xx, so it
works on either API version without a redeploy — but the first real sign-in on
production is the real test. Check Vercel logs for `[resend]` after deploy.

### Sending a newsletter

Admin → Newsletter composes and sends via `app/api/admin/newsletter/send/route.ts`
(batched, from `dispatch@thegreenteam.in`). `test: true` sends only to the
signed-in admin — proof an issue before the real send. This needs the domain
verified first.
