import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// 1. Remove TheSIL component completely
const silMatch = app.match(/const TheSIL =.*?\n\};/s);
if (silMatch) {
  app = app.replace(silMatch[0], '');
} else {
  console.log("Could not find TheSIL component block using regex.");
  // Let's try an index-based removal since the component is lines 719 to 797
  const startIdx = app.indexOf('const TheSIL =');
  if (startIdx !== -1) {
    const nextConstIdx = app.indexOf('const', startIdx + 10);
    app = app.slice(0, startIdx) + app.slice(nextConstIdx);
  }
}

// 2. Remove references in HomeView
app = app.replace(
  '{isSubscribed && <TheSIL isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} />}',
  ''
);

// 3. Remove references in ViewMode router
app = app.replace(
  `              {viewMode === 'syl' && (
                <TheSIL 
                  isSubscribed={effectivelySubscribed} 
                  onNewsletterClick={() => setIsNewsletterOpen(true)} 
                  isFullPage={true} 
                />
              )}`,
  ''
);

// Fallback for line endings
app = app.replace(
  `              {viewMode === 'syl' && (\r\n                <TheSIL \r\n                  isSubscribed={effectivelySubscribed} \r\n                  onNewsletterClick={() => setIsNewsletterOpen(true)} \r\n                  isFullPage={true} \r\n                />\r\n              )}`,
  ''
);
// Handle the case where TheSIL gets replaced as one string
app = app.replace(/<TheSIL[\s\S]*?\/>/g, '');


// 4. Remove 'syl' from agenda in Footer
app = app.replace(
  `    { label: 'SYL Villament', sub: 'Tukkuguda  Newsletter only', mode: 'syl' },`,
  ''
);

// 5. Remove 'syl' from ViewMode and VIEW_ORDER
app = app.replace(
  `type ViewMode = 'home' | 'map' | 'list' | 'gallery' | 'analytics' | 'syl' | 'membership';`,
  `type ViewMode = 'home' | 'map' | 'list' | 'gallery' | 'analytics' | 'membership';`
);
app = app.replace(
  `const VIEW_ORDER: ViewMode[] = ['home', 'list', 'gallery', 'analytics', 'syl', 'map'];`,
  `const VIEW_ORDER: ViewMode[] = ['home', 'list', 'gallery', 'analytics', 'map'];`
);

// 6. Fix "Unlocks access to SYL and future landmarks." -> "Unlocks access to future landmarks."
app = app.replace(
  `Unlocks access to SYL and future landmarks.`,
  `Unlocks access to future landmarks.`
);

writeFileSync('src/App.tsx', app, 'utf8');
console.log("SYL panel and routes successfully removed.");
