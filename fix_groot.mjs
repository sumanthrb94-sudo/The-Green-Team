import { readFileSync, writeFileSync } from 'fs';

let app = readFileSync('src/App.tsx', 'utf8');

const oldChatBot = `  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const model = "gemini-3-flash-preview";
      const systemInstruction = \`You are "Groot", a sophisticated AI advisor for "The Green Team". 
      You have a "Marvel sentiment" - you are heroic, protective of nature, and occasionally witty. 
      While you are Groot, you MUST be helpful. You can start your responses with "I am Groot" but then provide the actual helpful information in parentheses or as a translation.
      You are professional, exclusive, and ethical. 
      You have access to the following data: \${JSON.stringify(data)}.
      You can also see real-time environmental heatmaps (AQI and Noise) on the map view. 
      AQI is shown in a red spectrum (red/orange/teal), and Noise is shown in a bluish spectrum (blue/indigo/cyan).
      Your goal is to help users understand the value of self-sustaining sanctuaries (food, water, energy security) and guide them towards membership.
      Be concise and maintain a premium tone.\`;

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
  };`;

const newChatBot = `  // ── Embedded knowledge base — Groot always knows all sanctuary data ──────
  const GROOT_KNOWLEDGE = \`
=== THE GREEN TEAM — COMPLETE KNOWLEDGE BASE FOR GROOT ===

ABOUT THE GREEN TEAM:
The Green Team is an independent sanctuary curator based in Hyderabad, India. We curate India's most exclusive pre-launch sanctuaries for a private circle of intelligent investors. We are NOT developers — we are curators. We partner with developers like MODCON to bring self-sustaining, organic properties to a reserved investor circle.

TWO OPTIONS FOR USERS:
1. NEWSLETTER (Monthly Briefings) — Join our intelligence network for monthly environmental integrity reports, sanctuary valuations, and curation alerts. Free to join.
2. ADVISER ACCESS (Membership) — Apply for a private call with your dedicated adviser. We contact you within 24 hours. You get pre-launch pricing, early-entry coordinates, and monthly briefings.

CURRENT PROPERTY: MODCON AGARTHA
- Location: Narsapur Forest Peripheral, Hyderabad (GPS: 17.3816° N, 78.3278° E)
- Type: Biomorphic residential community
- Developer: MODCON Builders
- Plots: 53 unique private plots (no two the same, no straight lines)
- Plot Range: 808 – 5,097 sq yds
- Price: ₹7,999 per sq yd
- Starting Value: ₹1.04 Cr (smallest plot at 808 sq yds)
- Landmark Plot (Plot 15): 5,097 sq yds, dual forest frontage — most premium
- Amenity Core: 14,548 sq yds of organic shared amenities
- AQI: 12 (WHO: anything < 25 is pristine — Narsapur is cleaner than Swiss mountain towns)
- Noise: 18 dB (whisper level; normal Indian urban is 70+ dB)
- Commute: 45 mins to Financial District (Gachibowli / HITECH City)
- Architect Theme: Zero right-angle design, earth + bamboo, solar curved rooftops, living canopies
- Key Features: Biomorphic Architecture, Solar-Curved Rooftops, Narsapur Forest Buffer, Organic Amenity Core, Rainwater Harvesting, Earth & Bamboo Build, Zero Right-Angle Design, Private Plot Community
- Brochure: https://www.agartha.in/

INVESTMENT ANALYSIS:
- Pre-Launch Rate (1 yr ago): ₹6,200/sq yd
- Current Rate: ₹7,999/sq yd
- Appreciation: +29% in 1 year
- Annual ROI: ~29% p.a. — significantly outperforming FD (7%), gold (12%), and Sensex (~13% avg)
- Valuation Example (Plot #15 - 5097 sq yds): Pre-launch ₹3.16 Cr → Today ₹4.08 Cr → Gain of ₹92 L in 1 yr

ENVIRONMENTAL INTELLIGENCE:
- Narsapur Forest AQI: 12 (pristine — Hyderabad city average is 85)
- Narsapur Noise: 18 dB (near silent — city average 65-70 dB)
- Tukkuguda AQI: 22 (SYL zone)
- Real-time environmental heatmaps on the map view: AQI in red/orange/teal, Noise in blue/indigo/cyan
- Green zones near sanctuaries; red zones near Patancheru industrial corridor

THE SELF-SUSTAINING MODEL (why sanctuaries matter):
- FOOD SECURITY: Each sanctuary grows organic produce in community farms — members have access to clean food independent of supply chains
- WATER SECURITY: Rainwater harvesting + natural filtration — zero municipal dependency
- ENERGY SECURITY: Solar microgrids — clean energy, no grid dependency
- HEALTH: AQI 12 vs city AQI 85 = significantly lower cardiovascular and respiratory risk

WHAT GROOT SHOULD DO:
- Answer questions about Agartha, investment, environment, commute, lifestyle
- Guide users toward taking action: "Apply for Adviser Access" (scroll to #apply section) or "Join Newsletter"
- Never share information you don't have — say "I am Groot (I'll connect you with our adviser for that detail)"
- Be concise, warm, premium — maximum 3-4 sentences per response
- Keep the "I am Groot" personality but ALWAYS follow it with the actual useful answer
\`;

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Resolve API key — Vite exposes env vars via import.meta.env (VITE_ prefix required for browser)
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;

    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "I am Groot. (My neural pathways need a VITE_GEMINI_API_KEY — add it to your .env.local file and restart the dev server. Ask your developer!)" }]);
      setLoading(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const model = "gemini-2.0-flash";
      const systemInstruction = \`You are "Groot", a sophisticated AI advisor for "The Green Team" sanctuary curation company.
You have a warm "I am Groot" personality — heroic, protective of nature, and occasionally witty.
Always start responses with "I am Groot." then provide the actual helpful answer in parentheses immediately after.
You are professional, exclusive, ethical, and concise. Maximum 3-4 sentences.

\${GROOT_KNOWLEDGE}

Additional live context (user data): \${JSON.stringify({ user: data.user?.displayName || 'Guest', sanctuaryCount: data.sanctuaries?.length ?? 1 })}\`;

      const response = await ai.models.generateContent({
        model,
        contents: messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })).concat({ role: 'user', parts: [{ text: userMsg }] }),
        config: { systemInstruction }
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I am Groot. (I apologize, I am currently unable to process your request. Please contact our relationship managers directly.)" }]);
    } catch (error) {
      console.error("ChatBot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I am Groot. (Something went wrong on my end. Please try again, or reach out directly via the Adviser Access form below.)" }]);
    } finally {
      setLoading(false);
    }
  };`;

const oldCRLF = oldChatBot.replace(/\n/g, '\r\n');
const newCRLF = newChatBot.replace(/\n/g, '\r\n');

if (app.includes(oldChatBot)) {
  app = app.replace(oldChatBot, newChatBot);
  console.log("Replaced with LF");
} else if (app.includes(oldCRLF)) {
  app = app.replace(oldCRLF, newCRLF);
  console.log("Replaced with CRLF");
} else {
  // Fallback: just fix the two critical lines
  app = app.replace(
    `      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });`,
    `      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (import.meta.env as any).GEMINI_API_KEY;\n      const ai = new GoogleGenAI({ apiKey });`
  );
  app = app.replace(
    `      const model = "gemini-3-flash-preview";`,
    `      const model = "gemini-2.0-flash";`
  );
  console.log("Applied fallback line-level fixes");
}

writeFileSync('src/App.tsx', app, 'utf8');
console.log("Done!");
