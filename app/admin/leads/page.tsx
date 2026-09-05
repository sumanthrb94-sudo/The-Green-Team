import { fetchLeads } from '@/lib/server/admin-data';
import { getSessionUser } from '@/lib/server/session';
import { LeadsPipeline } from '@/components/admin/LeadsPipeline';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  // The layout renders the auth wall, but it can't stop this page segment from
  // rendering — so gate here too, before any fetch, or the data streams anyway.
  if (!(await getSessionUser())?.isAdmin) return null;
  const leads = await fetchLeads();
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Lead Pipeline</h1>
      <LeadsPipeline initial={leads} />
    </div>
  );
}
