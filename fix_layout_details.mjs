import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// Find the exact closing of the layout tab in the overlay
// We look for the known pattern that ends the layout tab and insert after it
const targetPattern = `              )}\r\n            </motion.div>\r\n          )}\r\n\r\n          {/* ══ DETAILS TAB`;

const summaryInsert = `              )}
            </motion.div>
          )}

          {/* ══ LAYOUT PROPERTY SUMMARY STRIP (below layout plan) */}
          {activeTab === 'layout' && (
            <motion.div key="layout-summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="px-4 pb-28 space-y-4">

              {(sanctuary.plots || sanctuary.plotRange || sanctuary.amenityAcres) && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.5em] text-secondary/50 font-bold mb-3">Community Scale</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: String(sanctuary.plots ?? '53'), label: 'Private Plots' },
                      { val: sanctuary.plotRange ?? '808 - 5,097', label: 'Sq Yd Range' },
                      { val: sanctuary.amenityAcres ?? '14,548', label: 'Amenity Sq Yds' },
                    ].map(s => (
                      <div key={s.label} className="bg-on-surface/5 rounded-2xl p-3 text-center border border-outline/10">
                        <p className="text-sm font-headline font-bold text-primary leading-tight">{s.val}</p>
                        <p className="text-[7px] uppercase tracking-widest text-secondary/50 mt-1">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[9px] uppercase tracking-[0.5em] text-secondary/50 font-bold mb-3">Environmental Integrity</p>
                <div className="space-y-3 bg-on-surface/3 rounded-2xl border border-outline/10 p-4">
                  {[
                    { label: 'Air Quality (AQI)', value: sanctuary.aqi + ' — Pristine', bar: Math.min((50 - sanctuary.aqi) / 50, 1), color: 'bg-emerald-500' },
                    { label: 'Ambient Noise', value: sanctuary.noise + ' dB — Near Silent', bar: Math.min((50 - sanctuary.noise) / 50, 1), color: 'bg-sky-500' },
                    { label: 'Commute', value: sanctuary.commute, bar: 0.75, color: 'bg-primary/70' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-[9px] mb-1">
                        <span className="uppercase tracking-widest text-secondary/60">{item.label}</span>
                        <span className="font-bold text-on-surface/80">{item.value}</span>
                      </div>
                      <div className="h-1 bg-on-surface/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: item.bar * 100 + '%' }}
                          transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                          className={'h-full rounded-full ' + item.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-on-surface/5 rounded-2xl p-4 border border-outline/10">
                  <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Starting Price</p>
                  <p className="text-base font-headline font-bold text-primary">{sanctuary.valuation}</p>
                </div>
                {sanctuary.pricePerSqYd && (
                  <div className="bg-on-surface/5 rounded-2xl p-4 border border-outline/10">
                    <p className="text-[8px] uppercase tracking-widest text-secondary/50 mb-1">Rate / Sq Yd</p>
                    <p className="text-base font-headline font-bold text-on-surface">\u20b9{sanctuary.pricePerSqYd.toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>

              {sanctuary.features && sanctuary.features.length > 0 && (
                <div>
                  <p className="text-[9px] uppercase tracking-[0.5em] text-secondary/50 font-bold mb-3">Key Features</p>
                  <div className="flex flex-wrap gap-2">
                    {sanctuary.features.map((f, i) => (
                      <span key={i} className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[9px] uppercase tracking-wider font-bold border border-primary/15">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {sanctuary.architect && (
                <div className="flex items-center gap-3 p-4 border border-outline/10 rounded-2xl bg-on-surface/3">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[8px] uppercase tracking-widest text-secondary/50">Developer</p>
                    <p className="text-sm font-bold text-on-surface">{sanctuary.architect}</p>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ══ DETAILS TAB`;

if (app.includes(targetPattern)) {
  app = app.replace(targetPattern, summaryInsert);
  console.log("Inserted layout summary block.");
} else {
  console.log("Target pattern not found, trying LF version...");
  const targetLF = targetPattern.replace(/\r\n/g, '\n');
  if (app.includes(targetLF)) {
    app = app.replace(targetLF, summaryInsert.replace(/\r\n/g, '\n'));
    console.log("Inserted with LF.");
  } else {
    console.log("Could not find insertion point.");
    // Debug: find the area around the layout tab end
    const idx = app.indexOf("DETAILS TAB");
    if (idx > -1) {
      console.log("Context around DETAILS TAB:", JSON.stringify(app.substring(idx - 200, idx + 50)));
    }
  }
}

writeFileSync('src/App.tsx', app, 'utf8');
