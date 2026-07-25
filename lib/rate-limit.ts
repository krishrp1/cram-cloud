import "server-only";

// In-memory, per-instance, best-effort limiter — not distributed across
// serverless invocations, same actual protection level the original
// express-rate-limit setup had once deployed (that was also in-memory per
// process). Good enough to blunt casual brute-forcing without adding new
// infra (e.g. a Redis/KV store) for this app's scale.
const hits = new Map<string, number[]>();

// Periodically drop stale entries so the map doesn't grow unbounded across
// a long-lived warm instance.
function prune(now: number) {
  for (const [key, timestamps] of hits) {
    const recent = timestamps.filter((t) => now - t < 60 * 60 * 1000);
    if (recent.length === 0) hits.delete(key);
    else hits.set(key, recent);
  }
}

let lastPrune = 0;

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  if (now - lastPrune > 5 * 60 * 1000) {
    prune(now);
    lastPrune = now;
  }

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (timestamps.length >= max) {
    hits.set(key, timestamps);
    return false;
  }
  timestamps.push(now);
  hits.set(key, timestamps);
  return true;
}
