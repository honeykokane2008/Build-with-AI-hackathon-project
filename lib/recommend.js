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
      buckets[key] = { regionId: c.regionId, category: c.category, complaintCount: 0, weightedComplaints: 0 };
    }
    buckets[key].complaintCount += 1;
    buckets[key].weightedComplaints += URGENCY_WEIGHT[c.urgency] || 1;
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
      weightedComplaints: b.weightedComplaints,
      infraIndex: infraScore,
      currentInvestmentINRLakh: investment,
      priorityScore,
    };
  });

  hotspots.sort((a, b) => b.priorityScore - a.priorityScore);
  return hotspots;
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
