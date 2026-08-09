# MODCON Builders — Telugu Cold Call Script (TTS Voice Test)

**Purpose:** source text for text-to-speech voice testing (ElevenLabs / Google / Azure / Sarvam).
**Caller persona:** The Green Team — authorised channel partner for MODCON Builders.
**Dialect:** Telangana / Hyderabad spoken Telugu, natural code-mixed with English real-estate terms.
**Target read length:** 45–60 seconds for the core pitch (Blocks 1–6), objections read separately.

Two variants are provided for every line:

- **A — Code-mixed (recommended):** English brand/technical words left in Latin script. Use with multilingual TTS voices (ElevenLabs Multilingual v2, Azure `te-IN`, Sarvam). This is what a real agent actually says.
- **B — Telugu-only script:** everything transliterated into Telugu script. Use when the engine is Telugu-only and mangles Latin words, or when testing pure `te-IN` phoneme coverage.

Roman transliteration is given under each line as a pronunciation reference for QA reviewers who don't read Telugu script.

---

## Block 0 — Voice-test warm-up (10 sec)

Read this first on every new voice. It exercises the sounds Telugu TTS most often breaks on: retroflex ళ/ణ, aspirates ఖ/ఘ/ధ, the ఱ-cluster, long vowels, and a rupee figure.

> నమస్కారం. నేను ద గ్రీన్ టీమ్ నుంచి మాట్లాడుతున్నాను. మీ ఇంటి కల నిజం చేయడానికి, హైదరాబాద్ దగ్గర ఒక అందమైన అడవి అంచున, ఇరవై ఐదు ఎకరాల ఫార్మ్ ఎస్టేట్ — ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల నుంచి.

*namaskāram. nēnu The Green Team nunchi māṭlāḍutunnānu. mī iṇṭi kala nijam chēyaḍāniki, Hyderabad daggara oka andamaina aḍavi anchuna, iravai aidu ekarāla farm estate — dhara aravai enimidi lakṣala ḍebbai vēla nunchi.*

---

## Block 1 — Opening + permission (0:00–0:08)

**A (code-mixed)**
> నమస్కారం సర్. నేను ప్రియ మాట్లాడుతున్నాను, ద గ్రీన్ టీమ్ నుంచి — MODCON Builders వాళ్ళ authorised channel partner. మీకు ఒక్క నిమిషం టైం ఉందా సర్?

**B (Telugu-only)**
> నమస్కారం సర్. నేను ప్రియ మాట్లాడుతున్నాను, ద గ్రీన్ టీమ్ నుంచి — మోడ్‌కాన్ బిల్డర్స్ వాళ్ళ ఆథరైజ్డ్ ఛానెల్ పార్టనర్. మీకు ఒక్క నిమిషం టైం ఉందా సర్?

*namaskāram sar. nēnu Priya māṭlāḍutunnānu, The Green Team nunchi — MODCON Builders vāḷḷa authorised channel partner. mīku okka nimiṣam ṭaim undā sar?*

> **Pause 0.6 s and wait.** Never continue over the prospect. For female prospects swap సర్ → మేడమ్ (`sar` → `mēḍam`).

---

## Block 2 — Reason for the call / hook (0:08–0:20)

**A**
> థాంక్యూ సర్. హైదరాబాద్ కి నలభై నిమిషాల దూరంలో, నార్సాపూర్ forest boundary లో — MODCON Agartha అని ఇరవై ఐదు ఎకరాల permaculture farm estate ఉంది. మొత్తం ముప్పై ఆరు plots మాత్రమే సర్, అందుకే ముందుగా మా members కి మాత్రమే చెప్తున్నాం.

**B**
> థాంక్యూ సర్. హైదరాబాద్ కి నలభై నిమిషాల దూరంలో, నార్సాపూర్ ఫారెస్ట్ బౌండరీ లో — మోడ్‌కాన్ అగర్తా అని ఇరవై ఐదు ఎకరాల పర్మాకల్చర్ ఫార్మ్ ఎస్టేట్ ఉంది. మొత్తం ముప్పై ఆరు ప్లాట్లే సర్, అందుకే ముందుగా మా మెంబర్స్ కి మాత్రమే చెప్తున్నాం.

