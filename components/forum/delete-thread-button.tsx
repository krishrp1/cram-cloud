"use client";

import { deleteThreadAction } from "@/lib/actions/forum";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";

export function DeleteThreadButton({ threadId }: { threadId: number }) {
  return (
    <ConfirmDeleteButton
      confirmText="Delete this thread and all its replies?"
      pendingText="Deleting…"
      action={() => deleteThreadAction(String(threadId))}
    >
      Delete Thread
    </ConfirmDeleteButton>
  );
}
