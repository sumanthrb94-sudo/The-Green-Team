import { NextResponse } from 'next/server';
import { getActivity } from '@/lib/server/activity';

/**
 * Public momentum figures for the activity strip. Aggregate only — no per-person
 * data — so it is safe to cache at the edge. A 5-minute CDN cache means one read
 * per 5 minutes serves everyone, rather than a Firestore hit per visitor.
 */
export const revalidate = 300;

export async function GET() {
  const data = await getActivity();
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  });
}