*thānkyū sar. Hyderabad ki nalabhai nimiṣāla dūramlō, Narsapur forest boundary lō — MODCON Agartha ani iravai aidu ekarāla permaculture farm estate undi. mottam muppai āru plots mātramē sar, andukē mundugā mā members ki mātramē cheptunnām.*

---

## Block 3 — Qualifying question (0:20–0:26)

**A**
> ఒక్క విషయం అడగనా సర్ — మీరు investment కోసం చూస్తున్నారా, లేక weekend home లా family తో వాడుకోవడానికా?

**B**
> ఒక్క విషయం అడగనా సర్ — మీరు ఇన్వెస్ట్‌మెంట్ కోసం చూస్తున్నారా, లేక వీకెండ్ హోమ్ లా ఫ్యామిలీ తో వాడుకోవడానికా?

*okka viṣayam aḍaganā sar — mīru investment kōsam chūstunnārā, lēka weekend home lā family tō vāḍukōvaḍānikā?*

> **Pause 1.2 s.** This is the longest silence in the script — good stress test for engines that clip trailing audio.

---

## Block 4 — Value pitch (0:26–0:42)

**A**
> చాలా బాగుంది సర్. అక్కడ ప్రతి plot లోనూ వంద కి పైగా రకాల చెట్లు ముందే నాటి ఉంటాయి, drip irrigation వేసి ఉంటుంది, కూరగాయల beds, ఒక spiral herbal garden కూడా. మధ్యలో ముప్పై ఆరు వేల చదరపు అడుగుల clubhouse — swimming pool, kayaking lake, gym, farm-to-table dining, ఇంకా staycation villas. పక్కనే గోశాల కూడా ఉంది సర్.

**B**
> చాలా బాగుంది సర్. అక్కడ ప్రతి ప్లాట్ లోనూ వంద కి పైగా రకాల చెట్లు ముందే నాటి ఉంటాయి, డ్రిప్ ఇరిగేషన్ వేసి ఉంటుంది, కూరగాయల బెడ్స్, ఒక స్పైరల్ హెర్బల్ గార్డెన్ కూడా. మధ్యలో ముప్పై ఆరు వేల చదరపు అడుగుల క్లబ్‌హౌస్ — స్విమ్మింగ్ పూల్, కయాకింగ్ లేక్, జిమ్, ఫార్మ్-టు-టేబుల్ డైనింగ్, ఇంకా స్టేకేషన్ విల్లాలు. పక్కనే గోశాల కూడా ఉంది సర్.

*chālā bāgundi sar. akkaḍa prati plot lōnū vanda ki paigā rakāla cheṭlu mundē nāṭi uṇṭāyi, drip irrigation vēsi uṇṭundi, kūragāyala beds, oka spiral herbal garden kūḍā. madhyalō muppai āru vēla chadarapu aḍugula clubhouse — swimming pool, kayaking lake, gym, farm-to-table dining, inkā staycation villas. pakkanē gōśāla kūḍā undi sar.*

---

## Block 5 — Proof points + price (0:42–0:56)

**A**
> Air quality అక్కడ A.Q.I. పన్నెండు మాత్రమే సర్ — సిటీలో వంద నుంచి నూట ఎనభై ఉంటుంది. Financial District నుంచి R.R.R. మీదుగా నలభై నిమిషాలు. రెండు వేల ఇరవై నాలుగు లో "Best Sustainable Eco-Friendly Project of the Year" అవార్డ్ కూడా వచ్చింది ఈ project కి. Plots ఎనిమిది వందల ఎనిమిది చదరపు గజాల నుంచి, ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల నుంచి మొదలు సర్.

**B**
> ఎయిర్ క్వాలిటీ అక్కడ ఏ. క్యూ. ఐ. పన్నెండు మాత్రమే సర్ — సిటీలో వంద నుంచి నూట ఎనభై ఉంటుంది. ఫైనాన్షియల్ డిస్ట్రిక్ట్ నుంచి ఆర్. ఆర్. ఆర్. మీదుగా నలభై నిమిషాలు. రెండు వేల ఇరవై నాలుగు లో "బెస్ట్ సస్టైనబుల్ ఎకో-ఫ్రెండ్లీ ప్రాజెక్ట్ ఆఫ్ ద ఇయర్" అవార్డ్ కూడా వచ్చింది ఈ ప్రాజెక్ట్ కి. ప్లాట్లు ఎనిమిది వందల ఎనిమిది చదరపు గజాల నుంచి, ధర అరవై ఎనిమిది లక్షల డెబ్బై వేల నుంచి మొదలు సర్.

