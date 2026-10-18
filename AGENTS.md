# Muse AI Clone - Developer & Agent Guide

This is an Expo/React Native application for **Muse AI** — an autonomous AI agent application tailored for recurring tasks, automated workflows, chat companion interactions, and scheduled operations.

---

## 🚀 Project Overview

- **App Name:** Muse AI
- **Core Concept:** Autonomous AI Agent & Chat Companion for Recurring Tasks, Goals, and Automated Workflows
- **Platform:** iOS, Android, and Web (Universal React Native)
- **Current Phase:** Full UI Implementation with Clean Expo Router Tab Architecture, Pixel-Perfect Chat, Header Mascot, Floating Dock Tabs, Sidebar Drawer, and Settings.

---

## 🛠️ Tech Stack

- **Framework:** [Expo](https://docs.expo.dev/) (SDK 57)
- **Runtime:** React Native 0.86.3 / React 19.2.3
- **Router:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based navigation in `src/app/`)
- **Vector Icons:** `@hugeicons/react-native` & `@hugeicons/core-free-icons`
- **Vectors & SVG:** `react-native-svg`
- **Design Tokens:** Centralized in `src/constants/colors.ts`
- **Safe Area:** `react-native-safe-area-context`

---

## 🎨 Design System & Color Tokens (`src/constants/colors.ts`)

Always reference and add color definitions in `src/constants/colors.ts`. Never hardcode ad-hoc hex values inside components.

| Token | Hex / Value | Purpose |
|---|---|---|
| `Colors.primary` | `#2563EB` | Primary brand blue |
| `Colors.chatBubbleUser` | `#E8C4B4` | Warm peach terracotta user chat bubble |
| `Colors.chatBubbleAi` | `#EEF0F2` | Soft light gray agent message bubble |
| `Colors.tabActiveBg` | `#E6E8EA` | Active tab pill capsule background in dock |
| `Colors.iconDark` | `#1E2022` | Dark charcoal for icons and typography |
| `Colors.iconMuted` | `#9E9E9E` | Secondary gray for placeholder and timestamps |
| `Colors.statusBlue` | `#0066FF` | Online indicator dot on header drawer button |
| `Colors.white` | `#FFFFFF` | Main background & floating capsules |

---

## 📁 Clean Directory Structure & Architecture

```
muse_ai_clone/
├── AGENTS.md                  # Project & agent guidelines
├── package.json               # Dependencies & scripts
├── assets/
│   └── images/
│       └── muse_mascot.png    # Waving Pastel Plush Mascot Avatar DP
├── src/
│   ├── app/                   # Expo Router file-based screens
│   │   ├── _layout.tsx        # Root Stack navigator & ThemeProvider
│   │   ├── index.tsx          # Google Sign-in onboarding screen (Self-contained)
│   │   ├── home.tsx           # Compatibility redirect to /(tabs)/chat
│   │   └── (tabs)/            # Dedicated 5-Tab Routing & Layout
│   │       ├── _layout.tsx    # Master Tab Layout (AppHeader + Native Tabs + Modals)
│   │       ├── index.tsx      # Tab index redirect to /chat
│   │       ├── chat.tsx       # 1. Chat Tab: Messages list, peach/gray bubbles, input pill
│   │       ├── feed.tsx       # 2. Feed Tab: Minimalist autonomous intelligence feed
│   │       ├── ideas.tsx      # 3. Ideas Tab: 1-tap pre-built automation templates
│   │       ├── tasks.tsx      # 4. Tasks Tab: Scheduled goals & recurring routine manager
│   │       └── settings.tsx   # 5. Settings Tab: Quota card, groups, and integrated sheets
│   ├── components/            # Core Shared UI Layout Components
│   │   └── common/            # Header, Mascot, Drawer, Customizer & Settings Modals
│   ├── constants/
│   │   ├── colors.ts          # Central color palette
│   │   ├── dummyData.ts       # Idea templates & plan card data
│   │   └── theme.ts           # Spacing and typography
│   ├── services/
│   │   ├── api.ts             # Backend client + live events (SSE on web, long-poll on native)
│   │   ├── storage.ts         # Local chat sessions, profile, connectors
│   │   └── supabase.ts        # Auth (email + Google OAuth)
│   └── utils/time.ts          # Relative time labels
├── server/                    # Agent backend (npm run server)
│   ├── index.ts               # Express app, optional bearer auth, starts scheduler
│   ├── routes/                # chat, tasks (CRUD + run), feed, sessions, events, connectors
│   ├── services/
│   │   ├── agentEngine.ts     # Gemini multi-step tool loop (basic mode without key)
│   │   ├── browserbase.ts     # Cloud browser, live view, search, fetch, URL guard
│   │   ├── browserAgent.ts    # Interactive browser session: numbered elements, click/type/scroll
│   │   ├── google.ts          # Gmail + Calendar OAuth, token refresh, REST helpers
│   │   ├── screenshots.ts     # Final-page screenshots served at /shots/<random-id>.jpg
│   │   ├── scheduler.ts       # Runs due tasks every 30s, posts results to feed
│   │   ├── schedule.ts        # "Every 6 hours" / "Daily at 9:00" parser
│   │   ├── events.ts          # Event bus for live updates (per-user)
│   │   ├── auth.ts            # Supabase token check, allowed-email rules, daily limit
│   │   ├── userContext.ts     # Current user for the request / background run
│   │   └── store.ts           # JSON persistence (server/data/db.json)
│   └── data/                  # Runtime state (gitignored)
└── supabase/schema.sql        # Per-user tables with owner-only RLS
```

