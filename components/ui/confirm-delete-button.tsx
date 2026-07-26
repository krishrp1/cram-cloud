"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import type { ActionState } from "@/lib/action-state";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

// Shared logic behind every "confirm, then run a delete Server Action"
// button in the app — was independently reimplemented (useTransition +
// window.confirm + bound action call) in 4 different components.
// ConfirmDeleteButton below covers the common case; use this hook directly
// when a button needs custom styling ConfirmDeleteButton doesn't offer
// (e.g. reply-item.tsx's inline text-link actions).
export function useConfirmDelete(action: () => void | Promise<ActionState | void>, confirmText: string) {
  const [pending, startTransition] = useTransition();
  const run = () => {
    if (!confirm(confirmText)) return;
    startTransition(async () => {
      const result = await action();
      if (result && result.status === "error") alert(result.message);
    });
  };
  return [pending, run] as const;
}

export function ConfirmDeleteButton({
  action,
  confirmText,
  pendingText = "Deleting…",
  size = "sm",
  variant = "destructive",
  className,
  children = "Delete",
}: {
  // May return an ActionState — if it resolves to {status: "error"}, the
  // message is surfaced via alert() (matches this app's existing use of
  // native confirm() rather than a toast system).
  action: () => void | Promise<ActionState | void>;
  confirmText: string;
  pendingText?: string;
  size?: VariantProps<typeof buttonVariants>["size"];
  variant?: VariantProps<typeof buttonVariants>["variant"];
  className?: string;
  children?: React.ReactNode;
}) {
  const [pending, run] = useConfirmDelete(action, confirmText);

  return (
    <Button type="button" size={size} variant={variant} className={className} disabled={pending} onClick={run}>
      {pending ? pendingText : children}
    </Button>
  );
}
