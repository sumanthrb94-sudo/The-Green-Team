import type { Metadata } from 'next';
import { OnboardForm } from '@/components/portal/OnboardForm';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';
import { ShieldCheck, Wind, FileCheck, Layers, Scale, Sparkles, Building2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Property Onboarding — List a Verified Sanctuary with The Green Team',
  description:
    'Developer and landowner onboarding portal. Submit your forest-adjacent project near Hyderabad for our 6-pillar environmental, legal title and TG-RERA curation audit.',
  alternates: { canonical: `${SITE_URL}/onboard` },
};

export default function OnboardPage() {
  return (
    <>
      <section className="pt-24 md:pt-28 pb-12 px-6 md:px-14 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
              Supply-Side Engine · Developers & Landowners
            </span>
            <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl text-on-surface leading-[0.98]">
              Onboard your project to <br />
              <span className="text-primary italic">The Green Team standard.</span>
            </h1>
            <p className="text-base md:text-lg font-light text-secondary leading-relaxed mt-5">
              We curate a select handful of forest-adjacent enclaves near Hyderabad. If your development clears our
              six-stage environmental, title, and TG-RERA compliance audit, it gains direct access to high-intent buyers
              seeking authentic ecological sanctuaries.
            </p>
          </div>

          {/* The 5 Curation Gates */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12 mb-14">
            {[
              {
                step: '01',
                title: 'Dharani & Title',
                desc: '30-year unbroken ownership chain, NALA conversion order & nil encumbrance.',
                Icon: FileCheck,
              },
              {
                step: '02',
                title: 'TG-RERA Sanction',
                desc: 'Valid project registration on rera.telangana.gov.in with 70% escrow compliance.',
                Icon: Scale,
              },
              {
                step: '03',
                title: 'Sensor Vetting',
                desc: 'On-site sensor audit verifying AQI under 25 and ambient noise under 25 dB.',
                Icon: Wind,
              },
              {
                step: '04',
                title: 'Master Plan',
                desc: 'Biophilic architecture, minimum 40% open green cover, and water sustainability.',
                Icon: Layers,
              },
            ].map(({ step, title, desc, Icon }) => (
              <div
                key={step}
                className="p-5 rounded-2xl border border-outline/12 bg-surface-container-low flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold text-primary tracking-widest uppercase">
                      Gate {step}
                    </span>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-headline font-bold text-base text-on-surface mb-1.5">{title}</h3>
                  <p className="text-xs text-secondary/75 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Interactive Onboarding Form Card */}
          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-10 items-start">
            <div className="p-6 md:p-10 rounded-3xl bg-surface border border-outline/15 shadow-xl">
              <div className="mb-8">
                <span className="text-primary text-[9px] font-bold uppercase tracking-[0.3em] block mb-1">
                  Intake Dossier
                </span>
                <h2 className="font-headline font-bold text-2xl text-on-surface">
                  Project Onboarding Application
                </h2>
                <p className="text-xs text-secondary mt-1">
                  Reviewed by our technical and legal team within 48 hours. Zero public listing fees.
                </p>
              </div>

              <OnboardForm />
            </div>

            {/* Sidebar Assurance */}
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-[#0a1208] text-white border border-[#c8a951]/20">
                <span className="text-[9px] uppercase tracking-widest text-[#c8a951] font-bold block mb-2">
                  Institutional Channel Partner
                </span>
                <h3 className="font-headline font-bold text-xl text-white mb-2">
                  TG-RERA Compliant Model
                </h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  The Green Team executes formal bilateral Channel Partner agreements under RERA 2016 guidelines. 
                  All client consideration is transferred directly to your designated 70% Escrow Bank Account.
                </p>
                <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-[#a3b18a]">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>Transparent escrow milestone releases</span>
                </div>
              </div>

              <div className="p-6 rounded-3xl border border-outline/15 bg-surface-container-low">
                <h4 className="font-bold text-sm text-on-surface mb-2">Documents to keep ready:</h4>
                <ul className="space-y-2 text-xs text-secondary/80">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>HMDA / DTCP Final Layout Approval copy</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>TG-RERA Project Certificate (`P024...`)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>Dharani Passbook / Revenue Patta extract</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>High-resolution Master Plan layout & renders</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
