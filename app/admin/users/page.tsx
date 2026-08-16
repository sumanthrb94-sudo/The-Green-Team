import { Download, MapPin } from 'lucide-react';
import { fetchUsers } from '@/lib/server/admin-data';

export const dynamic = 'force-dynamic';

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—';

export default async function AdminUsersPage() {
  const users = await fetchUsers();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-on-surface">
          Users <span className="text-secondary/50 font-normal text-lg">· {users.length} registered</span>
        </h1>
        <a
          href="/api/admin/export?collection=users"
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-secondary/70 hover:text-on-surface transition-all"
        >
          <Download className="w-3.5 h-3.5" /> CSV
        </a>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        {users.map(u => (
          <div key={u.id} className="p-5 rounded-3xl bg-surface border border-outline/12">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {u.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={u.photoURL} referrerPolicy="no-referrer" alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
                    {(u.name?.[0] || u.displayName?.[0] || u.email?.[0] || '?').toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{u.name || u.displayName || '—'}</p>
                  <p className="text-xs text-secondary/60 truncate">{u.email}</p>
                </div>
              </div>
              {u.lat !== undefined && u.lng !== undefined && (
                <a
                  href={`https://www.openstreetmap.org/?mlat=${u.lat}&mlon=${u.lng}#map=14/${u.lat}/${u.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary text-[8px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/20 transition-all"
                >
                  <MapPin className="w-2.5 h-2.5" /> Map
                </a>
              )}
            </div>
            {(u.occupation || u.city) && (
              <p className="mt-3 text-xs text-secondary/70">{[u.occupation, u.city].filter(Boolean).join(' · ')}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[10px] text-secondary/40">
              <span>First seen: {fmt(u.firstSignIn)}</span>
              <span>Last seen: {fmt(u.lastSeen)}</span>
              {u.lat !== undefined && u.lng !== undefined && (
                <span className="font-mono">
                  {u.lat.toFixed(4)}, {u.lng.toFixed(4)}
                  {u.locationAccuracy ? ` ±${Math.round(u.locationAccuracy)}m` : ''}
                </span>
              )}
            </div>
          </div>
        ))}
        {users.length === 0 && <p className="text-center py-16 text-secondary/40 text-sm md:col-span-2">No users yet.</p>}
      </div>
    </div>
  );
}
