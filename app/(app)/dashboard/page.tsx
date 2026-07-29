import Link from "next/link";
import {
  BookOpen,
  Building2,
  Cog,
  FlaskConical,
  Radio,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { countPdfsByBranch } from "@/lib/data/pdfs";
import { DEPARTMENT_GROUPS } from "@/lib/constants";

export const metadata = { title: "Dashboard — Cram Cloud" };

const DEPARTMENT_ICONS: Record<string, LucideIcon> = {
  CSE: BookOpen,
  AI: Sparkles,
  ECE: Radio,
  Civil: Building2,
  Mechanical: Cog,
  Biotech: FlaskConical,
};

function displayName(email: string): string {
  const local = email.split("@")[0] ?? email;
  const first = local.split(".")[0] ?? local;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const counts = await countPdfsByBranch();

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Welcome back, {displayName(user.email)}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a department to browse notes, or head to the forum to see what your batch is
          discussing.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {DEPARTMENT_GROUPS.map((dept) => {
          const Icon = DEPARTMENT_ICONS[dept.name] ?? BookOpen;
          const deptCount = dept.branches.reduce((sum, b) => sum + (counts[b.value] ?? 0), 0);

          return (
            <div key={dept.name} className="bg-card ring-foreground/10 rounded-xl p-5 ring-1">
              <div className="mb-3 flex items-center gap-2.5">
                <span className="bg-accent flex size-9 items-center justify-center rounded-full">
                  <Icon className="text-accent-foreground size-4.5" aria-hidden />
                </span>
                <div>
                  <div className="text-sm font-semibold">{dept.name}</div>
                  <div className="text-muted-foreground text-xs">
                    {deptCount} {deptCount === 1 ? "note" : "notes"} available
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {dept.branches.map((branch) => (
                  <Link
                    key={branch.value}
                    href={`/dashboard/${branch.value}`}
                    className="bg-background hover:bg-accent hover:text-accent-foreground rounded-lg px-3 py-1.5 text-sm font-medium ring-1 ring-foreground/10 transition-colors"
                  >
                    {branch.label}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
