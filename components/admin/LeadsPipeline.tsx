'use client';

/**
 * Professional Lead & Onboarding Pipeline CRM.
 * Segmented by intent: Buyer Enquiries, Site Visits, and Developer Property Onboardings.
 * Features stage tracking (New → Contacted → Site Visit → Closed), search, and CSV exports.
 */
import { useMemo, useState } from 'react';
import { Download, Mail, Phone, Search, Building2, User, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLead, LeadStatus } from '@/lib/server/admin-data';

const STATUSES: { id: LeadStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Stages' },
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'site-visit', label: 'Site Visit' },
  { id: 'closed', label: 'Closed' },
];

const SOURCE_CHIPS = [
  { id: 'all', label: 'All Leads', icon: User },
  { id: 'buyers', label: 'Buyers & Enquiries', icon: User },
  { id: 'site-visits', label: 'Site Visits', icon: Calendar },
  { id: 'onboardings', label: 'Developer Onboarding', icon: Building2 },
] as const;

const STATUS_STYLE: Record<LeadStatus, string> = {
  new: 'bg-gold/15 text-gold border-gold/30',
  contacted: 'bg-primary/10 text-primary border-primary/25',
  'site-visit': 'bg-[#3a7d44]/15 text-[#3a7d44] dark:text-primary border-[#3a7d44]/30',
  closed: 'bg-secondary/10 text-secondary border-secondary/25',
};

export function LeadsPipeline({ initial }: { initial: AdminLead[] }) {
  const [leads, setLeads] = useState(initial);
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'buyers' | 'site-visits' | 'onboardings'>('all');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: leads.length };
    for (const l of leads) c[l.status] = (c[l.status] ?? 0) + 1;
    return c;
  }, [leads]);

  const sourceCounts = useMemo(() => {
    return {
      all: leads.length,
      buyers: leads.filter(l => !['site-visit', 'contact-site-visit', 'property-onboard'].includes(l.source)).length,
      'site-visits': leads.filter(l => ['site-visit', 'contact-site-visit'].includes(l.source)).length,
      onboardings: leads.filter(l => l.source === 'property-onboard' || l.source === 'list-property').length,
    };
  }, [leads]);

  const visible = useMemo(() => {
    return leads.filter(l => {
      // Status filter
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;

      // Source segment filter
      if (sourceFilter === 'buyers') {
        if (['site-visit', 'contact-site-visit', 'property-onboard'].includes(l.source)) return false;
      } else if (sourceFilter === 'site-visits') {
        if (!['site-visit', 'contact-site-visit'].includes(l.source)) return false;
      } else if (sourceFilter === 'onboardings') {
        if (l.source !== 'property-onboard' && l.source !== 'list-property') return false;
      }

      // Free text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesEmail = l.email?.toLowerCase().includes(q);
        const matchesPhone = l.phone?.toLowerCase().includes(q);
        const matchesIntent = l.intent?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesIntent) return false;
      }

      return true;
    });
  }, [leads, statusFilter, sourceFilter, search]);

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
    <div className="space-y-6">
      {/* ── Segmented Category Tabs ───────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-surface border border-outline/10">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {SOURCE_CHIPS.map(chip => {
            const Icon = chip.icon;
            const active = sourceFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setSourceFilter(chip.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap',
                  active
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-secondary/60 hover:text-on-surface hover:bg-surface-container-low'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full font-mono',
                    active ? 'bg-white/20 text-white' : 'bg-surface-container-highest text-secondary'
                  )}
                >
                  {sourceCounts[chip.id]}
                </span>
              </button>
            );
          })}
        </div>

        <a
          href="/api/admin/export?collection=leads"
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline/20 text-xs font-bold text-secondary/70 hover:text-on-surface hover:border-primary transition-all"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </a>
      </div>

      {/* ── Status Bar & Search Filter ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Stage Pills */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {STATUSES.map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={cn(
                'flex-shrink-0 px-3.5 py-1.5 rounded-full text-[9.5px] uppercase tracking-wider font-bold border transition-all',
                statusFilter === s.id
                  ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951]'
                  : 'border-outline/20 text-secondary/60 hover:text-on-surface'
              )}
            >
              {s.label} {counts[s.id] ? `(${counts[s.id]})` : ''}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-secondary/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads, phone, project..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline/20 bg-surface text-xs text-on-surface placeholder:text-secondary/40 focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* ── Leads & Submissions List ───────────────────────────────────── */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <div className="p-12 text-center rounded-3xl bg-surface border border-outline/10">
            <p className="text-secondary/40 text-sm">No records matching your filters.</p>
          </div>
        )}

        {visible.map(l => {
          const isOnboarding = l.source === 'property-onboard' || l.source === 'list-property';
          const isSiteVisit = ['site-visit', 'contact-site-visit'].includes(l.source);

          return (
            <div
              key={l.id}
              className={cn(
                'p-6 rounded-3xl bg-surface border transition-all',
                isOnboarding
                  ? 'border-[#c8a951]/40 shadow-sm'
                  : 'border-outline/12 hover:border-outline/25'
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <p className="font-headline font-bold text-base text-on-surface">{l.name}</p>

                    {/* Stage Status Badge */}
                    <span
                      className={cn(
                        'px-2.5 py-0.5 rounded-full border text-[8px] uppercase tracking-widest font-bold',
                        STATUS_STYLE[l.status]
                      )}
                    >
                      {l.status.replace('-', ' ')}
                    </span>

                    {/* Source Category Tag */}
                    {isOnboarding ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#c8a951]/15 text-[#c8a951] text-[8px] uppercase tracking-widest font-extrabold border border-[#c8a951]/30 flex items-center gap-1">
                        <Building2 className="w-3 h-3" /> Developer Onboarding
                      </span>
                    ) : isSiteVisit ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[8px] uppercase tracking-widest font-bold border border-primary/20 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Site Visit Intent
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-secondary text-[8px] uppercase tracking-widest font-medium">
                        {l.source}
                      </span>
                    )}
                  </div>

                  {/* Direct Contact Links */}
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-secondary/70">
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                        <Mail className="w-3.5 h-3.5" /> {l.email}
                      </a>
                    )}
                    {l.phone && (
                      <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:text-primary font-mono transition-colors">
                        <Phone className="w-3.5 h-3.5" /> {l.phone}
                      </a>
                    )}
                  </div>

                  {/* Intent / Application Details */}
                  {l.intent && (
                    <div className="mt-3 p-3.5 rounded-2xl bg-surface-container-low border border-outline/10 text-xs text-on-surface/85 font-mono whitespace-pre-wrap leading-relaxed">
                      {l.intent}
                    </div>
                  )}
                </div>

                {/* Status Switcher & Date */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="text-[10px] text-secondary/40 font-mono">
                    {l.createdAt
                      ? new Date(l.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'}
                  </p>
                  <select
                    value={l.status}
                    disabled={busy === l.id}
                    onChange={e => void setStatus(l.id, e.target.value as LeadStatus)}
                    className="text-xs bg-surface-container-low border border-outline/25 rounded-xl px-3 py-2 outline-none focus:border-primary disabled:opacity-50 font-bold"
                  >
                    <option value="new">New Lead</option>
                    <option value="contacted">Contacted</option>
                    <option value="site-visit">Site Visit Scheduled</option>
                    <option value="closed">Closed / Allotted</option>
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
