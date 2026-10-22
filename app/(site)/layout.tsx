import { Navbar } from '@/components/nav/Navbar';
import { StickyCTA } from '@/components/nav/StickyCTA';
import { WhatsAppFab } from '@/components/contact/WhatsAppFab';
import { SplashScreen } from '@/components/brand/SplashScreen';
import { DeferredOverlays } from '@/components/nav/DeferredOverlays';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* First in the tree so the server HTML carries the splash before anything else paints. */}
      <SplashScreen />
      <Navbar />
      <main className="pb-24 md:pb-0 has-[[data-fullscreen-map]]:pb-0 has-[[data-fullscreen-map]]:overflow-hidden">{children}</main>
      <StickyCTA />
      <WhatsAppFab />
      {/* Chat, welcome prompt, cookie banner and the auth modals load after first paint. */}
      <DeferredOverlays />
    </>
  );
}
