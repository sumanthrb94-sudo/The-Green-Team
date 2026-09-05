# Hyderabad developer prospect list

`hyderabad-developers.csv` — 105 real-estate companies headquartered in Hyderabad /
Telangana, discovered via Apollo's **free** organization lookup. No credits spent.

## What is and isn't here

**Is:** company name, domain, website, a fit grade and a note.

**Isn't:** named contacts, phone numbers, email addresses. Apollo's people-search
and enrichment APIs are **not available on the Free plan** — `api/v1/mixed_people/api_search`
returns `API_INACCESSIBLE`. Company enrichment (corporate phone, revenue,
headcount) does work but costs **1 Apollo credit per company**; the account had
180 credits at the time of writing, so enriching all 105 would cost ~105.

The `contact_name` / `contact_role` / `phone` / `email` columns are left empty
deliberately — fill them from LinkedIn, the company website, or an Apollo
upgrade. Do not guess them.

## Fit grades

| Grade | Meaning | Count |
| --- | --- | --- |
| **A** | Eco / farm / plotted / wellness — closest to Agartha and Dates County | 17 |
| **B** | Mainstream residential builder — fits the SYL villament side | 81 |
| **C** | Adjacent (advisory, portal, contractor) — verify before approaching | 7 |

Start with the A list. **Organo Eco Habitats** is the closest peer to Agartha in
the city, and **Ridhira** is building wellness communities on the same thesis.

## Working it

`status` moves `new → contacted → meeting → listed → passed`. Keep it in this
file (git-tracked, survives everything) rather than in a chat window.

Anything that reaches "listed" has to clear `/standard` first — the six-part
bar in `lib/data/standard.ts`. That is the point of having written it down.

## Note on outbound

These are companies, not consumers. Cold B2B outreach to a business address is
ordinary practice, but if you later buy consumer contact data, India's DPDP Act
and the TRAI DND registry apply to calls and texts — that is a different
activity with different rules from anything in this file.
