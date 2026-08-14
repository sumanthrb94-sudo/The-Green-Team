import { fetchLeads } from '@/lib/server/admin-data';
import { LeadsPipeline } from '@/components/admin/LeadsPipeline';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const leads = await fetchLeads();
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">Lead Pipeline</h1>
      <LeadsPipeline initial={leads} />
    </div>
  );
}
