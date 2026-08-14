/**
 * Journal / blog content — authored in-code, rendered at /blog and /blog/[slug].
 * Post ids double as URL slugs; each post now has a real page with its own
 * metadata (v1 rendered these only inside a modal).
 */

export interface JournalPost {
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

export const JOURNAL_POSTS: JournalPost[] = [
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

export const getPost = (slug: string) => JOURNAL_POSTS.find(p => p.id === slug);
