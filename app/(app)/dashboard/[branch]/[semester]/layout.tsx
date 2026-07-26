import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { listPdfsForBranchSemester } from "@/lib/data/pdfs";
import { PdfSidebar } from "@/components/dashboard/pdf-sidebar";
import { BRANCHES, SEMESTERS } from "@/lib/constants";

export default async function BranchSemesterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ branch: string; semester: string }>;
}) {
  const raw = await params;
  const branch = decodeURIComponent(raw.branch);
  const semester = decodeURIComponent(raw.semester);
  // Route params in this Next.js version arrive percent-encoded as-is
  // (unlike historical Next.js, which decoded them) — semester values like
  // "Semester 1" contain a space, so this must be decoded explicitly.
  if (!BRANCHES.some((b) => b.value === branch) || !SEMESTERS.includes(semester)) notFound();

  const user = await requireUser();
  const pdfs = await listPdfsForBranchSemester(branch, semester);

  return (
    <div className="flex min-h-[calc(100svh-56px)] flex-col md:flex-row">
      <PdfSidebar pdfs={pdfs} branch={branch} semester={semester} isAdmin={user.role === "admin"} />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
