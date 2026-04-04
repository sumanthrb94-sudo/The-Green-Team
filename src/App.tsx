import React, { useState, useEffect, useMemo, useCallback, useRef, FC } from 'react';
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
  Plane,
  Moon,
  Activity,
  Globe2,
  Home,
  Route,
  RotateCcw
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { cn } from './lib/utils';
import { GoogleGenAI } from "@google/genai";

import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, ZoomControl, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { AlertTriangle, ZoomIn, LogOut, RefreshCw, Users, Mail as MailIcon, ShieldCheck } from 'lucide-react';
import L from 'leaflet';

// Firebase
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import type { User, ConfirmationResult } from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { saveLead, saveNewsletter, getLeads, getNewsletterSubs } from './lib/leads';
import type { Lead, NewsletterEntry } from './lib/leads';

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
  tagline?: string;
  description?: string;
  plots?: number;
  plotRange?: string;
  amenityAcres?: string;
  architect?: string;
  plotImages?: string[];
  pricePerSqYd?: number;
}

// --- Mock Data ---

const SANCTUARIES: Sanctuary[] = [
  {
    id: 'agartha',
    title: 'MODCON Agartha',
    location: 'Narsapur Forest Peripheral, Hyderabad',
    aqi: 12,
    noise: 18,
    commute: '45 mins to Financial District',
    pricePerSqYd: 7999,
    valuation: '₹1.04 Cr',
    memberPrice: 'From ₹64.6 L',
    image: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&q=80&w=1200',
    tagline: 'Where the forest becomes home.',
    description: 'MODCON Agartha is a first-of-its-kind biomorphic residential community carved into the Narsapur forest periphery. 53 thoughtfully sized plots surround a 14,548 sq yd organic amenity core — featuring fluid earth architecture, solar-integrated curved roofs, and living canopies that blur the line between structure and forest. No two plots are the same. No straight lines anywhere.',
    plots: 53,
    plotRange: '808 – 5,097 sq yds',
    amenityAcres: '14,548 sq yds',
    architect: 'MODCON Builders',
    features: [
      'Biomorphic Architecture',
      'Solar-Curved Rooftops',
      'Narsapur Forest Buffer',
      'Organic Amenity Core',
      'Rainwater Harvesting',
      'Earth & Bamboo Build',
      'Zero Right-Angle Design',
      'Private Plot Community',
    ],
  },
  {
    id: 'syl',
    title: 'SYL: Vertical Villament',
    location: 'Tukkuguda (Future City)',
    aqi: 22,
    noise: 24,
    commute: '15 mins to Future City Hub',
    valuation: '₹4.0 Cr',
    memberPrice: '₹1.9 Cr',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    features: ['Vertical Forest', 'Smart Energy', 'Zero Waste', 'Community Hub']
  },
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

const Navbar = ({ isSubscribed, onNewsletterClick, onModeChange, isDark, setIsDark, onSignInClick, authUser, onSignOut }: {
  isSubscribed: boolean;
  onNewsletterClick: () => void;
  onModeChange: (mode: any) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  onSignInClick: () => void;
  authUser: User | null;
  onSignOut: () => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Map', id: 'map' },
    { name: 'Advantage', id: 'analytics' },
    { name: 'Ecosystems', id: 'gallery' },
    { name: 'Agartha', id: 'list' },
    { name: 'SYL', id: 'syl' },
    { name: 'Membership', id: 'membership' },
  ];

  const avatarLetter = (authUser?.displayName?.[0] || authUser?.email?.[0] || authUser?.phoneNumber?.[1] || '?').toUpperCase();

  return (
    <nav className="relative z-50 px-6 md:px-10 flex items-center justify-between h-16 md:h-20 bg-cream border-b border-outline/10">
      {/* Left: Brand only */}
      <Logo className="w-7 h-7" textClassName="text-base md:text-lg" />

      {/* Right: single trigger — avatar (logged in) or hamburger (logged out) */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Open menu"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary/5 transition-colors"
      >
        {authUser ? (
          authUser.photoURL ? (
            <img
              src={authUser.photoURL}
              referrerPolicy="no-referrer"
              alt="Profile"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm uppercase select-none">
              {avatarLetter}
            </div>
          )
        ) : (
          <div className="space-y-[5px] py-1">
            <div className={cn("w-6 h-[2px] bg-primary transition-all duration-300", isMenuOpen && "rotate-45 translate-y-[7px]")} />
            <div className={cn("w-4 h-[2px] bg-primary transition-all duration-300", isMenuOpen && "opacity-0 w-6")} />
            <div className={cn("w-6 h-[2px] bg-primary transition-all duration-300", isMenuOpen && "-rotate-45 -translate-y-[7px]")} />
          </div>
        )}
      </button>

      {/* Full-screen menu overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              key="nav-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[55]"
            />

            <motion.div
              key="nav-panel"
              initial={{ opacity: 0, y: '-100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 bg-surface z-[60] flex flex-col p-8 md:p-16 shadow-2xl rounded-b-[40px] max-h-[95vh] overflow-y-auto"
            >
              {/* Panel header */}
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
                {/* Nav links */}
                <div className="flex flex-col gap-6">
                  <p className="text-[10px] uppercase tracking-[0.6em] text-secondary font-bold opacity-40">Explore</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                    {navItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (['home', 'map', 'analytics', 'gallery', 'list', 'syl'].includes(item.id)) {
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

                {/* CTA / Account section */}
                <div className="flex flex-col justify-end pt-12 md:pt-0 border-t md:border-t-0 md:border-l border-outline/10 md:pl-24 gap-4">
                  {authUser ? (
                    /* Logged-in state */
                    <>
                      <div className="flex items-center gap-4 mb-6">
                        {authUser.photoURL ? (
                          <img src={authUser.photoURL} referrerPolicy="no-referrer" alt="Profile" className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/20" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-lg uppercase select-none">
                            {avatarLetter}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-bold text-on-surface truncate max-w-[180px]">{authUser.displayName || authUser.email || authUser.phoneNumber}</p>
                          <p className="text-[10px] uppercase tracking-widest text-secondary/60 mt-0.5">Member</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onModeChange('map');
                        }}
                        className="w-full text-[11px] uppercase tracking-[0.5em] font-bold bg-primary text-on-primary px-8 py-5 hover:shadow-xl hover:shadow-primary/20 transition-all rounded-2xl"
                      >
                        Explore Sanctuaries
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSignOut();
                        }}
                        className="w-full text-[11px] uppercase tracking-[0.5em] font-bold text-error border-2 border-error/20 px-8 py-5 hover:bg-error hover:text-white hover:border-error transition-all rounded-2xl flex items-center justify-center gap-3"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </>
                  ) : (
                    /* Logged-out state — conversion CTA */
                    <>
                      <p className="text-[10px] uppercase tracking-[0.4em] text-secondary/50 font-bold mb-2">Join The Collective</p>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onSignInClick();
                        }}
                        className="w-full text-[11px] uppercase tracking-[0.5em] font-bold bg-primary text-on-primary px-8 py-5 hover:shadow-xl hover:shadow-primary/20 transition-all rounded-2xl"
                      >
                        Sign In
                      </button>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          onNewsletterClick();
                        }}
                        className="w-full text-[11px] uppercase tracking-[0.5em] font-bold text-primary border-2 border-primary/20 px-8 py-5 hover:bg-primary hover:text-on-primary hover:border-primary transition-all rounded-2xl text-center"
                      >
                        Get Early Access
                      </button>
                    </>
                  )}

                  {/* Dark mode toggle — blended in */}
                  <button
                    onClick={() => setIsDark(!isDark)}
                    className="flex items-center gap-3 text-[10px] uppercase tracking-[0.4em] text-secondary/50 font-bold hover:text-primary transition-colors mt-2 self-start"
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                </div>
              </div>

              {/* Footer row */}
              <div className="mt-16 pt-8 border-t border-outline/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex gap-8">
                  <span className="text-[9px] uppercase tracking-widest text-secondary/50">Privacy Policy</span>
                  <span className="text-[9px] uppercase tracking-widest text-secondary/50">Terms of Service</span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-secondary/40">© 2026 The Green Team</p>
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
    { name: 'SYL', id: 'syl', icon: Shield },
  ];

  return (
    <aside className="hidden md:flex h-full w-24 flex-col items-center py-8 bg-surface border-r border-outline/10 z-40 shadow-sm">
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
    <section className="relative flex flex-col justify-start px-6 md:px-24 pt-6 pb-12 overflow-hidden cashew-gradient">
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
          <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="w-8 md:w-12 h-px bg-olive-800/40"></div>
            <span className="text-olive-800 text-[8px] md:text-[10px] font-bold uppercase tracking-[0.4em] md:tracking-[0.6em]">Independent Sanctuary Curators</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl md:text-[8rem] font-light text-olive-900 mb-8 md:mb-12 leading-[1.1] md:leading-[0.9] tracking-tighter">
            The Science of <br />
            <span className="italic text-olive-800 font-medium">Early Entry.</span>
          </h1>
          
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-end">
            <p className="text-lg md:text-2xl font-normal text-olive-900/90 leading-relaxed max-w-xl">
              A growing community in Hyderabad and India's metropolitans, securing self-sustaining sanctuaries where food, water, and energy are curated for the future.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 md:gap-8 pt-4">
              <button className="btn-membership btn-olive group w-full sm:w-auto shadow-lg hover:shadow-xl shadow-olive-900/20">
                Apply for Membership <ArrowUpRight className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </button>
              <button className="btn-membership btn-outline-olive w-full sm:w-auto hover:shadow-lg">
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
      "px-6 md:px-24 bg-surface",
      isFullPage ? "py-16" : "py-14"
    )}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="mb-10"
        >
          <span className="text-olive-800 text-xs font-bold uppercase tracking-[0.6em] mb-6 block">The Resource Agenda</span>
          <h2 className="text-5xl md:text-8xl font-medium text-olive-900">Self-Sustaining <br /><span className="italic text-olive-800">Ecosystems.</span></h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map((p, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, duration: 0.8 }}
              className="p-8 border border-olive-800/10 bg-cream/20 hover:bg-cream/40 transition-all rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1"
            >
              <div className="text-olive-800 mb-8">{p.icon}</div>
              <h4 className="text-2xl font-bold text-olive-900 mb-6">{p.title}</h4>
              <p className="text-olive-900/80 leading-relaxed text-base">{p.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Advantage = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  return (
    <section id="the-advantage" className={cn(
      "px-12 md:px-24 bg-surface/[0.01] border-y border-olive-800/5",
      isFullPage ? "py-16" : "py-14"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-8">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="lg:col-span-5"
          >
            <h2 className="text-5xl md:text-7xl font-medium text-olive-900">
              The <span className="italic text-olive-800">Intelligence</span> <br />Gap.
            </h2>
            <div className="w-24 h-1 bg-olive-800/20 mt-6"></div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="lg:col-span-7 space-y-6"
          >
            <p className="text-2xl md:text-4xl font-normal leading-snug text-olive-900/90">
              "Market negligence is your opportunity. While the crowd waits for the launch, our members have already secured their legacy."
            </p>
            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-olive-800/10 flex items-center justify-center rounded-xl shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-olive-800 w-6 h-6">
                    <path d="M3 12c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9-9 4.03-9 9z" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-olive-900">The 1 Cr Learning Curve</h4>
                <p className="text-olive-900/80 text-base leading-relaxed">
                  Knowing before the market is the difference between a 1 Crore entry and a 2 Crore regret. We bridge that gap for our elite circle.
                </p>
              </div>
              <div className="space-y-4">
                <div className="w-12 h-12 bg-olive-800/10 flex items-center justify-center rounded-xl shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-olive-800 w-6 h-6">
                    <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <h4 className="text-xl font-bold text-olive-900">The 40-Minute Radius</h4>
                <p className="text-olive-900/80 text-base leading-relaxed">
                  The projects we curate meet our minimum standards: reach your work in 40 minutes while living away from the polluted jungles.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const TheSIL = ({ isSubscribed, onNewsletterClick, isFullPage = false }: { isSubscribed: boolean, onNewsletterClick: () => void, isFullPage?: boolean }) => {
  return (
    <section id="syl" className={cn(
      "px-12 md:px-24 bg-olive-900 text-cream relative overflow-hidden",
      isFullPage ? "py-16" : "py-14"
    )}>
      {!isSubscribed && (
        <div className="absolute inset-0 z-20 bg-olive-900/80 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center">
          <Shield className="w-16 h-16 text-gold mb-8" />
          <h2 className="text-4xl md:text-6xl font-serif italic mb-6">Exclusive Access Required.</h2>
          <p className="text-cream/60 max-w-md mb-12 text-lg font-light leading-relaxed">
            SYL is a restricted landmark. Sign up for our monthly newsletter to unlock the full architectural briefing and coordinates.
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="px-3 py-1 bg-gold text-olive-900 text-[9px] font-bold uppercase tracking-widest">Upcoming Landmark</span>
              <span className="text-cream/40 text-[9px] uppercase tracking-[0.4em]">Tukkuguda</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-medium mb-6">SYL<br />Villament.</h2>
            <p className="text-lg md:text-xl font-light text-cream/60 leading-relaxed mb-6">
              Imagine an 18-floor masterpiece where **two floors equal one villa**. Amidst a landscape of traditional villas, SYL stands as the only tower—a soaring statement of exclusivity in Tukkuguda.
            </p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
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
            <div className="p-10 border border-cream/10 bg-surface/5 backdrop-blur-sm">
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

const SanctuaryCard: FC<{ sanctuary: Sanctuary, isSubscribed: boolean, onNewsletterClick: () => void, onOpen: () => void }> = ({ sanctuary, isSubscribed, onNewsletterClick, onOpen }) => {
  const isGated = sanctuary.id === 'syl' && !isSubscribed;

  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="group membership-card bg-surface relative overflow-hidden cursor-pointer"
      onClick={() => { if (!isGated) onOpen(); }}
    >
      {isGated && (
        <div className="absolute inset-0 z-10 bg-surface/60 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-12 h-12 text-primary mb-6" />
          <h4 className="text-2xl font-headline font-bold text-on-surface mb-4">Locked Landmark.</h4>
          <p className="text-xs text-secondary mb-8 max-w-[200px]">Sign up for our newsletter to view the SYL details.</p>
          <button 
            onClick={onNewsletterClick}
            className="px-6 py-3 bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold rounded-lg"
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
          <div className="bg-primary text-on-primary px-4 py-1 text-[9px] uppercase tracking-[0.4em] font-bold rounded-full">
            {sanctuary.id === 'syl' ? 'Upcoming' : 'Live'}
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
            {sanctuary.pricePerSqYd ? (
              <>
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary mb-1">₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}/sq yd</p>
                <p className="text-2xl font-headline text-on-surface font-bold">{sanctuary.memberPrice}</p>
                <p className="text-[9px] text-secondary/40">Typical ~{sanctuary.valuation}</p>
              </>
            ) : (
              <>
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary mb-1">Market Valuation</p>
                <p className="text-xl font-headline text-secondary/40 line-through">{sanctuary.valuation}</p>
                <p className="text-2xl font-headline text-on-surface font-bold">{sanctuary.memberPrice}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex gap-8 py-6 border-y border-outline/10">
          <div className="flex items-center gap-2">
            <Wind className="w-5 h-5 text-primary" />
            <span className="text-xs uppercase tracking-widest font-bold text-on-surface">AQI: {sanctuary.aqi}</span>
          </div>
          <div className="flex items-center gap-2">
            <VolumeX className="w-5 h-5 text-olive-800/60" />
            <span className="text-xs uppercase tracking-widest font-bold text-olive-900">{sanctuary.noise}dB</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); if (!isGated) onOpen(); }}
          className="w-full py-5 bg-olive-800 text-cream text-xs uppercase tracking-[0.3em] font-bold hover:bg-olive-900 rounded-lg hover:shadow-lg hover:shadow-olive-900/20 transition-all duration-300 transform hover:-translate-y-1 mt-2"
        >
          View Prospectus
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

// ─── Agartha Interactive Layout ──────────────────────────────────────────────

interface Hotspot {
  id: string;
  num: number;
  x: number;
  y: number;
  label: string;
  tag: string;
  detail: string;
  stats: { label: string; value: string }[];
}

const AGARTHA_HOTSPOTS: Hotspot[] = [
  {
    id: 'amenity-core', num: 1, x: 44, y: 50,
    label: 'Organic Amenity Core',
    tag: '14,548 Sq Yds',
    detail: 'The biomorphic heart of Agartha. Zero right angles — every curve echoes the surrounding forest. Infinity lap pool, social pavilions, canopy walkways, all in earth and bamboo.',
    stats: [{ label: 'Size', value: '14,548 sq yds' }, { label: 'Style', value: 'Biomorphic' }, { label: 'Material', value: 'Earth + Bamboo' }],
  },
  {
    id: 'forest-buffer', num: 2, x: 8, y: 40,
    label: 'Narsapur Forest Buffer',
    tag: 'AQI 12',
    detail: 'Direct boundary with the Narsapur forest reserve. AQI 12 — one of the cleanest micro-climates in the Hyderabad metro. Native bird corridors, natural white noise.',
    stats: [{ label: 'AQI', value: '12 — Pristine' }, { label: 'Noise', value: '18 dB' }, { label: 'Forest', value: 'Native Dry Deciduous' }],
  },
  {
    id: 'grand-entry', num: 3, x: 48, y: 8,
    label: 'Grand Entry Boulevard',
    tag: 'Gated Access',
    detail: 'A winding, landscaped approach lined with native canopy trees. No straight lines — the boulevard curves through the forest edge before revealing the community.',
    stats: [{ label: 'Access', value: 'Single gated entry' }, { label: 'Landscape', value: 'Native canopy' }, { label: 'Design', value: 'No straight lines' }],
  },
  {
    id: 'premium-corner', num: 4, x: 14, y: 72,
    label: 'Premium Corner — Plot 15',
    tag: '5,097 Sq Yds · ₹4.08 Cr',
    detail: 'The largest plot in Agartha. Corner positioning gives dual forest frontage and the greatest separation from neighbours. At ₹7,999/sq yd: ₹4.08 Cr.',
    stats: [{ label: 'Size', value: '5,097 sq yds' }, { label: 'Price', value: '₹4.08 Cr' }, { label: 'Frontage', value: 'Dual forest-facing' }],
  },
  {
    id: 'plot-community', num: 5, x: 62, y: 60,
    label: '53-Plot Private Community',
    tag: 'From ₹64.6 L',
    detail: '53 plots, each unique — no two the same. Sizes from 808 to 5,097 sq yds at ₹7,999/sq yd. A true private forest community, not a subdivision.',
    stats: [{ label: 'Total Plots', value: '53' }, { label: 'Starting', value: '₹64.6 L (808 sq yds)' }, { label: 'Rate', value: '₹7,999/sq yd' }],
  },
];

const AagarthaInteractiveLayout: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [active, setActive] = useState<Hotspot>(AGARTHA_HOTSPOTS[0]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-[#0e1409] flex flex-col md:flex-row overflow-hidden"
    >
      {/* ── LEFT: Site Plan image ── */}
      <div className="relative w-full md:flex-1 h-[48vh] md:h-auto overflow-hidden">
        <img
          src="/agartha-layout.jpg"
          alt="Agartha site plan"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1600'; }}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/40 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-4">
          <div>
            <p className="text-[8px] uppercase tracking-[0.5em] text-white/40 font-bold">Site Plan</p>
            <p className="text-sm font-bold text-white mt-0.5">MODCON Agartha</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Dot markers — no numbers, clean */}
        {AGARTHA_HOTSPOTS.map((h) => {
          const isActive = active.id === h.id;
          return (
            <button
              key={h.id}
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              onClick={() => setActive(h)}
            >
              <span className={cn(
                "relative block rounded-full border-2 border-white shadow-lg transition-all duration-200",
                isActive ? "w-4 h-4 bg-primary scale-125" : "w-3 h-3 bg-white/60 hover:bg-white hover:scale-125"
              )} />
              {isActive && (
                <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── RIGHT: Info panel ── */}
      <div className="w-full md:w-[360px] flex-shrink-0 bg-surface flex flex-col overflow-hidden">

        {/* Feature content */}
        <div className="flex-1 overflow-y-auto px-7 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-5"
            >
              <span className="text-[8px] uppercase tracking-[0.4em] text-secondary/50 font-bold">{active.tag}</span>

              <h3 className="text-xl font-headline font-bold text-on-surface leading-snug">{active.label}</h3>

              <p className="text-sm text-secondary/70 leading-relaxed">{active.detail}</p>

              <div className="pt-2 space-y-0">
                {active.stats.map(s => (
                  <div key={s.label} className="flex justify-between items-center py-3 border-b border-outline/10 last:border-0">
                    <span className="text-[9px] uppercase tracking-[0.3em] text-secondary/40 font-bold">{s.label}</span>
                    <span className="text-sm font-bold text-on-surface">{s.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap pt-2">
                {AGARTHA_HOTSPOTS.filter(h => h.id !== active.id).map(h => (
                  <button
                    key={h.id}
                    onClick={() => setActive(h)}
                    className="text-[8px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-outline/15 text-secondary/50 hover:text-primary hover:border-primary/30 transition-all"
                  >
                    {h.label.split(' ').slice(0, 2).join(' ')}
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-7 py-5 border-t border-outline/10 space-y-2 flex-shrink-0">
          <a
            href="https://www.modconbuilders.com/agartha"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            View Brochure — MODCON
          </a>
          <button
            onClick={onClose}
            className="w-full py-2.5 text-[9px] uppercase tracking-widest font-bold text-secondary/40 hover:text-primary transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const featureIcon = (f: string) => {
  if (f.includes('Solar') || f.includes('Energy')) return <Sun className="w-4 h-4" />;
  if (f.includes('Forest') || f.includes('Earth') || f.includes('Bamboo') || f.includes('Organic')) return <Leaf className="w-4 h-4" />;
  if (f.includes('Rain') || f.includes('Water')) return <Droplets className="w-4 h-4" />;
  if (f.includes('Zero') || f.includes('Private') || f.includes('Community')) return <Shield className="w-4 h-4" />;
  if (f.includes('Biomorphic') || f.includes('Design') || f.includes('Vertical')) return <Award className="w-4 h-4" />;
  return <Zap className="w-4 h-4" />;
};

const PropertyDetailOverlay = ({ sanctuary, onClose }: { sanctuary: Sanctuary, onClose: () => void }) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] z-[1001] bg-surface shadow-[-10px_0_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden"
    >
      {/* Hero image */}
      <div className="relative h-64 w-full overflow-hidden flex-shrink-0">
        <img
          src={sanctuary.image}
          alt={sanctuary.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all"
        >
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="absolute bottom-5 left-6">
          <span className="px-3 py-1 bg-primary text-on-primary text-[8px] uppercase tracking-widest font-bold rounded-full">
            {sanctuary.id === 'syl' ? 'Upcoming' : 'Open for Expression of Interest'}
          </span>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Title + price */}
        <div className="px-8 pt-8 pb-6 border-b border-outline/10">
          <div className="flex justify-between items-start gap-4">
            <div>
              {sanctuary.tagline && (
                <p className="text-[9px] uppercase tracking-[0.5em] text-primary font-bold mb-2">{sanctuary.tagline}</p>
              )}
              <h2 className="text-2xl font-headline font-bold text-on-surface leading-tight">{sanctuary.title}</h2>
              <div className="flex items-center gap-2 text-secondary text-xs mt-2">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                {sanctuary.location}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {sanctuary.pricePerSqYd ? (
                <>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Rate</p>
                  <p className="text-xl font-headline font-bold text-primary">₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}<span className="text-xs font-normal text-secondary/60">/sq yd</span></p>
                  <p className="text-[9px] text-secondary/50 mt-0.5">{sanctuary.memberPrice}</p>
                </>
              ) : (
                <>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Member Price</p>
                  <p className="text-xl font-headline font-bold text-primary">{sanctuary.memberPrice}</p>
                  <p className="text-xs text-secondary/40 line-through">{sanctuary.valuation}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Key stats */}
        <div className="grid grid-cols-3 divide-x divide-outline/10 border-b border-outline/10">
          <div className="px-4 py-5 text-center">
            <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">AQI</p>
            <p className="text-lg font-bold text-primary">{sanctuary.aqi}</p>
            <p className="text-[9px] text-secondary/50">Pure Air</p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Noise</p>
            <p className="text-lg font-bold text-on-surface">{sanctuary.noise} dB</p>
            <p className="text-[9px] text-secondary/50">Near Silent</p>
          </div>
          <div className="px-4 py-5 text-center">
            <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Commute</p>
            <p className="text-lg font-bold text-on-surface">45m</p>
            <p className="text-[9px] text-secondary/50">to Fin. District</p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Description */}
          {sanctuary.description && (
            <div>
              <p className="text-sm text-secondary/80 leading-relaxed">{sanctuary.description}</p>
            </div>
          )}

          {/* Plot community stats */}
          {sanctuary.plots && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-2xl font-headline font-bold text-primary">{sanctuary.plots}</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Private Plots</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-lg font-headline font-bold text-primary leading-tight">808–5,097</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Sq Yds Range</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-lg font-headline font-bold text-primary leading-tight">14,548</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Sq Yds Amenity</p>
              </div>
            </div>
          )}

          {/* Price breakdown table */}
          {sanctuary.pricePerSqYd && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold mb-4">
                Price Calculator — ₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}/sq yd
              </p>
              <div className="rounded-2xl overflow-hidden border border-outline/10">
                {[
                  { label: 'Plot 01 (Smallest)', sqYds: 808 },
                  { label: 'Typical Plot', sqYds: 1300 },
                  { label: 'Large Plot', sqYds: 2000 },
                  { label: 'Premium Plot', sqYds: 3000 },
                  { label: 'Plot 15 (Largest)', sqYds: 5097 },
                ].map((row, i) => {
                  const totalRs = row.sqYds * sanctuary.pricePerSqYd!;
                  const display = totalRs >= 1e7
                    ? `₹${(totalRs / 1e7).toFixed(2)} Cr`
                    : `₹${(totalRs / 1e5).toFixed(1)} L`;
                  return (
                    <div key={i} className={cn("grid grid-cols-3 px-4 py-3 text-[10px]", i % 2 === 0 ? "bg-primary/3" : "bg-transparent")}>
                      <span className="text-secondary/60 font-medium">{row.label}</span>
                      <span className="text-center font-bold text-on-surface">{row.sqYds.toLocaleString('en-IN')} sq yds</span>
                      <span className="text-right font-bold text-primary">{display}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[8px] text-secondary/40 mt-2">Rate: ₹7,999/sq yd</p>
            </div>
          )}

          {/* Features */}
          {sanctuary.features && sanctuary.features.length > 0 && (
            <div>
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold mb-4">Curated Features</p>
              <div className="grid grid-cols-2 gap-3">
                {sanctuary.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-outline/10 bg-surface-container-low/50">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      {featureIcon(feature)}
                    </div>
                    <span className="text-[10px] font-medium text-on-surface leading-tight">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Environmental integrity */}
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold mb-4">Environmental Integrity</p>
            <div className="space-y-3">
              {[
                { label: 'Air Quality Index', value: `${sanctuary.aqi} — Pristine`, bar: (50 - sanctuary.aqi) / 50 },
                { label: 'Ambient Noise', value: `${sanctuary.noise} dB — Near Silent`, bar: (50 - sanctuary.noise) / 50 },
                { label: 'Forest Proximity', value: 'Direct Boundary Access', bar: 0.95 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="uppercase tracking-widest text-secondary/60">{item.label}</span>
                    <span className="font-bold text-on-surface">{item.value}</span>
                  </div>
                  <div className="h-1 bg-outline/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.bar * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* By MODCON */}
          {sanctuary.architect && (
            <div className="flex items-center gap-3 p-4 border border-outline/10 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-widest text-secondary/50">Developed by</p>
                <p className="text-sm font-bold text-on-surface">{sanctuary.architect}</p>
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="space-y-3 pb-4">
            <a
              href="https://www.modconbuilders.com/agartha"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-4 bg-primary text-on-primary text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3"
            >
              <ArrowRight className="w-4 h-4" />
              View Full Brochure
            </a>
            <button className="w-full py-4 border border-outline/20 text-on-surface text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-3">
              <MessageSquare className="w-4 h-4" />
              Request Private Briefing
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/**
 * Renders a CSS backdrop-filter blur + dark veil that covers everything
 * OUTSIDE the RRR polygon. Uses clip-path: path(evenodd) so the RRR
 * interior is punched out and shows the unblurred map.
 * Updates on every map move/zoom via Leaflet events.
 */
const RRRBlurOverlay: FC<{ rrrPath: [number, number][] }> = ({ rrrPath }) => {
  const map = useMap();
  const blurRef  = useRef<HTMLDivElement | null>(null);
  const darkRef  = useRef<HTMLDivElement | null>(null);

  const update = useCallback(() => {
    const blur = blurRef.current;
    const dark = darkRef.current;
    if (!blur || !dark) return;
    const container = map.getContainer();
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    const pts = rrrPath
      .map(([lat, lng]) => {
        const p = map.latLngToContainerPoint(L.latLng(lat, lng));
        return `${p.x},${p.y}`;
      })
      .join(' ');

    // evenodd: outer full-screen rect MINUS the RRR interior = only outside area
    const d = `path(evenodd, "M 0,0 L ${w},0 L ${w},${h} L 0,${h} Z M ${pts} Z")`;
    blur.style.clipPath = d;
    dark.style.clipPath = d;
  }, [map, rrrPath]);

  useEffect(() => {
    const container = map.getContainer();

    // Blur layer — sits above tiles (z 200) but below paths/polylines (z 400)
    const blur = document.createElement('div');
    blur.style.cssText = [
      'position:absolute', 'inset:0',
      'backdrop-filter:blur(10px)', '-webkit-backdrop-filter:blur(10px)',
      'z-index:350', 'pointer-events:none',
    ].join(';');
    blurRef.current = blur;
    container.appendChild(blur);

    // Subtle dark veil on top of the blur for contrast
    const dark = document.createElement('div');
    dark.style.cssText = [
      'position:absolute', 'inset:0',
      'background:rgba(8,12,16,0.38)',
      'z-index:351', 'pointer-events:none',
    ].join(';');
    darkRef.current = dark;
    container.appendChild(dark);

    const EVENTS = ['move', 'zoom', 'moveend', 'zoomend', 'viewreset', 'resize'];
    EVENTS.forEach(e => map.on(e, update));
    update();

    return () => {
      EVENTS.forEach(e => map.off(e, update));
      [blur, dark].forEach(el => { if (container.contains(el)) container.removeChild(el); });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-run when RRR path changes (shouldn't happen, but safety net)
  useEffect(() => { update(); }, [update]);

  return null;
};

const SanctuaryMapLayout = () => {
  const [isSatellite, setIsSatellite] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAqi, setShowAqi] = useState(true);
  const [showOrr, setShowOrr] = useState(false);
  const [isAirportFocus, setIsAirportFocus] = useState(false);
  const [isRegionalView, setIsRegionalView] = useState(false);
  const [isTelanganaView, setIsTelanganaView] = useState(false);
  const [targetView, setTargetView] = useState<{ center: [number, number], zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [livePulse, setLivePulse] = useState(0);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['aqi-live']));

  const FILTER_PILLS = [
    { id: 'sanctuaries',  label: 'Sanctuaries',     icon: Home },
    { id: 'orr-exits',    label: 'ORR Exits',        icon: Route },
    { id: 'rrr-exits',    label: 'RRR Exits',        icon: RotateCcw },
    { id: 'clean-air',    label: 'Clean Air',        icon: Leaf },
    { id: 'aqi-live',     label: 'AQI Live',         icon: Activity },
    { id: 'forest-zone',  label: 'Forest Zone',      icon: Trees },
    { id: 'satellite',    label: 'Satellite',        icon: Globe2 },
    { id: 'airport',      label: 'Airport Zone',     icon: Plane },
    { id: 'regional',     label: 'Regional (RRR)',   icon: MapIcon },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const isCurrentlyActive = prev.has(filterId);
      const next = new Set(prev);
      if (isCurrentlyActive) next.delete(filterId);
      else next.add(filterId);
      if (filterId === 'aqi-live')  setShowAqi(!isCurrentlyActive);
      if (filterId === 'satellite') setIsSatellite(!isCurrentlyActive);
      if (filterId === 'regional')  setIsRegionalView(!isCurrentlyActive);
      if (filterId === 'airport')   setIsAirportFocus(!isCurrentlyActive);
      return next;
    });
  };

  // ── Pollution sources (positive intensity = dirty air) ──────────────────
  const AQI_HOTSPOTS = [
    { lat: 17.44, lng: 78.38, intensity: 0.85 }, // HITEC City industrial corridor
    { lat: 17.38, lng: 78.48, intensity: 0.95 }, // Charminar / Old City
    { lat: 17.48, lng: 78.44, intensity: 1.00 }, // Sanath Nagar Industrial
    { lat: 17.24, lng: 78.43, intensity: 0.55 }, // Airport / Shamshabad
    { lat: 17.40, lng: 78.45, intensity: 0.72 }, // City Centre
    { lat: 17.62, lng: 78.08, intensity: 0.38 }, // Sangareddy industrial
    { lat: 17.51, lng: 78.88, intensity: 0.35 }, // Bhongir
    { lat: 17.24, lng: 78.90, intensity: 0.40 }, // Choutuppal
    { lat: 17.50, lng: 78.50, intensity: 0.60 }, // Secunderabad rail yard
  ];

  // ── Clean-air sources near forests & water bodies (negative = blue) ──────
  const CLEAN_AIR_ZONES = [
    { lat: 17.74, lng: 78.28, strength: 0.90 }, // Narsapur Forest Reserve   ← Agartha
    { lat: 17.37, lng: 78.29, strength: 0.80 }, // Osman Sagar / Gandipet    ← Neo-Vertex corridor
    { lat: 17.31, lng: 78.31, strength: 0.75 }, // Himayat Sagar reservoir
    { lat: 17.35, lng: 78.34, strength: 0.70 }, // Mrugavani National Park
    { lat: 17.33, lng: 78.58, strength: 0.60 }, // Mahavir Harina Vanasthali
    { lat: 17.52, lng: 78.33, strength: 0.65 }, // Ameenpur Lake biodiversity site
    { lat: 17.31, lng: 77.85, strength: 0.65 }, // Ananthagiri Hills
    { lat: 17.24, lng: 78.48, strength: 0.55 }, // Tukkuguda green belt        ← SYL
  ];

  // ── Net AQI intensity: range -0.5 (very clean/blue) → +1.0 (polluted/red)
  const getIntensity = (
    point: { lat: number; lng: number },
    hotspots: { lat: number; lng: number; intensity: number }[],
    cleanZones: { lat: number; lng: number; strength: number }[],
  ) => {
    let pollution = 0;
    hotspots.forEach(s => {
      const d = Math.sqrt((point.lat - s.lat) ** 2 + (point.lng - s.lng) ** 2);
      pollution += s.intensity / (1 + d * 40);
    });
    let clean = 0;
    cleanZones.forEach(z => {
      const d = Math.sqrt((point.lat - z.lat) ** 2 + (point.lng - z.lng) ** 2);
      clean += z.strength / (1 + d * 50);
    });
    const net = pollution - clean * 0.75;
    // Small real-time shimmer
    const shimmer = Math.sin(point.lat * 100 + point.lng * 100 + livePulse * 0.1) * 0.03;
    return Math.max(-0.5, Math.min(net + shimmer, 1.0));
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
  // Each point pre-computes a boundaryFade (0–1) so the AQI heatmap blends
  // smoothly into the RRR boundary rather than cutting off abruptly.
  const gridPoints = useMemo(() => {
    const points: { lat: number; lng: number; boundaryFade: number }[] = [];
    const step = isTelanganaView ? 0.2 : 0.03;
    const latRange = isTelanganaView ? [15.8, 19.8] : [16.9, 17.9];
    const lngRange = isTelanganaView ? [77.1, 81.1] : [78.0, 79.1];

    // Approximate RRR centroid and semi-axes (degrees)
    const CX = 17.505, CY = 78.44;
    const AX = 0.33,   AY = 0.41;  // half-height, half-width
    // Fade starts when normalised distance > FADE_START and reaches 0 at 1.0
    const FADE_START = 0.76;

    for (let lat = latRange[0]; lat <= latRange[1]; lat += step) {
      for (let lng = lngRange[0]; lng <= lngRange[1]; lng += step) {
        const nLat = (lat - CX) / AX;
        const nLng = (lng - CY) / AY;
        const nd = Math.sqrt(nLat * nLat + nLng * nLng);
        if (nd >= 1.0) continue; // outside ellipse → skip
        const boundaryFade = nd < FADE_START ? 1 : 1 - ((nd - FADE_START) / (1.0 - FADE_START));
        points.push({ lat, lng, boundaryFade });
      }
    }
    return points;
  }, [isTelanganaView]);

  // Hyderabad Outer Ring Road (ORR) — refined 158 km trace aligned to satellite road
  const ORR_PATH: [number, number][] = [
    [17.4218, 78.3412], // E1  Gachibowli SW
    [17.4150, 78.3250], // Narsingi W
    [17.4100, 78.3120], // Narsingi
    [17.4200, 78.2980], // Telecom Nagar
    [17.4380, 78.2860], // Patancheru approach
    [17.4580, 78.2800], // Patancheru S
    [17.4800, 78.2780], // E3  Patancheru (NH-65 junction)
    [17.5020, 78.2810], // Patancheru N
    [17.5200, 78.2880], // Bowrampet
    [17.5380, 78.2980], // Dundigal S
    [17.5520, 78.3100], // E4  Sultanpur
    [17.5640, 78.3280], // Dulapally junction
    [17.5720, 78.3480], // Kompally S
    [17.5790, 78.3700], // Kompally
    [17.5850, 78.3930], // Bollaram
    [17.5880, 78.4160], // E6  Medchal S (NH-44 N junction)
    [17.5880, 78.4420], // E6  Medchal
    [17.5840, 78.4660], // Medchal E
    [17.5770, 78.4890], // E7  Shamirpet
    [17.5660, 78.5150], // Keesara approach
    [17.5520, 78.5420], // E8  Keesara
    [17.5340, 78.5650], // Keesara E
    [17.5140, 78.5860], // Ghatkesar W
    [17.4960, 78.6040], // E9  Ghatkesar (NH-163 junction)
    [17.4760, 78.6220], // Ghatkesar E
    [17.4560, 78.6370], // Uppal approach
    [17.4350, 78.6490], // Uppal E
    [17.4130, 78.6580], // LB Nagar E N
    [17.3910, 78.6640], // E10 Taramatipet
    [17.3710, 78.6640], // Taramatipet S
    [17.3510, 78.6610], // Hayathnagar
    [17.3300, 78.6520], // E11 Pedda Amberpet
    [17.3090, 78.6370], // Pedda Amberpet S
    [17.2880, 78.6170], // Bongulur N
    [17.2690, 78.5960], // E12 Bongulur
    [17.2530, 78.5760], // Bongulur S
    [17.2390, 78.5560], // E13 Raviryal
    [17.2290, 78.5360], // Raviryal S
    [17.2240, 78.5130], // Tukkuguda N
    [17.2200, 78.4880], // E14 Tukkuguda
    [17.2200, 78.4630], // Tukkuguda W
    [17.2230, 78.4390], // Shamshabad N
    [17.2250, 78.4180], // E15 Shamshabad (NH-44 airport junction)
    [17.2310, 78.3980], // Shamshabad W
    [17.2430, 78.3810], // Rajendranagar S
    [17.2590, 78.3700], // E17 Rajendranagar
    [17.2780, 78.3630], // Rajendranagar N
    [17.2970, 78.3600], // Moinabad
    [17.3170, 78.3600], // Moinabad N
    [17.3360, 78.3610], // Shankarpally S
    [17.3550, 78.3620], // Shankarpally
    [17.3720, 78.3570], // Osman Sagar corridor
    [17.3870, 78.3470], // Gandipet
    [17.3970, 78.3380], // E18 Kokapet S
    [17.4040, 78.3300], // Kokapet
    [17.4130, 78.3320], // Kokapet N
    [17.4218, 78.3412], // Close at Gachibowli
  ];

  // Hyderabad Regional Ring Road (RRR) — GPS-accurate outer trace
  const RRR_PATH: [number, number][] = [
    // Starting from north-west, going clockwise
    [17.5800, 78.0500], // Sangareddy west
    [17.6050, 78.0800], // Sangareddy north-west
    [17.6280, 78.1080], // Sangareddy junction
    [17.6500, 78.1350], // Sangareddy east
    [17.6730, 78.1600], // Patancheru north
    [17.6940, 78.1850], // Sadashivpet junction
    [17.7120, 78.2120], // Toopran corridor west
    [17.7320, 78.2430], // Toopran approach
    [17.7520, 78.2770], // Toopran west
    [17.7720, 78.3160], // Narsapur area
    [17.7910, 78.3580], // Toopran junction
    [17.8060, 78.4050], // Gajwel approach
    [17.8160, 78.4550], // Gajwel west
    [17.8210, 78.5060], // Gajwel
    [17.8200, 78.5580], // Gajwel east
    [17.8130, 78.6080], // Bibinagar corridor
    [17.8000, 78.6540], // Bibinagar
    [17.7820, 78.6960], // Bhongir approach
    [17.7580, 78.7360], // Bhongir west
    [17.7290, 78.7680], // Bhongir
    [17.6960, 78.7920], // Bhongir east
    [17.6600, 78.8100], // Choutuppal corridor
    [17.6220, 78.8200], // Choutuppal north
    [17.5820, 78.8240], // Choutuppal
    [17.5420, 78.8220], // Choutuppal south
    [17.5020, 78.8160], // Yadagirigutta approach
    [17.4620, 78.8060], // Ibrahimpatnam north
    [17.4200, 78.7900], // Ibrahimpatnam
    [17.3800, 78.7680], // Ibrahimpatnam south
    [17.3420, 78.7400], // Narketpally corridor
    [17.3080, 78.7080], // Choutuppal west approach
    [17.2780, 78.6720], // Sagar Highway south junction
    [17.2520, 78.6340], // Bongulur junction
    [17.2300, 78.5920], // Kandukur approach
    [17.2130, 78.5480], // Kandukur
    [17.2010, 78.5020], // Shadnagar approach
    [17.1940, 78.4540], // Shadnagar area
    [17.1940, 78.4040], // Shamshabad outer
    [17.2000, 78.3560], // Rajendranagar outer
    [17.2130, 78.3120], // Moinabad outer
    [17.2330, 78.2720], // Chevella approach
    [17.2600, 78.2360], // Chevella
    [17.2920, 78.2060], // Chevella north
    [17.3280, 78.1820], // Vikarabad approach
    [17.3680, 78.1660], // Vikarabad corridor
    [17.4080, 78.1580], // Shankarpally outer
    [17.4480, 78.1580], // Dundigal south approach
    [17.4880, 78.1620], // Patancheru outer south
    [17.5280, 78.0890], // Sangareddy south approach
    [17.5560, 78.0620], // Sangareddy south
    [17.5800, 78.0500], // Close at Sangareddy west
  ];

  // Radial National Highways & expressways — ORR junctions → RRR junctions
  // All share the same amber highway colour as ORR/RRR
  const HIGHWAYS: { id: string; name: string; path: [number, number][] }[] = [
    {
      id: 'nh-65',
      name: 'NH 65',
      // Mumbai / Pune (NW): city → ORR Patancheru (E3) → RRR Sangareddy
      path: [
        [17.430, 78.430],
        [17.456, 78.384],
        [17.476, 78.336],
        [17.480, 78.278], // ORR E3 Patancheru
        [17.508, 78.252],
        [17.540, 78.222],
        [17.568, 78.190],
        [17.600, 78.156],
        [17.628, 78.108], // RRR Sangareddy
      ],
    },
    {
      id: 'nh-44-s',
      name: 'NH 44',
      // Bangalore / Chennai (S): city → ORR Shamshabad (E15) → RRR south
      path: [
        [17.415, 78.468],
        [17.375, 78.470],
        [17.326, 78.465],
        [17.280, 78.452],
        [17.250, 78.435], // ORR E15 Shamshabad / RGIA
        [17.218, 78.418],
        [17.196, 78.404], // RRR outer south
      ],
    },
    {
      id: 'nh-163',
      name: 'NH 163',
      // Vijayawada (E): city → ORR Ghatkesar (E9) → RRR Bhongir
      path: [
        [17.440, 78.502],
        [17.455, 78.555],
        [17.472, 78.590],
        [17.496, 78.604], // ORR E9 Ghatkesar
        [17.522, 78.630],
        [17.558, 78.664],
        [17.582, 78.692],
        [17.619, 78.726], // RRR Bhongir corridor
      ],
    },
    {
      id: 'nh-44-n',
      name: 'NH 44',
      // Nagpur (N): city → ORR Medchal (E6) → RRR Toopran
      path: [
        [17.460, 78.462],
        [17.508, 78.460],
        [17.554, 78.450],
        [17.588, 78.442], // ORR E6 Medchal
        [17.622, 78.442],
        [17.664, 78.444],
        [17.696, 78.448], // RRR Toopran corridor
      ],
    },
    {
      id: 'pvnr',
      name: 'PVNR Expressway',
      // Connects old city to Financial District / ORR Gachibowli
      path: [
        [17.400, 78.506],
        [17.412, 78.486],
        [17.422, 78.462],
        [17.428, 78.436],
        [17.425, 78.408],
        [17.422, 78.370], // ORR E1 Gachibowli
      ],
    },
    {
      id: 'sagar-hwy',
      name: 'Sagar Highway',
      // SE corridor: city → ORR → RRR Ibrahimpatnam
      path: [
        [17.418, 78.492],
        [17.398, 78.510],
        [17.376, 78.530],
        [17.354, 78.556],
        [17.330, 78.572], // ORR E10 corridor
        [17.308, 78.592],
        [17.278, 78.622],
        [17.252, 78.638], // RRR Ibrahimpatnam approach
      ],
    },
  ];

  // Research-verified Government Reserve Forests, National Parks & Protected Water Bodies
  // Polygons shaped to satellite imagery — all within or adjacent to RRR corridor
  const NATURAL_FEATURES = [

    // ── RESERVE FORESTS (NORTH) ─────────────────────────────────────────────

    // 1. Narsapur-Toopran Reserved Forest Complex (~30 sq km, Medak Division)
    // Directly adjacent to MODCON Agartha — the primary ecological asset
    {
      id: "narsapur-rf",
      type: 'forest',
      title: "Narsapur Reserved Forest",
      coords: [17.755, 78.275] as [number, number],
      boundary: [
        [17.820, 78.190], [17.850, 78.220], [17.865, 78.260], [17.855, 78.310],
        [17.830, 78.360], [17.800, 78.390], [17.770, 78.410], [17.740, 78.405],
        [17.710, 78.390], [17.685, 78.355], [17.680, 78.310], [17.690, 78.265],
        [17.710, 78.225], [17.740, 78.195], [17.775, 78.180], [17.800, 78.185]
      ] as [number, number][],
      description: "30 sq km dry-deciduous reserve forest. Origin of Agartha sanctuary. Carbon sink for northern Hyderabad. Medak Forest Division.",
      area: "3,000 ha"
    },

    // 2. Toopran-Gajwel Forest Corridor (Medak/Siddipet border)
    {
      id: "toopran-corridor",
      type: 'forest',
      title: "Toopran RF Corridor",
      coords: [17.800, 78.455] as [number, number],
      boundary: [
        [17.825, 78.415], [17.845, 78.440], [17.840, 78.475], [17.820, 78.500],
        [17.795, 78.510], [17.770, 78.500], [17.760, 78.475], [17.770, 78.440],
        [17.790, 78.420]
      ] as [number, number][],
      description: "Scrub-forest corridor linking Narsapur RF to Gajwel range. Seasonal stream habitat. Critical wildlife movement zone.",
      area: "680 ha"
    },

    // 3. Mulugu Reserved Forest (Siddipet — RRR northern transit)
    {
      id: "mulugu-rf",
      type: 'forest',
      title: "Mulugu Reserved Forest",
      coords: [17.808, 78.545] as [number, number],
      boundary: [
        [17.825, 78.515], [17.840, 78.535], [17.842, 78.560], [17.830, 78.580],
        [17.810, 78.590], [17.790, 78.580], [17.780, 78.558], [17.788, 78.530],
        [17.805, 78.515]
      ] as [number, number][],
      description: "Designated RF along Siddipet range — key forest diversion zone identified in RRR northern corridor EIA.",
      area: "520 ha"
    },

    // ── NATIONAL PARKS & WILDLIFE SANCTUARIES ──────────────────────────────

    // 4. KBR National Park (Inside ORR — Jubilee Hills)
    {
      id: "kbr-national-park",
      type: 'forest',
      title: "KBR National Park",
      coords: [17.420, 78.423] as [number, number],
      boundary: [
        [17.432, 78.412], [17.440, 78.420], [17.440, 78.432], [17.432, 78.440],
        [17.422, 78.442], [17.412, 78.436], [17.408, 78.424], [17.415, 78.413],
        [17.424, 78.410]
      ] as [number, number][],
      description: "Hyderabad's premier urban national park. 390 ha. Inside ORR. Leopard, deer, 600+ plant species. Jubilee Hills.",
      area: "390 ha"
    },

    // 5. Mrugavani National Park (Chilkur-Moinabad, SW corridor)
    {
      id: "mrugavani-np",
      type: 'forest',
      title: "Mrugavani National Park",
      coords: [17.358, 78.341] as [number, number],
      boundary: [
        [17.374, 78.325], [17.382, 78.335], [17.384, 78.350], [17.378, 78.363],
        [17.365, 78.370], [17.352, 78.368], [17.341, 78.358], [17.338, 78.345],
        [17.344, 78.330], [17.357, 78.323]
      ] as [number, number][],
      description: "3.6 sq km national park near Chilkur. Teak, bamboo, spotted deer, pythons. South-west green corridor.",
      area: "360 ha"
    },

    // 6. Mahavir Harina Vanasthali National Park (SE corridor)
    {
      id: "vanasthali-np",
      type: 'forest',
      title: "Mahavir Harina Vanasthali NP",
      coords: [17.340, 78.586] as [number, number],
      boundary: [
        [17.360, 78.562], [17.372, 78.575], [17.372, 78.598], [17.360, 78.612],
        [17.344, 78.618], [17.328, 78.612], [17.318, 78.598], [17.320, 78.578],
        [17.333, 78.562], [17.348, 78.558]
      ] as [number, number][],
      description: "14 sq km protected deer park and dry-deciduous forest. SE Hyderabad. Blackbuck, chital, thousands of migratory birds.",
      area: "1,400 ha"
    },

    // ── RESERVE FORESTS (SOUTH & WEST) ─────────────────────────────────────

    // 7. Ananthagiri Hills Reserved Forest Complex (Vikarabad — 6,124 ha)
    // Largest forest block in Hyderabad metro — origin of Musi river
    {
      id: "ananthagiri-rf",
      type: 'forest',
      title: "Ananthagiri Hills RF",
      coords: [17.312, 77.855] as [number, number],
      boundary: [
        [17.400, 77.760], [17.420, 77.800], [17.425, 77.850], [17.415, 77.900],
        [17.395, 77.940], [17.365, 77.965], [17.335, 77.975], [17.305, 77.970],
        [17.278, 77.950], [17.260, 77.915], [17.252, 77.875], [17.260, 77.835],
        [17.280, 77.800], [17.310, 77.770], [17.345, 77.755], [17.375, 77.752]
      ] as [number, number][],
      description: "6,124 ha. Largest RF near Hyderabad. Birthplace of Musi river. Moist-deciduous forest. Elevation 700-1168m. Vikarabad DFO.",
      area: "6,124 ha"
    },

    // 8. Chevella Reserved Forest (SW, near RRR Chevella interchange)
    {
      id: "chevella-rf",
      type: 'forest',
      title: "Chevella Reserved Forest",
      coords: [17.305, 78.140] as [number, number],
      boundary: [
        [17.330, 78.110], [17.345, 78.130], [17.348, 78.160], [17.335, 78.182],
        [17.315, 78.190], [17.294, 78.180], [17.282, 78.160], [17.285, 78.130],
        [17.300, 78.112]
      ] as [number, number][],
      description: "RF abutting RRR's Chevella interchange (SH-4). Protected scrub-thorn forest. Wildlife corridor to Ananthagiri.",
      area: "810 ha"
    },

    // 9. Shankarpally-Moinabad RF Block
    {
      id: "shankarpally-rf",
      type: 'forest',
      title: "Shankarpally RF Block",
      coords: [17.450, 78.134] as [number, number],
      boundary: [
        [17.465, 78.112], [17.478, 78.128], [17.480, 78.150], [17.468, 78.168],
        [17.448, 78.175], [17.430, 78.165], [17.422, 78.145], [17.430, 78.120],
        [17.448, 78.108]
      ] as [number, number][],
      description: "Protected forest block connecting Osman Sagar catchment to Ananthagiri corridor. Shankarpally range.",
      area: "520 ha"
    },

    // 10. Gachibowli-Narsingi Green Belt (SW ORR buffer)
    {
      id: "narsingi-greenzone",
      type: 'forest',
      title: "Narsingi Forest Buffer",
      coords: [17.412, 78.308] as [number, number],
      boundary: [
        [17.425, 78.290], [17.435, 78.305], [17.432, 78.322], [17.420, 78.332],
        [17.405, 78.330], [17.395, 78.315], [17.398, 78.295], [17.412, 78.285]
      ] as [number, number][],
      description: "Government-notified green buffer zone. Protects ORR-Gachibowli corridor from encroachment.",
      area: "290 ha"
    },

    // 11. Dalmia RF — Maheswaram/Kandukur (South RRR corridor)
    {
      id: "dalmia-rf",
      type: 'forest',
      title: "Dalmia Reserved Forest",
      coords: [17.198, 78.520] as [number, number],
      boundary: [
        [17.215, 78.498], [17.228, 78.512], [17.228, 78.535], [17.215, 78.548],
        [17.198, 78.552], [17.182, 78.540], [17.178, 78.518], [17.190, 78.500]
      ] as [number, number][],
      description: "Reserve forest near Kandukur-Tukkuguda. Green buffer in the RRR southern corridor. Rangareddy district.",
      area: "385 ha"
    },

    // 12. Kothiyal-Kappa Pahad RF (NE — Siddipet/Yadadri corridor)
    {
      id: "kothiyal-rf",
      type: 'forest',
      title: "Kothiyal-Kappa Pahad RF",
      coords: [17.818, 78.625] as [number, number],
      boundary: [
        [17.840, 78.598], [17.858, 78.618], [17.860, 78.648], [17.845, 78.668],
        [17.822, 78.675], [17.800, 78.662], [17.792, 78.638], [17.800, 78.610],
        [17.820, 78.595]
      ] as [number, number][],
      description: "Reserved Forest block in Siddipet district. Identified in RRR northern corridor forest clearance notifications.",
      area: "610 ha"
    },

    // 13. Yadadri Green Hills (Eastern RRR — pilgrim forest buffer)
    {
      id: "yadadri-hills",
      type: 'forest',
      title: "Yadadri-Bhuvanagiri Forest",
      coords: [17.600, 78.952] as [number, number],
      boundary: [
        [17.625, 78.920], [17.645, 78.938], [17.648, 78.968], [17.632, 78.990],
        [17.608, 78.998], [17.585, 78.985], [17.572, 78.960], [17.580, 78.930],
        [17.600, 78.915]
      ] as [number, number][],
      description: "Forest hills around the sacred Yadadri temple town. Protected by temple trust and state forest dept. Eastern RRR green zone.",
      area: "750 ha"
    },

    // ── GOVERNMENT-DESIGNATED LAKES & WATER BODIES ────────────────────────

    // 14. Osman Sagar (Gandipet) — Protected reservoir + catchment forest
    {
      id: "osman-sagar",
      type: 'lake',
      title: "Osman Sagar (Gandipet)",
      coords: [17.373, 78.288] as [number, number],
      boundary: [
        [17.405, 78.262], [17.415, 78.280], [17.418, 78.305], [17.408, 78.322],
        [17.390, 78.332], [17.370, 78.328], [17.350, 78.315], [17.340, 78.295],
        [17.345, 78.272], [17.362, 78.258], [17.383, 78.252]
      ] as [number, number][],
      description: "Government-protected reservoir. Catchment forest of 16,000 ha. Drinking water source. Musi tributary system.",
      area: "3,048 ha (reservoir)"
    },

    // 15. Himayat Sagar — Protected reservoir
    {
      id: "himayat-sagar",
      type: 'lake',
      title: "Himayat Sagar",
      coords: [17.310, 78.312] as [number, number],
      boundary: [
        [17.342, 78.290], [17.352, 78.312], [17.348, 78.338], [17.330, 78.350],
        [17.310, 78.352], [17.290, 78.338], [17.280, 78.315], [17.288, 78.292],
        [17.308, 78.280], [17.328, 78.278]
      ] as [number, number][],
      description: "Twin reservoir to Osman Sagar. Protected catchment. Jointly conserved by HMWSSB & Forest Dept.",
      area: "2,748 ha (reservoir)"
    },

    // 16. Hussain Sagar — Central government lake
    {
      id: "hussain-sagar",
      type: 'lake',
      title: "Hussain Sagar",
      coords: [17.4239, 78.4738] as [number, number],
      boundary: [
        [17.440, 78.462], [17.448, 78.472], [17.445, 78.488], [17.432, 78.496],
        [17.416, 78.492], [17.408, 78.478], [17.412, 78.464], [17.424, 78.458]
      ] as [number, number][],
      description: "16 sq km government-notified lake. Hyderabad-Secunderabad connector. Protected under AP Urban Areas Act.",
      area: "1,600 ha"
    },

    // 17. Ameenpur Lake — India's first biodiversity heritage lake
    {
      id: "ameenpur-lake",
      type: 'lake',
      title: "Ameenpur Lake (BHS)",
      coords: [17.520, 78.330] as [number, number],
      boundary: [
        [17.532, 78.318], [17.540, 78.328], [17.540, 78.342], [17.530, 78.352],
        [17.516, 78.352], [17.506, 78.340], [17.506, 78.322], [17.516, 78.312]
      ] as [number, number][],
      description: "India's first biodiversity heritage site designated for a water body. Government notified. NW Hyderabad.",
      area: "142 ha"
    },

    // 18. Shamirpet Lake & Forest Reserve (NE ORR corridor)
    {
      id: "shamirpet-lake-rf",
      type: 'lake',
      title: "Shamirpet Lake & RF",
      coords: [17.600, 78.562] as [number, number],
      boundary: [
        [17.615, 78.545], [17.625, 78.558], [17.624, 78.578], [17.612, 78.590],
        [17.596, 78.590], [17.582, 78.578], [17.580, 78.558], [17.592, 78.545],
        [17.607, 78.540]
      ] as [number, number][],
      description: "Protected lake and adjoining reserve forest near ORR-Shamirpet. 102 ha biodiversity water body + forest buffer.",
      area: "240 ha"
    },
  ];

  const MACRO_REGIONS = [
    { title: "GACHIBOWLI", coords: [17.44, 78.36] as [number, number] },
    { title: "FINANCIAL DISTRICT", coords: [17.41, 78.34] as [number, number] },
    { title: "JUBILEE HILLS", coords: [17.43, 78.41] as [number, number] },
    { title: "BANJARA HILLS", coords: [17.41, 78.45] as [number, number] },
    { title: "TUKKUGUDA", coords: [17.22, 78.50] as [number, number] },
    { title: "SHAMSHABAD", coords: [17.25, 78.40] as [number, number] },
    { title: "KOKAPET", coords: [17.39, 78.33] as [number, number] }
  ];

  const locations = [
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
      id: "syl",
      type: 'sanctuary',
      title: "SYL",
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
    { id: "exit-1",  type: 'exit', title: "ORR Exit 1",  location: "Gachibowli",      coords: [17.4218, 78.3412] as [number, number], aqi: 142 },
    { id: "exit-3",  type: 'exit', title: "ORR Exit 3",  location: "Patancheru",       coords: [17.4880, 78.3120] as [number, number], aqi: 156 },
    { id: "exit-4",  type: 'exit', title: "ORR Exit 4",  location: "Sultanpur",        coords: [17.5380, 78.3090] as [number, number], aqi: 128 },
    { id: "exit-6",  type: 'exit', title: "ORR Exit 6",  location: "Medchal",          coords: [17.5860, 78.4410] as [number, number], aqi: 115 },
    { id: "exit-7",  type: 'exit', title: "ORR Exit 7",  location: "Shamirpet",        coords: [17.5760, 78.4870] as [number, number], aqi: 98  },
    { id: "exit-8",  type: 'exit', title: "ORR Exit 8",  location: "Keesara",          coords: [17.5380, 78.5640] as [number, number], aqi: 85  },
    { id: "exit-9",  type: 'exit', title: "ORR Exit 9",  location: "Ghatkesar",        coords: [17.5020, 78.6020] as [number, number], aqi: 110 },
    { id: "exit-10", type: 'exit', title: "ORR Exit 10", location: "Taramatipet",      coords: [17.3900, 78.6730] as [number, number], aqi: 95  },
    { id: "exit-11", type: 'exit', title: "ORR Exit 11", location: "Pedda Amberpet",   coords: [17.3300, 78.6570] as [number, number], aqi: 105 },
    { id: "exit-12", type: 'exit', title: "ORR Exit 12", location: "Bongulur",         coords: [17.2720, 78.6060] as [number, number], aqi: 88  },
    { id: "exit-13", type: 'exit', title: "ORR Exit 13", location: "Raviryal",         coords: [17.2330, 78.5480] as [number, number], aqi: 72  },
    { id: "exit-14", type: 'exit', title: "ORR Exit 14", location: "Tukkuguda",        coords: [17.2240, 78.5050] as [number, number], aqi: 65  },
    { id: "exit-15", type: 'exit', title: "ORR Exit 15", location: "Shamshabad",       coords: [17.2290, 78.4350] as [number, number], aqi: 120 },
    { id: "exit-17", type: 'exit', title: "ORR Exit 17", location: "Rajendranagar",    coords: [17.2580, 78.3810] as [number, number], aqi: 135 },
    { id: "exit-18", type: 'exit', title: "ORR Exit 18", location: "Kokapet",          coords: [17.4000, 78.3390] as [number, number], aqi: 148 },
    { id: "rrr-exit-1", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Sangareddy",           coords: [17.6280, 78.1080] as [number, number], aqi: 45 },
    { id: "rrr-exit-2", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Toopran Junction",      coords: [17.7910, 78.3580] as [number, number], aqi: 38 },
    { id: "rrr-exit-3", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Gajwel Hub",            coords: [17.8210, 78.5060] as [number, number], aqi: 32 },
    { id: "rrr-exit-4", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Bhongir Junction",      coords: [17.7290, 78.7680] as [number, number], aqi: 42 },
    { id: "rrr-exit-5", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Choutuppal Hub",        coords: [17.5820, 78.8240] as [number, number], aqi: 48 },
    { id: "rrr-exit-6", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Ibrahimpatnam Junction", coords: [17.4200, 78.7900] as [number, number], aqi: 35 },
    { id: "rrr-exit-7", type: 'rrr-exit', title: "RRR Proposed Exit", location: "Chevella Hub",          coords: [17.2600, 78.2360] as [number, number], aqi: 28 }
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredLocations = useMemo(() => {
    const hasTypeFilter    = activeFilters.has('sanctuaries') || activeFilters.has('orr-exits') || activeFilters.has('rrr-exits');
    const hasQualityFilter = activeFilters.has('clean-air')   || activeFilters.has('forest-zone');
    if (!hasTypeFilter && !hasQualityFilter) return locations;
    return locations.filter(loc => {
      let passesType    = !hasTypeFilter;
      let passesQuality = !hasQualityFilter;
      if (hasTypeFilter) {
        passesType =
          (activeFilters.has('sanctuaries') && loc.type === 'sanctuary') ||
          (activeFilters.has('orr-exits')   && loc.type === 'exit')      ||
          (activeFilters.has('rrr-exits')   && loc.type === 'rrr-exit');
      }
      if (hasQualityFilter) {
        const fr = (loc as { forestRadius?: number }).forestRadius ?? 0;
        passesQuality =
          (activeFilters.has('clean-air')   && (loc.aqi ?? 999) <= 50) ||
          (activeFilters.has('forest-zone') && loc.type === 'sanctuary' && fr >= 3000);
      }
      return passesType && passesQuality;
    });
  }, [activeFilters]); // locations is stable per render

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
          <div className="bg-surface/90 backdrop-blur-md p-1 rounded-xl shadow-xl border border-outline/10 flex items-center">
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
          <div className="bg-surface/90 backdrop-blur-md p-2 rounded-xl shadow-xl border border-outline/10 flex flex-col gap-4">
            <div className="p-2 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-secondary hover:text-primary">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="p-2 hover:bg-primary/10 rounded-lg transition-colors cursor-pointer text-secondary hover:text-primary">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Live AQI badge — visible when AQI Live filter is active */}
        <AnimatePresence>
          {showAqi && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="absolute top-6 right-6 z-[1000]"
            >
              <div className="px-3 py-1.5 bg-red-600 text-white text-[8px] font-bold uppercase tracking-widest rounded-full animate-pulse flex items-center gap-2 shadow-lg shadow-red-600/30">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                Live AQI Feed
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Google Maps-style Premium Segment Filter Pill Bar */}
        <div className="absolute top-[4.5rem] left-4 right-4 z-[1000] pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: 'easeOut' }}
            className="filter-pill-bar flex items-center gap-2 overflow-x-auto py-1 pointer-events-auto"
          >
            {FILTER_PILLS.map((pill, idx) => {
              const Icon = pill.icon;
              const isActive = activeFilters.has(pill.id);
              return (
                <motion.button
                  key={pill.id}
                  initial={{ opacity: 0, scale: 0.85, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.045 + 0.1, type: 'spring', stiffness: 320, damping: 22 }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => toggleFilter(pill.id)}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-colors duration-200 whitespace-nowrap border cursor-pointer select-none",
                    isActive
                      ? "bg-primary text-on-primary border-transparent shadow-lg shadow-primary/30"
                      : "bg-surface/90 backdrop-blur-md text-secondary border-outline/20 shadow-md hover:border-primary/50 hover:text-primary hover:bg-surface"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{pill.label}</span>
                  {isActive && pill.id === 'aqi-live' && (
                    <span className="w-1.5 h-1.5 bg-on-primary/75 rounded-full animate-pulse ml-0.5 flex-shrink-0" />
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom Right Action */}
        <div className="absolute bottom-6 right-6 z-[1000]">
          <button className="px-6 py-3 bg-olive-900 text-cream text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl shadow-2xl flex items-center gap-3 hover:scale-105 transition-all">
            <Layers className="w-4 h-4" />
            View Site Plan
          </button>
        </div>

        <MapContainer
          center={[17.49, 78.48]}
          zoom={10}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full"
          style={{ background: '#0a0f14' }}
          maxBounds={[[17.0, 77.75], [18.0, 79.15]]}
          maxBoundsViscosity={0.9}
        >
          <ZoomControl position="bottomleft" />
          {activeFilters.has('forest-zone') && NATURAL_FEATURES.map(feature => {
            const isForest = feature.type === 'forest';
            return (
              <Polygon
                key={feature.id}
                positions={feature.boundary}
                interactive={false}
                pathOptions={isForest ? {
                  // Olive-mint — matches site palette (olive-900 / primary green)
                  fillColor: '#3d5c35',
                  fillOpacity: 0.12,
                  color: '#4a6741',
                  weight: 1,
                  opacity: 0.45,
                  dashArray: undefined,
                  lineCap: 'round',
                  lineJoin: 'round',
                } : {
                  // Slate-blue — muted water tone
                  fillColor: '#334e68',
                  fillOpacity: 0.14,
                  color: '#4a6fa5',
                  weight: 1,
                  opacity: 0.40,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            );
          })}
          <MapController targetView={targetView} />
          <ZoomTracker onZoom={setCurrentZoom} />
          {isSatellite ? (
            /* Pure satellite — no Google labels/POIs/restaurant names */
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          ) : (
            <TileLayer
              attribution="&copy; OpenStreetMap contributors &copy; CARTO"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png"
              className="map-premium-filter"
            />
          )}



          {/* Real-time Environmental Mesh — blue near forests, red near industry */}
          {gridPoints.map((point, idx) => {
            const net = getIntensity(point, AQI_HOTSPOTS, CLEAN_AIR_ZONES);
            const pulseFactor = Math.sin((idx + livePulse) * 0.1) * 0.03;
            // 5-band colour scale: red → orange → yellow → green → blue
            const fillColor = net > 0.55  ? '#ef4444'  // red   — very polluted
                            : net > 0.28  ? '#f97316'  // orange — polluted
                            : net > 0.08  ? '#eab308'  // yellow — moderate
                            : net > -0.12 ? '#4ade80'  // green  — good
                            :               '#3b82f6'; // blue   — very clean / forest zone
            // Opacity scales with absolute deviation from 0; always slightly visible
            const fillOpacity = (Math.abs(net) * 0.22 + 0.04 + pulseFactor) * point.boundaryFade;

            return (
              <React.Fragment key={`grid-${idx}`}>
                {showAqi && (
                  <Circle
                    center={[point.lat, point.lng]}
                    radius={isTelanganaView ? 12000 : 3500}
                    className="trichome-glass-mesh"
                    pathOptions={{
                      fillColor,
                      color: 'rgba(255,255,255,0.1)',
                      weight: 1,
                      fillOpacity,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
          
          {/* ── Radial highways (NH-65, NH-44 N/S, NH-163, PVNR, Sagar Hwy) ──────── */}
          {HIGHWAYS.map(hw => (
            <React.Fragment key={hw.id}>
              {/* glow */}
              <Polyline positions={hw.path} pathOptions={{ color: '#d97706', weight: 10, opacity: 0.07, lineCap: 'round' }} />
              {/* road */}
              <Polyline positions={hw.path} pathOptions={{ color: '#d97706', weight: 2.5, opacity: 0.80, lineCap: 'round' }} />
            </React.Fragment>
          ))}

          {/* ── ORR — solid amber line, matches satellite road ─────────────────── */}
          {/* glow */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#d97706', weight: 16, opacity: 0.10, lineCap: 'round' }} />
          {/* casing */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#92400e', weight: 6,  opacity: 0.95, lineCap: 'round' }} />
          {/* centre stripe */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#fcd34d', weight: 2,  opacity: 0.85, lineCap: 'round' }} />

          {/* ── RRR — same amber family, longer dash = proposed alignment ─────── */}
          {/* glow */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#d97706', weight: 12, opacity: 0.08, lineCap: 'round' }} />
          {/* casing */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#92400e', weight: 4,  opacity: 0.80, dashArray: '14, 10', lineCap: 'round' }} />
          {/* centre stripe */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#fcd34d', weight: 1.5, opacity: 0.65, dashArray: '14, 10', lineCap: 'round' }} />

          {/* Outside-RRR blur overlay — backdrop-filter blur + dark veil,
              clipped to the exterior via clip-path:path(evenodd) */}
          <RRRBlurOverlay rrrPath={RRR_PATH} />



          {filteredLocations.map((loc) => {
            const isPremium = loc.type === 'sanctuary';
            const isExit = loc.type === 'exit' || loc.type === 'rrr-exit';
            
            if (!isPremium && !isExit) return null;

            return (
              <React.Fragment key={loc.id}>

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
                      html: `<div class="relative flex flex-col items-center justify-center filter drop-shadow-2xl hover:-translate-y-2 transition-transform duration-500 group">
                              <div class="absolute -inset-6 bg-gold/10 rounded-full animate-pulse blur-md group-hover:bg-gold/30 transition-all"></div>
                              <div class="w-14 h-14 bg-surface backdrop-blur-md rounded-full border-[3px] border-olive-900 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)] flex items-center justify-center z-10 overflow-hidden relative">
                                <div class="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <div class="w-5 h-5 bg-olive-900 rounded border border-gold shadow-inner rotate-45 transform group-hover:scale-110 transition-transform"></div>
                              </div>
                              <div class="w-[3px] h-10 bg-gradient-to-b from-olive-900 to-transparent -mt-1 z-0 relative">
                                <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-1 bg-black/40 blur-[2px] rounded-full"></div>
                              </div>
                            </div>`,
                      iconSize: [56, 96],
                      iconAnchor: [28, 96],
                      popupAnchor: [0, -96]
                    })}
                  >
                    <Popup className="custom-popup">
                      <SanctuaryPopupContent loc={loc} />
                    </Popup>
                  </Marker>
                )}
                {isExit && (
                  <Marker
                    position={loc.coords}
                    icon={L.divIcon({
                      className: '',
                      html: currentZoom >= 13
                        // High zoom: full label pill
                        ? `<div style="
                            background: rgba(255,255,255,0.92);
                            backdrop-filter: blur(8px);
                            border: 1px solid rgba(217,119,6,0.40);
                            border-radius: 6px;
                            padding: 3px 8px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                            white-space: nowrap;
                          ">
                            <span style="font-size:9px;font-weight:900;color:#92400e;text-transform:uppercase;letter-spacing:0.05em;">
                              ${loc.type === 'exit' ? loc.title.replace('ORR Exit ', 'E') : 'R'}: ${loc.location}
                            </span>
                          </div>`
                        : currentZoom >= 11
                        // Medium zoom: compact number badge
                        ? `<div style="
                            width: 26px; height: 26px;
                            background: #d97706;
                            border: 2px solid rgba(255,255,255,0.9);
                            border-radius: 50%;
                            display: flex; align-items: center; justify-content: center;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                          ">
                            <span style="font-size:8px;font-weight:900;color:#fff;">
                              ${loc.type === 'exit' ? loc.title.replace('ORR Exit ', '') : '↺'}
                            </span>
                          </div>`
                        // Low zoom: tiny minimal dot
                        : `<div style="
                            width: 8px; height: 8px;
                            background: #d97706;
                            border: 1.5px solid rgba(255,255,255,0.8);
                            border-radius: 50%;
                            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                          "></div>`,
                      iconSize: currentZoom >= 13 ? [140, 28] : currentZoom >= 11 ? [26, 26] : [8, 8],
                      iconAnchor: currentZoom >= 13 ? [70, 14] : currentZoom >= 11 ? [13, 13] : [4, 4],
                    })}
                  >
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
                  </Marker>
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
  const [selectedSanctuary, setSelectedSanctuary] = useState<Sanctuary | null>(null);
  const [showAagarthaLayout, setShowAagarthaLayout] = useState(false);

  return (
    <section id="agartha" className={cn(
      "px-12 md:px-24",
      isFullPage ? "py-16" : "py-14"
    )}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end mb-10 gap-8">
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
              onOpen={() => {
                if (s.id === 'agartha') setShowAagarthaLayout(true);
                else setSelectedSanctuary(s);
              }}
            />
          ))}
        </div>
      </div>

      {/* Agartha interactive layout */}
      <AnimatePresence>
        {showAagarthaLayout && (
          <AagarthaInteractiveLayout onClose={() => setShowAagarthaLayout(false)} />
        )}
      </AnimatePresence>

      {/* Property detail overlay (non-Agartha) */}
      <AnimatePresence>
        {selectedSanctuary && (
          <div className="fixed inset-0 z-[80] overflow-hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSanctuary(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <PropertyDetailOverlay sanctuary={selectedSanctuary} onClose={() => setSelectedSanctuary(null)} />
          </div>
        )}
      </AnimatePresence>
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
    <section id="membership" className="py-16 px-12 md:px-24 bg-olive-800 text-cream">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
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
              <div key={i} className="p-10 border border-cream/10 bg-surface/5 backdrop-blur-sm">
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
    await saveNewsletter(data.email, 'modal');
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
                Unlocks access to SYL and future landmarks.
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
    await saveLead({ name: data.name, email: data.email, intent: data.intent });
    setSubmitted(true);
  };

  return (
    <section id="apply" className="py-16 px-12 md:px-24 bg-cream">
      <div className="max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-5xl md:text-7xl font-medium text-olive-900 mb-12">Apply for <br /><span className="italic text-olive-800">Membership.</span></h2>
            <p className="text-xl md:text-2xl font-light text-olive-900/40 leading-relaxed">
              We seek intelligent individuals who believe that a community's strength lies in its shared ethics and environmental stewardship.
            </p>
          </div>

          <div className="bg-surface p-12 md:p-20 shadow-2xl border border-olive-800/5">
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
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-4 mb-12">
              <Logo className="w-10 h-10 text-cream" />
            </div>
            <p className="text-xl font-light text-cream/30 max-w-md leading-relaxed">
              Independent collective curating India's most exclusive organic sanctuaries. Featuring MODCON Agartha and SYL at Tukkuguda.
            </p>
          </div>
          
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-gold mb-12">The Agenda</p>
            <ul className="space-y-6 text-[10px] uppercase tracking-[0.4em] text-cream/40">
              <li><a href="#the-advantage" className="hover:text-cream transition-all">Advantage</a></li>
              <li><a href="#ecosystems" className="hover:text-cream transition-all">Ecosystems</a></li>
              <li><a href="#map" className="hover:text-cream transition-all">Map</a></li>
              <li><a href="#agartha" className="hover:text-cream transition-all">Agartha</a></li>
              <li><a href="#syl" className="hover:text-cream transition-all">SYL</a></li>
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

const TrustSignals = () => {
  return (
    <section className="py-24 px-6 md:px-24 bg-surface border-y border-outline/10 text-center">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <span className="text-olive-800 text-xs font-bold uppercase tracking-[0.6em] mb-4 block">Proven Legacy</span>
          <h2 className="text-3xl md:text-5xl font-medium text-olive-900 mb-16 italic">Trusted by Visionaries.</h2>
        </motion.div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
          <div className="flex items-center justify-center h-20">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Forbes</h3>
          </div>
          <div className="flex items-center justify-center h-20">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Vogue</h3>
          </div>
          <div className="flex items-center justify-center h-20">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">ArchDigest</h3>
          </div>
          <div className="flex items-center justify-center h-20">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Bloomberg</h3>
          </div>
        </div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }} className="mt-20 p-12 bg-cream/30 rounded-3xl border border-olive-800/5 relative shadow-sm">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-surface w-12 h-12 rounded-full flex items-center justify-center text-gold shadow-sm border border-olive-800/10">
            <span className="text-3xl font-serif leading-none mt-2">"</span>
          </div>
          <p className="text-xl md:text-2xl font-normal text-olive-900/90 leading-relaxed mb-8 italic">
            An unparalleled approach to ecological luxury. The Green Team has essentially cracked the code on scaling self-sustaining sanctuaries without compromising on elegance.
          </p>
          <div className="flex items-center justify-center gap-4">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-olive-800/20 border-2 border-white">
              <img src="https://picsum.photos/seed/ark/100/100" alt="Member" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <p className="font-bold text-olive-900 text-sm uppercase tracking-wider">A. R. Krishnan</p>
              <p className="text-[10px] text-olive-800/60 uppercase tracking-widest font-bold">Early Member, Agartha</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
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
    await saveNewsletter(email, 'inline');
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
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em] mb-8 block">The Intelligence Network</span>
            <h2 className="text-5xl md:text-7xl font-medium mb-12">Stay ahead of <br /><span className="italic text-cream/60">the resource curve.</span></h2>
            <p className="text-xl font-light text-cream/60 leading-relaxed max-w-md">
              Receive private briefings on environmental integrity, sanctuary valuations, and new curation alerts.
            </p>
          </div>

          <div className="bg-surface/5 backdrop-blur-md p-12 md:p-20 border border-white/10">
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
                    className="w-full bg-transparent border-b border-white/20 py-6 outline-none focus:border-gold transition-all font-light text-2xl text-cream placeholder:text-on-surface/10" 
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
              className="fixed bottom-32 right-8 z-[100] w-[400px] max-w-[calc(100vw-4rem)] h-[600px] bg-surface shadow-2xl border border-olive-800/10 flex flex-col overflow-hidden rounded-3xl"
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
                <button onClick={handleClose} className="p-2 hover:bg-surface/10 transition-all rounded-full">
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
                        : "bg-surface text-olive-900 border border-outline/10 rounded-tl-none"
                    )}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-start">
                    <div className="bg-surface border border-outline/10 p-4 rounded-2xl rounded-tl-none shadow-sm">
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

              <div className="p-6 bg-surface border-t border-outline/10">
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
    <TrustSignals />
    <NewsletterHighlight onSubscribe={onNewsletterClick} />
    <Footer />
  </div>
);

// ─── Auth Modal ──────────────────────────────────────────────────────────────

const friendlyAuthError = (code: string) => {
  const map: Record<string, string> = {
    'auth/user-not-found':           'No account found. Try signing up.',
    'auth/wrong-password':           'Incorrect password.',
    'auth/invalid-credential':       'Invalid email or password.',
    'auth/email-already-in-use':     'Email already registered. Sign in instead.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/invalid-email':            'Enter a valid email address.',
    'auth/invalid-phone-number':     'Enter a valid number with country code (e.g. +91).',
    'auth/invalid-verification-code':'Invalid OTP. Please try again.',
    'auth/too-many-requests':        'Too many attempts. Try again later.',
    'auth/missing-phone-number':     'Please enter your phone number.',
  };
  return map[code] || 'Something went wrong. Please try again.';
};

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
}) => {
  const [tab, setTab]               = useState<'email' | 'phone'>('email');
  const [emailMode, setEmailMode]   = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [phone, setPhone]           = useState('+91 ');
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmationResult | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const recaptchaVerifier           = useRef<RecaptchaVerifier | null>(null);

  // Reset everything when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTab('email'); setEmailMode('signin');
      setEmail(''); setPassword('');
      setPhone('+91 '); setOtp('');
      setOtpSent(false); setConfirmResult(null); setError('');
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
    }
  }, [isOpen]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const cred = emailMode === 'signin'
        ? await signInWithEmailAndPassword(auth, email, password)
        : await createUserWithEmailAndPassword(auth, email, password);
      onSuccess(cred.user);
      onClose();
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!recaptchaVerifier.current) {
        recaptchaVerifier.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      const result = await signInWithPhoneNumber(auth, phone.trim(), recaptchaVerifier.current);
      setConfirmResult(result);
      setOtpSent(true);
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
      recaptchaVerifier.current?.clear();
      recaptchaVerifier.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmResult) return;
    setError('');
    setLoading(true);
    try {
      const cred = await confirmResult.confirm(otp);
      onSuccess(cred.user);
      onClose();
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-olive-900/90 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-cream w-full max-w-md p-10 md:p-14 shadow-2xl border border-olive-800/10"
          >
            <button onClick={onClose} className="absolute top-6 right-6 text-olive-900/40 hover:text-olive-900 transition-all">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-serif italic text-olive-900 mb-2">Member Access</h2>
              <p className="text-olive-800/50 text-sm font-light">Sign in to unlock the sanctuaries.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-8 border-b border-outline/10">
              {(['email', 'phone'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(''); }}
                  className={cn(
                    "flex-1 py-3 text-[10px] uppercase tracking-[0.4em] font-bold border-b-2 transition-all",
                    tab === t ? "border-primary text-olive-900" : "border-transparent text-olive-800/40 hover:text-olive-900"
                  )}
                >
                  {t === 'email' ? 'Email' : 'Phone / OTP'}
                </button>
              ))}
            </div>

            {/* ── Email Tab ── */}
            {tab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-cashew" placeholder="email@domain.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input-cashew" placeholder="••••••••" />
                </div>
                {error && <p className="text-red-500 text-xs leading-relaxed">{error}</p>}
                <button type="submit" disabled={loading} className="w-full btn-membership btn-olive flex items-center justify-center gap-3">
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {loading ? 'Please wait…' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
                <p className="text-center text-[10px] text-olive-800/50">
                  {emailMode === 'signin' ? "Don't have an account? " : 'Already registered? '}
                  <button
                    type="button"
                    onClick={() => { setEmailMode(emailMode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                    className="text-primary underline underline-offset-2 font-bold"
                  >
                    {emailMode === 'signin' ? 'Sign Up' : 'Sign In'}
                  </button>
                </p>
              </form>
            )}

            {/* ── Phone Tab ── */}
            {tab === 'phone' && (
              <>
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Mobile Number</label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        className="input-cashew"
                        placeholder="+91 98765 43210"
                      />
                      <p className="text-[9px] text-olive-800/30 uppercase tracking-widest">Include country code (+91 for India)</p>
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <div id="recaptcha-container" />
                    <button type="submit" disabled={loading} className="w-full btn-membership btn-olive flex items-center justify-center gap-3">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {loading ? 'Sending OTP…' : 'Send OTP'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Enter OTP</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        required
                        maxLength={6}
                        autoFocus
                        className="input-cashew tracking-[0.5em] text-center text-2xl"
                        placeholder="• • • • • •"
                      />
                      <p className="text-[9px] text-olive-800/30 uppercase tracking-widest">OTP sent to {phone.trim()}</p>
                    </div>
                    {error && <p className="text-red-500 text-xs">{error}</p>}
                    <button type="submit" disabled={loading || otp.length < 6} className="w-full btn-membership btn-olive flex items-center justify-center gap-3">
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {loading ? 'Verifying…' : 'Verify & Sign In'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); setError(''); recaptchaVerifier.current?.clear(); recaptchaVerifier.current = null; }}
                      className="w-full text-[10px] text-olive-800/40 hover:text-olive-900 transition-colors uppercase tracking-widest"
                    >
                      ← Change Number
                    </button>
                  </form>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

const ADMIN_EMAIL = 'sumanthbolla97@gmail.com';

const AdminDashboard = ({ onClose, user }: { onClose: () => void; user: User }) => {
  const [tab, setTab]           = useState<'leads' | 'newsletter'>('leads');
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [subs, setSubs]         = useState<NewsletterEntry[]>([]);
  const [fetching, setFetching] = useState(false);

  const fetchData = async () => {
    setFetching(true);
    try {
      const [l, s] = await Promise.all([getLeads(), getNewsletterSubs()]);
      setLeads(l); setSubs(s);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const fmt = (ts: { seconds: number } | null) => {
    if (!ts) return '—';
    return new Date(ts.seconds * 1000).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="h-full w-full overflow-y-auto bg-cream">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-cream border-b border-outline/10 px-6 md:px-12 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm uppercase tracking-widest text-olive-900">Admin Console</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-xs text-olive-800/50 truncate max-w-[200px]">{user.email}</span>
          <button onClick={fetchData} disabled={fetching} className="p-2 rounded-full hover:bg-primary/10 transition-colors" title="Refresh">
            <RefreshCw className={cn("w-4 h-4 text-olive-800", fetching && "animate-spin")} />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-primary/10 transition-colors">
            <X className="w-5 h-5 text-olive-900" />
          </button>
        </div>
      </div>

      {(
        /* Dashboard */
        <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface border border-outline/10 p-6 flex items-center gap-4">
              <Users className="w-8 h-8 text-primary opacity-60" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-olive-800/40 mb-1">Membership Leads</p>
                <p className="text-3xl font-bold text-olive-900">{leads.length}</p>
              </div>
            </div>
            <div className="bg-surface border border-outline/10 p-6 flex items-center gap-4">
              <MailIcon className="w-8 h-8 text-primary opacity-60" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.4em] text-olive-800/40 mb-1">Newsletter Subs</p>
                <p className="text-3xl font-bold text-olive-900">{subs.length}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-outline/10">
            {(['leads', 'newsletter'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "px-6 py-3 text-[10px] uppercase tracking-[0.4em] font-bold border-b-2 transition-all",
                  tab === t ? "border-primary text-olive-900" : "border-transparent text-olive-800/40 hover:text-olive-900"
                )}
              >
                {t === 'leads' ? 'Membership Leads' : 'Newsletter'}
              </button>
            ))}
          </div>

          {/* Leads table */}
          {tab === 'leads' && (
            <div className="overflow-x-auto">
              {leads.length === 0 ? (
                <p className="text-olive-800/40 text-sm py-12 text-center">No leads yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 border-b border-outline/10">
                      <th className="text-left py-3 pr-6">Name</th>
                      <th className="text-left py-3 pr-6">Email</th>
                      <th className="text-left py-3 pr-6">Intent</th>
                      <th className="text-left py-3">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className="border-b border-outline/5 hover:bg-primary/5 transition-colors">
                        <td className="py-4 pr-6 font-medium text-olive-900">{l.name}</td>
                        <td className="py-4 pr-6 text-olive-800/70">{l.email}</td>
                        <td className="py-4 pr-6 text-olive-800/50 max-w-xs">
                          <span className="line-clamp-2">{l.intent || '—'}</span>
                        </td>
                        <td className="py-4 text-olive-800/40 whitespace-nowrap text-xs">{fmt(l.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Newsletter table */}
          {tab === 'newsletter' && (
            <div className="overflow-x-auto">
              {subs.length === 0 ? (
                <p className="text-olive-800/40 text-sm py-12 text-center">No subscribers yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 border-b border-outline/10">
                      <th className="text-left py-3 pr-6">Email</th>
                      <th className="text-left py-3 pr-6">Source</th>
                      <th className="text-left py-3">Signed Up</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subs.map(s => (
                      <tr key={s.id} className="border-b border-outline/5 hover:bg-primary/5 transition-colors">
                        <td className="py-4 pr-6 font-medium text-olive-900">{s.email}</td>
                        <td className="py-4 pr-6">
                          <span className={cn(
                            "text-[9px] uppercase tracking-widest font-bold px-2 py-1",
                            s.source === 'modal' ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"
                          )}>
                            {s.source === 'modal' ? 'Modal' : 'Inline'}
                          </span>
                        </td>
                        <td className="py-4 text-olive-800/40 whitespace-nowrap text-xs">{fmt(s.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  type ViewMode = 'home' | 'map' | 'list' | 'gallery' | 'analytics' | 'syl' | 'admin';
  const VIEW_ORDER: ViewMode[] = ['home', 'list', 'gallery', 'analytics', 'syl', 'map'];

  const [authUser, setAuthUser]   = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Global auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u);
      // Auto-redirect admin to dashboard after sign-in
      if (u?.email === ADMIN_EMAIL) setViewMode('admin');
    });
    return unsub;
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setViewMode('home');
  };

  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('gt_subscribed') === 'true';
  });
  // A logged-in user is always treated as a subscriber — no gates shown
  const effectivelySubscribed = isSubscribed || !!authUser;
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isDark, setIsDark] = useState(false);

  // ── Scroll-position memory ────────────────────────────────────────────────
  const scrollPositions = useRef<Partial<Record<ViewMode, number>>>({});
  const scrollRef       = useRef<HTMLDivElement>(null);

  const handleViewChange = useCallback((next: ViewMode) => {
    // Save current scroll before leaving
    if (scrollRef.current) scrollPositions.current[viewMode] = scrollRef.current.scrollTop;
    setViewMode(next);
  }, [viewMode]);

  // Restore scroll after the new view renders
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollPositions.current[viewMode] ?? 0;
  }, [viewMode]);

  // ── Swipe navigation (horizontal > 60 px, dominant over vertical) ────────
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dx) < dy * 1.5) return; // vertical scroll, ignore
    const idx = VIEW_ORDER.indexOf(viewMode);
    if (dx < 0 && idx < VIEW_ORDER.length - 1) handleViewChange(VIEW_ORDER[idx + 1]); // swipe left → next
    if (dx > 0 && idx > 0)                     handleViewChange(VIEW_ORDER[idx - 1]); // swipe right → prev
  }, [viewMode, handleViewChange]);

  useEffect(() => {
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  const handleSubscribe = () => {
    setIsSubscribed(true);
    localStorage.setItem('gt_subscribed', 'true');
  };

  return (
    <div
      className="h-screen w-screen bg-cream text-olive-900 overflow-hidden flex flex-col transition-colors duration-700"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Navbar
        isSubscribed={effectivelySubscribed}
        onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }}
        onModeChange={handleViewChange}
        isDark={isDark}
        setIsDark={setIsDark}
        onSignInClick={() => setIsAuthOpen(true)}
        authUser={authUser}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Center - Map or other views */}
        <div className="flex-1 relative overflow-hidden bg-surface">
          {viewMode === 'map' && <SanctuaryMapLayout />}
          {viewMode === 'admin' && authUser && <AdminDashboard onClose={() => handleViewChange('home')} user={authUser} />}
          {viewMode !== 'map' && viewMode !== 'admin' && (
            <div ref={scrollRef} className="h-full w-full overflow-y-auto">
              {viewMode === 'home' && <HomeView isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} />}
              {viewMode === 'list' && <Sanctuaries isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} isFullPage />}
              {viewMode === 'gallery' && <EcosystemPillars isFullPage />}
              {viewMode === 'analytics' && <Advantage isFullPage />}
              {viewMode === 'syl' && <TheSIL isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} isFullPage />}
            </div>
          )}
        </div>
      </main>

      <ChatBot data={{ sanctuaries: SANCTUARIES }} />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={user => {
          setAuthUser(user);
          setIsAuthOpen(false);
          if (user.email === ADMIN_EMAIL) handleViewChange('admin');
        }}
      />

      <NewsletterModal
        isOpen={isNewsletterOpen} 
        onClose={() => setIsNewsletterOpen(false)} 
        onSubscribe={handleSubscribe} 
      />
    </div>
  );
}
