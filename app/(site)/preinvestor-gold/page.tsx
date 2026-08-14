import { permanentRedirect } from 'next/navigation';

/** Pre-investor offer retired as a standalone page — SYL carries the offer. */
export default function PreinvestorRedirect() {
  permanentRedirect('/sanctuaries/syl');
}
