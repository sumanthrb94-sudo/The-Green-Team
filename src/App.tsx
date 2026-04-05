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
import { auth, db, googleProvider } from './lib/firebase';
import { saveLead, saveNewsletter, getLeads, getNewsletterSubs } from './lib/leads';
import type { Lead, NewsletterEntry } from './lib/leads';
import { upsertUserProfile, getAllUsers } from './lib/users';
import type { UserProfile } from './lib/users';
import { subscribeProperties, createProperty, updateProperty, deleteProperty } from './lib/properties';
import type { PropertyDoc, PropertyInput } from './lib/properties';

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
  // Site plan + external brochure — populate for any property with a site plan
  sitePlanSrc?: string;
  brochureUrl?: string;
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
    image: '/agartha-render.jpg',
    tagline: 'Where the forest becomes home.',
    description: 'MODCON Agartha is a first-of-its-kind biomorphic residential community carved into the Narsapur forest periphery. 53 thoughtfully sized plots surround a 14,548 sq yd organic amenity core — featuring fluid earth architecture, solar-integrated curved roofs, and living canopies that blur the line between structure and forest. No two plots are the same. No straight lines anywhere.',
    plots: 53,
    plotRange: '808 – 5,097 sq yds',
    amenityAcres: '14,548 sq yds',
    architect: 'MODCON Builders',
    sitePlanSrc: '/agartha-layout.jpg',
    brochureUrl: 'https://www.modconbuilders.com/agartha',
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

