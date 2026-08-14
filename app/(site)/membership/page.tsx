import { permanentRedirect } from 'next/navigation';

/** Membership retired — one conversion path now: the adviser call. */
export default function MembershipRedirect() {
  permanentRedirect('/adviser-call');
}
