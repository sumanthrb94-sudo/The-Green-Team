import 'server-only';
import { isCategory } from '@/lib/data/categories';
import { ALL_SPEC_FIELDS, missingRequired } from '@/lib/data/property-specs';

const FIELDS = [
  'title', 'location', 'aqi', 'noise', 'commute', 'valuation', 'memberPrice', 'image',
  'tagline', 'description', 'plots', 'plotRange', 'amenityAcres', 'architect',
  'pricePerSqYd', 'pricePerSqFt', 'sitePlanSrc', 'brochureUrl', 'status', 'order', 'features', 'plotImages', 'mapUrl',
  'category', 'stage', 'investment', 'reserved', 'rera', 'possession',
] as const;

const MAX_TEXT = 300;

/** Whitelist + normalize an admin property payload. Keys absent from `body` stay absent (PATCH-safe). */
export function sanitizePropertyInput(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.status !== undefined && out.status !== 'live' && out.status !== 'draft') out.status = 'draft';
  // Portal fields: only the known values, else drop — a typo here would create
  // a category the browse pages don't know about.
  if (out.category !== undefined && !isCategory(out.category)) delete out.category;
  if (out.stage !== undefined && !['completed', 'ongoing', 'upcoming'].includes(String(out.stage))) delete out.stage;
  if (out.investment !== undefined) out.investment = Boolean(out.investment);
  for (const k of ['plots', 'pricePerSqYd', 'pricePerSqFt'] as const) {
    if (out[k] !== undefined) out[k] = Math.max(0, Number(out[k]) || 0);
  }
  // Reserved units — real scarcity the admin enters. Clamp to a non-negative
  // integer; never above the plot count if we know it.
  if (out.reserved !== undefined) {
    const n = Math.max(0, Math.floor(Number(out.reserved) || 0));
    const cap = Number(out.plots);
    out.reserved = Number.isFinite(cap) && cap > 0 ? Math.min(n, cap) : n;
  }

  // Per-type specifications: coerce each to its declared kind; anything that
  // doesn't fit (an unknown option, a non-number) is dropped rather than stored.
  for (const f of ALL_SPEC_FIELDS) {
    const v = body[f.key];
    if (v === undefined) continue;
    const allowed = (x: unknown) => !f.options || f.options.some(o => o.value === x);
    switch (f.kind) {
      case 'text':
        out[f.key] = String(v ?? '').trim().slice(0, MAX_TEXT);
        break;
      case 'number': {
        const n = Number(v);
        out[f.key] = Number.isFinite(n) && n > 0 ? n : 0;
        break;
      }
      case 'boolean':
        out[f.key] = v === true || v === 'true';
        break;
      case 'select':
        // '' clears the field.
        if (v === '' || v === null) out[f.key] = '';
        else if (allowed(v)) out[f.key] = v;
        break;
      case 'multi':
        if (Array.isArray(v)) out[f.key] = [...new Set(v.filter(allowed).map(String))];
        break;
    }
  }
  return out;
}

/**
 * Publishing gate: a live listing must carry the parameters its type needs
 * (lib/data/property-specs.ts). Returns the missing labels, empty when OK.
 * `merged` is the full document as it will be after the write.
 */
export function publishBlockers(merged: Record<string, unknown>): string[] {
  if (merged.status !== 'live') return [];
  const missing = [];
  if (!String(merged.title ?? '').trim()) missing.push('Title');
  if (!String(merged.location ?? '').trim()) missing.push('Location');
  if (!String(merged.image ?? '').trim()) missing.push('Cover image');
  if (!String(merged.memberPrice ?? '').trim()) missing.push('Headline price');
  return [...missing, ...missingRequired(merged)];
}
