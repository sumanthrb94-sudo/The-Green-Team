import { Navbar } from '@/components/nav/Navbar';
import { BottomTabBar } from '@/components/nav/BottomTabBar';
import { AuthModal } from '@/components/auth/AuthModal';
import { ProfileModal } from '@/components/auth/ProfileModal';
import { Groot } from '@/components/chat/Groot';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pb-16 md:pb-0">{children}</main>
      <BottomTabBar />
      <Groot />
      <AuthModal />
      <ProfileModal />
    </>
  );
}
