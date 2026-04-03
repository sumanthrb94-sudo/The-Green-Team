import React, { useState, useEffect, useMemo, FC } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wind, 
  VolumeX, 
  Shield, 
  Clock, 
  ArrowRight, 
  ChevronDown, 
  Check,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  TrendingDown,
  Zap,
  Award,
  Leaf,
  Droplets,
  Trees,
  Sun,
  MessageSquare,
  Send,
  X,
  Search,
  Navigation,
  Layers,
  Map as MapIcon,
  Plane
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from './lib/utils';
import { GoogleGenAI } from "@google/genai";

import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, ZoomControl, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { AlertTriangle, ZoomIn } from 'lucide-react';
import L from 'leaflet';

// Fix Leaflet icon issue
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// --- Types ---

interface Sanctuary {
  id: string;
  title: string;
  location: string;
  aqi: number;
  noise: number;
  commute: string;
  valuation: string;
  memberPrice: string;
  image: string;
  features?: string[];
}

// --- Mock Data ---

const SANCTUARIES: Sanctuary[] = [
  {
    id: 'agartha',
    title: 'MODCON Agartha',
    location: 'Narsapur Forest Peripheral',
    aqi: 12,
    noise: 18,
    commute: '45 mins to Financial District',
    valuation: '₹2.2 Cr',
    memberPrice: '₹1.1 Cr',
    image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1200',
    features: ['Forest Buffer', 'Solar Microgrid', 'Rainwater Harvest', 'Organic Farm']
  },
  {
    id: 'the-sil',
    title: 'The SIL: Vertical Villament',
    location: 'Tukkuguda (Future City)',
    aqi: 22,
    noise: 24,
    commute: '15 mins to Future City Hub',
    valuation: '₹4.0 Cr',
    memberPrice: '₹1.9 Cr',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    features: ['Vertical Forest', 'Smart Energy', 'Zero Waste', 'Community Hub']
  },
  {
    id: 'horizon',
    title: 'MODCON Horizon',
    location: 'Kokapet SEZ',
    aqi: 45,
    noise: 52,
    commute: '5 mins to Financial District',
    valuation: '₹5.5 Cr',
    memberPrice: '₹2.8 Cr',
    image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=1200',
    features: ['Sky Lounge', 'Infinity Pool', 'Smart Automation', 'Ultra Luxury']
  },
  {
    id: 'oasis',
    title: 'The Oasis',
    location: 'Shamshabad Eco-Zone',
    aqi: 28,
    noise: 35,
    commute: '10 mins to RGIA',
    valuation: '₹3.2 Cr',
    memberPrice: '₹1.6 Cr',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200',
    features: ['Water Bodies', 'Organic Orchards', 'Wellness Center', 'Solar Powered']
  }
];

// --- Components ---

const Logo = ({ className = "w-10 h-10", textClassName = "text-xl md:text-2xl", iconOnly = false }: { className?: string, textClassName?: string, iconOnly?: boolean }) => (
  <div className={cn("flex items-center gap-4 group cursor-pointer", !iconOnly && "z-50")}>
    <div className={cn("relative flex items-center justify-center transition-all duration-700 group-hover:rotate-12 text-primary", className)}>
      <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
        <path d="M50 95C50 95 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 95Z" className="opacity-20" />
        <path d="M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z" />
        <path d="M50 90L50 40M50 90C50 90 45 70 35 60M50 90C50 90 55 70 65 60" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" className="opacity-40" />
      </svg>
    </div>
    {!iconOnly && (
      <div className="flex flex-col">
        <span className={cn("font-headline font-bold tracking-widest text-on-surface uppercase transition-all duration-700", textClassName)}>The Green Team</span>
        <span className="text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] text-primary font-bold -mt-0.5 md:-mt-1 hidden sm:block">Independent Sanctuary Curators</span>
      </div>
    )}
  </div>
);

