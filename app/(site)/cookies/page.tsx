import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { LegalPage, Clause } from '@/components/legal/LegalPage';
import { ConsentControls } from '@/components/legal/ConsentControls';
import { SITE_URL } from '@/lib/data/contact';
import { COOKIES, LEGAL } from '@/lib/data/legal';

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Every cookie and browser store this site uses, what each one does, how long it lasts, and how to change your choice.',
  alternates: { canonical: `${SITE_URL}/cookies` },
};

/**
 * The full list, and a control that actually changes the answer.
 *
 * A cookie policy that describes a choice but gives no way to revisit it is the
 * common failing, and under the DPDP Act withdrawing consent has to be as easy
 * as giving it — so the buttons are on the page, not just a description of a
 * banner the reader has already dismissed.
 */
export default function CookiePolicyPage() {
  const necessary = COOKIES.filter(c => c.kind === 'Strictly necessary');
  const analytics = COOKIES.filter(c => c.kind === 'Analytics');

  const Table = ({ rows }: { rows: typeof COOKIES }) => (
    <div className="overflow-x-auto my-4 -mx-2">
      <table className="w-full text-sm border-collapse min-w-[560px]">
        <thead>
          <tr className="border-b border-outline/30">
            {['Name', 'What it does', 'How long'].map(h => (
              <th key={h} className="text-left align-bottom py-2 pr-4 text-[9px] uppercase tracking-[0.2em] font-bold text-secondary/60">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(c => (
            <tr key={c.name} className="border-b border-outline/12 align-top">
              <td className="py-3 pr-4 font-mono text-xs text-on-surface whitespace-nowrap">{c.name}</td>
              <td className="py-3 pr-4">{c.why}</td>
              <td className="py-3 pr-4 whitespace-nowrap">{c.life}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <LegalPage
        title="Cookie Policy"
        intro="Every cookie this site sets, what it is for, and how to turn the optional ones off. There are fewer than you expect — we run no advertising trackers at all."
      >
        <Clause n="1" title="Your choice, right here">
          <p>
            Analytics is off until you accept it, and you can change your mind at any time without
            leaving this page.
          </p>
          <ConsentControls />
        </Clause>

        <Clause n="2" title="Strictly necessary — always on">
          <p>
            These make the site work. They carry no advertising identifier and are not shared with
            anyone. They cannot be switched off, because without them you could not stay signed in or
            keep your own settings.
          </p>
          <Table rows={necessary} />
        </Clause>

        <Clause n="3" title="Analytics — only if you accept">
          <p>
            These count visits and show us which pages fail. They are set only after you accept them,
            and refusing costs you nothing on this site.
          </p>
          <Table rows={analytics} />
          <p>
            We also record page views on our own servers, which is what the Admin → Analytics screen
            reads. That record holds the page, the referring site, your device type, coarse location
            and a rotating identifier — and a one-way hash of your IP address, never the address
            itself. It runs under the same consent, and it stops when you refuse.
          </p>
        </Clause>

        <Clause n="4" title="Things that are not cookies">
          <p>
            A few preferences live in your browser&rsquo;s own storage and are never sent to us at
            all: whether you have seen the opening animation, whether you dismissed a prompt, and
            what you shortlisted. Clearing your browser data removes them.
          </p>
          <p>
            Maps load tiles from OpenStreetMap and CARTO, and sign-in uses Google reCAPTCHA. Those
            requests reveal your IP address to those providers, as any request to any server does.
            The{' '}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>{' '}
            lists every provider and links to each of their policies.
          </p>
        </Clause>

        <Clause n="5" title="Controlling cookies in your browser">
          <p>
            Every browser lets you block or delete cookies in its settings. Blocking the strictly
            necessary ones will sign you out and may break parts of the site — that is a consequence
            of the block, not a fault.
          </p>
          <p>
            Questions go to {LEGAL.dpo.title} {LEGAL.dpo.name} at{' '}
            <a href={`mailto:${LEGAL.dpo.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.dpo.email}
            </a>
            .
          </p>
        </Clause>
      </LegalPage>
      <Footer />
    </>
  );
}
