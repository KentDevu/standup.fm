# StandUp.fm — Team Setup Guide

> Voice-first standups for teams that build from anywhere.
> CodeKada Hackathon · May 3–7, 2026

---

## Quick Start (5 minutes)

```bash
# 1. Clone and install
git clone <repo-url>
cd standup-fm
npm install

# 2. Copy env file and fill in your keys (see "Getting API Keys" below)
cp .env.local.example .env.local

# 3. Run the dev server
npm run dev
```

App runs at **http://localhost:3000**

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Drop (recording) page — the big mic button
│   ├── feed/page.tsx         # Team Feed — drop cards with AI tags
│   ├── pulse/page.tsx        # Pulse — team health dashboard
│   ├── kickoff/page.tsx      # Kickoff — PTO catch-up briefing
│   └── api/
│       ├── drops/route.ts    # CRUD for drops (Supabase)
│       ├── transcribe/route.ts  # Audio → text (Deepgram)
│       └── extract/route.ts  # Text → structured tags (Claude AI)
├── components/
│   ├── drop/recorder.tsx     # Recording flow with countdown + waveform
│   ├── feed/
│   │   ├── drop-card.tsx     # Individual drop card (avatar, tags, transcript)
│   │   └── feed-view.tsx     # Feed list with sort controls
│   ├── pulse/pulse-view.tsx  # Sparklines + AI insights
│   ├── kickoff/kickoff-view.tsx  # Briefing generator UI
│   ├── ui/                   # Reusable components (avatar, tag-chip, waveform, sparkline)
│   └── layout/nav.tsx        # Top bar + bottom nav
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── mock-data.ts          # Demo seed data (used until Supabase is connected)
└── types/index.ts            # TypeScript types for all data models
```

---

## Getting API Keys (All Free)

### 1. Supabase (Database + Storage + Realtime)

1. Go to https://supabase.com → Sign up (free, no credit card)
2. Create a new project (any name, pick closest region)
3. Wait for it to provision (~2 min)
4. Go to **Settings → API**
5. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon / public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Go to **SQL Editor** → paste and run everything in `supabase-schema.sql`
   - This creates all tables + seed data (demo team with 4 users)

### 2. Deepgram (Speech-to-Text)

1. Go to https://deepgram.com → Sign up (free $200 credit, no credit card)
2. Go to **Dashboard → API Keys**
3. Create a key → copy it → `DEEPGRAM_API_KEY`

### 3. Anthropic / Claude (AI Extraction)

> This is the only one that costs money. See "Zero-Cost Alternative" below.

1. Go to https://console.anthropic.com → Sign up ($5 free credit for new accounts)
2. Go to **API Keys** → Create key → `ANTHROPIC_API_KEY`

**Zero-Cost Alternative:** We can swap Claude for **Groq** (free, no credit card). Ask Kent to refactor `/api/extract` to use Groq if budget is zero.

### 4. ElevenLabs (Text-to-Speech for Kickoff)

1. Go to https://elevenlabs.io → Sign up (free, 10K chars/month)
2. Go to **Profile → API Key** → copy it → `ELEVENLABS_API_KEY`
3. This is only needed for the Kickoff audio feature — skip if not working on that yet

---

## Your .env.local Should Look Like

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
ANTHROPIC_API_KEY=sk-ant-...
DEEPGRAM_API_KEY=a1b2c3d4...
ELEVENLABS_API_KEY=xi-...
```

---

## Tech Stack

| Layer | Tool | Why |
|-------|------|-----|
| Frontend | Next.js 16 + Tailwind CSS | Fast, App Router, easy Vercel deploy |
| Auth/DB/Storage | Supabase | Free tier, Postgres, file storage, realtime |
| Transcription | Deepgram (Nova-2) | Fastest STT, free $200 credit |
| AI Extraction | Claude Sonnet | Structured JSON output for tags/sentiment |
| TTS (Kickoff) | ElevenLabs | Natural voice for catch-up briefing |
| Animations | Framer Motion | Smooth micro-interactions |
| Icons | Lucide React | Clean, consistent icon set |
| Deploy | Vercel | Free tier, instant deploys |