const Navbar = ({ isSubscribed, onNewsletterClick, onModeChange }: { isSubscribed: boolean, onNewsletterClick: () => void, onModeChange: (mode: any) => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Map', id: 'map' },
    { name: 'Advantage', id: 'analytics' },
    { name: 'Ecosystems', id: 'gallery' },
    { name: 'Agartha', id: 'list' },
    { name: 'The SIL', id: 'the-sil' },
    { name: 'Membership', id: 'membership' }
  ];

  return (
    <nav className="relative z-50 px-4 md:px-8 flex items-center h-16 md:h-20 bg-cream border-b border-outline/10 shadow-sm">
      {/* Left: Brand Name */}
      <div className="flex-1 flex items-center">
        <Logo 
          className="w-8 h-8" 
          textClassName="text-lg md:text-xl"
        />
      </div>

      {/* Right: Actions (Sign In + Menu) */}
      <div className="flex items-center gap-4 md:gap-8">
        <button className="hidden sm:block text-[10px] uppercase tracking-[0.4em] font-bold text-on-surface/60 hover:text-primary transition-colors">
          Sign In
        </button>
        
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-3 hover:bg-primary/5 rounded-xl transition-all group flex items-center gap-3"
        >
          <div className="space-y-1.5">
            <div className={cn("w-6 h-0.5 bg-primary transition-all", isMenuOpen && "rotate-45 translate-y-2")}></div>
            <div className={cn("w-4 h-0.5 bg-primary transition-all", isMenuOpen && "opacity-0")}></div>
            <div className={cn("w-6 h-0.5 bg-primary transition-all", isMenuOpen && "-rotate-45 -translate-y-2")}></div>
          </div>
          <span className="hidden sm:block font-headline text-[10px] tracking-widest uppercase font-bold text-primary">Menu</span>
        </button>
      </div>

      {/* Mobile/Master Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Click-off area (Backdrop) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55]"
            />
            
            <motion.div
              initial={{ opacity: 0, y: '-100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 bg-surface z-[60] flex flex-col p-8 md:p-16 shadow-2xl rounded-b-[40px] max-h-[95vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-12">
                <Logo className="w-8 h-8" textClassName="text-lg" />
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-3 hover:bg-primary/5 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-on-surface" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-12 md:gap-24">
                <div className="flex flex-col gap-6">
                  <p className="text-[10px] uppercase tracking-[0.6em] text-secondary font-bold mb-4 opacity-40">Navigation Hub</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    {navItems.map((item) => (
                      <button 
                        key={item.id} 
                        onClick={() => {
                          if (['home', 'map', 'analytics', 'gallery', 'list', 'the-sil'].includes(item.id)) {
                            onModeChange(item.id as any);
                          }
                          setIsMenuOpen(false);
                        }}
                        className="text-2xl md:text-3xl uppercase tracking-[0.1em] font-headline font-bold text-on-surface hover:text-primary transition-all flex items-center justify-between group text-left"
                      >
                        <span className="group-hover:translate-x-2 transition-transform duration-500">{item.name}</span>
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col justify-end pt-12 md:pt-0 border-t md:border-t-0 md:border-l border-outline/10 md:pl-24">
                  <div className="grid grid-cols-1 gap-4">
                    <button className="w-full text-[11px] uppercase tracking-[0.5em] font-bold bg-primary text-white px-8 py-5 hover:shadow-xl hover:shadow-primary/20 transition-all rounded-2xl mb-2">
                      Sign In to Collective
                    </button>
                    <div className="flex items-center gap-6 mb-6">
                      <MessageSquare className="w-5 h-5 text-secondary cursor-pointer hover:text-primary transition-colors" />
                      <Shield className="w-5 h-5 text-secondary cursor-pointer hover:text-primary transition-colors" />
                      <span className="text-[10px] uppercase tracking-widest text-secondary font-bold">Support & Security</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button className="w-full text-[11px] uppercase tracking-[0.5em] font-bold text-primary border-2 border-primary/20 px-8 py-5 hover:bg-primary hover:text-white hover:border-primary transition-all rounded-2xl text-center">
                        Member Portal
                      </button>
                      <button 
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNewsletterClick();
                        }}
                        className="w-full text-[11px] uppercase tracking-[0.5em] font-bold text-secondary border-2 border-transparent px-8 py-5 hover:text-primary transition-all text-center"
                      >
                        List Property
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex gap-8">
                  <span className="text-[9px] uppercase tracking-widest text-secondary/60">Privacy Policy</span>
                  <span className="text-[9px] uppercase tracking-widest text-secondary/60">Terms of Service</span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-secondary/40">© 2026 The Green Team • Independent Sanctuary Curators</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

const SideNavBar = ({ activeMode, onModeChange }: { activeMode: string, onModeChange: (mode: any) => void }) => {
  const items = [
    { name: 'Map', id: 'map', icon: MapIcon },
    { name: 'Advantage', id: 'analytics', icon: TrendingDown },
    { name: 'Ecosystems', id: 'gallery', icon: Leaf },
    { name: 'Agartha', id: 'list', icon: Layers },
    { name: 'The SIL', id: 'the-sil', icon: Shield },
  ];

  return (
    <aside className="hidden md:flex h-full w-24 flex-col items-center py-8 bg-white border-r border-outline/10 z-40 shadow-sm">
      <div className="flex flex-col space-y-8 items-center w-full">
        {items.map((item) => (
          <div 
            key={item.id}
            onClick={() => onModeChange(item.id)}
            className={cn(
              "flex flex-col items-center space-y-2 group cursor-pointer transition-all duration-300 w-full px-2",
              activeMode === item.id ? "text-primary" : "text-secondary hover:text-primary"
            )}
          >
            <div className={cn(
              "p-3 rounded-xl transition-all",
              activeMode === item.id ? "bg-primary/10" : "group-hover:bg-primary/5"
            )}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="font-headline uppercase tracking-widest text-[8px] font-bold text-center">{item.name}</span>
          </div>
        ))}
      </div>
      <div className="mt-auto mb-8 flex flex-col items-center space-y-6">
        <div className="p-3 rounded-xl text-secondary hover:text-primary cursor-pointer transition-all">
          <Shield className="w-5 h-5" />
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-container-highest overflow-hidden border-2 border-primary/10">
          <img 
            src="https://picsum.photos/seed/consultant/100/100" 
            alt="User profile" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
    </aside>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-start px-6 md:px-24 pt-4 md:pt-8 pb-24 overflow-hidden cashew-gradient">
      <div className="absolute inset-0 z-0 opacity-10 mix-blend-multiply">
        <img 
          src="https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=1920" 
          alt="Atmospheric landscape" 
          className="w-full h-full object-cover grayscale"
          referrerPolicy="no-referrer"
        />
      </div>
      
      <div className="relative z-10 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "circOut" }}
        >
          <div className="flex items-center gap-3 md:gap-4 mb-8 md:mb-12">
            <div className="w-8 md:w-12 h-px bg-olive-800/40"></div>
            <span className="text-olive-800 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.6em]">Independent Sanctuary Curators</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-light text-olive-900 mb-8 md:mb-12 leading-[1.1] md:leading-[0.9] tracking-tighter">
            The Science of <br />
            <span className="italic text-olive-800 font-medium">Early Entry.</span>
          </h1>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-end">
            <p className="text-lg md:text-2xl font-light text-olive-900/60 leading-relaxed max-w-xl">
              A growing community in Hyderabad and India's metropolitans, securing self-sustaining sanctuaries where food, water, and energy are curated for the future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-8">
              <button className="btn-membership btn-olive group w-full sm:w-auto">
                Apply for Membership <ArrowUpRight className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
              <button className="btn-membership btn-outline-olive w-full sm:w-auto">
                The Green Team Advantage
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const EcosystemPillars = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  const pillars = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <path d="M11 20A7 7 0 0 1 11 6A7 7 0 0 1 11 20Z" />
          <path d="M11 13V20" />
          <path d="M11 6C11 6 12 2 15 2C18 2 19 6 19 6" />
          <path d="M11 6C11 6 10 2 7 2C4 2 3 6 3 6" />
        </svg>
      ),
      title: "Organic Food",
      desc: "Self-sustaining ecosystems designed to generate farm-to-table organic food, ensuring nutritional security for your family."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" />
          <path d="M12 18C12 18 15 15 15 12C15 9 12 6 12 6C12 6 9 9 9 12C9 15 12 18 12 18Z" />
          <path d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z" />
        </svg>
      ),
      title: "Water Security",
      desc: "Advanced rainwater harvesting and natural filtration systems to ensure a perpetual supply of pure, life-giving water."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2V4M12 20V22M4 12H2M22 12H20M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07" />
          <path d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8Z" fill="currentColor" className="opacity-20" />
        </svg>
      ),
      title: "Renewable Energy",
      desc: "Solar-powered microgrids providing clean, renewable energy, making your sanctuary completely independent of the grid."
    }
  ];

  return (
    <section id="ecosystems" className={cn(
      "px-6 md:px-24 bg-white",
      isFullPage ? "py-24" : "py-48"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-32">
          <span className="text-olive-800 text-[10px] font-bold uppercase tracking-[0.6em] mb-6 block">The Resource Agenda</span>
          <h2 className="text-5xl md:text-8xl font-medium text-olive-900">Self-Sustaining <br /><span className="italic text-olive-800">Ecosystems.</span></h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12">
          {pillars.map((p, i) => (
            <div key={i} className="p-12 border border-olive-800/5 bg-cream/20 hover:bg-cream/40 transition-all">
              <div className="text-olive-800 mb-8">{p.icon}</div>
              <h4 className="text-2xl font-bold text-olive-900 mb-6">{p.title}</h4>
              <p className="text-olive-900/60 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Advantage = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  return (
    <section id="the-advantage" className={cn(
      "px-12 md:px-24 bg-white/[0.01] border-y border-olive-800/5",
      isFullPage ? "py-24" : "py-48"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-24">
          <div className="lg:col-span-5">
            <h2 className="text-5xl md:text-7xl font-medium text-olive-900">
              The <span className="italic text-olive-800">Intelligence</span> <br />Gap.
            </h2>
            <div className="w-24 h-1 bg-olive-800/20 mt-12"></div>
          </div>
          
          <div className="lg:col-span-7 space-y-12">
            <p className="text-2xl md:text-4xl font-light leading-snug text-olive-900/80">
              "Market negligence is your opportunity. While the crowd waits for the launch, our members have already secured their legacy."
            </p>
            <div className="grid sm:grid-cols-2 gap-12 pt-8">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-olive-800/5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-olive-800 w-6 h-6">
                    <path d="M3 12c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9-9 4.03-9 9z" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-olive-900">The 1 Cr Learning Curve</h4>
                <p className="text-olive-800/60 text-sm leading-relaxed">
                  Knowing before the market is the difference between a 1 Crore entry and a 2 Crore regret. We bridge that gap for our elite circle.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-olive-800/5 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-olive-800 w-6 h-6">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-olive-900">The 40-Minute Radius</h4>
                <p className="text-olive-800/60 text-sm leading-relaxed">
                  The projects we curate meet our minimum standards: reach your work in 40 minutes while living away from the polluted jungles.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const TheSIL = ({ isSubscribed, onNewsletterClick, isFullPage = false }: { isSubscribed: boolean, onNewsletterClick: () => void, isFullPage?: boolean }) => {
  return (
    <section id="the-sil" className={cn(
      "px-12 md:px-24 bg-olive-900 text-cream relative overflow-hidden",
      isFullPage ? "py-24" : "py-48"
    )}>
      {!isSubscribed && (
        <div className="absolute inset-0 z-20 bg-olive-900/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
          <Shield className="w-16 h-16 text-gold mb-8" />
          <h2 className="text-4xl md:text-6xl font-serif italic mb-6">Exclusive Access Required.</h2>
          <p className="text-cream/60 max-w-md mb-12 text-lg font-light leading-relaxed">
            The SIL is a restricted landmark. Sign up for our monthly newsletter to unlock the full architectural briefing and coordinates.
          </p>
          <button 
            onClick={onNewsletterClick}
            className="btn-membership bg-gold text-olive-900 border-gold hover:bg-cream"
          >
            Unlock with Newsletter
          </button>
        </div>
      )}
      
      <div className="absolute top-0 right-0 w-1/3 h-full opacity-20 grayscale pointer-events-none">
        <img src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200" className="w-full h-full object-cover" />
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="px-3 py-1 bg-gold text-olive-900 text-[9px] font-bold uppercase tracking-widest">Upcoming Landmark</span>
              <span className="text-cream/40 text-[9px] uppercase tracking-[0.4em]">Tukkuguda</span>
            </div>
            <h2 className="text-5xl md:text-8xl font-medium mb-12">The <span className="italic text-gold">SIL</span> <br />Villament.</h2>
            <p className="text-xl md:text-2xl font-light text-cream/60 leading-relaxed mb-12">
              Imagine an 18-floor masterpiece where **two floors equal one villa**. Amidst a landscape of traditional villas, The SIL stands as the only tower—a soaring statement of exclusivity in Tukkuguda.
            </p>
            
            <div className="grid grid-cols-2 gap-12 mb-16">
              <div>
                <p className="text-[9px] uppercase tracking-[0.4em] text-gold mb-2">Location</p>
                <p className="text-xl font-serif italic">Tukkuguda</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-[0.4em] text-gold mb-2">Exclusivity</p>
                <p className="text-xl font-serif italic">Only Tower in Villa Zone</p>
              </div>
            </div>

            <button className="btn-membership bg-gold text-olive-900 border-gold hover:bg-cream hover:text-olive-900">
              Request Early Access Briefing
            </button>
          </div>
          
          <div className="space-y-8">
            <div className="p-10 border border-cream/10 bg-white/5 backdrop-blur-sm">
              <h4 className="text-2xl font-bold mb-4 text-gold italic">Environmental Integrity</h4>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-cream/5 pb-4">
                  <span className="text-[10px] uppercase tracking-widest text-cream/40">Target AQI</span>
                  <span className="text-xl font-serif">Sub 25</span>
                </div>
                <div className="flex justify-between items-center border-b border-cream/5 pb-4">
                  <span className="text-[10px] uppercase tracking-widest text-cream/40">Noise Mitigation</span>
                  <span className="text-xl font-serif">Zero Negligence Tech</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest text-cream/40">Commute</span>
                  <span className="text-xl font-serif">15 Mins to Future City Hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const SanctuaryCard: FC<{ sanctuary: Sanctuary, isSubscribed: boolean, onNewsletterClick: () => void }> = ({ sanctuary, isSubscribed, onNewsletterClick }) => {
  const isGated = sanctuary.id === '2' && !isSubscribed;

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="group membership-card bg-white relative overflow-hidden"
    >
      {isGated && (
        <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-12 h-12 text-primary mb-6" />
          <h4 className="text-2xl font-headline font-bold text-on-surface mb-4">Locked Landmark.</h4>
          <p className="text-xs text-secondary mb-8 max-w-[200px]">Sign up for our newsletter to view the SIL details.</p>
          <button 
            onClick={onNewsletterClick}
            className="px-6 py-3 bg-primary text-white text-[9px] uppercase tracking-widest font-bold rounded-lg"
          >
            Unlock Now
          </button>
        </div>
      )}

      <div className="relative h-[500px] overflow-hidden mb-8 rounded-2xl">
        <img 
          src={sanctuary.image} 
          alt={sanctuary.title} 
          className={cn(
            "w-full h-full object-cover grayscale brightness-90 transition-all duration-1000",
            !isGated && "group-hover:grayscale-0 group-hover:scale-105"
          )}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 left-6">
          <div className="bg-primary text-white px-4 py-1 text-[9px] uppercase tracking-[0.4em] font-bold rounded-full">
            {sanctuary.id === '2' ? 'Upcoming' : 'Live'}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-primary text-[10px] font-bold uppercase tracking-[0.5em] mb-2">{sanctuary.commute}</p>
            <h3 className="text-3xl font-headline font-bold text-on-surface">{sanctuary.title}</h3>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-[0.4em] text-secondary mb-1">Market Valuation</p>
            <p className="text-xl font-headline text-secondary/40 line-through">{sanctuary.valuation}</p>
            <p className="text-2xl font-headline text-on-surface font-bold">{sanctuary.memberPrice}</p>
          </div>
        </div>
        
        <div className="flex gap-8 py-6 border-y border-outline/10">
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface">AQI: {sanctuary.aqi}</span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4 text-olive-800/40" />
            <span className="text-[10px] uppercase tracking-widest font-bold text-olive-900/60">{sanctuary.noise}dB</span>
          </div>
        </div>

        <button className="w-full py-5 bg-olive-800 text-cream text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-olive-900 transition-all">
          Request Briefing
        </button>
      </div>
    </motion.div>
  );
};

const SanctuaryPopupContent = ({ loc }: { loc: any }) => (
  <div className="w-72 p-3 bg-surface">
    <div className="relative h-32 overflow-hidden mb-4 rounded-lg">
      {loc.image ? (
        <img 
          src={loc.image} 
          alt={loc.title} 
          className={cn(
            "w-full h-full object-cover transition-all duration-700",
            loc.type === 'traffic-zone' ? "sepia brightness-75" : "grayscale hover:grayscale-0",
            loc.type === 'infrastructure' && "contrast-125 brightness-90"
          )}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full bg-primary/5 flex items-center justify-center">
          <MapPin className="w-8 h-8 text-primary/20" />
        </div>
      )}
      {loc.type === 'traffic-zone' && (
        <div className="absolute top-2 right-2 bg-error text-on-error px-2 py-0.5 text-[7px] uppercase tracking-widest font-bold flex items-center gap-1 rounded">
          <AlertTriangle className="w-2 h-2" />
          High Risk Zone
        </div>
      )}
      {loc.type === 'infrastructure' && (
        <div className="absolute top-2 right-2 bg-on-surface text-surface px-2 py-0.5 text-[7px] uppercase tracking-widest font-bold rounded">
          {loc.id === 'future-city' ? 'Future Hub' : 'Logistics Hub'}
        </div>
      )}
      {loc.type === 'exit' && (
        <div className="absolute top-2 right-2 bg-primary/10 text-primary px-2 py-0.5 text-[7px] uppercase tracking-widest font-bold rounded">
          ORR Exit
        </div>
      )}
    </div>
    
    <div className="mb-4">
      <h4 className={cn(
        "font-headline font-bold text-xl mb-1 uppercase tracking-wider",
        loc.type === 'traffic-zone' ? "text-error" : "text-on-surface"
      )}>{loc.title}</h4>
      <p className="text-[10px] uppercase tracking-widest text-secondary font-bold">{loc.location}</p>
    </div>
    
    {loc.type !== 'exit' && (
      <div className="flex gap-4 mb-4 py-3 border-y border-outline/10">
        <div className="flex items-center gap-1.5">
          <Wind className={cn("w-3 h-3", loc.aqi > 50 ? "text-error" : "text-primary/40")} />
          <span className={cn("text-[9px] uppercase tracking-widest font-bold", loc.aqi > 50 ? "text-error" : "text-on-surface")}>
            AQI: {loc.aqi} {loc.aqi > 50 ? '(Hazardous)' : '(Pristine)'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <VolumeX className={cn("w-3 h-3", loc.noise > 50 ? "text-error" : "text-primary/40")} />
          <span className={cn("text-[9px] uppercase tracking-widest font-bold", loc.noise > 50 ? "text-error" : "text-on-surface")}>
            {loc.noise}dB {loc.noise > 50 ? '(Chaotic)' : '(Silent)'}
          </span>
        </div>
      </div>
    )}

    {loc.type === 'exit' && (
      <div className="flex gap-4 mb-4 py-3 border-y border-outline/10">
        <div className="flex items-center gap-1.5">
          <Wind className="w-3 h-3 text-error" />
          <span className="text-[9px] uppercase tracking-widest font-bold text-on-surface">
            Avg AQI: {loc.aqi} (Compromised)
          </span>
        </div>
      </div>
    )}

    <p className="text-xs text-on-surface-variant leading-relaxed mb-4 font-light">
      {loc.type === 'traffic-zone' 
        ? `Disadvantage: ${loc.description}`
        : loc.type === 'exit'
          ? "Strategic access point via Outer Ring Road. High-speed connectivity to the sanctuary corridor, but subject to immediate urban pollution."
          : loc.description}
    </p>
    
    {(loc.type === 'sanctuary' || loc.type === 'infrastructure') && (
      <a 
        href={`#${loc.id}`} 
        className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary border-b border-primary/20 pb-1 hover:border-primary transition-all"
      >
        View Details
      </a>
    )}
  </div>
);

const MapController = ({ targetView }: { targetView: { center: [number, number], zoom: number } | null }) => {
  const map = useMap();
  useEffect(() => {
    if (targetView) {
      map.flyTo(targetView.center, targetView.zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [targetView, map]);
  return null;
};

const ZoomTracker = ({ onZoom }: { onZoom: (zoom: number) => void }) => {
  const map = useMapEvents({
    zoomend: () => {
      onZoom(map.getZoom());
    },
  });
  return null;
};

const PropertyDetailOverlay = ({ sanctuary, onClose }: { sanctuary: Sanctuary, onClose: () => void }) => {
  const [showBadge, setShowBadge] = useState(true);

  return (
    <motion.div 
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] z-[1001] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden"
    >
      <div className="relative h-72 w-full overflow-hidden">
        <img 
          src={sanctuary.image} 
          alt={sanctuary.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-6 right-6 flex gap-3">
          <button className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all">
            <Shield className="w-4 h-4 text-primary" />
          </button>
          <button onClick={onClose} className="p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white transition-all">
            <X className="w-4 h-4 text-primary" />
          </button>
        </div>
        {showBadge && (
          <div className="absolute bottom-6 left-6 flex items-center gap-1">
            <span className="px-3 py-1 bg-primary text-white text-[8px] uppercase tracking-widest font-bold rounded-full">New Construction</span>
            <button 
              onClick={() => setShowBadge(false)}
              className="p-1 bg-primary/80 text-white rounded-full hover:bg-primary transition-all"
            >
              <X className="w-2 h-2" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-headline font-bold text-on-surface mb-2">{sanctuary.title}</h2>
            <div className="flex items-center gap-2 text-secondary text-xs">
              <MapPin className="w-3 h-3" />
              {sanctuary.location}
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-headline font-bold text-primary">{sanctuary.memberPrice}</p>
            <p className="text-[8px] uppercase tracking-widest text-secondary/60">Est. ₹24,500/mo</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 py-6 border-y border-outline/10">
          <div className="text-center">
            <p className="text-[8px] uppercase tracking-widest text-secondary/60 mb-1">Living Space</p>
            <p className="text-sm font-bold">5,420 <span className="text-[10px] font-normal text-secondary/60">sqft</span></p>
          </div>
          <div className="text-center border-x border-outline/10">
            <p className="text-[8px] uppercase tracking-widest text-secondary/60 mb-1">Bedrooms</p>
            <p className="text-sm font-bold">6 <span className="text-[10px] font-normal text-secondary/60">Beds</span></p>
          </div>
          <div className="text-center">
            <p className="text-[8px] uppercase tracking-widest text-secondary/60 mb-1">Bathrooms</p>
            <p className="text-sm font-bold">7.5 <span className="text-[10px] font-normal text-secondary/60">Baths</span></p>
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-secondary font-bold mb-6">Key Curated Features</p>
          <div className="grid grid-cols-2 gap-4">
            {sanctuary.features?.map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl border border-outline/5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  {feature.includes('Forest') && <Leaf className="w-4 h-4" />}
                  {feature.includes('Solar') && <Sun className="w-4 h-4" />}
                  {feature.includes('Water') && <Droplets className="w-4 h-4" />}
                  {feature.includes('Farm') && <Zap className="w-4 h-4" />}
                  {feature.includes('Smart') && <Zap className="w-4 h-4" />}
                  {feature.includes('Zero') && <Shield className="w-4 h-4" />}
                  {feature.includes('Community') && <Award className="w-4 h-4" />}
                  {feature.includes('Vertical') && <Leaf className="w-4 h-4" />}
                </div>
                <span className="text-[10px] font-medium text-on-surface-variant">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] text-secondary font-bold mb-4">Architectural Narrative</p>
          <p className="text-xs text-secondary/80 leading-relaxed">
            Designed by Studio Arca, {sanctuary.title} represents the pinnacle of cantilevered architecture. Featuring self-sustaining ecosystems and private forest buffers.
          </p>
        </div>

        <div className="space-y-4 pt-4">
          <button className="w-full py-4 bg-primary text-white text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3">
            <Clock className="w-4 h-4" />
            Schedule Private Tour
          </button>
          <button className="w-full py-4 bg-surface-container-highest text-on-surface text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl hover:bg-surface-container-high transition-all flex items-center justify-center gap-3">
            <MessageSquare className="w-4 h-4" />
            Inquire with Listing Agent
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SanctuaryMapLayout = () => {
  const [isSatellite, setIsSatellite] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAqi, setShowAqi] = useState(false);
  const [showNoise, setShowNoise] = useState(false);
  const [showOrr, setShowOrr] = useState(false);
  const [isAirportFocus, setIsAirportFocus] = useState(false);
  const [isRegionalView, setIsRegionalView] = useState(false);
  const [isTelanganaView, setIsTelanganaView] = useState(false);
  const [targetView, setTargetView] = useState<{ center: [number, number], zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [livePulse, setLivePulse] = useState(0);

  // Define Hotspots for Heatmaps
  const AQI_HOTSPOTS = [
    { lat: 17.44, lng: 78.38, intensity: 0.8 }, // HITEC City
    { lat: 17.38, lng: 78.48, intensity: 0.9 }, // Charminar/Old City
    { lat: 17.48, lng: 78.44, intensity: 1.0 }, // Sanath Nagar Industrial
    { lat: 17.24, lng: 78.43, intensity: 0.6 }, // Airport
    { lat: 17.40, lng: 78.45, intensity: 0.7 }, // City Center
    { lat: 17.62, lng: 78.08, intensity: 0.4 }, // Sangareddy
    { lat: 17.88, lng: 78.48, intensity: 0.3 }, // Toopran
    { lat: 17.51, lng: 78.88, intensity: 0.4 }, // Bhongir
    { lat: 17.24, lng: 78.90, intensity: 0.5 }, // Choutuppal
  ];

  const NOISE_HOTSPOTS = [
    { lat: 17.44, lng: 78.38, intensity: 1.0 }, // HITEC City
    { lat: 17.41, lng: 78.34, intensity: 0.9 }, // Financial District
    { lat: 17.24, lng: 78.43, intensity: 0.8 }, // Airport
    { lat: 17.40, lng: 78.45, intensity: 0.7 }, // City Center
    { lat: 17.62, lng: 78.08, intensity: 0.5 }, // Sangareddy Hub
    { lat: 17.24, lng: 78.90, intensity: 0.4 }, // Choutuppal Hub
  ];

  // Helper to calculate intensity at a point
  const getIntensity = (point: { lat: number, lng: number }, hotspots: { lat: number, lng: number, intensity: number }[]) => {
    let totalIntensity = 0;
    hotspots.forEach(spot => {
      const dist = Math.sqrt(Math.pow(point.lat - spot.lat, 2) + Math.pow(point.lng - spot.lng, 2));
      // Inverse square law for falloff
      totalIntensity += spot.intensity / (1 + dist * 40); 
    });
    // Add a small real-time fluctuation
    totalIntensity += (Math.sin(point.lat * 100 + point.lng * 100 + livePulse * 0.1) * 0.05);
    return Math.max(0, Math.min(totalIntensity, 1));
  };

  const selectedSanctuary = useMemo(() => 
    selectedId ? SANCTUARIES.find(s => s.id === selectedId || s.title.toLowerCase().includes(selectedId.toLowerCase())) : null,
  [selectedId]);

  // Handle View Changes
  useEffect(() => {
    if (isTelanganaView) {
      setTargetView({ center: [17.8, 79.1], zoom: 7 });
    } else if (isRegionalView) {
      setTargetView({ center: [17.4, 78.5], zoom: 9 });
    } else if (isAirportFocus) {
      setTargetView({ center: [17.24, 78.43], zoom: 12 });
    } else {
      setTargetView({ center: [17.49, 78.38], zoom: 10 });
    }
  }, [isTelanganaView, isRegionalView, isAirportFocus]);

  // Handle Search
  const handleSearch = (query: string) => {
    setSelectedId(query);
    const project = SANCTUARIES.find(s => s.title.toLowerCase().includes(query.toLowerCase()));
    if (project) {
      // Find coordinates in locations array
      const loc = locations.find(l => l.id === project.id || l.title === project.title);
      if (loc) {
        setTargetView({ center: loc.coords, zoom: 14 });
      }
    }
  };

  // Simulate real-time data pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setLivePulse(prev => (prev + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Generate a grid of points for the "Real-time Mesh"
  const gridPoints = useMemo(() => {
    const points = [];
    // Wider grid for Telangana view
    const step = isTelanganaView ? 0.2 : 0.03;
    const latRange = isTelanganaView ? [15.8, 19.8] : [16.9, 17.9];
    const lngRange = isTelanganaView ? [77.1, 81.1] : [78.0, 79.1];
    
    for (let lat = latRange[0]; lat <= latRange[1]; lat += step) {
      for (let lng = lngRange[0]; lng <= lngRange[1]; lng += step) {
        points.push({ lat, lng });
      }
    }
    return points;
  }, [isTelanganaView]);

  const ORR_PATH: [number, number][] = [
    [17.42, 78.34], [17.53, 78.26], [17.56, 78.32], [17.62, 78.48], 
    [17.60, 78.56], [17.52, 78.68], [17.44, 78.68], [17.38, 78.65], 
    [17.32, 78.62], [17.22, 78.58], [17.20, 78.52], [17.23, 78.48], 
    [17.25, 78.43], [17.32, 78.40], [17.39, 78.33], [17.42, 78.34]
  ];

  const RRR_PATH: [number, number][] = [
    [17.42, 78.10], [17.70, 78.15], [17.85, 78.40], [17.80, 78.70],
    [17.60, 78.95], [17.30, 79.00], [17.05, 78.80], [16.95, 78.40],
    [17.10, 78.15], [17.42, 78.10]
  ];

  const NATURAL_FEATURES = [
    {
      id: "hussain-sagar",
      type: 'lake',
      title: "Hussain Sagar",
      coords: [17.4239, 78.4738] as [number, number],
      boundary: [
        [17.435, 78.465], [17.442, 78.475], [17.438, 78.485], [17.425, 78.490], 
        [17.415, 78.485], [17.410, 78.475], [17.415, 78.465], [17.425, 78.460]
      ] as [number, number][],
      description: "Heart of the city. Historic lake connecting Hyderabad and Secunderabad."
    },
    {
      id: "osman-sagar",
      type: 'lake',
      title: "Osman Sagar (Gandipet)",
      coords: [17.37, 78.29] as [number, number],
      boundary: [
        [17.400, 78.270], [17.410, 78.290], [17.405, 78.310], [17.385, 78.325], 
        [17.365, 78.320], [17.350, 78.300], [17.355, 78.275], [17.375, 78.265]
      ] as [number, number][],
      description: "Major reservoir and source of drinking water. Protected catchment area."
    },
    {
      id: "himayat-sagar",
      type: 'lake',
      title: "Himayat Sagar",
      coords: [17.31, 78.31] as [number, number],
      boundary: [
        [17.340, 78.290], [17.350, 78.315], [17.335, 78.340], [17.310, 78.345], 
        [17.290, 78.330], [17.285, 78.305], [17.300, 78.285], [17.320, 78.280]
      ] as [number, number][],
      description: "Twin reservoir to Osman Sagar. Vital ecological zone."
    },
    {
      id: "narsapur-forest",
      type: 'forest',
      title: "Narsapur Forest Reserve",
      coords: [17.74, 78.28] as [number, number],
      boundary: [
        [17.85, 78.15], [17.88, 78.25], [17.85, 78.35], [17.78, 78.42], 
        [17.70, 78.40], [17.65, 78.30], [17.68, 78.18], [17.75, 78.12]
      ] as [number, number][],
      description: "Dense deciduous forest. Home to diverse flora and fauna. The lungs of North Hyderabad."
    },
    {
      id: "mrugavani",
      type: 'forest',
      title: "Mrugavani National Park",
      coords: [17.35, 78.34] as [number, number],
      boundary: [
        [17.38, 78.32], [17.39, 78.35], [17.37, 78.38], [17.34, 78.37], 
        [17.32, 78.34], [17.34, 78.31]
      ] as [number, number][],
      description: "Wildlife sanctuary near Chilkur. Teak and bamboo dominated forest."
    },
    {
      id: "vanasthali",
      type: 'forest',
      title: "Mahavir Harina Vanasthali",
      coords: [17.33, 78.58] as [number, number],
      boundary: [
        [17.36, 78.55], [17.37, 78.59], [17.35, 78.62], [17.32, 78.61], 
        [17.30, 78.58], [17.32, 78.54]
      ] as [number, number][],
      description: "Deer park and dry deciduous forest in the eastern corridor."
    },
    {
      id: "ananthagiri",
      type: 'forest',
      title: "Ananthagiri Hills",
      coords: [17.31, 77.85] as [number, number],
      boundary: [
        [17.40, 77.75], [17.42, 77.85], [17.38, 77.95], [17.30, 77.98], 
        [17.22, 77.92], [17.20, 77.80], [17.25, 77.72], [17.35, 77.70]
      ] as [number, number][],
      description: "Dense forest and hills. Origin of Musi river."
    },
    {
      id: "ameenpur",
      type: 'lake',
      title: "Ameenpur Lake",
      coords: [17.52, 78.33] as [number, number],
      boundary: [
        [17.54, 78.31], [17.55, 78.33], [17.53, 78.35], [17.51, 78.34], 
        [17.50, 78.32], [17.52, 78.30]
      ] as [number, number][],
      description: "First biodiversity heritage site in India for a water body."
    }
  ];

  const locations = [
    {
      id: "future-city",
      type: 'infrastructure',
      title: "The Future City",
      location: "Tukkuguda / Maheshwaram",
      coords: [17.24, 78.48] as [number, number],
      aqi: 25,
      noise: 30,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
      description: "The upcoming 4th city of Hyderabad. A hub for AI, high-tech manufacturing, and sustainable urban living."
    },
    {
      id: "agartha",
      type: 'sanctuary',
      title: "MODCON Agartha",
      location: "Narsapur Forest Peripheral",
      coords: [17.74, 78.28] as [number, number],
      aqi: 12,
      noise: 18,
      forestRadius: 5000,
      boundary: [
        [17.76, 78.25], [17.78, 78.27], [17.77, 78.31], 
        [17.73, 78.32], [17.71, 78.29], [17.72, 78.26]
      ] as [number, number][],
      image: "https://images.unsplash.com/photo-1449156001935-d2863fb72690?auto=format&fit=crop&q=80&w=800",
      description: "A forest-peripheral sanctuary nestled within the dense Narsapur reserve forest canopy."
    },
    {
      id: "the-sil",
      type: 'sanctuary',
      title: "The SIL",
      location: "Tukkuguda (Future City)",
      coords: [17.24, 78.48] as [number, number],
      aqi: 22,
      noise: 24,
      forestRadius: 3000,
      boundary: [
        [17.26, 78.46], [17.27, 78.49], [17.25, 78.51], 
        [17.22, 78.50], [17.21, 78.47], [17.23, 78.45]
      ] as [number, number][],
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
      description: "Vertical villaments strategically positioned near the protected green belts of the Future City."
    },
    {
      id: "horizon",
      type: 'sanctuary',
      title: "MODCON Horizon",
      location: "Kokapet SEZ",
      coords: [17.39, 78.33] as [number, number],
      aqi: 45,
      noise: 52,
      forestRadius: 1500,
      boundary: [
        [17.40, 78.32], [17.41, 78.34], [17.38, 78.35], [17.37, 78.33]
      ] as [number, number][],
      image: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800",
      description: "Ultra-luxury sky villas in the heart of Hyderabad's most premium commercial hub."
    },
    {
      id: "oasis",
      type: 'sanctuary',
      title: "The Oasis",
      location: "Shamshabad Eco-Zone",
      coords: [17.22, 78.38] as [number, number],
      aqi: 28,
      noise: 35,
      forestRadius: 4000,
      boundary: [
        [17.24, 78.36], [17.25, 78.39], [17.21, 78.40], [17.20, 78.37]
      ] as [number, number][],
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800",
      description: "A sustainable retreat focusing on wellness and organic living near the international airport."
    },
    {
      id: "rgia",
      type: 'infrastructure',
      title: "Rajiv Gandhi Intl Airport",
      location: "Shamshabad Hub",
      coords: [17.24, 78.43] as [number, number],
      aqi: 85,
      noise: 92,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=800",
      description: "Global logistics gateway. High noise pollution corridor."
    },
    {
      id: "enemy-1",
      type: 'traffic-zone',
      title: "Financial District",
      location: "Nanakramguda Hub",
      coords: [17.41, 78.34] as [number, number],
      aqi: 158,
      noise: 85,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?auto=format&fit=crop&q=80&w=800",
      description: "Critical noise pollution and air quality degradation due to high-density commercial activity."
    },
    {
      id: "enemy-2",
      type: 'traffic-zone',
      title: "Gachibowli Tech-Zone",
      location: "HITEC City Phase II",
      coords: [17.44, 78.36] as [number, number],
      aqi: 172,
      noise: 88,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=800",
      description: "Extreme urban heat island effect. Industrial and vehicular emissions at peak levels."
    },
    {
      id: "enemy-3",
      type: 'traffic-zone',
      title: "Hyderabad City Center",
      location: "Central Business District",
      coords: [17.40, 78.45] as [number, number],
      aqi: 185,
      noise: 92,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=800",
      description: "Maximum congestion zone. High concentration of particulate matter and acoustic chaos."
    },
    { id: "exit-1", type: 'exit', title: "ORR Exit 1", location: "Gachibowli", coords: [17.42, 78.34] as [number, number], aqi: 142 },
    { id: "exit-3", type: 'exit', title: "ORR Exit 3", location: "Patancheru", coords: [17.53, 78.26] as [number, number], aqi: 156 },
    { id: "exit-4", type: 'exit', title: "ORR Exit 4", location: "Sultanpur", coords: [17.56, 78.32] as [number, number], aqi: 128 },
    { id: "exit-6", type: 'exit', title: "ORR Exit 6", location: "Medchal", coords: [17.62, 78.48] as [number, number], aqi: 115 },
    { id: "exit-7", type: 'exit', title: "ORR Exit 7", location: "Shamirpet", coords: [17.60, 78.56] as [number, number], aqi: 98 },
    { id: "exit-8", type: 'exit', title: "ORR Exit 8", location: "Keesara", coords: [17.52, 78.68] as [number, number], aqi: 85 },
    { id: "exit-9", type: 'exit', title: "ORR Exit 9", location: "Ghatkesar", coords: [17.44, 78.68] as [number, number], aqi: 110 },
    { id: "exit-10", type: 'exit', title: "ORR Exit 10", location: "Taramatipet", coords: [17.38, 78.65] as [number, number], aqi: 95 },
    { id: "exit-11", type: 'exit', title: "ORR Exit 11", location: "Pedda Amberpet", coords: [17.32, 78.62] as [number, number], aqi: 105 },
    { id: "exit-12", type: 'exit', title: "ORR Exit 12", location: "Bongulur", coords: [17.22, 78.58] as [number, number], aqi: 88 },
    { id: "exit-13", type: 'exit', title: "ORR Exit 13", location: "Raviryal", coords: [17.20, 78.52] as [number, number], aqi: 72 },
    { id: "exit-14", type: 'exit', title: "ORR Exit 14", location: "Tukkuguda", coords: [17.23, 78.48] as [number, number], aqi: 65 },
    { id: "exit-15", type: 'exit', title: "ORR Exit 15", location: "Shamshabad", coords: [17.25, 78.43] as [number, number], aqi: 120 },
    { id: "exit-17", type: 'exit', title: "ORR Exit 17", location: "Rajendranagar", coords: [17.32, 78.40] as [number, number], aqi: 135 },
    { id: "exit-18", type: 'exit', title: "ORR Exit 18", location: "Kokapet", coords: [17.39, 78.33] as [number, number], aqi: 148 },
    { id: "rrr-exit-1", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Sangareddy Hub", coords: [17.62, 78.08] as [number, number], aqi: 45 },
    { id: "rrr-exit-2", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Toopran Junction", coords: [17.88, 78.48] as [number, number], aqi: 38 },
    { id: "rrr-exit-3", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Gajwel Hub", coords: [17.85, 78.68] as [number, number], aqi: 32 },
    { id: "rrr-exit-4", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Bhongir Junction", coords: [17.51, 78.88] as [number, number], aqi: 42 },
    { id: "rrr-exit-5", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Choutuppal Hub", coords: [17.24, 78.90] as [number, number], aqi: 48 },
    { id: "rrr-exit-6", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Ibrahimpatnam Junction", coords: [17.18, 78.65] as [number, number], aqi: 35 },
    { id: "rrr-exit-7", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Chevella Hub", coords: [17.30, 78.14] as [number, number], aqi: 28 },
    {
      id: "pollution-center",
      type: 'traffic-zone',
      title: "Industrial Core",
      location: "Sanath Nagar / Jeedimetla",
      coords: [17.47, 78.44] as [number, number],
      aqi: 210,
      noise: 95,
      forestRadius: 0,
      image: "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=800",
      description: "Heavy industrial emissions. Critical disadvantage for respiratory health and long-term residency."
    }
  ];

  return (
    <div className="h-full w-full relative overflow-hidden flex">
      <div className="flex-1 relative">
        <AnimatePresence>
          {selectedSanctuary && (
            <>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedId(null)}
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-[1000]"
              />
              <PropertyDetailOverlay 
                sanctuary={selectedSanctuary} 
                onClose={() => setSelectedId(null)} 
              />
            </>
          )}
        </AnimatePresence>

        {/* Floating Map Controls */}
        <div className="absolute top-6 left-6 z-[1000] flex flex-col gap-3">
          <div className="bg-white/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-outline/10 flex items-center">
            <div className="p-2 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-primary">
              <Search className="w-4 h-4" />
            </div>
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={selectedId || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-[10px] font-headline tracking-widest uppercase font-bold w-48 px-2"
            />
          </div>
          <div className="bg-white/90 backdrop-blur-md p-2 rounded-xl shadow-xl border border-outline/10 flex flex-col gap-4">
            <div className="p-2 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-secondary hover:text-primary">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="p-2 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-secondary hover:text-primary">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* View Controls Overlay */}
        <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
          <button 
            onClick={() => setIsRegionalView(!isRegionalView)}
            className={cn(
              "px-4 py-2 text-[9px] uppercase tracking-widest font-bold border transition-all bg-white/90 backdrop-blur-md rounded-lg shadow-lg",
              isRegionalView ? "text-primary border-primary" : "text-secondary border-outline/20"
            )}
          >
            Regional View (RRR)
          </button>
          <button 
            onClick={() => setShowAqi(!showAqi)}
            className={cn(
              "px-4 py-2 text-[9px] uppercase tracking-widest font-bold border transition-all bg-white/90 backdrop-blur-md rounded-lg shadow-lg flex items-center gap-2",
              showAqi ? "text-red-600 border-red-600" : "text-secondary border-outline/20"
            )}
          >
            <Wind className="w-3 h-3" />
            AQI Heatmap
          </button>
          <button 
            onClick={() => setShowNoise(!showNoise)}
            className={cn(
              "px-4 py-2 text-[9px] uppercase tracking-widest font-bold border transition-all bg-white/90 backdrop-blur-md rounded-lg shadow-lg flex items-center gap-2",
              showNoise ? "text-blue-600 border-blue-600" : "text-secondary border-outline/20"
            )}
          >
            <VolumeX className="w-3 h-3" />
            Noise Heatmap
          </button>
          {(showAqi || showNoise) && (
            <div className="mt-2 px-3 py-1 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-full animate-pulse flex items-center gap-2 self-end">
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
              Live Data Feed
            </div>
          )}
        </div>

        {/* Bottom Right Action */}
        <div className="absolute bottom-6 right-6 z-[1000]">
          <button className="px-6 py-3 bg-olive-900 text-cream text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-all">
            <Layers className="w-4 h-4" />
            View Site Plan
          </button>
        </div>

        <MapContainer 
          center={[17.49, 78.38]} 
          zoom={10} 
          scrollWheelZoom={true} 
          zoomControl={false}
          className="h-full w-full"
          style={{ background: isSatellite ? 'transparent' : '#f4e4bc' }}
        >
          <ZoomControl position="bottomleft" />
          <MapController targetView={targetView} />
          <ZoomTracker onZoom={setCurrentZoom} />
          {isSatellite ? (
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              opacity={0.7}
            />
          )}

          {/* Real-time Environmental Mesh */}
          {gridPoints.map((point, idx) => {
            const aqiIntensity = getIntensity(point, AQI_HOTSPOTS);
            const noiseIntensity = getIntensity(point, NOISE_HOTSPOTS);
            const pulseFactor = Math.sin((idx + livePulse) * 0.1) * 0.05;

            return (
              <React.Fragment key={`grid-${idx}`}>
                {showAqi && (
                  <Circle 
                    center={[point.lat, point.lng]}
                    radius={isTelanganaView ? 12000 : 3500}
                    pathOptions={{
                      fillColor: aqiIntensity > 0.6 ? '#ef4444' : aqiIntensity > 0.3 ? '#fb923c' : '#2dd4bf',
                      color: 'transparent',
                      fillOpacity: (aqiIntensity * 0.2) + (pulseFactor * 0.5)
                    }}
                  />
                )}
                {showNoise && (
                  <Circle 
                    center={[point.lat, point.lng]}
                    radius={isTelanganaView ? 12000 : 3500}
                    pathOptions={{
                      fillColor: noiseIntensity > 0.6 ? '#3b82f6' : noiseIntensity > 0.3 ? '#60a5fa' : '#a5f3fc',
                      color: 'transparent',
                      fillOpacity: (noiseIntensity * 0.2) + (pulseFactor * 0.5)
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {/* Infrastructure Outlines */}
          {/* ORR Highlight Glow */}
          <Polyline 
            positions={ORR_PATH}
            pathOptions={{ 
              color: '#78350f', 
              weight: 12, 
              opacity: 0.1,
            }}
          />
          <Polyline 
            positions={ORR_PATH}
            pathOptions={{ 
              color: '#78350f', 
              weight: 4, 
              opacity: 0.9,
              dashArray: '10, 5'
            }}
          />
          {/* RRR Outline (Less Opaque than ORR but visible) */}
          <Polyline 
            positions={RRR_PATH}
            pathOptions={{ 
              color: '#d97706', 
              weight: 3, 
              opacity: 0.6,
              dashArray: '5, 10'
            }}
          />
          
          {showOrr && (
            <Polyline 
              positions={ORR_PATH}
              pathOptions={{ 
                color: '#78350f', 
                weight: 8, 
                opacity: 0.4,
              }}
            />
          )}

          {NATURAL_FEATURES.map((feature) => (
            <Polygon 
              key={feature.id}
              positions={feature.boundary}
              pathOptions={{
                fillColor: feature.type === 'lake' ? '#0ea5e9' : '#15803d',
                color: feature.type === 'lake' ? '#0284c7' : '#166534',
                weight: 1,
                fillOpacity: 0.4,
              }}
            >
              <Popup className="custom-popup">
                <div className="p-3">
                  <div className="flex items-center gap-2 mb-2">
                    {feature.type === 'lake' ? <Droplets className="w-4 h-4 text-sky-600" /> : <Trees className="w-4 h-4 text-green-700" />}
                    <h4 className="font-headline font-bold text-sm uppercase tracking-wider">{feature.title}</h4>
                  </div>
                  <p className="text-[10px] text-secondary/80 leading-relaxed">{feature.description}</p>
                  <div className="mt-3 pt-2 border-t border-outline/10">
                    <span className="text-[8px] uppercase tracking-widest font-bold text-primary">Ecological Asset</span>
                  </div>
                </div>
              </Popup>
            </Polygon>
          ))}

          {locations.map((loc) => {
            const isPremium = loc.type === 'sanctuary';
            const isExit = loc.type === 'exit' || loc.type === 'rrr-exit';
            
            if (!isPremium && !isExit) return null;

            return (
              <React.Fragment key={loc.id}>
                {loc.type === 'sanctuary' && (
                  <Circle 
                    center={loc.coords}
                    radius={loc.forestRadius}
                    eventHandlers={{
                      click: () => {
                        setSelectedId(loc.id);
                        setTargetView({ center: loc.coords, zoom: 14 });
                      }
                    }}
                    pathOptions={{ 
                      fillColor: '#6366f1', 
                      color: '#6366f1', 
                      weight: 1, 
                      fillOpacity: isSatellite ? 0.35 : 0.25 
                    }}
                  >
                    <Popup className="custom-popup">
                      <SanctuaryPopupContent loc={loc} />
                    </Popup>
                  </Circle>
                )}
                {isPremium && (
                  <Marker 
                    position={loc.coords}
                    eventHandlers={{
                      click: () => {
                        setSelectedId(loc.id);
                        setTargetView({ center: loc.coords, zoom: 14 });
                      }
                    }}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div class="w-10 h-10 bg-olive-900 rounded-full border-2 border-cream flex items-center justify-center shadow-2xl animate-bounce">
                              <div class="w-6 h-6 bg-cream rounded-full flex items-center justify-center">
                                <div class="w-2 h-2 bg-olive-900 rounded-full"></div>
                              </div>
                            </div>`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 40]
                    })}
                  >
                    <Popup className="custom-popup">
                      <SanctuaryPopupContent loc={loc} />
                    </Popup>
                  </Marker>
                )}
                {isExit && (
                  <Circle 
                    center={loc.coords}
                    radius={loc.type === 'exit' ? 300 : 500}
                    pathOptions={{
                      fillColor: loc.type === 'exit' ? '#78350f' : '#d97706',
                      color: '#fff',
                      weight: 1,
                      fillOpacity: 0.8
                    }}
                  >
                    {currentZoom > 11 && loc.type === 'exit' && (
                      <Tooltip 
                        permanent 
                        direction="top" 
                        className="custom-tooltip"
                        offset={[0, -5]}
                      >
                        <div className="px-2 py-1 bg-white/95 backdrop-blur-md rounded border border-olive-800/20 shadow-xl flex flex-col items-center min-w-[60px]">
                          <span className="text-[9px] font-black text-olive-900 uppercase tracking-tighter leading-none">
                            {loc.title.replace('ORR Exit ', 'EXIT ')}
                          </span>
                          <span className="text-[7px] font-bold text-olive-800/60 uppercase tracking-widest mt-0.5">
                            {loc.location}
                          </span>
                        </div>
                      </Tooltip>
                    )}
                    <Popup className="custom-popup">
                      <div className="p-3">
                        <h4 className="font-headline font-bold text-sm uppercase tracking-wider">{loc.title}</h4>
                        <p className="text-[10px] text-secondary/60 uppercase tracking-widest mb-2">{loc.location}</p>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-[9px] font-bold uppercase tracking-widest">AQI: {loc.aqi}</span>
                        </div>
                      </div>
                    </Popup>
                  </Circle>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

const Sanctuaries = ({ isSubscribed, onNewsletterClick, isFullPage = false }: { isSubscribed: boolean, onNewsletterClick: () => void, isFullPage?: boolean }) => {
  return (
    <section id="agartha" className={cn(
      "px-12 md:px-24",
      isFullPage ? "py-24" : "py-48"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-32 gap-12">
          <div className="max-w-3xl">
            <span className="text-olive-800 text-[10px] font-bold uppercase tracking-[0.6em] mb-6 block">Curated Portfolio</span>
            <h2 className="text-6xl md:text-8xl font-medium text-olive-900">Curated <br /><span className="italic text-olive-800">Sanctuaries.</span></h2>
            <p className="text-xl md:text-2xl font-light text-olive-900/40 leading-relaxed mt-8">
              Naturally organic, sustainable, and strictly premium. From the forest peripheral of Narsapur (Free Access) to the vertical landmarks of the highway (Newsletter Access).
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {SANCTUARIES.map(s => (
            <SanctuaryCard 
              key={s.id} 
              sanctuary={s} 
              isSubscribed={isSubscribed} 
              onNewsletterClick={onNewsletterClick} 
            />
          ))}
        </div>
      </div>
    </section>
  );
};

const Membership = () => {
  const benefits = [
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ),
      title: "Limited Collective",
      desc: "We accommodate only 20-30 premium clients total for The Green Team membership. Exclusivity is our core mandate."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M2 20c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <path d="M14 20c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <path d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4" />
          <path d="M12 4c0-1.1.9-2 2-2s2 .9 2 2" />
        </svg>
      ),
      title: "Project Scarcity",
      desc: "Maximum of 20 slots per project. Early entry is not just an advantage; it's a requirement for the elite circle."
    },
    {
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M12 8v4" />
          <path d="M12 16h.01" />
        </svg>
      ),
      title: "Privilege Access",
      desc: "Membership is granted via a call with investors or a 1-year free subscription for selected early adopters."
    }
  ];

  return (
    <section id="membership" className="py-48 px-12 md:px-24 bg-olive-800 text-cream">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-cream/60 text-[10px] font-bold uppercase tracking-[0.6em] mb-8 block">The Membership</span>
            <h2 className="text-5xl md:text-8xl font-medium mb-12">The Power of <br /><span className="italic text-gold">Collective</span> Intelligence.</h2>
            <p className="text-xl md:text-2xl font-light text-cream/60 leading-relaxed mb-16">
              As independent curators, we partner with visionary developers like MODCON to bring you organic properties that matter. Membership is the key to unlocking India's most serene real estate.
            </p>
            <div className="p-8 border border-gold/20 bg-gold/5 inline-block">
              <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-2">Current Capacity</p>
              <p className="text-3xl font-serif italic">Limited to 30 Premium Clients Total</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {benefits.map((b, i) => (
              <div key={i} className="p-10 border border-cream/10 bg-white/5 backdrop-blur-sm">
                <div className="text-gold mb-6">{b.icon}</div>
                <h4 className="text-2xl font-bold mb-4">{b.title}</h4>
                <p className="text-cream/60 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const NewsletterModal = ({ isOpen, onClose, onSubscribe }: { isOpen: boolean, onClose: () => void, onSubscribe: () => void }) => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    console.log("Newsletter Signup:", data);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSubscribe();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-olive-900/90 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-cream w-full max-w-xl p-12 md:p-20 shadow-2xl border border-olive-800/10"
          >
            <button onClick={onClose} className="absolute top-8 right-8 text-olive-900/40 hover:text-olive-900 transition-all">
              <VolumeX className="w-6 h-6 rotate-45" />
            </button>

            <div className="text-center mb-12">
              <div className="w-12 h-12 text-olive-800 mx-auto mb-8">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                  <path d="M22 17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9.5C2 7 4 5 6.5 5H17.5C20 5 22 7 22 9.5V17Z" />
                  <path d="M2 9.5L12 14L22 9.5" />
                </svg>
              </div>
              <h2 className="text-4xl font-serif italic text-olive-900 mb-4">The Monthly Dispatch.</h2>
              <p className="text-olive-800/60 font-light leading-relaxed">
                Join our collective to receive monthly updates on organic landmarks, resource security, and exclusive early-entry coordinates.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Private Email</label>
                <input {...register("email", { required: true })} className="input-cashew" placeholder="email@domain.com" />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full btn-membership btn-olive"
              >
                {isSubmitting ? "Authenticating..." : "Join Newsletter & Unlock"}
              </button>
              <p className="text-[8px] uppercase tracking-[0.3em] text-olive-800/30 text-center">
                Unlocks access to The SIL and future landmarks.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ApplicationForm = () => {
  const { register, handleSubmit, formState: { isSubmitting } } = useForm();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (data: any) => {
    console.log("Membership Application:", data);
    await new Promise(resolve => setTimeout(resolve, 2500));
    setSubmitted(true);
  };

  return (
    <section id="apply" className="py-48 px-12 md:px-24 bg-cream">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <h2 className="text-5xl md:text-7xl font-medium text-olive-900 mb-12">Apply for <br /><span className="italic text-olive-800">Membership.</span></h2>
            <p className="text-xl md:text-2xl font-light text-olive-900/40 leading-relaxed">
              We seek intelligent individuals who believe that a community's strength lies in its shared ethics and environmental stewardship.
            </p>
          </div>

          <div className="bg-white p-12 md:p-20 shadow-2xl border border-olive-800/5">
            {submitted ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <Check className="w-16 h-16 text-olive-800 mx-auto mb-8" />
                <h3 className="text-3xl font-serif italic text-olive-900 mb-6">Application Logged.</h3>
                <p className="text-olive-800/60 font-light leading-relaxed">
                  Our membership board will review your profile. A relationship manager will contact you for a private briefing.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Full Name</label>
                  <input {...register("name", { required: true })} className="input-cashew" placeholder="Your Name" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Private Email</label>
                  <input {...register("email", { required: true })} className="input-cashew" placeholder="email@domain.com" />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Ethical Intent</label>
                  <textarea 
                    {...register("intent")} 
                    className="input-cashew min-h-[120px] resize-none"
                    placeholder="Why does community ethics matter to you?"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full btn-membership btn-olive flex items-center justify-center gap-4"
                >
                  {isSubmitting ? "Processing..." : "Submit Application"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="bg-olive-900 text-cream py-32 px-12 md:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-24 mb-32">
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-12">
              <Logo className="w-10 h-10 text-cream" />
            </div>
            <p className="text-xl font-light text-cream/30 max-w-md leading-relaxed">
              Independent collective curating India's most exclusive organic sanctuaries. Featuring MODCON Agartha and The SIL at Tukkuguda.
            </p>
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-gold mb-12">The Agenda</p>
            <ul className="space-y-6 text-[10px] uppercase tracking-[0.4em] text-cream/40">
              <li><a href="#the-advantage" className="hover:text-cream transition-all">Advantage</a></li>
              <li><a href="#ecosystems" className="hover:text-cream transition-all">Ecosystems</a></li>
              <li><a href="#map" className="hover:text-cream transition-all">Map</a></li>
              <li><a href="#agartha" className="hover:text-cream transition-all">Agartha</a></li>
              <li><a href="#the-sil" className="hover:text-cream transition-all">The SIL</a></li>
              <li><a href="#apply" className="hover:text-cream transition-all">Apply</a></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-gold mb-12">Collective</p>
            <div className="flex gap-8">
              <a href="#" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>
        </div>
        
        <div className="pt-12 border-t border-cream/5 flex flex-col md:flex-row justify-between items-center gap-12 text-[9px] uppercase tracking-[0.5em] text-cream/10 font-bold">
          <p>© {new Date().getFullYear()} The Green Team - Independent Sanctuary Curators. All rights reserved.</p>
          <div className="flex gap-16">
            <a href="#" className="hover:text-cream transition-all">Privacy</a>
            <a href="#" className="hover:text-cream transition-all">Ethics</a>
            <a href="#" className="hover:text-cream transition-all">Legal</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const NewsletterHighlight = ({ onSubscribe }: { onSubscribe: () => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setDone(true);
    onSubscribe();
  };

  return (
    <section className="py-32 px-6 md:px-24 bg-olive-800 text-cream overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50S28 10 50 10s40 18 40 40-18 40-40 40z" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em] mb-8 block">The Intelligence Network</span>
            <h2 className="text-5xl md:text-7xl font-medium mb-12">Stay ahead of <br /><span className="italic text-cream/60">the resource curve.</span></h2>
            <p className="text-xl font-light text-cream/60 leading-relaxed max-w-md">
              Receive private briefings on environmental integrity, sanctuary valuations, and new curation alerts.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-12 md:p-20 border border-white/10">
            {done ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                <Check className="w-12 h-12 text-gold mx-auto mb-6" />
                <h3 className="text-2xl font-serif italic mb-4">You are on the list.</h3>
                <p className="text-cream/40 text-sm font-light">Welcome to the intelligence network.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSub} className="space-y-12">
                <div className="space-y-4">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-cream/40">Secure Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-transparent border-b border-white/20 py-6 outline-none focus:border-gold transition-all font-light text-2xl text-cream placeholder:text-white/10" 
                    placeholder="email@domain.com" 
                  />
                </div>
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-6 bg-gold text-olive-900 text-[10px] uppercase tracking-[0.5em] font-bold hover:bg-cream transition-all flex items-center justify-center gap-4"
                >
                  {loading ? "Registering..." : "Join the Collective"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const ChatBot = ({ data }: { data: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "I am Groot. (Welcome to The Green Team. I am Groot, your sanctuary advisor. How can I assist you with your ethical investment today?)" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      const systemInstruction = `You are "Groot", a sophisticated AI advisor for "The Green Team". 
      You have a "Marvel sentiment" - you are heroic, protective of nature, and occasionally witty. 
      While you are Groot, you MUST be helpful. You can start your responses with "I am Groot" but then provide the actual helpful information in parentheses or as a translation.
      You are professional, exclusive, and ethical. 
      You have access to the following data: ${JSON.stringify(data)}.
      You can also see real-time environmental heatmaps (AQI and Noise) on the map view. 
      AQI is shown in a red spectrum (red/orange/teal), and Noise is shown in a bluish spectrum (blue/indigo/cyan).
      Your goal is to help users understand the value of self-sustaining sanctuaries (food, water, energy security) and guide them towards membership.
      Be concise and maintain a premium tone.`;

      const response = await ai.models.generateContent({
        model,
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })).concat({ role: 'user', parts: [{ text: userMsg }] }),
        config: { systemInstruction }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I am Groot. (I apologize, I am currently unable to process your request. Please contact our relationship managers directly.)" }]);
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I am Groot. (I encountered an error. Please try again later.)" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-[100] w-16 h-16 bg-olive-900 text-cream rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all duration-500 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-primary/20 scale-0 group-hover:scale-100 transition-transform duration-500 rounded-full"></div>
        <MessageSquare className="w-8 h-8 relative z-10" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Click-off area for ChatBot - Minimizes */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[95] bg-black/10 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-32 right-8 z-[100] w-[400px] max-w-[calc(100vw-4rem)] h-[600px] bg-white shadow-2xl border border-olive-800/10 flex flex-col overflow-hidden rounded-3xl"
            >
              <div className="bg-olive-900 p-6 text-cream flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                    <Leaf className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-headline font-bold text-xl tracking-tight">Groot</h3>
                    <p className="text-[8px] uppercase tracking-[0.3em] text-cream/60">Sanctuary AI Advisor</p>
                  </div>
                </div>
                <button onClick={handleClose} className="p-2 hover:bg-white/10 transition-all rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-cream/10">
                {messages.map((m, i) => (
                  <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                    <div className={cn(
                      "max-w-[85%] p-4 text-sm leading-relaxed rounded-2xl shadow-sm",
                      m.role === 'user' 
                        ? "bg-olive-900 text-cream rounded-tr-none" 
                        : "bg-white text-olive-900 border border-outline/10 rounded-tl-none"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start">
                    <div className="bg-white border border-outline/10 p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-olive-800/60 italic">Groot is thinking...</span>
                        <div className="flex gap-1">
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-primary rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-primary rounded-full" />
                          <motion.div animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-primary rounded-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-white border-t border-outline/10">
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask Groot about sanctuaries..."
                    className="w-full bg-cream/20 border border-outline/20 rounded-2xl py-4 pl-6 pr-16 text-sm focus:outline-none focus:border-primary/50 transition-all"
                  />
                  <button 
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="absolute right-2 p-3 bg-olive-900 text-cream rounded-xl hover:bg-primary transition-all disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const HomeView = ({ isSubscribed, onNewsletterClick }: { isSubscribed: boolean, onNewsletterClick: () => void }) => (
  <div className="flex flex-col">
    <Hero />
    <Advantage />
    <EcosystemPillars />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />
    <TheSIL isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />
    <NewsletterHighlight onSubscribe={onNewsletterClick} />
    <Footer />
  </div>
);

export default function App() {
  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('gt_subscribed') === 'true';
  });
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'home' | 'map' | 'list' | 'gallery' | 'analytics' | 'the-sil'>('home');

  const handleSubscribe = () => {
    setIsSubscribed(true);
    localStorage.setItem('gt_subscribed', 'true');
  };

  return (
    <div className="h-screen w-screen bg-cream text-olive-900 overflow-hidden flex flex-col">
      <Navbar isSubscribed={isSubscribed} onNewsletterClick={() => setIsNewsletterOpen(true)} onModeChange={setViewMode} />
      
      <main className="flex-1 flex overflow-hidden relative">
        {/* Center - Map or other views */}
        <div className="flex-1 relative overflow-hidden bg-surface">
          {viewMode === 'map' && <SanctuaryMapLayout />}
          {viewMode !== 'map' && (
            <div className="h-full w-full overflow-y-auto">
              {viewMode === 'home' && <HomeView isSubscribed={isSubscribed} onNewsletterClick={() => setIsNewsletterOpen(true)} />}
              {viewMode === 'list' && <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={() => setIsNewsletterOpen(true)} isFullPage />}
              {viewMode === 'gallery' && <EcosystemPillars isFullPage />}
              {viewMode === 'analytics' && <Advantage isFullPage />}
              {viewMode === 'the-sil' && <TheSIL isSubscribed={isSubscribed} onNewsletterClick={() => setIsNewsletterOpen(true)} isFullPage />}
            </div>
          )}
        </div>
      </main>

      <ChatBot data={{ sanctuaries: SANCTUARIES }} />
      
      <NewsletterModal 
        isOpen={isNewsletterOpen} 
        onClose={() => setIsNewsletterOpen(false)} 
        onSubscribe={handleSubscribe} 
      />
    </div>
  );
}
