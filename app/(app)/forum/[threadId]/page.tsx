import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getThreadForUser } from "@/lib/data/forum";
import { DeleteThreadButton } from "@/components/forum/delete-thread-button";
import { ReplyItem } from "@/components/forum/reply-item";
import { ReplyForm } from "@/components/forum/reply-form";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function ThreadDetailPage({ params }: { params: Promise<{ threadId: string }> }) {
  const { threadId } = await params;
  const user = await requireUser();
  const result = await getThreadForUser(threadId, user);
  if (!result) notFound();
  const { thread, replies } = result;

  const canDeleteThread = thread.userId === user.id || user.role === "admin";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href="/forum" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        ← Back to Forum
      </Link>

      <div className="mb-5 rounded-lg border bg-muted/30 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-heading text-xl font-semibold">{thread.title}</h1>
          {canDeleteThread && <DeleteThreadButton threadId={thread.id} />}
        </div>
        <div className="mb-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>👤 {thread.userName}</span>
          <span>{formatDate(thread.createdAt)}</span>
        </div>
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">{thread.content}</div>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-semibold">Replies</h3>
        {replies.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">No replies yet.</div>
        ) : (
          <ul className="flex flex-col gap-2">
            {replies.map((r) => (
              <ReplyItem key={r.id} reply={r} currentUserId={user.id} isAdmin={user.role === "admin"} />
            ))}
          </ul>
        )}
        <ReplyForm threadId={thread.id} />
      </div>
    </div>
  );
}
