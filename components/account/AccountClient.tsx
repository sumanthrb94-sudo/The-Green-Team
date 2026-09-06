'use client';

/**
 * The account page — the profile section that was missing.
 *
 * Until now the only chance to give a name or an email was the one-shot modal
 * at sign-up: skip it, or sign up before it asked, and there was no way back.
 * A phone member could be stranded with no address on file forever. This is
 * that way back, and it is also where a member checks what we hold on them.
 *
 * Fields the provider verified are shown but locked — a Google address and an
 * OTP-verified number are identity, not preferences.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, LogOut, ShieldCheck, Lock, AlertCircle, ArrowRight, Mail, Download, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { cn } from '@/lib/utils';

interface Profile {
  name: string; email: string; emailLocked: boolean;
  phone: string; phoneLocked: boolean; city: string; occupation: string;
  subscribed: boolean;
}

const EMPTY: Profile = {
  name: '', email: '', emailLocked: false, phone: '', phoneLocked: false,
  city: '', occupation: '', subscribed: false,
};

export function AccountClient() {
  const { user, authReady, openAuth, signOutUser, isAdmin, refreshUser } = useAuth();
  const [p, setP] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [mailBusy, setMailBusy] = useState(false);
  const [rightsBusy, setRightsBusy] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      const t = await user.getIdToken();
      const r = await fetch('/api/profile', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setP({ ...EMPTY, ...(await r.json()) });
    } catch {
      setError('Could not load your profile. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { setLoading(false); return; }
    void load();
  }, [authReady, user, load]);

  /** The briefing lives here and nowhere else on the site, so this toggle is
   *  the whole subscription UI. The address is never sent — the server reads it
   *  from the token, so nobody can subscribe anyone but themselves. */
  const toggleBriefing = async () => {
    if (!user) return;
    setMailBusy(true);
    setError('');
    try {
      const t = await user.getIdToken();
      const r = await fetch('/api/newsletter', {
        method: p.subscribed ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      });
      if (!r.ok) throw new Error();
      const data = await r.json();
      setP(x => ({ ...x, subscribed: Boolean(data.subscribed) }));
    } catch {
      setError('Could not change that just now. Please try again.');
    } finally {
      setMailBusy(false);
    }
  };

  /** DPDP s.11 — the summary of what we hold, as a file, right now. */
  const exportData = async () => {
    if (!user) return;
    setRightsBusy('export');
    try {
      const t = await user.getIdToken();
      const r = await fetch('/api/me', { headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) throw new Error();
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `green-team-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Could not build your file. Please try again.');
    } finally {
      setRightsBusy('');
    }
  };

  /** DPDP s.12(3) — erasure. Irreversible, so it asks once. */
  const deleteAccount = async () => {
    if (!user) return;
    setRightsBusy('delete');
    try {
      const t = await user.getIdToken();
      const r = await fetch('/api/me', { method: 'DELETE', headers: { Authorization: `Bearer ${t}` } });
      if (!r.ok) throw new Error();
      const data = await r.json();
      const kept = data.retained
        ? `\n\nWe have kept ${data.retained.count} ${data.retained.what}: ${data.retained.why}`
        : '';
      alert(`Your account has been deleted.\n\nRemoved: ${(data.removed ?? []).join(', ')}.${kept}`);
      await signOutUser();
      window.location.href = '/';
    } catch {
      setError('Could not delete your account. Please write to us and we will do it by hand.');
      setRightsBusy('');
    }
  };

  const set = (k: keyof Profile, v: string) => { setP(x => ({ ...x, [k]: v })); setSaved(false); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const mail = p.email.trim().toLowerCase();
    if (!p.emailLocked && mail && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      setError("That email doesn't look right.");
      return;
    }
    setError(''); setSaving(true);
    try {
      const t = await user.getIdToken();
      const r = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({
          ...(p.name.trim() ? { name: p.name.trim() } : {}),
          ...(!p.emailLocked && mail ? { email: mail } : {}),
          ...(!p.phoneLocked && p.phone.trim() ? { phone: p.phone.trim() } : {}),
          ...(p.city.trim() ? { city: p.city.trim() } : {}),
          ...(p.occupation.trim() ? { occupation: p.occupation.trim() } : {}),
        }),
      });
      if (!r.ok) throw new Error();
      setSaved(true);
      await refreshUser();
      await load();
    } catch {
      setError('Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!authReady || (user && loading)) {
    return <div className="max-w-2xl mx-auto px-6 py-24 text-secondary/60 text-sm">Loading your profile…</div>;
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <h1 className="font-headline font-extrabold tracking-[-0.02em] text-3xl md:text-4xl text-on-surface">Your account</h1>
        <p className="text-secondary mt-3 mb-8">Sign in to see your details, and to save shortlists across visits.</p>
        <button
          onClick={openAuth}
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.35em] font-bold hover:opacity-90 transition-all"
        >
          Sign in / Join <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const input = 'w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3.5 text-sm text-on-surface placeholder:text-secondary/40 outline-none focus:border-primary/60 transition-all';
  const locked = 'w-full bg-surface-container/60 border border-outline/12 rounded-2xl px-4 py-3.5 text-sm text-on-surface/70 flex items-center justify-between gap-3';
  const label = 'block text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/50 mb-2';

  return (
    <div className="max-w-2xl mx-auto px-6 py-16 md:py-20">
      <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
        {isAdmin ? 'Admin' : 'Member'}
      </span>
      <h1 className="font-headline font-extrabold tracking-[-0.02em] text-3xl md:text-5xl text-on-surface leading-tight">
        Your profile
      </h1>
      <p className="text-secondary mt-3">
        What we hold on you, and what your adviser uses to reach you. Change anything, any time.
      </p>

      {!p.email && (
        <div className="mt-8 flex items-start gap-3 p-5 rounded-2xl bg-gold/10 border border-gold/25">
          <AlertCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
          <p className="text-sm text-on-surface/85 leading-relaxed">
            <strong>We have no email for you.</strong> Add one below and we can send pricing sheets, your site-visit
            confirmations and the monthly note. Without it we can only reach you by phone.
          </p>
        </div>
      )}

      <form onSubmit={save} className="mt-8 space-y-5">
        <div>
          <label htmlFor="ac-name" className={label}>Full name</label>
          <input id="ac-name" value={p.name} onChange={e => set('name', e.target.value)} placeholder="Your name" autoComplete="name" className={input} />
        </div>

        <div>
          <label htmlFor="ac-email" className={label}>Email</label>
          {p.emailLocked ? (
            <div className={locked}>
              <span className="truncate">{p.email}</span>
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-secondary/50 flex-shrink-0">
                <Lock className="w-3 h-3" /> Verified
              </span>
            </div>
          ) : (
            <input id="ac-email" type="email" value={p.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" autoComplete="email" className={input} />
          )}
        </div>

        <div>
          <label htmlFor="ac-phone" className={label}>Phone</label>
          {p.phoneLocked ? (
            <div className={locked}>
              <span className="truncate">{p.phone}</span>
              <span className="flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-secondary/50 flex-shrink-0">
                <Lock className="w-3 h-3" /> Verified
              </span>
            </div>
          ) : (
            <input id="ac-phone" type="tel" value={p.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98xxx xxxxx" autoComplete="tel" className={input} />
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <label htmlFor="ac-city" className={label}>City</label>
            <input id="ac-city" value={p.city} onChange={e => set('city', e.target.value)} placeholder="Hyderabad" className={input} />
          </div>
          <div>
            <label htmlFor="ac-occ" className={label}>Occupation</label>
            <input id="ac-occ" value={p.occupation} onChange={e => set('occupation', e.target.value)} placeholder="Optional" className={input} />
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className={cn(
              'inline-flex items-center gap-2 px-8 py-3.5 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all disabled:opacity-60',
              saved ? 'bg-primary/15 text-primary' : 'bg-primary text-on-primary hover:opacity-90',
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved</> : saving ? 'Saving…' : 'Save changes'}
          </button>
          {isAdmin && (
            <Link href="/admin" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-primary/20 transition-all">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full border border-outline/25 text-secondary/70 text-[10px] uppercase tracking-[0.3em] font-bold hover:text-on-surface transition-all"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </form>

      {/* ── The monthly briefing — the only place on the site it is offered ── */}
      <div className="mt-10 pt-8 border-t border-outline/12">
        <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
          <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Mail className="w-5 h-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface">The monthly briefing</p>
            <p className="text-sm text-secondary mt-1 leading-relaxed">
              Air and noise readings, new curations and honest price movement. Once a month, nothing else
              {p.email ? <> — to <span className="text-on-surface/80">{p.email}</span>.</> : '.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void toggleBriefing()}
            disabled={mailBusy || !p.email}
            className={cn(
              'px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.3em] font-bold transition-all disabled:opacity-50 flex-shrink-0',
              p.subscribed
                ? 'border border-outline/25 text-secondary/70 hover:text-on-surface'
                : 'bg-primary text-on-primary hover:opacity-90',
            )}
          >
            {mailBusy ? '…' : p.subscribed ? 'Unsubscribe' : 'Subscribe'}
          </button>
        </div>
        {!p.email && (
          <p className="mt-3 text-xs text-secondary/60">Add an email above to subscribe.</p>
        )}
      </div>

      {/* ── Your data, and the two rights that need a button ─────────────── */}
      <div className="mt-10 pt-8 border-t border-outline/12">
        <p className="text-sm font-bold text-on-surface">Your data</p>
        <p className="text-sm text-secondary mt-1 mb-5 leading-relaxed">
          Under the Digital Personal Data Protection Act you can see everything we hold on you, and
          have it erased. Both happen here, immediately — you do not have to write to anyone.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void exportData()}
            disabled={rightsBusy !== ''}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-outline/25 text-on-surface/80 text-[10px] uppercase tracking-[0.28em] font-bold hover:border-primary/50 hover:text-on-surface transition-all disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            {rightsBusy === 'export' ? 'Preparing…' : 'Download my data'}
          </button>
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => void deleteAccount()}
                disabled={rightsBusy !== ''}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-error text-white text-[10px] uppercase tracking-[0.28em] font-bold hover:opacity-90 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {rightsBusy === 'delete' ? 'Deleting…' : 'Yes, delete permanently'}
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="text-[10px] uppercase tracking-[0.28em] font-bold text-secondary/70 hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-error/30 text-error text-[10px] uppercase tracking-[0.28em] font-bold hover:bg-error/8 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete my account
            </button>
          )}
        </div>
        {confirmDelete && (
          <p className="text-xs text-secondary mt-4 leading-relaxed max-w-prose">
            This removes your profile, your chat transcripts and your place on the briefing list, and
            signs you out for good. It cannot be undone. Enquiry records are kept for three years —
            they are the record of an introduction we made — and the{' '}
            <Link href="/privacy#c6" className="text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>{' '}
            explains why.
          </p>
        )}
      </div>

      <p className="mt-10 text-xs text-secondary/60 leading-relaxed">
        We use this only to answer you and to send what you asked for. We never sell your details.{' '}
        <Link href="/contact" className="text-primary hover:underline underline-offset-4">Ask us to delete them</Link> at any time.
      </p>
    </div>
  );
}
