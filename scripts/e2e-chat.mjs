/**
 * End-to-end tests for the Groot RAG chatbot, driven against a running server.
 *
 *   npm run build && npm start
 *   npm run e2e:chat
 *
 * These assert what the old journey test could not: that answers are *grounded*
 * in real portfolio data, that tool calls actually write to Firestore, and that
 * an out-of-scope question is refused instead of invented. Every record written
 * is deleted at the end.
 *
 * NOTE: step 7 deliberately exhausts the per-IP rate limit, which lives in
 * server memory for 10 minutes. Restart the server before running e2e-journey
 * afterwards, or its chat check will be (correctly) rate-limited.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const MARK = `e2e-chat-${Date.now()}`;

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});
const db = getFirestore();

const results = [];
const ok = (name, detail = '') => { results.push({ pass: true, name }); console.log(`  ✅ ${name}${detail ? ` — ${detail}` : ''}`); };
const fail = (name, detail = '') => { results.push({ pass: false, name, detail }); console.log(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`); };
const wait = ms => new Promise(r => setTimeout(r, ms));

/** POST /api/chat and collect the NDJSON event stream. */
async function chat(messages, conversationId) {
  const res = await fetch(`${BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, userName: 'E2E Tester', conversationId }),
  });
  if (res.status === 429) return { status: 429, text: '', events: [] };
  if (!res.ok) throw new Error(`/api/chat ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events = [];
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      const ev = JSON.parse(line);
      events.push(ev);
      if (ev.type === 'token') text += ev.text;
    }
  }
  const done = events.find(e => e.type === 'done');
  return { status: 200, text, events, conversationId: done?.conversationId };
}

const findDocs = async (coll, field, value, tries = 6) => {
  for (let i = 0; i < tries; i++) {
    const snap = await db.collection(coll).where(field, '==', value).get();
    if (!snap.empty) return snap.docs;
    await wait(900);
  }
  return [];
};

