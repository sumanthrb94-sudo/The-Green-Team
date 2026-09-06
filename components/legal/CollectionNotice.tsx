import Link from 'next/link';
import { COLLECTION_NOTICE } from '@/lib/data/legal';

/**
 * The notice that has to be where the data is actually given up.
 *
 * DPDP s.5 wants it accompanying or preceding the request for consent, in clear
 * and plain language. A footer link to a policy is not that — this sits beside
 * the button, in the two sentences a person will actually read, and it is the
 * same text whose version gets stamped onto the record the form creates.
 *
 * There is no checkbox. Submitting a form you filled in yourself, under a notice
 * that says what happens next, is the clear affirmative action the Act asks for;
 * a tick-box in front of it would be friction that proves nothing extra.
 */
export function CollectionNotice({ onDark = false }: { onDark?: boolean }) {
  const muted = onDark ? 'text-white/35' : 'text-secondary/70';
  const link = onDark ? 'text-white/60 hover:text-white' : 'text-primary hover:text-primary';

  return (
    <p className={`text-[11px] leading-relaxed ${muted}`}>
      {COLLECTION_NOTICE.text}{' '}
      <Link href="/privacy" className={`${link} underline underline-offset-2`}>
        Privacy Policy
      </Link>
      . {COLLECTION_NOTICE.ageLine}
    </p>
  );
}
