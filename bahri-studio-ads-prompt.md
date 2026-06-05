# Bahri Studio · Google Ads · Diagnosis + Campaign Build

## Google Ads access (reuse the existing AIAH method)

Google Ads access runs through the credentials file at `~/Documents/ProToreMane-Ops/config/google_ads.env`. It already holds the developer token, OAuth client ID, client secret, and a refresh token authorized by moustafabahri@gmail.com, plus `GOOGLE_ADS_LOGIN_CUSTOMER_ID=8962573507` (the master MCC, 896-257-3507).

**Do NOT** set up `google-ads.yaml`, the Python client, or a new MCP. Reuse the exact same path that already built and edited all of AIAH's campaigns:

1. `source ~/Documents/ProToreMane-Ops/config/google_ads.env`
2. Mint a short-lived OAuth access token by POSTing the refresh token to `https://oauth2.googleapis.com/token`
3. Call the Google Ads REST API directly with `curl`, sending these headers on every request:
   - `Authorization: Bearer <access_token>`
   - `developer-token: <GOOGLE_ADS_DEVELOPER_TOKEN>`
   - `login-customer-id: 8962573507`

**Target account for this job:** `customers/5434377672/...` (Bahri Studio · CID 543-437-7672 · EUR · Europe/Paris)

Keep the MCC (`8962573507`) as the `login-customer-id` on every call. All reads and writes hit `customers/5434377672/...` only — never touch any other sub-account under the MCC (AIAH `6219598450`, ProToreMane, or anything else).

## Business context
Moustafa Bahri runs bahri.studio — a Paid Media + UX/UI freelance studio based in Paris (also FR-EN-AR speaking, runs FR + EN site versions). Sells:
- 15-min Paid Media Audit (free entry offer → converts to paid Audit €1,500 or monthly retainer €3,500–€7,500)
- Google Ads / Meta Ads / LinkedIn Ads management
- Tracking buildout (GA4, GTM, Conversions API, server-side)
- Fractional Head of Digital + Product

Site: https://www.bahri.studio (EN) · https://www.bahri.studio/fr/ (FR)
Booking page: https://www.bahri.studio/book.html (Cal.com inline embed)

## Conversion setup (already live)
- **GA4 event:** `book_appointment` (fires server-side from Cal.com webhook → /api/cal-booking)
- **Google Ads conversion action:** BOOK_APPOINTMENT · Primary · imported from GA4 · €1,500 value
- Secondary conversion: `generate_lead` (also fires per booking, used for auto-bid optimization)
- Conversion tracking pipeline was tested and 200 OK end-to-end last week.

## Phase 1 — Diagnosis (do this first, report back before launching anything)

Run a full account health check on **543-437-7672** and produce a written diagnosis covering:

1. **Account structure** — campaigns, ad groups, ads currently live or paused
2. **Conversion tracking** — confirm BOOK_APPOINTMENT is Primary, receiving data, GA4 link is healthy
3. **Tag coverage** — Google tag / GA4 link status, Enhanced Conversions on/off
4. **Audience signals** — any existing remarketing lists, customer match, similar segments
5. **Quality issues** — disapproved ads, policy flags, low-quality keywords, suspended assets
6. **Billing** — payment method active, account in good standing, currency = EUR
7. **Geo + language settings** at account level
8. **Recommendations score** + which auto-applied recs are ON (turn off auto-apply if any are live — Moustafa controls them manually)
9. **Historic spend / results** if any campaign has run before

Output the diagnosis as a short report (bullet points, no fluff). Do not change anything yet.

## Phase 2 — Campaign build (after diagnosis is approved)

Build **two Search campaigns** in EUR, targeting:

### Geographic + demographic targeting (apply to both campaigns)
- **Location:** France (presence only — exclude "people interested in")
- **Language:** French + English
- **Age:** 30 to 56 only (exclude all other age ranges + Unknown)
- **Gender:** all
- **Household income:** all
- **Devices:** all (desktop bid-up +10%, B2B buyers research on desktop)
- **Networks:** Google Search only (NO Search Partners, NO Display)

### Campaign 1 — "Search · Google Ads FR" · primary intent
**Goal:** Capture French SMBs / founders searching for Google Ads help.

Ad groups (one per intent cluster, exact + phrase match only):

**AG1 · Agency intent**
- agence google ads
- agence google ads paris
- agence sea
- agence sea paris
- agence ads google
- meilleure agence google ads

**AG2 · Consultant / freelance intent**
- consultant google ads
- consultant google ads paris
- freelance google ads
- expert google ads
- consultant sea
- consultant paid media
- freelance sea paris

**AG3 · Audit intent**
- audit google ads
- audit compte google ads
- audit sea
- audit campagne google ads

