const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "for", "to",
  "of", "and", "our", "we", "has", "have", "been", "it", "this", "that", "near",
]);

function tokenize(text) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const SIMILARITY_THRESHOLD = 0.35;

// Given a new complaint's (translated) text + its region/category, and the
// full existing complaint list, find whether it matches an existing issue
// cluster. Returns { clusterId, isDuplicate }.
export function assignCluster(newText, regionId, category, existingComplaints) {
  const candidateWords = tokenize(newText);

  const sameContext = existingComplaints.filter(
    (c) => c.regionId === regionId && c.category === category
  );

  let bestMatch = null;
  let bestScore = 0;

  for (const c of sameContext) {
    const existingWords = tokenize(c.translatedText || c.text || "");
    const score = jaccardSimilarity(candidateWords, existingWords);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = c;
    }
  }

  if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
    return { clusterId: bestMatch.clusterId || bestMatch.id, isDuplicate: true, similarity: Math.round(bestScore * 100) };
  }

  return { clusterId: null, isDuplicate: false, similarity: 0 };
}