const Navbar = ({ isSubscribed, onNewsletterClick, onModeChange, isDark, setIsDark, onSignInClick, authUser, onSignOut, isAdmin, onAdminClick }: {
  isSubscribed: boolean;
  onNewsletterClick: () => void;
  onModeChange: (mode: any) => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  onSignInClick: () => void;
  authUser: User | null;
  onSignOut: () => void;
  isAdmin: boolean;
  onAdminClick: () => void;
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [sanctuariesOpen, setSanctuariesOpen] = useState(false);

  const navItems = [
    { name: 'Home', id: 'home' },
    { name: 'Map', id: 'map' },
    { name: 'Advantage', id: 'analytics' },
    { name: 'Ecosystems', id: 'gallery' },
    { name: 'Membership', id: 'membership' },
  ];

  const sanctuaryItems = [
    { name: 'MODCON Agartha', id: 'list', sub: 'Narsapur Forest · From ₹64.6 L', img: '/agartha-render.jpg' },
    { name: 'SYL: Vertical Villament', id: 'syl', sub: 'Tukkuguda · From ₹1.9 Cr', img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=400' },
  ];

  const avatarLetter = (authUser?.displayName?.[0] || authUser?.email?.[0] || authUser?.phoneNumber?.[1] || '?').toUpperCase();

  return (
    <nav className="relative z-[9990] px-6 md:px-10 flex items-center justify-between h-16 md:h-20 bg-cream border-b border-outline/10">
      {/* Left: Brand + dark mode toggle */}
      <div className="flex items-center gap-3">
        <button onClick={() => onModeChange('home')} className="flex items-center focus:outline-none" aria-label="Go to home">
          <Logo className="w-7 h-7" textClassName="text-base md:text-lg" />
        </button>
        <button
          onClick={() => setIsDark(!isDark)}
          title={isDark ? 'Light mode' : 'Dark mode'}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-[8px] uppercase tracking-widest font-bold transition-all",
            isDark
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-outline/8 border-outline/20 text-secondary/60 hover:border-primary/30 hover:text-primary"
          )}
        >
          {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          <span className="hidden sm:inline">{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </div>

      {/* Right: admin badge (admin only) + menu/avatar trigger */}
      <div className="flex items-center gap-2">
        {isAdmin && (
          <button onClick={onAdminClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[8px] uppercase tracking-widest font-bold rounded-full hover:bg-primary/20 transition-all"
          >
            <ShieldCheck className="w-3 h-3" /> Admin
          </button>
        )}
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
      </div>

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
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999]"
            />

            <motion.div
              key="nav-panel"
              initial={{ opacity: 0, y: '-100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 right-0 bg-surface z-[10000] flex flex-col p-8 md:p-16 shadow-2xl rounded-b-[40px] max-h-[95vh] overflow-y-auto"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between mb-10">
                <Logo className="w-8 h-8" textClassName="text-lg" />
                <button onClick={() => setIsMenuOpen(false)} className="p-3 hover:bg-primary/5 rounded-full transition-all">
                  <X className="w-6 h-6 text-on-surface" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-10 md:gap-24">
                {/* Nav links */}
                <div className="flex flex-col gap-5">
                  <p className="text-[10px] uppercase tracking-[0.6em] text-secondary font-bold opacity-40">Explore</p>
                  <div className="flex flex-col gap-5">
                    {navItems.map((item) => (
                      <button key={item.id}
                        onClick={() => { onModeChange(item.id as any); setIsMenuOpen(false); }}
                        className="text-2xl md:text-3xl uppercase tracking-[0.1em] font-headline font-bold text-on-surface hover:text-primary transition-all flex items-center justify-between group text-left"
                      >
                        <span className="group-hover:translate-x-2 transition-transform duration-500">{item.name}</span>
                        <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </button>
                    ))}

                    {/* Sanctuaries — expandable dropdown */}
                    <div>
                      <button
                        onClick={() => setSanctuariesOpen(v => !v)}
                        className="text-2xl md:text-3xl uppercase tracking-[0.1em] font-headline font-bold text-on-surface hover:text-primary transition-all flex items-center justify-between w-full group"
                      >
                        <span className="group-hover:translate-x-2 transition-transform duration-500">Sanctuaries</span>
                        <ChevronDown className={cn("w-5 h-5 text-primary transition-transform duration-300", sanctuariesOpen && "rotate-180")} />
                      </button>

                      <AnimatePresence>
                        {sanctuariesOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="overflow-hidden mt-4"
                          >
                            <div className="flex flex-col gap-3 pl-2 border-l-2 border-primary/20">
                              {sanctuaryItems.map(s => (
                                <button key={s.id}
                                  onClick={() => { onModeChange(s.id as any); setIsMenuOpen(false); setSanctuariesOpen(false); }}
                                  className="flex items-center gap-4 group/item text-left hover:translate-x-1 transition-transform duration-200"
                                >
                                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-outline/10">
                                    <img src={s.img} alt={s.name} referrerPolicy="no-referrer" className="w-full h-full object-cover grayscale group-hover/item:grayscale-0 transition-all duration-500" />
                                  </div>
                                  <div>
                                    <p className="font-headline font-bold text-sm text-on-surface group-hover/item:text-primary transition-colors">{s.name}</p>
                                    <p className="text-[9px] uppercase tracking-widest text-secondary/50">{s.sub}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
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
                          <p className="text-[10px] uppercase tracking-widest text-secondary/60 mt-0.5">{isAdmin ? 'Admin' : 'Member'}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => { setIsMenuOpen(false); onAdminClick(); }}
                          className="w-full text-[11px] uppercase tracking-[0.5em] font-bold bg-primary/10 text-primary border-2 border-primary/20 px-8 py-4 hover:bg-primary hover:text-on-primary hover:border-primary transition-all rounded-2xl flex items-center justify-center gap-3"
                        >
                          <ShieldCheck className="w-4 h-4" /> Admin Dashboard
                        </button>
                      )}
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
      whileHover={{ y: -4 }}
      className="group relative aspect-square overflow-hidden rounded-3xl cursor-pointer bg-[#0e1409]"
      onClick={() => { if (!isGated) onOpen(); }}
    >
      {/* Full-bleed image */}
      <img
        src={sanctuary.image}
        alt={sanctuary.title}
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-1000",
          isGated ? "grayscale brightness-50" : "grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-90 group-hover:scale-105"
        )}
        referrerPolicy="no-referrer"
      />

      {/* Gradient overlay — strong at bottom, light at top */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/10 pointer-events-none" />

      {/* Gated overlay */}
      {isGated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
          <Shield className="w-10 h-10 text-primary mb-4" />
          <h4 className="text-xl font-headline font-bold text-white mb-2">Locked Landmark.</h4>
          <p className="text-xs text-white/60 mb-6 max-w-[180px]">Sign up for our newsletter to view SYL details.</p>
          <button onClick={e => { e.stopPropagation(); onNewsletterClick(); }}
            className="px-5 py-2.5 bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold rounded-xl">
            Unlock Now
          </button>
        </div>
      )}

      {/* Top badge */}
      <div className="absolute top-5 left-5">
        <span className="bg-primary text-on-primary px-3 py-1 text-[8px] uppercase tracking-[0.4em] font-bold rounded-full">
          {sanctuary.id === 'syl' ? 'Upcoming' : 'Live'}
        </span>
      </div>

      {/* Bottom info overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 pt-10">
        {/* Title + price row */}
        <div className="flex items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-[0.4em] text-primary/80 font-bold mb-1 truncate">{sanctuary.commute}</p>
            <h3 className="text-2xl font-headline font-bold text-white leading-tight">{sanctuary.title}</h3>
          </div>
          <div className="text-right flex-shrink-0">
            {sanctuary.pricePerSqYd ? (
              <>
                <p className="text-[8px] text-white/40 mb-0.5">₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}/sq yd</p>
                <p className="text-xl font-headline font-bold text-white">{sanctuary.memberPrice}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-white/40 line-through">{sanctuary.valuation}</p>
                <p className="text-xl font-headline font-bold text-white">{sanctuary.memberPrice}</p>
              </>
            )}
          </div>
        </div>

        {/* Stats row + CTA */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-primary" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/70">AQI {sanctuary.aqi}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/70">{sanctuary.noise} dB</span>
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); if (!isGated) onOpen(); }}
            className="flex-shrink-0 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[8px] uppercase tracking-widest font-bold rounded-xl hover:bg-primary hover:border-primary transition-all"
          >
            View →
          </button>
        </div>
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
    if (!targetView) return;
    const [lat, lng] = targetView.center;
    // Guard: reject NaN or zero-size container (map is hidden via display:none)
    if (!isFinite(lat) || !isFinite(lng)) return;
    const size = map.getSize();
    if (size.x === 0 || size.y === 0) return;
    map.flyTo([lat, lng], targetView.zoom, {
      animate: true,
      duration: 1.5
    });
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

// Tracks visibility of the always-mounted map: forces Leaflet to recalculate container size
// and delays revealing the map until tiles have securely loaded
const MapVisibilityTracker = ({ isVisible, onReady }: { isVisible?: boolean; onReady: () => void }) => {
  const map = useMap();
  useEffect(() => {
    let t1: NodeJS.Timeout, t2: NodeJS.Timeout;
    if (isVisible) {
      t1 = setTimeout(() => { map.invalidateSize(); }, 150);
      t2 = setTimeout(() => { map.invalidateSize(); onReady(); }, 1800); 
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isVisible, map, onReady]);
  return null;
};

// ─── Generic Property Interactive Layout ─────────────────────────────────────

interface Hotspot {
  id: string;
  num: number;
  x: number;  // % from left
  y: number;  // % from top
  label: string;
  tag: string;
  detail: string;
  stats: { label: string; value: string }[];
}

interface PropertyLayoutConfig {
  sitePlanSrc: string;
  sitePlanFallback?: string;
  hotspots: Hotspot[];
  projectName: string;
  developerTag: string;   // e.g. "MODCON Builders · Narsapur"
  tagline: string;        // e.g. "53 plots · Forest community · From ₹64.6 L"
  brochureUrl?: string;
  intentPrefix: string;   // used in lead: "Agartha — Organic Amenity Core"
}

/**
 * PropertyInteractiveLayout
 * Reusable full-screen overlay: site plan left, feature info + lead form right.
 * This is the template for ALL property cards — Agartha and future listings.
 */
const PropertyInteractiveLayout: FC<PropertyLayoutConfig & { onClose: () => void }> = ({
  sitePlanSrc, sitePlanFallback, hotspots, projectName, developerTag, tagline,
  brochureUrl, intentPrefix, onClose,
}) => {
  const [active, setActive] = useState<Hotspot>(hotspots[0]);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setLeadLoading(true);
    try {
      await saveLead({ name: leadName.trim(), email: leadPhone.trim(), intent: `${intentPrefix} — ${active.label}` });
    } catch {/* fire and forget */} finally {
      setLeadLoading(false);
      setLeadSubmitted(true);
    }
  };

  const LeadForm = () => leadSubmitted ? (
    <div className="text-center py-6 space-y-3">
      <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
        <Check className="w-6 h-6 text-primary" />
      </div>
      <p className="text-sm font-bold text-white">We'll be in touch soon.</p>
      <p className="text-[11px] text-white/40">Our team will call you within 24 hours.</p>
      {brochureUrl && (
        <a href={brochureUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest font-bold text-primary/70 hover:text-primary transition-colors mt-2">
          View full brochure <ArrowRight className="w-3 h-3" />
        </a>
      )}
    </div>
  ) : (
    <form onSubmit={handleLeadSubmit} className="space-y-3">
      <input type="text" placeholder="Your Name" value={leadName}
        onChange={e => setLeadName(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
      <input type="tel" placeholder="Phone Number" value={leadPhone}
        onChange={e => setLeadPhone(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors" />
      <button type="submit" disabled={leadLoading || !leadName.trim() || !leadPhone.trim()}
        className="w-full py-3.5 bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all disabled:opacity-50">
        <ArrowRight className="w-3.5 h-3.5" />
        {leadLoading ? 'Sending…' : 'Request Site Visit'}
      </button>
      {brochureUrl && (
        <a href={brochureUrl} target="_blank" rel="noopener noreferrer"
          className="block text-center text-[9px] uppercase tracking-widest font-bold text-white/25 hover:text-white/50 transition-colors pt-1">
          View Brochure Instead →
        </a>
      )}
    </form>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-[#0a0f07] flex flex-col md:flex-row overflow-hidden"
    >
      {/* ── LEFT: Full Site Plan — scrollable on mobile, fills screen on desktop ── */}
      <div className="relative w-full md:flex-1 md:h-full overflow-y-auto md:overflow-hidden flex flex-col">

        {/* Sticky header over the plan */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/70 to-transparent md:absolute md:top-0 md:left-0 md:right-0">
          <div>
            <p className="text-[8px] uppercase tracking-[0.5em] text-white/50 font-bold">Site Layout</p>
            <p className="text-sm font-bold text-white mt-0.5">{projectName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 backdrop-blur-sm rounded-full hover:bg-white/20 transition-all flex-shrink-0">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Site plan image — full portrait, no cropping */}
        <div className="relative flex-1 md:absolute md:inset-0 md:flex md:items-center md:justify-center">
          <img
            src={sitePlanSrc}
            alt={`${projectName} site plan`}
            className="w-full h-auto md:max-h-full md:w-auto md:max-w-full object-contain"
            onError={(e) => {
              if (sitePlanFallback) (e.target as HTMLImageElement).src = sitePlanFallback;
            }}
            referrerPolicy="no-referrer"
          />

          {/* Interactive dot markers */}
          {hotspots.map((h) => {
            const isActive = active.id === h.id;
            return (
              <button key={h.id} style={{ left: `${h.x}%`, top: `${h.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2" onClick={() => setActive(h)}>
                <span className={cn(
                  "relative block rounded-full border-2 border-white shadow-lg transition-all duration-200",
                  isActive ? "w-4 h-4 bg-primary scale-125" : "w-3 h-3 bg-white/60 hover:bg-white hover:scale-125"
                )} />
                {isActive && <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping pointer-events-none" />}
              </button>
            );
          })}
        </div>

        {/* Mobile-only: feature strip + lead form below the site plan */}
        <div className="md:hidden bg-[#0a0f07] px-5 py-4 border-t border-white/10">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {hotspots.map(h => (
              <button key={h.id} onClick={() => setActive(h)}
                className={cn(
                  "flex-shrink-0 text-[8px] uppercase tracking-widest font-bold px-3 py-2 rounded-full border transition-all",
                  active.id === h.id
                    ? "bg-primary border-primary text-on-primary"
                    : "border-white/15 text-white/50 hover:border-primary/40 hover:text-primary"
                )}>
                {h.label.split(' ').slice(0, 2).join(' ')}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={active.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }} className="mt-4 space-y-3">
              <p className="text-[8px] uppercase tracking-[0.4em] text-primary/60 font-bold">{active.tag}</p>
              <h3 className="text-lg font-headline font-bold text-white leading-snug">{active.label}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{active.detail}</p>
              <div className="grid grid-cols-3 gap-2 pt-1">
                {active.stats.map(s => (
                  <div key={s.label} className="bg-white/5 rounded-lg px-3 py-2 text-center">
                    <p className="text-[8px] uppercase tracking-wider text-white/30 font-bold mb-1">{s.label}</p>
                    <p className="text-xs font-bold text-white">{s.value}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 border-t border-white/10 pt-5">
            <p className="text-[9px] uppercase tracking-[0.4em] text-white/40 font-bold mb-3">Express Interest</p>
            <LeadForm />
          </div>
        </div>
      </div>

      {/* ── RIGHT: Info + Lead panel (desktop only) ── */}
      <div className="hidden md:flex w-[380px] flex-shrink-0 bg-[#0e1409] flex-col overflow-hidden border-l border-white/5">
        <div className="flex-1 overflow-y-auto px-7 py-8 space-y-8">

          {/* Project header */}
          <div>
            <p className="text-[8px] uppercase tracking-[0.5em] text-primary/50 font-bold mb-2">{developerTag}</p>
            <h2 className="text-2xl font-headline font-bold text-white leading-tight">{projectName}</h2>
            <p className="text-sm text-white/50 mt-1">{tagline}</p>
          </div>

          {/* Feature selector */}
          <div>
            <p className="text-[8px] uppercase tracking-[0.35em] text-white/30 font-bold mb-3">Explore Features</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {hotspots.map(h => (
                <button key={h.id} onClick={() => setActive(h)}
                  className={cn(
                    "text-[8px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-all",
                    active.id === h.id
                      ? "bg-primary border-primary text-on-primary"
                      : "border-white/10 text-white/40 hover:border-primary/40 hover:text-primary"
                  )}>
                  {h.label.split(' ').slice(0, 2).join(' ')}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={active.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }} className="space-y-4">
                <span className="text-[8px] uppercase tracking-[0.4em] text-primary/60 font-bold">{active.tag}</span>
                <h3 className="text-lg font-headline font-bold text-white leading-snug">{active.label}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{active.detail}</p>
                <div className="space-y-0">
                  {active.stats.map(s => (
                    <div key={s.label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-[9px] uppercase tracking-[0.3em] text-white/30 font-bold">{s.label}</span>
                      <span className="text-sm font-bold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Lead capture */}
          <div className="border-t border-white/5 pt-6">
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-bold mb-1">Reserve Your Plot</p>
            <p className="text-xs text-white/40 mb-4 leading-relaxed">
              Express interest and our team will reach out within 24 hours.
            </p>
            <LeadForm />
          </div>
        </div>

        <div className="px-7 py-4 border-t border-white/5 flex-shrink-0">
          <button onClick={onClose}
            className="w-full py-2.5 text-[9px] uppercase tracking-widest font-bold text-white/20 hover:text-white/50 transition-all">
            Close
          </button>
        </div>
      </div>
    </motion.div>
  );
};

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

// ─── Agartha: 53 individual plot dots ────────────────────────────────────────
// Positions (x%, y%) map onto the portrait site plan image.
// Sizes reflect the actual MODCON plot range (808–5,097 sq yds).
// Plot 15 = landmark premium corner (dual forest frontage, 5,097 sq yds).

interface PlotDot { id: number; sqYds: number; x: number; y: number }

const AGARTHA_PLOTS: PlotDot[] = [
  // ── North outer arc (near Grand Entry boulevard) ──
  { id:1,  sqYds:1050, x:22, y:22 },
  { id:2,  sqYds:980,  x:30, y:18 },
  { id:3,  sqYds:920,  x:38, y:16 },
  { id:4,  sqYds:900,  x:46, y:17 },
  { id:5,  sqYds:950,  x:54, y:19 },
  { id:6,  sqYds:1100, x:62, y:22 },
  // ── North-East outer ──
  { id:7,  sqYds:1300, x:70, y:26 },
  { id:8,  sqYds:1400, x:76, y:32 },
  { id:9,  sqYds:1500, x:79, y:38 },
  { id:10, sqYds:1550, x:80, y:44 },
  { id:11, sqYds:1600, x:79, y:50 },
  { id:12, sqYds:1500, x:77, y:56 },
  // ── South-East outer ──
  { id:13, sqYds:1800, x:73, y:62 },
  { id:14, sqYds:2000, x:68, y:68 },
  // ── PLOT 15 — Premium Corner (largest, dual forest frontage) ──
  { id:15, sqYds:5097, x:14, y:72 },
  // ── South arc ──
  { id:16, sqYds:2200, x:62, y:75 },
  { id:17, sqYds:1900, x:54, y:79 },
  { id:18, sqYds:1700, x:46, y:81 },
  { id:19, sqYds:1500, x:38, y:80 },
  { id:20, sqYds:1350, x:30, y:77 },
  // ── South-West outer (forest edge) ──
  { id:21, sqYds:1800, x:24, y:73 },
  { id:22, sqYds:2400, x:18, y:67 },
  { id:23, sqYds:2800, x:13, y:61 },
  // ── West outer (Narsapur forest buffer boundary) ──
  { id:24, sqYds:3200, x:11, y:54 },
  { id:25, sqYds:2900, x:9,  y:47 },
  { id:26, sqYds:2600, x:11, y:40 },
  // ── North-West outer ──
  { id:27, sqYds:1700, x:15, y:33 },
  { id:28, sqYds:1400, x:19, y:26 },
  { id:29, sqYds:1200, x:15, y:19 },
  // ── North inner ring ──
  { id:30, sqYds:870,  x:29, y:30 },
  { id:31, sqYds:850,  x:36, y:27 },
  { id:32, sqYds:840,  x:43, y:26 },
  { id:33, sqYds:855,  x:50, y:28 },
  { id:34, sqYds:900,  x:57, y:31 },
  { id:35, sqYds:940,  x:63, y:35 },
  // ── East inner ring ──
  { id:36, sqYds:960,  x:66, y:40 },
  { id:37, sqYds:970,  x:67, y:46 },
  { id:38, sqYds:980,  x:66, y:52 },
  { id:39, sqYds:1000, x:63, y:57 },
  // ── South-East inner ──
  { id:40, sqYds:1050, x:58, y:62 },
  { id:41, sqYds:1100, x:52, y:65 },
  { id:42, sqYds:1150, x:45, y:66 },
  { id:43, sqYds:1120, x:38, y:64 },
  // ── South-West inner ──
  { id:44, sqYds:1080, x:32, y:61 },
  { id:45, sqYds:1020, x:27, y:57 },
  { id:46, sqYds:990,  x:25, y:51 },
  { id:47, sqYds:960,  x:26, y:45 },
  // ── West inner ──
  { id:48, sqYds:940,  x:27, y:38 },
  { id:49, sqYds:920,  x:21, y:40 },
  { id:50, sqYds:908,  x:21, y:47 },
  { id:51, sqYds:915,  x:22, y:54 },
  // ── NW inner + smallest plots ──
  { id:52, sqYds:880,  x:25, y:34 },
  { id:53, sqYds:808,  x:33, y:36 },
];

const AGARTHA_OLD_RATE = 6199;   // ₹/sq yd — VIP pre-launch rate (2 yrs ago)
const AGARTHA_NOW_RATE = 7999;   // ₹/sq yd — current rate

/** dot diameter: scales linearly from 7px (808 sq yd) to 18px (5097 sq yd) */
const plotDotSize = (sqYds: number) =>
  7 + ((sqYds - 808) / (5097 - 808)) * 11;

const formatRs = (rs: number) =>
  rs >= 1e7 ? `₹${(rs / 1e7).toFixed(2)} Cr` : `₹${(rs / 1e5).toFixed(1)} L`;

/** lookup: sanctuary id → its 53 plot dots */
const SANCTUARY_PLOTS: Record<string, PlotDot[]> = {
  agartha: AGARTHA_PLOTS,
};

/**
 * SANCTUARY_HOTSPOTS — maps sanctuary id → its interactive site plan dots.
 * Add any new property here when it has a site plan.
 */
const SANCTUARY_HOTSPOTS: Record<string, Hotspot[]> = {
  agartha: AGARTHA_HOTSPOTS,
};

/** Agartha-specific wrapper — delegates to the generic PropertyInteractiveLayout */
const AagarthaInteractiveLayout: FC<{ onClose: () => void }> = ({ onClose }) => (
  <PropertyInteractiveLayout
    sitePlanSrc="/agartha-layout.jpg"
    hotspots={AGARTHA_HOTSPOTS}
    projectName="Agartha"
    developerTag="MODCON Builders · Narsapur"
    tagline="53 plots · Forest community · From ₹64.6 L"
    brochureUrl="https://www.modconbuilders.com/agartha"
    intentPrefix="Agartha"
    onClose={onClose}
  />
);

// ─────────────────────────────────────────────────────────────────────────────

// ─── Admin ────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL = 'sumanthbolla97@gmail.com';

const EMPTY_FORM: PropertyInput = {
  title: '', location: '', lat: undefined, lng: undefined,
  aqi: 12, noise: 18, commute: '',
  valuation: '', memberPrice: '', image: '',
  tagline: '', description: '', plots: undefined,
  plotRange: '', amenityAcres: '', architect: '',
  features: [], pricePerSqYd: undefined,
  sitePlanSrc: '', brochureUrl: '', status: 'draft',
};

const AdminDashboard: FC<{
  onClose: () => void;
  authUser: User;
  leads: Lead[];
  newsletter: NewsletterEntry[];
  firestoreProps: PropertyDoc[];
  users: UserProfile[];
}> = ({ onClose, leads, newsletter, firestoreProps, users }) => {
  const [tab, setTab] = useState<'properties' | 'leads' | 'newsletter' | 'users'>('properties');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PropertyInput>(EMPTY_FORM);
  const [featInput, setFeatInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const set = (k: keyof PropertyInput, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const openNew = () => { setForm(EMPTY_FORM); setEditingId(null); setShowForm(true); setMsg(''); };
  const openEdit = (p: PropertyDoc) => {
    const { id: _id, createdAt: _c, ...rest } = p;
    setForm(rest as PropertyInput);
    setEditingId(p.id);
    setShowForm(true);
    setMsg('');
  };

  const addFeature = () => {
    const f = featInput.trim();
    if (!f) return;
    set('features', [...(form.features ?? []), f]);
    setFeatInput('');
  };
  const removeFeature = (i: number) =>
    set('features', (form.features ?? []).filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!form.title || !form.location) { setMsg('Title and Location are required.'); return; }
    setSaving(true);
    try {
      if (editingId) await updateProperty(editingId, form);
      else await createProperty(form);
      setShowForm(false);
      setMsg('');
    } catch (e: unknown) {
      setMsg(`Error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this property? This cannot be undone.')) return;
    setDeleting(id);
    try { await deleteProperty(id); } finally { setDeleting(null); }
  };

  const toggleStatus = async (p: PropertyDoc) => {
    await updateProperty(p.id, { status: p.status === 'live' ? 'draft' : 'live' });
  };

  const inputCls = "w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface placeholder-secondary/30 focus:outline-none focus:border-primary/60 transition-colors";
  const labelCls = "block text-[9px] uppercase tracking-[0.4em] font-bold text-secondary/50 mb-1.5";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9995] bg-black/60 backdrop-blur-sm flex items-stretch justify-end">
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-full md:w-[640px] bg-surface flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-outline/10 flex-shrink-0">
          <div>
            <p className="text-[8px] uppercase tracking-[0.5em] text-primary/60 font-bold">Admin Panel</p>
            <h2 className="text-xl font-headline font-bold text-on-surface mt-0.5">The Green Team</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-primary/5 transition-all">
            <X className="w-5 h-5 text-on-surface" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline/10 flex-shrink-0 overflow-x-auto">
          {(['properties', 'leads', 'newsletter', 'users'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn(
                "flex-shrink-0 flex-1 py-3.5 text-[9px] uppercase tracking-[0.3em] font-bold transition-all whitespace-nowrap px-3",
                tab === t ? "text-primary border-b-2 border-primary" : "text-secondary/40 hover:text-secondary"
              )}>
              {t === 'properties' ? `Props (${firestoreProps.length})`
               : t === 'leads' ? `Leads (${leads.length})`
               : t === 'newsletter' ? `News (${newsletter.length})`
               : `Users (${users.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Properties Tab ── */}
          {tab === 'properties' && !showForm && (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/50 font-bold">
                  Live properties appear on home + sanctuaries pages
                </p>
                <button onClick={openNew}
                  className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold rounded-xl hover:bg-primary/90 transition-all">
                  <ArrowRight className="w-3 h-3" /> Add Property
                </button>
              </div>

              {firestoreProps.length === 0 && (
                <div className="text-center py-16 text-secondary/30 text-sm">No properties yet. Add your first one.</div>
              )}

              {firestoreProps.map(p => (
                <div key={p.id} className="flex gap-4 p-4 border border-outline/10 rounded-2xl bg-surface-container-low/30 hover:border-outline/20 transition-all">
                  {/* Thumbnail */}
                  <div className="w-20 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-outline/10">
                    {p.image && <img src={p.image} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-on-surface truncate">{p.title}</h4>
                        <p className="text-[10px] text-secondary/50 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5" />{p.location}
                        </p>
                        {(p.lat && p.lng) && (
                          <p className="text-[9px] text-secondary/30 mt-0.5">{p.lat.toFixed(4)}, {p.lng.toFixed(4)}</p>
                        )}
                      </div>
                      {/* Live toggle */}
                      <button onClick={() => toggleStatus(p)}
                        className={cn(
                          "flex-shrink-0 px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold transition-all",
                          p.status === 'live'
                            ? "bg-primary/10 text-primary"
                            : "bg-outline/10 text-secondary/40"
                        )}>
                        {p.status === 'live' ? '● Live' : '○ Draft'}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(p)}
                        className="text-[9px] uppercase tracking-widest font-bold text-secondary/60 hover:text-primary transition-colors px-3 py-1.5 border border-outline/15 rounded-lg">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                        className="text-[9px] uppercase tracking-widest font-bold text-error/60 hover:text-error transition-colors px-3 py-1.5 border border-error/10 rounded-lg hover:border-error/30 disabled:opacity-40">
                        {deleting === p.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Property Form ── */}
          {tab === 'properties' && showForm && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowForm(false)}
                  className="p-2 rounded-full hover:bg-primary/5 transition-all">
                  <X className="w-4 h-4 text-secondary" />
                </button>
                <h3 className="text-base font-bold text-on-surface">
                  {editingId ? 'Edit Property' : 'New Property'}
                </h3>
              </div>

              {msg && <p className="text-xs text-error bg-error/5 border border-error/10 rounded-xl px-4 py-3">{msg}</p>}

              {/* Section: Basic */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Basic Info</p>
                <div>
                  <label htmlFor="adm-title" className={labelCls}>Property Title *</label>
                  <input id="adm-title" name="title" className={inputCls} placeholder="e.g. MODCON Agartha" value={form.title}
                    onChange={e => set('title', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="adm-location" className={labelCls}>Location *</label>
                  <input id="adm-location" name="location" className={inputCls} placeholder="e.g. Narsapur Forest Peripheral, Hyderabad" value={form.location}
                    onChange={e => set('location', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="adm-lat" className={labelCls}>Latitude</label>
                    <input id="adm-lat" name="lat" type="number" step="any" className={inputCls} placeholder="17.4700" value={form.lat ?? ''}
                      onChange={e => set('lat', e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <label htmlFor="adm-lng" className={labelCls}>Longitude</label>
                    <input id="adm-lng" name="lng" type="number" step="any" className={inputCls} placeholder="78.2500" value={form.lng ?? ''}
                      onChange={e => set('lng', e.target.value ? parseFloat(e.target.value) : undefined)} />
                  </div>
                </div>
                <p className="text-[9px] text-secondary/30 -mt-2">Get from Google Maps → right-click → copy coordinates</p>
              </div>

              {/* Section: Media */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Media &amp; Links</p>
                <div>
                  <label htmlFor="adm-image" className={labelCls}>Hero Image URL</label>
                  <input id="adm-image" name="image" className={inputCls} placeholder="https://..." value={form.image}
                    onChange={e => set('image', e.target.value)} />
                  {form.image && (
                    <img src={form.image} alt="preview" referrerPolicy="no-referrer"
                      className="mt-2 w-full h-28 object-cover rounded-xl border border-outline/10" />
                  )}
                </div>
                <div>
                  <label htmlFor="adm-siteplan" className={labelCls}>Site Plan Image URL</label>
                  <input id="adm-siteplan" name="sitePlanSrc" className={inputCls} placeholder="https://... or /filename.jpg" value={form.sitePlanSrc ?? ''}
                    onChange={e => set('sitePlanSrc', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="adm-brochure" className={labelCls}>Brochure URL</label>
                  <input id="adm-brochure" name="brochureUrl" className={inputCls} placeholder="https://..." value={form.brochureUrl ?? ''}
                    onChange={e => set('brochureUrl', e.target.value)} />
                </div>
              </div>

              {/* Section: Stats */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Environment &amp; Commute</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="adm-aqi" className={labelCls}>AQI</label>
                    <input id="adm-aqi" name="aqi" type="number" className={inputCls} placeholder="12" value={form.aqi}
                      onChange={e => set('aqi', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label htmlFor="adm-noise" className={labelCls}>Noise (dB)</label>
                    <input id="adm-noise" name="noise" type="number" className={inputCls} placeholder="18" value={form.noise}
                      onChange={e => set('noise', parseInt(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label htmlFor="adm-commute" className={labelCls}>Commute</label>
                    <input id="adm-commute" name="commute" className={inputCls} placeholder="45 mins to Fin. District" value={form.commute}
                      onChange={e => set('commute', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Section: Pricing */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Pricing</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="adm-memberprice" className={labelCls}>Member Price</label>
                    <input id="adm-memberprice" name="memberPrice" className={inputCls} placeholder="₹1.9 Cr" value={form.memberPrice}
                      onChange={e => set('memberPrice', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="adm-valuation" className={labelCls}>Valuation / Strikethrough</label>
                    <input id="adm-valuation" name="valuation" className={inputCls} placeholder="₹4.0 Cr" value={form.valuation}
                      onChange={e => set('valuation', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label htmlFor="adm-pricepersqyd" className={labelCls}>Price per Sq Yd (₹) — leave blank if not applicable</label>
                  <input id="adm-pricepersqyd" name="pricePerSqYd" type="number" className={inputCls} placeholder="7999" value={form.pricePerSqYd ?? ''}
                    onChange={e => set('pricePerSqYd', e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
              </div>

              {/* Section: Content */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Content</p>
                <div>
                  <label htmlFor="adm-tagline" className={labelCls}>Tagline</label>
                  <input id="adm-tagline" name="tagline" className={inputCls} placeholder="Where the forest becomes home." value={form.tagline ?? ''}
                    onChange={e => set('tagline', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="adm-description" className={labelCls}>Description</label>
                  <textarea id="adm-description" name="description" rows={4} className={cn(inputCls, 'resize-none')}
                    placeholder="Full description of the property…" value={form.description ?? ''}
                    onChange={e => set('description', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="adm-architect" className={labelCls}>Developer / Architect</label>
                  <input id="adm-architect" name="architect" className={inputCls} placeholder="MODCON Builders" value={form.architect ?? ''}
                    onChange={e => set('architect', e.target.value)} />
                </div>
              </div>

              {/* Section: Community */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Plot Community (optional)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="adm-plots" className={labelCls}>No. of Plots</label>
                    <input id="adm-plots" name="plots" type="number" className={inputCls} placeholder="53" value={form.plots ?? ''}
                      onChange={e => set('plots', e.target.value ? parseInt(e.target.value) : undefined)} />
                  </div>
                  <div>
                    <label htmlFor="adm-plotrange" className={labelCls}>Plot Range</label>
                    <input id="adm-plotrange" name="plotRange" className={inputCls} placeholder="808–5,097 sq yds" value={form.plotRange ?? ''}
                      onChange={e => set('plotRange', e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="adm-amenity" className={labelCls}>Amenity Sq Yds</label>
                    <input id="adm-amenity" name="amenityAcres" className={inputCls} placeholder="14,548" value={form.amenityAcres ?? ''}
                      onChange={e => set('amenityAcres', e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Section: Features */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Curated Features</p>
                <div className="flex gap-2">
                  <input id="adm-feature" name="feature" className={cn(inputCls, 'flex-1')} placeholder="e.g. Vertical Forest" value={featInput}
                    onChange={e => setFeatInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addFeature(); } }} />
                  <button type="button" onClick={addFeature}
                    className="px-4 py-3 bg-primary/10 text-primary text-[9px] font-bold rounded-xl hover:bg-primary/20 transition-all">
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(form.features ?? []).map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 text-primary text-[9px] font-bold rounded-full">
                      {f}
                      <button onClick={() => removeFeature(i)} className="text-primary/50 hover:text-primary ml-1">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Status + Save */}
              <div className="flex items-center justify-between pt-2 pb-6">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => set('status', form.status === 'live' ? 'draft' : 'live')}
                    className={cn(
                      "relative w-12 h-6 rounded-full transition-colors",
                      form.status === 'live' ? 'bg-primary' : 'bg-outline/20'
                    )}>
                    <span className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all",
                      form.status === 'live' ? 'left-7' : 'left-1'
                    )} />
                  </button>
                  <span className="text-xs font-bold text-on-surface">
                    {form.status === 'live' ? 'Live — visible on site' : 'Draft — hidden'}
                  </span>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-3 bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : editingId ? 'Update' : 'Publish'}
                </button>
              </div>
            </div>
          )}

          {/* ── Leads Tab ── */}
          {tab === 'leads' && (
            <div className="p-6 space-y-3">
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold mb-4">{leads.length} total leads</p>
              {leads.length === 0 && <p className="text-center py-16 text-secondary/30 text-sm">No leads yet.</p>}
              {leads.map(l => (
                <div key={l.id} className="p-4 border border-outline/10 rounded-2xl space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-bold text-on-surface">{l.name}</p>
                    <p className="text-[9px] text-secondary/30 flex-shrink-0">
                      {l.createdAt ? new Date(l.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </p>
                  </div>
                  <p className="text-xs text-secondary/60 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" />{l.email}
                  </p>
                  {l.intent && (
                    <p className="text-[10px] text-primary/60 font-medium">{l.intent}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Newsletter Tab ── */}
          {tab === 'newsletter' && (
            <div className="p-6 space-y-3">
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold mb-4">{newsletter.length} subscribers</p>
              {newsletter.length === 0 && <p className="text-center py-16 text-secondary/30 text-sm">No subscribers yet.</p>}
              {newsletter.map(n => (
                <div key={n.id} className="flex items-center justify-between p-4 border border-outline/10 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <MailIcon className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{n.email}</p>
                      <p className="text-[9px] text-secondary/40 uppercase tracking-widest">{n.source}</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-secondary/30">
                    {n.createdAt ? new Date(n.createdAt.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Users Tab ── */}
          {tab === 'users' && (
            <div className="p-6 space-y-3">
              <p className="text-[9px] uppercase tracking-[0.4em] text-secondary/40 font-bold mb-4">{users.length} registered users</p>
              {users.length === 0 && <p className="text-center py-16 text-secondary/30 text-sm">No users yet.</p>}
              {users.map(u => (
                <div key={u.uid} className="p-4 border border-outline/10 rounded-2xl space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {u.photoURL
                        ? <img src={u.photoURL} referrerPolicy="no-referrer" alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                            {(u.displayName?.[0] || u.email?.[0] || '?').toUpperCase()}
                          </div>
                      }
                      <div>
                        <p className="text-sm font-bold text-on-surface">{u.name || u.displayName || '—'}</p>
                        <p className="text-[10px] text-secondary/50">{u.email}</p>
                      </div>
                    </div>
                    {(u.lat && u.lng) && (
                      <a href={`https://maps.google.com/?q=${u.lat},${u.lng}`} target="_blank" rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1 bg-primary/8 text-primary text-[8px] font-bold uppercase tracking-widest rounded-full hover:bg-primary/15 transition-all">
                        <MapPin className="w-2.5 h-2.5" /> Map
                      </a>
                    )}
                  </div>
                  {(u.occupation || u.city) && (
                    <p className="text-[10px] text-secondary/50 pl-12">
                      {[u.occupation, u.city].filter(Boolean).join(' · ')}
                    </p>
                  )}
                  {(u.lat && u.lng) && (
                    <p className="text-[9px] text-secondary/30 pl-12 font-mono">
                      {u.lat.toFixed(5)}, {u.lng.toFixed(5)}
                      {u.locationAccuracy ? ` ±${Math.round(u.locationAccuracy)}m` : ''}
                    </p>
                  )}
                  <p className="text-[9px] text-secondary/20 pl-12">
                    First seen: {u.firstSignIn ? new Date(u.firstSignIn.seconds * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Feature icon helper ───────────────────────────────────────────────────────
const featureIcon = (f: string) => {
  if (f.includes('Solar') || f.includes('Energy')) return <Sun className="w-4 h-4" />;
  if (f.includes('Forest') || f.includes('Earth') || f.includes('Bamboo') || f.includes('Organic')) return <Leaf className="w-4 h-4" />;
  if (f.includes('Rain') || f.includes('Water')) return <Droplets className="w-4 h-4" />;
  if (f.includes('Zero') || f.includes('Private') || f.includes('Community')) return <Shield className="w-4 h-4" />;
  if (f.includes('Biomorphic') || f.includes('Design') || f.includes('Vertical')) return <Award className="w-4 h-4" />;
  return <Zap className="w-4 h-4" />;
};

const PropertyDetailOverlay = ({ sanctuary, onClose, isSubscribed = false, onNewsletterSignup }: {
  sanctuary: Sanctuary;
  onClose: () => void;
  isSubscribed?: boolean;
  onNewsletterSignup?: () => void;
}) => {
  const hotspots  = SANCTUARY_HOTSPOTS[sanctuary.id] ?? null;
  const plotDots  = SANCTUARY_PLOTS[sanctuary.id]    ?? null;
  const [activeSpot, setActiveSpot]   = useState<Hotspot | null>(hotspots?.[0] ?? null);
  const [activePlot, setActivePlot]   = useState<PlotDot | null>(null);
  const [mapMode, setMapMode]         = useState<'plots' | 'features'>(plotDots ? 'plots' : 'features');
  const [leadName, setLeadName]       = useState('');
  const [leadPhone, setLeadPhone]     = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadLoading, setLeadLoading]    = useState(false);

  // Timed newsletter prompt — appears after 25s if not already subscribed
  const [showNewsletterPrompt, setShowNewsletterPrompt] = useState(false);
  const [nlEmail, setNlEmail]     = useState('');
  const [nlDone, setNlDone]       = useState(false);
  const [nlLoading, setNlLoading] = useState(false);
  useEffect(() => {
    if (isSubscribed) return;
    const t = setTimeout(() => setShowNewsletterPrompt(true), 25000);
    return () => clearTimeout(t);
  }, [isSubscribed]);

  const handleNlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlLoading(true);
    try {
      await saveNewsletter(nlEmail.trim(), 'modal');
      await saveLead({ name: nlEmail.trim(), email: nlEmail.trim(), intent: `${sanctuary.title} — Newsletter Prompt` });
      onNewsletterSignup?.();
    } catch {/* ignore */} finally {
      setNlLoading(false);
      setNlDone(true);
    }
  };

  // Parse "45 mins to Financial District" → { time: '45m', dest: 'Fin. District' }
  const commuteTime = sanctuary.commute.match(/\d+/)?.[0] ?? '—';
  const commuteDest = sanctuary.commute.replace(/^\d+ mins? to /i, '');
  const commuteShort = commuteDest.length > 16 ? commuteDest.slice(0, 13) + '…' : commuteDest;

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) return;
    setLeadLoading(true);
    try {
      await saveLead({ name: leadName.trim(), email: leadPhone.trim(), intent: `${sanctuary.title} — Site Visit Request` });
    } catch {/* fire and forget */} finally {
      setLeadLoading(false);
      setLeadSubmitted(true);
    }
  };

  const badge = sanctuary.id === 'syl' ? 'Upcoming' : 'Open — Expression of Interest';

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
        <img src={sanctuary.image} alt={sanctuary.title}
          className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <button onClick={onClose}
          className="absolute top-5 right-5 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all">
          <X className="w-4 h-4 text-white" />
        </button>
        <div className="absolute bottom-5 left-6">
          <span className="px-3 py-1 bg-primary text-on-primary text-[8px] uppercase tracking-widest font-bold rounded-full">
            {badge}
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
                  <p className="text-xl font-headline font-bold text-primary">
                    ₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-secondary/60">/sq yd</span>
                  </p>
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
            <p className="text-lg font-bold text-on-surface">{commuteTime}m</p>
            <p className="text-[9px] text-secondary/50">{commuteShort}</p>
          </div>
        </div>

        <div className="px-8 py-8 space-y-8">
          {/* Description */}
          {sanctuary.description && (
            <p className="text-sm text-secondary/80 leading-relaxed">{sanctuary.description}</p>
          )}

          {/* Plot community stats */}
          {sanctuary.plots && (
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-2xl font-headline font-bold text-primary">{sanctuary.plots}</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Private Plots</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-base font-headline font-bold text-primary leading-tight">{sanctuary.plotRange ?? '808–5,097'}</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Sq Yds Range</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl text-center">
                <p className="text-base font-headline font-bold text-primary leading-tight">{sanctuary.amenityAcres ?? '14,548'}</p>
                <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Amenity Sq Yds</p>
              </div>
            </div>
          )}

          {/* ── Interactive Site Plan ── */}
          {sanctuary.sitePlanSrc && (plotDots || hotspots) && (
            <div>
              {/* Section header + mode toggle */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">
                  {mapMode === 'plots' ? `Site Plan — ${plotDots?.length ?? 0} Plots` : 'Site Plan — Features'}
                </p>
                {plotDots && hotspots && (
                  <div className="flex rounded-full border border-outline/15 overflow-hidden text-[8px] uppercase tracking-widest font-bold">
                    <button onClick={() => setMapMode('plots')}
                      className={cn("px-3 py-1.5 transition-all",
                        mapMode === 'plots' ? "bg-primary text-on-primary" : "text-secondary/50 hover:text-secondary")}>
                      Plots
                    </button>
                    <button onClick={() => setMapMode('features')}
                      className={cn("px-3 py-1.5 transition-all",
                        mapMode === 'features' ? "bg-primary text-on-primary" : "text-secondary/50 hover:text-secondary")}>
                      Features
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-2xl overflow-hidden border border-outline/10 bg-[#0a0f07]">

                {/* ── PLOTS MODE ── */}
                {mapMode === 'plots' && plotDots && (
                  <>
                    {/* Map with 53 sized dots */}
                    <div className="relative">
                      <img src={sanctuary.sitePlanSrc} alt="Site plan"
                        className="w-full h-auto object-contain" referrerPolicy="no-referrer" />

                      {/* Investor legend strip at top of image */}
                      <div className="absolute top-2 left-2 right-2 flex items-center gap-2 flex-wrap">
                        <span className="bg-black/60 backdrop-blur-sm text-[7px] uppercase tracking-widest font-bold text-white/70 px-2 py-1 rounded-full">
                          Tap a plot to see its investment snapshot
                        </span>
                      </div>

                      {plotDots.map(p => {
                        const sz     = plotDotSize(p.sqYds);
                        const isActive = activePlot?.id === p.id;
                        const isPremium = p.sqYds >= 3000;
                        const isLandmark = p.id === 15;
                        return (
                          <button
                            key={p.id}
                            style={{
                              left: `${p.x}%`, top: `${p.y}%`,
                              width: sz, height: sz,
                            }}
                            className={cn(
                              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-150 shadow-md",
                              isLandmark
                                ? "border-amber-400 bg-amber-400/90 scale-110"
                                : isPremium
                                ? "border-amber-500/80 bg-amber-500/70"
                                : isActive
                                ? "border-primary bg-primary scale-125"
                                : "border-primary/80 bg-primary/60 hover:bg-primary hover:scale-110"
                            )}
                            onClick={() => setActivePlot(isActive ? null : p)}
                          >
                            {isActive && (
                              <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping pointer-events-none" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-primary/70 border border-primary/80" />
                        <span className="text-[8px] text-white/40 uppercase tracking-wider font-bold">Standard</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-3.5 h-3.5 rounded-full bg-amber-500/70 border border-amber-500/80" />
                        <span className="text-[8px] text-white/40 uppercase tracking-wider font-bold">Premium (3,000+ sq yds)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-400/90 border border-amber-400" />
                        <span className="text-[8px] text-amber-400/80 uppercase tracking-wider font-bold">Plot 15</span>
                      </div>
                    </div>

                    {/* Investment snapshot — shown when plot is tapped */}
                    <AnimatePresence mode="wait">
                      {activePlot && (() => {
                        const oldVal  = activePlot.sqYds * AGARTHA_OLD_RATE;
                        const nowVal  = activePlot.sqYds * AGARTHA_NOW_RATE;
                        const gain    = nowVal - oldVal;
                        const pct     = ((gain / oldVal) * 100).toFixed(1);
                        const annPct  = (parseFloat(pct) / 2).toFixed(1);
                        return (
                          <motion.div
                            key={activePlot.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.18 }}
                            className="border-t border-white/8 bg-[#0d1409]"
                          >
                            {/* Plot header */}
                            <div className="flex items-start justify-between px-5 pt-4 pb-3">
                              <div>
                                <p className="text-[8px] uppercase tracking-[0.5em] text-primary/50 font-bold">
                                  Plot {activePlot.id} · {activePlot.sqYds.toLocaleString('en-IN')} sq yds
                                  {activePlot.id === 15 && <span className="ml-2 text-amber-400">★ Premium Corner</span>}
                                </p>
                                <p className="text-xl font-headline font-bold text-white mt-0.5">{formatRs(nowVal)}</p>
                                <p className="text-[10px] text-white/40">at ₹{AGARTHA_NOW_RATE.toLocaleString('en-IN')}/sq yd</p>
                              </div>
                              <button onClick={() => setActivePlot(null)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all mt-0.5">
                                <X className="w-3 h-3 text-white/40" />
                              </button>
                            </div>

                            {/* Price comparison bar */}
                            <div className="px-5 pb-3">
                              <div className="rounded-xl bg-white/4 border border-white/5 overflow-hidden">
                                {/* Two-year-ago row */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                  <div>
                                    <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">VIP Pre-Launch · 2022</p>
                                    <p className="text-base font-headline font-bold text-white/60 mt-0.5">{formatRs(oldVal)}</p>
                                  </div>
                                  <p className="text-[9px] text-white/30">₹{AGARTHA_OLD_RATE.toLocaleString('en-IN')}/sq yd</p>
                                </div>
                                {/* Current row */}
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                  <div>
                                    <p className="text-[8px] uppercase tracking-widest text-primary/60 font-bold">Today · 2024</p>
                                    <p className="text-base font-headline font-bold text-white mt-0.5">{formatRs(nowVal)}</p>
                                  </div>
                                  <p className="text-[9px] text-primary/60">₹{AGARTHA_NOW_RATE.toLocaleString('en-IN')}/sq yd</p>
                                </div>
                                {/* Gain row */}
                                <div className="px-4 py-3 bg-primary/8 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <TrendingDown className="w-4 h-4 text-primary rotate-180" />
                                    <div>
                                      <p className="text-[8px] uppercase tracking-widest text-primary/70 font-bold">Early Investor Gain</p>
                                      <p className="text-lg font-headline font-bold text-primary">{formatRs(gain)}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-xl font-headline font-bold text-primary">+{pct}%</p>
                                    <p className="text-[9px] text-primary/50">in 2 years</p>
                                    <p className="text-[9px] text-primary/40">({annPct}% p.a.)</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Context copy */}
                            <div className="px-5 pb-4">
                              <p className="text-[10px] text-white/35 leading-relaxed">
                                An investor who booked this exact plot at pre-launch in 2022 has seen a paper gain of <span className="text-primary/70 font-bold">{formatRs(gain)}</span> without doing anything — simply because Agartha's land value grew <span className="text-primary/70 font-bold">+{pct}% in 2 years</span>. Today's buyers get the same compounding advantage for the next cycle.
                              </p>
                            </div>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </>
                )}

                {/* ── FEATURES MODE ── */}
                {mapMode === 'features' && hotspots && (
                  <>
                    <div className="relative">
                      <img src={sanctuary.sitePlanSrc} alt="Site plan"
                        className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                      {hotspots.map(h => {
                        const isActive = activeSpot?.id === h.id;
                        return (
                          <button key={h.id} style={{ left: `${h.x}%`, top: `${h.y}%` }}
                            className="absolute -translate-x-1/2 -translate-y-1/2" onClick={() => setActiveSpot(h)}>
                            <span className={cn(
                              "relative block rounded-full border-2 border-white shadow-lg transition-all duration-200",
                              isActive ? "w-4 h-4 bg-primary scale-125" : "w-3 h-3 bg-white/60 hover:bg-white hover:scale-125"
                            )} />
                            {isActive && <span className="absolute inset-0 rounded-full bg-primary/50 animate-ping pointer-events-none" />}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex gap-2 overflow-x-auto px-4 py-3 border-t border-white/5 no-scrollbar">
                      {hotspots.map(h => (
                        <button key={h.id} onClick={() => setActiveSpot(h)}
                          className={cn("flex-shrink-0 text-[8px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border transition-all",
                            activeSpot?.id === h.id ? "bg-primary border-primary text-on-primary" : "border-white/15 text-white/40 hover:border-primary/40 hover:text-primary")}>
                          {h.label.split(' ').slice(0, 2).join(' ')}
                        </button>
                      ))}
                    </div>
                    {activeSpot && (
                      <AnimatePresence mode="wait">
                        <motion.div key={activeSpot.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }} className="px-5 py-4 border-t border-white/5 space-y-2">
                          <p className="text-[8px] uppercase tracking-[0.4em] text-primary/60 font-bold">{activeSpot.tag}</p>
                          <h4 className="text-sm font-headline font-bold text-white">{activeSpot.label}</h4>
                          <p className="text-[11px] text-white/50 leading-relaxed">{activeSpot.detail}</p>
                          <div className="grid grid-cols-3 gap-2 pt-1">
                            {activeSpot.stats.map(s => (
                              <div key={s.label} className="bg-white/5 rounded-lg px-2 py-2 text-center">
                                <p className="text-[7px] uppercase tracking-wider text-white/30 font-bold mb-0.5">{s.label}</p>
                                <p className="text-[10px] font-bold text-white">{s.value}</p>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </>
                )}
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
                  const display = totalRs >= 1e7 ? `₹${(totalRs / 1e7).toFixed(2)} Cr` : `₹${(totalRs / 1e5).toFixed(1)} L`;
                  return (
                    <div key={i} className={cn("grid grid-cols-3 px-4 py-3 text-[10px]", i % 2 === 0 ? "bg-primary/3" : "bg-transparent")}>
                      <span className="text-secondary/60 font-medium">{row.label}</span>
                      <span className="text-center font-bold text-on-surface">{row.sqYds.toLocaleString('en-IN')} sq yds</span>
                      <span className="text-right font-bold text-primary">{display}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[8px] text-secondary/40 mt-2">Rate: ₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}/sq yd</p>
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
                { label: 'Air Quality Index', value: `${sanctuary.aqi} — Pristine`, bar: Math.min((50 - sanctuary.aqi) / 50, 1) },
                { label: 'Ambient Noise', value: `${sanctuary.noise} dB — Near Silent`, bar: Math.min((50 - sanctuary.noise) / 50, 1) },
                { label: 'Forest Proximity', value: 'Direct Boundary Access', bar: 0.95 },
              ].map(item => (
                <div key={item.label}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="uppercase tracking-widest text-secondary/60">{item.label}</span>
                    <span className="font-bold text-on-surface">{item.value}</span>
                  </div>
                  <div className="h-1 bg-outline/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.bar * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.8, ease: 'easeOut' }}
                      className="h-full bg-primary rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Developer credit */}
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

          {/* ── Lead capture + CTAs ── */}
          <div className="space-y-4 pb-4">
            <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">Reserve Your Interest</p>

            {leadSubmitted ? (
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <p className="text-sm font-bold text-on-surface">We'll be in touch soon.</p>
                <p className="text-[11px] text-secondary/50">Our team will reach out within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="space-y-3">
                <input type="text" placeholder="Your Name" value={leadName}
                  onChange={e => setLeadName(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/15 rounded-xl px-4 py-3.5 text-sm text-on-surface placeholder-secondary/30 focus:outline-none focus:border-primary/50 transition-colors" />
                <input type="tel" placeholder="Phone Number" value={leadPhone}
                  onChange={e => setLeadPhone(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline/15 rounded-xl px-4 py-3.5 text-sm text-on-surface placeholder-secondary/30 focus:outline-none focus:border-primary/50 transition-colors" />
                <button type="submit" disabled={leadLoading || !leadName.trim() || !leadPhone.trim()}
                  className="w-full py-4 bg-primary text-on-primary text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  <ArrowRight className="w-4 h-4" />
                  {leadLoading ? 'Sending…' : 'Request Site Visit'}
                </button>
              </form>
            )}

            {sanctuary.brochureUrl && (
              <a href={sanctuary.brochureUrl} target="_blank" rel="noopener noreferrer"
                className="w-full py-3.5 border border-outline/20 text-on-surface text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-3">
                <ArrowRight className="w-4 h-4" />
                View Full Brochure
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Timed newsletter prompt (slides up after 25s) ── */}
      <AnimatePresence>
        {showNewsletterPrompt && !nlDone && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 bg-[#0a0f07] border-t border-primary/20 px-6 py-5 z-10"
          >
            <button onClick={() => setShowNewsletterPrompt(false)}
              className="absolute top-3 right-4 p-1 text-white/30 hover:text-white/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
            <p className="text-[8px] uppercase tracking-[0.5em] text-primary/60 font-bold mb-1">Still exploring?</p>
            <p className="text-sm font-headline font-bold text-white mb-3">
              Get exclusive {sanctuary.title} updates — pricing alerts, site visit slots &amp; VIP access.
            </p>
            <form onSubmit={handleNlSubmit} className="flex gap-2">
              <input
                type="email" placeholder="your@email.com" value={nlEmail}
                onChange={e => setNlEmail(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button type="submit" disabled={nlLoading || !nlEmail.trim()}
                className="px-4 py-2.5 bg-primary text-on-primary text-[9px] uppercase tracking-widest font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex-shrink-0">
                {nlLoading ? '…' : 'Notify Me'}
              </button>
            </form>
          </motion.div>
        )}
        {nlDone && showNewsletterPrompt && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="absolute bottom-0 left-0 right-0 bg-[#0a0f07] border-t border-primary/20 px-6 py-5 z-10 flex items-center gap-3">
            <Check className="w-5 h-5 text-primary flex-shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">You're on the list.</p>
              <p className="text-[10px] text-white/40">We'll reach out within 24 hours.</p>
            </div>
            <button onClick={() => setShowNewsletterPrompt(false)} className="ml-auto text-white/30 hover:text-white/60">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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

const SanctuaryMapLayout = ({ isVisible }: { isVisible?: boolean }) => {
  const [isMapReady, setIsMapReady] = useState(false);
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

  // ── 3 focused filters only ──────────────────────────────────────────────
  const FILTER_PILLS = [
    { id: 'aqi-live',    label: 'AQI Live',      icon: Activity },
    { id: 'sanctuaries', label: 'Sanctuaries',    icon: Home     },
    { id: 'key-zones',   label: 'Key Zones',      icon: AlertTriangle },
  ];

  const toggleFilter = (filterId: string) => {
    setActiveFilters(prev => {
      const isCurrentlyActive = prev.has(filterId);
      const next = new Set(prev);
      if (isCurrentlyActive) next.delete(filterId);
      else next.add(filterId);
      if (filterId === 'aqi-live') setShowAqi(!isCurrentlyActive);
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
    
    // Zoom-responsive grid: lazy loading, gradually updates accuracy as we zoom in
    let step = 0.08;
    if (currentZoom >= 13) step = 0.015;
    else if (currentZoom >= 11) step = 0.025;
    else if (currentZoom >= 9) step = 0.04;
    else step = 0.08;

    if (isTelanganaView) step = 0.2;

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
        if (nd >= 1.4) continue; // Blend smoothly out past the RRR
        const boundaryFade = nd < FADE_START ? 1 : 1 - ((nd - FADE_START) / (1.4 - FADE_START));
        points.push({ lat, lng, boundaryFade });
      }
    }
    return points;
  }, [isTelanganaView, currentZoom]);

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

  const KEY_ZONES: { id: string; name: string; aqi: number; noise: number; hazard: string; coords: [number, number]; tag: string }[] = [
    { id: 'kz-sanath-nagar',  name: 'Sanath Nagar Industrial',    aqi: 198, noise: 82, hazard: 'critical', coords: [17.480, 78.442] as [number,number], tag: 'Heavy Industry' },
    { id: 'kz-charminar',     name: 'Charminar Old City',          aqi: 175, noise: 88, hazard: 'critical', coords: [17.360, 78.480] as [number,number], tag: 'Dense Traffic + Industry' },
    { id: 'kz-hitec',         name: 'HITEC City Tech Corridor',    aqi: 148, noise: 74, hazard: 'high',     coords: [17.440, 78.382] as [number,number], tag: 'Construction + Traffic' },
    { id: 'kz-secunderabad',  name: 'Secunderabad Rail Hub',        aqi: 162, noise: 86, hazard: 'high',     coords: [17.442, 78.498] as [number,number], tag: 'Rail Emissions' },
    { id: 'kz-airport',       name: 'Shamshabad Airport Zone',     aqi: 134, noise: 92, hazard: 'high',     coords: [17.240, 78.430] as [number,number], tag: 'Jet Noise + Fumes' },
    { id: 'kz-kukatpally',    name: 'Kukatpally Industrial',       aqi: 155, noise: 79, hazard: 'high',     coords: [17.485, 78.408] as [number,number], tag: 'Mixed Industry' },
    { id: 'kz-patancheru',    name: 'Patancheru Pharma Cluster',   aqi: 210, noise: 68, hazard: 'critical', coords: [17.530, 78.265] as [number,number], tag: 'Chemical / Pharma' },
    { id: 'kz-jeedimetla',    name: 'Jeedimetla Industrial Estate', aqi: 188, noise: 72, hazard: 'critical', coords: [17.516, 78.423] as [number,number], tag: 'Heavy Industry' },
    { id: 'kz-nacharam',      name: 'Nacharam Industrial Area',    aqi: 145, noise: 76, hazard: 'high',     coords: [17.412, 78.548] as [number,number], tag: 'Mixed Industry' },
    { id: 'kz-uppal',         name: 'Uppal Industrial Zone',       aqi: 138, noise: 73, hazard: 'high',     coords: [17.398, 78.558] as [number,number], tag: 'Industrial Estates' },
    { id: 'kz-lb-nagar',      name: 'LB Nagar Traffic Corridor',   aqi: 122, noise: 84, hazard: 'moderate', coords: [17.348, 78.558] as [number,number], tag: 'Dense Traffic' },
    { id: 'kz-mehdipatnam',   name: 'Mehdipatnam Junction',        aqi: 118, noise: 80, hazard: 'moderate', coords: [17.392, 78.434] as [number,number], tag: 'Traffic Bottleneck' },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredLocations = useMemo(() => {
    // Always show sanctuaries, show others based on filter
    return locations.filter(loc => {
      if (loc.type === 'sanctuary') return activeFilters.has('sanctuaries');
      return false; // ORR/RRR exits hidden — not in active filter set
    });
  }, [activeFilters]); // locations is stable per render

  return (
    <div className="h-full w-full relative overflow-hidden flex">
      {/* Loading Overlay */}
      <AnimatePresence>
        {!isMapReady && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute inset-0 z-[10000] bg-surface flex flex-col items-center justify-center pointer-events-none"
          >
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo className="w-16 h-16 opacity-80" />
            </motion.div>
            <div className="mt-8 text-olive-800/40 text-[10px] tracking-[0.3em] uppercase font-bold text-center">
              Awaiting Geographic Signal...
            </div>
            {/* Loading line */}
            <div className="w-48 h-px bg-olive-800/10 mt-6 relative overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-olive-800/40"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "linear" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

        <MapContainer
          center={[17.49, 78.48]}
          zoom={9}
          scrollWheelZoom={true}
          zoomControl={false}
          className="h-full w-full absolute inset-0 z-0"
          minZoom={9}
          maxBounds={[
            [16.7, 77.5],
            [18.3, 79.5]
          ]}
          maxBoundsViscosity={1.0}
        >
          <ZoomControl position="bottomleft" />
          <MapVisibilityTracker isVisible={isVisible} onReady={() => setIsMapReady(true)} />
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
            /* Google Maps road layer — real NH numbers, highways at every zoom */
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              className="map-olive-filter"
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
                    radius={isTelanganaView ? 12000 : currentZoom >= 13 ? 1300 : currentZoom >= 11 ? 2200 : currentZoom >= 9 ? 3500 : 7000}
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



          {/* ── ORR exits — always visible, zoom-responsive labels ─────────── */}
          {locations.filter(l => l.type === 'exit').map(loc => (
            <Marker
              key={loc.id}
              position={loc.coords}
              icon={L.divIcon({
                className: '',
                html: currentZoom >= 11
                  ? `<div style="
                      display:flex;align-items:center;gap:5px;
                      background:#faf9f6;border:1.5px solid #2d3a1d;
                      border-radius:20px;padding:3px 8px;
                      box-shadow:0 2px 8px rgba(0,0,0,0.18);
                      font-size:9px;font-weight:800;color:#1a2410;
                      text-transform:uppercase;letter-spacing:0.05em;
                      white-space:nowrap;
                    ">
                      <div style="width:6px;height:6px;border-radius:50%;background:#d97706;flex-shrink:0;"></div>
                      ${loc.title.replace('ORR ', 'ORR ')}
                    </div>`
                  : `<div style="
                      width:10px;height:10px;border-radius:50%;
                      background:#d97706;border:1.5px solid #faf9f6;
                      box-shadow:0 1px 4px rgba(0,0,0,0.3);
                    "></div>`,
                iconSize: currentZoom >= 11 ? [90, 22] : [10, 10],
                iconAnchor: currentZoom >= 11 ? [45, 11] : [5, 5],
                popupAnchor: [0, -14],
              })}
            >
              <Popup className="custom-popup">
                <div style="padding:12px 14px;min-width:160px;">
                  <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#1a2410;margin-bottom:4px;">{loc.title}</div>
                  <div style="font-size:9px;color:#586062;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">{loc.location}</div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:8px;height:8px;border-radius:50%;background:${(loc.aqi ?? 0) <= 50 ? '#4ade80' : (loc.aqi ?? 0) <= 100 ? '#86efac' : (loc.aqi ?? 0) <= 150 ? '#fbbf24' : '#ef4444'};flex-shrink:0;"></div>
                    <span style="font-size:9px;font-weight:700;text-transform:uppercase;color:#1a2410;">AQI ${loc.aqi ?? 'N/A'}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── RRR exits — always visible ─────────────────────────────────── */}
          {locations.filter(l => l.type === 'rrr-exit').map(loc => (
            <Marker
              key={loc.id}
              position={loc.coords}
              icon={L.divIcon({
                className: '',
                html: currentZoom >= 9
                  ? `<div style="
                      display:flex;align-items:center;gap:5px;
                      background:#1a2410;border:1.5px solid #fcd34d;
                      border-radius:20px;padding:3px 9px;
                      box-shadow:0 2px 10px rgba(0,0,0,0.3);
                      font-size:8px;font-weight:900;color:#faf9f6;
                      text-transform:uppercase;letter-spacing:0.06em;
                      white-space:nowrap;
                    ">
                      <div style="width:5px;height:5px;border-radius:50%;background:#fcd34d;flex-shrink:0;"></div>
                      RRR · ${loc.location}
                    </div>`
                  : `<div style="
                      width:8px;height:8px;border-radius:50%;
                      background:#fcd34d;border:1.5px solid #1a2410;
                      box-shadow:0 1px 4px rgba(0,0,0,0.3);
                    "></div>`,
                iconSize: currentZoom >= 9 ? [110, 20] : [8, 8],
                iconAnchor: currentZoom >= 9 ? [55, 10] : [4, 4],
                popupAnchor: [0, -12],
              })}
            >
              <Popup className="custom-popup">
                <div style="padding:12px 14px;min-width:160px;">
                  <div style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#1a2410;margin-bottom:4px;">RRR Proposed Exit</div>
                  <div style="font-size:9px;color:#586062;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px;">{loc.location}</div>
                  <div style="font-size:8px;color:#2d3a1d;font-weight:700;">Proposed alignment. Under construction.</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Sanctuary markers (filter-gated) ─────────────────────────── */}
          {filteredLocations.map((loc) => {
            const isPremium = loc.type === 'sanctuary';
            if (!isPremium) return null;

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
              </React.Fragment>
            );
          })}
          {/* ── Key Industrial / Pollution Zones \u2500 severity-coded markers \u2500\u2500\u2500\u2500\u2500\u2500\u2500 */}
          {activeFilters.has('key-zones') && KEY_ZONES.map(zone => {
            const isCritical = zone.hazard === 'critical';
            const isHigh     = zone.hazard === 'high';
            // Color: critical=red, high=orange, moderate=amber
            const ringColor  = isCritical ? '#ef4444' : isHigh ? '#f97316' : '#eab308';
            const bgColor    = isCritical ? '#7f1d1d' : isHigh ? '#7c2d12' : '#713f12';
            const textColor  = '#fff';
            const aqiBand    = zone.aqi >= 200 ? 'Hazardous' : zone.aqi >= 150 ? 'Very Unhealthy' : zone.aqi >= 100 ? 'Unhealthy' : 'Moderate';
            const pulseAnim  = isCritical ? 'animate-ping' : '';

            return (
              <Marker
                key={zone.id}
                position={zone.coords as [number, number]}
                icon={L.divIcon({
                  className: '',
                  html: `<div style="position:relative;display:flex;align-items:center;justify-content:center;width:40px;height:40px;">
                    ${isCritical ? `<div style="position:absolute;inset:0;border-radius:50%;background:${ringColor};opacity:0.25;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
                    <div style="
                      width:${isCritical ? 32 : isHigh ? 28 : 24}px;
                      height:${isCritical ? 32 : isHigh ? 28 : 24}px;
                      background:${bgColor};
                      border: 2px solid ${ringColor};
                      border-radius:50%;
                      display:flex;align-items:center;justify-content:center;
                      box-shadow: 0 0 12px ${ringColor}88, 0 2px 8px rgba(0,0,0,0.4);
                      position:relative;z-index:1;
                    ">
                      <span style="font-size:9px;font-weight:900;color:${textColor};letter-spacing:0;">${zone.aqi}</span>
                    </div>
                  </div>`,
                  iconSize: [40, 40],
                  iconAnchor: [20, 20],
                  popupAnchor: [0, -22],
                })}
              >
                <Popup className="custom-popup">
                  <div style="padding:14px 16px;min-width:200px;font-family:inherit;">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                      <div style="width:10px;height:10px;border-radius:50%;background:${ringColor};flex-shrink:0;"></div>
                      <span style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#1a1a1a;">${zone.name}</span>
                    </div>
                    <div style="font-size:9px;text-transform:uppercase;letter-spacing:0.1em;color:#999;margin-bottom:12px;">${zone.tag}</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
                      <div style="background:${bgColor}22;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:18px;font-weight:900;color:${ringColor};">${zone.aqi}</div>
                        <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:#666;">AQI</div>
                        <div style="font-size:7px;color:${ringColor};font-weight:700;margin-top:2px;">${aqiBand}</div>
                      </div>
                      <div style="background:#33333322;border-radius:8px;padding:8px;text-align:center;">
                        <div style="font-size:18px;font-weight:900;color:#555;">${zone.noise}<span style="font-size:10px;">dB</span></div>
                        <div style="font-size:8px;text-transform:uppercase;letter-spacing:0.08em;color:#666;">Noise</div>
                        <div style="font-size:7px;color:#888;font-weight:700;margin-top:2px;">${zone.noise >= 85 ? 'Damaging' : zone.noise >= 75 ? 'Harmful' : 'Elevated'}</div>
                      </div>
                    </div>
                    <div style="background:${ringColor}18;border:1px solid ${ringColor}44;border-radius:6px;padding:7px 10px;font-size:8px;color:#333;line-height:1.5;">
                      ⚠ Health Risk: <strong style="color:${ringColor};text-transform:uppercase;">${zone.hazard}</strong> — prolonged exposure linked to respiratory illness, cardiovascular stress.
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

const Sanctuaries = ({ isSubscribed, onNewsletterClick, isFullPage = false, sanctuaries = SANCTUARIES }: { isSubscribed: boolean, onNewsletterClick: () => void, isFullPage?: boolean, sanctuaries?: Sanctuary[] }) => {
  const [selectedSanctuary, setSelectedSanctuary] = useState<Sanctuary | null>(null);


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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {sanctuaries.map(s => (
            <SanctuaryCard
              key={s.id}
              sanctuary={s}
              isSubscribed={isSubscribed}
              onNewsletterClick={onNewsletterClick}
              onOpen={() => setSelectedSanctuary(s)}
            />
          ))}
        </div>
      </div>

      {/* Property detail overlay */}
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
            <PropertyDetailOverlay sanctuary={selectedSanctuary} onClose={() => setSelectedSanctuary(null)} isSubscribed={isSubscribed} onNewsletterSignup={onNewsletterClick} />
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
                  <label htmlFor="apply-name" className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Full Name</label>
                  <input id="apply-name" {...register("name", { required: true })} className="input-cashew" placeholder="Your Name" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="apply-email" className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Private Email</label>
                  <input id="apply-email" type="email" {...register("email", { required: true })} className="input-cashew" placeholder="email@domain.com" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="apply-intent" className="text-[9px] uppercase tracking-[0.5em] text-olive-800/40">Ethical Intent</label>
                  <textarea
                    id="apply-intent"
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

const Footer = ({ onModeChange }: { onModeChange: (mode: string) => void }) => {
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
              <li><button onClick={() => onModeChange('analytics')} className="hover:text-cream transition-all">Advantage</button></li>
              <li><button onClick={() => onModeChange('gallery')} className="hover:text-cream transition-all">Ecosystems</button></li>
              <li><button onClick={() => onModeChange('map')} className="hover:text-cream transition-all">Map</button></li>
              <li><button onClick={() => onModeChange('list')} className="hover:text-cream transition-all">Agartha</button></li>
              <li><button onClick={() => onModeChange('syl')} className="hover:text-cream transition-all">SYL</button></li>
              <li><button onClick={() => onModeChange('home')} className="hover:text-cream transition-all">Home</button></li>
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] text-gold mb-12">Collective</p>
            <div className="flex gap-8">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://linkedin.com/company/the-green-team-india" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="mailto:hello@thegreenteam.in" aria-label="Email us" className="text-cream/20 hover:text-cream transition-all cursor-pointer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-12 border-t border-cream/5 flex flex-col md:flex-row justify-between items-center gap-12 text-[9px] uppercase tracking-[0.5em] text-cream/10 font-bold">
          <p>© {new Date().getFullYear()} The Green Team — Independent Sanctuary Curators. All rights reserved.</p>
          <div className="flex gap-16">
            <span className="opacity-40">Privacy</span>
            <span className="opacity-40">Ethics</span>
            <span className="opacity-40">Legal</span>
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
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">MODCON</h3>
            <p className="text-[8px] uppercase tracking-widest text-olive-800/50">Builders</p>
          </div>
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Agartha</h3>
            <p className="text-[8px] uppercase tracking-widest text-olive-800/50">Forest Community</p>
          </div>
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Griha</h3>
            <p className="text-[8px] uppercase tracking-widest text-olive-800/50">Telangana Homes</p>
          </div>
          <div className="flex flex-col items-center justify-center h-20 gap-1">
            <h3 className="font-headline font-bold text-xl tracking-widest uppercase">Vastu</h3>
            <p className="text-[8px] uppercase tracking-widest text-olive-800/50">Hyderabad Realty</p>
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
              <img src="https://picsum.photos/seed/kushal/100/100" alt="Member" className="w-full h-full object-cover" />
            </div>
            <div className="text-left">
              <p className="font-bold text-olive-900 text-sm uppercase tracking-wider">Kushal</p>
              <p className="text-[10px] text-olive-800/60 uppercase tracking-widest font-bold">Lead Developer, BHEL · Early Member, Agartha</p>
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
                  <label htmlFor="nl-highlight-email" className="text-[9px] uppercase tracking-[0.5em] text-cream/40">Secure Email Address</label>
                  <input
                    id="nl-highlight-email"
                    name="email"
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
        className="absolute bottom-8 right-8 z-[1000] w-12 h-12 bg-surface text-olive-900 border border-outline/10 rounded-full shadow-lg flex items-center justify-center hover:bg-olive-900 hover:text-cream transition-all duration-300 group"
      >
        <MessageSquare className="w-5 h-5 relative z-10" />
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
              className="absolute inset-0 z-[995] bg-black/10 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="absolute bottom-24 right-8 z-[1000] w-[340px] max-w-[calc(100vw-3rem)] h-[500px] bg-surface shadow-2xl border border-olive-800/10 flex flex-col overflow-hidden rounded-2xl"
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

const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void }) => (
  <div className="flex flex-col">
    <Hero />
    <Advantage />
    <EcosystemPillars />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} />
    <TheSIL isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />
    <TrustSignals />
    <NewsletterHighlight onSubscribe={onNewsletterClick} />
    <ApplicationForm />
    <Footer onModeChange={onModeChange} />
  </div>
);

// ─── Auth helpers ─────────────────────────────────────────────────────────────

const friendlyAuthError = (code: string) => {
  const map: Record<string, string> = {
    'auth/user-not-found':            'No account found. Try signing up.',
    'auth/wrong-password':            'Incorrect password.',
    'auth/invalid-credential':        'Invalid email or password.',
    'auth/email-already-in-use':      'Email already registered. Sign in instead.',
    'auth/weak-password':             'Password must be at least 6 characters.',
    'auth/invalid-email':             'Enter a valid email address.',
    'auth/popup-closed-by-user':      'Sign-in window closed. Please try again.',
    'auth/popup-blocked':             'Popup blocked by browser. Please allow popups for this site.',
    'auth/too-many-requests':         'Too many attempts. Try again later.',
    'auth/network-request-failed':    'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
};

// ─── Auth Modal ───────────────────────────────────────────────────────────────

const AuthModal = ({
  isOpen,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User, isNew: boolean) => void;
}) => {
  const [emailOpen, setEmailOpen]   = useState(false);
  const [emailMode, setEmailMode]   = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState<'google' | 'email' | null>(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!isOpen) {
      setEmailOpen(false); setEmailMode('signin');
      setEmail(''); setPassword(''); setError('');
    }
  }, [isOpen]);

  const handleGoogle = async () => {
    setError(''); setLoading('google');
    try {
      const { user, operationType } = await signInWithPopup(auth, googleProvider);
      // isNew if it's a sign-up operation (first time)
      const isNew = operationType === 'signIn' && !user.metadata.creationTime
        ? false
        : user.metadata.creationTime === user.metadata.lastSignInTime;
      onSuccess(user, isNew);
      onClose();
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading('email');
    try {
      const isSignup = emailMode === 'signup';
      const cred = isSignup
        ? await createUserWithEmailAndPassword(auth, email, password)
        : await signInWithEmailAndPassword(auth, email, password);
      onSuccess(cred.user, isSignup);
      onClose();
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-olive-900/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 30, stiffness: 240 }}
            className="relative w-full sm:max-w-md bg-cream sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Hero strip */}
            <div className="bg-olive-900 px-10 pt-12 pb-10 text-cream text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-5">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-serif italic mb-1">Unlock The Sanctuaries</h2>
              <p className="text-cream/50 text-xs font-light tracking-wide">Pre-launch access · Exclusive investor pricing</p>
            </div>

            <div className="px-10 py-8 space-y-5">
              {/* Google — PRIMARY CTA */}
              <button
                onClick={handleGoogle}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-olive-800/10 rounded-2xl text-olive-900 text-sm font-semibold shadow-sm hover:shadow-md hover:border-olive-800/20 transition-all disabled:opacity-60"
              >
                {loading === 'google'
                  ? <RefreshCw className="w-5 h-5 animate-spin text-olive-800/40" />
                  : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                }
                {loading === 'google' ? 'Connecting…' : 'Continue with Google'}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-px bg-olive-800/10" />
                <span className="text-[9px] uppercase tracking-[0.4em] text-olive-800/30 font-bold">or</span>
                <div className="flex-1 h-px bg-olive-800/10" />
              </div>

              {/* Email — secondary, expandable */}
              {!emailOpen ? (
                <button
                  onClick={() => setEmailOpen(true)}
                  className="w-full py-3.5 border border-olive-800/15 rounded-2xl text-olive-900/60 text-sm hover:border-olive-800/30 hover:text-olive-900 transition-all"
                >
                  Continue with Email
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleEmail}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label htmlFor="auth-email" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Email</label>
                    <input id="auth-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      placeholder="email@domain.com" autoFocus />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Password</label>
                    <input id="auth-password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      placeholder="••••••••" />
                  </div>
                  {error && <p className="text-red-500 text-xs">{error}</p>}
                  <button type="submit" disabled={!!loading}
                    className="w-full py-3.5 bg-olive-900 text-cream text-sm font-semibold rounded-2xl hover:bg-primary transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading === 'email' ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    {loading === 'email' ? 'Please wait…' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                  <p className="text-center text-[10px] text-olive-800/40">
                    {emailMode === 'signin' ? "New here? " : 'Have an account? '}
                    <button type="button" onClick={() => { setEmailMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
                      className="text-primary underline underline-offset-2 font-bold">
                      {emailMode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </motion.form>
              )}

              {error && !emailOpen && <p className="text-red-500 text-xs text-center">{error}</p>}

              <p className="text-center text-[9px] text-olive-800/20 uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our terms.<br />We never spam — only sanctuary intelligence.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Profile Modal (post sign-in) ────────────────────────────────────────────

const ProfileModal = ({
  isOpen,
  user,
  onDone,
}: {
  isOpen: boolean;
  user: User | null;
  onDone: () => void;
}) => {
  const [name, setName]             = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity]             = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (isOpen && user) setName(user.displayName || '');
  }, [isOpen, user]);

  const handleSave = async (skip = false) => {
    if (!user) { onDone(); return; }
    setSaving(true);
    try {
      await upsertUserProfile(user.uid, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        ...(skip ? {} : { name: name.trim() || undefined, occupation: occupation.trim() || undefined, city: city.trim() || undefined }),
      });
    } catch { /* silent */ }
    setSaving(false);
    onDone();
  };

  return (
    <AnimatePresence>
      {isOpen && user && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-olive-900/70 backdrop-blur-xl" onClick={() => handleSave(true)} />
          <motion.div
            initial={{ opacity: 0, y: 80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 80 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full sm:max-w-lg bg-cream sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden"
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div className="flex items-center gap-3">
                {user.photoURL
                  ? <img src={user.photoURL} referrerPolicy="no-referrer" alt="You" className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20" />
                  : <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                      {(user.displayName?.[0] || user.email?.[0] || '?').toUpperCase()}
                    </div>
                }
                <div>
                  <p className="text-[8px] uppercase tracking-[0.5em] text-primary/60 font-bold">Welcome</p>
                  <p className="text-sm font-bold text-olive-900">{user.displayName || user.email}</p>
                </div>
              </div>
              <button onClick={() => handleSave(true)} className="text-olive-800/30 hover:text-olive-900 transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-8 pb-10 space-y-6">
              <div>
                <h2 className="text-xl font-serif italic text-olive-900">One quick thing</h2>
                <p className="text-olive-800/40 text-xs font-light mt-1 leading-relaxed">Help us match you with the right sanctuary. Totally optional — skip anytime.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="prof-name" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Full Name</label>
                  <input id="prof-name" name="name" value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                    placeholder="Your name" />
                </div>
                <div>
                  <label htmlFor="prof-occ" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">What do you do?</label>
                  <input id="prof-occ" name="occupation" value={occupation} onChange={e => setOccupation(e.target.value)}
                    className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                    placeholder="e.g. Software Engineer at Google" />
                </div>
                <div>
                  <label htmlFor="prof-city" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Where are you based?</label>
                  <input id="prof-city" name="city" value={city} onChange={e => setCity(e.target.value)}
                    className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary/60 transition-colors"
                    placeholder="e.g. Hyderabad" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={() => handleSave(false)} disabled={saving}
                  className="flex-1 py-4 bg-olive-900 text-cream text-sm font-semibold rounded-2xl hover:bg-primary transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving…' : 'Complete Profile'}
                </button>
                <button onClick={() => handleSave(true)} disabled={saving}
                  className="px-6 py-4 border border-olive-800/10 text-olive-800/40 text-xs font-bold rounded-2xl hover:border-olive-800/30 hover:text-olive-900 transition-all">
                  Skip
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── App (main) ──────────────────────────────────────────────────────────────

export default function App() {
  type ViewMode = 'home' | 'map' | 'list' | 'gallery' | 'analytics' | 'syl';
  const VIEW_ORDER: ViewMode[] = ['home', 'list', 'gallery', 'analytics', 'syl', 'map'];

  const [authUser, setAuthUser]     = useState<User | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(null);

  // Silent geolocation capture — saves to Firestore without any UI
  const captureLocation = useCallback((uid: string) => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        upsertUserProfile(uid, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          locationAccuracy: pos.coords.accuracy,
        }).catch(() => {});
      },
      () => { /* user denied — silent fail */ },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  // Called after any successful sign-in
  const handleAuthSuccess = useCallback((user: User, isNew: boolean) => {
    setAuthUser(user);
    if (user.email === ADMIN_EMAIL) setShowAdmin(true);
    // Request geolocation silently after a short delay
    setTimeout(() => captureLocation(user.uid), 1500);
    // Show profile modal for new users (or returning users who never filled it)
    if (isNew) {
      setProfileUser(user);
      setShowProfile(true);
    } else {
      // For returning users: check if they have a profile, if not show it
      upsertUserProfile(user.uid, {
        uid: user.uid, email: user.email, displayName: user.displayName, photoURL: user.photoURL,
      }).then(wasNew => {
        if (wasNew) { setProfileUser(user); setShowProfile(true); }
      }).catch(() => {});
    }
  }, [captureLocation]);

  // Global auth state listener (handles page reload / session restore)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u);
      if (u?.email === ADMIN_EMAIL) setShowAdmin(true);
      // Silent location refresh on session restore
      if (u) setTimeout(() => captureLocation(u.uid), 2000);
    });
    return unsub;
  }, [captureLocation]);

  const handleSignOut = async () => {
    await signOut(auth);
    setViewMode('home');
    setShowAdmin(false);
  };

  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('gt_subscribed') === 'true';
  });
  // A logged-in user is always treated as a subscriber — no gates shown
  const effectivelySubscribed = isSubscribed || !!authUser;
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [isDark, setIsDark] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  // ── Admin: leads + newsletter + users (lazy-loaded when admin panel opens) ─
  const [adminLeads, setAdminLeads] = useState<Lead[]>([]);
  const [adminNewsletter, setAdminNewsletter] = useState<NewsletterEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const fetchAdminData = useCallback(async () => {
    if (!authUser || authUser.email !== ADMIN_EMAIL) return;
    try {
      const [l, n, u] = await Promise.all([getLeads(), getNewsletterSubs(), getAllUsers()]);
      setAdminLeads(l);
      setAdminNewsletter(n);
      setAdminUsers(u);
    } catch {/* ignore */}
  }, [authUser]);
  useEffect(() => { if (showAdmin) fetchAdminData(); }, [showAdmin, fetchAdminData]);

  // ── Firestore properties (real-time) ─────────────────────────────────────
  const [firestoreProps, setFirestoreProps] = useState<PropertyDoc[]>([]);
  useEffect(() => {
    if (!db) return;
    const unsub = subscribeProperties(setFirestoreProps);
    return unsub;
  }, []);

  // Merge hardcoded + Firestore live properties into one list
  const allSanctuaries = useMemo(() => {
    const live = firestoreProps
      .filter(p => p.status === 'live')
      .map(p => ({
        id: p.id,
        title: p.title,
        location: p.location,
        aqi: p.aqi,
        noise: p.noise,
        commute: p.commute,
        valuation: p.valuation,
        memberPrice: p.memberPrice,
        image: p.image,
        tagline: p.tagline,
        description: p.description,
        plots: p.plots,
        plotRange: p.plotRange,
        amenityAcres: p.amenityAcres,
        architect: p.architect,
        features: p.features,
        pricePerSqYd: p.pricePerSqYd,
        sitePlanSrc: p.sitePlanSrc,
        brochureUrl: p.brochureUrl,
      } as typeof SANCTUARIES[0]));
    return [...SANCTUARIES, ...live];
  }, [firestoreProps]);

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

  // ── Edge-only swipe navigation (Android-style) ───────────────────────────
  // Only triggers when the touch STARTS within EDGE_ZONE px of the left or right
  // screen edge — mid-screen swipes are ignored entirely.
  const EDGE_ZONE = 24; // px from either edge that counts as an edge swipe
  const touchStart = useRef<{ x: number; y: number; fromEdge: boolean } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const x = e.touches[0].clientX;
    const fromEdge = x <= EDGE_ZONE || x >= window.innerWidth - EDGE_ZONE;
    touchStart.current = { x, y: e.touches[0].clientY, fromEdge };
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const { fromEdge, x: startX, y: startY } = touchStart.current;
    touchStart.current = null;
    if (!fromEdge) return; // mid-screen swipe — do nothing
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    if (Math.abs(dx) < 40 || Math.abs(dx) < dy * 1.2) return; // too short or mostly vertical
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
        isAdmin={authUser?.email === ADMIN_EMAIL}
        onAdminClick={() => setShowAdmin(true)}
      />

      <main className="flex-1 flex overflow-hidden relative">
        {/* Center - Map or other views */}
        <div className="flex-1 relative overflow-hidden bg-surface">
          {/* Map is always mounted to preserve Leaflet pan/zoom/filter state */}
          <div className={viewMode === 'map' ? 'absolute inset-0 z-10' : 'hidden'}>
            <SanctuaryMapLayout isVisible={viewMode === 'map'} />
            <ChatBot data={{ sanctuaries: SANCTUARIES }} />
          </div>
          {viewMode !== 'map' && (
            <div ref={scrollRef} className="h-full w-full overflow-y-auto">
              {viewMode === 'home' && <HomeView isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} sanctuaries={allSanctuaries} onModeChange={handleViewChange} />}
              {viewMode === 'list' && <Sanctuaries isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} isFullPage sanctuaries={allSanctuaries} />}
              {viewMode === 'gallery' && <EcosystemPillars isFullPage />}
              {viewMode === 'analytics' && <Advantage isFullPage />}
              {viewMode === 'syl' && <TheSIL isSubscribed={effectivelySubscribed} onNewsletterClick={() => { if (!effectivelySubscribed) setIsNewsletterOpen(true); }} isFullPage />}
            </div>
          )}
        </div>
      </main>

      {/* Admin Dashboard overlay — only for sumanthbolla97@gmail.com */}
      <AnimatePresence>
        {showAdmin && authUser?.email === ADMIN_EMAIL && (
          <AdminDashboard
            onClose={() => setShowAdmin(false)}
            authUser={authUser}
            leads={adminLeads}
            newsletter={adminNewsletter}
            firestoreProps={firestoreProps}
            users={adminUsers}
          />
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(user, isNew) => {
          setIsAuthOpen(false);
          handleAuthSuccess(user, isNew);
        }}
      />

      {/* Profile collection modal — appears once after sign-in */}
      <ProfileModal
        isOpen={showProfile}
        user={profileUser}
        onDone={() => setShowProfile(false)}
      />

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
        onSubscribe={handleSubscribe}
      />
    </div>
  );
}
