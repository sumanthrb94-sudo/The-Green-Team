import 'server-only';
import { cookies } from 'next/headers';
import {
  EXPERIMENTS,
  EXPERIMENT_COOKIE,
  assignVariant,
  newVisitorId,
  type ExperimentKey,
} from '@/lib/experiments';

/**
 * Read the visitor's variant for an experiment, server-side.
 *
 * The cookie is set by middleware (so it exists before any page renders); if
 * it is somehow missing we still return a deterministic variant rather than
 * throwing, and the next response will set it.
 */
export async function getVariant(key: ExperimentKey): Promise<string> {
  const store = await cookies();
  const visitorId = store.get(EXPERIMENT_COOKIE)?.value ?? newVisitorId();
  return assignVariant(EXPERIMENTS[key], visitorId);
}
