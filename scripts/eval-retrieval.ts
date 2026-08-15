/**
 * Retrieval evaluation for the Groot knowledge index.
 *
 *   npm run kb:eval
 *
 * Measures the only retrieval property that matters: could the model possibly
 * have answered? Each golden question names a fact that MUST appear in the
 * retrieved context — every figure below is sourced from lib/data/sanctuaries.ts
 * or lib/data/contact.ts, never invented.
 *
 * Reports recall@K and MRR. Run it after any change to chunking, the embedding
 * model, TOP_K, SCORE_FLOOR or MAX_PER_SOURCE — those knobs are meaningless
 * without a number attached.
 */
import { retrieve } from '../lib/rag/retrieve';

interface Golden {
  q: string;
  /** A fact that must be retrievable for the question to be answerable. */
  expect: RegExp;
}

const GOLDEN: Golden[] = [
  { q: 'What do plots at Agartha cost per square yard?', expect: /8,?500/ },
  { q: 'What is the entry price for MODCON Agartha?', expect: /68\.7/ },
  { q: 'How large are the plots at Agartha?', expect: /4,?800/ },
  { q: 'What is the air quality at Agartha?', expect: /\b12\b/ },
  { q: 'How quiet is Agartha?', expect: /18\s?dB/i },
  { q: 'How many plots does Agartha have in total?', expect: /\b36\b/ },
  { q: 'Which forest is Agartha next to?', expect: /narsapur/i },
  { q: 'What does SYL Residences cost per square foot?', expect: /4,?499/ },
  { q: 'How big are the SYL villaments?', expect: /2,?500/ },
  { q: 'Where is SYL Residences located?', expect: /tukkuguda|ORR/i },
  { q: 'What is the rate per square yard at Dates County?', expect: /18,?000/ },
  { q: 'What is the entry price at Dates County?', expect: /₹\s?90\s?L/ },
  { q: 'Is Dates County RERA registered?', expect: /P02400002648/ },
  { q: 'How far is Dates County from the airport?', expect: /15\s?min/i },
  { q: 'How much has Agartha appreciated since launch?', expect: /6,?199/ },
  { q: 'Can an NRI buy property with you?', expect: /nri/i },
  { q: 'Can I get a home loan on these?', expect: /loan/i },
  { q: 'What exactly is a channel partner?', expect: /channel partner/i },
  { q: 'How do you verify the air quality figures you publish?', expect: /(on site|site rather|readings)/i },
  { q: 'What budget ranges do you work with?', expect: /₹\s?50\s?L/ },
];

async function main() {
  let hits = 0;
  let reciprocalSum = 0;
  const misses: string[] = [];

  for (const g of GOLDEN) {
    const { chunks, empty } = await retrieve(g.q, []);
    const rank = chunks.findIndex(c => g.expect.test(c.text)) + 1;
    const found = rank > 0;
    if (found) {
      hits++;
      reciprocalSum += 1 / rank;
    } else {
      misses.push(g.q);
    }
    const mark = found ? '✅' : '❌';
    const where = found ? `rank ${rank}/${chunks.length}` : empty ? 'refused' : `absent from ${chunks.length}`;
    console.log(`${mark} ${where.padEnd(18)} ${g.q}`);
  }

  const n = GOLDEN.length;
  console.log('\n' + '─'.repeat(60));
  console.log(`recall@8 : ${((hits / n) * 100).toFixed(1)}%  (${hits}/${n})`);
  console.log(`MRR      : ${(reciprocalSum / n).toFixed(3)}`);
  if (misses.length) {
    console.log('\nMissed — these are index gaps, not model failures:');
    for (const m of misses) console.log(`  · ${m}`);
  }
  // A regression here means the bot silently lost the ability to answer.
  if (hits / n < 0.8) {
    console.log('\nrecall below 80% — investigate chunking before shipping');
    process.exit(1);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
