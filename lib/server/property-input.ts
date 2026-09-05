import 'server-only';

const FIELDS = [
  'title', 'location', 'aqi', 'noise', 'commute', 'valuation', 'memberPrice', 'image',
  'tagline', 'description', 'plots', 'plotRange', 'amenityAcres', 'architect',
  'pricePerSqYd', 'sitePlanSrc', 'brochureUrl', 'status', 'order', 'features', 'plotImages', 'mapUrl',
  'category', 'stage', 'investment',
] as const;

/** Whitelist + normalize an admin property payload. */
export function sanitizePropertyInput(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.status !== 'live' && out.status !== 'draft') out.status = 'draft';
  // Portal fields: only the known values, else drop — a typo here would create
  // a category the browse pages don't know about.
  if (out.category !== undefined && out.category !== 'villas' && out.category !== 'plots') delete out.category;
  if (out.stage !== undefined && !['completed', 'ongoing', 'upcoming'].includes(String(out.stage))) delete out.stage;
  if (out.investment !== undefined) out.investment = Boolean(out.investment);
  return out;
}
