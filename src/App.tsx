import React, { useState, useEffect, useMemo, useCallback, useRef, FC, startTransition } from 'react';
import { createPortal } from 'react-dom';
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


import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap, ZoomControl, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { AlertTriangle, ZoomIn, LogOut, RefreshCw, Users, Mail as MailIcon, ShieldCheck, User as UserIcon } from 'lucide-react';
import L from 'leaflet';

// Firebase
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPhoneNumber,
  RecaptchaVerifier,
} from 'firebase/auth';
import type { User, ConfirmationResult } from 'firebase/auth';
import { auth, db, googleProvider } from './lib/firebase';
import { saveLead, saveNewsletter, getLeads, getNewsletterSubs, subscribeLeads, subscribeNewsletter } from './lib/leads';
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
  // Site plan + external brochure - populate for any property with a site plan
  sitePlanSrc?: string;
  brochureUrl?: string;
  mapUrl?: string;
  gallery?: string[];
}

// --- Mock Data ---

const SANCTUARIES: Sanctuary[] = [
  {
    id: 'agartha',
    title: 'MODCON Agartha',
    location: 'Janakampet, Narsapur · Hyderabad',
    aqi: 12,
    noise: 18,
    commute: '40 mins to Financial District',
    pricePerSqYd: 8500,
    valuation: '',
    memberPrice: 'From ₹68.7 L',
    image: '/gallery/agartha/11.webp',
    tagline: 'Where the forest becomes home.',
    description: 'MODCON Agartha is a 25-acre regenerative permaculture farm estate on the Narsapur forest boundary, near the RRR. 36 unique farm plots — each pre-planted with 100+ tree varieties, drip irrigation, vegetable beds, and a spiral herbal garden — surround a 36,000 sq ft clubhouse with 5 premium amenities: aquatic pool, kayaking lake, gym, farm-to-table dining, and staycation villas. An on-site Goshala with integrated animal husbandry completes the self-sustaining ecosystem. Winner: Best Sustainable Eco-Friendly Project of the Year 2024.',
    plots: 36,
    plotRange: '808 – 4,800 sq yds',
    amenityAcres: '36,000 sq ft Clubhouse',
    architect: 'MODCON Builders',
    sitePlanSrc: '/FINAL-LAYOUT.jpeg',
    brochureUrl: 'https://www.modconbuilders.com/agartha',
    plotImages: [
      'https://static.wixstatic.com/media/142b26_cb62ea3cf3a1420399ec2e43c1dee85f~mv2.png',
      'https://static.wixstatic.com/media/142b26_3a60dc75703c4cc2a29c6d44f41b8e21~mv2.png',
      'https://static.wixstatic.com/media/142b26_a329de8538c44092bb941ee925dbcd7c~mv2.png',
      'https://static.wixstatic.com/media/142b26_b52923b4599745df825e9d06157b43d3~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_5f7c47258d394edcbf818b25e3b12965~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_e9917bb73fc94531948ef638eba5a051~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_86e04d7ce83d497997bdac2c29efe900~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_d9f37ad4d1d74e65a62892327167ed6b~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_acda3bc9aaa84bfc976803cdcbdce73f~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_0fee06470ac2445c9ff7742be6377273~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_567e195b978947c9b29be195842095af~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_07ba6ec4ef4e49d680a53ab9a3362f25~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_a8649ae42bca482cbbafe84794fe8a6e~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_13ce857bed164143a7d79ce6cef3668e~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_87ac7f7d92a145b9aa2740c4a6898410~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_e952e8d04d6546b5866e374206744e87~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_bdabb7cd17f741ee815019462732e449~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_5a78474b934e4251b54ce25e16770c68~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_a79caac8357141ef89993d2115817696~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_04f61d366de9472cb87db76b28b272fc~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_34c58cd885c64ddebbae12791465bbe3~mv2.jpg',
      'https://static.wixstatic.com/media/142b26_89a3906d085c4518a1ce49864ebda77a~mv2.jpg',
    ],
    features: [
      '36,000 sq ft Clubhouse',
      'Kayaking & Aquatic Pool',
      'Farm-to-Table Dining',
      'Drip Irrigation (Each Plot)',
      '100+ Tree Varieties / Plot',
      'Goshala & Animal Husbandry',
      'Spiral Herbal Garden',
      'Near RRR · 40 Min City Access',
    ],
  },
  {
    id: 'syl',
    title: 'MODCON SYL Residences',
    location: 'Tukkuguda, ORR Exit-14 · Hyderabad',
    aqi: 22,
    noise: 24,
    commute: '10 mins to Airport · 30-45 mins to Financial District',
    valuation: '',
    memberPrice: '₹4,499 / SFT',
    image: '/gallery/syl/1776279315359.webp',
    tagline: 'A modern address where luxury meets nature.',
    description: 'MODCON SYL Residences is a 4.5-acre biophilic development at Tukkuguda, ORR Exit-14 — offering luxury villaments from 2,500 to 4,500 SFT with large forest-view balconies, natural light, and sunrise views. The 22,000 sq ft clubhouse is a wellness retreat with a chemical-free Natural Bio Pool and Yoga Pavilion. Commercial spaces are also available at exclusive one-time investor prices — contact us for details. Located 10 minutes from the international airport and at the threshold of Hyderabad\'s Fourth City growth corridor.',
    plots: 0,
    plotRange: 'Villaments 2,500 – 4,500 SFT · Commercial Available',
    amenityAcres: '22,000 SFT Clubhouse · Health • Wellness • Nature',
    architect: 'MODCON Builders',
    brochureUrl: 'https://www.modconbuilders.com',
    features: [
      'Commercial Spaces — OTP Investor Pricing (Enquire)',
      'Villaments 2,500 – 4,500 SFT',
      'Natural Bio Pool (Chemical-Free)',
      'Yoga & Meditation Pavilion',
      'Large Forest-View Balconies',
      'Biophilic Green Corridors',
      'Wellness & Fitness Spaces',
      'EV Charging Points',
      '100% Power Backup',
      '4 High-Speed Passenger Lifts',
      'Gated Community · 24/7 Security',
      'ORR Exit-14 · 10 Min to Airport',
    ],
    plotImages: [
      '/gallery/syl/1776279315359.webp',
      '/gallery/syl/1776279320251.webp',
      '/gallery/syl/1776279329483.webp',
      '/gallery/syl/1776279339464.webp',
      '/gallery/syl/1776279343905.webp',
      '/gallery/syl/1776279350036.webp',
      '/gallery/syl/1776279361294.webp',
      '/gallery/syl/1776279377269.webp',
    ],
  },
  {
    id: 'dates-county',
    title: 'Dates County by Planet Green',
    location: 'Kandukur, Srisailam Highway · Hyderabad',
    aqi: 18,
    noise: 22,
    commute: '15 mins to Airport · 15 mins to ORR Exit-14',
    pricePerSqYd: 18000,
    valuation: '',
    memberPrice: '₹90 L',
    image: '/gallery/dates-county/temple.jpg',
    tagline: 'Eco-luxury villa plots at the edge of a 4,000-acre forest.',
    description: 'Dates County by Planet Green is a 300+ acre eco-luxury villa-plot community in Kandukur — the epicentre of Hyderabad\'s emerging Future City on Srisailam Highway. Adjacent to a 4,000-acre reserve forest, the township reserves 40% of its land for open and recreational spaces, woven through with date palm plantations, themed parks, sports courts and natural fishing ponds. 15 minutes to the Hyderabad International Airport and 15 minutes to ORR Exit-14 (Tukkuguda). RERA P02400002648 · P02400003813.',
    plots: 0,
    plotRange: '500 sq yds · ₹18,000/sq yd',
    amenityAcres: '300+ Acres · 40% Open Space',
    architect: 'Planet Green Infra',
    brochureUrl: 'https://www.thedatescounty.in',
    features: [
      'Adjacent to 4,000-Acre Reserve Forest',
      '40% Open & Recreational Space',
      'Date Palm Plantations (Vedic Farming)',
      'Clubhouse · Swimming Pool · Gym',
      'Themed Parks · Natural Fishing Ponds',
      'Landscaped Gardens · Senior Citizen Park',
      '24/7 Security · Gated Community',
      '15 Min to Airport · ORR Exit-14',
    ],
    plotImages: [
      '/gallery/dates-county/temple.jpg',
      '/gallery/dates-county/project-highlight.jpg',
      '/gallery/dates-county/field.jpg',
      '/gallery/dates-county/amenities.jpg',
      '/gallery/dates-county/water.jpg',
      '/gallery/dates-county/forest.jpg',
      '/gallery/dates-county/sustainability.png',
    ],
  },
];

interface JournalPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  image?: string;
  body: string[];
  takeaways: string[];
}

const JOURNAL_POSTS_OLD: JournalPost[] = [
  {
    id: 'forest-bound-premium',
    title: 'Why forest-bound communities retain pricing power',
    category: 'Market note',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'Scarcity comes from boundary, access, and the cost of recreating calm once development reaches a corridor.',
    image: '/gallery/agartha/11.webp',
    body: [
      'Forest-adjacent land is not only about the view. It combines limited supply, cleaner air, lower ambient noise, and a lifestyle premium that cannot be reproduced once density closes in.',
      'Buyers tend to price the nearest future constraints: infrastructure, commute, and the cost of obtaining comparable green space. That is why corridor projects with a hard ecological edge often outperform generic plotted developments.',
      'In our curation model, the real question is not whether a development is beautiful. It is whether it has a defensible moat that can still be explained five years later.',
    ],
    takeaways: [
      'Boundary creates scarcity.',
      'Commute improves liquidity.',
      'Recreated calm is expensive, so it compounds.',
    ],
  },
  {
    id: 'reading-the-land',
    title: 'How to read AQI, noise, and commute together',
    category: 'Decision framework',
    date: 'April 2026',
    readTime: '5 min read',
    excerpt: 'The strongest sites rarely win on a single metric. The edge appears when environmental quality and access align.',
    image: '/gallery/syl/1776279315359.webp',
    body: [
      'AQI tells you whether the air is consistently pleasant. Noise tells you whether the experience feels restorative once you arrive. Commute tells you how often the premium location will actually be used.',
      'A site with strong AQI but weak access can feel isolated. A site with strong access but poor environment can lose its premium over time. The best projects sit in the narrow band where all three variables support one another.',
      'That is why we compare properties as complete ecosystems, not as isolated brochures.',
    ],
    takeaways: [
      'AQI measures comfort.',
      'Noise measures livability.',
      'Commute measures repeat usage.',
    ],
  },
  {
    id: 'preinvestor-pricing',
    title: 'What pre-investor pricing actually buys you',
    category: 'Private access',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'The earliest phase is usually where flexibility, inventory choice, and upside are the most asymmetric.',
    image: '/gallery/dates-county/temple.jpg',
    body: [
      'Pre-investor pricing is not just a lower number. It often means better unit selection, more negotiation room, and the ability to enter before public distribution compresses the upside.',
      'Once booking targets are hit, the pricing ladder usually moves up in stages. That is why the earliest phase matters: the same inventory becomes harder to access, and the premium is paid in both price and choice.',
      'Our role is to make that trade-off legible so buyers can decide with clarity rather than urgency alone.',
    ],
    takeaways: [
      'Earlier entry means more choice.',
      'Later phases usually cost more.',
      'Clarity matters more than urgency.',
    ],
  },
];

const JOURNAL_POSTS: JournalPost[] = [
  {
    id: 'what-the-green-team-does',
    title: 'What The Green Team is and what we do',
    category: 'About us',
    date: 'April 2026',
    readTime: '5 min read',
    excerpt: 'We curate Hyderabad properties with a clear lens: location quality, environmental comfort, access, and long-term holding strength.',
    image: '/hero-backdrop.jpg',
    body: [
      'The Green Team is a curation house, not a listing portal. We study projects through a practical lens: where they are, who they serve, how they feel to live in, and whether the site can preserve value over time.',
      'Our focus is on properties that combine strong fundamentals with a better daily experience. That means cleaner surroundings, quieter streets, sensible access, and developers who can deliver what the brochure promises.',
      'We help buyers look past generic marketing and compare the real lived experience of a home, plot, or community before they commit.',
    ],
    takeaways: [
      'We curate, we do not list.',
      'We look at value plus lifestyle.',
      'We focus on Hyderabad growth corridors.',
    ],
  },
  {
    id: 'choosing-hyderabad-location',
    title: 'How to select a location in Hyderabad for investment returns',
    category: 'Location guide',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'Strong returns usually come from locations where infrastructure growth, scarcity, and livability move in the same direction.',
    image: '/gallery/agartha/11.webp',
    body: [
      'In Hyderabad, location is a combination of corridor, connectivity, and future demand. Areas near airport growth, ORR access, and emerging employment zones often attract more attention than isolated pockets.',
      'You should compare not just today’s address, but tomorrow’s access. Travel time to the airport, the financial district, and major highways affects both end-user demand and resale strength.',
      'The right location is usually the one that feels practical now and still feels scarce later.',
    ],
    takeaways: [
      'Corridor growth matters.',
      'Commute is part of valuation.',
      'Scarcity beats hype.',
    ],
  },
  {
    id: 'aqi-as-an-investment-signal',
    title: 'Why AQI matters when buying a home or plot',
    category: 'Lifestyle signal',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'AQI is not a vanity metric. It is one of the fastest ways to understand whether a location will feel good to live in every day.',
    image: '/gallery/syl/1776279315359.webp',
    body: [
      'AQI is a daily-use measure. If the air is cleaner, the home feels more usable, the outdoors become more inviting, and the neighborhood is more likely to command a premium.',
      'For end users, AQI affects comfort and health. For investors, it affects how easy it is to sell or rent the property to people who care about quality of life.',
      'A strong AQI profile rarely works alone, but it can dramatically strengthen a location that already has access and scarcity.',
    ],
    takeaways: [
      'AQI supports livability.',
      'Better air helps resale appeal.',
      'Environmental quality compounds value.',
    ],
  },
  {
    id: 'noise-pollution-city-heart',
    title: 'Noise pollution in the heart of the city changes the lifestyle equation',
    category: 'Urban comfort',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'Noise is one of the most underrated reasons a well-located home still feels exhausting after a long day.',
    image: '/gallery/agartha-render.jpg',
    body: [
      'Two homes can be equally central but feel completely different once you close the door. Continuous traffic, sirens, commercial activity, and construction noise slowly change how restful a place feels.',
      'When we evaluate locations, we pay attention to how a site behaves at different times of day. A good address should not only be accessible; it should also allow you to recover when you return home.',
      'Lower noise often means the property can support a more premium lifestyle narrative, even in dense parts of the city.',
    ],
    takeaways: [
      'Noise affects recovery.',
      'Central does not always mean comfortable.',
      'Quiet environments feel more premium.',
    ],
  },
  {
    id: 'curated-properties-lifestyle',
    title: 'What curated properties change in daily living',
    category: 'Lifestyle value',
    date: 'April 2026',
    readTime: '5 min read',
    excerpt: 'A curated property changes more than the address. It changes how the day starts, ends, and feels in between.',
    image: '/gallery/dates-county/temple.jpg',
    body: [
      'Curated properties are chosen for the experience they create, not just the brochure they sell. That means better planning, more coherent surroundings, and a clearer sense of identity.',
      'A strong curation lens also improves decision quality for buyers. Instead of comparing dozens of generic options, they compare a shorter list of projects with a clear reason to exist.',
      'The result is a better lifestyle fit and a lower chance of buyer regret.',
    ],
    takeaways: [
      'Curation reduces decision noise.',
      'The right environment shapes routines.',
      'Better fit lowers regret.',
    ],
  },
  {
    id: 'home-vs-plot',
    title: 'Buying a home vs buying a plot in Hyderabad',
    category: 'Buyer guide',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'The choice depends on whether you want immediate usability, future flexibility, or the strongest balance of both.',
    image: '/gallery/syl/1776279315359.webp',
    body: [
      'A home gives immediate use and often a more predictable living experience. A plot gives flexibility, but it also asks more of the buyer in terms of planning and execution.',
      'In Hyderabad, the right answer depends on the corridor, the developer, and the quality of the surrounding ecosystem. Some buyers want a ready lifestyle. Others want land with long-term appreciation potential.',
      'Our job is to make those trade-offs visible so the buyer can choose based on intent rather than impulse.',
    ],
    takeaways: [
      'Homes are ready now.',
      'Plots offer flexibility.',
      'The best choice depends on your time horizon.',
    ],
  },
  {
    id: 'corridor-thinking-hyderabad',
    title: 'Why corridor thinking matters more than isolated landmarks',
    category: 'Strategy',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'A good project is rarely just a dot on the map. It is part of a wider growth story that keeps extending around it.',
    image: '/gallery/agartha-official-render.png',
    body: [
      'Corridors connect infrastructure, employment, and housing demand. When these pieces align, the surrounding land tends to benefit from steady attention and better price discovery.',
      'Isolated landmarks can look attractive but fail to create enduring demand if the wider area does not grow with them. Corridor logic helps buyers distinguish between a one-off story and a durable thesis.',
      'This is especially relevant in Hyderabad, where airport access, ORR connectivity, and suburban expansion keep reshaping the market map.',
    ],
    takeaways: [
      'Corridors create demand tails.',
      'Infrastructure changes desirability.',
      'Durable growth is usually regional.',
    ],
  },
  {
    id: 'a-better-commute-premium',
    title: 'How commute time affects real estate returns',
    category: 'Returns',
    date: 'April 2026',
    readTime: '4 min read',
    excerpt: 'Commute is not just convenience. It shapes the pool of buyers who will seriously consider a property.',
    image: '/gallery/dates-county/field.jpg',
    body: [
      'A shorter, more practical commute makes a property relevant to more people. That tends to support liquidity, rental interest, and resale confidence.',
      'In premium residential markets, buyers often pay more for time saved, especially when the location also offers cleaner surroundings and better planning.',
      'When commute, access, and environment line up, the property becomes easier to explain and easier to exit.',
    ],
    takeaways: [
      'Time saved is value created.',
      'Better access widens demand.',
      'Liquidity improves with usability.',
    ],
  },
  {
    id: 'what-quality-curation-means',
    title: 'What quality curation means in a city like Hyderabad',
    category: 'Curation',
    date: 'April 2026',
    readTime: '5 min read',
    excerpt: 'In a fast-growing city, curation filters out the clutter and leaves only projects that make sense as places to live.',
    image: '/gallery/agartha-official-layout.png',
    body: [
      'Curation is a quality filter. It narrows the field to projects with stronger fundamentals, better execution, and more coherent surroundings.',
      'That matters in Hyderabad because the market has a lot of noise. Buyers can easily be distracted by visuals, but the real premium comes from land quality, access, and how a place feels over time.',
      'A curated shortlist helps buyers move from browsing to evaluating with more confidence.',
    ],
    takeaways: [
      'Curation is a filter, not a slogan.',
      'Strong fundamentals beat marketing.',
      'Better shortlists lead to better decisions.',
    ],
  },
  {
    id: 'buying-checklist',
    title: 'A simple checklist before you book a property',
    category: 'Buyer checklist',
    date: 'April 2026',
    readTime: '3 min read',
    excerpt: 'Before you book, ask whether the project still makes sense if you remove the brochure and look only at the location.',
    image: '/FINAL-LAYOUT.jpeg',
    body: [
      'Start with the map, not the marketing. Check access, surrounding land use, road quality, and how the location behaves in real life.',
      'Then ask about AQI, noise, and commute. These three measures tell you whether the project will feel good to use over time.',
      'Finally, compare the location against your own time horizon: immediate living, medium-term holding, or long-term appreciation.',
    ],
    takeaways: [
      'Use the map first.',
      'Measure lived experience.',
      'Match the asset to your horizon.',
    ],
  },
];

// --- Components ---

const Logo = ({ className = "w-10 h-10", textClassName = "text-xl md:text-2xl", iconOnly = false, onDark = false }: { className?: string, textClassName?: string, iconOnly?: boolean, onDark?: boolean }) => (
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
        <span className={cn("font-headline font-bold tracking-widest uppercase transition-all duration-700", onDark ? "text-white/90" : "text-on-surface", textClassName)}>The Green Team</span>
        <span className={cn("text-[8px] md:text-[10px] uppercase tracking-[0.4em] md:tracking-[0.6em] font-bold -mt-0.5 md:-mt-1 hidden sm:block", onDark ? "text-white/30" : "text-primary")}>Channel Partners · Hyderabad</span>
      </div>
    )}
  </div>
);

