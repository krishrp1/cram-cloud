import "server-only";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import { canAccessSemester } from "@/lib/auth/dal";
import type { User, Pdf } from "@/generated/prisma/client";

function pdfToDict(pdf: Pdf & { uploader: User }) {
  return {
    id: pdf.id,
    title: pdf.title,
    filename: pdf.filename,
    semester: pdf.semester,
    uploadedBy: pdf.uploader.email,
    uploadDate: pdf.uploadDate.toISOString(),
  };
}

export type PdfListItem = ReturnType<typeof pdfToDict>;

// Admin sees every PDF (dashboard sidebar filters client-side by semester
// from this one fetch); students only ever see their own semester's rows —
// enforced here, not by a client-passed filter, so there's no query-param
// surface for a student to request another semester.
export async function listPdfsForUser(user: User): Promise<PdfListItem[]> {
  const pdfs = await db.pdf.findMany({
    where: user.role === "admin" ? {} : { semester: user.semester },
    include: { uploader: true },
    orderBy: { uploadDate: "desc" },
  });
  return pdfs.map(pdfToDict);
}

export async function getPdfForUser(rawId: string, user: User) {
  const id = parseId(rawId);
  if (id === null) return null;
  const pdf = await db.pdf.findUnique({ where: { id }, include: { uploader: true } });
  if (!pdf) return null;
  if (!canAccessSemester(user, pdf.semester)) return null;
  return pdfToDict(pdf);
}

// Internal (storage key / semester) — used by the file-serving route and
// delete action, which need the raw row rather than the client-safe dict.
export async function getPdfRowForUser(rawId: string, user: User) {
  const id = parseId(rawId);
  if (id === null) return null;
  const pdf = await db.pdf.findUnique({ where: { id } });
  if (!pdf) return null;
  if (!canAccessSemester(user, pdf.semester)) return null;
  return pdf;
}
