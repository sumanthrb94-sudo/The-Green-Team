import { getAnalytics, traceSession } from '@/lib/server/analytics-data';
import { getSessionUser } from '@/lib/server/session';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { SessionTraceView } from '@/components/admin/SessionTraceView';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; trace?: string }>;
}) {
  // Gate before fetching: the layout's auth wall does not stop this segment
  // from rendering, and these are real visitors' journeys.
  if (!(await getSessionUser())?.isAdmin) return null;

  const { range, trace } = await searchParams;
  const days = Math.min(365, Math.max(1, Number(range) || 30));

  // A trace replaces the dashboard rather than sitting under it: when you are
  // looking up the person who just messaged you, the month's averages are
  // noise. traceSession runs its own requireAdmin, so the aggregate read is
  // skipped entirely rather than fetched and thrown away.
  if (trace) return <SessionTraceView trace={await traceSession(trace)} range={days} />;

  return <AnalyticsDashboard data={await getAnalytics(days)} range={days} />;
}
