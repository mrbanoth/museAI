# Muse AI — Setup from your phone

Everything below is done in a mobile browser. No laptop needed.
The whole app (agent server + scheduler + web app) runs as **one free Render service**,
and you use it from your phone's browser (add it to your home screen like an app).

Time needed: ~20 minutes. Do the steps in order.

---

## Step 1 — Get a Gemini API key (the AI brain) · 2 min

1. Open **https://aistudio.google.com/apikey** and sign in with Google.
2. Tap **Create API key** → copy it somewhere (Notes app).

## Step 2 — Deploy on Render · 5 min

1. Open **https://dashboard.render.com** → **Sign up with GitHub** (allow access to `museAI`).
2. Tap **New +** → **Blueprint** → choose the **museAI** repo → branch `main`.
3. Render reads `render.yaml` and asks for values. Fill in:
   | Key | Value |
   |---|---|
   | `GEMINI_API_KEY` | key from Step 1 |
   | `ALLOWED_EMAILS` | who may sign in: `@gmail.com` = any Gmail account · `you@gmail.com` = only you · `*` = anyone |
   | `BROWSERBASE_API_KEY`, `BROWSERBASE_PROJECT_ID` | leave empty for now (Step 8) |
   | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | leave empty for now (Step 4) |
4. Tap **Apply**. The first build takes ~5–8 minutes.
5. When it says **Live**, copy your URL at the top, e.g. `https://muse-ai-xxxx.onrender.com`.
   In the rest of this guide, `YOUR_URL` means that address.
6. Check it works: open `YOUR_URL/api/health` → you should see `"status":"OK"` and `"llm":{"configured":true`.

## Step 3 — Let Supabase sign-in redirect to your app · 2 min

1. Open **https://supabase.com/dashboard** → your project (`hmkdafydnmouvmdvgwin`).
2. **Authentication → URL Configuration**:
   - **Site URL**: `YOUR_URL`
   - **Redirect URLs** → Add: `YOUR_URL/**`
3. **SQL Editor** → New query → paste everything from `supabase/schema.sql` in the repo → **Run**.
   (Locks the database down so users only see their own rows.)

## Step 4 — Google Cloud: one OAuth client for login + Gmail/Calendar · 10 min

1. Open **https://console.cloud.google.com** → top bar → **New Project** → name `Muse AI` → Create (make sure it's selected).
2. **APIs & Services → Library** → search and **Enable** both **Gmail API** and **Google Calendar API**.
3. **Google Auth Platform → Branding** (or "OAuth consent screen") → **Get started**:
   app name `Muse AI`, your email for support, audience **External**, your email as contact → Create.
4. **Google Auth Platform → Audience** → **Publish app** → Confirm.
   (Status becomes "In production" so **any Gmail account can sign in**. In "Testing" only listed test users could.)
5. **Google Auth Platform → Clients → Create client** → type **Web application**, name `Muse`:
   - **Authorized redirect URIs** → add both:
     - `https://hmkdafydnmouvmdvgwin.supabase.co/auth/v1/callback`  ← Google login
     - `YOUR_URL/api/connectors/google/callback`  ← Gmail/Calendar connect
   - Create → copy **Client ID** and **Client secret**.
6. Render → **muse-ai → Environment** → set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` → **Save changes**.

## Step 5 — Turn on "Sign in with Google" in Supabase · 2 min

1. **https://supabase.com/dashboard** → your project → **Authentication → Sign In / Providers → Google**.
2. Toggle **Enable**, paste the same **Client ID** and **Client secret** from Step 4.5 → **Save**.

## Step 6 — Open the app on your phone · 1 min

1. Open `YOUR_URL` in Chrome/Safari → **Sign in with Google** → pick any Gmail account.
2. Add to home screen: Chrome menu **⋮ → Add to Home screen** (Safari: **Share → Add to Home Screen**).
3. Try in chat: *"Search the latest AI agent news and summarize"*.

Every user gets their **own** chats, tasks, feed and Gmail/Calendar connection — nobody can see anyone else's.

## Step 7 — Connect Gmail & Google Calendar · 1 min

1. In the app: **Settings → Connectors & Workspaces → Gmail → Connect** → choose your account.
2. Google shows **"Google hasn't verified this app"** (normal for a personal project) → tap **Advanced → Go to Muse AI (unsafe)** → **Allow**.
3. Repeat for **Google Calendar**.
4. Try: *"What are my unread emails today?"*, *"Add gym tomorrow 6 PM to my calendar"*.

> Gmail is a "restricted" Google permission. For a personal app that's fine (up to 100 users). Removing the warning for the public requires Google's app verification.

## Step 8 — Live cloud browser (the "super agent" part) · 3 min

This is what lets Muse **open websites, click, type, search and fill forms by itself** while you watch it live in the chat.

1. **https://www.browserbase.com** → sign up (free plan is enough to try).
2. Dashboard → **Settings / API keys** → copy the **API key** and **Project ID**.
3. Render → **muse-ai** → **Environment** → set `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID` → **Save** (redeploys).
4. Try in chat: *"Open github.com, search for expo router, open the top repo and tell me its stars"* — a live browser window appears in the chat and you see every click.

Without these keys Muse can still read pages, but it can't click or type, and there is no live view.
For safety Muse never types passwords or card details and stops before buying, paying or sending anything — it asks you to finish that step.

## Step 9 (recommended) — Keep scheduled tasks running

Render's free plan **sleeps after 15 minutes without visits**, and a sleeping server can't run scheduled tasks.

1. Open **https://cron-job.org** → free sign-up.
2. **Create cronjob** → URL `YOUR_URL/api/health` → every **10 minutes** → Save.

---

## Good to know (free plan limits)

- **Tasks, feed and Gmail/Calendar connections are stored on the server's disk.** On the free plan that disk is wiped on every redeploy (e.g. after changing an environment variable or a new commit). You'd re-create tasks and reconnect Google afterwards. Fix: Render **Starter** plan + a **Disk** mounted at `/var/data` and env `MUSE_DATA_DIR=/var/data`.
- Times are India time (`TZ=Asia/Kolkata` in `render.yaml`): "Daily at 9:00 AM" runs at 9 AM IST. Change `TZ` and `GOOGLE_CALENDAR_TZ` on Render if you're elsewhere.
- First load after the server slept takes ~30–50 seconds.

## Something not working?

| Problem | Fix |
|---|---|
| "is not allowed to use this Muse server" | Your login email doesn't match `ALLOWED_EMAILS` on Render (use `@gmail.com` for any Gmail). |
| Google login says "Access blocked" / "not a test user" | Step 4.4: publish the app (Audience → Publish app). |
| "Daily limit of 100 agent runs reached" | Per-user safety limit. Change with `DAILY_AGENT_LIMIT` on Render. |
| "Please sign in" / "Session expired" everywhere | Sign out (Settings) and sign in again. |
| Chat says "AI reasoning is offline" | `GEMINI_API_KEY` missing/wrong on Render. |
| Gmail Connect says "needs Google OAuth set up" | Step 4.6 not done or redeploy not finished. |
| Google shows `redirect_uri_mismatch` | Redirect URIs in Step 4.5 must match exactly (no trailing `/`). |
| Confirmation email link opens localhost | Step 3 Site URL not set to `YOUR_URL`. |
| Build failed on Render | Open the deploy **Logs**, copy the red error, send it to Claude. |
