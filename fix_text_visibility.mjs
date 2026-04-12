import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// The copyright and tagline in the footer
app = app.replace(
  'className="text-[9px] uppercase tracking-[0.5em] text-cream/15 font-bold"',
  'className="text-[9px] uppercase tracking-[0.5em] text-cream/50 font-bold"'
);

// The main footer paragraph
app = app.replace(
  'className="text-2xl md:text-3xl font-light text-cream/30 max-w-xl leading-relaxed"',
  'className="text-2xl md:text-3xl font-light text-cream/90 max-w-xl leading-relaxed"'
);

// Replace any leftover references if applicable
app = app.replace(
  'Curating India&apos;s most exclusive pre-launch sanctuaries for a private circle of intelligent investors.',
  'Curating India&apos;s most exclusive pre-launch sanctuaries for a private circle of intelligent investors.' // just making sure it's intact
);


writeFileSync('src/App.tsx', app, 'utf8');

console.log("Updated visibility of footer texts!");
