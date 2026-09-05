import { Navbar } from '@/components/nav/Navbar';
import { StickyCTA } from '@/components/nav/StickyCTA';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { Groot } from '@/components/chat/Groot';
import { WhatsAppFab } from '@/components/contact/WhatsAppFab';
import { WelcomeGate } from '@/components/home/WelcomeGate';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pb-24 md:pb-0">{children}</main>
      <StickyCTA />
      <Groot />
      <WhatsAppFab />
      <WelcomeGate />
      <AuthModal />
      <ProfileModal />
    </>
  );
}
