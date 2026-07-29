import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle, MessageSquare, User } from "lucide-react";
import { requireUser } from "@/lib/auth/dal";
import { listThreadsForUser } from "@/lib/data/forum";
import { NewThreadToggle } from "@/components/forum/new-thread-toggle";

export const metadata = { title: "Forum — Cram Cloud" };

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
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <MessageCircle className="text-cta size-6" aria-hidden />
            Community Forum
          </h1>
          <p className="text-muted-foreground text-sm">{user.semester} discussions</p>
        </div>
        <NewThreadToggle />
      </div>

      {threads.length === 0 ? (
        <div className="text-muted-foreground rounded-xl border p-8 text-center text-sm">
          No threads yet. Start the conversation!
        </div>
      ) : (
        <ul role="list" className="flex flex-col gap-3">
          {threads.map((t) => (
            <li key={t.id} role="listitem">
              <Link
                href={`/forum/${t.id}`}
                className="bg-card ring-foreground/10 hover:ring-cta/40 block rounded-xl p-4 ring-1 transition-all hover:-translate-y-px hover:shadow-sm"
              >
                <h3 className="mb-2 text-base font-semibold">{t.title}</h3>
                <p className="text-muted-foreground mb-3 line-clamp-2 text-sm">{t.content}</p>
                <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <User className="size-3.5" aria-hidden />
                    {t.userName}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3.5" aria-hidden />
                    {t.replyCount} replies
                  </span>
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
            <Link
              href={`/forum?page=${safePage - 1}`}
              className="hover:bg-accent inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Prev
            </Link>
          )}
          <span className="text-muted-foreground text-sm">
            Page {safePage} of {pages}
          </span>
          {safePage < pages && (
            <Link
              href={`/forum?page=${safePage + 1}`}
              className="hover:bg-accent inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors"
            >
              Next
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
