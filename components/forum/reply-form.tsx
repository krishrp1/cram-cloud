"use client";

import { useActionState, useEffect, useRef } from "react";
import { postReplyAction } from "@/lib/actions/forum";
import { IDLE_STATE } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ReplyForm({ threadId }: { threadId: number }) {
  const action = postReplyAction.bind(null, String(threadId));
  const [state, formAction, pending] = useActionState(action, IDLE_STATE);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-4 flex flex-col gap-3">
      {state.status === "error" && (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      <label htmlFor="reply-text" className="sr-only">
        Write a reply
      </label>
      <Textarea id="reply-text" name="content" placeholder="Write a reply..." rows={3} required maxLength={10000} />
      <Button
        type="submit"
        disabled={pending}
        className="bg-cta text-cta-foreground hover:bg-cta/90 self-start"
      >
        {pending ? "Posting…" : "Reply"}
      </Button>
    </form>
  );
}
