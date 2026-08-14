import { Download, Mail } from 'lucide-react';
import { fetchNewsletter } from '@/lib/server/admin-data';
import { NewsletterComposer } from '@/components/admin/NewsletterComposer';

export const dynamic = 'force-dynamic';

export default async function AdminNewsletterPage() {
  const subs = await fetchNewsletter();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">
          Newsletter <span className="text-secondary/50 font-normal text-lg">· {subs.length} subscribers</span>
        </h1>
        <a
          href="/api/admin/export?collection=newsletter"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-secondary/70 hover:text-on-surface transition-all"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </a>
      </div>
      <div className="mb-8">
        <NewsletterComposer subscriberCount={subs.length} />
      </div>
      <div className="space-y-2.5">
        {subs.map(n => (
          <div key={n.id} className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-outline/12">
            <div className="flex items-center gap-3 min-w-0">
              <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-on-surface truncate">{n.email}</p>
                <p className="text-[9px] uppercase tracking-widest text-secondary/50">{n.source}</p>
              </div>
            </div>
            <p className="text-[10px] text-secondary/40 flex-shrink-0">
              {n.createdAt
                ? new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })
                : '—'}
            </p>
          </div>
        ))}
        {subs.length === 0 && <p className="text-center py-16 text-secondary/40 text-sm">No subscribers yet.</p>}
      </div>
    </div>
  );
}
