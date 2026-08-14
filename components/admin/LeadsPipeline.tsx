'use client';

/** Lead pipeline — status tracking (new → contacted → site visit → closed) with CSV export. */
import { useMemo, useState } from 'react';
import { Download, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLead, LeadStatus } from '@/lib/server/admin-data';

const STATUSES: { id: LeadStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'site-visit', label: 'Site Visit' },
  { id: 'closed', label: 'Closed' },
];

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-gold/15 text-gold border-gold/30',
  contacted: 'bg-primary/10 text-primary border-primary/25',
  'site-visit': 'bg-[#3a7d44]/15 text-[#3a7d44] dark:text-primary border-[#3a7d44]/30',
  closed: 'bg-secondary/10 text-secondary border-secondary/25',
};

export function LeadsPipeline({ initial }: { initial: AdminLead[] }) {
  const [leads, setLeads] = useState(initial);
  const [filter, setFilter] = useState<LeadStatus | 'all'>('all');
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const visible = filter === 'all' ? leads : leads.filter(l => l.status === filter);

  const setStatus = async (id: string, status: LeadStatus) => {
    setBusy(id);
    const prev = leads;
    setLeads(ls => ls.map(l => (l.id === id ? { ...l, status } : l)));
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setLeads(prev); // roll back on failure
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => setFilter(s.id)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-[9px] uppercase tracking-[0.25em] font-bold border transition-all',
                filter === s.id
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline/25 text-secondary/60 hover:text-on-surface'
              )}
            >
              {s.label} {counts[s.id] ? `(${counts[s.id]})` : ''}
            </button>
          ))}
        </div>
        <a
          href="/api/admin/export?collection=leads"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-secondary/70 hover:text-on-surface transition-all"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </a>
      </div>

      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-center py-16 text-secondary/40 text-sm">No leads in this stage.</p>
        )}
        {visible.map(l => (
          <div key={l.id} className="p-5 rounded-3xl bg-surface border border-outline/12">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-bold text-on-surface">{l.name}</p>
                  <span className={cn('px-2.5 py-0.5 rounded-full border text-[8px] uppercase tracking-widest font-bold', STATUS_STYLE[l.status])}>
                    {l.status.replace('-', ' ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-secondary/70">
                  {l.email && (
                    <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 hover:text-primary">
                      <Mail className="w-3 h-3" /> {l.email}
                    </a>
                  )}
                  {l.phone && (
                    <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-primary">
                      <Phone className="w-3 h-3" /> {l.phone}
                    </a>
                  )}
                </div>
                {l.intent && <p className="mt-2 text-xs text-primary/70 font-medium">{l.intent}</p>}
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-[10px] text-secondary/40">
                  {l.createdAt
                    ? new Date(l.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                    : '—'}
                  {' · '}
                  <span className="uppercase tracking-widest font-bold text-primary/60">{l.source}</span>
                </p>
                <select
                  value={l.status}
                  disabled={busy === l.id}
                  onChange={e => void setStatus(l.id, e.target.value as LeadStatus)}
                  className="text-xs bg-surface-container-low border border-outline/25 rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="site-visit">Site Visit</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
