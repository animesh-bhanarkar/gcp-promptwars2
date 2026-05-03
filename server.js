// server.js — CivicGuide Backend v2
// Serves static frontend + proxies Gemini API (multi-turn, rate-limited)

import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── In-Memory Rate Limiter (no extra packages) ────────────────────────────────
const rateMap = new Map(); // ip → { count, resetAt }
const RATE_LIMIT = 20;     // max requests
const RATE_WINDOW = 60_000; // per 60 seconds

function rateLimited(req, res, next) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return next();
  }
  if (entry.count >= RATE_LIMIT) {
    return res.status(429).json({ error: 'Too many requests. Please wait a moment before asking again.' });
  }
  entry.count++;
  next();
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateMap) {
    if (now > entry.resetAt) rateMap.delete(ip);
  }
}, 300_000);

// ── Gemini Config ─────────────────────────────────────────────────────────────
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `You are CivicGuide, a friendly and knowledgeable civic education assistant 
specialized in U.S. elections. Your role is to:

1. Explain election processes clearly in simple, jargon-free language
2. Guide users step-by-step based on their specific situation
3. Provide accurate, actionable next steps
4. Be encouraging, especially to first-time voters
5. Keep answers concise (2–4 short paragraphs max)
6. Always end with one clear "Next Step" the user can take today

IMPORTANT RULES:
- Never give partisan opinions or endorse any candidate/party
- If unsure about state-specific details, direct users to vote.gov
- Always be warm, encouraging, and accessible
- Use bullet points for lists of steps
- Remember prior messages in this conversation and build on them`;

// ── POST /api/chat — Multi-turn Gemini proxy ──────────────────────────────────
app.post('/api/chat', rateLimited, async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({
      error: '🔑 AI chat is not configured. Add a GEMINI_API_KEY environment variable to enable it.',
      demoMode: true
    });
  }

  const { message, context, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message is required' });

  // Build multi-turn contents array
  const contents = [];

  // 1. Inject user profile as synthetic first exchange
  if (context && Object.values(context).some(Boolean)) {
    contents.push({
      role: 'user',
      parts: [{ text: `My profile: ${JSON.stringify(context)}. Personalise all your answers based on this.` }]
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Got it! I\'ll keep your profile in mind throughout our conversation.' }]
    });
  }

  // 2. Replay prior conversation turns (multi-turn memory)
  for (const turn of history) {
    contents.push({
      role: turn.role === 'bot' ? 'model' : 'user',
      parts: [{ text: turn.text }]
    });
  }

  // 3. Add current message
  contents.push({ role: 'user', parts: [{ text: message }] });

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 600,
          topP: 0.9
        }
      })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.text();
      console.error('Gemini error:', err);
      return res.status(502).json({ error: 'AI service error. Please try again in a moment.' });
    }

    const data = await geminiRes.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';
    res.json({ reply });
  } catch (err) {
    console.error('Fetch error:', err);
    res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ── POST /api/plan — AI-generated personal action plan ───────────────────────
app.post('/api/plan', rateLimited, async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(503).json({ error: 'AI not configured.', demoMode: true });
  }

  const { profile } = req.body;
  const { firstTime, registered, location } = profile || {};

  const prompt = `You are CivicGuide. Generate a personalized election action plan for this voter:
- First-time voter: ${firstTime === 'yes' ? 'Yes' : 'No'}
- Registration status: ${registered === 'yes' ? 'Registered' : 'Not registered / unsure'}
- Location: ${location || 'Not specified'}

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "greeting": "one warm sentence welcoming them personally",
  "priority": "the single most important thing they must do RIGHT NOW (1 sentence)",
  "steps": [
    { "title": "step title", "action": "specific action to take", "urgent": true/false },
    { "title": "step title", "action": "specific action to take", "urgent": false },
    { "title": "step title", "action": "specific action to take", "urgent": false }
  ],
  "reminder": "one encouraging closing sentence"
}`;

  try {
    const geminiRes = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 400 }
      })
    });

    if (!geminiRes.ok) return res.status(502).json({ error: 'AI service error.' });

    const data = await geminiRes.json();
    let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Strip markdown code fences if present
    raw = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    try {
      const plan = JSON.parse(raw);
      res.json({ plan });
    } catch {
      res.status(500).json({ error: 'Could not parse AI plan. Try again.' });
    }
  } catch (err) {
    console.error('Plan error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({
  status: 'ok',
  service: 'civicguide',
  ai: GEMINI_API_KEY ? 'configured' : 'missing-key'
}));

// ── SPA Fallback ──────────────────────────────────────────────────────────────
app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`CivicGuide running on port ${PORT} · AI: ${GEMINI_API_KEY ? '✅ ready' : '⚠️  no key set'}`));
