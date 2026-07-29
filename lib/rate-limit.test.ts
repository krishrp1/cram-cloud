import { describe, it, expect, vi, beforeEach } from "vitest";

const mockTx = {
  rateLimitHit: {
    count: vi.fn(),
    create: vi.fn(),
  },
};

const mockDb = {
  $transaction: vi.fn(async (callback: (tx: typeof mockTx) => unknown) => callback(mockTx)),
  rateLimitHit: {
    deleteMany: vi.fn(async () => ({ count: 0 })),
  },
};

vi.mock("@/lib/prisma", () => ({ db: mockDb }));

const { checkRateLimit, pruneRateLimitHits } = await import("@/lib/rate-limit");

beforeEach(() => {
  vi.clearAllMocks();
  mockDb.$transaction.mockImplementation(async (callback: (tx: typeof mockTx) => unknown) => callback(mockTx));
});

describe("checkRateLimit", () => {
  it("allows the request and records a hit when under the limit", async () => {
    mockTx.rateLimitHit.count.mockResolvedValue(2);
    mockTx.rateLimitHit.create.mockResolvedValue({});

    const allowed = await checkRateLimit("login:1.2.3.4", 10, 60_000);

    expect(allowed).toBe(true);
    expect(mockTx.rateLimitHit.create).toHaveBeenCalledWith({ data: { key: "login:1.2.3.4" } });
  });

  it("blocks the request without recording a hit once at the limit", async () => {
    mockTx.rateLimitHit.count.mockResolvedValue(10);

    const allowed = await checkRateLimit("login:1.2.3.4", 10, 60_000);

    expect(allowed).toBe(false);
    expect(mockTx.rateLimitHit.create).not.toHaveBeenCalled();
  });

  it("fails closed (denies the request) if the transaction throws", async () => {
    // Mirrors a real Postgres serialization failure when two concurrent
    // requests race on the same key under the Serializable isolation level.
    mockDb.$transaction.mockRejectedValueOnce(new Error("could not serialize access"));

    const allowed = await checkRateLimit("login:1.2.3.4", 10, 60_000);

    expect(allowed).toBe(false);
  });

  it("scopes the count query to the given key and window", async () => {
    mockTx.rateLimitHit.count.mockResolvedValue(0);
    mockTx.rateLimitHit.create.mockResolvedValue({});

    await checkRateLimit("comment:42", 30, 60_000);

    expect(mockTx.rateLimitHit.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          key: "comment:42",
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});

describe("pruneRateLimitHits", () => {
  it("deletes rows older than the retention window and returns the count", async () => {
    mockDb.rateLimitHit.deleteMany.mockResolvedValue({ count: 7 });

    const deleted = await pruneRateLimitHits();

    expect(deleted).toBe(7);
    expect(mockDb.rateLimitHit.deleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { createdAt: { lt: expect.any(Date) } } }),
    );
  });
});