*air quality akkaḍa A.Q.I. panneṇḍu mātramē sar — siṭīlō vanda nunchi nūṭa enabhai uṇṭundi. Financial District nunchi R.R.R. mīdugā nalabhai nimiṣālu. reṇḍu vēla iravai nālugu lō "Best Sustainable Eco-Friendly Project of the Year" award kūḍā vachchindi ī project ki. plots enimidi vandala enimidi chadarapu gajāla nunchi, dhara aravai enimidi lakṣala ḍebbai vēla nunchi modalu sar.*

---

## Block 6 — Close / site-visit ask (0:56–1:06)

**A**
> సర్, ఫోన్‌లో చెప్పేదాని కంటే ఒకసారి చూస్తే బాగా అర్థమవుతుంది. ఈ శనివారం ఉదయం పదకొండు గంటలకు site visit ఉంది — cab మేమే arrange చేస్తాం, మీరు ఏమీ pay చేయనవసరం లేదు. మీ పేరు register చేయనా సర్?

**B**
> సర్, ఫోన్‌లో చెప్పేదాని కంటే ఒకసారి చూస్తే బాగా అర్థమవుతుంది. ఈ శనివారం ఉదయం పదకొండు గంటలకు సైట్ విజిట్ ఉంది — క్యాబ్ మేమే అరేంజ్ చేస్తాం, మీరు ఏమీ పే చేయనవసరం లేదు. మీ పేరు రిజిస్టర్ చేయనా సర్?

*sar, phōnlō cheppēdāni kaṇṭē okasāri chūstē bāgā arthamavutundi. ī śanivāram udayam padakoṇḍu gaṇṭalaku site visit undi — cab mēmē arrange chēstām, mīru ēmī pay chēyanavasaram lēdu. mī pēru register chēyanā sar?*

---

## Block 7 — Objection handles

Each is a standalone 8–12 second clip. Record all seven per voice — they carry the most emotional range and are the best test of whether a synthetic voice stays warm under pushback.

### 7.1 "బిజీగా ఉన్నాను" / Busy
> అర్థమైంది సర్, సారీ. మీకు సాయంత్రం ఆరు గంటలకు call చేయనా, లేక రేపు ఉదయం మంచిదా?

*arthamaindi sar, sorry. mīku sāyantram āru gaṇṭalaku call chēyanā, lēka rēpu udayam manchidā?*

### 7.2 "ఇంట్రెస్ట్ లేదు" / Not interested
> ఫర్వాలేదు సర్, thank you. ఒక్క WhatsApp message పంపిస్తాను — brochure, layout, price list అన్నీ ఉంటాయి. తీరిక ఉన్నప్పుడు చూడండి, అంతే. మిమ్మల్ని మళ్ళీ call చేసి ఇబ్బంది పెట్టం.

*pharvālēdu sar, thank you. okka WhatsApp message pampistānu — brochure, layout, price list annī uṇṭāyi. tīrika unnappuḍu chūḍaṇḍi, antē. mimmalni maḷḷī call chēsi ibbandi peṭṭam.*

### 7.3 "చాలా ఎక్కువ ధర" / Too expensive
> నిజమే సర్, మొదట అలాగే అనిపిస్తుంది. కానీ ఇది ఖాళీ plot కాదు — వంద రకాల చెట్లు, drip irrigation, clubhouse, maintenance అన్నీ కలిపి ఉన్న ధర ఇది. చదరపు గజం ఎనిమిది వేల ఐదు వందలు మాత్రమే. అదే ORR లోపల చూస్తే ఇంతకు మూడు రెట్లు సర్. Bank loan option కూడా ఉంది.

*nijamē sar, modaṭa alāgē anipistundi. kānī idi khāḷī plot kādu — vanda rakāla cheṭlu, drip irrigation, clubhouse, maintenance annī kalipi unna dhara idi. chadarapu gajam enimidi vēla aidu vandalu mātramē. adē ORR lōpala chūstē intaku mūḍu reṭlu sar. bank loan option kūḍā undi.*

