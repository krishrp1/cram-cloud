import Link from "next/link";
import { requireUser } from "@/lib/auth/dal";
import { listThreadsForUser } from "@/lib/data/forum";
import { NewThreadToggle } from "@/components/forum/new-thread-toggle";

export const metadata = { title: "Forum — NoteShare" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await requireUser();
  const { page } = await searchParams;
  const currentPage = Math.max(parseInt(page ?? "1", 10) || 1, 1);

  const { threads, pages, currentPage: safePage } = await listThreadsForUser(user, currentPage, 10);

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">🗨️ Community Forum</h1>
          <p className="text-sm text-muted-foreground">{user.semester} discussions</p>
        </div>
        <NewThreadToggle />
      </div>

      {threads.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No threads yet. Start the conversation!
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {threads.map((t) => (
            <li key={t.id} role="listitem">
              <Link
                href={`/forum/${t.id}`}
                className="block rounded-lg border bg-muted/30 p-4 transition-all hover:-translate-y-px hover:border-primary hover:shadow-sm"
              >
                <h3 className="mb-2 text-base font-semibold">{t.title}</h3>
                <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{t.content}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>👤 {t.userName}</span>
                  <span>💬 {t.replyCount} replies</span>
                  <span>{formatDate(t.createdAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          {safePage > 1 && (
            <Link href={`/forum?page=${safePage - 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              ← Prev
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            Page {safePage} of {pages}
          </span>
          {safePage < pages && (
            <Link href={`/forum?page=${safePage + 1}`} className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
