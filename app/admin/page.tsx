import Link from 'next/link';
import { Users, Mail, Inbox, Building2 } from 'lucide-react';
import { fetchLeads, fetchNewsletter, fetchUsers, fetchProperties } from '@/lib/server/admin-data';
import { getSessionUser } from '@/lib/server/session';
import { LeadsOverTime, SourceBreakdown } from '@/components/admin/Charts';

export const dynamic = 'force-dynamic';

function weekKey(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1); // Monday of that week
  return d.toISOString().slice(5, 10); // MM-DD
}

export default async function AdminOverview() {
  if (!(await getSessionUser())?.isAdmin) return null;
  const [leads, newsletter, users, properties] = await Promise.all([
    fetchLeads(),
    fetchNewsletter(),
    fetchUsers(),
    fetchProperties(),
  ]);

  const weekAgo = Date.now() - 7 * 86400e3;
  const leadsThisWeek = leads.filter(l => l.createdAt && Date.parse(l.createdAt) > weekAgo).length;

  // last 10 weeks of activity
  const weeks: string[] = [];
  for (let i = 9; i >= 0; i--) {
    const d = new Date(Date.now() - i * 7 * 86400e3);
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() - day + 1);
    weeks.push(d.toISOString().slice(5, 10));
  }
  const series = weeks.map(w => ({
    week: w,
    leads: leads.filter(l => weekKey(l.createdAt) === w).length,
    newsletter: newsletter.filter(n => weekKey(n.createdAt) === w).length,
  }));

  const bySource = Object.entries(
    leads.reduce<Record<string, number>>((acc, l) => {
      acc[l.source] = (acc[l.source] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const stats = [
    { label: 'Total Leads', value: leads.length, sub: `+${leadsThisWeek} this week`, Icon: Inbox, href: '/admin/leads' },
    { label: 'Newsletter', value: newsletter.length, sub: 'subscribers', Icon: Mail, href: '/admin/newsletter' },
    { label: 'Users', value: users.length, sub: 'registered', Icon: Users, href: '/admin/users' },
    { label: 'Properties', value: properties.length, sub: `${properties.filter(p => p.status === 'live').length} live`, Icon: Building2, href: '/admin/properties' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, sub, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="p-6 rounded-3xl bg-surface border border-outline/12 hover:border-primary/40 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">{label}</span>
              <Icon className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
            </div>
            <p className="text-4xl font-headline font-extrabold text-on-surface">{value}</p>
            <p className="text-xs text-secondary/60 mt-1">{sub}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-surface border border-outline/12">
          <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-6">
            Capture — last 10 weeks
          </p>
          <LeadsOverTime data={series} />
        </div>
        <div className="p-6 rounded-3xl bg-surface border border-outline/12">
          <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50 mb-6">Lead sources</p>
          <SourceBreakdown data={bySource} />
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-surface border border-outline/12">
        <div className="flex items-center justify-between mb-5">
          <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/50">Latest leads</p>
          <Link href="/admin/leads" className="text-[10px] uppercase tracking-widest font-bold text-primary hover:underline">
            Open pipeline →
          </Link>
        </div>
        <div className="divide-y divide-outline/10">
          {leads.slice(0, 6).map(l => (
            <div key={l.id} className="py-3.5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-on-surface truncate">{l.name}</p>
                <p className="text-xs text-secondary/60 truncate">
                  {[l.email, l.phone].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[9px] uppercase tracking-widest font-bold text-primary/70">{l.source}</p>
                <p className="text-[10px] text-secondary/40">
                  {l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
