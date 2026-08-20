const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 8;

const hits = new Map(); // ip -> array of timestamps

export function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    hits.set(ip, timestamps);
    return true;
  }

  timestamps.push(now);
  hits.set(ip, timestamps);
  return false;
}
