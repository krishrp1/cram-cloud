"use client";

import { useTransition } from "react";
import { deleteThreadAction } from "@/lib/actions/forum";
import { Button } from "@/components/ui/button";

export function DeleteThreadButton({ threadId }: { threadId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this thread and all its replies?")) return;
        startTransition(() => {
          deleteThreadAction(String(threadId));
        });
      }}
    >
      {pending ? "Deleting…" : "Delete Thread"}
    </Button>
  );
}
