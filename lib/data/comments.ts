import "server-only";
import { db } from "@/lib/prisma";
import type { Comment, User } from "@/generated/prisma/client";

function commentToDict(c: Comment & { user: User }) {
  return {
    id: c.id,
    userId: c.userId,
    userName: c.user.email,
    text: c.text,
    createdAt: c.createdAt.toISOString(),
  };
}

export type CommentItem = ReturnType<typeof commentToDict>;

// Caller is responsible for having already confirmed the parent pdf
// exists before calling this.
export async function listCommentsForPdf(pdfId: number): Promise<CommentItem[]> {
  const comments = await db.comment.findMany({
    where: { pdfId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
  return comments.map(commentToDict);
}
