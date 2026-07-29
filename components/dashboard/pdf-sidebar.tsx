"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen } from "lucide-react";
import { branchLabel } from "@/lib/constants";
import type { PdfListItem } from "@/lib/data/pdfs";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PdfSidebar({
  pdfs,
  branch,
  semester,
  isAdmin,
}: {
  pdfs: PdfListItem[];
  branch: string;
  semester: string;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState("");
  const params = useParams<{ id?: string }>();
  const activeId = params.id ? Number(params.id) : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pdfs;
    return pdfs.filter((p) => p.title.toLowerCase().includes(q));
  }, [pdfs, search]);

  return (
    <aside className="bg-muted/40 flex h-full flex-col border-r md:w-[280px] md:shrink-0" aria-label="Notes list">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <BookOpen className="text-cta size-4" aria-hidden />
          {branchLabel(branch)}
        </div>
        <div className="text-muted-foreground text-xs">{semester}</div>
        <div className="mt-2 flex gap-3 text-xs">
          <Link href="/dashboard" className="text-muted-foreground hover:underline">
            Departments
          </Link>
          <Link href={`/dashboard/${branch}`} className="text-muted-foreground hover:underline">
            Change semester
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-muted-foreground hover:underline">
              Upload
            </Link>
          )}
        </div>
      </div>

      <div className="border-b p-3">
        <label htmlFor="pdf-search" className="sr-only">
          Search notes by title
        </label>
        <Input
          id="pdf-search"
          type="search"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2" role="list">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {search ? "No notes match your search." : "No notes available yet."}
          </div>
        ) : (
          filtered.map((pdf) => (
            <Link
              key={pdf.id}
              href={`/dashboard/${branch}/${encodeURIComponent(semester)}/${pdf.id}`}
              role="listitem"
              className={cn(
                "mb-1 block rounded-md border border-transparent px-3 py-2 text-sm transition-colors",
                pdf.id === activeId
                  ? "bg-primary text-primary-foreground"
                  : "hover:border-border hover:bg-muted"
              )}
            >
              <div className="font-medium">{pdf.title}</div>
              <div className={cn("text-xs", pdf.id === activeId ? "opacity-75" : "text-muted-foreground")}>
                {formatDate(pdf.uploadDate)}
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
