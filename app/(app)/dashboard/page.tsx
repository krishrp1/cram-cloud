import Link from "next/link";
import { DEPARTMENT_GROUPS } from "@/lib/constants";

export const metadata = { title: "Dashboard — Cram Cloud" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold">📚 Browse Notes</h1>
        <p className="text-sm text-muted-foreground">Choose your department to see available notes.</p>
      </div>

      <div className="flex flex-col gap-4">
        {DEPARTMENT_GROUPS.map((dept) => (
          <div key={dept.name} className="rounded-lg border bg-muted/30 p-4">
            <div className="mb-3 text-sm font-semibold">{dept.name}</div>
            <div className="flex flex-wrap gap-2">
              {dept.branches.map((branch) => (
                <Link
                  key={branch.value}
                  href={`/dashboard/${branch.value}`}
                  className="rounded-md border bg-background px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
                >
                  {branch.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
