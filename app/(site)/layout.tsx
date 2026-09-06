import { Navbar } from '@/components/nav/Navbar';
import { StickyCTA } from '@/components/nav/StickyCTA';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { Groot } from '@/components/chat/Groot';
import { WhatsAppFab } from '@/components/contact/WhatsAppFab';
import { WelcomeGate } from '@/components/home/WelcomeGate';
import { ConsentBanner } from '@/components/legal/ConsentBanner';
import { SplashScreen } from '@/components/brand/SplashScreen';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* First in the tree so the server HTML carries the splash before anything else paints. */}
      <SplashScreen />
      <Navbar />
      <main className="pb-24 md:pb-0">{children}</main>
      <StickyCTA />
      <Groot />
      <WhatsAppFab />
      <WelcomeGate />
      <ConsentBanner />
      <AuthModal />
      <ProfileModal />
    </>
  );
}
