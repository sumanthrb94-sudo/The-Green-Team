/**
 * Build the Groot knowledge index.
 *
 *   npx tsx --conditions=react-server --env-file=.env.local scripts/build-kb-index.ts
 *   …--force   re-embeds every chunk instead of only changed ones
 *
 * The react-server condition resolves the `server-only` guard to a no-op so the
 * server modules can be imported from a plain Node process.
 *
 * Incremental by content hash: re-running after a one-line copy edit re-embeds
 * one chunk, not two hundred. That is what makes it cheap enough to run on
 * every admin property save.
 */
import { buildCorpus } from '../lib/rag/corpus';
import { embedBatch } from '../lib/ai/gemini';
import {
  listIndexedHashes,
  writeChunks,
  deleteChunks,
  indexSize,
  type IndexedChunk,
} from '../lib/rag/index-store';

const force = process.argv.includes('--force');

async function main() {
  console.log('Building corpus…');
  const corpus = await buildCorpus();
  console.log(`  ${corpus.length} chunks from ${new Set(corpus.map(c => c.source)).size} sources`);

  const bySource = corpus.reduce<Record<string, number>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});
  for (const [source, n] of Object.entries(bySource).sort()) {
    console.log(`    ${source.padEnd(10)} ${n}`);
  }

  const existing = await listIndexedHashes();
  const stale = force ? corpus : corpus.filter(c => existing.get(c.id) !== c.contentHash);
  const orphaned = [...existing.keys()].filter(id => !corpus.some(c => c.id === id));

  console.log(`\n${stale.length} to embed · ${orphaned.length} to remove · ${corpus.length - stale.length} unchanged`);

  if (stale.length > 0) {
    console.log('Embedding…');
    const vectors = await embedBatch(
      stale.map(c => c.text),
      'RETRIEVAL_DOCUMENT'
    );
    if (vectors.length !== stale.length) {
      throw new Error(`embedding count mismatch: got ${vectors.length}, expected ${stale.length}`);
    }
    const indexed: IndexedChunk[] = stale.map((c, i) => ({ ...c, embedding: vectors[i] }));
    await writeChunks(indexed);
    console.log(`  wrote ${indexed.length} chunks (${vectors[0].length} dims)`);
  }

  if (orphaned.length > 0) {
    await deleteChunks(orphaned);
    console.log(`  removed ${orphaned.length} orphaned chunks`);
  }

  console.log(`\nIndex now holds ${await indexSize()} chunks.`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
