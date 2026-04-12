import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// ─────────────────────────────────────────────────────────────
// 1. Remove <NewsletterHighlight> from HomeView (duplicate CTA section)
//    Keep <ApplicationForm> as the single conversion point.
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `    <NewsletterHighlight onSubscribe={onNewsletterClick} />\r\n    <ApplicationForm />`,
  `    <ApplicationForm />`
).replace(
  `    <NewsletterHighlight onSubscribe={onNewsletterClick} />\n    <ApplicationForm />`,
  `    <ApplicationForm />`
);

// ─────────────────────────────────────────────────────────────
// 2. Update HomeView signature to accept authUser so it can pass
//    isLoggedIn correctly to ApplicationForm
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange, onPropertyClick }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void, onPropertyClick: (s: Sanctuary) => void }) => (
  <div className="flex flex-col">
    <Hero onModeChange={onModeChange} />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />
    
    <Advantage />
    <EcosystemPillars />
    <TrustSignals />
    <ApplicationForm />
    <Footer onModeChange={onModeChange} />
  </div>
);`,
  `const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange, onPropertyClick, isLoggedIn = false }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void, onPropertyClick: (s: Sanctuary) => void, isLoggedIn?: boolean }) => (
  <div className="flex flex-col">
    <Hero onModeChange={onModeChange} isLoggedIn={isLoggedIn} onNewsletterClick={onNewsletterClick} onAdvisorClick={() => { const el = document.getElementById('apply'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />
    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />
    <Advantage />
    <EcosystemPillars />
    <TrustSignals />
    <ApplicationForm isLoggedIn={isLoggedIn} onNewsletterClick={onNewsletterClick} />
    <Footer onModeChange={onModeChange} />
  </div>
);`
);

// Fallback for CRLF
app = app.replace(
  `const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange, onPropertyClick }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void, onPropertyClick: (s: Sanctuary) => void }) => (\r\n  <div className="flex flex-col">\r\n    <Hero onModeChange={onModeChange} />\r\n    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />\r\n    \r\n    <Advantage />\r\n    <EcosystemPillars />\r\n    <TrustSignals />\r\n    <ApplicationForm />\r\n    <Footer onModeChange={onModeChange} />\r\n  </div>\r\n);`,
  `const HomeView = ({ isSubscribed, onNewsletterClick, sanctuaries = SANCTUARIES, onModeChange, onPropertyClick, isLoggedIn = false }: { isSubscribed: boolean, onNewsletterClick: () => void, sanctuaries?: Sanctuary[], onModeChange: (mode: string) => void, onPropertyClick: (s: Sanctuary) => void, isLoggedIn?: boolean }) => (\r\n  <div className="flex flex-col">\r\n    <Hero onModeChange={onModeChange} isLoggedIn={isLoggedIn} onNewsletterClick={onNewsletterClick} onAdvisorClick={() => { const el = document.getElementById('apply'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }} />\r\n    <Sanctuaries isSubscribed={isSubscribed} onNewsletterClick={onNewsletterClick} sanctuaries={sanctuaries} onOpen={onPropertyClick} />\r\n    <Advantage />\r\n    <EcosystemPillars />\r\n    <TrustSignals />\r\n    <ApplicationForm isLoggedIn={isLoggedIn} onNewsletterClick={onNewsletterClick} />\r\n    <Footer onModeChange={onModeChange} />\r\n  </div>\r\n);`
);

// ─────────────────────────────────────────────────────────────
// 3. Pass isLoggedIn to HomeView inside App()
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `                <HomeView 
                  isSubscribed={effectivelySubscribed} 
                  onNewsletterClick={() => setIsNewsletterOpen(true)} 
                  sanctuaries={allSanctuaries}
                  onModeChange={handleViewChange}
                  onPropertyClick={setSelectedProperty}
                />`,
  `                <HomeView 
                  isSubscribed={effectivelySubscribed}
                  isLoggedIn={!!authUser}
                  onNewsletterClick={() => setIsNewsletterOpen(true)} 
                  sanctuaries={allSanctuaries}
                  onModeChange={handleViewChange}
                  onPropertyClick={setSelectedProperty}
                />`
);

// ─────────────────────────────────────────────────────────────
// 4. Update ApplicationForm to accept isLoggedIn + onNewsletterClick,
//    so it shows contextual copy — no newsletter noise for logged-in users
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `const ApplicationForm = () => {`,
  `const ApplicationForm = ({ isLoggedIn = false, onNewsletterClick }: { isLoggedIn?: boolean, onNewsletterClick?: () => void }) => {`
);

// Update the left-column body copy - show adviser-only copy for logged-in users
app = app.replace(
  `            <p className="text-base font-light text-olive-900/50 leading-relaxed mb-12">
              We curate India's most exclusive pre-launch sanctuaries for a reserved investor circle. Our adviser will personally reach out within 24 hours.
            </p>`,
  `            <p className="text-base font-light text-olive-900/50 leading-relaxed mb-12">
              {isLoggedIn
                ? "You're in our circle. Request a private call with your dedicated adviser for upcoming pre-launch opportunities."
                : "We curate India's most exclusive pre-launch sanctuaries for a reserved investor circle. Our adviser will personally reach out within 24 hours."}
            </p>`
);

// Replace the newsletter footnote at the bottom with context-aware version
app = app.replace(
  `            <p className="text-[9px] text-olive-800/30 uppercase tracking-widest mt-8 leading-relaxed">
              By applying, your email is enrolled in our monthly sanctuary intelligence newsletter.
            </p>`,
  `            {!isLoggedIn && (
              <p className="text-[9px] text-olive-800/30 uppercase tracking-widest mt-8 leading-relaxed">
                Not ready yet?{' '}
                <button onClick={onNewsletterClick} className="underline hover:text-olive-800/60 transition-colors">Join our newsletter</button>{' '}
                for monthly sanctuary briefings.
              </p>
            )}`
);

// Replace the last footer footnote in the form
app = app.replace(
  `                <p className="text-[9px] text-center text-olive-800/25 uppercase tracking-widest">
                  Submitting enrolls you in our monthly intelligence newsletter
                </p>`,
  `                {!isLoggedIn && (
                  <p className="text-[9px] text-center text-olive-800/25 uppercase tracking-widest">
                    Submitting enrolls you in our monthly intelligence newsletter
                  </p>
                )}`
);

// ─────────────────────────────────────────────────────────────
// 5. Navbar mobile menu: replace dual CTA with single smart CTA
//    (Already logged in → go to #apply; not logged in → show sign in)
// ─────────────────────────────────────────────────────────────
app = app.replace(
  `                    <>
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
                    </>`,
  `                    <>
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
                        Monthly Briefings
                      </button>
                    </>`
);

writeFileSync('src/App.tsx', app, 'utf8');
console.log("Done: CTA consolidation applied.");
