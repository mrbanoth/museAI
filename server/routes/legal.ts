import { Router } from 'express';

/**
 * Public privacy policy page (required by Google's OAuth consent screen).
 */
const router = Router();

const PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Muse AI — Privacy Policy</title>
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:24px 16px;line-height:1.6;color:#0F172A;background:#fff}
h1{font-size:26px}h2{font-size:18px;margin-top:28px}p,li{color:#334155}</style></head><body>
<h1>Muse AI — Privacy Policy</h1>
<p>Last updated: October 2026</p>
<p>Muse AI is a personal AI assistant. This page explains what data it uses and why.</p>
<h2>Sign-in</h2>
<p>You sign in with your Google account. We receive your name, email address and profile picture only to identify your account.</p>
<h2>Gmail and Google Calendar (optional)</h2>
<ul>
<li>If you connect Gmail, Muse can <b>read</b> your messages (read-only) when you ask it to, e.g. to summarize unread email. It cannot send, change or delete email.</li>
<li>If you connect Google Calendar, Muse can list your events and create events <b>only when you ask it to</b>.</li>
<li>Email and calendar content is used only to answer your request. It is not sold, shared with advertisers or used to train AI models.</li>
<li>Access tokens are stored on our server, are private to your account, and are deleted when you tap <b>Disconnect</b> in Settings. You can also revoke access anytime at <a href="https://myaccount.google.com/permissions">myaccount.google.com/permissions</a>.</li>
</ul>
<p>Muse AI's use and transfer of information received from Google APIs adheres to the
<a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</p>
<h2>AI processing</h2>
<p>Your messages, and any email, calendar or web content needed to answer them, are sent to Google Gemini to generate replies. Web browsing runs in a cloud browser (Browserbase).</p>
<h2>Your data</h2>
<p>Your tasks, feed and connections are private to your account. Chats are stored on your own device. To delete your data, disconnect your accounts in Settings and sign out, or contact us.</p>
<h2>Contact</h2>
<p>Questions: use the support email shown on the Google sign-in screen.</p>
</body></html>`;

router.get(['/privacy', '/terms'], (_req, res) => {
  res.type('html').send(PAGE);
});

export default router;
