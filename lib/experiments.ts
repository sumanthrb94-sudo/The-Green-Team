/**
 * Dead-simple A/B testing.
 *
 * Variant is assigned on the server from a cookie and rendered into the HTML,
 * so there is no flash of the control variant and no layout shift — the two
 * things that make client-side A/B tools hurt the page they are meant to
 * improve. No third-party script, no extra network request.
 *
 * Adding an experiment: add an entry to EXPERIMENTS, read it with
 * `getVariant()` in a server component, and render accordingly. Report the
 * impression with `<ExperimentImpression>` so GA4 can segment by variant.
 */

export const EXPERIMENT_COOKIE = 'gt_exp';

export interface Experiment {
  id: string;
  variants: readonly string[];
  /** Why this is being tested, so a later reader knows when it can be retired. */
  hypothesis: string;
}

export const EXPERIMENTS = {
  adviserCta: {
    id: 'adviser_cta',
    variants: ['control', 'outcome'] as const,
    hypothesis:
      'The button names the mechanic ("Request Adviser Call") rather than what the visitor gets. Naming the outcome ("Get Pricing & Availability") should convert better, because pricing is the thing every visitor actually arrived for and the thing the site deliberately never publishes.',
  },
} as const satisfies Record<string, Experiment>;

export type ExperimentKey = keyof typeof EXPERIMENTS;

/**
 * Stable assignment: hash the visitor id with the experiment id so a visitor
 * lands in the same bucket every time, and so two experiments don't correlate
 * with each other.
 */
export function assignVariant(experiment: Experiment, visitorId: string): string {
  let h = 2166136261;
  const key = `${experiment.id}:${visitorId}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return experiment.variants[Math.abs(h) % experiment.variants.length];
}

/** Cheap random visitor id. Not identifying — it exists only to keep bucketing stable. */
export const newVisitorId = () => Math.random().toString(36).slice(2, 12);
