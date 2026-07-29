import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDb = {
  forumReply: {
    findUnique: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  forumThread: {
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
};

const requireUser = vi.fn();
const canAccessSemester = vi.fn(() => true);
const redirect = vi.fn(() => {
  // Mirrors Next.js's real behavior: redirect() never returns, it throws.
  throw new Error("NEXT_REDIRECT");
});

vi.mock("@/lib/prisma", () => ({ db: mockDb }));
vi.mock("@/lib/auth/dal", () => ({ requireUser, canAccessSemester }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect }));

const { deleteReplyAction, editReplyAction, deleteThreadAction } = await import("@/lib/actions/forum");

const OWNER = { id: 1, role: "student", semester: "Semester 3" };
const OTHER_STUDENT = { id: 2, role: "student", semester: "Semester 3" };
const ADMIN = { id: 3, role: "admin", semester: "Semester 3" };

beforeEach(() => {
  vi.clearAllMocks();
  canAccessSemester.mockReturnValue(true);
});

describe("deleteReplyAction ownership", () => {
  const reply = { id: 10, userId: OWNER.id, threadId: 100, content: "hi" };

  it("lets the reply's own author delete it", async () => {
    requireUser.mockResolvedValue(OWNER);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);
    mockDb.forumReply.delete.mockResolvedValue(reply);

    const result = await deleteReplyAction("10");

    expect(result.status).toBe("success");
    expect(mockDb.forumReply.delete).toHaveBeenCalledWith({ where: { id: 10 } });
  });

  it("lets an admin delete someone else's reply", async () => {
    requireUser.mockResolvedValue(ADMIN);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);
    mockDb.forumReply.delete.mockResolvedValue(reply);

    const result = await deleteReplyAction("10");

    expect(result.status).toBe("success");
  });

  it("blocks a different non-admin student from deleting someone else's reply", async () => {
    requireUser.mockResolvedValue(OTHER_STUDENT);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);

    const result = await deleteReplyAction("10");

    expect(result).toEqual({ status: "error", message: "Not allowed" });
    expect(mockDb.forumReply.delete).not.toHaveBeenCalled();
  });

  it("returns not found for a malformed id without touching the db", async () => {
    requireUser.mockResolvedValue(OWNER);

    const result = await deleteReplyAction("not-a-number");

    expect(result).toEqual({ status: "error", message: "Not found" });
    expect(mockDb.forumReply.findUnique).not.toHaveBeenCalled();
  });
});

describe("editReplyAction ownership", () => {
  const reply = { id: 10, userId: OWNER.id, threadId: 100, content: "old" };
  const formData = (content: string) => {
    const fd = new FormData();
    fd.set("content", content);
    return fd;
  };

  it("lets the owner edit their own reply", async () => {
    requireUser.mockResolvedValue(OWNER);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);
    mockDb.forumReply.update.mockResolvedValue({ ...reply, content: "new" });

    const result = await editReplyAction("10", { status: "idle" }, formData("new"));

    expect(result.status).toBe("success");
  });

  it("does not let an admin edit someone else's reply (no admin override on edit)", async () => {
    requireUser.mockResolvedValue(ADMIN);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);

    const result = await editReplyAction("10", { status: "idle" }, formData("new"));

    expect(result).toEqual({ status: "error", message: "Not allowed" });
    expect(mockDb.forumReply.update).not.toHaveBeenCalled();
  });

  it("blocks a different student from editing someone else's reply", async () => {
    requireUser.mockResolvedValue(OTHER_STUDENT);
    mockDb.forumReply.findUnique.mockResolvedValue(reply);

    const result = await editReplyAction("10", { status: "idle" }, formData("new"));

    expect(result).toEqual({ status: "error", message: "Not allowed" });
  });
});

describe("deleteThreadAction ownership", () => {
  const thread = { id: 50, userId: OWNER.id, semester: "Semester 3" };

  it("lets the thread's own author delete it", async () => {
    requireUser.mockResolvedValue(OWNER);
    mockDb.forumThread.findUnique.mockResolvedValue(thread);
    mockDb.forumThread.delete.mockResolvedValue(thread);

    await expect(deleteThreadAction("50")).rejects.toThrow("NEXT_REDIRECT");

    expect(mockDb.forumThread.delete).toHaveBeenCalledWith({ where: { id: 50 } });
  });

  it("blocks a different non-admin student from deleting someone else's thread", async () => {
    requireUser.mockResolvedValue(OTHER_STUDENT);
    mockDb.forumThread.findUnique.mockResolvedValue(thread);

    const result = await deleteThreadAction("50");

    expect(result).toEqual({ status: "error", message: "Not allowed" });
    expect(mockDb.forumThread.delete).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("hides a thread outside the viewer's semester as not found", async () => {
    requireUser.mockResolvedValue(OTHER_STUDENT);
    canAccessSemester.mockReturnValue(false);
    mockDb.forumThread.findUnique.mockResolvedValue(thread);

    const result = await deleteThreadAction("50");

    expect(result).toEqual({ status: "error", message: "Not found" });
  });
});
