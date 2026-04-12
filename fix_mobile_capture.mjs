import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

// 1. Fix ApplicationForm to pass 'phone'
app = app.replace(
  `      await saveLead({
        name: form.name,
        email: form.email,
        intent: [`,
  `      await saveLead({
        name: form.name,
        email: form.email,
        phone: form.phone,
        intent: [`
);
app = app.replace( // fallback for line endings
  `      await saveLead({\r\n        name: form.name,\r\n        email: form.email,\r\n        intent: [`,
  `      await saveLead({\r\n        name: form.name,\r\n        email: form.email,\r\n        phone: form.phone,\r\n        intent: [`
);

// 2. Add MobileQuickCapture component right before the Navbar
const mobileQuickCaptureCode = `
const MobileQuickCapture = ({ onCaptured }: { onCaptured: () => void }) => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    try {
      await saveLead({
        name: "Express Mobile Lead",
        email: "pending@express.lead",
        phone: phone,
        intent: "Quick Mobile Capture CTA (No Login)"
      });
      setDone(true);
      setTimeout(() => onCaptured(), 3000);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-olive-900 text-cream p-4 flex items-center justify-center gap-3 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border-t border-gold/30 safe-area-bottom">
        <Check className="w-5 h-5 text-gold" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-gold">Adviser Notified</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-surface/90 backdrop-blur-xl border-t border-outline/10 p-4 shadow-[0_-10px_30px_rgba(0,0,0,0.1)] md:hidden safe-area-bottom">
      <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-md mx-auto">
        <div className="flex-1 relative">
          <input 
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Enter mobile for VIP Access"
            className="w-full bg-on-surface/5 border border-outline/20 rounded-full py-3 px-5 text-sm font-medium text-on-surface outline-none focus:border-olive-900 transition-colors"
            required
            pattern="[0-9+ ]{10,15}"
          />
        </div>
        <button 
          type="submit"
          disabled={loading || phone.length < 10}
          className="flex-shrink-0 w-12 h-12 bg-olive-900 text-cream rounded-full flex items-center justify-center shadow-lg disabled:opacity-50 transition-all hover:bg-gold"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
};

// ──  Auth helpers`;

app = app.replace("// ──  Auth helpers", mobileQuickCaptureCode);


// 3. Mount MobileQuickCapture in App() before closing main/div
app = app.replace(
  `        </main>
      </div>`,
  `        </main>
      </div>
      <MobileQuickCapture onCaptured={() => {}} />`
);
app = app.replace( // fallback for line endings
  `        </main>\r\n      </div>`,
  `        </main>\r\n      </div>\r\n      <MobileQuickCapture onCaptured={() => {}} />`
);


writeFileSync('src/App.tsx', app, 'utf8');

console.log("Updated App.tsx with MobileQuickCapture");
