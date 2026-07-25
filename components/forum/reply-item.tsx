"use client";

import { useActionState, useState, useTransition } from "react";
import { deleteReplyAction, editReplyAction } from "@/lib/actions/forum";
import { IDLE_STATE } from "@/lib/action-state";
import type { ReplyItem as ReplyItemType } from "@/lib/data/forum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ReplyItem({
  reply,
  currentUserId,
  isAdmin,
}: {
  reply: ReplyItemType;
  currentUserId: number;
  isAdmin: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [deletePending, startDeleteTransition] = useTransition();
  const editAction = editReplyAction.bind(null, String(reply.id));
  const [state, formAction, editPending] = useActionState(editAction, IDLE_STATE);

  const isOwner = reply.userId === currentUserId;
  const canDelete = isOwner || isAdmin;

  if (state.status === "success" && editing) {
    setEditing(false);
  }

  return (
    <li className="rounded-md border bg-muted/30 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-primary">{reply.userName}</span>
        <span className="text-muted-foreground">{formatDate(reply.createdAt)}</span>
      </div>

      {editing ? (
        <form action={formAction} className="flex flex-col gap-2">
          {state.status === "error" && (
            <Alert variant="destructive">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <Textarea name="content" defaultValue={reply.content} required maxLength={10000} className="min-h-20" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={editPending}>
              {editPending ? "Saving…" : "Save"}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="text-sm whitespace-pre-wrap break-words">{reply.content}</div>
          {(isOwner || canDelete) && (
            <div className="mt-2 flex gap-3">
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  Edit
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={deletePending}
                  onClick={() => {
                    if (!confirm("Delete this reply?")) return;
                    startDeleteTransition(() => {
                      deleteReplyAction(String(reply.id));
                    });
                  }}
                  className="text-xs font-semibold text-muted-foreground hover:text-foreground hover:underline"
                >
                  {deletePending ? "Deleting…" : "Delete"}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </li>
  );
}
