import { getAnalytics } from '@/lib/server/analytics-data';
import { getSessionUser } from '@/lib/server/session';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  // Gate before fetching: the layout's auth wall does not stop this segment
  // from rendering, and these are real visitors' journeys.
  if (!(await getSessionUser())?.isAdmin) return null;

  const { range } = await searchParams;
  const days = Math.min(365, Math.max(1, Number(range) || 30));
  const data = await getAnalytics(days);

  return <AnalyticsDashboard data={data} range={days} />;
}