const Navbar = ({ isSubscribed, onNewsletterClick, onModeChange, onBlogClick, isDark, setIsDark, onSignInClick, authUser, onSignOut, isAdmin, onAdminClick, onPropertySelect }: {
  isSubscribed: boolean;
  onNewsletterClick: () => void;
  onModeChange: (mode: any) => void;
  onBlogClick: () => void;
  isDark: boolean;
  setIsDark: (v: boolean) => void;
  onSignInClick: () => void;
  authUser: User | null;
  onSignOut: () => void;
  isAdmin: boolean;
  onAdminClick: () => void;
  onPropertySelect: (id: string) => void;
}) => {
  const [accountOpen, setAccountOpen] = useState(false);

  const desktopNav = [
    { name: 'Map', id: 'map' },
    { name: 'Edge + Nature', id: 'analytics' },
    { name: 'Blog', id: 'blog' },
    { name: 'Pre-Investor Gold', id: 'preinvestor-gold', isGold: true, icon: Award },
    { name: 'Membership', id: 'membership' },
  ];

  const allNav = [
    { name: 'Home', id: 'home', icon: Home },
    { name: 'Map', id: 'map', icon: MapPin },
    { name: 'Edge + Nature', id: 'analytics', icon: TrendingDown },
    { name: 'Blog', id: 'blog', icon: MessageSquare },
    { name: 'Pre-Investor Gold', id: 'preinvestor-gold', icon: Award },
    { name: 'Membership', id: 'membership', icon: Shield },
  ];

  const sanctuaryItems = [
    { name: 'MODCON Agartha', id: 'agartha', sub: 'Narsapur Forest · From ₹68.7 L', img: '/gallery/agartha/11.webp' },
    { name: 'MODCON SYL Residences', id: 'syl', sub: 'Tukkuguda, ORR Exit-14 · Villaments', img: '/gallery/syl/1776279315359.webp' },
    { name: 'Dates County by Planet Green', id: 'dates-county', sub: 'Kandukur · ₹18,000/sq yd', img: '/gallery/dates-county/temple.jpg' },
  ];

  const avatarLetter = (authUser?.displayName?.[0] || authUser?.email?.[0] || authUser?.phoneNumber?.[1] || '?').toUpperCase();

  return (
    <>
      {/* ── Slim top bar ─────────────────────────────────────────────────────── */}
      <nav
        className="h-14 flex items-center justify-between px-4 md:px-6 border-b"
        style={{
          background: isDark ? 'rgba(20,26,17,0.97)' : 'rgba(250,249,246,0.97)',
          borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(45,58,29,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <button onClick={() => onModeChange('home')} className="focus:outline-none flex-shrink-0" aria-label="Home">
          <Logo className="w-7 h-7" textClassName="text-base" />
        </button>

        {/* Desktop nav — centered */}
        <div className="hidden md:flex items-center gap-7">
          {desktopNav.map(item => {
            const NavIcon = item.icon;
            return (
              <button key={item.id} onClick={() => item.id === 'blog' ? onBlogClick() : onModeChange(item.id)}
                className={cn(
                  "flex items-center gap-2 text-[9px] uppercase tracking-[0.45em] font-bold transition-colors duration-200",
                  item.isGold 
                    ? "text-[#c8a951] hover:text-white" 
                    : "text-secondary/45 hover:text-primary"
                )}>
                {NavIcon && <NavIcon className={cn("w-4 h-4", item.isGold ? "text-[#c8a951]" : "")} />}
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5">
          {isAdmin && (
            <button onClick={onAdminClick}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/8 text-primary text-[8px] uppercase tracking-widest font-bold rounded-full hover:bg-primary/15 transition-all">
              <ShieldCheck className="w-3 h-3" /> Admin
            </button>
          )}
          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-secondary/40 hover:text-primary hover:bg-primary/5 transition-all"
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          {/* Account button */}
          <button
            onClick={() => setAccountOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary/20 transition-all"
          >
            {authUser ? (
              authUser.photoURL ? (
                <img src={authUser.photoURL} referrerPolicy="no-referrer" loading="lazy" decoding="async" alt="Profile" className="w-9 h-9 object-cover rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm uppercase select-none">
                  {avatarLetter}
                </div>
              )
            ) : (
              <div className="w-9 h-9 rounded-full border border-outline/25 flex items-center justify-center">
                <UserIcon className="w-4 h-4 text-secondary/50" />
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* ── Account / Nav drawer — slides from right ─────────────────────────── */}
      <AnimatePresence>
        {accountOpen && (
          <>
            <motion.div
              key="acct-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setAccountOpen(false)}
              className="fixed inset-0 z-[9995] bg-black/35 backdrop-blur-[2px]"
            />
            <motion.div
              key="acct-panel"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="fixed top-0 right-0 bottom-0 z-[9996] w-[min(340px,100vw)] flex flex-col shadow-2xl"
              style={{
                background: isDark ? 'rgba(20,26,17,0.99)' : 'rgba(250,249,246,0.99)',
                borderLeft: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(45,58,29,0.08)',
              }}
            >
              {/* Panel header */}
              <div className="px-6 h-14 flex items-center justify-between flex-shrink-0"
                style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(45,58,29,0.07)' }}>
                <Logo className="w-6 h-6" textClassName="text-sm" />
                <button onClick={() => setAccountOpen(false)}
                  className="w-8 h-8 rounded-full bg-on-surface/5 flex items-center justify-center hover:bg-on-surface/10 transition-all">
                  <X className="w-4 h-4 text-on-surface/40" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto">
                {/* Navigation */}
                <div className="px-5 pt-6 pb-5"
                  style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(45,58,29,0.06)' }}>
                  <p className="text-[7px] uppercase tracking-[0.55em] text-secondary/35 font-bold mb-3 px-1">Navigate</p>
                  <div className="flex flex-col gap-0.5">
                    {allNav.map(item => {
                      const Icon = item.icon;
                      return (
                        <button key={item.id}
                          onClick={() => {
                            if (item.id === 'blog') {
                              onBlogClick();
                            } else {
                              onModeChange(item.id);
                            }
                            setAccountOpen(false);
                          }}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/6 text-left transition-all group">
                          <Icon className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors flex-shrink-0" />
                          <span className="text-[11px] uppercase tracking-[0.35em] font-bold text-on-surface/60 group-hover:text-on-surface transition-colors">{item.name}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-primary/0 group-hover:text-primary/50 ml-auto transition-all -translate-x-1 group-hover:translate-x-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sanctuaries */}
                <div className="px-5 pt-5 pb-5"
                  style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(45,58,29,0.06)' }}>
                  <p className="text-[7px] uppercase tracking-[0.55em] text-secondary/35 font-bold mb-3 px-1">Sanctuaries</p>
                  <div className="flex flex-col gap-2">
                    {sanctuaryItems.map(s => (
                      <button key={s.id}
                        onClick={() => { onPropertySelect(s.id); setAccountOpen(false); }}
                        className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 text-left transition-all group">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={s.img} alt={s.name} referrerPolicy="no-referrer" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">{s.name}</p>
                          <p className="text-[8px] uppercase tracking-widest text-secondary/40 truncate">{s.sub}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div className="px-5 pt-5 pb-6">
                  <p className="text-[7px] uppercase tracking-[0.55em] text-secondary/35 font-bold mb-3 px-1">Account</p>
                  {authUser ? (
                    <div className="flex flex-col gap-2.5">
                      <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-primary/4">
                        {authUser.photoURL ? (
                          <img src={authUser.photoURL} referrerPolicy="no-referrer" loading="lazy" decoding="async" alt="Profile" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm uppercase flex-shrink-0">
                            {avatarLetter}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-on-surface truncate">{authUser.displayName || authUser.email || authUser.phoneNumber}</p>
                          <p className="text-[8px] uppercase tracking-widest text-secondary/40 mt-0.5">{isAdmin ? 'Admin' : 'Member'}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button onClick={() => { setAccountOpen(false); onAdminClick(); }}
                          className="w-full py-3 rounded-xl bg-primary/8 text-primary text-[9px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:bg-primary/15 transition-all">
                          <ShieldCheck className="w-3.5 h-3.5" /> Admin Dashboard
                        </button>
                      )}
                      <button onClick={() => { setAccountOpen(false); onModeChange('map'); }}
                        className="w-full py-3.5 rounded-xl bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                        Explore Map
                      </button>
                      <button onClick={() => { setAccountOpen(false); onSignOut(); }}
                        className="w-full py-3 rounded-xl border border-error/20 text-error text-[9px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:bg-error/5 transition-all">
                        <LogOut className="w-3.5 h-3.5" /> Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      <button onClick={() => { setAccountOpen(false); onSignInClick(); }}
                        className="w-full py-3.5 rounded-xl bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                        Sign In
                      </button>
                      <button onClick={() => { setAccountOpen(false); onNewsletterClick(); }}
                        className="w-full py-3.5 rounded-xl border-2 border-primary/20 text-primary text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-primary/5 transition-all">
                        Get Early Access
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 flex-shrink-0"
                style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(45,58,29,0.06)' }}>
                <p className="text-[7px] uppercase tracking-widest text-secondary/25">© 2026 The Green Team · Hyderabad</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Bottom Tab Bar — mobile persistent navigation ─────────────────────────────
const BottomTabBar = ({ activeMode, onModeChange }: { activeMode: string; onModeChange: (mode: any) => void }) => {
  const tabs = [
    { id: 'home',       label: 'Home',      icon: Home        },
    { id: 'map',        label: 'Map',        icon: MapPin      },
    { id: 'preinvestor-gold', label: 'Gold', icon: Award      },
    { id: 'analytics',  label: 'Edge + Nature', icon: TrendingDown },
    { id: 'membership', label: 'Join',       icon: Shield      },
  ];

  return (
    <div
      className="md:hidden fixed bottom-0 inset-x-0 z-[9980]"
      style={{
        background: 'var(--background)',
        borderTop: '1px solid rgba(45,58,29,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex items-stretch h-16">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;
          const isGold = tab.id === 'preinvestor-gold';
          return (
            <button
              key={tab.id}
              onClick={() => onModeChange(tab.id)}
              className="flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-200"
            >
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full",
                    isGold ? "bg-[#c8a951]" : "bg-primary"
                  )}
                />
              )}
              <Icon className={cn(
                "w-[18px] h-[18px] transition-all duration-200",
                isActive && isGold ? "text-[#c8a951] scale-110" : isActive ? "text-primary scale-110" : "text-secondary/30"
              )} />
              <span className={cn(
                "text-[7px] uppercase tracking-[0.35em] font-bold transition-all duration-200",
                isActive && isGold ? "text-[#c8a951]" : isActive ? "text-primary" : "text-secondary/25"
              )}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


const Hero = ({ onModeChange }: { onModeChange: (mode: string) => void }) => {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Full-bleed backdrop */}
      <div className="absolute inset-0 z-0">
        <img
          src="/hero-backdrop.jpg"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-cover object-center"
        />
        {/* Layered gradient — bottom-heavy for text legibility, preserves the forest house glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208]/90 via-[#0a1208]/40 to-[#0a1208]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208]/70 via-[#0a1208]/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 justify-between px-8 md:px-16 xl:px-20 pt-20 pb-0">

        {/* Top label */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#8aab78' }} />
          <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white/45">
            Independent Curators · Hyderabad, India
          </span>
        </motion.div>

        {/* Main headline */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col justify-center py-12 max-w-3xl"
        >
          <h1 className="text-[3.2rem] sm:text-[4.5rem] md:text-[5.5rem] lg:text-[6rem] xl:text-[6.5rem] font-light text-white leading-[1.0] tracking-tight mb-8">
            Live close<br />
            <span className="italic font-medium" style={{ color: '#a3b18a' }}>to the forest.</span><br />
            <span className="text-white/70">Still reach</span><br />
            <span className="italic font-medium text-white/55">work in 45 min.</span>
          </h1>
          <p className="text-base md:text-xl font-light text-white/55 leading-relaxed max-w-lg mb-12">
            We are channel partners who curate homes near forests — where the air is clean, the design is thoughtful, and the city is still within reach. Apartments, villas, plots — any type, as long as it meets our bar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => onModeChange('membership')}
              className="group px-8 py-4 text-[9px] uppercase tracking-[0.45em] font-bold transition-all duration-300 flex items-center justify-center gap-2"
              style={{ background: '#a3b18a', color: '#0a1208' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#b8c8a0')}
              onMouseLeave={e => (e.currentTarget.style.background = '#a3b18a')}
            >
              See What We Curate
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={() => onModeChange('list')}
              className="px-8 py-4 border border-white/20 text-white/60 text-[9px] uppercase tracking-[0.45em] font-bold hover:border-white/40 hover:text-white transition-all duration-300"
            >
              View Properties
            </button>
          </div>
        </motion.div>
      </div>

      {/* Bottom KPI bar — glassmorphic */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="relative z-10 border-t border-white/8 px-8 md:px-16 xl:px-20 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ background: 'rgba(10,18,8,0.65)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex flex-wrap gap-8 md:gap-14">
          {[
            { label: 'AQI at our curated sites', value: '12 — Pristine' },
            { label: 'Ambient Noise', value: '18 dB' },
            { label: 'Commute to city', value: 'Under 45 min' },
            { label: 'Property types', value: 'Plots · Villas · Flats' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-[7px] uppercase tracking-[0.45em] font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}</p>
              <p className="text-xs font-headline font-bold mt-0.5" style={{ color: 'rgba(255,255,255,0.70)' }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#a3b18a' }} />
          <p className="text-xs font-headline font-bold" style={{ color: '#a3b18a' }}>Open for Reservation</p>
        </div>
      </motion.div>
    </section>
  );
};

// ─── What We Do ──────────────────────────────────────────────────────────────
const WhatWeDo = () => {
  const steps = [
    {
      num: '01',
      title: 'We Find It',
      desc: 'We scout properties near forests, rivers, and open land — where the air quality is verified below AQI 25 and ambient noise stays under 25 dB.',
      icon: <Search className="w-5 h-5" />,
    },
    {
      num: '02',
      title: 'We Verify It',
      desc: 'We check AQI readings, noise levels, commute times, design quality, and developer credentials before we show it to anyone.',
      icon: <Check className="w-5 h-5" />,
    },
    {
      num: '03',
      title: 'We Connect You',
      desc: 'As channel partners, we introduce you directly to the developer. Apartments, villas, plots — any property type that meets our bar qualifies.',
      icon: <ArrowRight className="w-5 h-5" />,
    },
  ];

  return (
    <section className="py-20 px-6 md:px-24 bg-surface border-b border-outline/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">How it works</span>
          <h2 className="text-4xl md:text-5xl font-light text-on-surface leading-tight">
            We are channel partners.<br />
            <span className="italic font-medium text-primary">We curate, you decide.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-outline/10">
          {steps.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface p-10"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-bold text-primary/40 tracking-[0.5em]">{s.num}</span>
                <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center text-primary">
                  {s.icon}
                </div>
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-3">{s.title}</h3>
              <p className="text-secondary leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Why It Matters ───────────────────────────────────────────────────────────
const WhyItMatters = () => {
  const rows = [
    { metric: 'Air Quality (AQI)', tgt: '12 — Pristine', city: '100–180 — Unhealthy', better: true },
    { metric: 'Ambient Noise', tgt: '18 dB', city: '65+ dB', better: true },
    { metric: 'Forest / Nature', tgt: 'On your doorstep', city: '45 min drive', better: true },
    { metric: 'Commute to office', tgt: 'Under 45 min', city: 'Already there', better: false },
    { metric: 'Property types', tgt: 'Plots, Villas, Flats', city: 'All types', better: false },
  ];

  return (
    <section className="py-20 px-6 md:px-24 bg-surface-container-low border-b border-outline/10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">Why it matters</span>
          <h2 className="text-4xl md:text-5xl font-light text-on-surface leading-tight">
            You can live near a forest<br />
            <span className="italic font-medium text-primary">and still be close to work.</span>
          </h2>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline/20">
                <th className="text-left py-4 pr-8 text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50 w-1/3">What we measure</th>
                <th className="text-left py-4 pr-8 text-[10px] uppercase tracking-[0.5em] font-bold text-primary/70">Our curated sites</th>
                <th className="text-left py-4 text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50">Typical city</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {rows.map((r, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <td className="py-5 pr-8 font-medium text-on-surface/70">{r.metric}</td>
                  <td className="py-5 pr-8">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 font-headline font-bold",
                      r.better ? "text-primary" : "text-on-surface/80"
                    )}>
                      {r.better && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      {r.tgt}
                    </span>
                  </td>
                  <td className="py-5 text-secondary/60">{r.city}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

// ─── Our Checklist ────────────────────────────────────────────────────────────
const EcosystemPillars = ({ isFullPage = false }: { isFullPage?: boolean }) => {
  const checks = [
    {
      icon: '🌿',
      title: 'Forest & Nature',
      desc: 'The property must sit within or right next to forest, hills, or open green land — not just a park. If it\'s a drive away, it doesn\'t qualify.',
      proof: 'Agartha (live): surrounded by forest reserve',
    },
    {
      icon: '💨',
      title: 'Clean air — AQI under 25',
      desc: 'We check AQI data before we show any property. City air is 100–180. Our minimum standard is below 25. Breathing matters where you live.',
      proof: 'Current site: AQI 12',
    },
    {
      icon: '🏗️',
      title: 'Well-designed, built to last',
      desc: 'We only work with developers whose architecture has won recognition. Biophilic layouts, natural materials, spaces that feel like they belong in the landscape.',
      proof: 'Partner: MODCON × ARQEN · Eco Award 2024',
    },
    {
      icon: '🚗',
      title: 'Office within 45 minutes',
      desc: 'Living in nature shouldn\'t mean sacrificing your commute. Every property we recommend is reachable from Hyderabad\'s key corridors within 45 min.',
      proof: 'RRR / ORR proximity verified',
    },
  ];

  return (
    <section id="ecosystems" className={cn(
      "bg-forest-section text-[#e0dace]",
      isFullPage ? "py-24 px-6 md:px-24" : "py-20 px-6 md:px-24"
    )}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.6em] mb-5 block">Our bar</span>
          <h2 className="text-4xl md:text-6xl font-light text-[#e0dace] leading-tight">
            Four things every property<br />
            <span className="italic font-medium" style={{ color: '#a3b18a' }}>must pass.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5">
          {checks.map((c, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-forest-section p-10 hover:bg-white/[0.03] transition-colors"
            >
              <div className="text-3xl mb-5">{c.icon}</div>
              <h3 className="text-xl font-headline font-bold text-[#e0dace] mb-3">{c.title}</h3>
              <p className="text-white/40 leading-relaxed text-sm mb-4">{c.desc}</p>
              <p className="text-[9px] uppercase tracking-[0.4em] font-bold" style={{ color: '#a3b18a' }}>{c.proof}</p>
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
      "px-6 md:px-24 bg-surface border-y border-outline/10",
      isFullPage ? "py-20" : "py-14"
    )}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">The TGT Edge</span>
          <h2 className="text-4xl md:text-6xl font-light text-on-surface leading-tight">
            We are <span className="italic text-primary">channel partners.</span><br />
            Not developers. Not portals.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-secondary leading-relaxed max-w-3xl">
            We independently curate properties, verify every claim ourselves, and connect you with the developer directly. No middleman markup — just our honest recommendation. Our edge lies in our rigorous selection process and our commitment to transparency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-headline font-bold text-on-surface">What is the Pre-Investor Phase?</h3>
            <p className="text-secondary leading-relaxed">
              The Pre-Investor Phase is the most exclusive window in a property's lifecycle. It occurs after land acquisition and initial planning, but before the official public launch.
            </p>
            <p className="text-secondary leading-relaxed">
              During this period, we offer our members the opportunity to secure units at "ground-floor" pricing—often 20-30% below the eventual market rate. This phase is characterized by high capital appreciation potential as the project moves toward official RERA registration and public marketing.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary/5 p-8 rounded-3xl border border-primary/10"
          >
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-widest mb-4">Why it matters</h4>
            <ul className="space-y-4">
              {[
                { title: 'Maximum Appreciation', desc: 'Entry at the lowest possible price point.' },
                { title: 'Priority Selection', desc: 'First-right-of-refusal on the best plots/units.' },
                { title: 'Verified Potential', desc: 'We only curate projects with clear growth trajectories.' },
              ].map((item, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-on-surface">{item.title}</p>
                    <p className="text-xs text-secondary">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const PreInvestorGold = () => {
  return (
    <section className="py-24 px-6 md:px-24 bg-[#0a1208] text-white overflow-hidden relative">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#c8a951]/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#c8a951]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-px bg-[#c8a951]" />
            <span className="text-[#c8a951] text-[10px] font-bold uppercase tracking-[0.8em]">Current Gold Fish</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-light leading-tight mb-8">
            SYL Residences <span className="italic font-medium text-[#c8a951]">Gold™</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/60 font-light max-w-3xl leading-relaxed">
            Agartha investors gained +37% in 18 months. SYL Residences is the next opportunity — and you're still in the pre-investor window.
          </p>
        </motion.div>

        {/* Investment Roadmap Table */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5">
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Phase</div>
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Timeline</div>
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Rate (SFT)</div>
          </div>
          <div className="grid grid-cols-3 border-b border-white/10 bg-[#c8a951]/10">
            <div className="p-8 font-bold text-[#c8a951]">Pre-Investor</div>
            <div className="p-8 text-white/80">Now Running</div>
            <div className="p-8 font-headline text-2xl text-[#c8a951]">₹4,499</div>
          </div>
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="p-8 font-medium text-white/60">Pre-Launch</div>
            <div className="p-8 text-white/40">At Booking Milestone</div>
            <div className="p-8 text-white/60">Higher</div>
          </div>
          <div className="grid grid-cols-3">
            <div className="p-8 font-medium text-white/60">Public Launch</div>
            <div className="p-8 text-white/40">Market Launch</div>
            <div className="p-8 text-white/60">Market Rate</div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12">
          {[
            {
              title: 'Lowest Possible Rate',
              desc: 'Pre-investor pricing is always below the pre-launch and public launch rate. Once booking targets are hit, this phase closes.',
              icon: <TrendingDown className="w-6 h-6 text-[#c8a951]" />
            },
            {
              title: 'First Pick of Units',
              desc: 'Best floor plans, preferred views, and corner units go to pre-investors — before the project is even advertised.',
              icon: <Award className="w-6 h-6 text-[#c8a951]" />
            },
            {
              title: 'Appreciation from Day One',
              desc: 'Tukkuguda is in Hyderabad\'s 4th City corridor. Early investors capture the full growth curve from ground up.',
              icon: <Zap className="w-6 h-6 text-[#c8a951]" />
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="mb-6 p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#c8a951]/50 transition-colors">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-[#c8a951] transition-colors">{item.title}</h3>
              <p className="text-white/50 leading-relaxed text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>


      </div>
    </section>
  );
};

const SanctuaryCard: FC<{ sanctuary: Sanctuary, isSubscribed: boolean, onNewsletterClick: () => void, onOpen: () => void }> = ({ sanctuary, isSubscribed, onNewsletterClick, onOpen }) => {
  const isSyl = sanctuary.id === 'syl';
  const isDatesCounty = sanctuary.id === 'dates-county';
  const isGated = isSyl && !isSubscribed;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group relative aspect-square overflow-hidden rounded-3xl cursor-pointer bg-[#1a1f0e]"
      onClick={() => { if (!isGated) onOpen(); }}
    >
      {/* Full-bleed image — always full color */}
      <img
        src={sanctuary.image}
        alt={sanctuary.title}
        loading="lazy"
        decoding="async"
        className={cn(
          "absolute inset-0 w-full h-full object-cover transition-all duration-700",
          isGated
            ? "brightness-40 scale-105 blur-sm"
            : "brightness-80 group-hover:brightness-95 group-hover:scale-105"
        )}
        referrerPolicy="no-referrer"
      />

      {/* Warm cream-olive gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a0a]/90 via-[#1a1a0a]/20 to-transparent pointer-events-none" />

      {/* Gated overlay for SYL */}
      {isGated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#c8a951]/15 border border-[#c8a951]/30 flex items-center justify-center mb-5">
            <Shield className="w-6 h-6 text-[#c8a951]" />
          </div>
          <h4 className="text-xl font-headline font-bold text-white mb-2">Newsletter Access Required</h4>
          <p className="text-xs text-white/50 mb-6 max-w-[200px] leading-relaxed">
            MODCON SYL Residences is reserved for our newsletter subscribers.
          </p>
          <button onClick={e => { e.stopPropagation(); onNewsletterClick(); }}
            className="px-6 py-3 bg-[#c8a951] text-[#1a1a0a] text-[9px] uppercase tracking-widest font-bold rounded-xl hover:bg-white transition-all">
            Subscribe to Unlock
          </button>
        </div>
      )}

      {/* Top badge */}
      <div className="absolute top-5 left-5 z-20 flex flex-col gap-2">
        <span className={cn(
          "px-3 py-1 text-[8px] uppercase tracking-[0.4em] font-bold rounded-full",
          isSyl
            ? "bg-[#c8a951] text-[#1a1a0a]"
            : isDatesCounty
              ? "bg-[#c07a3d] text-[#1a1a0a]"
              : "bg-primary/90 text-on-primary backdrop-blur-sm"
        )}>
          {isSyl ? 'Pre-Investor Phase' : isDatesCounty ? 'Now Booking' : 'Open Reservation'}
        </span>
        <span className="px-3 py-1 text-[7px] uppercase tracking-[0.35em] font-bold rounded-full bg-black/75 text-white/90 backdrop-blur-md border border-white/20 shadow-lg w-fit">
          {isDatesCounty ? 'TGT × Planet Green' : 'TGT Channel Partner'}
        </span>
        {isSyl && (
          <span className="px-3 py-1 text-[8px] font-bold rounded-full bg-[#c8a951]/20 text-[#c8a951] backdrop-blur-sm border border-[#c8a951]/40 w-fit leading-relaxed">
            Pre-Investor Gold™
          </span>
        )}
        {isDatesCounty && (
          <span className="px-3 py-1 text-[8px] font-bold rounded-full bg-[#c07a3d]/20 text-[#c07a3d] backdrop-blur-sm border border-[#c07a3d]/40 w-fit leading-relaxed">
            4,000-Acre Reserve
          </span>
        )}
      </div>

      {/* Bottom info — hide price for gated SYL */}
      <div className={cn("absolute bottom-0 left-0 right-0 px-6 pb-6 pt-10 z-20", isGated && "opacity-0")}>
        <div className="flex items-end justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/60 font-bold mb-1 truncate">{sanctuary.commute}</p>
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
                {sanctuary.valuation && <p className="text-sm text-white/40 line-through">{sanctuary.valuation}</p>}
                <p className="text-xl font-headline font-bold text-white">{sanctuary.memberPrice}</p>
              </>
            )}
          </div>
        </div>
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
            onClick={e => { e.stopPropagation(); onOpen(); }}
            className="flex-shrink-0 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[8px] uppercase tracking-widest font-bold rounded-xl hover:bg-primary hover:border-primary transition-all"
          >
            View Details
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SanctuaryPopupContent = ({ loc, onViewDetails }: { loc: any; onViewDetails?: () => void }) => {
  const sanctuary = loc.type === 'sanctuary' ? SANCTUARIES.find(s => s.id === loc.id) : null;
  const heroImage = sanctuary?.image || loc.image;
  const isSyl = sanctuary?.id === 'syl';
  const isDatesCounty = sanctuary?.id === 'dates-county';
  const title = sanctuary?.title || loc.title;
  const subtitle = sanctuary?.commute || loc.location;
  const price = sanctuary?.memberPrice;
  const pricePerSqYd = sanctuary?.pricePerSqYd;
  const aqiPristine = loc.aqi != null && loc.aqi <= 50;
  const noiseCalm = loc.noise != null && loc.noise <= 50;

  // Non-sanctuary (exits, zones) keep a condensed variant.
  if (!sanctuary) {
    return (
      <div className="w-72 overflow-hidden rounded-2xl border border-white/5" style={{ background: 'rgba(13,20,9,0.96)', backdropFilter: 'blur(20px)', boxShadow: '0 24px 48px rgba(0,0,0,0.7)' }}>
        <div className="relative h-28 overflow-hidden">
          {loc.image ? (
            <img src={loc.image} alt={loc.title} loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-white/[0.03]">
              <MapPin className="w-8 h-8 text-white/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d1409] via-transparent to-transparent" />
          {loc.aqi != null && (
            <div className="absolute bottom-2.5 left-3 flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: aqiPristine ? '#4ade80' : '#f87171' }} />
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: aqiPristine ? '#4ade80' : '#f87171' }}>
                AQI {loc.aqi} · {aqiPristine ? 'Pristine' : 'Compromised'}
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h4 className="font-headline font-bold text-base uppercase tracking-wider leading-tight text-white/90">{loc.title}</h4>
          <p className="text-[9px] uppercase tracking-widest text-white/35 mt-0.5">{loc.location}</p>
          {loc.description && (
            <p className="text-[10px] leading-relaxed text-white/45 mt-3">
              {loc.type === 'exit' ? 'Strategic access via Outer Ring Road — fast connectivity, urban-level pollution.' : loc.description}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Sanctuary variant — mirrors the website's SanctuaryCard aesthetic.
  return (
    <div
      className="w-[320px] overflow-hidden rounded-3xl"
      style={{
        background: '#0c1208',
        border: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 32px 72px rgba(0,0,0,0.75)',
      }}
    >
      {/* Hero image */}
      <div className="relative h-44 overflow-hidden bg-[#0c1208]">
        <img
          src={heroImage}
          alt={title}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a0a]/95 via-[#1a1a0a]/25 to-transparent" />

        {/* Top-left badge stack */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span
            className={cn(
              'px-2.5 py-1 text-[8px] uppercase tracking-[0.35em] font-bold rounded-full w-fit',
              isSyl
                ? 'bg-[#c8a951] text-[#1a1a0a]'
                : isDatesCounty
                  ? 'bg-[#c07a3d] text-[#1a1a0a]'
                  : 'bg-primary/95 text-on-primary backdrop-blur-sm'
            )}
          >
            {isSyl ? 'Pre-Investor Phase' : isDatesCounty ? 'Now Booking' : 'Open Reservation'}
          </span>
          <span className="px-2.5 py-0.5 text-[7px] uppercase tracking-[0.3em] font-bold rounded-full bg-black/75 text-white/90 border border-white/20 shadow-lg w-fit">
            {isDatesCounty ? 'TGT × Planet Green' : 'TGT Channel Partner'}
          </span>
          {isSyl && (
            <span className="px-2.5 py-0.5 text-[8px] font-bold rounded-full bg-[#c8a951]/20 text-[#c8a951] border border-[#c8a951]/40 w-fit">
              Pre-Investor Gold™
            </span>
          )}
        </div>

        {/* Top-right live AQI pill */}
        {loc.aqi != null && (
          <div
            className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(5,8,4,0.75)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: aqiPristine ? '#4ade80' : '#f87171' }} />
            <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: aqiPristine ? '#4ade80' : '#f87171' }}>
              AQI {loc.aqi}
            </span>
          </div>
        )}

        {/* Bottom hero overlay: title + price */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-8">
          <p className="text-[8px] uppercase tracking-[0.35em] text-white/65 font-bold mb-1 truncate">
            {subtitle}
          </p>
          <div className="flex items-end justify-between gap-2">
            <h4 className="font-headline font-bold text-white leading-tight text-lg truncate">
              {title}
            </h4>
            {price && (
              <div className="text-right flex-shrink-0">
                {pricePerSqYd && (
                  <p className="text-[8px] text-white/45">₹{pricePerSqYd.toLocaleString('en-IN')}/sq yd</p>
                )}
                <p className="font-headline font-bold text-white text-sm leading-tight">{price}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-4 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <Wind className="w-3.5 h-3.5" style={{ color: aqiPristine ? '#4ade80' : '#f87171' }} />
          <div className="leading-tight">
            <p className="text-[7px] uppercase tracking-widest text-white/35 font-bold">Air</p>
            <p className="text-[10px] font-bold text-white/90">{loc.aqi} · {aqiPristine ? 'Pristine' : 'Urban'}</p>
          </div>
        </div>
        <div className="w-px h-6 bg-white/10" />
        <div className="flex items-center gap-1.5">
          <VolumeX className="w-3.5 h-3.5" style={{ color: noiseCalm ? '#4ade80' : '#fb923c' }} />
          <div className="leading-tight">
            <p className="text-[7px] uppercase tracking-widest text-white/35 font-bold">Noise</p>
            <p className="text-[10px] font-bold text-white/90">{loc.noise} dB · {noiseCalm ? 'Silent' : 'Chaotic'}</p>
          </div>
        </div>
      </div>

      {/* Feature pills */}
      {sanctuary.features && sanctuary.features.length > 0 && (
        <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
          {sanctuary.features.slice(0, 3).map((f) => (
            <span
              key={f}
              className="px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest bg-white/[0.04] border border-white/10 text-white/55"
            >
              {f}
            </span>
          ))}
        </div>
      )}

      {/* CTA footer */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <span className="text-[8px] uppercase tracking-[0.35em] font-bold text-white/40">
          Tap to explore
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onViewDetails) onViewDetails();
          }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[8px] uppercase tracking-widest font-bold transition-all hover:brightness-110 active:scale-95 cursor-pointer',
            isSyl
              ? 'bg-[#c8a951] text-[#1a1a0a]'
              : isDatesCounty
                ? 'bg-[#c07a3d] text-[#1a1a0a]'
                : 'bg-primary text-on-primary'
          )}
        >
          View Details
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1.5 4h5M4 1.5l2.5 2.5L4 6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
};

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
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    if (isVisible) {
      t1 = setTimeout(() => { map.invalidateSize(); }, 150);
      t2 = setTimeout(() => { map.invalidateSize(); onReady(); }, 1800); 
    }
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [isVisible, map, onReady]);
  return null;
};

// ──  Generic Property Interactive Layout ────────────────────────────────────" 

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
  developerTag: string;   // e.g. MODCON Builders  Narsapur
  tagline: string;        // e.g. 53 plots  Forest community  From ₹64.6 L
  brochureUrl?: string;
  intentPrefix: string;   // used in lead: Agartha - Organic Amenity Core
}

/**
 * PropertyInteractiveLayout
 * Reusable full-screen overlay: site plan left, feature info + lead form right.
 * This is the template for ALL property cards - Agartha and future listings.
 */
const PropertyInteractiveLayout: FC<PropertyLayoutConfig & { onClose: () => void }> = ({
  sitePlanSrc, sitePlanFallback, hotspots, projectName, developerTag, tagline,
  brochureUrl, intentPrefix, onClose,
}) => {
  const [active, setActive] = useState<Hotspot>(hotspots[0]);


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-[#0a0f07] flex flex-col md:flex-row overflow-hidden"
    >
      {/* ── LEFT: Full Site Plan - scrollable on mobile, fills screen on desktop ── */}
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

        {/* Site plan image - full portrait, no cropping */}
        <div className="relative flex-1 md:absolute md:inset-0 md:flex md:items-center md:justify-center">
          <img
            src={sitePlanSrc}
            alt={`${projectName} site plan`}
            loading="lazy"
            decoding="async"
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

          <div className="border-t border-white/5 pt-6">
            <p className="text-[8px] uppercase tracking-[0.4em] text-white/30 font-bold mb-1">Status</p>
            <p className="text-xs text-white/40 leading-relaxed italic">
              Available for private reservation. Contact your advisor for details.
            </p>
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
    id: 'amenity-core', num: 1, x: 52, y: 68,
    label: '36,000 Sq Ft Clubhouse',
    tag: '5 Premium Amenities',
    detail: 'The 36,000 sq ft heart of Agartha. 5 premium amenities: a resort-style aquatic pool, fully-equipped gym, kayaking lake, farm-to-table restaurant, and children\'s play area. Staycation villas for weekend escapes — without leaving the forest.',
    stats: [{ label: 'Clubhouse', value: '36,000 sq ft' }, { label: 'Amenities', value: '5 Premium' }, { label: 'Access', value: 'Residents + guests' }],
  },
  {
    id: 'forest-buffer', num: 2, x: 8, y: 40,
    label: 'Narsapur Forest Buffer',
    tag: 'AQI 12',
    detail: 'Direct boundary with the Narsapur forest reserve. AQI 12 — one of the cleanest micro-climates in the Hyderabad metro. Native bird corridors, natural white noise, and a living green lung at your doorstep.',
    stats: [{ label: 'AQI', value: '12 — Pristine' }, { label: 'Noise', value: '18 dB' }, { label: 'Forest', value: 'Native Dry Deciduous' }],
  },
  {
    id: 'goshala', num: 3, x: 36, y: 82,
    label: 'Goshala & Organic Farm',
    tag: 'Farm-to-Table',
    detail: 'An on-site Goshala with integrated animal husbandry for holistic farming. Each plot is pre-planted with 100+ tree varieties, advanced drip irrigation, vegetable beds, and a spiral herbal garden — your private edible forest.',
    stats: [{ label: 'Trees / Plot', value: '100+ varieties' }, { label: 'Irrigation', value: 'Drip system' }, { label: 'Farming', value: 'Permaculture' }],
  },
  {
    id: 'premium-corner', num: 4, x: 15, y: 33,
    label: 'Premium Corner — Plot 3',
    tag: '4,800 Sq Yds · ₹4.08 Cr',
    detail: 'The largest plot in Agartha. Corner positioning on the forest boundary gives maximum green frontage and the greatest separation from neighbours. At ₹8,500/sq yd: ₹4.08 Cr.',
    stats: [{ label: 'Size', value: '~4,800 sq yds' }, { label: 'Price', value: '~₹4.08 Cr' }, { label: 'Frontage', value: 'Forest boundary' }],
  },
  {
    id: 'plot-community', num: 5, x: 62, y: 48,
    label: '36-Plot Private Community',
    tag: 'From ₹68.7 L',
    detail: '36 unique farm plots across 25 acres — each pre-planted and drip-irrigated. Sizes from 808 to 4,800 sq yds at ₹8,500/sq yd. Near RRR, 40 mins from Financial District. Winner: Best Eco-Friendly Project 2024.',
    stats: [{ label: 'Total Area', value: '25 Acres' }, { label: 'Starting', value: '₹68.7 L' }, { label: 'Rate', value: '₹8,500/sq yd' }],
  },
];

// ──"  Agartha: 36 individual plot dots ────────────────────────────────────────
// Positions (x%, y%) mapped from the official FINAL-LAYOUT site plan image.
// Plot 3 = largest irregular corner plot (~4,800 sq yds, forest boundary).

interface PlotDot { id: number; sqYds: number; x: number; y: number }

const AGARTHA_PLOTS: PlotDot[] = [
  // ── Top row (above main grid) ──
  { id:1,  sqYds:1003, x:53, y:18 },
  { id:2,  sqYds:968,  x:42, y:22 },
  // ── PLOT 3 — Large irregular corner (forest boundary) ──
  { id:3,  sqYds:4800, x:15, y:33 },
  // ── Row 2 (left → right) ──
  { id:4,  sqYds:1690, x:37, y:35 },
  { id:5,  sqYds:1249, x:48, y:32 },
  // ── Row 3 (left → right) ──
  { id:7,  sqYds:1140, x:21, y:44 },
  { id:6,  sqYds:1167, x:33, y:44 },
  { id:10, sqYds:1200, x:44, y:45 },
  // ── Row 4 (left → right) ──
  { id:8,  sqYds:1120, x:21, y:53 },
  { id:9,  sqYds:1080, x:33, y:53 },
  // ── Row 5 (left → right) ──
  { id:11, sqYds:1050, x:21, y:62 },
  { id:12, sqYds:1100, x:32, y:62 },
  { id:13, sqYds:1150, x:44, y:62 },
  // ── Row 6 ──
  { id:14, sqYds:1300, x:21, y:71 },
  // ── Row 7 ──
  { id:15, sqYds:1400, x:21, y:79 },
  { id:16, sqYds:1350, x:33, y:79 },
  // ── Row 8 ──
  { id:17, sqYds:1250, x:21, y:87 },
  { id:18, sqYds:1200, x:33, y:87 },
  // ── Bottom row ──
  { id:19, sqYds:1100, x:21, y:93 },
  { id:20, sqYds:1050, x:36, y:93 },
  // ── Right section, row 2 ──
  { id:21, sqYds:1210, x:59, y:33 },
  { id:23, sqYds:1450, x:68, y:32 },
  { id:24, sqYds:1600, x:78, y:27 },
  // ── Right section, row 3 ──
  { id:22, sqYds:1320, x:59, y:44 },
  { id:25, sqYds:1550, x:78, y:38 },
  { id:33, sqYds:1500, x:83, y:45 },
  // ── Right section, row 4 ──
  { id:26, sqYds:1869, x:59, y:54 },
  { id:27, sqYds:1700, x:70, y:51 },
  { id:34, sqYds:1550, x:83, y:54 },
  // ── Right section, row 5 ──
  { id:28, sqYds:2057, x:70, y:62 },
  { id:32, sqYds:1650, x:80, y:62 },
  { id:35, sqYds:1600, x:83, y:63 },
  // ── Right section, row 6 ──
  { id:29, sqYds:1800, x:70, y:71 },
  { id:31, sqYds:1900, x:80, y:71 },
  // ── Right section, rows 7-8 ──
  { id:30, sqYds:1750, x:70, y:82 },
  { id:36, sqYds:1700, x:83, y:79 },
];

const AGARTHA_OLD_RATE = 6199;   // ₹/sq yd - VIP pre-launch rate (2 yrs ago)
const AGARTHA_NOW_RATE = 8500;   // ₹/sq yd - current rate

/** dot diameter: scales linearly from 6px (968 sq yd) to 18px (4800 sq yd) */
const plotDotSize = (sqYds: number) =>
  6 + Math.min(1, Math.max(0, (sqYds - 968) / (4800 - 968))) * 12;

const formatRs = (rs: number) =>
  rs >= 1e7 ? `₹${(rs / 1e7).toFixed(2)} Cr` : `₹${(rs / 1e5).toFixed(1)} L`;

/** lookup: sanctuary id → its 36 plot dots */
const SANCTUARY_PLOTS: Record<string, PlotDot[]> = {
  agartha: AGARTHA_PLOTS,
};

/**
 * SANCTUARY_HOTSPOTS - maps sanctuary id - its interactive site plan dots.
 * Add any new property here when it has a site plan.
 */
const SANCTUARY_HOTSPOTS: Record<string, Hotspot[]> = {
  agartha: AGARTHA_HOTSPOTS,
};

/** Agartha-specific wrapper - delegates to the generic PropertyInteractiveLayout */
const AagarthaInteractiveLayout: FC<{ onClose: () => void }> = ({ onClose }) => (
  <PropertyInteractiveLayout
    sitePlanSrc="/FINAL-LAYOUT.jpeg"
    hotspots={AGARTHA_HOTSPOTS}
    projectName="Agartha"
    developerTag="MODCON Builders · Narsapur"
    tagline="36 plots · Forest community · From ₹68.7 L"
    brochureUrl="https://www.modconbuilders.com/agartha"
    intentPrefix="Agartha"
    onClose={onClose}
  />
);

// ──────────────────────────────────────────────────────────────────────────── 

// ──"  Admin ────────────────────────────────────────────────────────────────────
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

  const inputCls = "w-full bg-surface border border-outline/40 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-on-surface/30 focus:border-primary transition-all";
  const labelCls = "block text-[9px] uppercase tracking-[0.4em] font-bold text-on-surface/70 mb-1.5";

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
                    {p.image && <img src={p.image} alt={p.title} loading="lazy" decoding="async" className="w-full h-full object-cover" referrerPolicy="no-referrer" />}
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
                        {p.status === 'live' ? '— Live' : '—  Draft'}
                      </button>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => openEdit(p)}
                        className="text-[9px] uppercase tracking-widest font-bold text-secondary/60 hover:text-primary transition-colors px-3 py-1.5 border border-outline/15 rounded-lg">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(p.id)} disabled={deleting === p.id}
                        className="text-[9px] uppercase tracking-widest font-bold text-error/60 hover:text-error transition-colors px-3 py-1.5 border border-error/10 rounded-lg hover:border-error/30 disabled:opacity-40">
                        {deleting === p.id ? 'Deleting ' : 'Delete'}
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
                <p className="text-[9px] text-secondary/30 -mt-2">Get from Google Maps - right-click - copy coordinates</p>
              </div>

              {/* Section: Media */}
              <div className="space-y-4">
                <p className="text-[8px] uppercase tracking-[0.5em] text-secondary/40 font-bold border-b border-outline/10 pb-2">Media &amp; Links</p>
                <div>
                  <label htmlFor="adm-image" className={labelCls}>Hero Image URL</label>
                  <input id="adm-image" name="image" className={inputCls} placeholder="https://..." value={form.image}
                    onChange={e => set('image', e.target.value)} />
                  {form.image && (
                    <img src={form.image} alt="preview" loading="lazy" decoding="async" referrerPolicy="no-referrer"
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
                    {form.status === 'live' ? 'Live - visible on site' : 'Draft - hidden'}
                  </span>
                </div>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-3 bg-primary text-on-primary text-[9px] uppercase tracking-[0.4em] font-bold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5" />
                  {saving ? 'Saving ' : editingId ? 'Update' : 'Publish'}
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
                    <Mail className="w-3 h-3" />{l.email}
                  </p>
                  {(l as any).phone && (
                    <p className="text-xs text-primary/70 flex items-center gap-1.5 font-medium">
                      <Phone className="w-3 h-3" />{(l as any).phone}
                    </p>
                  )}
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
                        ? <img src={u.photoURL} referrerPolicy="no-referrer" loading="lazy" decoding="async" alt={u.displayName || u.email || 'User avatar'} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
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

// ──  Feature icon helper ──────────────────────────────────────────────────────" 
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
  const [pdTab, setPdTab]             = useState<'gallery' | 'plan' | 'invest'>('gallery');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const [activeSpot, setActiveSpot]   = useState<Hotspot | null>(hotspots?.[0] ?? null);
  const [activePlot, setActivePlot]   = useState<PlotDot | null>(null);
  const [mapMode, setMapMode]         = useState<'plots' | 'features'>(plotDots ? 'plots' : 'features');
  const commuteTime = sanctuary.commute.match(/\d+/)?.[0] ?? '—';
  const commuteDest = sanctuary.commute.replace(/^\d+ mins? to /i, '');

  const badge = sanctuary.id === 'syl' ? 'Upcoming' : 'Open for Reservation';


  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed inset-0 z-[10000] flex flex-col bg-surface overflow-hidden"
    >
      {/* ── Header — title + price + close ── */}
      <div className="px-5 pt-4 pb-4 border-b border-outline/10 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {sanctuary.tagline && (
              <p className="text-[8px] uppercase tracking-[0.5em] text-primary font-bold mb-0.5 truncate">{sanctuary.tagline}</p>
            )}
            <h2 className="text-lg font-headline font-bold text-on-surface leading-tight">{sanctuary.title}</h2>
            
            {sanctuary.id === 'syl' && (
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-[#c8a951] text-[#1a1a0a] text-[7px] uppercase tracking-[0.3em] font-bold rounded-md shadow-sm">
                  Pre-Investor Gold™
                </span>
                <span className="px-2 py-0.5 border border-[#c8a951]/40 text-[#c8a951] text-[7px] uppercase tracking-[0.3em] font-bold rounded-md">
                  Pre-Investment Phase
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-secondary text-[11px] mt-1.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{sanctuary.location}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 flex-shrink-0">
            <div className="text-right">
              {sanctuary.pricePerSqYd ? (
                <>
                  <p className="text-lg font-headline font-bold text-primary leading-tight">
                    ₹{sanctuary.pricePerSqYd.toLocaleString('en-IN')}
                    <span className="text-[10px] font-normal text-secondary/60">/sq yd</span>
                  </p>
                  <p className="text-[9px] text-secondary/50">{sanctuary.memberPrice}</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-headline font-bold text-primary">{sanctuary.memberPrice}</p>
                  {sanctuary.valuation && <p className="text-[10px] text-secondary/40 line-through">{sanctuary.valuation}</p>}
                  {sanctuary.id === 'syl' && <p className="text-[9px] text-secondary/50">2,500 – 4,500 SFT</p>}
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-on-surface/10 hover:bg-on-surface/20 flex items-center justify-center transition-all"
            >
              <X className="w-4 h-4 text-on-surface" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex border-b border-outline/10 flex-shrink-0">
        {(['gallery', 'plan', 'invest'] as const).map(t => (
          <button key={t} onClick={() => setPdTab(t)}
            className={cn(
              "flex-1 py-3 text-[9px] uppercase tracking-[0.25em] font-bold transition-all border-b-2",
              pdTab === t ? "text-primary border-primary" : "text-secondary/40 border-transparent hover:text-secondary/70"
            )}>
            {t === 'gallery' ? 'Gallery' : t === 'plan' ? 'Layout Plan' : 'Invest'}
          </button>
        ))}
      </div>

      {/* ── Tab content — scrollable ── */}
      <div className="flex-1 overflow-y-auto pb-24 md:pb-0">

        {/* ── GALLERY TAB ── */}
        {pdTab === 'gallery' && (() => {
          const images = sanctuary.plotImages && sanctuary.plotImages.length > 0
            ? sanctuary.plotImages
            : [sanctuary.image];
          return (
            <div className="py-2">
              {/* SYL Pre-Investor Gold Opportunity Section */}
              {sanctuary.id === 'syl' && (
                <div className="px-5 mb-6">
                  <div 
                    className="rounded-2xl p-5 border border-[#c8a951]/30 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, rgba(200,169,81,0.08) 0%, rgba(200,169,81,0.03) 100%)' }}
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="w-4 h-4 text-[#c8a951]" />
                        <span className="text-[#c8a951] text-[9px] font-bold uppercase tracking-[0.4em]">Pre-Investor Gold™ Opportunity</span>
                      </div>
                      <h3 className="text-lg font-headline font-bold text-on-surface mb-2 leading-tight">
                        Exclusive Partner Advantage
                      </h3>
                      <p className="text-[11px] text-secondary/80 leading-relaxed mb-4">
                        In partnership with **MODCON Builders**, The Green Team members gain exclusive first-right access at ground-floor pricing during this Pre-Investment Phase.
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-[#c8a951]/10 rounded-xl border border-[#c8a951]/20">
                          <p className="text-[8px] uppercase tracking-widest text-[#c8a951] font-bold mb-0.5">Early Entry Rate</p>
                          <p className="text-lg font-headline font-bold text-[#c8a951]">₹4,499 / SFT</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] text-on-surface/60 font-medium">Securing early appreciation before the public launch.</p>
                        </div>
                      </div>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#c8a951]/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Masonry-style grid — tap to open lightbox */}
              <div className="grid grid-cols-2 gap-0.5">
                {images.map((src, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIdx(i)}
                    className={cn(
                      "relative overflow-hidden focus:outline-none group",
                      i === 0 ? "col-span-2 h-56" : "h-36"
                    )}
                  >
                    <img
                      src={src}
                      alt={`${sanctuary.title} — photo ${i + 1}`}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      loading={i < 4 ? 'eager' : 'lazy'}
                    />
                    {/* Tap hint overlay on first image */}
                    {i === 0 && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent flex items-end justify-end p-3">
                        <span className="text-[8px] uppercase tracking-widest font-bold text-white/60 bg-black/30 px-2 py-1 rounded-full backdrop-blur-sm">
                          Tap to expand
                        </span>
                      </div>
                    )}
                    {/* Image counter badge */}
                    {i === 0 && images.length > 1 && (
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm">
                        <span className="text-[8px] font-bold text-white/70">{images.length} photos</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Lightbox */}
              {lightboxIdx !== null && createPortal(
                <motion.div
                  key="lightbox"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[20000] bg-black flex flex-col"
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    if (touchStartX.current === null) return;
                    const dx = e.changedTouches[0].clientX - touchStartX.current;
                    touchStartX.current = null;
                    if (Math.abs(dx) < 40) return;
                    if (dx < 0) setLightboxIdx(i => i !== null ? Math.min(i + 1, images.length - 1) : null);
                    else setLightboxIdx(i => i !== null ? Math.max(i - 1, 0) : null);
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3 flex-shrink-0">
                    <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-white/40">
                      {lightboxIdx + 1} / {images.length}
                    </span>
                    <button onClick={() => setLightboxIdx(null)}
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                      <X className="w-4 h-4 text-white/70" />
                    </button>
                  </div>

                  {/* Main image */}
                  <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={lightboxIdx}
                        src={images[lightboxIdx]}
                        alt={`${sanctuary.title} — photo ${lightboxIdx + 1}`}
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.97 }}
                        transition={{ duration: 0.2 }}
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </AnimatePresence>

                    {/* Prev / Next arrows */}
                    {lightboxIdx > 0 && (
                      <button onClick={() => setLightboxIdx(i => i !== null ? i - 1 : null)}
                        className="absolute left-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white/70 rotate-180" />
                      </button>
                    )}
                    {lightboxIdx < images.length - 1 && (
                      <button onClick={() => setLightboxIdx(i => i !== null ? i + 1 : null)}
                        className="absolute right-3 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                        <ArrowRight className="w-4 h-4 text-white/70" />
                      </button>
                    )}
                  </div>

                  {/* Dot indicators */}
                  <div className="flex items-center justify-center gap-1.5 py-4 pb-8 flex-shrink-0">
                    {images.map((_, i) => (
                      <button key={i} onClick={() => setLightboxIdx(i)}
                        className={cn("rounded-full transition-all duration-200",
                          i === lightboxIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25")} />
                    ))}
                  </div>
                </motion.div>,
                document.body
              )}
            </div>
          );
        })()}

        {/* ── LAYOUT PLAN TAB ── */}
        {pdTab === 'plan' && (
          <div className="space-y-0">

          {/* ── Interactive Site Plan — full width, no side padding ── */}
          {sanctuary.sitePlanSrc && (plotDots || hotspots) && (
            <div>
              {/* Mode toggle */}
              {plotDots && hotspots && (
                <div className="flex items-center justify-between px-6 pt-5 pb-3">
                  <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">
                    {mapMode === 'plots' ? `Site Plan — ${plotDots?.length ?? 0} Plots` : 'Site Plan — Features'}
                  </p>
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
                </div>
              )}

              <div className="rounded-none overflow-hidden bg-[#0a0f07]">

                {/* ── PLOTS MODE ── */}
                {mapMode === 'plots' && plotDots && (
                  <>
                    <div className="relative">
                      <img src={sanctuary.sitePlanSrc} alt="Site plan" loading="lazy" decoding="async"
                        className="w-full h-auto object-contain" referrerPolicy="no-referrer" />
                      <div className="absolute top-2 left-2 right-2 flex items-center gap-2 flex-wrap">
                        <span className="bg-black/60 backdrop-blur-sm text-[7px] uppercase tracking-widest font-bold text-white/70 px-2 py-1 rounded-full">
                          Tap a plot to see its investment snapshot
                        </span>
                      </div>
                      {plotDots.map(p => {
                        const sz     = plotDotSize(p.sqYds);
                        const isActive = activePlot?.id === p.id;
                        const isPremium = p.sqYds >= 3000;
                        const isLandmark = p.id === 3;
                        return (
                          <button
                            key={p.id}
                            style={{ left: `${p.x}%`, top: `${p.y}%`, width: sz, height: sz }}
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
                        <span className="text-[8px] text-amber-400/80 uppercase tracking-wider font-bold">Plot 3 (Corner)</span>
                      </div>
                    </div>
                    <AnimatePresence mode="wait">
                      {activePlot && (() => {
                        const oldVal  = activePlot.sqYds * AGARTHA_OLD_RATE;
                        const nowVal  = activePlot.sqYds * AGARTHA_NOW_RATE;
                        const gain    = nowVal - oldVal;
                        const pct     = ((gain / oldVal) * 100).toFixed(1);
                        const annPct  = (parseFloat(pct) / 1.5).toFixed(1);
                        return (
                          <motion.div key={activePlot.id}
                            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.18 }} className="border-t border-white/8 bg-[#0d1409]">
                            <div className="flex items-start justify-between px-5 pt-4 pb-3">
                              <div>
                                <p className="text-[8px] uppercase tracking-[0.5em] text-primary/50 font-bold">
                                  Plot {activePlot.id} · {activePlot.sqYds.toLocaleString('en-IN')} sq yds
                                  {activePlot.id === 3 && <span className="ml-2 text-amber-400">★ Premium Corner</span>}
                                </p>
                                <p className="text-xl font-headline font-bold text-white mt-0.5">{formatRs(nowVal)}</p>
                                <p className="text-[10px] text-white/40">at ₹{AGARTHA_NOW_RATE.toLocaleString('en-IN')}/sq yd</p>
                              </div>
                              <button onClick={() => setActivePlot(null)} className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all mt-0.5">
                                <X className="w-3 h-3 text-white/40" />
                              </button>
                            </div>
                            <div className="px-5 pb-3">
                              <div className="rounded-xl bg-white/4 border border-white/5 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                  <div>
                                    <p className="text-[8px] uppercase tracking-widest text-white/30 font-bold">VIP Pre-Launch · Aug 2024</p>
                                    <p className="text-base font-headline font-bold text-white/60 mt-0.5">{formatRs(oldVal)}</p>
                                  </div>
                                  <p className="text-[9px] text-white/30">₹{AGARTHA_OLD_RATE.toLocaleString('en-IN')}/sq yd</p>
                                </div>
                                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                                  <div>
                                    <p className="text-[8px] uppercase tracking-widest text-primary/60 font-bold">Today · 2026</p>
                                    <p className="text-base font-headline font-bold text-white mt-0.5">{formatRs(nowVal)}</p>
                                  </div>
                                  <p className="text-[9px] text-primary/60">₹{AGARTHA_NOW_RATE.toLocaleString('en-IN')}/sq yd</p>
                                </div>
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
                                    <p className="text-[9px] text-primary/50">in ~18 months</p>
                                    <p className="text-[9px] text-primary/40">({annPct}% p.a.)</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="px-5 pb-4">
                              <p className="text-[10px] text-white/35 leading-relaxed">
                                An investor who booked this exact plot at VIP pre-launch in Aug 2024 has seen a paper gain of <span className="text-primary/70 font-bold">{formatRs(gain)}</span> without doing anything — simply because Agartha's land value grew <span className="text-primary/70 font-bold">+{pct}% in ~18 months</span>. Today's buyers get the same compounding advantage for the next cycle.
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
                      <img src={sanctuary.sitePlanSrc} alt="Site plan" loading="lazy" decoding="async"
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

          {/* Details below the plan */}
          <div className="px-6 py-6 space-y-8">
            {/* Description */}
            {sanctuary.description && (
              <p className="text-sm text-secondary/80 leading-relaxed">{sanctuary.description}</p>
            )}

            {/* Plot community stats */}
            {sanctuary.plots && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 bg-primary/5 rounded-2xl text-center">
                  <p className="text-2xl font-headline font-bold text-primary">{sanctuary.plots}</p>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Private Plots</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl text-center">
                  <p className="text-sm font-headline font-bold text-primary leading-tight">{sanctuary.plotRange ?? '808–4,800'}</p>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Sq Yds Range</p>
                </div>
                <div className="p-4 bg-primary/5 rounded-2xl text-center">
                  <p className="text-sm font-headline font-bold text-primary leading-tight">{sanctuary.amenityAcres ?? '14,548'}</p>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/60 mt-1">Amenity Sq Yds</p>
                </div>
              </div>
            )}            {/* Features */}
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
                  { label: 'Air Quality Index', value: `${sanctuary.aqi} — Pristine`, bar: Math.min((100 - sanctuary.aqi) / 100, 1) },
                  { label: 'Ambient Noise', value: `${sanctuary.noise} dB — Near Silent`, bar: Math.min((100 - sanctuary.noise) / 100, 1) },
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
                {sanctuary.id === 'dates-county' ? (
                  <div className="h-10 flex items-center">
                    <img
                      src="/gallery/dates-county/logo-planet-green.svg"
                      alt="Planet Green Infra"
                      className="h-9 w-auto object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                    />
                  </div>
                ) : (sanctuary.id === 'agartha' || sanctuary.id === 'syl') ? (
                  <div className="h-10 flex items-center">
                    <img
                      src="/logos/modcon-logo.svg"
                      alt="MODCON Builders"
                      className="h-8 w-auto object-contain"
                      onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                )}
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-secondary/50">Developed by</p>
                  <p className="text-sm font-bold text-on-surface">{sanctuary.architect}</p>
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* ── INVEST TAB ── */}
        {pdTab === 'invest' && (
          <div className="px-6 py-6 space-y-6">

            {/* Key stats row */}
            <div className="grid grid-cols-3 divide-x divide-outline/10 rounded-2xl border border-outline/10 overflow-hidden">
              <div className="px-3 py-4 text-center">
                <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">AQI</p>
                <p className="text-lg font-bold text-primary">{sanctuary.aqi}</p>
                <p className="text-[9px] text-secondary/50">Pure Air</p>
              </div>
              <div className="px-3 py-4 text-center">
                <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Noise</p>
                <p className="text-lg font-bold text-on-surface">{sanctuary.noise} dB</p>
                <p className="text-[9px] text-secondary/50">Near Silent</p>
              </div>
              <div className="px-3 py-4 text-center">
                <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Commute</p>
                <p className="text-lg font-bold text-on-surface">{commuteTime}m</p>
                <p className="text-[9px] text-secondary/50">{commuteDest}</p>
              </div>
            </div>

            {/* SYL Price breakdown + CTA */}
            {sanctuary.id === 'syl' && (
              <div className="space-y-4">

                {/* Pre-Investor Phase Banner */}
                <div className="rounded-2xl overflow-hidden border border-[#c8a951]/30" style={{ background: 'linear-gradient(135deg, rgba(200,169,81,0.07) 0%, rgba(200,169,81,0.03) 100%)' }}>
                  {/* Header */}
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(200,169,81,0.14)' }}>
                    <TrendingDown className="w-3.5 h-3.5 text-[#c8a951] rotate-180 flex-shrink-0" />
                    <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-[#c8a951]">Pre-Investor Phase · Now Running</p>
                  </div>

                  {/* FOMO callout */}
                  <div className="px-4 pt-4">
                    <div className="rounded-xl bg-[#c8a951]/10 border border-[#c8a951]/20 px-3 py-2.5 mb-3">
                      <p className="text-[11px] font-semibold text-on-surface leading-snug">
                        Agartha investors gained <span className="text-[#c8a951]">+37% in 18 months.</span>
                      </p>
                      <p className="text-[10px] text-secondary/60 mt-0.5">
                        SYL Residences is the next opportunity — and you're still in the pre-investor window.
                      </p>
                    </div>
                  </div>

                  {/* Phase progression */}
                  <div className="px-4 pt-0 pb-3">
                    <p className="text-[8px] uppercase tracking-[0.35em] text-secondary/50 font-bold mb-3">Investment Phase Roadmap</p>
                    <div className="flex items-stretch gap-0">
                      {/* Phase 1 — active */}
                      <div className="flex-1 rounded-l-xl border border-[#c8a951]/40 overflow-hidden" style={{ background: 'rgba(200,169,81,0.1)' }}>
                        <div className="px-3 py-2.5">
                          <div className="flex items-center gap-1 mb-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-[#c8a951] animate-pulse" />
                            <p className="text-[8px] font-bold text-[#c8a951] uppercase tracking-widest">TGT Member Benefit</p>
                          </div>
                          <p className="text-[10px] font-bold text-on-surface">Pre-Investor Phase</p>
                          <p className="text-base font-headline font-bold text-[#c8a951] mt-0.5">₹4,499</p>
                          <p className="text-[8px] text-secondary/50">per SFT</p>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="flex items-center px-0.5 z-10">
                        <div className="w-3 h-3 border-t-2 border-r-2 border-[#c8a951]/30 rotate-45 -ml-1.5" />
                      </div>
                      {/* Phase 2 */}
                      <div className="flex-1 border border-outline/10 overflow-hidden" style={{ background: 'rgba(0,0,0,0.02)' }}>
                        <div className="px-3 py-2.5">
                          <p className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest mb-1">Next</p>
                          <p className="text-[10px] font-bold text-secondary/60">Pre-Launch</p>
                          <p className="text-base font-headline font-bold text-secondary/40 mt-0.5">Higher</p>
                          <p className="text-[8px] text-secondary/30">at booking milestone</p>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="flex items-center px-0.5 z-10">
                        <div className="w-3 h-3 border-t-2 border-r-2 border-outline/20 rotate-45 -ml-1.5" />
                      </div>
                      {/* Phase 3 */}
                      <div className="flex-1 rounded-r-xl border border-outline/10 overflow-hidden">
                        <div className="px-3 py-2.5">
                          <p className="text-[8px] font-bold text-secondary/40 uppercase tracking-widest mb-1">Launch</p>
                          <p className="text-[10px] font-bold text-secondary/50">Public</p>
                          <p className="text-base font-headline font-bold text-secondary/30 mt-0.5">Market</p>
                          <p className="text-[8px] text-secondary/30">post-launch rate</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Why now */}
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-[9px] uppercase tracking-[0.3em] text-secondary/50 font-bold">Why Pre-Investor Phase Matters</p>
                    {[
                      { icon: '⬇', title: 'Lowest possible rate', desc: 'Pre-investor pricing is always below the pre-launch and public launch rate. Once booking targets are hit, this phase closes.' },
                      { icon: '🏆', title: 'First pick of units', desc: 'Best floor plans, preferred views, and corner units go to pre-investors — before the project is even advertised.' },
                      { icon: '📈', title: 'Appreciation from day one', desc: 'Tukkuguda is in Hyderabad\'s 4th City corridor. Early investors capture the full growth curve from ground up.' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2.5">
                        <span className="text-sm flex-shrink-0 mt-0.5">{item.icon}</span>
                        <div>
                          <p className="text-[10px] font-semibold text-on-surface">{item.title}</p>
                          <p className="text-[9px] text-secondary/50 leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">
                  Price Estimate — ₹4,499 / SFT
                </p>
                <div className="rounded-2xl overflow-hidden border border-outline/10">
                  {[
                    { label: 'Compact Villament', sft: 2500 },
                    { label: 'Standard Villament', sft: 3000 },
                    { label: 'Large Villament', sft: 3500 },
                    { label: 'Premium Villament', sft: 4500 },
                  ].map((row, i) => {
                    const total = row.sft * 4499;
                    const display = `₹${(total / 1e7).toFixed(2)} Cr`;
                    return (
                      <div key={i} className={cn("flex items-center justify-between px-4 py-3 text-sm", i % 2 === 0 ? "bg-surface" : "bg-surface-container-low")}>
                        <div>
                          <p className="font-medium text-on-surface text-[13px]">{row.label}</p>
                          <p className="text-[10px] text-secondary/50">{row.sft.toLocaleString('en-IN')} SFT</p>
                        </div>
                        <p className="font-headline font-bold text-primary">{display}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Negotiation CTA */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <p className="text-xs text-secondary leading-relaxed">
                    Prices above are indicative. <span className="font-semibold text-on-surface">Better pricing is available for in-person visits.</span> Message us on WhatsApp to enquire or book your office visit.
                  </p>
                  <div className="flex flex-col gap-2">
                    {/* WhatsApp — Enquire */}
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27m%20interested%20in%20MODCON%20SYL%20Residences%20(Tukkuguda%2C%20ORR%20Exit-14).%20Could%20you%20share%20the%20best%20pricing%20available%3F"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-[10px] uppercase tracking-[0.4em] font-bold text-cream transition-all bg-olive-900 hover:bg-primary"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.121 1.533 5.851L.057 23.882l6.198-1.625A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.359-.214-3.68.965.981-3.595-.234-.371A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                      </svg>
                      WhatsApp · Enquire Now
                    </a>
                    {/* WhatsApp — Book Office Visit */}
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27d%20like%20to%20book%20an%20office%20visit%20%2F%20site%20visit%20for%20MODCON%20SYL%20Residences.%20Please%20share%20available%20slots.%20(Financial%20District%20Office)"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-olive-900/40 text-olive-900 text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl transition-all hover:bg-olive-900/10"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Book Office Visit · WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Agartha Price breakdown + WhatsApp CTAs */}
            {sanctuary.id === 'agartha' && (
              <div className="space-y-4">
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">
                  Price Estimate — ₹8,500 / sq yd
                </p>
                <div className="rounded-2xl overflow-hidden border border-outline/10">
                  {[
                    { label: 'Plot 01 (Smallest)', sqYds: 808 },
                    { label: 'Typical Plot', sqYds: 1300 },
                    { label: 'Large Plot', sqYds: 2000 },
                    { label: 'Premium Plot', sqYds: 3000 },
                    { label: 'Plot 3 (Largest)', sqYds: 4800 },
                  ].map((row, i) => {
                    const totalRs = row.sqYds * 8500;
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
                <p className="text-[8px] text-secondary/40">Rate: ₹8,500/sq yd · Plots from 808 to 4,800 sq yds</p>

                {/* Biomorphic Construction Add-On */}
                <div className="rounded-2xl border border-primary/20 bg-primary/3 p-5 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Leaf className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.4em] text-primary font-bold mb-1">Biomorphic Construction Add-On</p>
                      <p className="text-xs text-secondary leading-relaxed">
                        MODCON's <span className="font-semibold text-on-surface">biomorphic design studio</span> can build a 150 sq yd home within your plot using mud · bamboo · lime · Bali-style architecture — a sustainable retreat that's yours from day one.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-surface border border-outline/10 p-3 text-center">
                      <p className="text-[9px] text-secondary/50 uppercase tracking-widest mb-0.5">Built-Up</p>
                      <p className="text-sm font-bold text-on-surface">150 sq yds</p>
                      <p className="text-[9px] text-secondary/40">1,350 SFT</p>
                    </div>
                    <div className="rounded-xl bg-surface border border-outline/10 p-3 text-center">
                      <p className="text-[9px] text-secondary/50 uppercase tracking-widest mb-0.5">Add-On Cost</p>
                      <p className="text-sm font-bold text-primary">₹35 – 50 L</p>
                      <p className="text-[9px] text-secondary/40">Additional</p>
                    </div>
                    <div className="rounded-xl bg-surface border border-outline/10 p-3 text-center">
                      <p className="text-[9px] text-secondary/50 uppercase tracking-widest mb-0.5">Style</p>
                      <p className="text-sm font-bold text-on-surface">Bali</p>
                      <p className="text-[9px] text-secondary/40">Mud · Bamboo · Lime</p>
                    </div>
                  </div>
                  <p className="text-[9px] text-secondary/40 leading-relaxed">
                    Biomorphic architecture by MODCON's design team. Pricing is indicative — enquire for a custom build quote.
                  </p>
                </div>

                {/* WhatsApp CTAs */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <p className="text-xs text-secondary leading-relaxed">
                    Rate is ₹8,500/sq yd. <span className="font-semibold text-on-surface">Better pricing available for in-person visits — we negotiate on your behalf.</span> Message us on WhatsApp to enquire or book a site visit.
                  </p>
                  <div className="flex flex-col gap-2">
                    {/* WhatsApp — Enquire */}
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27m%20interested%20in%20MODCON%20Agartha%20(Narsapur%2C%20Hyderabad).%20Could%20you%20share%20the%20best%20available%20plots%20and%20pricing%3F"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-[10px] uppercase tracking-[0.4em] font-bold text-cream transition-all bg-olive-900 hover:bg-primary"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.121 1.533 5.851L.057 23.882l6.198-1.625A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.359-.214-3.68.965.981-3.595-.234-.371A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                      </svg>
                      WhatsApp · Enquire Now
                    </a>
                    {/* WhatsApp — Book Site Visit */}
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27d%20like%20to%20book%20a%20site%20visit%20for%20MODCON%20Agartha%20(Narsapur).%20Please%20share%20available%20slots."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-olive-900/40 text-olive-900 text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl transition-all hover:bg-olive-900/10"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Book Site Visit · WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Dates County Price breakdown + WhatsApp CTAs */}
            {sanctuary.id === 'dates-county' && (
              <div className="space-y-4">

                {/* Price highlight */}
                <div className="rounded-2xl overflow-hidden border border-[#3a7d44]/30" style={{ background: 'linear-gradient(135deg, rgba(58,125,68,0.07) 0%, rgba(58,125,68,0.03) 100%)' }}>
                  <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'rgba(58,125,68,0.14)' }}>
                    <Leaf className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-primary">Eco-Luxury Villa Plots · Kandukur</p>
                  </div>
                  <div className="px-4 pt-4 pb-3 space-y-3">
                    <div className="rounded-xl bg-primary/10 border border-primary/20 px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-on-surface leading-snug">
                        Adjacent to a <span className="text-primary">4,000-acre reserve forest.</span>
                      </p>
                      <p className="text-[10px] text-secondary/60 mt-0.5">
                        300+ acres · 40% open recreational space · RERA approved
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <img src="/gallery/dates-county/logo-planet-green.svg" alt="Planet Green" className="h-7 w-auto mt-0.5 flex-shrink-0" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                      <p className="text-[9px] text-secondary/50 leading-relaxed">
                        Developed by <span className="font-semibold text-on-surface">Planet Green Infra</span> · RERA P02400002648 · P02400003813
                      </p>
                    </div>
                  </div>
                </div>

                {/* Price breakdown */}
                <p className="text-[9px] uppercase tracking-[0.4em] text-secondary font-bold">
                  Price Estimate — ₹18,000 / sq yd
                </p>
                <div className="rounded-2xl overflow-hidden border border-outline/10">
                  {[
                    { label: 'Standard Plot', sqYds: 200 },
                    { label: 'Popular Plot', sqYds: 300 },
                    { label: 'Prime Plot', sqYds: 500 },
                    { label: 'Large Plot', sqYds: 600 },
                  ].map((row, i) => {
                    const totalRs = row.sqYds * 18000;
                    const display = totalRs >= 1e7 ? `₹${(totalRs / 1e7).toFixed(2)} Cr` : `₹${(totalRs / 1e5).toFixed(0)} L`;
                    const highlight = row.sqYds === 500;
                    return (
                      <div key={i} className={cn(
                        'grid grid-cols-3 px-4 py-3 text-[10px]',
                        highlight ? 'bg-primary/8 border-l-2 border-primary' : i % 2 === 0 ? 'bg-primary/3' : 'bg-transparent'
                      )}>
                        <span className={cn('font-medium', highlight ? 'text-primary font-bold' : 'text-secondary/60')}>
                          {row.label}{highlight && ' ⭐'}
                        </span>
                        <span className="text-center font-bold text-on-surface">{row.sqYds.toLocaleString('en-IN')} sq yds</span>
                        <span className={cn('text-right font-bold', highlight ? 'text-primary' : 'text-primary')}>{display}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[8px] text-secondary/40">Rate: ₹18,000/sq yd · Villa plots from 200 to 600 sq yds · Highlighted: 500 sq yd = ₹90 L</p>

                {/* CTA */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3">
                  <p className="text-xs text-secondary leading-relaxed">
                    Pricing is as listed. <span className="font-semibold text-on-surface">Site visits available — we'll accompany you and negotiate on your behalf.</span> WhatsApp us to enquire or book a visit.
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27m%20interested%20in%20Dates%20County%20by%20Planet%20Green%20(Kandukur%2C%20Hyderabad).%20Could%20you%20share%20available%20plots%20and%20best%20pricing%3F%20(500%20sq%20yd%20%40%20%E2%82%B918%2C000)"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl text-[10px] uppercase tracking-[0.4em] font-bold text-cream transition-all bg-olive-900 hover:bg-primary"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current flex-shrink-0">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.128.558 4.121 1.533 5.851L.057 23.882l6.198-1.625A11.953 11.953 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.002-1.37l-.359-.214-3.68.965.981-3.595-.234-.371A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/>
                      </svg>
                      WhatsApp · Enquire Now
                    </a>
                    <a
                      href="https://wa.me/919700144003?text=Hi%2C%20I%27d%20like%20to%20book%20a%20site%20visit%20for%20Dates%20County%20by%20Planet%20Green%20(Kandukur).%20Please%20share%20available%20slots."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 border-2 border-olive-900/40 text-olive-900 text-[10px] uppercase tracking-[0.4em] font-bold rounded-xl transition-all hover:bg-olive-900/10"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Book Site Visit · WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

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
       'backdrop-filter:blur(0px)', '-webkit-backdrop-filter:blur(0px)',
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

const SanctuaryMapLayout = ({ isVisible, onPropertySelect }: { isVisible?: boolean; onPropertySelect?: (id: string) => void }) => {
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
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set(['aqi-live', 'sanctuaries']));

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
    { lat: 17.74, lng: 78.28, strength: 0.90 }, // Narsapur Forest Reserve     Agartha
    { lat: 17.37, lng: 78.29, strength: 0.80 }, // Osman Sagar / Gandipet      Neo-Vertex corridor
    { lat: 17.31, lng: 78.31, strength: 0.75 }, // Himayat Sagar reservoir
    { lat: 17.35, lng: 78.34, strength: 0.70 }, // Mrugavani National Park
    { lat: 17.33, lng: 78.58, strength: 0.60 }, // Mahavir Harina Vanasthali
    { lat: 17.52, lng: 78.33, strength: 0.65 }, // Ameenpur Lake biodiversity site
    { lat: 17.31, lng: 77.85, strength: 0.65 }, // Ananthagiri Hills
    { lat: 17.24, lng: 78.48, strength: 0.55 }, // Tukkuguda green belt          SYL
  ];

  // ── Net AQI intensity: range -0.5 (very clean/blue) - +1.0 (polluted/red)
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

  // Generate a grid of points for the Real-time Mesh"
  // Each point pre-computes a boundaryFade (0 "1) so the AQI heatmap blends
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

  // Hyderabad Outer Ring Road (ORR) - refined 158 km trace aligned to satellite road
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

  // Hyderabad Regional Ring Road (RRR) - GPS-accurate outer trace
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

  // Radial National Highways & expressways - ORR junctions - RRR junctions
  // All share the same amber highway colour as ORR/RRR
  const HIGHWAYS: { id: string; name: string; path: [number, number][] }[] = [
    {
      id: 'nh-65',
      name: 'NH 65',
      // Mumbai / Pune (NW): city - ORR Patancheru (E3) - RRR Sangareddy
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
      // Bangalore / Chennai (S): city - ORR Shamshabad (E15) - RRR south
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
      // Vijayawada (E): city - ORR Ghatkesar (E9) - RRR Bhongir
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
      // Nagpur (N): city - ORR Medchal (E6) - RRR Toopran
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
      // SE corridor: city - ORR - RRR Ibrahimpatnam
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
  // Polygons shaped to satellite imagery - all within or adjacent to RRR corridor
  const NATURAL_FEATURES = [

    // ── RESERVE FORESTS (NORTH) ──────────────────────────────────────────── 

    // 1. Narsapur-Toopran Reserved Forest Complex (~30 sq km, Medak Division)
    // Directly adjacent to MODCON Agartha - the primary ecological asset
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

    // 3. Mulugu Reserved Forest (Siddipet - RRR northern transit)
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
      description: "Designated RF along Siddipet range - key forest diversion zone identified in RRR northern corridor EIA.",
      area: "520 ha"
    },

    // ── NATIONAL PARKS & WILDLIFE SANCTUARIES ──────────────────────────────

    // 4. KBR National Park (Inside ORR - Jubilee Hills)
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

    // ── RESERVE FORESTS (SOUTH & WEST) ──────────────────────────────────── 

    // 7. Ananthagiri Hills Reserved Forest Complex (Vikarabad ? 6,124 ha)
    // Largest forest block in Hyderabad metro - origin of Musi river
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

    // 11. Dalmia RF - Maheswaram/Kandukur (South RRR corridor)
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

    // 12. Kothiyal-Kappa Pahad RF (NE - Siddipet/Yadadri corridor)
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

    // 13. Yadadri Green Hills (Eastern RRR - pilgrim forest buffer)
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

    // 14. Osman Sagar (Gandipet) - Protected reservoir + catchment forest
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

    // 15. Himayat Sagar - Protected reservoir
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

    // 16. Hussain Sagar - Central government lake
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

    // 17. Ameenpur Lake - India's first biodiversity heritage lake
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
      image: "/gallery/agartha/11.webp",
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
      image: "/gallery/syl/1776279315359.webp",
      description: "Vertical villaments strategically positioned near the protected green belts of the Future City."
    },
    {
      id: "dates-county",
      type: 'sanctuary',
      title: "Dates County",
      location: "Kandukur · Srisailam Highway",
      coords: [17.118, 78.588] as [number, number],
      aqi: 18,
      noise: 22,
      forestRadius: 4500,
      boundary: [
        [17.135, 78.570], [17.145, 78.595], [17.130, 78.615],
        [17.100, 78.610], [17.090, 78.585], [17.105, 78.565]
      ] as [number, number][],
      image: "/gallery/dates-county/temple.jpg",
      description: "A 300+ acre eco-luxury villa-plot community adjacent to a 4,000-acre reserve forest on Hyderabad's Future City axis."
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
      return false; // ORR/RRR exits hidden - not in active filter set
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
            className="absolute inset-0 z-[10000] flex flex-col items-center justify-center pointer-events-none"
            style={{ background: 'linear-gradient(135deg, #0d1409 0%, #1a2310 100%)' }}
          >
            <motion.div
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Logo className="w-16 h-16 text-[#a3b18a]" onDark={true} />
            </motion.div>
            <div className="mt-6 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#4ade80' }} />
              <span className="text-[9px] tracking-[0.4em] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.3)' }}>Connecting to Live Environmental Data</span>
            </div>
            <div className="w-48 h-px mt-6 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <motion.div
                className="absolute top-0 left-0 h-full"
                style={{ background: 'linear-gradient(90deg, transparent, #4ade80, transparent)' }}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.8, ease: "linear" }}
              />
            </div>
            <p className="text-[8px] tracking-[0.2em] uppercase mt-4" style={{ color: 'rgba(255,255,255,0.12)' }}>The Green Team · Environmental Intelligence</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative">
        {/* ── Map controls — top bar ───────────────────────────────────────── */}
        <div className="absolute top-3 left-3 right-3 z-[1000] flex items-center gap-2 pointer-events-none">

          {/* Live pill + layer toggle */}
          <div className="flex items-center gap-0 rounded-xl overflow-hidden flex-shrink-0 pointer-events-auto"
            style={{ background: 'rgba(8,13,6,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.06)', boxShadow: '0 2px 16px rgba(0,0,0,0.6)' }}>
            {/* Live indicator */}
            <div className="flex items-center gap-1.5 px-3 py-2.5" style={{ borderRight: '1px solid rgba(255,255,255,0.05)' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#4ade80' }} />
              <span className="text-[8px] uppercase tracking-[0.35em] font-bold" style={{ color: 'rgba(255,255,255,0.6)' }}>Live</span>
            </div>
            {/* Satellite toggle */}
            <button onClick={() => setIsSatellite(s => !s)}
              className="flex items-center gap-1.5 px-3 py-2.5 transition-all duration-200"
              style={{ color: isSatellite ? '#86efac' : 'rgba(255,255,255,0.3)' }}>
              <Layers className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="text-[8px] uppercase tracking-[0.3em] font-bold hidden sm:block">
                {isSatellite ? 'Satellite' : 'Road'}
              </span>
            </button>
          </div>

          {/* Filter chips — scrollable */}
          <div className="flex items-center gap-1.5 overflow-x-auto min-w-0 flex-1 pointer-events-auto" style={{ scrollbarWidth: 'none' }}>
            {FILTER_PILLS.map(pill => {
              const Icon = pill.icon;
              const isActive = activeFilters.has(pill.id);
              return (
                <button
                  key={pill.id}
                  onClick={() => toggleFilter(pill.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 h-[38px] px-3 rounded-xl text-[9px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-200"
                  style={isActive ? {
                    background: 'rgba(45,58,29,0.95)',
                    border: '1px solid rgba(74,222,128,0.28)',
                    color: '#86efac',
                    boxShadow: '0 0 12px rgba(74,222,128,0.12)',
                    backdropFilter: 'blur(16px)',
                  } : {
                    background: 'rgba(8,13,6,0.88)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.38)',
                    backdropFilter: 'blur(16px)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span>{pill.label}</span>
                  {isActive && pill.id === 'aqi-live' && (
                    <span className="w-1 h-1 rounded-full animate-pulse ml-0.5 flex-shrink-0" style={{ background: '#4ade80' }} />
                  )}
                </button>
              );
            })}
          </div>
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
                  // Olive-mint - matches site palette (olive-900 / primary green)
                  fillColor: '#3d5c35',
                  fillOpacity: 0.12,
                  color: '#4a6741',
                  weight: 1,
                  opacity: 0.45,
                  dashArray: undefined,
                  lineCap: 'round',
                  lineJoin: 'round',
                } : {
                  // Slate-blue - muted water tone
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
            /* Pure satellite - no Google labels/POIs/restaurant names */
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
            />
          ) : (
            /* Google Maps road layer - real NH numbers, highways at every zoom */
            <TileLayer
              attribution="&copy; Google Maps"
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              className="map-olive-filter"
            />
          )}



          {/* Real-time Environmental Mesh - blue near forests, red near industry */}
          {gridPoints.map((point, idx) => {
            const net = getIntensity(point, AQI_HOTSPOTS, CLEAN_AIR_ZONES);
            const pulseFactor = Math.sin((idx + livePulse) * 0.1) * 0.03;
            // 5-band colour scale: red - orange - yellow - green - blue
            const fillColor = net > 0.55
             ? '#ef4444'  // red   - very polluted
                            : net > 0.28
             ? '#f97316'  // orange - polluted
                            : net > 0.08
             ? '#eab308'  // yellow - moderate
                            : net > -0.12 ? '#4ade80'  // green  - good
                            :               '#3b82f6'; // blue   - very clean / forest zone
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

          {/* ── ORR - solid amber line, matches satellite road ── */}
          {/* glow */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#d97706', weight: 16, opacity: 0.10, lineCap: 'round' }} />
          {/* casing */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#92400e', weight: 6,  opacity: 0.95, lineCap: 'round' }} />
          {/* centre stripe */}
          <Polyline positions={ORR_PATH} pathOptions={{ color: '#fcd34d', weight: 2,  opacity: 0.85, lineCap: 'round' }} />

          {/* ── RRR - same amber family, longer dash = proposed alignment ── */}
          {/* glow */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#d97706', weight: 12, opacity: 0.08, lineCap: 'round' }} />
          {/* casing */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#92400e', weight: 4,  opacity: 0.80, dashArray: '14, 10', lineCap: 'round' }} />
          {/* centre stripe */}
          <Polyline positions={RRR_PATH} pathOptions={{ color: '#fcd34d', weight: 1.5, opacity: 0.65, dashArray: '14, 10', lineCap: 'round' }} />

          {/* Outside-RRR blur overlay - backdrop-filter blur + dark veil,
              clipped to the exterior via clip-path:path(evenodd) */}
          <RRRBlurOverlay rrrPath={RRR_PATH} />



          {/* ── ORR exits - always visible, zoom-responsive labels ── */}
          {locations.filter(l => l.type === 'exit').map(loc => (
            <Marker
              key={loc.id}
              position={loc.coords}
              icon={L.divIcon({
                className: '',
                html: currentZoom >= 11 ? `<div style="font-size:11px; font-weight:600; color:white; background:#d97706; padding:2px 8px; border-radius:10px;"></div>
                      ${loc.title.replace('ORR ', 'ORR ')}
                    </div>`
                  : `<div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}></div>`,
                iconSize: currentZoom >= 11 ? [90, 22] : [10, 10],
                iconAnchor: currentZoom >= 11 ? [45, 11] : [5, 5],
                popupAnchor: [0, -14],
              })}
            >
              <Popup className="custom-popup">
                <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>{loc.title}</div>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>{loc.location}</div>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>
                    <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}></div>
                    <span style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>AQI ${loc.aqi ?? 'N/A'}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── RRR exits - always visible ── */}
          {locations.filter(l => l.type === 'rrr-exit').map(loc => (
            <Marker
              key={loc.id}
              position={loc.coords}
              icon={L.divIcon({
                className: '',
                html: currentZoom >= 9 ? `<div style="font-size:11px;font-weight:600;color:white;text-shadow:0 1px 3px rgba(0,0,0,0.4);letter-spacing:0.05em;"><div style="width:5px;height:5px;border-radius:50%;background:#fcd34d;flex-shrink:0;"></div></div>
                      RRR  ${loc.location}
                    </div>`
                  : `<div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}></div>`,
                iconSize: currentZoom >= 9 ? [110, 20] : [8, 8],
                iconAnchor: currentZoom >= 9 ? [55, 10] : [4, 4],
                popupAnchor: [0, -12],
              })}
            >
              <Popup className="custom-popup">
                <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>RRR Proposed Exit</div>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>{loc.location}</div>
                  <div style={{ fontSize: "11px", lineHeight: "1.2", fontWeight: 600, color: "white", textShadow: "0 1px 3px rgba(0,0,0,0.4)", letterSpacing: "0.05em" }}>Proposed alignment. Under construction.</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* ── Sanctuary markers (filter-gated) ── */}
          {filteredLocations.map((loc) => {
            const isPremium = loc.type === 'sanctuary';
            if (!isPremium) return null;

            return (
              <React.Fragment key={loc.id}>

                {isPremium && (() => {
                  const sanctuary = SANCTUARIES.find(s => s.id === loc.id);
                  // Property-specific accent (rgb) + 3-letter tag for the marker badge.
                  const ACCENTS: Record<string, { rgb: string; label: string }> = {
                    'agartha':       { rgb: '126,184,90',  label: 'AGR' },  // forest green
                    'syl':           { rgb: '200,169,81',  label: 'SYL' },  // gold
                    'dates-county':  { rgb: '192,122,61',  label: 'DTC' },  // terracotta
                  };
                  const { rgb: accent, label } = ACCENTS[loc.id] ?? { rgb: '126,184,90', label: (loc.id || '').slice(0, 3).toUpperCase() };
                  const thumb = sanctuary?.image || loc.image;
                  return (
                  <Marker
                    position={loc.coords}
                    eventHandlers={{
                      click: () => {
                        // Gentle pan/zoom only; popup opens via Leaflet's default behavior.
                        setTargetView({ center: loc.coords, zoom: 14 });
                      }
                    }}
                    icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 10px 28px rgba(0,0,0,0.7));">
                              <div style="position:relative;width:62px;height:62px;border-radius:50%;padding:3px;background:linear-gradient(135deg,rgba(${accent},0.9),rgba(${accent},0.25));box-shadow:0 0 0 6px rgba(${accent},0.08),0 18px 36px rgba(0,0,0,0.6);">
                                <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(${accent},0.18);animation:tgt-pulse 2.4s ease-in-out infinite;z-index:-1;"></div>
                                <div style="width:100%;height:100%;border-radius:50%;background:#0c1208;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;">
                                  ${thumb ? `<img src="${thumb}" alt="${loc.title}" loading="lazy" decoding="async" style="width:100%;height:100%;object-fit:cover;" referrerpolicy="no-referrer" />` : ''}
                                  <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(0,0,0,0.55),transparent 55%);"></div>
                                  <span style="position:absolute;bottom:4px;left:0;right:0;text-align:center;font-size:8px;font-weight:800;letter-spacing:0.18em;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.8);">${label}</span>
                                </div>
                              </div>
                              <div style="width:2px;height:12px;background:linear-gradient(to bottom,rgba(${accent},0.75),transparent);margin-top:-1px;"></div>
                              <div style="width:6px;height:2px;border-radius:50%;background:rgba(0,0,0,0.45);"></div>
                            </div>`,
                      iconSize: [62, 78],
                      iconAnchor: [31, 78],
                      popupAnchor: [0, -80]
                    })}
                  >
                    <Popup className="custom-popup">
                      <SanctuaryPopupContent
                        loc={loc}
                        onViewDetails={onPropertySelect ? () => {
                          const id = loc.id;
                          startTransition(() => onPropertySelect(id));
                        } : undefined}
                      />
                    </Popup>
                  </Marker>
                  );
                })()}
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
                  html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid ${ringColor}; display: flex; items-center: center; justify-content: center; box-shadow: 0 0 20px ${ringColor}44;">
                          <div style="font-size: 10px; font-weight: 900; color: ${textColor};">${zone.aqi}</div>
                         </div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16],
                  popupAnchor: [0, -16],
                })}
              >
                <Popup className="custom-popup">
                  <div className="p-4 bg-surface text-on-surface">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-headline font-bold text-base">{zone.name}</h4>
                      <span className="px-2 py-0.5 bg-error/10 text-error text-[8px] uppercase font-bold rounded-full">{zone.tag}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-secondary opacity-50 mb-1">AQI Status</p>
                        <p className="text-xl font-headline font-bold">{zone.aqi}</p>
                        <p className="text-[10px] text-error font-medium">{aqiBand}</p>
                      </div>
                      <div>
                        <p className="text-[8px] uppercase tracking-widest text-secondary opacity-50 mb-1">Noise Level</p>
                        <p className="text-xl font-headline font-bold">{zone.noise} dB</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-outline/10 text-[10px] leading-relaxed">
                      <span className="text-error font-bold uppercase tracking-wider">Health Risk: </span>
                      {zone.hazard} - Significant cardiovascular and respiratory risk.
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* ── Bottom data terminal ──────────────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-none">
          <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            <div
              className="flex items-stretch min-w-max"
              style={{ background: 'rgba(5,8,4,0.97)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
            >
              {[
                { label: 'AGARTHA · AQI', value: '12',    sub: 'Pristine',  color: '#4ade80', pulse: true  },
                { label: 'SYL · AQI',     value: '22',    sub: 'Clean',     color: '#86efac', pulse: true  },
                { label: 'CITY · AQI',    value: '148',   sub: 'Unhealthy', color: '#f87171', pulse: false },
                { label: 'AIR EDGE',      value: '12.3×', sub: 'Cleaner',   color: '#fcd34d', pulse: false },
                { label: 'NOISE · AGARTHA', value: '18 dB', sub: 'Near Silent', color: '#a5f3fc', pulse: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 px-4 py-2.5 flex-shrink-0"
                  style={{ borderRight: '1px solid rgba(255,255,255,0.03)' }}>
                  {item.pulse && (
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: item.color }} />
                  )}
                  <div>
                    <p className="text-[6px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.18)', letterSpacing: '0.35em' }}>{item.label}</p>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-sm font-bold leading-none" style={{ color: item.color, fontVariantNumeric: 'tabular-nums' }}>{item.value}</span>
                      <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{item.sub}</span>
                    </div>
                  </div>
                </div>
              ))}
              {/* RRR / ORR label */}
              <div className="flex items-center gap-2 px-4 py-2.5 flex-shrink-0">
                <div className="w-3 h-0.5 rounded-full flex-shrink-0" style={{ background: '#fcd34d', opacity: 0.6 }} />
                <div>
                  <p className="text-[6px] uppercase font-bold" style={{ color: 'rgba(255,255,255,0.18)', letterSpacing: '0.35em' }}>INFRA</p>
                  <p className="text-[8px] font-bold mt-0.5" style={{ color: 'rgba(252,211,77,0.55)' }}>ORR · RRR</p>
                </div>
              </div>
            </div>
          </div>
        </div>
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
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-6 block">Curated Portfolio</span>
            <h2 className="text-6xl md:text-8xl font-medium text-on-surface">Curated <br /><span className="italic text-primary">Sanctuaries.</span></h2>
            <p className="text-xl md:text-2xl font-light text-secondary leading-relaxed mt-8">
              Naturally organic, sustainable, and strictly premium. From the forest peripheral of Narsapur (Free Access) to the vertical landmarks of the highway (Newsletter Access).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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

const Journal = () => {
  const [selectedPost, setSelectedPost] = useState<JournalPost | null>(null);
  const [featured, ...secondaryPosts] = JOURNAL_POSTS;

  const buildLongFormBody = (post: JournalPost) => {
    const firstTakeaway = post.takeaways[0] || 'Better decisions come from better context.';
    const secondTakeaway = post.takeaways[1] || 'Read the location before you read the brochure.';
    const thirdTakeaway = post.takeaways[2] || 'The most durable value is usually the least noisy.';

    return [
      `${post.title} deserves to be read as a working framework rather than a quick opinion. In a market like Hyderabad, where growth is uneven and the quality of a location can change from one road to the next, the difference between a good and a weak decision often lives in the details. The point of this note is to slow the decision down just enough to see the shape of the opportunity clearly: what the site is, what it is not, and why the surrounding context changes the outcome for both end users and investors.`,
      `${post.body[0]} The practical side of that idea is simple. When a buyer asks whether a place will hold value, the answer rarely comes from a single headline number. It comes from the way the site behaves in real life: how much time it saves, how much noise it absorbs, how much air you breathe, how naturally the neighborhood supports everyday routines, and how easy it is to explain the value to someone else later. That is why we treat location as a bundle of signals rather than a single story.`,
      `${post.body[1]} In Hyderabad, this matters because the city does not grow in a perfect ring. It grows along corridors, around anchors, and toward infrastructure that reduces friction for people who move often. A good investment location is therefore less about being famous and more about being useful. If a home, plot, or community sits in the path of demand, has access to work, school, airport, or highway connections, and still feels calm enough to be lived in comfortably, it has a stronger chance of sustaining attention over time.`,
      `${post.body[2]} That is also where discipline matters. Buyers often overpay for marketing language and underweight the parts of the property that are hardest to retrofit later: ambience, access, planning quality, and environmental comfort. Once those elements are gone, they are expensive to recover. Once they are present, they quietly keep working for years. This is why a curated reading of the market is valuable. It helps people separate short-term excitement from long-term livability, which is a better basis for a decision that may be held for many years.`,
      `For us, the takeaway is not only about ${firstTakeaway.toLowerCase()} It is also about ${secondTakeaway.toLowerCase()} and ${thirdTakeaway.toLowerCase()} Together, these ideas create a checklist that is practical enough for real buyers and sober enough for real capital. If a property cannot survive that checklist, the brochure is not the problem; the property is. If it can survive that checklist, the buyer has a much better chance of ending up with something that feels good to own, easy to explain, and easier to hold with confidence.`,
      `Viewed this way, ${post.category.toLowerCase()} is not a label. It is a discipline. It asks the buyer to compare alternatives with a sharper lens, to ask what kind of life the property supports, and to think in years rather than in posts. That is the kind of framework we want readers to leave with: not just a reaction to a blog, but a more reliable way to judge a location in the city.`,
    ];
  };

  const PostCard: FC<{ post: JournalPost; featuredCard?: boolean }> = ({ post, featuredCard = false }) => (
    <button
      type="button"
      onClick={() => setSelectedPost(post)}
      className={cn(
        "group relative overflow-hidden text-left border border-outline/10 bg-surface transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl",
        featuredCard ? "min-h-[34rem]" : "min-h-[15rem]"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_42%),linear-gradient(135deg,#1a2410_0%,#2d3a1d_42%,#0f150c_100%)]">
        <div className="absolute inset-0 opacity-35 mix-blend-screen">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="journalGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgba(242,244,242,0.16)" />
                <stop offset="100%" stopColor="rgba(242,244,242,0)" />
              </linearGradient>
            </defs>
            <circle cx="74" cy="26" r="18" fill="url(#journalGlow)" />
            <circle cx="18" cy="82" r="26" fill="url(#journalGlow)" />
            <path d="M0 100 L100 0" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-7 md:p-10 text-left text-white">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[9px] uppercase tracking-[0.55em] font-bold text-white/55">{post.category}</span>
          <span className="text-[8px] uppercase tracking-[0.45em] text-white/35">{post.date}</span>
        </div>

        <div className="mt-auto">
          <div className={cn("max-w-xl", featuredCard ? "space-y-5" : "space-y-4")}>
            <h3 className={cn(
              "font-medium leading-tight",
              featuredCard ? "text-3xl md:text-5xl" : "text-2xl md:text-3xl"
            )}>
              {post.title}
            </h3>
            <p className={cn(
              "text-white/65 leading-relaxed",
              featuredCard ? "text-base md:text-lg max-w-2xl" : "text-sm md:text-base"
            )}>
              {post.excerpt}
            </p>
          </div>

          <div className="mt-8 flex items-center gap-5 text-[9px] uppercase tracking-[0.45em] font-bold text-white/45">
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              {post.readTime}
            </span>
            <span className="flex items-center gap-2 text-white/75 group-hover:text-white transition-colors">
              Read post
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </button>
  );

  return (
    <section id="journal" className="px-6 md:px-24 py-20 bg-surface border-y border-outline/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row justify-between items-end gap-8 mb-10">
          <div className="max-w-3xl">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-6 block">The Journal</span>
            <h2 className="text-6xl md:text-8xl font-medium text-on-surface">
              Notes from the <span className="italic text-primary">curation desk.</span>
            </h2>
            <p className="text-xl md:text-2xl font-light text-secondary leading-relaxed mt-8">
              Short editorial posts on land, access, scarcity, and the signals we use when evaluating a sanctuary.
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1.35fr_0.85fr] gap-6">
          <PostCard post={featured} featuredCard />
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {secondaryPosts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[85] overflow-hidden flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
            />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 14 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="relative w-full max-w-4xl max-h-[88vh] overflow-y-auto bg-surface border border-outline/10 shadow-2xl"
              >
              <div className="relative h-64 md:h-96 overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.16),transparent_42%),linear-gradient(135deg,#1a2410_0%,#2d3a1d_42%,#0f150c_100%)]">
                <div className="absolute inset-0 opacity-40">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                    <path d="M0 100 C15 74 29 57 44 46 C59 35 74 25 100 0" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                    <path d="M0 78 C24 64 42 53 61 43 C77 34 88 26 100 17" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />
                  </svg>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/35 text-white flex items-center justify-center backdrop-blur-md border border-white/10 hover:bg-black/55 transition-colors"
                  aria-label="Close blog post"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute left-6 bottom-6 right-6 text-white">
                  <p className="text-[9px] uppercase tracking-[0.55em] text-white/55 font-bold">{selectedPost.category}</p>
                  <h3 className="text-3xl md:text-5xl font-medium mt-4 max-w-3xl">{selectedPost.title}</h3>
                  <div className="mt-5 flex flex-wrap items-center gap-4 text-[9px] uppercase tracking-[0.45em] font-bold text-white/45">
                    <span>{selectedPost.date}</span>
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedPost.readTime}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-6 md:px-10 py-8 md:py-10">
                <p className="text-lg md:text-xl font-light text-secondary leading-relaxed max-w-3xl">
                  {selectedPost.excerpt}
                </p>

                <div className="grid md:grid-cols-[1.35fr_0.65fr] gap-10 mt-10">
                  <div className="space-y-6 text-on-surface/85 leading-relaxed">
                    {buildLongFormBody(selectedPost).map((paragraph, index) => (
                      <p key={index} className="text-base md:text-lg font-light">
                        {paragraph}
                      </p>
                    ))}
                  </div>

                  <aside className="border border-outline/10 bg-surface-container/60 p-6 md:p-8">
                    <p className="text-[9px] uppercase tracking-[0.55em] text-primary font-bold mb-4">Key takeaways</p>
                    <ul className="space-y-4">
                      {selectedPost.takeaways.map(item => (
                        <li key={item} className="text-sm md:text-base text-secondary leading-relaxed flex gap-3">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </div>
              </div>
            </motion.div>
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
      desc: "A deliberately reserved investor circle — no public roster, no published count. Exclusivity is our core mandate."
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
      desc: "A finite number of seats per project, never disclosed publicly. Early entry is not just an advantage — it's a prerequisite."
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
    <section id="membership" className="py-16 px-12 md:px-24 bg-forest-section text-[#e0dace]">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-cream/60 text-[10px] font-bold uppercase tracking-[0.6em] mb-8 block">The Membership</span>
            <h2 className="text-5xl md:text-8xl font-medium mb-12">The Power of <br /><span className="italic text-gold">Collective</span> Intelligence.</h2>
            <p className="text-xl md:text-2xl font-light text-white/50 leading-relaxed mb-16">
              As independent curators, we partner with visionary developers like MODCON to bring you organic properties that matter. Membership is the key to unlocking India's most serene real estate.
            </p>
            <div className="p-8 border border-gold/20 bg-gold/5 inline-block">
              <p className="text-gold text-[10px] uppercase tracking-[0.4em] font-bold mb-2">Current Capacity</p>
              <p className="text-3xl font-serif italic">A Reserved Investor Circle — By Invitation Only</p>
            </div>
          </div>
          
          <div className="space-y-12">
            {benefits.map((b, i) => (
              <div key={i} className="p-10 border border-white/8 bg-white/[0.03] backdrop-blur-sm">
                <div className="text-gold mb-6">{b.icon}</div>
                <h4 className="text-2xl font-bold mb-4">{b.title}</h4>
                <p className="text-white/50 leading-relaxed">{b.desc}</p>
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
                Unlocks access to future landmarks.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const INVESTMENT_BRACKETS = [
  '₹50 L – ₹1 Cr',
  '₹1 Cr – ₹2 Cr',
  '₹2 Cr – ₹5 Cr',
  '₹5 Cr+',
  'Prefer not to say',
];

const ApplicationForm = () => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    company: '', designation: '', investmentBracket: '',
    intent: '',
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) return;
    setLoading(true);
    try {
      await saveLead({
        name: form.name,
        email: form.email,
        intent: [
          form.designation && `${form.designation}${form.company ? ' at ' + form.company : ''}`,
          form.investmentBracket && `Budget: ${form.investmentBracket}`,
          form.intent,
        ].filter(Boolean).join(' | '),
      });
      await saveNewsletter(form.email, 'modal');
      setSubmitted(true);
    } catch (err) {
      console.error('[ApplicationForm] Lead save failed:', err);
      setSubmitError('Submission failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-transparent border-b border-olive-800/20 py-4 text-olive-900 text-sm font-light placeholder:text-olive-800/25 focus:outline-none focus:border-olive-800/60 transition-colors";
  const labelCls = "block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-1";

  return (
    <section id="apply" className="relative bg-olive-900 overflow-hidden">

      {/* Background texture — subtle organic pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%"><defs><pattern id="grain" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="1" fill="white"/><circle cx="5" cy="5" r="0.5" fill="white"/><circle cx="35" cy="35" r="0.5" fill="white"/><circle cx="5" cy="35" r="0.7" fill="white"/><circle cx="35" cy="5" r="0.7" fill="white"/></pattern></defs><rect width="100%" height="100%" fill="url(#grain)"/></svg>
      </div>

      {/* Gold accent line top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/60 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-24 py-28 md:py-36">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">

          {/* ── Left — editorial copy ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="lg:sticky lg:top-24"
          >
            <div className="flex items-center gap-4 mb-10">
              <div className="w-8 h-px bg-[#c8a951]/60" />
              <span className="text-[#c8a951] text-[9px] font-bold uppercase tracking-[0.6em]">Reserved Investor Circle</span>
            </div>

            <h2 className="text-5xl md:text-6xl lg:text-7xl font-medium text-cream leading-[1.05] mb-10">
              Request Your<br />
              <span className="italic text-[#c8a951]">Adviser Call.</span>
            </h2>

            <p className="text-lg font-light text-cream/40 leading-relaxed mb-14 max-w-md">
              Our adviser reviews every application personally. If your profile aligns with our collective, you'll receive a private call within 24 hours.
            </p>

            {/* What you get */}
            <div className="space-y-0 border border-cream/10 divide-y divide-cream/10">
              {[
                { num: '01', title: 'Personal Adviser Call', desc: 'Direct conversation — no forms, no bots' },
                { num: '02', title: 'Pre-Launch Entry Price', desc: 'The only price that compounds before the public knows' },
                { num: '03', title: 'Intelligence Briefings', desc: 'Monthly sanctuary reports, auto-enrolled' },
              ].map(item => (
                <div key={item.num} className="flex gap-6 p-6 group hover:bg-cream/[0.03] transition-colors">
                  <span className="text-[#c8a951]/40 text-xs font-bold font-mono mt-1 flex-shrink-0">{item.num}</span>
                  <div>
                    <p className="text-cream/90 text-sm font-semibold mb-1">{item.title}</p>
                    <p className="text-cream/30 text-xs font-light leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[9px] text-cream/15 uppercase tracking-widest mt-8 leading-relaxed">
              Submission auto-enrolls your email in our monthly intelligence newsletter.
            </p>
          </motion.div>

          {/* ── Right — floating form card ── */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#c8a951]/10 border border-[#c8a951]/30 p-16 md:p-20 text-center"
              >
                <div className="w-20 h-20 rounded-full border border-[#c8a951]/40 flex items-center justify-center mx-auto mb-10">
                  <Check className="w-9 h-9 text-[#c8a951]" />
                </div>
                <p className="text-[9px] uppercase tracking-[0.6em] text-[#c8a951]/60 font-bold mb-4">Application Logged</p>
                <h3 className="text-3xl md:text-4xl font-serif italic text-cream mb-6">We'll be in touch.</h3>
                <p className="text-cream/40 font-light leading-relaxed max-w-xs mx-auto text-sm">
                  Your adviser will reach out personally within 24 hours. You're now part of our monthly intelligence network.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] border border-outline/10">

                {/* Form header strip */}
                <div className="bg-olive-800 px-10 py-7 flex items-center justify-between">
                  <div>
                    <p className="text-[8px] uppercase tracking-[0.5em] text-cream/40 font-bold">Private Application</p>
                    <p className="text-cream text-sm font-semibold mt-0.5">Adviser Membership · The Green Team</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#c8a951]/20 border border-[#c8a951]/30 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-[#c8a951]" />
                  </div>
                </div>

                <div className="p-10 md:p-12 space-y-9">

                  {/* Row 1 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div className="group">
                      <label htmlFor="m-name" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">Full Name *</label>
                      <input id="m-name" name="name" value={form.name} onChange={e => set('name', e.target.value)} required
                        className="w-full bg-transparent border-b-2 border-olive-800/15 focus:border-olive-900 py-3 text-olive-900 text-sm font-medium placeholder:text-olive-800/20 focus:outline-none transition-colors"
                        placeholder="Your full name" />
                    </div>
                    <div className="group">
                      <label htmlFor="m-phone" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">Mobile *</label>
                      <input id="m-phone" name="phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} required
                        className="w-full bg-transparent border-b-2 border-olive-800/15 focus:border-olive-900 py-3 text-olive-900 text-sm font-medium placeholder:text-olive-800/20 focus:outline-none transition-colors"
                        placeholder="+91 98765 43210" />
                    </div>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <label htmlFor="m-email" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">Private Email *</label>
                    <input id="m-email" name="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required
                      className="w-full bg-transparent border-b-2 border-olive-800/15 focus:border-olive-900 py-3 text-olive-900 text-sm font-medium placeholder:text-olive-800/20 focus:outline-none transition-colors"
                      placeholder="email@company.com" />
                  </div>

                  {/* Row 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="m-designation" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">Designation</label>
                      <input id="m-designation" name="designation" value={form.designation} onChange={e => set('designation', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-olive-800/15 focus:border-olive-900 py-3 text-olive-900 text-sm font-medium placeholder:text-olive-800/20 focus:outline-none transition-colors"
                        placeholder="Founder, Director…" />
                    </div>
                    <div>
                      <label htmlFor="m-company" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">Company / Venture</label>
                      <input id="m-company" name="company" value={form.company} onChange={e => set('company', e.target.value)}
                        className="w-full bg-transparent border-b-2 border-olive-800/15 focus:border-olive-900 py-3 text-olive-900 text-sm font-medium placeholder:text-olive-800/20 focus:outline-none transition-colors"
                        placeholder="Your organisation" />
                    </div>
                  </div>

                  {/* Investment appetite */}
                  <div>
                    <label className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-4">Investment Appetite</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INVESTMENT_BRACKETS.map(b => (
                        <button key={b} type="button" onClick={() => set('investmentBracket', b)}
                          className={cn(
                            "py-3 px-3 text-[9px] uppercase tracking-widest font-bold border-2 transition-all text-center leading-tight",
                            form.investmentBracket === b
                              ? "bg-olive-900 text-[#c8a951] border-olive-900 shadow-lg"
                              : "bg-transparent border-olive-800/15 text-olive-800/40 hover:border-olive-800/40 hover:text-olive-900"
                          )}>
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Intent */}
                  <div>
                    <label htmlFor="m-intent" className="block text-[8px] uppercase tracking-[0.5em] text-olive-800/40 font-bold mb-2">What draws you here? <span className="normal-case tracking-normal font-normal opacity-60">(optional)</span></label>
                    <textarea id="m-intent" name="intent" value={form.intent} onChange={e => set('intent', e.target.value)} rows={3}
                      className="w-full bg-olive-800/5 border border-olive-800/10 px-5 py-4 text-olive-900 text-sm font-light placeholder:text-olive-800/20 focus:outline-none focus:border-olive-800/30 transition-colors resize-none"
                      placeholder="What draws you to pre-launch sanctuary investing?" />
                  </div>

                  {/* Submit */}
                  <div className="pt-2">
                    <button type="submit" disabled={loading}
                      className="w-full py-5 bg-olive-900 text-cream text-[10px] uppercase tracking-[0.6em] font-bold hover:bg-[#c8a951] hover:text-olive-900 transition-all duration-300 flex items-center justify-center gap-4 disabled:opacity-50 group">
                      {loading
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</>
                        : <><span>Request Adviser Call</span><ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                      }
                    </button>
                    {submitError && (
                      <p className="text-[10px] text-red-500 text-center mt-3">{submitError}</p>
                    )}
                    <p className="text-[8px] text-center text-olive-800/25 uppercase tracking-widest mt-4">
                      Your details are private · Auto-enrolled in monthly intelligence briefings
                    </p>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </div>

      {/* Gold accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/40 to-transparent" />
    </section>
  );
};

const Footer = ({ onModeChange, onPropertySelect }: { onModeChange: (mode: string) => void, onPropertySelect?: (id: string) => void }) => {
  const agenda = [
    { label: 'The Intelligence Gap', sub: 'Why early entry wins', mode: 'analytics' },
    { label: 'Living Ecosystems', sub: 'Nature-first design philosophy', mode: 'gallery' },
    { label: 'Sanctuary Map', sub: 'Environmental heatmap · AQI · Noise', mode: 'map' },
    { label: 'MODCON Agartha', sub: 'Narsapur Forest · Open access', mode: 'agartha' },
    { label: 'MODCON SYL Residences', sub: 'Tukkuguda, ORR Exit-14 · Newsletter access', mode: 'syl' },
    { label: 'Dates County by Planet Green', sub: 'Kandukur · 4,000-acre reserve · Channel partner', mode: 'dates-county' },
    { label: 'Adviser Membership', sub: 'Reserved investor circle · By invitation', mode: 'membership' },
  ];

  return (
    <footer className="bg-forest-section text-[#e0dace] pt-24 pb-16 px-6 md:px-24">
      <div className="max-w-7xl mx-auto">

        {/* Top: brand + tagline */}
        <div className="border-b border-white/8 pb-16 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-10">
          <div>
            <Logo className="w-10 h-10 text-[#a3b18a] mb-6" onDark={true} />
            <p className="text-2xl md:text-3xl font-light text-white/30 max-w-xl leading-relaxed">
              We curate verified forest-adjacent communities for investors seeking intentional, sustainable living with transparent investment fundamentals.
            </p>
          </div>
          <button
            onClick={() => onModeChange('membership')}
            className="flex-shrink-0 flex items-center gap-3 px-8 py-4 border border-cream/20 text-cream text-[9px] uppercase tracking-[0.5em] font-bold hover:bg-cream hover:text-olive-900 transition-all self-start md:self-auto"
          >
            Apply for Access <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Agenda grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5 mb-16">
          {agenda.map(item => (
            <button
              key={item.mode}
              onClick={() => {
                if ((item.mode === 'agartha' || item.mode === 'syl' || item.mode === 'dates-county') && onPropertySelect) {
                  onPropertySelect(item.mode);
                } else {
                  onModeChange(item.mode);
                }
              }}
              className="group text-left p-8 bg-forest-section hover:bg-white/5 transition-all"
            >
              <p className="text-[8px] uppercase tracking-[0.5em] text-white/25 font-bold mb-2 group-hover:text-[#8aab78]/70 transition-colors">{item.sub}</p>
              <p className="text-base font-medium text-white/60 group-hover:text-white transition-colors flex items-center gap-2">
                {item.label}
                <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </p>
            </button>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[9px] uppercase tracking-[0.5em] text-white/20 font-bold">
            © {new Date().getFullYear()} The Green Team · Channel Partners · Hyderabad
          </p>
          <div className="flex items-center gap-8">
            <a href="https://www.instagram.com/the.green.team__" target="_blank" rel="noopener noreferrer" aria-label="The Green Team on Instagram" className="text-cream/20 hover:text-cream transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="https://linkedin.com/company/the-green-team-india" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-cream/20 hover:text-cream transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                <rect x="2" y="9" width="4" height="12" />
                <circle cx="4" cy="4" r="2" />
              </svg>
            </a>
            <a href="mailto:hello@thegreenteam.in" aria-label="Email" className="text-cream/20 hover:text-cream transition-all">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

const TrustSignals = () => {
  const principles = [
    {
      label: 'We don\'t list properties.',
      value: 'We curate communities.',
    },
    {
      label: 'We don\'t chase volume.',
      value: 'We protect standards.',
    },
    {
      label: 'We don\'t work with every developer.',
      value: 'Only awarded ones.',
    },
  ];

  return (
    <section className="py-20 px-6 md:px-24 bg-surface border-y border-outline/10">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-14">
          <span className="text-olive-800 text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">The Green Team</span>
          <h2 className="text-4xl md:text-6xl font-light text-on-surface leading-tight">
            A curation house.<br />
            <span className="italic font-medium">Not a listing portal.</span>
          </h2>
        </motion.div>

        {/* Principles */}
        <div className="grid md:grid-cols-3 gap-px bg-outline/10 mb-14">
          {principles.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className="bg-surface p-8"
            >
              <p className="text-sm text-secondary/60 mb-2">{p.label}</p>
              <p className="text-xl font-headline font-bold text-olive-900">{p.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Partners + Award row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-wrap gap-8 md:gap-12">
            {[
              { name: 'MODCON', sub: 'Developer Partner' },
              { name: 'ARQEN', sub: 'Architecture' },
            ].map(p => (
              <div key={p.name}>
                <p className="font-headline font-bold text-lg tracking-widest uppercase text-olive-900/70">{p.name}</p>
                <p className="text-[8px] uppercase tracking-[0.4em] text-secondary/40 font-bold mt-0.5">{p.sub}</p>
              </div>
            ))}
          </div>

          {/* Award */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="flex items-center gap-3 border border-gold/30 bg-gold/5 px-6 py-4 rounded-xl"
          >
            <span className="text-gold text-xl flex-shrink-0">★</span>
            <div>
              <p className="text-[8px] uppercase tracking-[0.35em] font-bold text-gold/80">MODCON Agartha · Outlook Business 2024</p>
              <p className="text-sm font-headline font-bold text-olive-900 mt-0.5">Best Sustainable Eco-Friendly Project</p>
              <p className="text-[8px] text-olive-900/40 mt-0.5">Our curated partner project</p>
            </div>
          </motion.div>
        </div>

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
    <section className="py-32 px-6 md:px-24 bg-forest-section text-[#e0dace] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current">
          <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C28 90 10 72 10 50S28 10 50 10s40 18 40 40-18 40-40 40z" />
        </svg>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-gold text-[10px] font-bold uppercase tracking-[0.6em] mb-8 block">The Intelligence Network</span>
            <h2 className="text-5xl md:text-7xl font-medium mb-12">Stay ahead of <br /><span className="italic text-white/50">the resource curve.</span></h2>
            <p className="text-xl font-light text-white/50 leading-relaxed max-w-md">
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

  // ── Embedded knowledge base — Groot always knows all sanctuary data ──────
  const GROOT_KNOWLEDGE = `
=== THE GREEN TEAM — COMPLETE KNOWLEDGE BASE FOR GROOT ===

ABOUT THE GREEN TEAM:
The Green Team is India's only independent curation house for conscious forest communities, based in Hyderabad. We are NOT developers and NOT a listing portal — we are curators. We handpick forest-adjacent conscious living communities for a private circle of intelligent investors. Every property must clear our strict curation standard: verified forest boundary, AQI below 25, intentional community design, investment-grade appreciation, and awarded sustainable architecture. We partner exclusively with developers like MODCON Builders who have won national sustainability awards.

TWO OPTIONS FOR USERS:
1. NEWSLETTER (Monthly Briefings) — Join our intelligence network for monthly environmental integrity reports, sanctuary valuations, and curation alerts. Free to join.
2. ADVISER ACCESS — Apply for a private call with your dedicated adviser. We contact you within 24 hours. You get VIP pricing, early-entry coordinates, and monthly briefings.

CURRENT PROPERTY: MODCON AGARTHA — "Roots of Earth"
- Location: Janakampet, Narsapur, Hyderabad, Telangana (near RRR — Regional Ring Road)
- Type: 25-acre regenerative permaculture farm estate
- Developer: MODCON Builders (Co-founders: Chandu Reddy & Manikanta Sridhar Malladi)
- Architects: ARQEN
- Award: Best Sustainable Eco-Friendly Project of the Year 2024 — Outlook Business Spotlight Entity Awards, Taj Banjara, Hyderabad
- Plots: 36 unique farm plots (808 – 4,800 sq yds)
- Price: ₹8,500 per sq yd
- Starting: From ₹68.7 L (808 sq yds) — entry under ₹1 Cr; better pricing available on in-person visit (negotiate)
- Premium Corner (Plot 3): ~4,800 sq yds, forest boundary — largest plot (~₹4.08 Cr)
- Biomorphic Construction Add-On: MODCON's biomorphic design studio offers a 150 sq yd (1,350 SFT) mud · bamboo · lime · Bali-style home within the plot for an additional ₹35–50 Lakhs. Enquire for custom build quote.
- Clubhouse: 36,000 sq ft with 5 premium amenities
- 5 Amenities: Aquatic pool, fully-equipped gym, kayaking lake, farm-to-table restaurant, children's play area + staycation villas
- Each plot includes: Advanced drip irrigation, 100+ tree varieties pre-planted, vegetable beds, spiral herbal garden
- Goshala: On-site with integrated animal husbandry for holistic farming
- AQI: 12 (WHO pristine — Hyderabad city average is 85)
- Noise: 18 dB (near silent — city average 65-70 dB)
- Commute: 40 mins to Financial District (Gachibowli / HITECH City)
- Website: https://www.agartha.in/

INVESTMENT ANALYSIS:
- VIP Pre-Launch Rate (Aug 2024): ₹6,199/sq yd
- Current Rate (2026): ₹8,500/sq yd
- Appreciation: +37.1% in ~18 months
- Annualised ROI: ~24.7% p.a. — significantly outperforming FD (7%), gold (12%), and Sensex (~13% avg)
- Example (Plot 28 — 2,057 sq yds): Pre-launch ₹1.28 Cr → Today ₹1.75 Cr → Gain of ₹47 L in 18 months
- This is farmland near RRR — infrastructure appreciation (RRR corridor) compounds the organic permaculture value

ENVIRONMENTAL INTELLIGENCE:
- Narsapur Forest AQI: 12 (pristine — Hyderabad city average is 85)
- Narsapur Noise: 18 dB (near silent — city average 65-70 dB)
- Real-time environmental heatmaps available in the Map view: AQI in teal, Noise in indigo
- Green zones near sanctuaries; red zones near Patancheru industrial corridor

WHY CONSCIOUS FOREST COMMUNITIES (the TGT thesis):
- Both current TGT properties are forest-adjacent — Agartha borders Narsapur forest, near RRR
- AQI 12 vs Hyderabad city average of 85 = measurably better air, health, and quality of life
- Forest communities command appreciation premiums as urban pollution worsens — scarcity play
- Conscious living = intentional neighbours, curated amenities, permaculture farms, resort lifestyle
- You're not buying a plot — you're buying into a community of people who chose to live differently
- Near RRR (infrastructure play) + forest boundary (scarcity play) + permaculture (lifestyle play) = triple moat

SECOND PROPERTY: MODCON SYL RESIDENCES
- Full Name: MODCON SYL Residences
- Developer: MODCON Builders
- Location: Tukkuguda, ORR Exit-14, Hyderabad, Telangana
- Total Area: 4.5 Acres
- Type: Villaments — a hybrid of villa freedom and apartment living
- Design: Biophilic architecture with forest landscape views, large balconies, sunrise views
- AQI: ~22 (clean — city is 85–180)
- Commute: 10 mins to RGI Airport · 30–45 mins to Financial District / Gachibowli / Kondapur
- Nearby in 2–5 min: ORR Exit-14, Fab City, Pedda Golconda
- Nearby in 10–15 min: RGI Airport, Aga Khan Academy, Manchester Global School, Wonderla, Statue of Equality
- Nearby in 30–45 min: Apollo Hospital, Kamineni Hospital, Gachibowli, Financial District, Jubilee Hills, LB Nagar, Ramaoji Film City
- Clubhouse: 22,000 sq ft — theme: Health • Wellness • Nature
- Amenities: Natural Bio Pool (chemical-free), Yoga & Meditation Pavilion, Wellness & Fitness Centre, Landscaped Green Corridors, Express Mart, Dedicated Parking per unit, EV Charging Points, 4 High-Speed Lifts, 100% Power Backup, Gated Community with 24/7 CCTV
- Commercial Component: MODCON ONE — 1.5 acres mixed-use retail, offices, F&B in same campus
- Commercial Pricing: Available at exclusive one-time investor (OTP) prices — direct enquiry only, do not quote a rate
- Villament sizes: 2,500 SFT to 4,500 SFT
- Access: Newsletter subscribers only (gated)
- Growth Corridor: Tukkuguda is in Hyderabad's 4th City expansion corridor — early-stage investment with strong appreciation potential
- Current Phase: Pre-Investor Phase — NOW RUNNING. This is the lowest pricing available. Once booking targets are hit, price moves to pre-launch rate (higher). Then public launch rate (higher still).
- Investor Advantage: Pre-investor pricing locked at ₹4,499/SFT · First pick of best units/floors/views · Full appreciation from ground up
- FOMO Angle: Agartha investors gained +37% in 18 months. SYL at Tukkuguda's 4th City corridor is the same opportunity — but early. If someone asks why now, explain the phase structure.
- Contact: +91 9700144003 (WhatsApp) · Modconbuilderpvt.ltd@gmail.com · modconbuilders.com
- TGT Role: Channel partner — we introduce interested buyers directly to MODCON Builders

WHAT GROOT SHOULD DO:
- Answer questions about Agartha, SYL Residences, investment, environment, commute, amenities, lifestyle
- Guide users toward action: "Apply for Adviser Access" or "Join Newsletter"
- Never invent data you don't have — say "I am Groot. (I'll connect you with our adviser for that detail.)"
- Be concise, warm, exclusive — maximum 3-4 sentences per response
- Always start with "I am Groot." then provide the actual helpful answer in parentheses
`;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);



    try {
      const systemInstruction = `You are "Groot", a sophisticated AI advisor for "The Green Team" sanctuary curation company.
You have a warm "I am Groot" personality — heroic, protective of nature, and occasionally witty.
Always start responses with "I am Groot." then provide the actual helpful answer in parentheses immediately after.
You are professional, exclusive, ethical, and concise. Maximum 3-4 sentences.

${GROOT_KNOWLEDGE}

Additional live context (user data): ${JSON.stringify({ user: data.user?.displayName || 'Guest', sanctuaryCount: data.sanctuaries?.length ?? 1 })}`;

      // Prepare conversation history for Pollinations (OpenAI format)
      const payload = {
        messages: [
          { role: "system", content: systemInstruction },
          ...messages.map(m => ({ 
            role: m.role === 'model' ? 'assistant' : 'user', 
            content: m.text 
          })),
          { role: "user", content: userMsg }
        ],
        model: "openai",
        jsonMode: false
      };

      const res = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Pollinations API error: ${res.status}`);
      
      const responseText = await res.text();
      setMessages(prev => [...prev, { role: 'model', text: responseText || "I am Groot. (I apologize, I am currently unable to process your request. Please contact our relationship managers directly.)" }]);
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I am Groot. (My neural pathways are currently recharging. Please reach out directly via the Adviser Access form below.)" }]);
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
        className="fixed bottom-20 right-6 md:bottom-8 md:right-8 z-[999] w-12 h-12 bg-olive-900 text-cream border border-olive-800/20 rounded-full shadow-lg flex items-center justify-center hover:bg-primary hover:border-primary/30 transition-all duration-300 group"
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
              className="fixed inset-0 z-[995] bg-black/10 backdrop-blur-[1px]"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-20 right-6 md:bottom-32 md:right-8 z-[9981] w-[340px] max-w-[calc(100vw-3rem)] h-[500px] bg-surface shadow-2xl border border-olive-800/10 flex flex-col overflow-hidden rounded-2xl"
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

const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange, onPropertySelect }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void, onPropertySelect?: (id: string) => void }) => (
  <div className="flex flex-col">
    {/* 1. Hero */}
    <Hero onModeChange={onModeChange} />

    {/* 2. How it works — 3-step explainer */}
    <WhatWeDo />

    {/* 3. Properties */}
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} />

    {/* 4. Blog / journal */}
    <Journal />

    {/* 5. Our 4-point checklist */}
    <EcosystemPillars />

    {/* 6. Newsletter + footer */}
    <NewsletterHighlight onSubscribe={onNewsletterClick} />
    <Footer onModeChange={onModeChange} onPropertySelect={onPropertySelect} />
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

// ─── Auth Modal (Premium Animated) ────────────────────────────────────────────

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
  const [phoneOpen, setPhoneOpen]   = useState(false);
  const [emailMode, setEmailMode]   = useState<'signin' | 'signup'>('signin');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [phone, setPhone]           = useState('');
  const [otp, setOtp]               = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [loading, setLoading]       = useState<'google' | 'email' | 'phone' | null>(null);
  const [error, setError]           = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setEmailOpen(false);
      setPhoneOpen(false);
      setEmailMode('signin');
      setEmail('');
      setPassword('');
      setPhone('');
      setOtp('');
      setOtpSent(false);
      setError('');
      setConfirmationResult(null);
    }
  }, [isOpen]);

  // Initialize reCAPTCHA verifier
  const initializeRecaptcha = useCallback(() => {
    if (!recaptchaVerifierRef.current && auth) {
      try {
        recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {}
        });
      } catch (err: any) {
        console.error('reCAPTCHA init error:', err);
      }
    }
  }, []);

  const handlePhoneSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('phone');
    
    try {
      initializeRecaptcha();
      
      // Format phone number with country code if not present (E.164)
      let formattedPhone = phone.trim().replace(/\s/g, '');
      
      // If no +, assume +91 (India) if it's a 10-digit number or starts with 91
      if (!formattedPhone.startsWith('+')) {
        const digitsOnly = formattedPhone.replace(/\D/g, '');
        if (digitsOnly.length === 10) {
          formattedPhone = '+91' + digitsOnly;
        } else if (digitsOnly.startsWith('91') && digitsOnly.length > 10) {
          formattedPhone = '+' + digitsOnly;
        } else if (digitsOnly.length > 0) {
          // If it's something else, try prepending +
          formattedPhone = '+' + digitsOnly;
        }
      }
      
      if (recaptchaVerifierRef.current) {
        const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
        setConfirmationResult(result);
        setOtpSent(true);
        setOtp('');
      }
    } catch (err: any) {
      console.error('Phone Auth Send Error:', err);
      // Special check for 400 Bad Request which often means Phone Auth is disabled in Firebase Console
      if (err.message?.includes('400') || err.code === 'auth/operation-not-allowed') {
        setError('Phone Authentication might be disabled in your Firebase Settings. Please enable it in the Firebase Console.');
      } else {
        setError(friendlyAuthError(err.code));
      }
    } finally {
      setLoading(null);
    }
  };

  const handlePhoneVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('phone');
    
    try {
      if (!confirmationResult) {
        setError('OTP session expired. Please try again.');
        setOtpSent(false);
        setConfirmationResult(null);
        return;
      }
      
      const cred = await confirmationResult.confirm(otp);
      const isNew = cred.user.metadata.creationTime === cred.user.metadata.lastSignInTime;
      onSuccess(cred.user, isNew);
      onClose();
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      setLoading(null);
    }
  };

  const handlePhoneBack = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setConfirmationResult(null);
  };

  const handleGoogle = async () => {
    setError(''); setLoading('google');
    try {
      if (!auth) throw new Error('Auth not initialized');
      
      // Detect mobile device to choose reliable auth method
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Redirect is much more reliable on mobile Safari and embedded browsers
        await signInWithRedirect(auth, googleProvider);
      } else {
        const { user, operationType } = await signInWithPopup(auth, googleProvider);
        const isNew = operationType === 'signIn' && !user.metadata.creationTime
          ? false
          : user.metadata.creationTime === user.metadata.lastSignInTime;
        onSuccess(user, isNew);
        onClose();
      }
    } catch (err: any) {
      setError(friendlyAuthError(err.code));
    } finally {
      // Don't set loading null if we are redirecting
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (!isMobile) setLoading(null);
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

  // Animated logo component
  const AnimatedLogo = () => (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -180 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150, delay: 0.2 }}
      className="flex justify-center mb-8"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="relative"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#3a5630]/20 to-[#3a5630]/5 flex items-center justify-center relative">
          {/* Glow effect */}
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2], scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 bg-[#3a5630]/20 blur-2xl rounded-full"
          />
          <svg viewBox="0 0 100 100" className="w-12 h-12 fill-current">
            <path d="M50 95C50 95 48 80 40 70C30 60 10 55 5 40C0 25 15 5 40 10C55 13 65 25 70 40C75 55 65 75 50 95Z" className="text-[#3a5630] opacity-30" />
            <path d="M50 90C50 90 52 75 60 65C70 55 90 50 95 35C100 20 85 0 60 5C45 8 35 20 30 35C25 50 35 70 50 90Z" className="text-[#3a5630]" />
            <path d="M50 90L50 40M50 90C50 90 45 70 35 60M50 90C50 90 55 70 65 60" fill="none" stroke="#3a5630" strokeWidth="1" strokeLinecap="round" className="opacity-50" />
          </svg>
        </div>
        {/* Animated rings around logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-3xl border-2 border-transparent border-t-[#3a5630]/40 border-r-[#3a5630]/20"
        />
      </motion.div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center">
          {/* Animated backdrop with gradient */}
          <motion.div
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gradient-to-b from-olive-900/60 to-olive-900/90 backdrop-blur-xl"
          />
          
          {/* Main modal container */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full sm:max-w-4xl bg-cream sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left: Image (Hidden on mobile) */}
            <div className="hidden md:block md:w-1/2 relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=1200"
                alt="Sanctuary"
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-olive-900/40 backdrop-blur-[2px]" />
              <div className="absolute inset-0 p-12 flex flex-col justify-end text-cream">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="text-[10px] uppercase tracking-[0.6em] font-bold mb-4 text-primary-foreground/60">The Green Team</p>
                  <h3 className="text-4xl font-serif italic leading-tight mb-6">Where the forest <br />becomes home.</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-px bg-cream/30" />
                    <p className="text-xs font-light tracking-widest uppercase opacity-60">Independent Sanctuary Curators</p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Right: Form content */}
            <div className="w-full md:w-1/2 flex flex-col">
              {/* Animated gradient header */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative bg-gradient-to-br from-olive-900 via-olive-800 to-primary/20 px-10 pt-12 pb-12 text-cream text-center overflow-hidden"
              >
                {/* Animated background elements */}
                <motion.div
                  animate={{ opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"
                />
                
                {/* Logo */}
                <div className="relative z-10">
                  <AnimatedLogo />
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-serif italic mb-2 font-bold tracking-tight"
                  >
                    Unlock The Sanctuaries
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-cream/60 text-xs font-light tracking-wide"
                  >
                    Pre-launch access · Exclusive investor pricing
                  </motion.p>
                </div>
              </motion.div>

              {/* Form content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-10 py-10 space-y-6 flex-1 overflow-y-auto"
              >
              {/* Google — PRIMARY CTA */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGoogle}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-olive-800/10 rounded-2xl text-olive-900 text-sm font-semibold shadow-sm hover:shadow-lg hover:border-olive-800/20 transition-all disabled:opacity-60"
              >
                {loading === 'google'
                  ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <RefreshCw className="w-5 h-5 text-olive-800/40" />
                    </motion.div>
                  : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )
                }
                <span>{loading === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
              </motion.button>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-4"
              >
                <motion.div className="flex-1 h-px bg-gradient-to-r from-transparent via-olive-800/20 to-transparent" />
                <span className="text-[9px] uppercase tracking-[0.4em] text-olive-800/30 font-bold">or</span>
                <motion.div className="flex-1 h-px bg-gradient-to-r from-transparent via-olive-800/20 to-transparent" />
              </motion.div>

              {/* Email — secondary, expandable */}
              {!emailOpen ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setEmailOpen(true)}
                  className="w-full py-3.5 border border-olive-800/15 rounded-2xl text-olive-900/60 text-sm hover:border-olive-800/30 hover:text-olive-900 transition-all"
                >
                  Continue with Email
                </motion.button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleEmail}
                  className="space-y-4 overflow-hidden"
                >
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                    <label htmlFor="auth-email" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Email</label>
                    <input id="auth-email" name="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      placeholder="email@domain.com" autoFocus />
                  </motion.div>
                  <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.15 }}>
                    <label htmlFor="auth-password" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Password</label>
                    <input id="auth-password" name="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                      placeholder="••••••••" />
                  </motion.div>
                  {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs">{error}</motion.p>}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!!loading}
                    className="w-full py-3.5 bg-gradient-to-r from-olive-900 to-primary text-cream text-sm font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading === 'email' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                      <RefreshCw className="w-4 h-4" />
                    </motion.div> : <ArrowRight className="w-4 h-4" />}
                    {loading === 'email' ? 'Please wait…' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </motion.button>
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-[10px] text-olive-800/40">
                    {emailMode === 'signin' ? "New here? " : 'Have an account? '}
                    <button type="button" onClick={() => { setEmailMode(m => m === 'signin' ? 'signup' : 'signin'); setError(''); }}
                      className="text-primary underline underline-offset-2 font-bold hover:text-primary/80 transition-colors">
                      {emailMode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </motion.p>
                </motion.form>
              )}

              {/* Phone — tertiary option */}
              {!phoneOpen ? (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPhoneOpen(true)}
                  className="w-full py-3.5 border border-olive-800/15 rounded-2xl text-olive-900/60 text-sm hover:border-olive-800/30 hover:text-olive-900 transition-all"
                >
                  Continue with Phone
                </motion.button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={otpSent ? handlePhoneVerifyOtp : handlePhoneSendOtp}
                  className="space-y-4 overflow-hidden"
                >
                  {!otpSent ? (
                    <>
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        <label htmlFor="auth-phone" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Phone Number</label>
                        <input id="auth-phone" name="phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                          className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors"
                          placeholder="+91 98765 43210" autoFocus />
                        <p className="text-[8px] text-olive-800/30 mt-1">We'll send you an OTP to verify</p>
                      </motion.div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!!loading}
                        className="w-full py-3.5 bg-gradient-to-r from-olive-900 to-primary text-cream text-sm font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading === 'phone' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <RefreshCw className="w-4 h-4" />
                        </motion.div> : <Send className="w-4 h-4" />}
                        {loading === 'phone' ? 'Sending OTP…' : 'Send OTP'}
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
                        <label htmlFor="auth-otp" className="text-[9px] uppercase tracking-[0.4em] text-olive-800/40 font-bold block mb-1.5">Enter OTP</label>
                        <input id="auth-otp" name="otp" type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} required
                          className="w-full bg-surface border border-outline/20 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-primary/60 transition-colors text-center tracking-widest text-lg font-bold"
                          placeholder="000000" maxLength={6} autoFocus />
                        <p className="text-[8px] text-olive-800/30 mt-1">Sent to {phone}</p>
                      </motion.div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={!!loading || otp.length < 6}
                        className="w-full py-3.5 bg-gradient-to-r from-olive-900 to-primary text-cream text-sm font-semibold rounded-2xl hover:shadow-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {loading === 'phone' ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <RefreshCw className="w-4 h-4" />
                        </motion.div> : <Check className="w-4 h-4" />}
                        {loading === 'phone' ? 'Verifying…' : 'Verify OTP'}
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={handlePhoneBack}
                        className="w-full py-2 text-olive-900/60 text-sm hover:text-olive-900 transition-colors"
                      >
                        Back to Phone
                      </motion.button>
                    </>
                  )}
                </motion.form>
              )}

              {error && !emailOpen && !phoneOpen && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs text-center">{error}</motion.p>}
              {error && phoneOpen && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-xs text-center">{error}</motion.p>}

              {/* reCAPTCHA container — must be in DOM and not 'display: none' for stable initialization */}
              <div id="recaptcha-container" className="absolute opacity-0 pointer-events-none" />

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-center text-[9px] text-olive-800/20 uppercase tracking-widest leading-relaxed"
              >
                By continuing, you agree to our terms.<br />We never spam — only sanctuary intelligence.
              </motion.p>
            </motion.div>
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
                  ? <img src={user.photoURL} referrerPolicy="no-referrer" loading="lazy" decoding="async" alt="You" className="w-11 h-11 rounded-full object-cover ring-2 ring-primary/20" />
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
  type ViewMode = 'home' | 'map' | 'list' | 'analytics' | 'syl' | 'membership' | 'preinvestor-gold' | 'blog';
  const VIEW_ORDER: ViewMode[] = ['home', 'list', 'analytics', 'syl', 'map', 'preinvestor-gold', 'blog'];

  const getViewModeFromPath = useCallback((pathname: string): ViewMode => {
    if (pathname === '/blog' || pathname.startsWith('/blog/')) return 'blog';
    if (pathname === '/map') return 'map';
    if (pathname === '/list') return 'list';
    if (pathname === '/analytics') return 'analytics';
    if (pathname === '/syl') return 'syl';
    if (pathname === '/membership') return 'membership';
    if (pathname === '/preinvestor-gold') return 'preinvestor-gold';
    return 'home';
  }, []);

  const getPathForView = useCallback((mode: ViewMode) => {
    if (mode === 'home') return '/';
    return `/${mode}`;
  }, []);

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
      // Ensure all signups are captured as leads immediately
      saveLead({
        name: user.displayName || 'New User',
        email: user.email || undefined,
        intent: 'New Sign-up',
        source: 'signup'
      }).catch(() => {}); 
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
    if (!auth) return;
    
    // 1. Handle redirect result (for mobile Google sign-in)
    getRedirectResult(auth)
      .then((result) => {
        if (result && result.user) {
          const isNew = result.operationType === 'signIn' && !result.user.metadata.creationTime
            ? false
            : result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
          handleAuthSuccess(result.user, isNew);
        }
      })
      .catch((err) => {
        console.error('Redirect auth error:', err);
      });

    // 2. Regular auth state observer
    const unsub = onAuthStateChanged(auth, u => {
      setAuthUser(u);
      if (u?.email === ADMIN_EMAIL) setShowAdmin(true);
      // Silent location refresh on session restore
      if (u) setTimeout(() => captureLocation(u.uid), 2000);
    });
    return unsub;
  }, [captureLocation, handleAuthSuccess]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Immediately clear local state so UI responds right away
      setAuthUser(null);
      setShowAdmin(false);
      setShowAdminPanel(false);
      window.history.pushState({}, '', '/');
      setViewMode('home');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem('gt_subscribed') === 'true';
  });
  // A logged-in user is always treated as a subscriber - no gates shown
  const effectivelySubscribed = isSubscribed || !!authUser;
  const [isNewsletterOpen, setIsNewsletterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => getViewModeFromPath(window.location.pathname));
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('gt_dark') === 'true';
  });

  // Persist dark mode and apply to <html> so all CSS vars + scrollbars respond
  useEffect(() => {
    localStorage.setItem('gt_dark', String(isDark));
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const pathname = window.location.pathname;
    const route = getViewModeFromPath(pathname);
    const canonicalPath = route === 'blog' ? '/blog' : route === 'home' ? '/' : getPathForView(route);
    const canonicalHref = `https://thegreenteam.in${canonicalPath}`;

    const setMeta = (selector: string, attr: 'content' | 'href', value: string) => {
      const el = document.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (el) el.setAttribute(attr, value);
    };

    if (route === 'blog') {
      document.title = 'Blog | The Green Team | Hyderabad Property Insights';
      setMeta('meta[name="description"]', 'content', 'Editorial blog posts from The Green Team on Hyderabad locations, returns, AQI, noise pollution, and curated property decisions.');
      setMeta('meta[property="og:title"]', 'content', 'Blog | The Green Team | Hyderabad Property Insights');
      setMeta('meta[property="og:description"]', 'content', 'Long-form posts on Hyderabad real estate decisions, environmental quality, and curated property selection.');
      setMeta('meta[property="og:url"]', 'content', canonicalHref);
      setMeta('meta[name="twitter:title"]', 'content', 'Blog | The Green Team | Hyderabad Property Insights');
      setMeta('meta[name="twitter:description"]', 'content', 'Long-form posts on Hyderabad real estate decisions, environmental quality, and curated property selection.');
    } else {
      document.title = 'The Green Team | Forest Homes Near Hyderabad | Channel Partner MODCON Agartha';
      setMeta('meta[name="description"]', 'content', 'We curate forest-adjacent homes near Hyderabad — AQI under 25, 45-min city commute. Channel partners for MODCON Agartha (Narsapur). Plots from ₹64.6L. Villas, apartments & plots verified.');
      setMeta('meta[property="og:title"]', 'content', 'The Green Team | Forest Homes Near Hyderabad | From ₹64.6L');
      setMeta('meta[property="og:description"]', 'content', 'Independent channel partners who curate forest-adjacent homes near Hyderabad. AQI 12, 18 dB noise, under 45-min commute. Plots, villas, apartments — verified before we show you.');
      setMeta('meta[property="og:url"]', 'content', canonicalHref);
      setMeta('meta[name="twitter:title"]', 'content', 'The Green Team | Forest Homes Near Hyderabad');
      setMeta('meta[name="twitter:description"]', 'content', 'We curate forest-adjacent homes near Hyderabad — AQI 12, 18 dB noise, 45-min commute. Channel partners for MODCON Agartha.');
    }

    setMeta('link[rel="canonical"]', 'href', canonicalHref);
  }, [getPathForView, getViewModeFromPath]);

  const [showAdmin, setShowAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<typeof SANCTUARIES[0] | null>(null);

  const handleSubscribe = useCallback(() => {
    setIsSubscribed(true);
    localStorage.setItem('gt_subscribed', 'true');
    setIsNewsletterOpen(false);
  }, []);

  // ── Admin: leads + newsletter + users (real-time when panel is open) ─────
  const [adminLeads, setAdminLeads] = useState<Lead[]>([]);
  const [adminNewsletter, setAdminNewsletter] = useState<NewsletterEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);

  // Real-time listeners — only active while admin panel is open
  useEffect(() => {
    if (!showAdminPanel || !showAdmin) return;
    const unsubLeads = subscribeLeads(setAdminLeads);
    const unsubNL    = subscribeNewsletter(setAdminNewsletter);
    // Users are not real-time — one-time fetch is fine
    if (authUser?.email === ADMIN_EMAIL) {
      getAllUsers().then(setAdminUsers).catch(() => {});
    }
    return () => { unsubLeads(); unsubNL(); };
  }, [showAdminPanel, showAdmin, authUser]);

  // ── Firestore properties (real-time) ──────────────────────────────────── 
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
    // We always want to load from the top when switching views/menu items
    window.history.pushState({}, '', getPathForView(next));
    setViewMode(next);
    
    // Reset scroll position to top for the next view
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          top: 0,
          behavior: 'instant'
        });
      }
    }, 0);
  }, []);

  const handleBlogClick = useCallback(() => {
    window.history.pushState({}, '', '/blog');
    setViewMode('blog');
    setTimeout(() => {
      document.getElementById('journal')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  useEffect(() => {
    const syncFromPath = () => {
      const next = getViewModeFromPath(window.location.pathname);
      setViewMode(next);
    };

    window.addEventListener('popstate', syncFromPath);
    syncFromPath();
    return () => window.removeEventListener('popstate', syncFromPath);
  }, [getViewModeFromPath]);

  return (
    <div className={cn("min-h-screen font-sans transition-colors duration-700", isDark ? "dark" : "")}>
      <div className="bg-surface text-on-surface flex h-screen overflow-hidden">
        
        {/* Navigation Sidebar (Desktop) */}
         { /* SideNavBar removed */ }

        {/* Main Content Area */}
        <main ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth scrollbar-thin scrollbar-thumb-primary/10">
          
          <Navbar 
            isSubscribed={effectivelySubscribed}
            onNewsletterClick={() => setIsNewsletterOpen(true)}
            onModeChange={handleViewChange}
            onBlogClick={handleBlogClick}
            isDark={isDark}
            setIsDark={setIsDark}
            onSignInClick={() => setIsAuthOpen(true)}
            authUser={authUser}
            onSignOut={handleSignOut}
            isAdmin={showAdmin}
            onAdminClick={() => { if (showAdmin) setShowAdminPanel(true); }}
            onPropertySelect={(id) => {
              const sanctuary = allSanctuaries.find(s => s.id === id);
              if (sanctuary) setSelectedProperty(sanctuary);
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              {viewMode === 'home' && (
                <HomeView
                  isSubscribed={effectivelySubscribed}
                  onNewsletterClick={() => setIsNewsletterOpen(true)}
                  sanctuaries={allSanctuaries}
                  onModeChange={handleViewChange}
                  onPropertySelect={(id) => {
                    const sanctuary = allSanctuaries.find(s => s.id === id);
                    if (sanctuary) setSelectedProperty(sanctuary);
                  }}
                />
              )}

              {viewMode === 'blog' && (
                <div className="flex flex-col">
                  <div className="px-6 md:px-24 pt-14 md:pt-20 pb-8 md:pb-12 border-b border-outline/10 bg-surface">
                    <div className="max-w-5xl mx-auto">
                      <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-6 block">Blog</span>
                      <h1 className="text-5xl md:text-8xl font-medium text-on-surface">
                        Notes from the <span className="italic text-primary">curation desk.</span>
                      </h1>
                      <p className="text-xl md:text-2xl font-light text-secondary leading-relaxed mt-8 max-w-3xl">
                        Long-form writing on Hyderabad locations, return signals, environmental comfort, and how curated properties change the quality of daily life.
                      </p>
                    </div>
                  </div>
                  <Journal />
                  <NewsletterHighlight onSubscribe={() => setIsNewsletterOpen(true)} />
                  <Footer onModeChange={handleViewChange} onPropertySelect={(id) => {
                    const sanctuary = allSanctuaries.find(s => s.id === id);
                    if (sanctuary) setSelectedProperty(sanctuary);
                  }} />
                </div>
              )}

              {viewMode === 'map' && (
                <div className="h-[calc(100vh-120px)] md:h-[calc(100vh-56px)] w-full">
                  <SanctuaryMapLayout
                    isVisible={true}
                    onPropertySelect={(id) => {
                      const sanctuary = allSanctuaries.find(s => s.id === id);
                      if (sanctuary) setSelectedProperty(sanctuary);
                    }}
                  />
                </div>
              )}

              {viewMode === 'analytics' && (
                <>
                  <Advantage isFullPage={true} />
                  <EcosystemPillars isFullPage={true} />
                </>
              )}
              
              {viewMode === 'preinvestor-gold' && <PreInvestorGold />}



              {viewMode === 'list' && (
                <div className="px-6 md:px-24 py-16">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <div>
                      <span className="text-primary text-xs font-bold uppercase tracking-[0.6em] mb-4 block">Independent Sanctuaries</span>
                      <h2 className="text-5xl md:text-7xl font-medium text-olive-900 italic">Curated Portfolio.</h2>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {allSanctuaries.map(s => (
                      <SanctuaryCard 
                        key={s.id} 
                        sanctuary={s} 
                        isSubscribed={effectivelySubscribed} 
                        onNewsletterClick={() => setIsNewsletterOpen(true)}
                        onOpen={() => {/* PropertyDetailOverlay handles this via URL/State */}}
                      />
                    ))}
                  </div>
                </div>
              )}

              {viewMode === 'membership' && (
                <div className="flex flex-col">
                  <ApplicationForm />
                  <Footer onModeChange={handleViewChange} onPropertySelect={(id) => {
                    const sanctuary = allSanctuaries.find(s => s.id === id);
                    if (sanctuary) setSelectedProperty(sanctuary);
                  }} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Bottom padding on mobile so content clears the tab bar */}
          {viewMode !== 'map' && <div className="h-16 md:hidden flex-shrink-0" />}

          {/* ChatBot access for all views */}
          <ChatBot data={{ sanctuaries: allSanctuaries, user: authUser }} />
        </main>

        {/* Bottom Tab Bar — mobile persistent navigation */}
        <BottomTabBar activeMode={viewMode} onModeChange={handleViewChange} />
      </div>
      {/* Admin Dashboard overlay — only for sumanthbolla97@gmail.com */}
      <AnimatePresence>
        {selectedProperty && (
          <div className="fixed inset-0 z-[10000] overflow-hidden flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProperty(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full h-full md:h-[90vh] md:max-w-6xl md:rounded-3xl overflow-hidden shadow-2xl"
            >
              <PropertyDetailOverlay 
                sanctuary={selectedProperty} 
                onClose={() => setSelectedProperty(null)} 
                isSubscribed={effectivelySubscribed} 
                onNewsletterSignup={() => setIsNewsletterOpen(true)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Admin Dashboard Panel */}
      <AnimatePresence>
        {showAdminPanel && showAdmin && authUser && (
          <AdminDashboard
            onClose={() => setShowAdminPanel(false)}
            authUser={authUser}
            leads={adminLeads}
            newsletter={adminNewsletter}
            firestoreProps={firestoreProps}
            users={adminUsers}
          />
        )}
      </AnimatePresence>

      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => setIsNewsletterOpen(false)}
        onSubscribe={handleSubscribe}
      />

      {/* Auth Modal — Sign In / Sign Up */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Profile Modal — Post Sign-In Profile Setup */}
      <ProfileModal
        isOpen={showProfile}
        user={profileUser}
        onDone={() => setShowProfile(false)}
      />
    </div>
  );
}
