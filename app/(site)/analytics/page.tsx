import { permanentRedirect } from 'next/navigation';

/** Edge+Nature analytics folded into the minimal home — proof lives in ProofStrip. */
export default function AnalyticsRedirect() {
  permanentRedirect('/');
}
