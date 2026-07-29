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

// Note count per branch, for the dashboard's branch cards. Branches with no
// notes yet simply aren't in the returned map (treat missing as 0).
export async function countPdfsByBranch(): Promise<Record<string, number>> {
  const groups = await db.pdf.groupBy({ by: ["branch"], _count: { _all: true } });
  return Object.fromEntries(groups.map((g) => [g.branch, g._count._all]));
}

// Admin-only: every PDF across every branch/semester, for the "Manage PDFs" tab.
export async function listAllPdfs(page: number, perPage: number) {
  const safePage = Math.max(page || 1, 1);
  const safePerPage = Math.min(Math.max(perPage || 20, 1), 100);

  const [pdfs, total] = await Promise.all([
    db.pdf.findMany({
      include: { uploader: true },
      orderBy: { uploadDate: "desc" },
      skip: (safePage - 1) * safePerPage,
      take: safePerPage,
    }),
    db.pdf.count(),
  ]);

  return {
    pdfs: pdfs.map(pdfToDict),
    total,
    pages: Math.ceil(total / safePerPage) || 1,
    currentPage: safePage,
  };
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
