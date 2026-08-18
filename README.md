# JanVaani — Citizen Demand Intelligence Platform

A working prototype for the **"aggregate citizen feedback → align with national infrastructure
priorities"** problem statement. Built as a Next.js app so the whole pipeline (ingestion →
AI classification → cross-referencing → recommendation) runs in one project.

## What it does

1. **Ingest** — citizens submit complaints via a form (text, simulated WhatsApp/voice/walk-in
   channel tags, and real browser-based voice-to-text using the Web Speech API).
2. **Classify** — each complaint is run through an AI pipeline that extracts:
   - issue category (water / roads / electricity / healthcare / sanitation)
   - urgency (low / medium / high / critical)
   - detected language + English translation
   - matched district
3. **Cross-reference** — complaints are aggregated per district+category and weighed against a
   national reference dataset: population, infrastructure quality index (0–100), and current
   public investment already committed (₹ lakh) per sector.
4. **Recommend** — a transparent, explainable scoring formula ranks demand hotspots and a
   short LLM-written (or template) rationale is attached for each, ready for a policymaker to read.

## Why it's designed as a Digital Public Good

The data layer is split into three clean pieces so any BRICS nation (or any Indian state) can
adopt it without touching the pipeline code:

- `data/regions.json` — swap this for another country's districts/provinces + demographic and
  infrastructure data. Schema uses `adminRegion` rather than anything India-specific.
- `data/complaints.json` (or a real DB — see below) — citizen submissions, channel-agnostic.
- `lib/recommend.js` — the scoring formula is fully deterministic and documented inline, not a
  black box. `weightedComplaints × infrastructureGap ÷ (1 + existingInvestment)`.

## Running it

```bash
npm install
npm run seed     # populates data/complaints.json with 30 realistic sample complaints
npm run dev       # http://localhost:3000
```

No API key is required to run it — without one, classification and rationale generation fall
back to a deterministic rule-based engine so the whole app is fully demoable offline.

**For submission, set a Gemini key** — this hackathon requires all solutions to integrate
Google AI, and the classification + recommendation-rationale pipeline calls the Gemini API:

```bash
cp .env.example .env.local
# then add a free key from https://aistudio.google.com/app/apikey:
GEMINI_API_KEY=AIza...
```

Uses `gemini-2.0-flash` via the `@google/generative-ai` SDK (see `lib/gemini.js`,
`lib/classify.js`, `lib/recommend.js`).

## Project structure

```
app/
  page.js              landing page (pitch)
  submit/page.js        citizen submission form (+ voice input)
  dashboard/page.js     policymaker dashboard (map, charts, recommendations)
  api/complaints/       GET list / POST submit+classify
  api/districts/        GET reference dataset
  api/recommendations/  GET ranked, scored hotspots
lib/
  db.js                 file-based data store (swap for MongoDB/Postgres here)
  classify.js            LLM classification + offline rule-based fallback
  recommend.js           scoring engine + LLM rationale generation
data/
  regions.json           mock national demographic/infrastructure/investment dataset
  complaints.json         citizen submissions store
components/
  ComplaintMap.jsx        Leaflet hotspot map
  DashboardCharts.jsx     Recharts category/urgency charts
scripts/seed.js           generates realistic multilingual sample data
```

## Swapping in a real database

`lib/db.js` exposes exactly four functions (`getAllComplaints`, `insertComplaint`,
`getAllRegions`, `getRegionById`). Nothing else in the app touches storage directly — replace
the file I/O in that one file with a MongoDB/Mongoose or Postgres client and everything else
keeps working unchanged.

## What's simulated vs. real for this prototype

- **Real**: Gemini-powered classification pipeline (+ offline fallback), scoring/recommendation
  engine with Gemini-generated rationale, full dashboard with live map and charts, voice input
  via the browser's Web Speech API.
- **Simulated for demo speed**: WhatsApp Business API / SMS gateway integration (channel is
  tagged but not actually pulled from WhatsApp), and the regions dataset (uses illustrative
  numbers for six Maharashtra districts rather than a live Census/infrastructure API feed).
  Both are drop-in replacements, not architectural changes.

## Google Cloud stack — what's used and what's a documented next step

| Requirement | Status |
|---|---|
| **Gemini API** (generative AI) | ✅ Used — classification + recommendation rationale (`lib/gemini.js`) |
| Cloud Speech-to-Text / Translation API | ⚠️ Browser's Web Speech API used for the prototype; swapping in Cloud Speech-to-Text + Translation API is a documented next step for production-grade multilingual accuracy across all BRICS languages |
| Google Maps Platform | ⚠️ Leaflet/OpenStreetMap used for the prototype map; swapping the tile/marker layer for Google Maps Platform is a drop-in change in `components/ComplaintMap.jsx` |
| Firebase (auth, realtime DB) | ⚠️ File-based JSON store used for the prototype; `lib/db.js` exposes 4 functions so swapping in Firestore is isolated to one file |
| BigQuery | Not needed at hackathon scale (30 sample records); noted as the scale-up path for cross-border datasets |
