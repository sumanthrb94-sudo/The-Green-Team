'use client';

/** Property CRUD — create, edit, live/draft toggle, delete. Live properties join the public portfolio. */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminProperty } from '@/lib/server/admin-data';
import { CATEGORIES, STAGES, type Category, type Stage } from '@/lib/data/categories';

const EMPTY = {
  title: '',
  location: '',
  aqi: 20,
  noise: 25,
  commute: '',
  valuation: '',
  memberPrice: '',
  image: '',
  tagline: '',
  description: '',
  plotRange: '',
  amenityAcres: '',
  architect: '',
  pricePerSqYd: 0,
  brochureUrl: '',
  sitePlanSrc: '',
  order: 0,
  status: 'draft' as 'draft' | 'live',
  // Portal discovery — where this property is browsable. See lib/data/categories.ts.
  category: 'plots' as Category,
  stage: 'ongoing' as Stage,
  investment: true,
  features: [] as string[],
  plotImages: [] as string[],
};

type FormState = typeof EMPTY;

export function PropertiesManager({ initial }: { initial: AdminProperty[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [featInput, setFeatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(f => ({ ...f, [k]: v }));

  const openNew = () => {
    setForm(EMPTY);
    setEditing('new');
    setMsg('');
  };
  const openEdit = (p: AdminProperty) => {
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(p).filter(([k]) => k in EMPTY)) } as FormState);
    setEditing(p.id);
    setMsg('');
  };

  const save = async () => {
    if (!form.title || !form.location) {
      setMsg('Title and Location are required.');
      return;
    }
    setSaving(true);
    try {
      const res =
        editing === 'new'
          ? await fetch('/api/admin/properties', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            })
          : await fetch(`/api/admin/properties/${editing}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(form),
            });
      if (!res.ok) throw new Error((await res.json()).error ?? 'save failed');
      setEditing(null);
      router.refresh();
      const data = await res.json().catch(() => ({}));
      if (editing === 'new' && data.id) {
        setItems(xs => [{ ...(form as unknown as AdminProperty), id: data.id, createdAt: new Date().toISOString() }, ...xs]);
      } else {
        setItems(xs => xs.map(x => (x.id === editing ? { ...x, ...form } : x)));
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (p: AdminProperty) => {
    const status = p.status === 'live' ? 'draft' : 'live';
    setItems(xs => xs.map(x => (x.id === p.id ? { ...x, status } : x)));
    await fetch(`/api/admin/properties/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => router.refresh());
  };

  const remove = async (p: AdminProperty) => {
    if (!confirm(`Delete "${p.title}"? This cannot be undone.`)) return;
    setItems(xs => xs.filter(x => x.id !== p.id));
    await fetch(`/api/admin/properties/${p.id}`, { method: 'DELETE' }).catch(() => router.refresh());
  };

  const input =
    'w-full bg-surface-container-low border border-outline/25 rounded-2xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary transition-all';
  const label = 'block text-[9px] uppercase tracking-[0.4em] font-bold text-on-surface/50 mb-1.5';

  if (editing !== null) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface">{editing === 'new' ? 'Add Property' : 'Edit Property'}</h2>
          <button onClick={() => setEditing(null)} aria-label="Close" className="p-2 rounded-full hover:bg-primary/10">
            <X className="w-5 h-5 text-on-surface/60" />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Location *</label>
              <input value={form.location} onChange={e => set('location', e.target.value)} className={input} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={label}>AQI</label>
              <input type="number" value={form.aqi} onChange={e => set('aqi', Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>Noise (dB)</label>
              <input type="number" value={form.noise} onChange={e => set('noise', Number(e.target.value))} className={input} />
            </div>
            <div>
              <label className={label}>₹ / sq yd</label>
              <input type="number" value={form.pricePerSqYd} onChange={e => set('pricePerSqYd', Number(e.target.value))} className={input} />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Commute</label>
              <input value={form.commute} onChange={e => set('commute', e.target.value)} placeholder="40 mins to Financial District" className={input} />
            </div>
            <div>
              <label className={label}>Member Price</label>
              <input value={form.memberPrice} onChange={e => set('memberPrice', e.target.value)} placeholder="From ₹78 L" className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Cover Image URL</label>
            <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="/gallery/… or https://…" className={input} />
          </div>
          <div>
            <label className={label}>Gallery Images — one URL per line ({form.plotImages.length})</label>
            <textarea
              rows={4}
              value={form.plotImages.join('\n')}
              onChange={e => set('plotImages', e.target.value.split('\n').map(x => x.trim()).filter(Boolean))}
              placeholder={'/gallery/project/1.webp\n/gallery/project/2.webp'}
              className={input + ' font-mono text-xs'}
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Site Plan Image (optional)</label>
              <input value={form.sitePlanSrc} onChange={e => set('sitePlanSrc', e.target.value)} placeholder="/FINAL-LAYOUT.jpeg" className={input} />
            </div>
            <div>
              <label className={label}>Display Order</label>
              <input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Brochure URL</label>
            <input value={form.brochureUrl} onChange={e => set('brochureUrl', e.target.value)} placeholder="https://…" className={input} />
          </div>
          <div>
            <label className={label}>Tagline</label>
            <input value={form.tagline} onChange={e => set('tagline', e.target.value)} className={input} />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea rows={4} value={form.description} onChange={e => set('description', e.target.value)} className={input} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={label}>Sizes / Plot Range</label>
              <input value={form.plotRange} onChange={e => set('plotRange', e.target.value)} className={input} />
            </div>
            <div>
              <label className={label}>Developer</label>
              <input value={form.architect} onChange={e => set('architect', e.target.value)} className={input} />
            </div>
          </div>
          <div>
            <label className={label}>Features</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {form.features.map((f, i) => (
                <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs">
                  {f}
                  <button onClick={() => set('features', form.features.filter((_, idx) => idx !== i))} aria-label={`Remove ${f}`}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={featInput}
                onChange={e => setFeatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && featInput.trim()) {
                    set('features', [...form.features, featInput.trim()]);
                    setFeatInput('');
                  }
                }}
                placeholder="Add a feature and press Enter"
                className={input}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className={label}>Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value as Category)} className={input}>
                {CATEGORIES.filter(c => c.slug !== 'investments').map(c => (
                  <option key={c.slug} value={c.slug}>{c.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Stage</label>
              <select value={form.stage} onChange={e => set('stage', e.target.value as Stage)} className={input}>
                {STAGES.map(st => (
                  <option key={st.value} value={st.value}>{st.label} — {st.hint}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Investment page</label>
              <button
                type="button"
                onClick={() => set('investment', !form.investment)}
                className={cn(
                  'w-full px-4 py-3 rounded-2xl text-[9px] uppercase tracking-widest font-bold border transition-all',
                  form.investment ? 'bg-primary text-on-primary border-primary' : 'border-outline/30 text-secondary/60'
                )}
              >
                {form.investment ? 'Shown under Investments' : 'Not an investment listing'}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className={label + ' mb-0'}>Status</label>
            <button
              onClick={() => set('status', form.status === 'live' ? 'draft' : 'live')}
              className={cn(
                'px-4 py-2 rounded-full text-[9px] uppercase tracking-widest font-bold border transition-all',
                form.status === 'live'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline/30 text-secondary/60'
              )}
            >
              {form.status === 'live' ? 'Live' : 'Draft'}
            </button>
          </div>
          {msg && <p className="text-sm text-error">{msg}</p>}
          <div className="flex gap-3 pt-2">
            <button
              onClick={save}
              disabled={saving}
              className="px-8 py-3.5 rounded-2xl bg-primary text-on-primary text-[10px] uppercase tracking-[0.35em] font-bold hover:opacity-95 disabled:opacity-60 transition-all"
            >
              {saving ? 'Saving…' : 'Save Property'}
            </button>
            <button
              onClick={() => setEditing(null)}
              className="px-6 py-3.5 rounded-2xl border border-outline/25 text-[10px] uppercase tracking-[0.35em] font-bold text-secondary/70"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-secondary/60 max-w-md">
          Live properties appear on the home page and portfolio alongside the three flagship sanctuaries.
        </p>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="space-y-3">
        {items.length === 0 && (
          <p className="text-center py-16 text-secondary/40 text-sm">No Firestore properties yet — add your first one.</p>
        )}
        {items.map(p => (
          <div key={p.id} className="flex items-center gap-4 p-4 rounded-3xl bg-surface border border-outline/12">
            {p.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt="" className="w-16 h-16 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <span className="w-16 h-16 rounded-2xl bg-primary/10 flex-shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <p className="font-bold text-on-surface truncate">{p.title}</p>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[8px] uppercase tracking-widest font-bold',
                    p.status === 'live' ? 'bg-primary/15 text-primary' : 'bg-secondary/10 text-secondary/70'
                  )}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-secondary/60 truncate mt-0.5">
                {p.location} · AQI {p.aqi} · {p.memberPrice}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button onClick={() => void toggleStatus(p)} title={p.status === 'live' ? 'Unpublish' : 'Publish'}
                className="p-2.5 rounded-xl hover:bg-primary/10 text-secondary/60 hover:text-primary transition-all">
                {p.status === 'live' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => openEdit(p)} title="Edit"
                className="p-2.5 rounded-xl hover:bg-primary/10 text-secondary/60 hover:text-primary transition-all">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => void remove(p)} title="Delete"
                className="p-2.5 rounded-xl hover:bg-error/10 text-secondary/60 hover:text-error transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
