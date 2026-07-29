import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { BRANCHES, SEMESTERS, branchLabel } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: rawBranch } = await params;
  const branch = decodeURIComponent(rawBranch);
  if (!BRANCHES.some((b) => b.value === branch)) return { title: "Cram Cloud" };
  return { title: `${branchLabel(branch)} — Cram Cloud` };
}

export default async function BranchSemesterPickerPage({ params }: { params: Promise<{ branch: string }> }) {
  const { branch: rawBranch } = await params;
  // Route params arrive percent-encoded as-is in this Next.js version.
  const branch = decodeURIComponent(rawBranch);
  if (!BRANCHES.some((b) => b.value === branch)) notFound();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All departments
        </Link>
        <h1 className="font-heading mt-2 text-2xl font-bold">{branchLabel(branch)}</h1>
        <p className="text-muted-foreground text-sm">Which semester are you looking for?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SEMESTERS.map((semester) => (
          <Link
            key={semester}
            href={`/dashboard/${branch}/${encodeURIComponent(semester)}`}
            className="bg-card ring-foreground/10 hover:ring-cta/40 hover:bg-accent rounded-xl px-4 py-6 text-center text-sm font-medium ring-1 transition-colors"
          >
            {semester}
          </Link>
        ))}
      </div>
    </div>
  );
}