## 🔄 Real-time Architecture

- **Tasks** live on the backend and run automatically on their schedule (server local time). Manual runs return `202` immediately.
- **Progress** is pushed as events (`agent.step`, `task.updated`, `feed.added`, …) over `/api/events/stream` (SSE) or `/api/events?since=<seq>` (long-poll). Chat/idea requests pass a `requestId` so their steps can be matched.
- **Live browser**: `agent.step` events carry the Browserbase `liveViewUrl` (`sessions.debug().debuggerFullscreenUrl`) while a session runs; `replayUrl` points to the recording.
- **Interactive browser**: with Browserbase configured the agent gets `browser_open/click/type/scroll/back`; one session per agent turn (closed in `processAgentChat`), elements addressed by `data-muse-id` numbers. In-page scripts are plain JS strings because tsx injects `__name` helpers into named functions. `LOCAL_CHROMIUM_PATH` enables a local headless Chrome for development.
- **Screenshots**: browsing sessions end with a JPEG of the final page (`capturePage`), attached to actions, feed items and tasks as `screenshotUrl`; clients resolve it with `serverUrl()`. Browserbase replay links need a Browserbase login, so the app shows screenshots instead.
- **Connectors**: Gmail (read-only) and Google Calendar use server-side OAuth (`/api/connectors/:id/connect` → Google → public `/api/connectors/google/callback`). Tokens are stored in `server/data/db.json` (mode 600). The agent only gets Gmail/Calendar tools while that account is connected. Other connectors are placeholders.
- **Deploy**: `render.yaml` runs one Render web service (`npm run build` → `npm run start:prod`) serving API + web app from `dist/`. Phone-only setup steps: `SETUP.md`.
- **API auth & multi-user**: `server/services/auth.ts` verifies the Supabase session token against `ALLOWED_EMAILS` rules (`you@x.com`, `@gmail.com`, `*`) and runs the request as that user via `userContext.ts` (AsyncLocalStorage). Store, events, Google connections and scheduled runs are all scoped to `currentUser()`. Agent runs are capped per user per day (`DAILY_AGENT_LIMIT`). Health and the OAuth callback stay public.
- **Configuration**: copy `.env.example` to `.env`. Without `GEMINI_API_KEY` the agent runs in basic mode; without `BROWSERBASE_API_KEY` pages are fetched over HTTP.

---

## ⚡ Useful Commands & Git Guidelines

```bash
# Start the Expo development server
npx expo start

# Start the Agent Backend
npm run server

# Typecheck the whole project
npx tsc --noEmit
```

### 📌 Git Commit Guidelines
- Keep commit messages **short, concise, and meaningful** (e.g. `feat: add task scheduler`, `fix: chat scroll offset`, `refactor: browserbase service`).
- Always commit and push directly to `main`.
