"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { SEMESTERS } from "@/lib/constants";
import type { PdfListItem } from "@/lib/data/pdfs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function PdfSidebar({ pdfs, isAdmin }: { pdfs: PdfListItem[]; isAdmin: boolean }) {
  const [search, setSearch] = useState("");
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const params = useParams<{ id?: string }>();
  const activeId = params.id ? Number(params.id) : null;

  const filtered = useMemo(() => {
    let list = pdfs;
    if (isAdmin && semesterFilter !== "all") {
      list = list.filter((p) => p.semester === semesterFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.title.toLowerCase().includes(q));
    return list;
  }, [pdfs, search, semesterFilter, isAdmin]);

  return (
    <aside className="flex h-full flex-col border-r bg-muted/30 md:w-[280px] md:shrink-0" aria-label="Notes list">
      <div className="border-b px-4 py-3 text-sm font-semibold">📚 Course Notes</div>

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

      {isAdmin && (
        <div className="border-b p-3">
          <label htmlFor="semester-filter" className="sr-only">
            Filter by semester
          </label>
          <Select value={semesterFilter} onValueChange={(value) => setSemesterFilter(value ?? "all")}>
            <SelectTrigger id="semester-filter" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2" role="list">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {search ? "No notes match your search." : "No notes available yet."}
          </div>
        ) : (
          filtered.map((pdf) => (
            <Link
              key={pdf.id}
              href={`/dashboard/${pdf.id}`}
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
                {pdf.semester} · {formatDate(pdf.uploadDate)}
              </div>
            </Link>
          ))
        )}
      </div>
    </aside>
  );
}
