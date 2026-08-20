import { getAllComplaints, getAllRegions } from "./db";
import { getModel } from "./gemini";

const URGENCY_WEIGHT = { low: 1, medium: 2, high: 4, critical: 8 };

// Explainable, deterministic scoring — no black box.
// Higher score = more citizens affected, worse existing infrastructure,
// and less current public investment already addressing it.
function scoreEntry({ weightedComplaints, complaintCount, infraScore, investment }) {
  const gap = Math.max(1, 100 - infraScore); // worse infra -> bigger gap
  const investmentDampener = investment / 100 + 1; // more money already flowing -> lower urgency
  const raw = (weightedComplaints * gap) / investmentDampener;
  return Math.round(raw * 10) / 10;
}

export function buildHotspots() {
  const complaints = getAllComplaints();
  const regions = getAllRegions();

  const buckets = {}; // key: regionId::category

  for (const c of complaints) {
    if (!c.regionId || !c.category) continue;
    const key = `${c.regionId}::${c.category}`;
    if (!buckets[key]) {
      buckets[key] = {
        regionId: c.regionId,
        category: c.category,
        complaintCount: 0,
        weightedComplaints: 0,
        clusterIds: new Set(),
      };
    }
    buckets[key].complaintCount += 1;
    buckets[key].weightedComplaints += URGENCY_WEIGHT[c.urgency] || 1;
    buckets[key].clusterIds.add(c.clusterId || c.id);
  }

  const hotspots = Object.values(buckets).map((b) => {
    const region = regions.find((r) => r.id === b.regionId);
    const infraScore = region?.infraIndex?.[b.category] ?? 50;
    const investment = region?.currentInvestmentINRLakh?.[b.category] ?? 0;
    const priorityScore = scoreEntry({ ...b, infraScore, investment });

    return {
      regionId: b.regionId,
      regionName: region?.name || b.regionId,
      lat: region?.lat,
      lng: region?.lng,
      category: b.category,
      complaintCount: b.complaintCount,
      distinctIssues: b.clusterIds.size,
      weightedComplaints: b.weightedComplaints,
      infraIndex: infraScore,
      currentInvestmentINRLakh: investment,
      priorityScore,
    };
  });

  hotspots.sort((a, b) => b.priorityScore - a.priorityScore);
  return hotspots;
}

// Time-series view for the impact/trend dashboard: complaint volume per
// week per category, so a policymaker can see whether a reported issue is
// escalating, plateauing, or improving after investment — directly answers
// the "no way to measure impact" gap in the original problem statement.
export function buildTrend() {
  const complaints = getAllComplaints();

  function weekKey(dateStr) {
    const d = new Date(dateStr);
    const firstDayOfYear = new Date(d.getFullYear(), 0, 1);
    const pastDays = (d - firstDayOfYear) / 86400000;
    const week = Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7);
    return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  const buckets = {}; // key: weekKey -> { week, [category]: count }

  for (const c of complaints) {
    if (!c.createdAt || !c.category) continue;
    const wk = weekKey(c.createdAt);
    if (!buckets[wk]) buckets[wk] = { week: wk };
    buckets[wk][c.category] = (buckets[wk][c.category] || 0) + 1;
  }

  return Object.values(buckets).sort((a, b) => (a.week > b.week ? 1 : -1));
}

async function addLLMRationale(topHotspots) {
  const model = getModel();
  if (topHotspots.length === 0) return topHotspots;
  if (!model) return topHotspots.map((h) => ({ ...h, rationale: fallbackRationale(h) }));

  const prompt = `You are advising national policymakers on infrastructure investment priorities.
Given this ranked list of demand hotspots (each combining citizen complaint volume, an infrastructure quality index out of 100, and current public investment in INR lakh), write a one-sentence, decision-maker-facing rationale for each of the top items explaining WHY it should be prioritized. Be concrete and reference the actual numbers.

Data: ${JSON.stringify(topHotspots, null, 2)}

Respond with ONLY a JSON array, no preamble, no markdown fences, in the same order as the input, each element: { "regionId": "...", "category": "...", "rationale": "..." }`;

  try {
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    const rationales = JSON.parse(cleaned);

    return topHotspots.map((h) => {
      const match = rationales.find((r) => r.regionId === h.regionId && r.category === h.category);
      return { ...h, rationale: match?.rationale || fallbackRationale(h) };
    });
  } catch (err) {
    console.error("LLM rationale generation failed, using fallback text:", err.message);
    return topHotspots.map((h) => ({ ...h, rationale: fallbackRationale(h) }));
  }
}

function fallbackRationale(h) {
  return `${h.complaintCount} complaint(s) reported for ${h.category} in ${h.regionName}, where the infrastructure index is only ${h.infraIndex}/100 and current investment is ₹${h.currentInvestmentINRLakh} lakh — a significant unmet gap.`;
}

export async function getRecommendations(limit = 8) {
  const hotspots = buildHotspots();
  const top = hotspots.slice(0, limit);
  return addLLMRationale(top);
}
