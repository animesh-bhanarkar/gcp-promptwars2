# 🗳️ CivicGuide — Personalized Election Guide Assistant

> **Built for GCP PromptWars Hackathon**  
> An interactive, AI-powered civic education tool that guides any U.S. voter — from first-timers to returning citizens — through the entire election process.

[![Live Demo](https://img.shields.io/badge/Deploy-Google%20Cloud%20Run-4285F4?logo=google-cloud)](https://cloud.google.com/run)
[![Gemini AI](https://img.shields.io/badge/Powered%20by-Gemini%201.5%20Flash-8C43FF?logo=google)](https://aistudio.google.com)
[![Size](https://img.shields.io/badge/Repo%20Size-<10%20MB-22c55e)](.)
[![PWA](https://img.shields.io/badge/PWA-Installable-4f7ef7)](.)

---

## 1. Overview

### What It Does
CivicGuide is a personalized, step-by-step AI assistant that demystifies the U.S. election process. It adapts entirely to each user's situation — whether they're a first-time voter who doesn't know where to start, or a returning voter who just needs to verify their registration and find their polling place.

### Problem It Solves
Millions of eligible Americans miss elections every year — not because they don't want to vote, but because the process feels overwhelming and confusing. CivicGuide solves this by:

- Breaking the process into **4 clear, actionable steps**
- **Personalising the experience** based on each user's answers to 3 quick questions
- Letting users **ask natural-language questions** and get accurate, jargon-free answers from Gemini AI
- Providing **real election deadlines** with one-click Google Calendar reminders
- **Locating polling stations** using Google Maps

### Real-World Impact
This tool directly addresses civic disengagement, particularly among younger and first-time voters who are most likely to feel lost in the election process. It requires no sign-up, works on any device, and completes onboarding in under 30 seconds.

---

## 2. Key Features

### 🧠 Personalised User Profiling
A 3-question quiz (first-time voter? registration status? location?) runs at the start. Every answer changes the experience — first-timers see extra guidance, unregistered users see an urgent call to action, and voters who provide their location get geotargeted maps and polling links.

### 📋 Step-by-Step Election Guide
Four structured stages walk users through the complete process:
1. **Register** — links to vote.gov, deadline finder, address update reminder
2. **Verify** — confirm registration status, find polling place, request mail ballot
3. **Choose How to Vote** — in-person, early voting, or absentee explained clearly
4. **Election Day Checklist** — what to bring, when to arrive, voter rights hotline

Progress dots show completed steps. Completing all four triggers a confetti celebration.

### 🤖 Gemini AI Chat (Multi-Turn)
A full conversational assistant powered by Gemini 1.5 Flash with **full conversation memory** — the AI remembers everything said in the session. Users get topic-matched follow-up question suggestions after every response. Quick-start pills cover the most common questions instantly.

### 🤖 AI-Generated Personal Action Plan
On app launch, a dedicated `/api/plan` call asks Gemini to generate a **personalised JSON action plan** for the user based on their profile. It renders as a prioritised checklist with urgent items highlighted — a concrete, individual roadmap, not generic advice.

### 📅 Interactive Election Timeline
Seven key election milestones with urgency badges (🔴 Urgent / 🟡 Soon) and direct **"Add to Google Calendar"** links for each deadline. The timeline note adapts to the user's state if provided.

### 📍 Polling Place Finder (Google Maps)
- A prominent button links directly to **Google's Official Polling Place Finder** (pre-filled with the user's location)
- A searchable Google Maps embed shows nearby polling stations
- The **"My Location"** button uses the browser Geolocation API to auto-centre the map and update all links

### 💾 Session Persistence
All user answers, step progress, and chat history are saved to `localStorage`. Returning users can resume exactly where they left off, with a "▶ Resume My Guide" button on the welcome screen.

### 📲 PWA — Installable
Full Progressive Web App support: `manifest.json`, service worker with static asset caching, theme colour, and icons. CivicGuide can be installed on any mobile or desktop device.

---

## 3. How It Works

```
1. USER LANDS ON WELCOME SCREEN
   └─ New user: clicks "Get Started"
   └─ Returning user: clicks "Resume My Guide" (profile restored from localStorage)

2. PROFILING QUIZ (30 seconds)
   Q1: First-time voter? → Yes / No
   Q2: Registration status? → Registered / Not sure
   Q3: Location? → Optional free-text (state or city)

3. DECISION LOGIC BRANCHES
   ├─ firstTime=yes  → First-timer banner + extra tips on every step
   ├─ registered=no  → Red urgent alert + Step 1 prioritised
   └─ location given → Maps pre-filled, Google Finder deep-linked to state,
                       Timeline note localised, AI plan context enriched

4. MAIN APP LAUNCHES (4 tabs)
   │
   ├── 📋 GUIDE — Step-by-step cards (Register → Verify → Vote → Election Day)
   │            + AI-generated personal action plan below steps
   │
   ├── 💬 CHAT  — Gemini 1.5 Flash with full conversation memory
   │            + Follow-up suggestions matched to topic
   │
   ├── 📅 TIMELINE — 7 milestones with urgency badges + Google Calendar links
   │
   └── 📍 MAPS — Google Official Polling Finder + embedded map + geolocation

5. COMPLETION
   └─ Finishing Step 4 triggers confetti celebration + "Go Vote!" modal
```

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Client)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐ │
│  │  index.html  │  │  style.css   │  │     app.js        │ │
│  │  (SPA Shell) │  │ (Design Sys) │  │  State Machine    │ │
│  └──────────────┘  └──────────────┘  └────────┬──────────┘ │
│                                               │             │
│                              POST /api/chat   │             │
│                              POST /api/plan   │             │
└───────────────────────────────────────────────┼─────────────┘
                                                │
┌───────────────────────────────────────────────▼─────────────┐
│                   server.js (Express)                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ POST /api/chat  Multi-turn Gemini proxy              │    │
│  │                 Rate-limited (20 req/min/IP)         │    │
│  │ POST /api/plan  Structured JSON action plan          │    │
│  │ GET  /health    Health check                         │    │
│  │ GET  *          SPA fallback → index.html            │    │
│  └─────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────┬─────────────┘
                                                │ HTTPS fetch
┌───────────────────────────────────────────────▼─────────────┐
│              Google Generative Language API                 │
│              gemini-1.5-flash  ·  REST                      │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- The API key **never touches the browser** — all Gemini calls are proxied through Express
- The frontend is a pure IIFE (no framework, no build step) — runs directly in any browser
- All state is in a single in-memory object, mirrored to `localStorage` on every change

---

## 5. Tech Stack

| Layer | Technology | Justification |
|---|---|---|
| **Frontend** | HTML5 + Vanilla CSS + Vanilla JS (ES6 IIFE) | Zero build step · Zero framework overhead · ~60 KB total |
| **Backend** | Node.js 20 + Express 4 | Single dependency · Minimal memory footprint |
| **AI** | Gemini 1.5 Flash (REST) | Free tier · Fast · Strong civic domain accuracy · Multi-turn support |
| **Maps** | Google Maps Embed (iframe) | No JS SDK needed · Free with no key |
| **Polling Finder** | Google Search/Maps deep-link | Real civic data · Zero API cost |
| **Calendar** | Google Calendar deep-link | Instant deadline reminders · No API needed |
| **Fonts** | Google Fonts (Inter) | Professional typography · CDN loaded |
| **PWA** | manifest.json + Service Worker | Installable · Offline static caching |
| **Deployment** | Google Cloud Run | Auto-scaling · Pay-per-request · Native Docker |
| **Container** | Docker (node:20-alpine) | Smallest possible image |

**Repository size (excluding node_modules):** ~100 KB — well under the 10 MB constraint.

---

## 6. Google Services Integration

| Service | How Integrated | Purpose |
|---|---|---|
| **Gemini 1.5 Flash** | Server-side REST API proxy at `/api/chat` and `/api/plan` | Powers multi-turn AI chat and generates personalised action plans |
| **Google Maps Embed** | `<iframe src="maps.google.com/maps?q=...&output=embed">` | Shows polling stations near a searched address |
| **Google Geolocation (Maps)** | Browser `navigator.geolocation` → Maps embed URL + deep-link | Auto-centres map on user's physical location |
| **Google Search Civic Data** | Deep-link: `google.com/search?q=polling+place+near+[location]` | Surfaces Google's real-time polling place data (no key required) |
| **Google Calendar** | Deep-link: `calendar.google.com/render?action=TEMPLATE&text=...` | Pre-fills election deadline events for one-click reminders |
| **Google Fonts** | CDN `<link>` tag — Inter typeface | Professional, accessible typography |

**Security:** The `GEMINI_API_KEY` is stored only as a server-side environment variable and is never included in any client-facing file or response.

---

## 7. Folder Structure

```
gcp-promptwars/
│
├── public/                   # Static frontend (served as-is)
│   ├── index.html            # SPA shell: welcome + quiz + app (all 3 screens)
│   ├── style.css             # Complete design system (dark glassmorphism)
│   ├── app.js                # All frontend logic — state machine, flows, chat, maps
│   ├── manifest.json         # PWA manifest (installable, theme color, icons)
│   ├── sw.js                 # Service worker (static asset caching)
│   ├── icon-192.png          # PWA icon (192×192)
│   └── icon-512.png          # PWA icon (512×512)
│
├── server.js                 # Express server:
│                             #   · Static file serving
│                             #   · POST /api/chat — multi-turn Gemini proxy
│                             #   · POST /api/plan — structured AI action plan
│                             #   · In-memory rate limiter (20 req/min/IP)
│                             #   · GET /health — status check
│
├── package.json              # One dependency: express ^4.18.2
├── Dockerfile                # node:20-alpine, production-only deps
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 8. Setup & Installation

### Prerequisites
- **Node.js 18+**
- **Gemini API key** — free at [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Run Locally

```bash
# 1. Clone the repository
git clone https://github.com/your-username/gcp-promptwars.git
cd gcp-promptwars

# 2. Install dependencies (only Express)
npm install

# 3. Set your Gemini API key
# Windows PowerShell:
$env:GEMINI_API_KEY = "your_api_key_here"
# macOS / Linux:
export GEMINI_API_KEY="your_api_key_here"

# 4. Start the server
npm start

# 5. Open in browser
# → http://localhost:8080
```

> **Note:** The app runs fully without a Gemini API key — Guide, Timeline, and Maps all work. The AI chat and Action Plan panels will show a friendly prompt to configure the key.

### Deploy to Google Cloud Run

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

gcloud run deploy civicguide \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_api_key_here
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | For AI features | From [Google AI Studio](https://aistudio.google.com/app/apikey) |
| `PORT` | No (default: 8080) | Auto-set by Cloud Run |

---

## 9. Usage Guide

| Step | What the User Does | What Happens |
|---|---|---|
| 1 | Lands on welcome screen | Sees features, clicks "Get Started" (or "Resume" if returning) |
| 2 | Answers 3 quiz questions | App personalises every panel based on answers |
| 3 | Reads the Guide tab | Steps through 4 election stages with links and tips |
| 4 | Views AI Action Plan | Sees a Gemini-generated personal checklist below the guide |
| 5 | Opens Ask AI tab | Asks any election question in natural language with conversation memory |
| 6 | Checks Timeline tab | Reviews deadlines and adds important dates to Google Calendar |
| 7 | Opens Find Polls tab | Uses Google's finder or maps embed to locate their polling place |
| 8 | Completes Step 4 | Sees confetti celebration and a "Go Vote!" prompt |

---

## 10. Design Decisions & Assumptions

| Decision | Rationale |
|---|---|
| **No framework (React/Vue)** | Keeps bundle at ~60 KB; faster load; no build toolchain needed |
| **IIFE pattern in app.js** | Encapsulates all state privately; prevents global scope pollution |
| **Server-side Gemini proxy** | API key security; allows rate limiting; enables future caching |
| **`localStorage` for persistence** | No backend database needed; survives refresh; works offline |
| **Profile injected into every Gemini call** | Ensures all AI responses are contextually relevant, not generic |
| **Static timeline data** | Avoids live API dependency; generalised U.S. dates remain accurate |
| **In-memory rate limiter** | Production safety with zero extra dependencies |

**Assumptions:**
- Target users are U.S. voters (content is U.S.-specific)
- Users may be on mobile — all layouts are responsive
- Users may not have a stable internet connection — static features work offline via service worker
- Users should not need to create an account to get help

---

## 11. Limitations

| Limitation | Impact |
|---|---|
| Timeline dates are approximate ("~30 days before") | Not tied to specific election calendars |
| Maps embed uses undocumented iframe URL | May require migration to Maps Embed API v2 for long-term stability |
| No live election data API | No automatic real-time deadline updates |
| English only | Non-English speakers not served |
| Chat history not server-persisted | History lost if `localStorage` is cleared |
| No accessibility audit completed | ARIA labels present but screen reader testing not performed |

---

## 12. Future Improvements

| Priority | Improvement |
|---|---|
| 🔴 High | Integrate **Google Civic Information API** for real, state-specific election dates and officials |
| 🔴 High | Add **Gemini response streaming** (SSE) for real-time word-by-word chat |
| 🟡 Medium | Add **Firebase Firestore** for cross-device session sync |
| 🟡 Medium | Add **multi-language support** (Spanish, Mandarin) — Gemini handles translation natively |
| 🟡 Medium | Serve PWA icons in correct sizes (192px / 512px) via `sharp` at build time |
| 🟢 Low | Full **WCAG 2.1 AA** accessibility audit and keyboard navigation |
| 🟢 Low | **Push notifications** for upcoming registration deadlines |

---

## 13. Conclusion

CivicGuide demonstrates that a genuinely useful, AI-powered civic education tool can be built with minimal dependencies, a tiny footprint (<10 MB), and a handful of well-chosen Google services.

**What makes it stand out:**

- ✅ **Truly personalised** — not a static FAQ; every screen adapts to the user
- ✅ **Gemini AI used meaningfully** — both as a conversational assistant with memory and as a structured data generator (action plan)
- ✅ **Five Google services integrated** — Gemini, Maps, Search civic data, Calendar, Fonts
- ✅ **Production-ready** — rate limiting, persistent state, PWA, Docker, Cloud Run–ready
- ✅ **Genuinely useful** — solves a real civic problem for millions of people

> *"Voting is the expression of our commitment to ourselves, one another, this country, and this world." — Sharon Salzberg*

---

*CivicGuide · Built with ❤️ for GCP PromptWars 2026*
