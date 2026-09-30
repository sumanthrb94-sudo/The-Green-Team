'use client';

/**
 * Mobile App Shell Navigation — transforms the mobile web experience into an
 * authentic, high-end APK WebView interface with a native 5-tab bar.
 *
 * Tabs:
 * 1. Feed (Curated sanctuaries overview)
 * 2. Sanctuaries (Interactive property listing search)
 * 3. Eco-Map (Live AQI, forests & RRR GIS)
 * 4. Groot AI (Conversational sanctuary consultant)
 * 5. Onboard (Developer intake & TG-RERA compliance)
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Map, MessageSquareCode, ShieldCheck, Phone } from 'lucide-react';
import { WHATSAPP } from '@/lib/data/contact';
import { cn } from '@/lib/utils';

interface TabItem {
  name: string;
  href?: string;
  isAction?: boolean;
  actionId?: string;
  icon: React.ElementType;
  badge?: string;
}

export function StickyCTA() {
  const pathname = usePathname();

  // Hidden inside Admin dashboard
  if (pathname.startsWith('/admin')) return null;

  // Property detail pages carry their own contextual action bar (PdpStickyBar)
  if (pathname.startsWith('/sanctuaries/')) return null;

  const triggerGroot = () => {
    window.dispatchEvent(new CustomEvent('tgt:open-groot'));
  };

  const tabs: TabItem[] = [
    {
      name: 'Feed',
      href: '/',
      icon: Home,
    },
    {
      name: 'Explore',
      href: '/list',
      icon: Compass,
    },
    {
      name: 'Eco-Map',
      href: '/map',
      icon: Map,
    },
    {
      name: 'Groot AI',
      isAction: true,
      actionId: 'groot',
      icon: MessageSquareCode,
      badge: 'AI',
    },
    {
      name: 'Onboard',
      href: '/onboard',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 z-[9980] pointer-events-none">
      {/* Upper floating quick-contact pill (WhatsApp + Call) on select pages (hidden on /map to prevent blocking GIS controls) */}
      {pathname !== '/map' && (
        <div className="pointer-events-auto px-4 pb-2 flex justify-end">
          <a
            href={WHATSAPP.generic}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Direct WhatsApp inquiry"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#25D366] text-white text-[9px] font-bold tracking-wider uppercase shadow-lg hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white" aria-hidden>
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
            <span>Chat</span>
          </a>
        </div>
      )}

      {/* APK WebView Bottom Tab Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="pointer-events-auto bg-[#0a1208]/96 backdrop-blur-2xl border-t border-white/10 shadow-[0_-8px_30px_rgba(0,0,0,0.6)] px-2 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            if (tab.isAction) {
              return (
                <button
                  key={tab.name}
                  onClick={triggerGroot}
                  type="button"
                  className="flex-1 flex flex-col items-center justify-center py-1 group relative transition-transform active:scale-95"
                >
                  <div className="relative">
                    <span className="w-10 h-7 rounded-full bg-gradient-to-r from-[#c8a951]/25 to-[#a3b18a]/25 border border-[#c8a951]/40 flex items-center justify-center text-[#c8a951] group-hover:scale-110 transition-transform">
                      <Icon className="w-4 h-4" />
                    </span>
                    {tab.badge && (
                      <span className="absolute -top-1 -right-1 px-1 py-0.2 rounded-full bg-[#c8a951] text-[#0a1208] text-[7px] font-black uppercase tracking-tighter">
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[8.5px] uppercase tracking-wider font-bold mt-1 text-[#c8a951]">
                    {tab.name}
                  </span>
                </button>
              );
            }

            const href = tab.href || '/';
            const isActive =
              href === '/'
                ? pathname === '/'
                : pathname.startsWith(href);

            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center py-1 transition-all active:scale-95',
                  isActive ? 'text-[#c8a951]' : 'text-white/45 hover:text-white/80'
                )}
              >
                <div className="relative">
                  <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110 text-[#c8a951]')} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#c8a951]" />
                  )}
                </div>
                <span
                  className={cn(
                    'text-[8.5px] uppercase tracking-wider font-bold mt-1 transition-colors',
                    isActive ? 'text-[#c8a951]' : 'text-white/45'
                  )}
                >
                  {tab.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
