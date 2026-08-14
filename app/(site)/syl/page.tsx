import { permanentRedirect } from 'next/navigation';

/** v1 route kept alive — SYL now has a full property page. */
export default function SylRedirect() {
  permanentRedirect('/sanctuaries/syl');
}