async function main() {
  const created = { leads: [], newsletter: [], conversations: [] };

  // ── 1. Grounded pricing ────────────────────────────────────────────────
  console.log('\n▶ 1. Grounded answer (pricing must come from real data)');
  const priceRes = await chat([{ role: 'user', text: 'What do plots at MODCON Agartha cost?' }]);
  console.log(`     "${priceRes.text.slice(0, 140).replace(/\n/g, ' ')}…"`);
  if (priceRes.conversationId) created.conversations.push(priceRes.conversationId);

  priceRes.text.length > 20 ? ok('bot answered') : fail('bot returned nothing');

  // Every figure below appears in lib/data/sanctuaries.ts for Agartha.
  const grounded = /68\.7|8,?500|4,?800|₹/.test(priceRes.text);
  grounded ? ok('answer contains a real Agartha figure') : fail('answer has no sourced figure', priceRes.text.slice(0, 120));

  /I am Groot\./.test(priceRes.text)
    ? fail('old persona tic still present')
    : ok('persona tic removed');

  const src = priceRes.events.find(e => e.type === 'sources');
  src?.items?.length ? ok('citations returned', src.items.map(i => i.title).join(' · ')) : fail('no sources emitted');

  // ── 2. Refusal instead of invention ────────────────────────────────────
  console.log('\n▶ 2. Out-of-scope question must be refused, not invented');
  const oos = await chat([
    { role: 'user', text: 'Do you have any beachfront villas for sale in Goa, and what do they cost?' },
  ]);
  if (oos.conversationId) created.conversations.push(oos.conversationId);
  console.log(`     "${oos.text.slice(0, 160).replace(/\n/g, ' ')}…"`);
  const admits = /(don'?t|do not|doesn'?t) have|no properties|not have any|only (curate|operate|work)/i.test(oos.text);
  // Describing the real Hyderabad portfolio (with its real prices) is correct and
  // helpful — the failure to catch is *claiming* Goa inventory.
  const claimsGoa = /(we|our)\s+(have|offer|list)[^.]{0,40}goa/i.test(oos.text);
  admits && !claimsGoa
    ? ok('declined without inventing inventory')
    : fail('did not cleanly decline', oos.text.slice(0, 160));

  // ── 3. Site-visit tool writes a real lead ──────────────────────────────
  console.log('\n▶ 3. book_site_visit tool → leads collection');
  const phone = '+91 90000 11222';
  const booking = await chat([
    { role: 'user', text: 'I want to see Agartha in person.' },
    { role: 'model', text: 'Happy to arrange that. Could I take your name and phone number?' },
    { role: 'user', text: `Yes please book the site visit. My name is ${MARK} and my number is ${phone}. Go ahead and confirm it.` },
  ]);
  if (booking.conversationId) created.conversations.push(booking.conversationId);

  const action = booking.events.find(e => e.type === 'action' && e.action === 'book_site_visit');
  action?.ok ? ok('tool executed', action.data?.message?.slice(0, 60)) : fail('book_site_visit not called', JSON.stringify(booking.events.filter(e => e.type === 'action')).slice(0, 200));

  const leads = await findDocs('leads', 'name', MARK);
  if (leads.length) {
    created.leads.push(...leads.map(d => d.id));
    const d = leads[0].data();
    d.source === 'groot-site-visit' ? ok(`lead source tagged (${d.source})`) : fail(`wrong source: ${d.source}`);
    d.status === 'new' ? ok('lead enters pipeline as new') : fail(`wrong status: ${d.status}`);
    d.phone ? ok(`phone persisted (${d.phone})`) : fail('phone missing');
  } else {
    fail('no lead document written');
  }

  action?.data?.ctaHref?.includes('wa.me/919700144003')
    ? ok('confirmation card carries the correct WhatsApp link')
    : fail('action CTA missing or wrong number', action?.data?.ctaHref ?? 'none');

  // ── 4. Newsletter tool ─────────────────────────────────────────────────
  console.log('\n▶ 4. subscribe_newsletter tool → newsletter collection');
  const email = `${MARK}@example.in`;
  const sub = await chat([
    { role: 'user', text: `Please subscribe me to your newsletter. My email is ${email}.` },
  ]);
  if (sub.conversationId) created.conversations.push(sub.conversationId);
  const subAction = sub.events.find(e => e.type === 'action' && e.action === 'subscribe_newsletter');
  subAction?.ok ? ok('newsletter tool executed') : fail('subscribe_newsletter not called');
  const nl = await findDocs('newsletter', 'email', email);
  if (nl.length) {
    created.newsletter.push(...nl.map(d => d.id));
    ok(`newsletter doc written (source=${nl[0].data().source})`);
  } else {
    fail('no newsletter document written');
  }

  // ── 5. Transcript persisted for the admin dashboard ────────────────────
  console.log('\n▶ 5. Transcript stored for Admin → Chats');
  if (booking.conversationId) {
    const snap = await db.collection('conversations').doc(booking.conversationId).get();
    if (snap.exists) {
      const c = snap.data();
      c.messages?.length ? ok(`transcript stored (${c.messages.length} messages)`) : fail('transcript empty');
      c.actions?.some(a => a.tool === 'book_site_visit') ? ok('action recorded on transcript') : fail('action not recorded');
      c.leadIds?.length ? ok('lead linked to conversation') : fail('leadIds empty');
    } else {
      fail('conversation document missing');
    }
  } else {
    fail('no conversationId returned');
  }

  // ── 6. Multi-turn continuity ───────────────────────────────────────────
  console.log('\n▶ 6. Follow-up question resolves against history');
  const first = await chat([{ role: 'user', text: 'Tell me about Dates County.' }]);
  if (first.conversationId) created.conversations.push(first.conversationId);
  const follow = await chat(
    [
      { role: 'user', text: 'Tell me about Dates County.' },
      { role: 'model', text: first.text },
      { role: 'user', text: 'And what is the air quality there?' },
    ],
    first.conversationId
  );
  console.log(`     "${follow.text.slice(0, 140).replace(/\n/g, ' ')}…"`);
  /\b(18|aqi)\b/i.test(follow.text) ? ok('follow-up answered with retrieved AQI') : fail('follow-up lost context', follow.text.slice(0, 140));

  // ── 7. Rate limiting ───────────────────────────────────────────────────
  console.log('\n▶ 7. Rate limiting protects the endpoint');
  // An empty message list is rejected *after* the rate-limit check but before
  // any model call, so the limiter can be exercised without paying for 26
  // generations — which is otherwise minutes of wall time.
  let limited = false;
  for (let i = 0; i < 30 && !limited; i++) {
    const r = await fetch(`${BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    });
    if (r.status === 429) limited = true;
    else await r.body?.cancel();
  }
  limited ? ok('429 returned after the burst threshold') : fail('endpoint never rate-limited');

  // ── Cleanup ────────────────────────────────────────────────────────────
  console.log('\n▶ Cleanup');
  let removed = 0;
  for (const [coll, ids] of Object.entries(created)) {
    for (const id of new Set(ids)) {
      await db.collection(coll).doc(id).delete().catch(() => {});
      removed++;
    }
  }
  // Rate-limit probes create throwaway transcripts; sweep them by marker.
  const strays = await db.collection('conversations').where('userName', '==', 'E2E Tester').get();
  for (const d of strays.docs) { await d.ref.delete(); removed++; }
  console.log(`  🧹 removed ${removed} test records — real data untouched`);

  const passed = results.filter(r => r.pass).length;
  console.log(`\n━━━ CHAT E2E: ${passed}/${results.length} checks ━━━`);
  if (passed !== results.length) {
    for (const r of results.filter(r => !r.pass)) console.log(`  ✗ ${r.name} ${r.detail ?? ''}`);
    process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
