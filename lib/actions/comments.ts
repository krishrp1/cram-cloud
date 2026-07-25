"use server";

import { revalidatePath } from "next/cache";
import { requireUser, canAccessSemester } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { commentSchema } from "@/lib/validations/comment";
import type { ActionState } from "@/lib/action-state";

export async function postCommentAction(rawPdfId: string, _prevState: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  const pdfId = parseId(rawPdfId);
  if (pdfId === null) return { status: "error", message: "Not found" };

  const pdf = await db.pdf.findUnique({ where: { id: pdfId } });
  if (!pdf || !canAccessSemester(user, pdf.semester)) {
    return { status: "error", message: "Not found" };
  }

  const parsed = commentSchema.safeParse({ text: formData.get("text") });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db.comment.create({
    data: { pdfId, userId: user.id, text: parsed.data.text },
  });

  revalidatePath(`/dashboard/${pdfId}`);
  return { status: "success" };
}
