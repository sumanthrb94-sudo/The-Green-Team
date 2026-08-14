import 'server-only';

const FIELDS = [
  'title', 'location', 'aqi', 'noise', 'commute', 'valuation', 'memberPrice', 'image',
  'tagline', 'description', 'plots', 'plotRange', 'amenityAcres', 'architect',
  'pricePerSqYd', 'sitePlanSrc', 'brochureUrl', 'status', 'order', 'features', 'plotImages', 'mapUrl',
] as const;

/** Whitelist + normalize an admin property payload. */
export function sanitizePropertyInput(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.status !== 'live' && out.status !== 'draft') out.status = 'draft';
  return out;
}
