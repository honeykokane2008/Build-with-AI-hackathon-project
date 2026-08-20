# JanVaani — Citizen Demand Intelligence Platform

A working prototype for the **"aggregate citizen feedback across India → align with national
infrastructure priorities"** problem statement. Built as a Next.js app so the whole pipeline
(ingestion → AI classification → deduplication → cross-referencing → recommendation) runs in
one project, powered by the **Gemini API**.

## What it does

1. **Ingest** — citizens submit complaints via a form (text, simulated WhatsApp/voice/walk-in
   channel tags, real browser-based voice-to-text, and optional photo evidence).
2. **Classify** — each complaint is run through a Gemini-powered pipeline that extracts:
   - issue category (water / roads / electricity / healthcare / sanitation)
   - urgency (low / medium / high / critical)
   - detected language + English translation — covers Hindi, Marathi, Tamil, Punjabi, Bengali,
     and other Indian languages, not just Hindi/English
   - matched district
   - a description of any attached photo evidence (Gemini multimodal)
3. **Deduplicate** — near-duplicate reports of the same underlying issue (e.g. 50 citizens
   reporting the same broken pipe) are clustered together, so the dashboard shows "1 issue,
   50 affected citizens" instead of 50 disconnected rows.
4. **Cross-reference** — complaints are aggregated per district+category and weighed against a
   national reference dataset: population, infrastructure quality index (0–100), and current
   public investment already committed (₹ lakh) per sector.
5. **Recommend** — a transparent, explainable scoring formula ranks demand hotspots and a
   short Gemini-written (or template) rationale is attached for each.
6. **Measure impact** — a time-series view shows whether complaint volume in a category is
   escalating, plateauing, or improving over time, directly addressing the problem statement's
   "no way to measure impact" gap.

## Why it's designed as a Digital Public Good

- **Open source, MIT licensed** (see `LICENSE`).
- **Country/state-agnostic schema** — `data/regions.json` uses `adminRegion` and
  `primaryLanguage` fields so any Indian state (or, with no code changes, any nation) can plug
  in its own demographic/infrastructure dataset. The seed data currently covers Maharashtra,
  Tamil Nadu, Punjab, and West Bengal to demonstrate this isn't Hindi-belt-only.
- **Transparent scoring** — `lib/recommend.js`'s formula is fully deterministic and documented
  inline, not a black box: `weightedComplaints × infrastructureGap ÷ (1 + existingInvestment)`.
- **Relevant SDGs**: SDG 9 (Industry, Innovation & Infrastructure), SDG 11 (Sustainable Cities
  & Communities), SDG 16 (Peace, Justice & Strong Institutions — transparent public spending).
- **Does no harm / privacy** — see the Privacy & Safety section below. This is an honest
  statement of current gaps, not a claim that they're all solved.

## Running it

```bash
npm install
npm run seed     # populates data/complaints.json with ~35 realistic multilingual sample complaints
npm run dev       # http://localhost:3000
```

No API key is required to run it — without one, classification and rationale generation fall
back to a deterministic rule-based engine so the whole app is fully demoable offline.

**Set a Gemini key to satisfy the Google AI requirement and enable live classification:**

```bash
cp .env.example .env.local
# then add a free key from https://aistudio.google.com/app/apikey:
GEMINI_API_KEY=AIza...
```

Uses `gemini-2.0-flash` via the `@google/generative-ai` SDK (see `lib/gemini.js`,
`lib/classify.js`, `lib/recommend.js`). Photo evidence is analyzed via the same model's
multimodal input.

**Optional: gate the dashboard** with a passcode (recommended before a public demo link):

```bash
# in .env.local
DASHBOARD_PASSCODE=yourchosenpasscode
```

If unset, the dashboard is open — this is intentional for easy judging, and is documented here
as a known gap rather than a silent one.

## Project structure

```
app/
  page.js                landing page (pitch)
  submit/page.js          citizen submission form (+ voice input, photo upload)
  dashboard/page.js       policymaker dashboard (map, charts, trend, recommendations, passcode gate)
  api/complaints/         GET list / POST submit + classify + dedup (rate-limited)
  api/districts/          GET reference dataset
  api/recommendations/    GET ranked, scored hotspots
  api/trend/               GET time-series complaint volume by category
  api/auth/                 dashboard passcode check
lib/
  db.js                   file-based data store (swap for MongoDB/Firestore/Postgres here)
  gemini.js                 Gemini client wrapper
  classify.js               Gemini classification (text + photo) + offline rule-based fallback
  dedup.js                   near-duplicate complaint clustering (word-overlap similarity)
  recommend.js               scoring engine, Gemini rationale generation, trend aggregation
  rateLimit.js                simple in-memory rate limiter for the public submission endpoint
data/
  regions.json             mock national demographic/infrastructure/investment dataset
  complaints.json           citizen submissions store
components/
  ComplaintMap.jsx          Leaflet hotspot map
  DashboardCharts.jsx       Recharts category/urgency/trend charts
scripts/seed.js             generates realistic multilingual sample data
LICENSE                     MIT
```

## Swapping in a real database

`lib/db.js` exposes exactly four functions (`getAllComplaints`, `insertComplaint`,
`getAllRegions`, `getRegionById`). Nothing else in the app touches storage directly — replace
the file I/O in that one file with Firestore, MongoDB/Mongoose, or Postgres and everything else
keeps working unchanged.

## Privacy & safety — honest current state

- No consent flow or data-retention policy is implemented yet — a real deployment handling
  citizen complaints (potentially with names/phone numbers) needs one before launch.
- The dashboard passcode gate (above) is basic shared-secret access control, not full auth —
  adequate for a hackathon demo, not for production.
- The submission API has a simple in-memory rate limiter to reduce spam/abuse of the Gemini
  quota; a production deployment would need this backed by Redis or similar across instances.
- District matching from free text is name-based substring matching, not verified geolocation —
  flagged here as a known limitation rather than presented as solved.

## What's simulated vs. real for this prototype

- **Real**: Gemini-powered classification (text + photo) and recommendation rationale,
  deterministic scoring engine, near-duplicate clustering, time-series impact view, full
  dashboard with live map and charts, voice input via the Web Speech API, rate limiting, basic
  access gating.
- **Simulated for demo speed**: WhatsApp Business API / SMS gateway integration (channel is
  tagged but not actually pulled from WhatsApp), and the regions dataset (illustrative numbers
  for a handful of districts rather than a live Census/infrastructure API feed).

## Google AI stack — what's used and what's a documented next step

| Requirement | Status |
|---|---|
| **Gemini API** (generative AI) | ✅ Used — classification, photo analysis, recommendation rationale (`lib/gemini.js`) |
| Cloud Speech-to-Text / Translation API | ⚠️ Browser's Web Speech API used for the prototype; Cloud Speech-to-Text + Translation API is the documented next step for production-grade accuracy across all 22 scheduled Indian languages |
| Google Maps Platform | ⚠️ Leaflet/OpenStreetMap used for the prototype map; swapping the tile/marker layer for Google Maps Platform is a drop-in change in `components/ComplaintMap.jsx` |
| Firebase (auth, realtime DB) | ⚠️ File-based JSON store used for the prototype; `lib/db.js` exposes 4 functions so swapping in Firestore is isolated to one file |
| BigQuery | Not needed at hackathon scale (~35 sample records); noted as the scale-up path for national-level datasets |
