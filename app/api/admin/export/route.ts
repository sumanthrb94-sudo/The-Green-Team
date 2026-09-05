import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/session';
import { fetchLeads, fetchNewsletter, fetchUsers } from '@/lib/server/admin-data';

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = [...new Set(rows.flatMap(r => Object.keys(r)))];
  const esc = (v: unknown) => {
    let s = v == null ? '' : String(v);
    // CSV formula-injection guard: a cell that begins with = + - @ (or a control
    // char Excel strips to reach one) is executed as a formula when the export
    // is opened in Excel/Sheets. Lead name/intent are attacker-controlled via
    // the public /api/leads form, so prefix a single quote to neutralise it.
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const collection = req.nextUrl.searchParams.get('collection');
  let rows: Record<string, unknown>[];
  if (collection === 'leads') rows = (await fetchLeads()) as unknown as Record<string, unknown>[];
  else if (collection === 'newsletter') rows = (await fetchNewsletter()) as unknown as Record<string, unknown>[];
  else if (collection === 'users') rows = (await fetchUsers()) as unknown as Record<string, unknown>[];
  else return NextResponse.json({ error: 'unknown collection' }, { status: 400 });

  return new NextResponse(toCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${collection}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
