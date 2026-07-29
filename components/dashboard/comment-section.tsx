"use client";

import { useActionState, useEffect, useRef } from "react";
import { postCommentAction } from "@/lib/actions/comments";
import { IDLE_STATE } from "@/lib/action-state";
import type { CommentItem } from "@/lib/data/comments";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function CommentSection({ pdfId, comments }: { pdfId: number; comments: CommentItem[] }) {
  const action = postCommentAction.bind(null, String(pdfId));
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <div className="border-t">
      <div className="max-h-[40vh] overflow-y-auto p-4">
        <h3 className="mb-3 text-sm font-semibold">Comments</h3>
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No comments yet. Start the discussion!</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {comments.map((c) => (
              <li key={c.id} className="border-b pb-3 last:border-b-0">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-primary">{c.userName}</span>
                  <span className="text-muted-foreground">{timeAgo(c.createdAt)}</span>
                </div>
                <div className="text-sm whitespace-pre-wrap break-words">{c.text}</div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {state.status === "error" && (
        <div className="px-4">
          <Alert variant="destructive" className="mb-2">
            <AlertDescription>{state.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <form ref={formRef} action={formAction} className="flex gap-2 border-t p-3">
        <label htmlFor="comment-text" className="sr-only">
          Add a comment
        </label>
        <Textarea
          id="comment-text"
          name="text"
          placeholder="Add a comment..."
          required
          maxLength={2000}
          className="min-h-10 flex-1 resize-y"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending}
          className="bg-cta text-cta-foreground hover:bg-cta/90"
        >
          {pending ? "Posting…" : "Post"}
        </Button>
      </form>
    </div>
  );
}