**AG4 · Help intent**
- aide google ads
- optimisation google ads
- gestion google ads
- google ads ne convertit pas

Negative keywords (campaign level): `formation, certification, gratuit, free, jobs, emploi, salaire, tuto, tutorial, cours, course`

### Campaign 2 — "Search · Meta Ads FR" · secondary intent
Same structure, Meta-side keywords:

**AG1 · Agency / consultant**
- agence meta ads
- agence facebook ads
- consultant meta ads
- consultant facebook ads
- freelance meta ads
- freelance facebook ads paris

**AG2 · Audit / optimisation**
- audit meta ads
- audit facebook ads
- optimisation facebook ads
- gestion meta ads

**AG3 · Tracking / CAPI intent (his differentiator)**
- conversions api meta
- meta capi setup
- pixel facebook ne fonctionne pas
- ios14 facebook ads
- ios 14 meta ads

Same negatives as Campaign 1.

## Ads (Responsive Search Ads · 3 per ad group)

Each RSA: 15 headlines + 4 descriptions. Anchor 2 headlines (position 1).

### Anchored headlines (pin to position 1 — pick the matching ad-group one)
- `Audit Google Ads · Paris` (for Google Ads campaign)
- `Audit Meta Ads · Paris` (for Meta Ads campaign)

### Headline pool to mix in
- `15 min · screen-share · 3 actions`
- `Paid Media · Paris · FR + EN`
- `9 ans · Google · Meta · LinkedIn`
- `Audit gratuit · 15 minutes`
- `Réponse sous 24h`
- `Consultant indépendant · Paris`
- `ROAS · Conversions · LTV`
- `Tracking GA4 + CAPI inclus`
- `Strategy + execution · solo`
- `Pas de pitch · que des chiffres`
- `Comptes FR + internationaux`
- `Setup ou refonte complète`
- `Réserver l'audit 15 min`

### Descriptions (pool)
- `Screen-share live sur votre compte. Vous repartez avec 3 chiffres et 3 prochaines actions.`
- `9 ans en Paid Media. Google · Meta · LinkedIn. Tracking server-side inclus.`
- `Consultant indépendant basé à Paris. FR + EN. Réponse sous 24h.`
- `Pas de slides. Pas de pitch. On regarde votre compte ensemble.`

### Display path
- `/audit` and `/15-min`

### Final URL
- Google Ads campaign → `https://www.bahri.studio/fr/book.html`
- Meta Ads campaign → `https://www.bahri.studio/fr/book.html`
- UTM: `?utm_source=google&utm_medium=cpc&utm_campaign={campaignname}&utm_content={adgroupid}&utm_term={keyword}`

## Bidding + budget
- **Bidding strategy:** Manual CPC with Enhanced CPC for the first 14 days (need data before switching to Max Conversions or tCPA)
- **Daily budget:** start at **€20/day per campaign** (€40/day total). Will scale on Moustafa's signal once we see 5+ conversions/week.
- **Bid cap:** €4 max CPC at launch on all keywords (his most expensive keyword historically: "agence google ads paris" ~€3.80)

## Sitelinks + extensions (set at account level)
- **Sitelinks (4):**
  - `Track Record` → `/track-record.html`
  - `Insights & Audits` → `/fr/insights/`
  - `FAQ` → `/fr/faq.html`
  - `Réserver un audit` → `/fr/book.html`
- **Callouts:** `Paris-based · FR + EN`, `9 years experience`, `Server-side tracking`, `Replying within 24h`, `Audit gratuit 15 min`
- **Structured snippet:** Services → Google Ads, Meta Ads, LinkedIn Ads, Tracking, UX/UI
- **Call extension:** ONLY add if Moustafa confirms his phone (skip otherwise)
- **Lead form extension:** skip — we want them on the Cal.com booking flow for proper attribution

## Final checks before launch
1. Confirm BOOK_APPOINTMENT conversion is the goal at campaign level (not Account-default goals)
2. Auto-applied recommendations OFF
3. Audience exclusions: existing customers list if available
4. Brand exclusion list: add `bahri.studio`, `moustafa bahri` as negatives (no point bidding on own brand yet, organic owns it)

## Reporting cadence
After launch, send Moustafa a status update every Monday with:
- Conversions, cost/conv, CTR per ad group
- Top search terms triggering (good + bad)
- Wasted spend (if any) and what was paused
- One concrete optimization recommendation for the week

## What NOT to do
- Do not launch Performance Max yet (no conversion volume to feed it)
- Do not enable Display or YouTube
- Do not turn on auto-apply recommendations
- Do not increase budget without explicit approval
- Do not edit any other sub-account under the MCC

---

Start with Phase 1 diagnosis. Report findings before touching anything.
