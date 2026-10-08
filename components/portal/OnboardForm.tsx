'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Building2, MapPin, Scale, FileText } from 'lucide-react';
import { track, markConverted } from '@/lib/analytics';
import { attribution } from '@/lib/analytics/attribution';
import { CollectionNotice } from '@/components/legal/CollectionNotice';

export function OnboardForm() {
  const [form, setForm] = useState({
    developerName: '',
    projectName: '',
    location: '',
    landExtent: '',
    assetType: 'plots',
    approvalStatus: 'hmda',
    reraNumber: '',
    contactName: '',
    phone: '',
    email: '',
    driveLink: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.contactName.trim() || !form.phone.trim() || !form.projectName.trim()) {
      setError('Please provide project name, your name, and mobile number.');
      return;
    }

    setLoading(true);
    setError('');

    const intentText = `[PROPERTY ONBOARDING APPLICATION]
Developer Entity: ${form.developerName || 'N/A'}
Project Name: ${form.projectName}
Location: ${form.location}
Extent: ${form.landExtent}
Asset Type: ${form.assetType}
Planning Approval: ${form.approvalStatus}
TG-RERA Registration: ${form.reraNumber || 'Pending / In-Process'}
Master Plan Link: ${form.driveLink || 'N/A'}
Notes: ${form.notes || 'N/A'}`;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.contactName.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          interest: 'list-property',
          source: 'property-onboard',
          intent: intentText,
          attribution: attribution(),
        }),
      });

      if (!res.ok) {
        throw new Error('Submission failed');
      }

      setDone(true);
      track.lead('property-onboard');
      markConverted('lead');
    } catch {
      setError('Unable to submit onboarding application right now. Please message us on WhatsApp or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="p-8 rounded-2xl bg-primary/10 border border-primary/20 text-center">
        <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="font-headline font-bold text-2xl text-on-surface mb-2">
          Onboarding Dossier Received
        </h3>
        <p className="text-secondary text-sm max-w-md mx-auto leading-relaxed">
          Thank you for submitting <strong>{form.projectName}</strong>. Our legal and technical team will
          review the zoning, title records, and TG-RERA status and get in touch within 48 business hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 rounded-xl bg-error/10 border border-error/25 text-error text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Entity & Project */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Developer / Landowner Entity
          </label>
          <input
            type="text"
            required
            value={form.developerName}
            onChange={e => update('developerName', e.target.value)}
            placeholder="e.g. MODCON Builders / Private Owner"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Project / Sanctuary Name *
          </label>
          <input
            type="text"
            required
            value={form.projectName}
            onChange={e => update('projectName', e.target.value)}
            placeholder="e.g. Agartha Eco-Estates"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Row 2: Location & Land Extent */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Location & Corridor *
          </label>
          <input
            type="text"
            required
            value={form.location}
            onChange={e => update('location', e.target.value)}
            placeholder="e.g. Janakampet, Narsapur Forest boundary"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Land Parcel Extent *
          </label>
          <input
            type="text"
            required
            value={form.landExtent}
            onChange={e => update('landExtent', e.target.value)}
            placeholder="e.g. 25 Acres / 37 Villa Plots"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Row 3: Asset Class & Approvals */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Asset Class
          </label>
          <select
            value={form.assetType}
            onChange={e => update('assetType', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          >
            <option value="plots">Forest Farm Plots / Farmland</option>
            <option value="villas">Eco-Villas & Villaments</option>
            <option value="apartments">Apartments / High-Rise</option>
            <option value="retreats">Earthen Retreats / Agro-Estates</option>
            <option value="commercial">Office / Commercial Space</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Planning Sanction
          </label>
          <select
            value={form.approvalStatus}
            onChange={e => update('approvalStatus', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          >
            <option value="hmda">HMDA Approved Layout</option>
            <option value="dtcp">DTCP Approved Layout</option>
            <option value="uda">UDA / Regional Authority Approved</option>
            <option value="in-process">In Process / Applied</option>
          </select>
        </div>
      </div>

      {/* Row 4: TG-RERA Registration & Drive Link */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            TG-RERA Project Reg. No.
          </label>
          <input
            type="text"
            value={form.reraNumber}
            onChange={e => update('reraNumber', e.target.value)}
            placeholder="e.g. P02400002648 or In-Process"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all font-mono"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Brochure / Master Plan Link (Drive/Dropbox)
          </label>
          <input
            type="url"
            value={form.driveLink}
            onChange={e => update('driveLink', e.target.value)}
            placeholder="https://drive.google.com/..."
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Row 5: Contact Details */}
      <div className="grid sm:grid-cols-3 gap-4 pt-3 border-t border-outline/10">
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Authorized Contact Name *
          </label>
          <input
            type="text"
            required
            value={form.contactName}
            onChange={e => update('contactName', e.target.value)}
            placeholder="Full Name"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Mobile Number *
          </label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={e => update('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
            Official Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={e => update('email', e.target.value)}
            placeholder="developer@company.com"
            className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest font-bold text-secondary/70 mb-1.5">
          Project Notes / Forest Adjacency Details
        </label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={e => update('notes', e.target.value)}
          placeholder="Brief details regarding forest distance, water source, trees, or development timeline..."
          className="w-full px-4 py-3 rounded-xl border border-outline/20 bg-surface-container-low text-sm text-on-surface focus:outline-none focus:border-primary transition-all"
        />
      </div>

      <CollectionNotice />

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 rounded-full bg-primary text-on-primary text-xs uppercase tracking-[0.25em] font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Submitting Application...' : 'Submit Project for Vetting'}
      </button>
    </form>
  );
}
