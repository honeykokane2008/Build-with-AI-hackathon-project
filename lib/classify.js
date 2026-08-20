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

  let language = "en";
  if (/[\u0900-\u097F]/.test(text)) language = "hi/mr";
  else if (/[\u0B80-\u0BFF]/.test(text)) language = "ta";
  else if (/[\u0A00-\u0A7F]/.test(text)) language = "pa";
  else if (/[\u0980-\u09FF]/.test(text)) language = "bn";
  else if (/[\u0C00-\u0C7F]/.test(text)) language = "te";
  else if (/[\u0A80-\u0AFF]/.test(text)) language = "gu";

  return { category, urgency, language, translatedText: text, confidence: "fallback-rule-based" };
}

async function llmClassify(text, regions, imageBase64, imageMimeType) {
  const model = getModel();
  const regionNames = regions.map((r) => r.name).join(", ");

  const prompt = `You are a civic-complaint classification engine for a citizen feedback platform serving India.
Classify the following citizen submission. It may be in any Indian language or script — Hindi, Marathi, Tamil, Punjabi, Bengali, Telugu, Gujarati, Kannada, Malayalam, Urdu, English, or a code-switched mix of these.
${imageBase64 ? "A photo was attached as evidence — use it to confirm or refine the category and urgency (e.g. visible flooding, garbage pile-up, road damage, downed power line)." : ""}

Known districts in this deployment: ${regionNames}

Submission: """${text}"""

Respond with ONLY a JSON object, no preamble, no markdown fences, matching exactly this shape:
{
  "category": one of ${JSON.stringify(CATEGORIES)},
  "urgency": one of ${JSON.stringify(URGENCY_LEVELS)},
  "language": "detected language code(s), e.g. en, hi, mr, hi-en",
  "translatedText": "English translation of the submission (or original if already English)",
  "matchedRegion": "the closest matching district name from the known list, or null if none mentioned",
  "reasoning": "one short sentence explaining the urgency rating",
  "photoObservation": "if a photo was attached, one short sentence describing what it shows and whether it corroborates the text; otherwise null"
}`;

  const parts = [{ text: prompt }];
  if (imageBase64 && imageMimeType) {
    parts.push({ inlineData: { data: imageBase64, mimeType: imageMimeType } });
  }

  const result = await model.generateContent(parts);
  const rawText = result.response.text();
  const cleaned = rawText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleaned);
}

export async function classifyComplaint(text, imageBase64 = null, imageMimeType = null) {
  const regions = getAllRegions();
  const model = getModel();

  if (!model) {
    const fallback = ruleBasedClassify(text);
    return { ...fallback, regionId: guessRegion(text, regions), photoObservation: imageBase64 ? "Photo attached — set GEMINI_API_KEY to enable AI photo analysis." : null };
  }

  try {
    const result = await llmClassify(text, regions, imageBase64, imageMimeType);
    const matched = regions.find(
      (r) => result.matchedRegion && r.name.toLowerCase() === String(result.matchedRegion).toLowerCase()
    );
    return {
      category: CATEGORIES.includes(result.category) ? result.category : "other",
      urgency: URGENCY_LEVELS.includes(result.urgency) ? result.urgency : "medium",
      language: result.language || "unknown",
      translatedText: result.translatedText || text,
      reasoning: result.reasoning || "",
      photoObservation: result.photoObservation || null,
      confidence: "gemini",
      regionId: matched ? matched.id : guessRegion(text, regions),
    };
  } catch (err) {
    console.error("LLM classification failed, falling back:", err.message);
    const fallback = ruleBasedClassify(text);
    return { ...fallback, regionId: guessRegion(text, regions), photoObservation: null };
  }
}

export { CATEGORIES, URGENCY_LEVELS };
