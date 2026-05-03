# Claude Code prompt · Calendly embed + thank-you page conversion tracking

Copy everything between the `---PROMPT START---` and `---PROMPT END---` lines below into Claude Code at the project root (`~/Documents/moustafa-site`).

Claude Code will: read your existing site, build the new pages, update CTAs, wire GTM events, and explain the Calendly admin settings you need to change.

---PROMPT START---

# Goal

Replace all "Book a 15-min audit" outbound Calendly links on bahri.studio with an embedded inline Calendly widget on a new `/book.html` page, then redirect post-booking to a custom `/thank-you.html` page that fires conversion events to GA4 and Google Ads.

# Current state (read these files first to confirm)

- `index.html` (homepage, EN), `fr/index.html` (FR), `track-record.html`, `faq.html`, `fr/faq.html` — all have a `Book a 15-min audit` button linking to `https://calendly.com/contact-bahri-taws/15min`
- `app.js` — loads GTM container `GTM-T7ZXHSPC` (already wired), defines `data-i18n` strings for hero CTAs in EN + FR
- `consent.js` — Google Consent Mode v2, EEA region defaults to denied
- GA4 measurement ID: `G-1Z4HFE6DZR` (fired through GTM, not directly)
- Google Ads account ID: TO BE PROVIDED — placeholder `AW-XXXXXXXXX/CONVERSION_LABEL` in tag config; user will fill in via GTM UI after deploy
- Meta Pixel ID: TO BE PROVIDED — placeholder for now
- Site is hand-coded HTML/CSS/JS, hosted on Vercel, deployed via GitHub auto-deploy

# Tasks

## 1. Create `/book.html` (English)

A single dedicated page with the Calendly inline widget embedded.

Requirements:

- Same `<head>` structure as `faq.html` (consent.js, CookieHub, GTM, fonts, styles)
- Same nav as `faq.html` with `Book` marked as current
- Title: `Book a 15-min audit · bahri.studio`
- Meta description: `Pick a 15-min slot for a Paid Media audit screen-share. Bring your Google Ads or Meta Ads account. You leave with 3 numbers and 3 next moves.`
- Canonical: `https://www.bahri.studio/book.html`
- hreflang to `/fr/book.html` and self
- OG tags
- Schema: BreadcrumbList + Service (reference homepage Audit Service via `@id`)
- Inline Calendly widget using their official embed snippet:

```html
<!-- Calendly inline widget -->
<div class="calendly-inline-widget"
     data-url="https://calendly.com/contact-bahri-taws/15min?hide_event_type_details=1&hide_gdpr_banner=1&primary_color=c8ff5e&text_color=f5f5f5&background_color=07070a"
     style="min-width:320px;height:760px;"></div>
<script type="text/javascript" src="https://assets.calendly.com/assets/external/widget.js" async></script>
```

- Above the widget: an h1 + intro paragraph explaining what to expect (3-4 sentences max, scannable)
- Below the widget: a small "What happens next" section with 3 bullet points (e.g., "Calendar invite arrives instantly · Bring your ad account · Recording shared after for the team")
- Footer: same as other pages
- Load `app.js` and `auto-date.js` at the end of body
- Add cursor divs (`.cursor-dot`, `.cursor-spot`) before nav

## 2. Create `/fr/book.html` (French mirror)

Same structure as `/book.html` but:

- `lang="fr"`, French copy throughout
- Calendly URL with French locale param if available
- Title: `Réserver un audit de 15 min · bahri.studio`
- Nav uses French labels matching `/fr/index.html` nav

## 3. Create `/thank-you.html` (EN) and `/fr/thank-you.html` (FR)

Standalone confirmation pages users land on after booking via Calendly redirect.

Requirements:

