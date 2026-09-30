import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, FileText, CheckCircle2, AlertCircle, Scale, Building2, Lock, Download, ArrowRight, ExternalLink } from 'lucide-react';
import { LEGAL, LEGAL_LINKS } from '@/lib/data/legal';
import { BUSINESS, SITE_URL, WHATSAPP } from '@/lib/data/contact';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'RERA Standing & Entry-to-Exit Compliance Manifesto',
  description:
    'Regulatory governance, TG-RERA facilitation standing, 30-year land title vetting protocol, and buyer entry-to-exit agreement framework for The Green Team.',
  alternates: { canonical: `${SITE_URL}/compliance` },
};

export default function CompliancePage() {
  return (
    <>
      <div className="pt-24 md:pt-28 pb-20 px-6 md:px-14 bg-surface">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
              Governance · TG-RERA · Legal Architecture
            </span>
            <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl text-on-surface leading-[1.02]">
              Compliance, Governance & <br />
              <span className="text-primary">Entry-to-Exit Protection.</span>
            </h1>
            <p className="text-lg font-light text-secondary leading-relaxed mt-5 max-w-3xl">
              We operate exclusively as an institutional channel partner and ecological real estate advisory. Every
              sanctuary listed on this platform is governed by statutory Telangana RERA guidelines, non-agricultural
              clear titles, and direct-to-escrow payments.
            </p>
          </div>

          {/* RERA Standing Status Card */}
          <div className="mb-14 p-8 rounded-3xl bg-[#0a1208] text-white border border-[#c8a951]/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c8a951]/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-[#c8a951]/20 flex items-center justify-center text-[#c8a951]">
                  <Scale className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#c8a951]">
                    Regulatory Status · Telangana RERA
                  </h3>
                  <p className="text-xs text-white/50">{LEGAL.reraAuthority}</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-[10px] uppercase tracking-widest font-bold border border-white/15">
                <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
                Application Form G Filed · In Process
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Entity Details</p>
                <p className="text-base font-medium text-white">{LEGAL.entityName}</p>
                <p className="text-xs text-white/60 mt-1">{LEGAL.entityType}</p>
                <p className="text-xs font-mono text-[#c8a951] mt-1">{LEGAL.cin}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">RERA Filing Reference</p>
                <p className="text-base font-mono font-bold text-white">{LEGAL.reraAgentRegNo}</p>
                <p className="text-xs text-white/60 mt-1">Official Portal: <a href={LEGAL.reraWebsite} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{LEGAL.reraWebsite}</a></p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-white/10 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#a3b18a] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-white/75 leading-relaxed">
                <strong>Statutory Zero-Monies Policy:</strong> In strict compliance with Section 9 and Section 10 of RERA 2016,
                The Green Team does not collect or hold client purchase funds. All expressions of interest, booking tokens,
                and milestone installments are deposited directly into the developer’s designated TG-RERA 70% Escrow Bank Account.
              </p>
            </div>
          </div>

          {/* Complete Entry-to-Exit Roadmap */}
          <div className="mb-16">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-3 block">
              The Journey
            </span>
            <h2 className="font-headline font-extrabold text-3xl md:text-4xl text-on-surface mb-8">
              End-to-End Buyer & Investor Protection
            </h2>

            <div className="space-y-6">
              {[
                {
                  step: '01',
                  title: 'Ecological & Title Due Diligence',
                  tag: 'Entry Phase',
                  desc: 'Every sanctuary features live on-site sensor recordings (AQI under 25, ambient noise under 25 dB) and a 30-year unbroken chain of title authenticated through the Telangana Dharani revenue portal.',
                  checklist: ['72-hr AQI & Acoustic logging', 'Dharani Passbook & e-Pahani / 1B verification', 'Section 22A Prohibited Land search'],
                },
                {
                  step: '02',
                  title: 'Expression of Interest (EOI) & Allotment Intent',
                  tag: 'Reservation Phase',
                  desc: 'Reservation token strictly capped at statutory limits (maximum 10% under RERA 2016 s.13(1)), paid directly to the builder’s TG-RERA project escrow account with a 15-day free-look refund window.',
                  checklist: ['Formal EOI Term Sheet issued', 'Direct Escrow RTGS/NEFT transaction', '100% money-back review guarantee'],
                },
                {
                  step: '03',
                  title: 'Execution of Statutory Agreement to Sell (ATS)',
                  tag: 'Contractual Phase',
                  desc: 'Bi-partite or tri-partite Agreement to Sell drafted in compliance with TG-RERA Model Agreement rules, detailing carpet/sq-yd measurements, construction schedule, and delay interest penalties.',
                  checklist: ['Model Agreement format compliance', 'Milestone-linked construction payment schedule', 'Encumbrance Certificate (Form 15) attached'],
                },
                {
                  step: '04',
                  title: 'Construction Milestone & Escrow Oversight',
                  tag: 'Execution Phase',
                  desc: 'Installment payments are unlocked only against Architect & Chartered Engineer certificates submitted to TG-RERA quarterly filings, ensuring zero diversion of capital.',
                  checklist: ['Quarterly RERA progress monitoring', 'On-site drone & photo updates', 'Zero cash transactions policy'],
                },
                {
                  step: '05',
                  title: 'SRO Conveyance & Lifetime Exit Desk',
                  tag: 'Exit & Secondary Liquidity',
                  desc: 'Execution of the final registered Sale Deed at the local Sub-Registrar Office (SRO). Post-handover, owners gain access to our exclusive Secondary Resale & Rental Management Desk.',
                  checklist: ['SRO registration & mutation support', 'Society handover & maintenance setup', 'The Green Team Secondary Resale Liquidity Desk'],
                },
              ].map((item) => (
                <div key={item.step} className="p-6 md:p-8 rounded-3xl border border-outline/15 bg-surface-container-low hover:border-primary/40 transition-colors">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-primary tracking-widest uppercase">
                      Phase {item.step} · {item.tag}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest">
                      Protected
                    </span>
                  </div>
                  <h3 className="font-headline font-bold text-xl md:text-2xl text-on-surface mb-2">
                    {item.title}
                  </h3>
                  <p className="text-secondary/80 text-sm md:text-base leading-relaxed mb-4">
                    {item.desc}
                  </p>
                  <ul className="grid sm:grid-cols-3 gap-2.5 pt-3 border-t border-outline/10">
                    {item.checklist.map((c) => (
                      <li key={c} className="flex items-center gap-2 text-xs text-on-surface/85">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 30-Year Title Due Diligence Protocol */}
          <div className="mb-16 p-8 md:p-10 rounded-3xl bg-surface border border-outline/15 shadow-sm">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-3 block">
              Title Due Diligence
            </span>
            <h2 className="font-headline font-extrabold text-2xl md:text-3xl text-on-surface mb-4">
              The 30-Year Telangana Land Audit Checklist
            </h2>
            <p className="text-secondary text-sm leading-relaxed mb-6">
              Telangana land titles require rigorous multi-layer verification due to historical revenue records and Dharani conversions. Every property onboarded with us undergoes:
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { title: 'Dharani ROR 1B & e-Pahani', desc: 'Continuous 30-year ownership pedigree verifying absence of government, assigned, or waqf listings under Section 22A.' },
                { title: 'NALA Conversion Sanction', desc: 'Statutory Non-Agricultural Land Assessment conversion order from RDO/Competent Revenue Authority.' },
                { title: 'HMDA / DTCP Final Sanction', desc: 'Technical layout sanction confirming mortgaged plot release and handover of civic open spaces.' },
                { title: 'WALTA & Water Body NOC', desc: 'Irrigation & Revenue verification confirming location outside lake Full Tank Level (FTL) and buffer zones.' },
                { title: 'Forest Department Buffer NOC', desc: 'Demarcation certificate confirming clear boundaries without encroaching on reserve forest zones.' },
                { title: '30-Year Nil Encumbrance (Form 15)', desc: 'Search of Sub-Registrar Office records verifying clear marketable title free of any mortgages or legal attachments.' },
              ].map((c) => (
                <div key={c.title} className="p-4.5 rounded-2xl bg-surface-container-low border border-outline/10">
                  <h4 className="font-bold text-sm text-on-surface flex items-center gap-2 mb-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#c8a951]" />
                    {c.title}
                  </h4>
                  <p className="text-xs text-secondary/75 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Developer / Supply Onboarding Call to Action */}
          <div className="p-8 md:p-10 rounded-3xl bg-forest-section text-white flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <span className="text-[#c8a951] text-[10px] font-bold uppercase tracking-[0.5em] mb-2 block">
                For Developers & Landowners
              </span>
              <h3 className="font-headline font-extrabold text-2xl md:text-3xl text-white">
                Have a verified sanctuary parcel?
              </h3>
              <p className="text-white/65 text-sm mt-2 max-w-xl">
                Submit your project to our legal and ecological onboarding audit. Only projects with verified TG-RERA registrations and clear titles are admitted.
              </p>
            </div>
            <Link
              href="/onboard"
              className="px-8 py-4 rounded-full bg-[#c8a951] text-[#1a1a0a] text-xs uppercase tracking-[0.25em] font-bold hover:bg-[#d4a72c] transition-all whitespace-nowrap flex items-center gap-2"
            >
              Start Property Onboarding <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Footer links */}
          <div className="mt-12 pt-8 border-t border-outline/15 flex flex-wrap items-center justify-between gap-4 text-xs text-secondary/60">
            <span>© {new Date().getFullYear()} {LEGAL.entityName}</span>
            <div className="flex gap-4">
              {LEGAL_LINKS.map(l => (
                <Link key={l.href} href={l.href} className="hover:text-primary transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
