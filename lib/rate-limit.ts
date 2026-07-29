import "server-only";
import { db } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";

/**
 * Sliding-window rate limiter backed by Postgres — this app already runs
 * on Supabase Postgres via Prisma, so a rate_limit_hits table gives
 * durable, cross-instance limiting (unlike a per-process in-memory Map)
 * without adding a new service.
 *
 * Count-then-insert runs in a Serializable transaction so two concurrent
 * requests can't both read the same under-limit count and both insert,
 * which would let the limit be exceeded (a real risk for brute-forcing
 * login with a handful of parallel requests). Postgres aborts one side of
 * any conflicting pair with a serialization failure; that side fails
 * closed (treated as rate-limited) rather than retrying.
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMs);

  try {
    return await db.$transaction(
      async (tx) => {
        const count = await tx.rateLimitHit.count({
          where: { key, createdAt: { gte: windowStart } },
        });
        if (count >= max) return false;
        await tx.rateLimitHit.create({ data: { key } });
        return true;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch {
    // Any DB error here (serialization conflict, pool exhaustion, transient
    // outage) fails closed rather than re-throwing — the caller's request
    // shouldn't crash just because the limiter couldn't run, and "briefly
    // unavailable" is the safe default for a rate limiter.
    return false;
  }
}

// Old rows don't affect correctness (checkRateLimit only ever counts within
// the last windowMs), just table size — pruned on a schedule by
// app/api/cron/prune-rate-limits/route.ts rather than opportunistically on
// every call, so cleanup isn't left to chance under low traffic.
export async function pruneRateLimitHits(): Promise<number> {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000);
  const { count } = await db.rateLimitHit.deleteMany({ where: { createdAt: { lt: cutoff } } });
  return count;
}
