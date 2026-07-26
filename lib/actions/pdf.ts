"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { uploadPdf, deletePdf } from "@/lib/storage";
import { parseId } from "@/lib/parseId";
import { checkRateLimit } from "@/lib/rate-limit";
import { uploadPdfSchema } from "@/lib/validations/pdf";
import { Prisma } from "@/generated/prisma/client";
import type { ActionState } from "@/lib/action-state";

const PDF_MAGIC = Buffer.from("%PDF-");

function secureFilename(filename: string) {
  return path.basename(filename).replace(/[^A-Za-z0-9_.-]/g, "_");
}

export async function uploadPdfAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  if (!checkRateLimit(`upload:${admin.id}`, 20, 60 * 60 * 1000)) {
    return { status: "error", message: "Too many requests, please try again later" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "No file" };
  }

  const parsed = uploadPdfSchema.safeParse({
    title: formData.get("title"),
    branch: formData.get("branch"),
    semester: formData.get("semester"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, branch, semester } = parsed.data;

  if (!file.name || path.extname(file.name).toLowerCase() !== ".pdf") {
    return { status: "error", message: "PDF only" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (!buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
    return { status: "error", message: "File is not a valid PDF" };
  }

  const safeName = secureFilename(file.name);
  const ext = path.extname(safeName);
  const base = path.basename(safeName, ext);
  const filename = `${base}_${Math.floor(Date.now() / 1000)}${ext}`;

  await uploadPdf(filename, buffer);

  const created = await db.pdf.create({
    data: { title, filename, branch, semester, uploadedBy: admin.id, fileUrl: "" },
  });
  await db.pdf.update({
    where: { id: created.id },
    data: { fileUrl: `/api/pdf/${created.id}/file` },
  });

  revalidatePath("/admin");
  revalidatePath(`/dashboard/${branch}/${encodeURIComponent(semester)}`);
  return { status: "success" };
}

export async function deletePdfAction(rawId: string): Promise<ActionState> {
  await requireAdmin();

  const id = parseId(rawId);
  if (id === null) return { status: "error", message: "Not found" };

  const pdf = await db.pdf.findUnique({ where: { id } });
  if (!pdf) return { status: "error", message: "Not found" };

  try {
    await deletePdf(pdf.filename);
  } catch (err) {
    // Storage object may already be gone; don't let a storage-side hiccup
    // block removing the (bad) DB row.
    console.error("Failed to delete storage object for pdf", pdf.id, err);
  }

  try {
    await db.pdf.delete({ where: { id: pdf.id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      // P2003: comments still reference this pdf (no onDelete: Cascade on
      // that relation) — was previously unhandled, threw straight through.
      if (err.code === "P2003") {
        return { status: "error", message: "Cannot delete: this note still has comments" };
      }
      // P2025: already deleted by a concurrent request/double-click.
      if (err.code === "P2025") {
        return { status: "error", message: "Already deleted" };
      }
    }
    throw err;
  }

  revalidatePath("/admin");
  revalidatePath(`/dashboard/${pdf.branch}/${encodeURIComponent(pdf.semester)}`);
  return { status: "success" };
}