### 7.4 "అంత దూరమా?" / Too far
> నలభై నిమిషాలే సర్ — Financial District నుంచి R.R.R. మీదుగా. Gachibowli నుంచి Kondapur వెళ్ళడానికి peak time లో అంతే పడుతుంది కదా సర్. పైగా R.R.R. పూర్తయ్యాక ఆ ప్రాంతం విలువ ఇంకా పెరుగుతుంది.

*nalabhai nimiṣālē sar — Financial District nunchi R.R.R. mīdugā. Gachibowli nunchi Kondapur veḷḷaḍāniki peak time lō antē paḍutundi kadā sar. paigā R.R.R. pūrtayyāka ā prāntam viluva inkā perugutundi.*

### 7.5 "Documents clear గా ఉన్నాయా?" / Legal check
> అడిగినందుకు సంతోషం సర్ — అదే ముఖ్యం. అన్ని plots కీ clear title ఉంది, HMDA / DTCP approvals, ఇంకా bank loan eligibility కూడా ఉన్నాయి. మీ lawyer తో verify చేయించుకోండి సర్, మేము అన్ని documents ముందే ఇస్తాం.

*aḍiginanduku santōṣam sar — adē mukhyam. anni plots kī clear title undi, HMDA / DTCP approvals, inkā bank loan eligibility kūḍā unnāyi. mī lawyer tō verify chēyinchukōṇḍi sar, mēmu anni documents mundē istām.*

> ⚠️ Compliance note: keep approval names in this line accurate to the current MODCON sanction letters before any live use. For voice testing only, read as written.

### 7.6 "ఇప్పటికే plot ఉంది" / Already own land
> చాలా మంచిది సర్. అయితే ఇది కొంచెం వేరే సర్ — ఇక్కడ మీరు కొనేది plot కాదు, ఒక ready farm. చెట్లు, నీళ్ళు, maintenance team అన్నీ setup అయి ఉంటాయి. మీరు వెళ్ళి కూర్చుంటే చాలు. రెండు నిమిషాల video పంపనా సర్?

*chālā manchidi sar. ayitē idi konchem vērē sar — ikkaḍa mīru konēdi plot kādu, oka ready farm. cheṭlu, nīḷḷu, maintenance team annī setup ayi uṇṭāyi. mīru veḷḷi kūrchuṇṭē chālu. reṇḍu nimiṣāla video pampanā sar?*

### 7.7 "ఈ number ఎక్కడిది? నన్ను call చేయకండి" / DNC exit
> క్షమించండి సర్. మీ number మా enquiry list నుంచి ఇప్పుడే తీసేస్తున్నాను. ఇక మీకు call రాదు. మీ time కి thank you సర్, శుభ దినం.

*kṣaminchaṇḍi sar. mī number mā enquiry list nunchi ippuḍē tīsēstunnānu. ika mīku call rādu. mī time ki thank you sar, śubha dinam.*

> Always honour this immediately. End the call within 5 seconds; no rebuttal.

---

## Block 8 — Alternate property variant (MODCON SYL Residences)

Swap Blocks 2, 4 and 5 with these when testing the second project. Same opening and close.

**Hook**
> సర్, Tukkuguda లో O.R.R. Exit-పద్నాలుగు దగ్గర — MODCON SYL Residences అని నాలుగున్నర ఎకరాల biophilic project ఉంది. Airport కి కేవలం పది నిమిషాలు.

*sar, Tukkuguda lō O.R.R. Exit-padnālugu daggara — MODCON SYL Residences ani nālugunnara ekarāla biophilic project undi. airport ki kēvalam padi nimiṣālu.*

**Value + price**
> రెండు వేల ఐదు వందల నుంచి నాలుగు వేల ఐదు వందల చదరపు అడుగుల villaments సర్ — పెద్ద forest-view balconies, ఇరవై రెండు వేల చదరపు అడుగుల clubhouse, chemical లేని natural bio pool, yoga pavilion. చదరపు అడుగు నాలుగు వేల నాలుగు వందల తొంభై తొమ్మిది రూపాయలు. Commercial spaces కూడా ఉన్నాయి — one-time investor price లో సర్.

