import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// ─────────────────────────────────────────────────────────────
// 1. Add showAdminPanel state and wire onAdminClick to toggle it
// ─────────────────────────────────────────────────────────────

// Add showAdminPanel state next to showAdmin
app = app.replace(
  `  const [showAdmin, setShowAdmin] = useState(false);`,
  `  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);`
);

// Wire admin click to open panel instead of navigating to 'list'
app = app.replace(
  `            onAdminClick={() => setViewMode('list')} // Admin goes to property dashboard`,
  `            onAdminClick={() => { if (showAdmin) setShowAdminPanel(true); }}`
);

// ─────────────────────────────────────────────────────────────
// 2. Mount <AdminDashboard> in App() JSX - right before the NewsletterModal
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `      <NewsletterModal 
        isOpen={isNewsletterOpen} 
        onClose={() => setIsNewsletterOpen(false)}
        onSubscribe={() => setIsSubscribed(true)}
      />`,
  `      {/* Admin Dashboard Panel */}
      <AnimatePresence>
        {showAdminPanel && showAdmin && authUser && (
          <AdminDashboard
            onClose={() => setShowAdminPanel(false)}
            authUser={authUser}
            leads={adminLeads}
            newsletter={adminNewsletter}
            firestoreProps={firestoreProps}
            users={adminUsers}
          />
        )}
      </AnimatePresence>

      <NewsletterModal 
        isOpen={isNewsletterOpen} 
        onClose={() => setIsNewsletterOpen(false)}
        onSubscribe={() => setIsSubscribed(true)}
      />`
);

// Also refresh admin data when panel opens
app = app.replace(
  `  useEffect(() => { if (showAdmin) fetchAdminData(); }, [showAdmin, fetchAdminData]);`,
  `  useEffect(() => { if (showAdmin) fetchAdminData(); }, [showAdmin, fetchAdminData]);
  useEffect(() => { if (showAdminPanel && showAdmin) fetchAdminData(); }, [showAdminPanel, showAdmin, fetchAdminData]);`
);

// ─────────────────────────────────────────────────────────────
// 3. Add 'analytics' tab to AdminDashboard
// ─────────────────────────────────────────────────────────────

// Update the tab types
app = app.replace(
  `  const [tab, setTab] = useState<'properties' | 'leads' | 'newsletter' | 'users'>('properties');`,
  `  const [tab, setTab] = useState<'analytics' | 'properties' | 'leads' | 'newsletter' | 'users'>('analytics');`
);

// Update the tab list rendering
app = app.replace(
  `          {(['properties', 'leads', 'newsletter', 'users'] as const).map(t => (`,
  `          {(['analytics', 'properties', 'leads', 'newsletter', 'users'] as const).map(t => (`
);

// Update tab labels
app = app.replace(
  `              {t === 'properties' ? \`Props (\${firestoreProps.length})\`
               : t === 'leads' ? \`Leads (\${leads.length})\`
               : t === 'newsletter' ? \`News (\${newsletter.length})\`
               : \`Users (\${users.length})\`}`,
  `              {t === 'analytics' ? 'Analytics'
               : t === 'properties' ? \`Props (\${firestoreProps.length})\`
               : t === 'leads' ? \`Leads (\${leads.length})\`
               : t === 'newsletter' ? \`Subs (\${newsletter.length})\`
               : \`Users (\${users.length})\`}`
);

// ─────────────────────────────────────────────────────────────
// 4. Fix leads tab - show phone, email and proper icon
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `                  <p className="text-xs text-secondary/60 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />{l.email}
                  </p>`,
  `                  <p className="text-xs text-secondary/60 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" />{l.email}
                  </p>
                  {(l as any).phone && (
                    <p className="text-xs text-primary/70 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3" />{(l as any).phone}
                    </p>
                  )}`
);

// ─────────────────────────────────────────────────────────────
// 5. Insert analytics tab panel content before leads tab
// ─────────────────────────────────────────────────────────────
const leadsTabStart = `          {/* ── Leads Tab ── */}
          {tab === 'leads' && (`;

const analyticsTabInsert = `          {/* ── Analytics Tab ── */}
          {tab === 'analytics' && (
            <div className="p-6 space-y-6">
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold">Website Overview</p>
              
              {/* Key metrics */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total Leads', value: leads.length, sub: 'Adviser access requests', color: 'text-primary' },
                  { label: 'Newsletter Subs', value: newsletter.length, sub: 'Monthly briefing signups', color: 'text-gold' },
                  { label: 'Registered Users', value: users.length, sub: 'Google / Email signin', color: 'text-olive-800' },
                  { label: 'Live Properties', value: firestoreProps.filter(p => p.status === 'live').length, sub: 'Visible on site', color: 'text-green-600' },
                ].map(m => (
                  <div key={m.label} className="p-5 rounded-2xl border border-outline/10 bg-surface-container-low/30">
                    <p className={`text-3xl font-bold font-headline ${m.color}`}>{m.value}</p>
                    <p className="text-xs font-semibold text-on-surface mt-1">{m.label}</p>
                    <p className="text-[9px] text-secondary/40 mt-0.5">{m.sub}</p>
                  </div>
                ))}
              </div>

              {/* Lead sources breakdown */}
              {leads.length > 0 && (
                <div className="border border-outline/10 rounded-2xl p-5">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold mb-4">Recent Leads</p>
                  <div className="space-y-3 max-h-[240px] overflow-y-auto">
                    {leads.slice(0, 10).map(l => (
                      <div key={l.id} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs">
                          {(l.name?.[0] || '?').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{l.name}</p>
                          <p className="text-[10px] text-secondary/50 truncate">{l.email}</p>
                          {(l as any).phone && <p className="text-[10px] text-primary/60 font-medium">{(l as any).phone}</p>}
                        </div>
                        <p className="text-[9px] text-secondary/30 flex-shrink-0">
                          {l.createdAt ? new Date(l.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter sources */}
              {newsletter.length > 0 && (
                <div className="border border-outline/10 rounded-2xl p-5">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold mb-4">Newsletter Source Breakdown</p>
                  <div className="space-y-2">
                    {(['modal', 'inline', 'mobile_quick'] as const).map(src => {
                      const count = newsletter.filter(n => n.source === src).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / newsletter.length) * 100);
                      return (
                        <div key={src}>
                          <div className="flex justify-between text-[10px] mb-1">
                            <span className="text-secondary/60 capitalize">{src.replace('_', ' ')}</span>
                            <span className="font-bold text-on-surface">{count} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 bg-outline/10 rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: \`\${pct}%\` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {leads.length === 0 && newsletter.length === 0 && users.length === 0 && (
                <p className="text-center py-16 text-secondary/30 text-sm">No data yet. Leads will appear here as users engage with the site.</p>
              )}
            </div>
          )}

          {/* ── Leads Tab ── */}
          {tab === 'leads' && (`;

app = app.replace(leadsTabStart, analyticsTabInsert);

writeFileSync('src/App.tsx', app, 'utf8');
console.log("Admin dashboard fixes applied!");