---

## Design System

| Token | Value | Usage |
|-------|-------|-------|
| `midnight` | `#0A0E27` | Background — "morning before chaos" |
| `coral` | `#FF6B6B` | Primary accent — record button, blockers, energy |
| `mint` | `#4ECDC4` | Positive — resolved, wins, success |
| `cream` | `#F7F7F2` | Text on dark |
| `cream-dim` | `#B8B8B0` | Secondary text |

**Fonts:** Inter (body), JetBrains Mono (timestamps/code)

**Voice & Tone:** Confident, slightly funny teammate.
- Empty state: "No drops yet. Be the morning hero."
- After recording: "Drop saved. Go build."
- Blocker resolved: "Unblocked. Hero status."

---

## Role Assignments

| Role | Owns | Key Files |
|------|------|-----------|
| **Builder A — Full-Stack Lead** | Auth, data model, recording → upload → save pipeline, deployments | `api/drops/`, `lib/supabase.ts`, `components/drop/recorder.tsx` |
| **Builder B — AI / Backend** | Transcription pipeline, extraction prompts, Kickoff TTS | `api/transcribe/`, `api/extract/`, `components/kickoff/` |
| **Builder C — Frontend / Design** | UI polish, animations, Pulse dashboard, branding, demo video | `components/ui/`, `components/pulse/`, `globals.css` |
| **Builder D (optional)** | Realtime sync, notifications, daily digest | Supabase Realtime channels, email via Resend |

---

## What's Built vs What's Left

### Done (Day 1-2)
- [x] Project scaffold (Next.js + Tailwind + all dependencies)
- [x] Full brand system (colors, fonts, dark theme)
- [x] Drop page — mic button, countdown, recording with live waveform, preview + transcript
- [x] Feed page — drop cards, avatar, waveform, AI tag chips (blocker/win/ask/decision), "I got this" resolve, expandable transcript, sort by attention/latest
- [x] Pulse page — 4 sparkline metrics, AI insight cards, weekly summary
- [x] Kickoff page — generate briefing flow, progress animation, audio player, timestamped outline
- [x] Bottom nav + top bar with branding
- [x] API routes for transcribe (Deepgram), extract (Claude), drops (Supabase CRUD)
- [x] Supabase schema + seed SQL
- [x] Mock data for demo without backend
- [x] TypeScript types for all models

### TODO (Day 2-3)
- [ ] **Connect real audio upload** — MediaRecorder → Supabase Storage → trigger transcription pipeline
- [ ] **Wire Feed to Supabase** — replace mock data with real DB queries + realtime subscription
- [ ] **Wire Pulse to Supabase** — real aggregation queries instead of mock metrics
- [ ] **Kickoff TTS** — call ElevenLabs API to generate actual audio briefing
- [ ] **Realtime updates** — Supabase Realtime so feed updates live when a teammate drops
- [ ] **Reactions** — emoji reactions on drop cards
- [ ] **Smart @mentions** — auto-tag teammates mentioned in audio transcript
- [ ] **Daily digest email** — morning summary via Resend or Supabase Edge Function

### TODO (Day 4 — Polish)
- [ ] Mobile responsive sweep
- [ ] Loading states, error states, empty states with branded copy
- [ ] Smooth page transitions
- [ ] Seed demo team with 4-5 realistic drops (use real voice recordings)
- [ ] Demo video recording

---

## Deploying to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — follow prompts)
vercel

# Set env vars
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add DEEPGRAM_API_KEY
vercel env add ELEVENLABS_API_KEY

# Redeploy with env vars
vercel --prod
```

---

## Daily Progress Reports

**Non-negotiable.** Set a 6 PM alarm. One person posts the daily report.

Template:
```
Day X Progress — StandUp.fm
- What we shipped today: ...
- What's blocked: ...
- Plan for tomorrow: ...
- Live URL: ...
```

---

## Key Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build (catches type errors)
npm run lint     # Lint check
```

---

## Questions?

Ask Kent. Let's win this.