- Same head structure as `/book.html` (with GTM, consent, etc.)
- Title: `Booked · bahri.studio` (FR: `Confirmé · bahri.studio`)
- Meta robots: `noindex,nofollow` (these are post-conversion pages, shouldn't show in search)
- Canonical: self
- No FAQ/Service schema (these aren't content pages)

Visible content:
- Big "Booked. Talk soon." heading (FR: "Confirmé. À très vite.")
- Subhead: "Calendar invite landed in your inbox. Add 15 minutes to your calendar — that's all you need."
- 3-step "What to bring" list:
  1. Read access to your Google Ads or Meta Ads account
  2. Your top 3 questions
  3. Coffee
- "Until then" section with links to:
  - `/insights/google-ads-france-startup-playbook.html`
  - `/insights/conversions-api-gtm-ga4-tracking-stack.html`
  - `/insights/roas-benchmarks-2026.html`
- Footer

Conversion firing logic in inline `<script>` at the END of body (after GTM loads):

```html
<script>
  (function(){
    // Wait for dataLayer + a small tick so GTM is ready
    window.dataLayer = window.dataLayer || [];
    
    // Read Calendly redirect params (event_type_uuid, invitee_uuid, etc.)
    var qs = new URLSearchParams(window.location.search);
    var eventType = qs.get('event_type_uuid') || '';
    var inviteeUuid = qs.get('invitee_uuid') || '';
    var assignedTo = qs.get('assigned_to') || '';
    var eventStart = qs.get('event_start_time') || '';
    
    // Idempotency: only fire once per page load
    if (window.__bahriBookingFired) return;
    window.__bahriBookingFired = true;
    
    // Single GA4 + GAds conversion event
    window.dataLayer.push({
      event: 'calendly_booking_complete',
      booking: {
        event_type_uuid: eventType,
        invitee_uuid: inviteeUuid,
        assigned_to: assignedTo,
        event_start_time: eventStart,
        source_page: document.referrer
      },
      // For GA4 ecommerce-style attribution
      ecommerce: {
        value: 1500,            // estimated audit value EUR (the entry-level Audit price)
        currency: 'EUR',
        items: [{
          item_id: 'audit_15min_call',
          item_name: '15-min Audit Call',
          item_category: 'Audit & Strategy',
          price: 1500,
          quantity: 1
        }]
      }
    });
  })();
</script>
```

The actual GA4 / Google Ads / Meta tags will be created in GTM UI by the user (instructions in section 5).

## 4. Update all CTAs across the site

Replace EVERY `Book on Calendly` / `Book a 15-min audit` link that currently points to `https://calendly.com/contact-bahri-taws/15min` with a link to `/book.html` (EN) or `/fr/book.html` (FR).

Files to scan and update:
- `index.html` — hero CTA, contact section CTA
- `fr/index.html` — hero CTA, contact section CTA
- `track-record.html` — bottom CTA
- `faq.html` — top CTA, bottom CTA
- `fr/faq.html` — top CTA, bottom CTA
- `insights/index.html` — bottom CTA
- `fr/insights/index.html` — bottom CTA
- `insights/google-ads-france-startup-playbook.html` — bottom CTA
- `insights/conversions-api-gtm-ga4-tracking-stack.html` — bottom CTA
- `insights/roas-benchmarks-2026.html` — bottom CTA

Remove `target="_blank"` and `rel="noopener"` from these links since they'll be internal navigation now.

Update the FR button text on `/fr/index.html` from English "Book a 15-min audit" to "Réserver un audit de 15 min" if not already (the i18n key handles it; just verify).

## 5. Add Calendly admin instructions as a comment in `book.html`

At the very top of `book.html` source, add an HTML comment block:

```html
<!--
  CALENDLY ADMIN SETUP (do this ONCE in calendly.com after first deploy):
  
  1. Go to Calendly → Event Types → 15-min Meeting → Workflows tab
  2. Add a new workflow → "When invitee schedules a new event"
  3. Add action → "Redirect to a custom website"
  4. URL: https://www.bahri.studio/thank-you
  5. Pass event details to redirect URL: ENABLED (this appends invitee_uuid, event_type_uuid, etc.)
  6. Apply this workflow to the 15-min Meeting event type
  7. Save
  
  For the FR redirect, create a duplicate workflow with URL: https://www.bahri.studio/fr/thank-you
  applied to the same event type if you have a FR-specific event type, or use UTM params on /book vs /fr/book to distinguish.
-->
```

## 6. Add sitemap + robots updates

- Add `/book.html` and `/fr/book.html` to `sitemap.xml` with priority 0.9 and weekly changefreq
- DO NOT add `/thank-you.html` or `/fr/thank-you.html` to sitemap (they're noindex)
- Make sure `robots.txt` doesn't block any of these (current robots.txt is permissive)

## 7. Update `llms.txt` site map section

Add the new pages:
- `/book.html — booking page (inline Calendly widget)`
- `/fr/book.html — French booking page`

## 8. Add a small style block for `.calendly-inline-widget`

In `styles.css`, add at the end:

```css
/* CALENDLY EMBED */
.calendly-inline-widget{
  background: var(--bg);
  border-radius: 14px;
  border: 1px solid var(--line);
  margin: 32px 0;
  overflow: hidden;
}
@media (max-width: 760px){
  .calendly-inline-widget{ height: 720px !important; }
}
```

## 9. Provide a written summary at the end

After all files are created/updated, output a markdown summary with:
1. List of files created
2. List of files modified
3. The Calendly admin steps (same as the comment block in book.html, repeated for clarity)
4. The GTM tags the user needs to create:
   - Trigger: Custom Event = `calendly_booking_complete`
   - Tag 1: GA4 Event "calendly_booking_complete" with the dataLayer params + ecommerce object
   - Tag 2: Google Ads Conversion (placeholder AW-XXXXXXXXX/CONVERSION_LABEL — user fills after creating conversion action in Google Ads)
   - Tag 3 (optional): Meta Conversion (Schedule event with placeholder PIXEL_ID)
5. Test steps:
   - Deploy to Vercel
   - Visit `/book.html`, complete a test booking
   - Verify redirect to `/thank-you?event_type_uuid=...`
   - Open GTM Preview mode, confirm `calendly_booking_complete` event fires
   - Confirm GA4 DebugView shows the event with the right params
   - Confirm Google Ads tag fires (Tag Assistant)

# Constraints

- Do NOT touch unrelated content (insights articles, FAQ Q&A, llms.txt service descriptions other than the new sitemap entries)
- Maintain consistent design language with existing pages (dark theme, lime accent #c8ff5e, Inter + Instrument Serif fonts)
- All new pages must include the cursor divs + load app.js so the laser-pointer cursor works
- All new pages must include the closing `</noscript>` tag right after the GTM noscript iframe (we had a bug before where this got dropped)
- Use ISO 8601 with timezone for any datetime in JSON-LD: `2026-04-30T09:00:00+02:00`
- The thank-you page is the conversion source of truth — do NOT add conversion tags to /book.html itself (that would fire on every visit, not just bookings)
- Idempotency on /thank-you: if user refreshes, conversion should NOT re-fire (the `__bahriBookingFired` flag handles this for the page load; the GTM tag itself should be set to fire ONCE per page in GTM config)

# Acceptance criteria

- [ ] `/book.html` and `/fr/book.html` exist with working Calendly inline widget
- [ ] `/thank-you.html` and `/fr/thank-you.html` exist with the dataLayer push
- [ ] All 10 site CTAs now point to `/book.html` or `/fr/book.html` instead of the external Calendly URL
- [ ] Sitemap updated, robots.txt unchanged or improved
- [ ] Comment block in book.html with Calendly admin instructions
- [ ] Final summary printed including GTM setup steps

---PROMPT END---

## Notes for Moustafa (don't paste these into Claude Code, just for you)

- After Claude Code finishes, you push to GitHub, Vercel auto-deploys
- Then you do the **3 admin steps** that need a human:
  1. **Calendly:** add the redirect to `https://www.bahri.studio/thank-you` in your event type's Workflows
  2. **GTM:** create the 3 tags (GA4 event, Google Ads conversion, optional Meta) using the trigger `calendly_booking_complete`
  3. **Google Ads:** create a "Calendly booking" conversion action, copy the `AW-XXXXXXXXX/LABEL`, paste into the GTM tag, publish container

- After all 3 admin steps: do ONE test booking with a fake email. Walk through:
  - GTM Preview → confirm event fires
  - GA4 DebugView → confirm event in real-time
  - Google Ads → check conversion shows up within 24h
  - Then delete the test booking from your Calendly

- Once verified, you can run paid traffic to `bahri.studio` and every audit booking attributes back to the ad cleanly. ROAS becomes measurable.