*reṇḍu vēla aidu vandala nunchi nālugu vēla aidu vandala chadarapu aḍugula villaments sar — pedda forest-view balconies, iravai reṇḍu vēla chadarapu aḍugula clubhouse, chemical lēni natural bio pool, yoga pavilion. chadarapu aḍugu nālugu vēla nālugu vandala tombhai tommidi rūpāyalu. commercial spaces kūḍā unnāyi — one-time investor price lō sar.*

---

## Block 9 — Voicemail / no-answer message (18 sec)

Flatter delivery, no questions, single call-to-action. Good test of a voice's "unaddressed" register.

> నమస్కారం సర్, నేను ప్రియ — ద గ్రీన్ టీమ్ నుంచి. MODCON Agartha, నార్సాపూర్ forest farm plots గురించి మాట్లాడాలని call చేశాను. ముప్పై ఆరు plots మాత్రమే ఉన్నాయి సర్. మీకు వీలైనప్పుడు ఇదే number కి call చేయండి, లేదా WhatsApp చేయండి — layout, price list పంపిస్తాను. ధన్యవాదాలు సర్.

*namaskāram sar, nēnu Priya — The Green Team nunchi. MODCON Agartha, Narsapur forest farm plots gurinchi māṭlāḍālani call chēśānu. muppai āru plots mātramē unnāyi sar. mīku vīlainappuḍu idē number ki call chēyaṇḍi, lēdā WhatsApp chēyaṇḍi — layout, price list pampistānu. dhanyavādālu sar.*

---

## TTS QA checklist

Run every voice through Blocks 0, 1, 5, 7.3 and 9 at minimum, then score:

| # | What to listen for | Common failure |
|---|---|---|
| 1 | **Numerals** — `68.7 L`, `4,499`, `36,000`, `AQI 12` | Engine reads digits in English or as "sixty-eight point seven". Fix: always write numbers as Telugu words (this script already does). |
| 2 | **Initialisms** — A.Q.I., R.R.R., O.R.R., HMDA, DTCP | Run together as a nonsense word. Fix: space the letters (`ఏ. క్యూ. ఐ.`) or use SSML `<say-as interpret-as="characters">`. |
| 3 | **Code-switch** — Latin words inside a Telugu sentence (Variant A) | Accent snaps to American English mid-sentence, or the word is skipped. If it fails, switch to Variant B. |
| 4 | **Retroflex + geminates** — ళ్ళ, ట్ల, ప్ప, ణ (వాళ్ళ, ప్లాట్లు, ముప్పై) | Flattened to dental; ళ read as ల. |
| 5 | **Honorific `సర్`/`మేడమ్`** at clause end | Clipped or swallowed — the single most audible defect on a sales call. |
| 6 | **Question intonation** — Blocks 1, 3, 6 all end in questions | Falling pitch, turning an ask into a statement. Add SSML pitch lift if the engine allows. |
| 7 | **Pause discipline** — 0.6 s after Block 1, 1.2 s after Block 3 | Trailing silence trimmed by the encoder; the reply prompt lands too early. |
| 8 | **Brand names** — MODCON (మోడ్‌కాన్, not "mod-con"), Agartha (అగర్తా), Narsapur, Tukkuguda, Gachibowli | Anglicised stress on the wrong syllable. |
| 9 | **Warmth under objection** — Block 7.2 and 7.7 | Voice turns robotic or pushy exactly where it must sound gracious. |
| 10 | **Rate** | 145–160 Telugu words/min. Faster reads as a recorded ad and gets hung up on. |

**Suggested render settings (ElevenLabs Multilingual v2):** stability 0.45, similarity 0.80, style 0.30, speaker boost on. Lower stability makes the sales lilt more natural; raise it to 0.6 if the voice wanders on the long Block 4 sentence.

---

## Usage & compliance

This is **test copy for voice evaluation**, not an approved outbound campaign.
Before any live dialling: verify prices, approvals and award claims against current MODCON collateral, call only opt-in / consented numbers, honour DNC and TRAI restrictions (no calls before 9 AM or after 9 PM IST), and identify The Green Team as a channel partner in the first sentence — Block 1 already does this.
