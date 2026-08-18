import { getModel } from "./gemini";
import { getAllRegions } from "./db";

const CATEGORIES = ["water", "roads", "electricity", "healthcare", "sanitation", "other"];
const URGENCY_LEVELS = ["low", "medium", "high", "critical"];

function guessRegion(text, regions) {
  const lower = text.toLowerCase();
  const hit = regions.find((r) => lower.includes(r.name.toLowerCase()));
  return hit ? hit.id : null;
}

// Deterministic fallback — no external API needed. Keeps the demo fully
// functional even without an ANTHROPIC_API_KEY configured.
function ruleBasedClassify(text) {
  const lower = text.toLowerCase();

  const categoryKeywords = {
    water: ["water", "pipeline", "borewell", "tap", "पानी", "नल"],
    roads: ["road", "pothole", "street", "bridge", "रस्ता", "सड़क"],
    electricity: ["electricity", "power", "transformer", "outage", "voltage", "बिजली"],
    healthcare: ["hospital", "clinic", "doctor", "medicine", "phc", "अस्पताल", "दवाखान"],
    sanitation: ["garbage", "sewage", "drain", "waste", "toilet", "कचरा", "गटार"],
  };

  let category = "other";
  for (const [cat, words] of Object.entries(categoryKeywords)) {
    if (words.some((w) => lower.includes(w))) {
      category = cat;
      break;
    }
  }

  const urgencyKeywords = {
    critical: ["urgent", "emergency", "dying", "collapsed", "outbreak", "months", "weeks"],
    high: ["broken", "no water", "no power", "overflowing", "unsafe"],
    medium: ["slow", "delayed", "irregular"],
  };

  let urgency = "low";
  if (urgencyKeywords.critical.some((w) => lower.includes(w))) urgency = "critical";
  else if (urgencyKeywords.high.some((w) => lower.includes(w))) urgency = "high";
  else if (urgencyKeywords.medium.some((w) => lower.includes(w))) urgency = "medium";

  const language = /[\u0900-\u097F]/.test(text) ? "hi/mr" : "en";

  return { category, urgency, language, translatedText: text, confidence: "fallback-rule-based" };
}

async function llmClassify(text, regions) {
  const model = getModel();
  const regionNames = regions.map((r) => r.name).join(", ");

  const prompt = `You are a civic-complaint classification engine for a citizen feedback platform.
Classify the following citizen submission. It may be in English, Hindi, Marathi, or a mix (code-switched).

Known districts in this deployment: ${regionNames}

Submission: """${text}"""

Respond with ONLY a JSON object, no preamble, no markdown fences, matching exactly this shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "urgency": one of ${JSON.stringify(URGENCY_LEVELS)},
  "language": "detected language code(s), e.g. en, hi, mr, hi-en",
  "translatedText": "English translation of the submission (or original if already English)",
  "matchedRegion": "the closest matching district name from the known list, or null if none mentioned",
  "reasoning": "one short sentence explaining the urgency rating"
}`;

  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function classifyComplaint(text) {
  const regions = getAllRegions();
  const model = getModel();

  if (!model) {
    const fallback = ruleBasedClassify(text);
    return { ...fallback, regionId: guessRegion(text, regions) };
  }

  try {
    const result = await llmClassify(text, regions);
    const matched = regions.find(
      (r) => result.matchedRegion && r.name.toLowerCase() === String(result.matchedRegion).toLowerCase()
    );
    return {
      category: CATEGORIES.includes(result.category) ? result.category : "other",
      urgency: URGENCY_LEVELS.includes(result.urgency) ? result.urgency : "medium",
      language: result.language || "unknown",
      translatedText: result.translatedText || text,
      reasoning: result.reasoning || "",
      confidence: "gemini",
      regionId: matched ? matched.id : guessRegion(text, regions),
    };
  } catch (err) {
    console.error("LLM classification failed, falling back:", err.message);
    const fallback = ruleBasedClassify(text);
    return { ...fallback, regionId: guessRegion(text, regions) };
  }
}

export { CATEGORIES, URGENCY_LEVELS };
