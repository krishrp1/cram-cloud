"use server";

import path from "path";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/dal";
import { db } from "@/lib/prisma";
import { uploadPdf, deletePdf } from "@/lib/storage";
import { parseId } from "@/lib/parseId";
import { uploadPdfSchema } from "@/lib/validations/pdf";
import type { ActionState } from "@/lib/action-state";

const PDF_MAGIC = Buffer.from("%PDF-");

function secureFilename(filename: string) {
  return path.basename(filename).replace(/[^A-Za-z0-9_.-]/g, "_");
}

export async function uploadPdfAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "No file" };
  }

  const parsed = uploadPdfSchema.safeParse({
    title: formData.get("title"),
    semester: formData.get("semester"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { title, semester } = parsed.data;

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
    data: { title, filename, semester, uploadedBy: admin.id, fileUrl: "" },
  });
  await db.pdf.update({
    where: { id: created.id },
    data: { fileUrl: `/api/pdf/${created.id}/file` },
  });

  revalidatePath("/admin");
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
  await db.pdf.delete({ where: { id: pdf.id } });

  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { status: "success" };
}
