# Cal.com migration · server-side conversion tracking · setup guide

You're moving from Calendly Free (with the "leaving Calendly" interstitial) to Cal.com Free + server-side webhook tracking. This guide covers what to do after the deploy.

## What got built

**Site code (already done by Claude, will deploy when you push):**

- `/book.html` — replaced Calendly inline embed with Cal.com inline embed (dark theme + lime accent)
- `/fr/book.html` — same for French page
- `/api/cal-booking.js` — Vercel serverless function that receives Cal.com webhook and fires server-side events to GA4 + Google Ads + Meta
- `package.json` — minimal Node config for Vercel serverless function

**Cal.com (already done in browser):**

- Event type "15 min meeting" renamed to "15-min Paid Media Audit"
- Description updated
- Google Calendar already connected (contact.bahri.studio@gmail.com)

## What you need to do (3 steps, ~10 min)

### Step 1 — Push the code

```
cd ~/Documents/moustafa-site && rm -f .git/HEAD.lock .git/index.lock && git add -A && git commit -m "feat: migrate Calendly → Cal.com + server-side webhook tracking" && git push
```

Wait ~90 sec for Vercel to redeploy. Then verify:
- `https://www.bahri.studio/book.html` shows Cal.com inline (dark + lime)
- `https://www.bahri.studio/api/cal-booking` returns `{"error":"Method not allowed"}` (good — that means the function exists, it just rejects GET)

### Step 2 — Get GA4 Measurement Protocol API secret (5 min)

1. Open https://analytics.google.com → bahri.studio property
2. Admin (gear bottom-left) → Data Streams → click your web stream
3. Scroll down → Measurement Protocol API secrets → Create
4. Nickname: `bahri.studio webhook`
5. Copy the **Secret value** (you'll only see it once — save it somewhere)

### Step 3 — Set Vercel environment variables (3 min)

1. Open https://vercel.com → bahri.studio project → Settings → Environment Variables
2. Add these (Production environment):

| Name | Value | Purpose |
|---|---|---|
| `GA4_MEASUREMENT_ID` | `G-1Z4HFE6DZR` | Your GA4 property ID |
| `GA4_API_SECRET` | `<the secret from step 2>` | Authenticates the Measurement Protocol call |
| `CAL_WEBHOOK_SECRET` | `<we'll generate this in step 4>` | Verifies webhook came from Cal.com |

Click Save.

### Step 4 — Set up the Cal.com webhook (3 min)

1. Open https://app.cal.com → Event Types → 15-min Paid Media Audit → Webhooks tab
2. + New webhook
3. **Subscriber URL**: `https://www.bahri.studio/api/cal-booking`
4. **Events**: check `BOOKING_CREATED` (also `BOOKING_CANCELLED` if you want to track those)
5. Cal.com will auto-generate a **Signing Secret** — copy it
6. Go back to Vercel → Environment Variables → set `CAL_WEBHOOK_SECRET` = that value → Save
7. Vercel will auto-redeploy with the new env var (~30 sec)
8. Back in Cal.com webhook setup → click "Ping test" → should return `200 OK`

If ping returns 401 → secrets don't match, copy-paste again.
If ping returns 405 → the function isn't deployed yet, wait and retry.

### Step 5 — Test a real booking

1. Open `https://www.bahri.studio/book.html` in incognito
2. Pick any slot, fill name + throwaway email, click Confirm
3. Calendar invite should land in your inbox + the booker's
4. Open GA4 → Reports → Realtime → look for `calendly_booking_complete` and `generate_lead` events within 30 sec
5. Cancel the test booking from your Cal.com bookings list

If GA4 shows the events: server-side tracking is live. 🎯

## Optional: Google Ads conversion (when you have an Ads account)

When you create the conversion action in Google Ads:

1. Google Ads → Tools → Conversions → New conversion → Website
2. Name: `bahri.studio Calendly booking`
3. Category: `Submit lead form`
4. Value: Use a single value €1500
5. Count: One per click
6. After creating, click into it → Tag setup → Use Google Tag Manager → copy the **Conversion ID** (`AW-1234567890`) and **Conversion label** (`abcDEF12345`)
7. Add to Vercel env vars:
   - `GADS_CONVERSION_ID` = `AW-1234567890`
   - `GADS_CONVERSION_LABEL` = `abcDEF12345`

Note: full Google Ads server-side conversion via the Ads API requires a developer token (free, 1-day approval). Until then, the simpler path is to also add a GTM tag triggered by the GA4 event. The function logs a placeholder message until full API integration is wired.

## Optional: Meta Conversions API

If you want Meta to also see the booking server-side:

1. Meta Business Manager → Events Manager → your Pixel → Settings → Conversions API → Generate access token
2. Add to Vercel env vars:
   - `META_PIXEL_ID` = your Pixel ID
   - `META_ACCESS_TOKEN` = that token
3. Function will start firing the `Schedule` event to Meta server-side

## What the function does on every booking

```
Cal.com → POST /api/cal-booking (with signed payload)
  ↓
Verify HMAC signature with CAL_WEBHOOK_SECRET
  ↓
Parse booking: invitee email, event start time, booking ID
  ↓
Fire 3 events in parallel:
  • GA4 Measurement Protocol → "calendly_booking_complete" + "generate_lead" (€1500 value)
  • Google Ads (placeholder until you provide AW-)
  • Meta CAPI → "Schedule" event (€1500 value)
  ↓
Return 200 OK to Cal.com (so it doesn't retry)
```

## Why this beats the Calendly+redirect approach

- **No interstitial.** User stays on Cal.com confirmation page, calendar invite arrives, done.
- **Conversions can't be blocked by ad blockers.** They fire from the Vercel server, not the browser.
- **Conversions fire even if user closes tab immediately.** Browser-side tracking would fail.
- **Cleaner attribution.** Each booking has a single deterministic `booking_id` used as event_id — perfect for deduplication if you ever add a browser-side pixel too.
- **Free forever.** No Calendly Standard, no Cal.com Teams.

## Cleanup (after Cal.com is verified working)

Once Cal.com is humming:

1. Cancel the Calendly subscription if any
2. Optionally delete the old `Calendly Booking Complete` GTM trigger + tag (the GA4 server-side event replaces it)
3. The `/thank-you.html` and `/fr/thank-you.html` pages can be deleted (Cal.com doesn't redirect anymore) — OR keep them as a useful "what to expect" page for clients to bookmark

## Need to change anything later?

- **Brand color in the Cal.com widget**: edit the `cal-brand` CSS var in `/book.html` and `/fr/book.html` (currently `#c8ff5e`)
- **Conversion value**: edit `AUDIT_VALUE_EUR = 1500` at the top of `/api/cal-booking.js`
- **Add another tracking destination** (e.g., LinkedIn Insight, Twitter Pixel): add a new helper function in `/api/cal-booking.js` and call it from `Promise.allSettled`

---

Total deploy + setup time: ~10 min. Conversion tracking that actually works, costs nothing, and beats every legacy SaaS scheduler on attribution quality.
