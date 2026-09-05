/**
 * Objection-handling and process knowledge an adviser carries in their head.
 * None of it is derivable from the property, map or journal data, so without
 * this file the retriever has nothing to return when the question is about
 * buying rather than about a place.
 *
 * Figures appear only where sanctuaries.ts or contact.ts can source them.
 * Anything rate-, date- or slab-dependent defers to the adviser by design —
 * a wrong number here becomes a wrong number in the buyer's mouth.
 */

export const SALES_FAQ: Array<{ q: string; a: string; tags?: string[] }> = [
  {
    q: 'What is a channel partner, and what does The Green Team actually do?',
    a: 'The Green Team is an independent channel partner and curation house — not the developer, and not a listing portal. We shortlist projects against a fixed standard (verified environment, real access, a developer who can deliver), then introduce you directly to the developer team. You buy from the developer on the developer paperwork; we stay on your side of the table through the process.',
    tags: ['channel-partner', 'about'],
  },
  {
    q: 'Why do you only list three projects?',
    a: 'Because only three cleared the standard. We measure every project against six things before it goes on the site: a real environmental advantage (AQI 30 or under and 30 dB or under, measured on site, against a Hyderabad average near 148), title and approvals that survive a lawyer, an approach road that already exists and that we have driven, a developer with at least one delivered project you can walk through, design that keeps the green it is selling, and numbers we are willing to be quoted on. We also refuse assured-return and guaranteed-buyback schemes outright, and anything we have not physically stood on. The full standard, including what we turn down, is published at /standard.',
    tags: ['standard', 'curation', 'trust', 'about'],
  },
  {
    q: 'Which areas do you cover?',
    a: 'Hyderabad and its ORR–RRR growth corridor, and nowhere else for now. Every claim we publish — air quality, ambient noise, drive times, the condition of the access road — is something we can go and re-check in an afternoon, and that is only true in a region we can drive to. We would rather cover one city honestly than list a country we have never stood in. If you are looking outside Hyderabad we will tell you we are the wrong people rather than take the enquiry.',
    tags: ['coverage', 'location', 'hyderabad', 'about'],
  },
  {
    q: 'I am a developer or landowner — how do I get a project listed?',
    a: 'Send it to us on WhatsApp or through the adviser-call form and we will assess it against the same six-part standard we apply to everything else: environment, legal, access, developer track record, design, and honest numbers. We will tell you plainly which of the six it fails and whether that is fixable. We only take on projects in Hyderabad and its corridor at the moment, and we do not list assured-return or guaranteed-buyback structures in any form.',
    tags: ['developer', 'listing', 'partnership', 'standard'],
  },
  {
    q: 'Does buying through you cost more than going to the developer directly?',
    a: 'No. The developer pays the channel partner, so the price you pay is the developer price and it does not change because we introduced you. In practice a channel partner usually gets better terms, because we negotiate across many buyers instead of one. At MODCON Agartha, better pricing than the listed rate of ₹8,500 per sq yd is available on an in-person visit and we negotiate that on your behalf.',
    tags: ['channel-partner', 'pricing', 'objection'],
  },
  {
    q: 'Are these projects RERA registered?',
    a: 'Dates County by Planet Green is registered under RERA P02400002648 and P02400003813 — both numbers are printed on the project page and you can verify them yourself on the Telangana RERA portal. For MODCON Agartha and MODCON SYL Residences your adviser confirms the current registration and approval status in writing before you pay anything. We do not quote a registration number we cannot show you the certificate for.',
    tags: ['rera', 'legal', 'due-diligence'],
  },
  {
    q: 'How do I check title and approvals before booking?',
    a: 'Ask for the title deed chain, the encumbrance certificate, and the approved layout or sanction plan — all three handed over, not described. Every project we introduce provides a document set your own lawyer can review, and we recommend you use your own lawyer rather than the developer panel. If a document cannot be produced, that is your answer.',
    tags: ['legal', 'due-diligence', 'title'],
  },
  {
    q: 'What does registration cost in Telangana, and how does the process work?',
    a: 'Registration in Telangana is charged as a percentage of the higher of your sale value or the government market value, paid as stamp duty plus transfer duty and registration fee at the Sub-Registrar office. The percentages move with state notifications, so your adviser confirms the exact figure applicable to your plot or unit on the call and puts it in writing before you book. Registration is over and above the property price — budget for it separately.',
    tags: ['registration', 'telangana', 'costs'],
  },
  {
    q: 'What is not included in the quoted price?',
    a: 'Quoted rates — ₹8,500 per sq yd at MODCON Agartha, ₹6,999 per SFT at MODCON SYL Residences, ₹18,000 per sq yd at Dates County — are the property price only. Stamp duty and registration, GST where it applies, any corpus or maintenance deposit, and optional add-ons such as a built home on your plot are all extra. Your adviser gives you the all-in number for the specific unit before you commit to anything.',
    tags: ['pricing', 'costs'],
  },
  {
    q: 'Can I get a home loan on a plot?',
    a: 'Plot loans exist but they are not home loans: lenders typically fund a smaller share of the value, over a shorter tenure, and only on approved layouts. Farmland and agricultural land are financed differently or not at all, which is why most buyers fund a farm estate like MODCON Agartha from capital rather than debt. Tell your adviser how you intend to fund the purchase and they will tell you which lenders are actually active on that project.',
    tags: ['finance', 'home-loan', 'plots'],
  },
  {
    q: 'Can I get a home loan on the SYL villaments?',
    a: 'A built residential unit like a MODCON SYL Residences villament is standard home-loan territory, and construction-linked disbursement is the normal route. Which banks sit on the approved-project panel changes as the project progresses, so your adviser confirms the current list on the call. We do not arrange the loan for you, but we do put you in front of the developer finance desk.',
    tags: ['finance', 'home-loan', 'syl'],
  },
  {
    q: 'Can an NRI buy these properties?',
    a: 'An NRI or person of Indian origin can buy residential and commercial property in India under the RBI general permission, funded through NRE or NRO accounts or normal banking channels. Agricultural land, plantation property and farmhouses are outside that general permission, which matters for a farm estate like MODCON Agartha. Tell your adviser your residency status early — it decides which of the three sanctuaries are genuinely open to you.',
    tags: ['nri', 'legal', 'eligibility'],
  },
  {
    q: 'Can I complete the purchase without being in Hyderabad?',
    a: 'Yes. Document review, unit selection and payment all happen remotely, and a registered power of attorney lets someone you trust sign and register on your behalf. Registration itself needs presence — yours, or your POA holder. Your adviser sequences it so nothing in the deal depends on a trip you cannot make.',
    tags: ['nri', 'process', 'registration'],
  },
  {
    q: 'What does "pre-investor phase" mean?',
    a: 'Pre-investor is the earliest and lowest-priced window a project opens, before the published rate. MODCON SYL Residences carries a standard rate of ₹6,999 per SFT, and the pre-investor window sits below that for a limited number of units. Early bookings de-risk the project for the developer, and early buyers are paid for that in price and in first pick of units, floors and views. When booking targets are met the rate moves to pre-launch, and later again to market rate — ask your adviser for the current pre-investor rate and how many units are left in it.',
    tags: ['pre-investor', 'pricing', 'syl'],
  },
  {
    q: 'Why does the price keep rising? Is that just a sales tactic?',
    a: 'It is a schedule the developer sets in advance, and there is a record of it running. MODCON Agartha opened at a VIP pre-launch rate of ₹6,199 per sq yd and stands at ₹8,500 per sq yd today — the same ladder, one full cycle later. Ask your adviser what the next step on the ladder is and when it takes effect; if nobody can tell you that, the urgency is not real.',
    tags: ['pricing', 'objection', 'pre-investor'],
  },
  {
    q: 'What is the smallest amount I can enter with?',
    a: 'MODCON Agartha starts from ₹78 L for the smallest plot at 726 sq yds, the entry point under ₹1 Cr across the portfolio. The Dates County signature plot is 500 sq yds at ₹18,000 per sq yd, or ₹90 L, and SYL villaments begin at 3,882 SFT at ₹6,999 per SFT. Our enquiry form starts at the ₹50 L – ₹1 Cr bracket, so tell us your bracket and we will only put things in front of you that fit it.',
    tags: ['pricing', 'ticket-size', 'entry'],
  },
  {
    q: 'How does the payment schedule work?',
    a: 'A booking amount confirms the unit, an agreement follows, and the balance is paid either against construction milestones for a built unit or on a fixed timeline for a plot. The exact split, the dates and any early-payment benefit vary by project and by phase, so your adviser confirms the current schedule on the call and sends it to you in writing. Never pay against a verbal schedule.',
    tags: ['payment', 'process'],
  },
  {
    q: 'When is possession, and how long does construction take?',
    a: 'Plots at MODCON Agartha and Dates County are handed over developed, so what matters there is the amenity and infrastructure completion date rather than a building. MODCON SYL Residences is under development and possession is tied to the construction schedule written into your agreement. Ask for the committed date in writing — that date belongs in the agreement, not in a conversation.',
    tags: ['possession', 'timeline', 'construction'],
  },
  {
    q: 'What do the amenities include, and what will I pay to maintain them?',
    a: 'MODCON Agartha gives two of its twenty-five acres to a resort and clubhouse — earthen retreats, a farm-to-table restaurant, a yoga and wellness centre, a Tulum-style gym, a banquet hall, and a natural bio-pool filtered biologically rather than chemically — and every plot arrives with an edible permaculture backyard, a food forest of fruit, vegetables and herbs. MODCON SYL Residences has a 22,000 SFT clubhouse built around a chemical-free natural bio pool and a yoga pavilion, and Dates County holds 40% of its 300+ acres as open and recreational space. Maintenance is billed separately by the developer or the owners association; your adviser gives you the current rate and exactly what it covers.',
    tags: ['amenities', 'maintenance'],
  },
  {
    q: 'Who looks after a farm plot if I am not living there?',
    a: 'MODCON Agartha is built for exactly that: plots come pre-planted and drip-irrigated, and the estate runs a Goshala with integrated animal husbandry as part of a working farm, so the land is managed rather than left idle. That is a service with terms and a cost, both set by the developer. Confirm the maintenance arrangement and its rate before you book — it is the single thing farmland buyers most often forget to ask.',
    tags: ['maintenance', 'agartha', 'farmland'],
  },
  {
    q: 'What is the resale and rental potential?',
    a: 'Resale rests on the same things that made the purchase sensible in the first place: corridor, access, scarcity, and how the place feels to be in. Agartha moving from ₹6,199 to ₹8,500 per sq yd tells you a real secondary market exists for this kind of asset. Rental income is realistic for a built unit like a SYL villament and for staycation use at Agartha; raw land does not produce rent, and anyone telling you otherwise is selling.',
    tags: ['resale', 'rental', 'returns'],
  },
  {
    q: 'Are the returns guaranteed?',
    a: 'No, and we will not put a number on a future you cannot verify. What we will show you is the rate history — ₹6,199 to ₹8,500 per sq yd at Agartha — and the reasons behind it: RRR proximity, a forest boundary that cannot be manufactured, and a developer that delivered. Judge the thesis, not a projection.',
    tags: ['returns', 'objection', 'ethics'],
  },
  {
    q: 'How do you verify AQI, noise and commute?',
    a: 'We take readings at the site rather than quoting a city average, and at different times of day, because a location that is quiet at 11am can be unusable at 7pm. That is where the published figures come from: AQI 12 and 18 dB at MODCON Agartha, AQI 22 and 24 dB at MODCON SYL Residences, AQI 18 and 22 dB at Dates County. Commute is driven, not calculated — 40 minutes from Agartha to the Financial District, 10 minutes from SYL to the airport, 15 minutes from Dates County to both the airport and ORR Exit-14.',
    tags: ['aqi', 'noise', 'commute', 'verification'],
  },
  {
    q: 'What kind of home can I actually build on an Agartha plot?',
    a: 'MODCON builds two house types to order, both in natural materials. The Bamora Retreat is a bamboo structure with a mezzanine floor, finished in natural mud plaster — light, thermally comfortable, and the more open of the two. The Earthlyn Retreat is built in CSCB brick and finished in traditional lime plaster, which holds temperature better and reads more solid. Both come as 1, 2 or 3 BHK, and both are designed to sit inside an edible permaculture backyard rather than a lawn. Your adviser can walk you through which type suits the plot you are looking at.',
    tags: ['agartha', 'construction', 'homes'],
  },
  {
    q: 'What is at the Agartha clubhouse, and how much land is it on?',
    a: 'Two of the twenty-five acres are given to the resort and clubhouse. It holds earthen retreats, a farm-to-table restaurant, a yoga and wellness centre, a Tulum-style gym built in wood and stone, and a banquet hall. The pool is a natural bio-pool, cleaned by biological filtration instead of chlorine, and a hand-built natural stream runs through the landscape for the sound of moving water. It is a resort you have access to rather than a clubhouse block.',
    tags: ['agartha', 'amenities'],
  },
  {
    q: 'What sizes and prices are the SYL villaments, and what is the commercial component?',
    a: 'MODCON SYL Residences is the residential half of a 4.5-acre integrated project at Tukkuguda. The issued site plan shows 15 villaments across Block A and Block B, either side of a central park, from 3,882 to 7,000 SFT, at ₹6,999 per SFT. The commercial block sits to the west: retail, cafés and banking at ground level, co-working on the first floor, clinics and diagnostics on the second, and business suites with a hospitality stay concept above — aimed at airport and corporate visitors. Commercial pricing is quoted on enquiry rather than published.',
    tags: ['syl', 'pricing', 'commercial'],
  },
  {
    q: 'How do the three sanctuaries differ, and which one suits me?',
    a: 'MODCON Agartha is a 25-acre farmhouse community on the Narsapur forest boundary — 37 plots from 726 sq yds to a full acre, for someone who wants land, a working permaculture farm and the cleanest air of the three. MODCON SYL Residences at Tukkuguda is built living: villaments from 2,500 to 4,500 SFT, ten minutes from the airport, for someone who wants a ready home inside the Fourth City corridor. Dates County at Kandukur is 300+ acres of villa plots beside a 4,000-acre reserve forest — land you can build on later, inside a large planned township.',
    tags: ['comparison', 'portfolio', 'fit'],
  },
  {
    q: 'Which of them will appreciate fastest?',
    a: 'That question has no honest answer in advance, and the three are not running on the same clock. Agartha is a scarcity play on a forest boundary near the RRR, SYL is an early-phase play in the Tukkuguda growth corridor, and Dates County is a scale play on the Srisailam Highway axis. Match the asset to your holding horizon first, then talk about price.',
    tags: ['comparison', 'returns', 'objection'],
  },
  {
    q: 'How does a site visit work?',
    a: 'Tell your adviser which sanctuary and roughly when, and we coordinate the slot with the developer site team. Agartha and Dates County are proper site visits — allow a half day including travel from the city; SYL is usually seen at the office first and then on site. Going in person matters commercially as well as emotionally, because better pricing is available on in-person visits. Message +91 97001 44003 on WhatsApp or write to admin@thegreenteam.in to fix a slot.',
    tags: ['site-visit', 'process', 'contact'],
  },
  {
    q: 'What happens after I request an adviser call?',
    a: 'We call the number you give us and start with what you are actually solving for — end use, holding horizon, budget bracket — then shortlist from there rather than pitching all three. You get pricing, document status and the current phase in writing, and a site visit if the shortlist holds up. If nothing in the portfolio fits you we will say so; we would rather lose a booking than place you badly.',
    tags: ['adviser', 'process', 'next-steps'],
  },
];
