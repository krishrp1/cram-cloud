import Link from "next/link";
import { notFound } from "next/navigation";
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
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← All departments
        </Link>
        <h1 className="font-heading mt-1 text-2xl font-bold">{branchLabel(branch)}</h1>
        <p className="text-sm text-muted-foreground">Choose a semester.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {SEMESTERS.map((semester) => (
          <Link
            key={semester}
            href={`/dashboard/${branch}/${encodeURIComponent(semester)}`}
            className="rounded-lg border bg-muted/30 px-4 py-6 text-center text-sm font-medium transition-colors hover:bg-muted"
          >
            {semester}
          </Link>
        ))}
      </div>
    </div>
  );
}
