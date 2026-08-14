import { NextRequest, NextResponse } from 'next/server';
import { GROOT_KNOWLEDGE, GROOT_PERSONA, GROOT_FALLBACK } from '@/lib/data/groot';

/**
 * Groot — server-side proxy to the Pollinations text API (keyless), so the
 * knowledge base and endpoint stay out of the client bundle.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const history: { role: string; text: string }[] = Array.isArray(body.messages)
      ? body.messages.slice(-12)
      : [];
    const userName = typeof body.userName === 'string' ? body.userName.slice(0, 80) : 'Guest';

    const system = `${GROOT_PERSONA}\n\n${GROOT_KNOWLEDGE}\n\nAdditional live context (user data): ${JSON.stringify({ user: userName, sanctuaryCount: 3 })}`;

    const payload = {
      messages: [
        { role: 'system', content: system },
        ...history.map(m => ({
          role: m.role === 'model' ? 'assistant' : 'user',
          content: String(m.text).slice(0, 2000),
        })),
      ],
      model: 'openai',
      jsonMode: false,
    };

    const res = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const text = (await res.text()).trim();
    return NextResponse.json({ text: text || GROOT_FALLBACK });
  } catch {
    return NextResponse.json({ text: GROOT_FALLBACK });
  }
}
