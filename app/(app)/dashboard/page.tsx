export const metadata = { title: "Dashboard — Cram Cloud" };

export default function DashboardEmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <div aria-hidden className="text-4xl opacity-50">
        📄
      </div>
      <p>Select a note from the list to preview it here.</p>
    </div>
  );
}
