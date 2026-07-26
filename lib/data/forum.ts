import "server-only";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { canAccessSemester } from "@/lib/auth/dal";
import type { User, ForumThread, ForumReply } from "@/generated/prisma/client";

function threadToDict(t: ForumThread & { user: User; _count: { replies: number } }) {
  return {
    id: t.id,
    userId: t.userId,
    userName: t.user.email,
    title: t.title,
    content: t.content,
    semester: t.semester,
    createdAt: t.createdAt.toISOString(),
    replyCount: t._count.replies,
  };
}

function replyToDict(r: ForumReply & { user: User }) {
  return {
    id: r.id,
    threadId: r.threadId,
    userId: r.userId,
    userName: r.user.email,
    content: r.content,
    createdAt: r.createdAt.toISOString(),
  };
}

export type ThreadListItem = ReturnType<typeof threadToDict>;
export type ReplyItem = ReturnType<typeof replyToDict>;

// Forum threads are scoped to the viewer's own semester — including for
// admins. The original UI never exposed a cross-semester filter here
// (unlike the PDF dashboard), so there's nothing to replicate beyond this.
export async function listThreadsForUser(user: User, page: number, perPage: number) {
  const safePage = Math.max(page || 1, 1);
  const safePerPage = Math.min(Math.max(perPage || 10, 1), 50);

  const [threads, total] = await Promise.all([
    db.forumThread.findMany({
      where: { semester: user.semester },
      include: { user: true, _count: { select: { replies: true } } },
      orderBy: { createdAt: "desc" },
      skip: (safePage - 1) * safePerPage,
      take: safePerPage,
    }),
    db.forumThread.count({ where: { semester: user.semester } }),
  ]);

  return {
    threads: threads.map(threadToDict),
    total,
    pages: Math.ceil(total / safePerPage),
    currentPage: safePage,
  };
}

export async function getThreadForUser(rawId: string, user: User) {
  const id = parseId(rawId);
  if (id === null) return null;

  const thread = await db.forumThread.findUnique({
    where: { id },
    include: {
      user: true,
      _count: { select: { replies: true } },
      replies: { include: { user: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) return null;
  if (!canAccessSemester(user, thread.semester)) return null;

  return { thread: threadToDict(thread), replies: thread.replies.map(replyToDict) };
}
