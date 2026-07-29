import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";

// The fixed dummy hash loginAction compares against when no user matches
// the given email — copied from lib/actions/auth.ts's DUMMY_HASH constant
// (not exported, since nothing outside that file needs it) specifically so
// this test can assert the *same* hash is used regardless of whether a
// real user exists, which is the property that makes login timing-safe.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeOxRp.PkT7wJI4TnP1zlt/dGZmzB1XZm.";

const mockDb = { user: { findUnique: vi.fn() } };

vi.mock("@/lib/prisma", () => ({ db: mockDb }));
vi.mock("@/lib/session", () => ({ createSession: vi.fn(), deleteSession: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(async () => true) }));
vi.mock("@/lib/request-ip", () => ({ getRequestIp: vi.fn(async () => "127.0.0.1") }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

const { loginAction } = await import("@/lib/actions/auth");

const formData = (email: string, password: string) => {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", password);
  return fd;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loginAction timing-safety", () => {
  it("compares against the real user's hash when the email exists", async () => {
    const spy = vi.spyOn(bcrypt, "compare");
    mockDb.user.findUnique.mockResolvedValue({ id: 1, email: "a.cs24@bmsce.ac.in", passwordHash: "$2b$12$realhashvalue" });

    const result = await loginAction({ status: "idle" }, formData("a.cs24@bmsce.ac.in", "wrongpassword"));

    expect(result).toEqual({ status: "error", message: "Invalid credentials" });
    expect(spy).toHaveBeenCalledWith("wrongpassword", "$2b$12$realhashvalue");
  });

  it("still runs a bcrypt compare against the fixed dummy hash when no user matches, instead of short-circuiting", async () => {
    const spy = vi.spyOn(bcrypt, "compare");
    mockDb.user.findUnique.mockResolvedValue(null);

    const result = await loginAction({ status: "idle" }, formData("nobody.cs24@bmsce.ac.in", "anypassword"));

    expect(result).toEqual({ status: "error", message: "Invalid credentials" });
    // Same dummy hash every time a user doesn't exist — this is what keeps
    // a nonexistent-email login costing the same bcrypt work as a
    // wrong-password one, closing the response-timing enumeration gap
    // documented in lib/actions/auth.ts.
    expect(spy).toHaveBeenCalledWith("anypassword", DUMMY_HASH);
  });
});
