# TG-RERA agent registration

This unblocks `reraAgentRegNo` in `lib/data/legal.ts`. Until it is filled, every
legal page on the site renders an "unfinished" notice and the footer prints
`[TO BE COMPLETED]` where an agent's registration number is legally required.

**Not legal advice.** The official portal is unreachable from the build sandbox,
so the details below come from secondary sources and must be confirmed against
rera.telangana.gov.in before you pay anything. Fees and forms change.

---

## Why this is urgent

RERA 2016 **s.9(1)** requires a real-estate agent to register before facilitating
the sale or purchase of a unit in a registered project. **s.62** sets the penalty
for operating without it: **₹10,000 for every day the default continues, up to 5%
of the cost of the plot or apartment whose sale was facilitated.**

The exposure is per transaction facilitated, not per year — so it grows with
success, not with time.

---

## Decision to make first: who registers

The fee and the paperwork both follow from this, and it must be the **same entity
that actually contracts and takes the brokerage** — which is also the
`entityName` the legal pages name as the Data Fiduciary.

| Registering as | Fee (5 years) |
| --- | --- |
| An individual | ₹10,000 |
| A company, partnership firm, LLP or society | ₹50,000 |

Registering an individual and then invoicing through a company is the common
mistake: the registration then does not cover the entity doing the business.

---

## Documents to assemble

For the applicant (individual or entity):

- [ ] PAN card
- [ ] Aadhaar (individual) — and of each director/partner for an entity
- [ ] Passport-size photograph of the applicant / each director or partner
- [ ] Proof of the registered office address
- [ ] Certificate of incorporation / partnership deed / LLP agreement — entities only
- [ ] Memorandum and articles of association, or the firm's bye-laws — entities only
- [ ] GST registration certificate, if registered
- [ ] Details of any RERA registration held in another state
- [ ] Particulars of any criminal case pending against the applicant, if any
- [ ] Business letterhead and rubber stamp specimen
- [ ] Email address and mobile number that will receive the portal's OTPs — use
      an address the business controls, not a personal one, because renewals and
      notices come to it for five years

---

## The process

1. **rera.telangana.gov.in** → *Services* → *Real Estate Agent Registration*.
2. *New Registration* → user type **Real Estate Agent** → fill the mandatory
   fields → CAPTCHA → submit. This creates the login, it is not the application.
3. Activate the account from the verification email.
4. Sign in and complete the agent application (**Form G** under the Telangana
   Real Estate (Regulation and Development) Rules, 2017), attaching the documents
   above.
5. Pay the fee online.
6. The Authority examines the application. **Allow about 30 days.** Respond
   quickly to any query raised — the clock restarts on each one.
7. On approval the Authority issues the registration certificate (**Form H**),
   carrying the registration number. **Valid five years**, renewable.

---

## The moment you have the number

One line in `lib/data/legal.ts`:

```ts
reraAgentRegNo: 'A0240000XXXX',   // replace TBD
```

The footer, the Terms page and the unfinished-document notice all read from
there, so nothing else needs touching. Fill the other `TBD` values in the same
object while you are there — entity name, CIN, GSTIN, registered address, and
the two named officers.

---

## Separate, and check it before the above

**s.9(1) also forbids an agent from facilitating a transaction in a project that
is not itself registered under s.3.** Right now this site shows a RERA number for
one of three projects:

| Project | RERA number shown |
| --- | --- |
| Dates County | `P02400002648 · P02400003813` |
| MODCON Agartha | none |
| MODCON SYL Residences | none |

If Agartha and SYL **are** registered, get the numbers from the developers and
put them in the `rera` field on each property — the property page already renders
a verified badge when it is present, and it is the strongest trust signal on the
page. If either is **not** registered, advertising and facilitating it is the
s.62 exposure above, independent of whether the agent is registered.

Ask MODCON for both numbers before doing anything else on this page.
