"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { checkRateLimit } from "@/lib/rate-limit";
import { commentSchema } from "@/lib/validations/comment";
import type { ActionState } from "@/lib/action-state";

export async function postCommentAction(rawPdfId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  if (!checkRateLimit(`comment:${user.id}`, 30, 60 * 1000)) {
    return { status: "error", message: "Too many requests, please slow down" };
  }

  const pdfId = parseId(rawPdfId);
  if (pdfId === null) return { status: "error", message: "Not found" };

  // Notes are open-browse — any authenticated user who can view a pdf can
  // comment on it, so the only gate here is that the pdf exists.
  const pdf = await db.pdf.findUnique({ where: { id: pdfId } });
  if (!pdf) {
    return { status: "error", message: "Not found" };
  }

  const parsed = commentSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.comment.create({
    data: { pdfId, userId: user.id, text: parsed.data.text },
  });

  revalidatePath(`/dashboard/${pdf.branch}/${encodeURIComponent(pdf.semester)}/${pdfId}`);
  return { status: "success" };
}
