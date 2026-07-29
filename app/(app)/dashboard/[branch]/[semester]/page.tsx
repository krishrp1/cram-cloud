import { FileText } from "lucide-react";

export const metadata = { title: "Dashboard — Cram Cloud" };

export default function BranchSemesterEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="bg-accent flex size-14 items-center justify-center rounded-full">
        <FileText className="text-accent-foreground size-6" aria-hidden />
      </span>
      <p className="text-muted-foreground">Select a note from the list to preview it here.</p>
    </div>
  );
}
