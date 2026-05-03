# 🗳️ Personalized Election Guide Assistant (CivicGuide)

> **GCP PromptWars Hackathon Submission**  
> An intelligent, AI-powered civic education assistant that guides any voter — anywhere in the world — through their election process, step by step.

[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-8C43FF?logo=google)](https://aistudio.google.com)
[![Cloud Run](https://img.shields.io/badge/Deploy-Google%20Cloud%20Run-4285F4?logo=google-cloud)](https://cloud.google.com/run)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-22c55e?logo=google-chrome)](https://civicguide-223626897073.us-central1.run.app)
[![PWA](https://img.shields.io/badge/PWA-Installable-4f7ef7)](.)
[![Size](https://img.shields.io/badge/Repo%20Size-%3C10%20MB-22c55e)](.)

---

## Why This Solution Stands Out

Most civic information tools are static FAQ pages that treat every voter the same. **CivicGuide is fundamentally different** — it is an intelligent, adaptive system that meets each voter exactly where they are.

| What makes it different | Why it matters |
|---|---|
| 🧠 **Truly personalised** | 3 onboarding answers reshape every screen, message, link, and AI response |
| 🤖 **Gemini AI used meaningfully** | Two distinct AI capabilities: multi-turn conversational chat + structured JSON action plan generation |
| 🌍 **Global framework** | U.S. is the reference model; any country's election system can be configured by swapping two data arrays |
| ⚡ **~60 KB of source code** | Zero frontend frameworks, one backend dependency — loads instantly on any connection |
| 🔒 **Production-safe from day one** | Server-side API key, in-memory rate limiting, input validation, zero client-side secrets |
| 📲 **Installable PWA** | Service worker caches static assets — works offline, installs on any device |
| 🎯 **Solves a real problem** | Voter disengagement is often confusion, not apathy — CivicGuide removes that friction |

---

## 1. Overview

### What It Does
CivicGuide guides voters through the complete election process — from registration to casting their ballot — using a personalised, conversational, step-by-step experience powered by Gemini AI.

### Problem It Solves
Voter disengagement is often not apathy — it's confusion. Millions of eligible citizens miss elections because the process feels overwhelming. CivicGuide removes that friction by breaking the journey into 4 clear stages, adapting to each user's exact situation, and answering their specific questions instantly.

### Real-World Usefulness
- Works on any device with a browser, including low-end mobile phones
- No account, no downloads, no personal data collected
- Fully functional without an API key (guide, maps, timeline all work offline-capable)
- Onboarding takes under 30 seconds

### Global Applicability
The current implementation covers the **U.S. election system** as a reference model. The architecture is intentionally modular: the `STEPS` and `TIMELINE` data arrays in `app.js` can be swapped for any country's election stages, and the Gemini system prompt can be re-targeted to any jurisdiction. A future `country` field in the user profile would make this a truly global civic tool.

---

## 2. Key Features

| Feature | Description |
|---|---|
| **User Profiling Quiz** | 3 questions (first-time voter, registration status, location) that personalise every panel |
| **4-Step Election Guide** | Register → Verify → Choose Voting Method → Election Day, with curated actions and links |
| **AI Personal Action Plan** | Gemini generates a structured JSON checklist unique to each user's profile |
| **Multi-Turn AI Chat** | Gemini 1.5 Flash with full conversation memory, topic-matched follow-up suggestions |
| **Election Timeline** | 7 milestones with urgency badges and Google Calendar deep-links |
| **Polling Place Finder** | Google's Official Finder + Maps embed + browser geolocation |
| **Session Persistence** | `localStorage` saves progress — returning users resume exactly where they left off |
| **Completion Celebration** | Canvas confetti animation when all 4 steps are completed |
| **PWA Support** | Installable, service worker caches static assets for offline use |
| **Graceful Degradation** | All non-AI features work without a Gemini API key |

---

## 3. Intelligent Decision Engine

The decision engine runs at `launchApp()` and branches in three dimensions simultaneously:

### Dimension 1 — First-Time Voter (`firstTime`)
```
firstTime = "yes"
  → Show gold first-timer welcome banner
  → Chat greeting: "I can see you're a first-time voter in [location]"
  → Every step tip box emphasises simplicity ("under 5 minutes", "all you need is...")
  → AI plan prompt instructs Gemini to treat user as a complete beginner

firstTime = "no"
  → Standard experience, no extra scaffolding
```

### Dimension 2 — Registration Status (`registered`)
```
registered = "no"
  → Show red urgent alert: "You're not registered yet!"
  → Direct link to vote.gov prominent on Step 1
  → AI plan `priority` field set to registration as the #1 action
  → Step 1 opened by default

registered = "yes"
  → Step 1 still covers address updates and verification
  → No urgent alert shown
```

### Dimension 3 — Location (`location`)
```
location provided
  → Maps search pre-filled with state/city
  → Google Polling Finder link deep-linked: ?q=polling+place+near+[location]
  → Timeline note: "Verify exact dates for [location] at vote.gov"
  → Gemini API calls include location in profile context

location skipped
  → Generic U.S. messaging throughout
  → User can still search manually in Maps tab
```

All three dimensions are evaluated independently and combined — a first-time, unregistered voter in California gets a maximally guided, urgency-first experience, while a returning registered voter who skips location gets a streamlined verification-focused flow.

---

## 4. How It Works

```
STEP 1 · WELCOME
User sees the welcome screen with animated background.
New user → "Get Started" | Returning user → "Resume My Guide" (profile from localStorage)

STEP 2 · PROFILING QUIZ (30 seconds)
  Q1: First-time voter? [Yes / No]          → state.profile.firstTime
  Q2: Registration status? [Yes / Unsure]   → state.profile.registered
  Q3: Location? (optional free text)        → state.profile.location
  Each answer auto-advances after 300ms visual confirmation.

STEP 3 · DECISION ENGINE RUNS
  launchApp() reads all 3 profile values and:
  - Shows/hides contextual banners
  - Pre-fills Maps and Finder links
  - Personalises Timeline note
  - Triggers AI Action Plan generation via POST /api/plan

STEP 4 · MAIN APP (4 tabs)

  📋 GUIDE
  4 step cards rendered from STEPS[] data array.
  Step dots: grey (upcoming) → blue (active) → green ✓ (done)
  Below all steps: AI-generated personal action plan card.
  Completing Step 4 → confetti + "Go Vote!" modal.

  💬 ASK AI
  Gemini 1.5 Flash chat with full conversation memory.
  Every POST /api/chat includes: message + profile context + full chat history.
  Bot responses include topic-matched follow-up suggestion pills.

  📅 TIMELINE
  7 static milestones rendered with urgency badges.
  Each milestone has a Google Calendar pre-fill deep-link.

  📍 FIND POLLS
  Google Official Polling Finder button (pre-linked to user location).
  Embedded Google Maps iframe loads on search or geolocation.
  "My Location" uses browser Geolocation API.

STEP 5 · SESSION SAVED
Every profile change, step advance, and chat message is saved to localStorage.
```

---

## 5. System Architecture

```
Browser                          Express Server              Google APIs
──────────────────────────────   ─────────────────────────   ──────────────────
index.html (SPA shell)      │
style.css  (design system)  ├──► POST /api/chat ──────────► Gemini 1.5 Flash
app.js     (state machine)  │    POST /api/plan ──────────► Gemini 1.5 Flash
manifest.json + sw.js (PWA) │
                            │    Rate limiter: 20 req/60s
                            │    API key: server-side only
                            │    Input: validated + sanitised
                            │
                            ├──► GET  /health (status check)
                            └──► GET  *       (SPA fallback)

Maps/Calendar/Finder: direct browser deep-links (no backend involved)
```

**State management:** Single `state` object in `app.js` IIFE — mutated in place, mirrored to `localStorage` on every update. No framework, no store library.

---

## 6. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | HTML5 + Vanilla CSS + Vanilla JS (IIFE) | Zero build step · ~60 KB total · runs in any browser |
| Backend | Node.js 20 + Express 4 | Single dependency · minimal memory · Cloud Run native |
| AI | Gemini 1.5 Flash REST API | Free tier · fast · multi-turn · structured JSON output |
| Maps | Google Maps Embed (iframe) | No JS SDK · no key needed · zero cost |
| Polling Finder | Google Search deep-link | Real civic data · zero cost |
| Calendar | Google Calendar deep-link | One-click deadline reminders · no API needed |
| Fonts | Google Fonts (Inter, CDN) | Professional typography · no local files |
| PWA | manifest.json + Service Worker | Installable · offline static caching |
| Container | Docker node:20-alpine | Smallest possible image |
| Deployment | Google Cloud Run | Auto-scale · pay-per-request · one-command deploy |

---

## 7. Google Services Integration

| Service | Integration | Purpose |
|---|---|---|
| **Gemini 1.5 Flash** | Server-side REST proxy `/api/chat` + `/api/plan` | Multi-turn AI chat + personalised structured action plan |
| **Google Maps Embed** | `<iframe src="maps.google.com/maps?q=...">` | Polls polling stations near any searched address |
| **Google Maps Geolocation** | Browser `navigator.geolocation` → Maps iframe URL | Auto-centres map on user's physical location |
| **Google Search Civic Data** | Deep-link `google.com/search?q=polling+place+near+[location]` | Google's real-time official polling place data |
| **Google Calendar** | Deep-link `calendar.google.com/render?action=TEMPLATE` | Pre-fills election deadlines for one-click calendar adds |
| **Google Fonts** | CDN `<link>` — Inter typeface | Accessible, professional typography |

**Security:** `GEMINI_API_KEY` is an environment variable on the server only. It is never sent to the browser, never logged, and never included in any client response.

---

## 8. Accessibility Considerations

| Principle | Implementation |
|---|---|
| **Plain language** | All copy written at grade 8 reading level; zero jargon |
| **Mobile-first** | Fully responsive; tested at 375px (iPhone SE) and 1440px |
| **ARIA semantics** | `role="tablist"`, `aria-selected`, `aria-live`, `aria-label` throughout |
| **Keyboard navigation** | All interactive elements are `<button>` or `<a>` — fully focusable |
| **Colour contrast** | Dark background (#0a0d14) with high-contrast text (#f1f5f9) |
| **Auto-advancing quiz** | 300ms delay before advancing — prevents accidental skips |
| **Error states** | All API failures show friendly, actionable messages |
| **Focus management** | Panels switch without losing scroll context |
| **No time pressure** | Users can take as long as needed on any step |

> **Known gap:** A full WCAG 2.1 AA audit (screen reader testing, focus ring visibility) is listed as a future improvement.

---

## 9. Security Considerations

| Area | Measure |
|---|---|
| **API key exposure** | `GEMINI_API_KEY` stored in server env only — never sent to browser |
| **Rate limiting** | In-memory limiter: 20 requests / 60 seconds / IP, with automatic stale-entry cleanup |
| **Input validation** | Server validates `message` field is present and non-empty before any Gemini call |
| **No PII stored** | No user account, no database, no server-side session — profile lives in client `localStorage` only |
| **Content policy** | Gemini system prompt explicitly prohibits partisan content and candidate endorsements |
| **iframe sandboxing** | Maps iframe uses `referrerpolicy="no-referrer-when-downgrade"` and `loading="lazy"` |
| **Dependency surface** | One production dependency (`express`) — minimal attack surface |
| **Error messages** | Server errors return generic messages; raw Gemini errors are never forwarded to the client |

**Recommended additional hardening (post-hackathon):**
- Add `helmet.js` for HTTP security headers
- Implement CORS origin allowlist for production
- Add request body size limit (`express.json({ limit: '4kb' })`)

---

## 10. Folder Structure

```
gcp-promptwars/
│
├── public/                   # All frontend files (served statically)
│   ├── index.html            # SPA: 3 screens (welcome, quiz, app) + 4 panels
│   ├── style.css             # Complete design system — dark glassmorphism
│   ├── app.js                # All UI logic: state, quiz, guide, chat, maps
│   ├── manifest.json         # PWA manifest
│   ├── sw.js                 # Service worker — static asset caching
│   ├── icon-192.png          # PWA icon
│   └── icon-512.png          # PWA icon
│
├── server.js                 # Express server:
│                             #   POST /api/chat  — multi-turn Gemini proxy
│                             #   POST /api/plan  — structured AI action plan
│                             #   In-memory rate limiter
│                             #   GET  /health    — status endpoint
│                             #   GET  *          — SPA fallback
│
├── package.json              # Single dependency: express ^4.18.2
├── Dockerfile                # node:20-alpine, production-only install
├── .dockerignore             # Excludes node_modules, .env, .git
├── .gitignore                # Excludes node_modules, .env, logs
└── README.md                 # This file
```

---

## 11. Setup & Installation

### Prerequisites
- Node.js 18+
- Gemini API key (free): [aistudio.google.com](https://aistudio.google.com/app/apikey)

```bash
# 1. Clone
git clone https://github.com/animesh-bhanarkar/gcp-promptwars2.git
cd gcp-promptwars2

# 2. Install (one dependency)
npm install

# 3. Configure
# Windows PowerShell:
$env:GEMINI_API_KEY = "your_key_here"
# macOS / Linux:
export GEMINI_API_KEY="your_key_here"

# 4. Run
npm start
# → http://localhost:8080
```

> The app runs fully **without** a Gemini API key. Guide, Timeline, and Maps work immediately. AI Chat and Action Plan show a friendly setup prompt.

### Live Deployment

> 🌐 **[https://civicguide-223626897073.us-central1.run.app](https://civicguide-223626897073.us-central1.run.app)**  
> Deployed on Google Cloud Run · Project: `projectx-493512` · Region: `us-central1`

### Deploy to Google Cloud Run (one command)

```bash
gcloud run deploy civicguide \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_key_here
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | For AI features | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `PORT` | No (default: 8080) | Set automatically by Cloud Run |

---

## 12. Usage Guide

| Action | How |
|---|---|
| Start fresh | Click "Get Started" on the welcome screen |
| Resume progress | Click "Resume My Guide" (shown if a previous session exists) |
| Personalise | Answer 3 quick questions in the quiz |
| Navigate steps | Use "Next Step →" / "← Back" or click step dots directly |
| Ask the AI | Type in the chat box or click any suggested/follow-up pill |
| Add deadline | Click "📅 Add to Calendar" on any timeline item |
| Find polling place | Type address or click "📍 My Location" in the Find Polls tab |
| Start over | Click "↺ Restart" in the top nav bar |

---

## 13. Design Decisions & Assumptions

| Decision | Rationale |
|---|---|
| **No frontend framework** | Eliminates build toolchain; reduces total size to ~60 KB; faster cold start |
| **IIFE module pattern** | All state is private; no global pollution; easy to reason about |
| **Profile injected into every Gemini call** | Ensures AI responses are always contextually relevant, not generic |
| **`localStorage` for persistence** | No backend DB needed; works offline; GDPR-friendly (no server-side PII) |
| **Two Gemini endpoints** | Separates concerns: chat is conversational, plan is structured — different temperature and token limits |
| **Static timeline data** | Avoids live API dependency; generalised U.S. dates are accurate year-round |
| **In-memory rate limiter** | Production safety with zero extra packages |
| **Graceful no-key mode** | Maximises usability for evaluators without API access |

**Key assumptions:**
- Users are on modern browsers (ES6+ support)
- Target is English-speaking U.S. voters for v1
- Users may be on slow mobile connections — heavy assets avoided

---

## 14. Current Scope & Opportunities

Every limitation below is a deliberate scope decision for v1, not a design flaw. Each represents a clear enhancement path:

| Current Scope | Enhancement Opportunity |
|---|---|
| Timeline dates are approximate ("~30 days before") | Integrate Google Civic Information API for real, state-specific election calendars |
| Google Maps embed via iframe | Migrate to Maps Embed API v2 for long-term stability and richer data |
| No live election data | Connect to official election databases for automatic deadline updates |
| English only | Gemini natively supports multilingual responses — add a `lang` field to the profile |
| `localStorage` is device-specific | Add Firebase Firestore for seamless cross-device session sync |
| PWA icons are same file at different sizes | Generate properly sized icons from SVG at build time using `sharp` |
| ARIA labels present; screen reader testing not done | Complete a WCAG 2.1 AA audit as the next accessibility milestone |

---

## 15. Future Improvements

| Priority | Improvement |
|---|---|
| 🔴 | **Google Civic Information API** — real state-specific election dates, officials, polling places |
| 🔴 | **Gemini streaming** (SSE) — word-by-word response for better chat UX |
| 🟡 | **Firebase Firestore** — cross-device session sync and analytics |
| 🟡 | **Multi-language support** — Gemini handles translation natively; add `lang` to profile |
| 🟡 | **Country selector** — make the global framework user-facing |
| 🟡 | **`helmet.js`** — HTTP security headers for production hardening |
| 🟢 | **Push notifications** — deadline reminders via Web Push API |
| 🟢 | **WCAG 2.1 AA audit** — full screen reader and keyboard navigation review |
| 🟢 | **Proper icon pipeline** — generate 192px/512px icons from SVG at build time |

---

## 16. Conclusion

CivicGuide demonstrates that **AI can meaningfully improve civic participation** — not by replacing human judgment, but by removing the friction that prevents people from showing up to vote.

It is:
- **Genuinely useful** — solves a real problem for millions of eligible voters
- **Technically sound** — clean architecture, production-safe, one-command deployable
- **AI-first, not AI-gimmick** — Gemini is used for both conversational guidance and structured personalisation
- **Designed to scale** — the framework adapts to any country's election system with minimal changes
- **Lightweight by principle** — ~60 KB of source code, zero frameworks, fully functional offline

> *"The vote is the most powerful nonviolent tool we have." — John Lewis*

---

*CivicGuide · Built with ❤️ for GCP PromptWars 2026 · Powered by Gemini AI + Google Cloud Run*
