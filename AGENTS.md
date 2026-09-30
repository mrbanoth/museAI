# Muse AI Clone - Developer & Agent Guide

This is an Expo/React Native application for **Muse AI** (and AI companion **Cooper**) — an autonomous AI agent application tailored for recurring tasks, automated workflows, chat companion interactions, and scheduled operations.

---

## 🚀 Project Overview

- **App Name:** Muse AI Clone
- **Core Concept:** Autonomous AI Agent & Chat Companion for Recurring Tasks, Goals, and Automated Workflows
- **Platform:** iOS, Android, and Web (Universal React Native)
- **Current Phase:** Full UI Implementation with Pixel-Perfect Chat, Header Mascot, Floating Dock Tabs, Sidebar Drawer, and Settings.

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

## 📁 Directory Structure & Architecture

```
muse_ai_clone/
├── AGENTS.md                  # Project & agent guidelines
├── package.json               # Dependencies & scripts
├── assets/
│   └── images/
│       └── cooper_mascot.jpg  # 3D character mascot avatar portrait
├── src/
│   ├── app/                   # Expo Router screens
│   │   ├── _layout.tsx        # Root Stack navigator & ThemeProvider
│   │   ├── index.tsx          # Initial entry point (SignInScreen)
│   │   └── home.tsx           # Home screen route (HomeScreen)
│   ├── components/            # Modular, reusable UI components
│   │   ├── auth/              # Authentication components
│   │   │   ├── GoogleIcon.tsx
│   │   │   ├── MuseLogo.tsx
│   │   │   ├── GoogleSignInButton.tsx
│   │   │   └── index.ts
│   │   ├── common/            # Shared layout components
│   │   │   ├── AppHeader.tsx          # 2-line menu + Blue dot, 3D Mascot + Name Capsule, 3-dots
│   │   │   ├── MascotAvatar.tsx       # 3D Cooper Mascot / customizable avatar
│   │   │   ├── TabNavigationBar.tsx   # Floating stadium dock (Chat, Feed, Ideas, Task, Apps)
│   │   │   ├── SidebarDrawer.tsx      # Slide-in session history (Main chat, Side chats, Search, Settings)
│   │   │   ├── SettingsMenuModal.tsx  # 3-dots action sheet (Edit Avatar, Rename, Delete Chat)
│   │   │   ├── EditAgentModal.tsx     # Custom mascot/name editor with live preview
│   │   │   └── index.ts
│   │   ├── chat/              # Chat components
│   │   │   ├── ChatBubble.tsx         # Peach user bubble & gray agent bubble
│   │   │   ├── ChatMessageList.tsx    # Scrollable history with centered date header
│   │   │   ├── ChatInputBar.tsx       # Floating pill (+, Message placeholder, Mic)
│   │   │   ├── TypingIndicator.tsx    # Animated pulse thinking dots
│   │   │   └── index.ts
│   │   └── tabs/              # Additional Tab Views
│   │       ├── FeedTab.tsx            # Clean empty Feed tab view
│   │       ├── IdeasTab.tsx           # Clean minimal Ideas view
│   │       ├── TasksTab.tsx           # Scheduled goals & recurring tasks
│   │       ├── SettingsTab.tsx        # Comprehensive Settings & Connectors view
│   │       └── index.ts
│   ├── screens/
│   │   ├── HomeScreen.tsx     # Composed Home screen with tab state and modals
│   │   └── SignInScreen.tsx   # Google Sign-in screen
│   └── constants/
│       ├── colors.ts          # Central color palette
│       ├── dummyData.ts       # Initial chat & sample workflows
│       └── theme.ts           # Spacing and typography
```

For the exhaustive file-by-file guide, see [`CODEBASE_EXPLANATION.md`](file:///Users/rahulsanarahulp/Documents/Projects/React%20Native/muse_ai_clone/CODEBASE_EXPLANATION.md).

---

## ⚡ Useful Commands

```bash
# Start the Expo development server
npx expo start

# Typecheck the whole project
npx tsc --noEmit

# Install compatible packages (ALWAYS use this instead of npm i / yarn add)
npx expo install <package-name>
```
