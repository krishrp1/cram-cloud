import "server-only";
import { db } from "@/lib/prisma";
import { parseId } from "@/lib/parseId";
import type { User, Pdf } from "@/generated/prisma/client";

function pdfToDict(pdf: Pdf & { uploader: User }) {
  return {
    id: pdf.id,
    title: pdf.title,
    filename: pdf.filename,
    branch: pdf.branch,
    semester: pdf.semester,
    uploadedBy: pdf.uploader.email,
    uploadDate: pdf.uploadDate.toISOString(),
  };
}

export type PdfListItem = ReturnType<typeof pdfToDict>;

// Notes are open-browse: any authenticated user (student or admin) can list
// and view any branch/semester's notes — access is scoped by the picker UI
// navigating into a branch+semester, not by the viewer's own profile.
export async function listPdfsForBranchSemester(branch: string, semester: string): Promise<PdfListItem[]> {
  const pdfs = await db.pdf.findMany({
    where: { branch, semester },
    include: { uploader: true },
    orderBy: { uploadDate: "desc" },
  });
  return pdfs.map(pdfToDict);
}

// Admin-only: every PDF across every branch/semester, for the "Manage PDFs" tab.
export async function listAllPdfs(): Promise<PdfListItem[]> {
  const pdfs = await db.pdf.findMany({
    include: { uploader: true },
    orderBy: { uploadDate: "desc" },
  });
  return pdfs.map(pdfToDict);
}

export async function getPdfById(rawId: string) {
  const id = parseId(rawId);
  if (id === null) return null;
  const pdf = await db.pdf.findUnique({ where: { id }, include: { uploader: true } });
  if (!pdf) return null;
  return pdfToDict(pdf);
}

// Internal (storage key) — used by the file-serving route and delete action,
// which need the raw row rather than the client-safe dict.
export async function getPdfRow(rawId: string) {
  const id = parseId(rawId);
  if (id === null) return null;
  return db.pdf.findUnique({ where: { id } });
}
