"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { createThreadAction } from "@/lib/actions/forum";
import { IDLE_STATE } from "@/lib/action-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function NewThreadToggle() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createThreadAction, IDLE_STATE);

  return (
    <div>
      <Button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="new-thread-form"
        className="bg-cta text-cta-foreground hover:bg-cta/90"
      >
        <Plus className="size-4" aria-hidden />
        New Thread
      </Button>

      {open && (
        <div id="new-thread-form" className="bg-card ring-foreground/10 mt-4 rounded-xl p-5 ring-1">
          <h3 className="mb-3 text-sm font-semibold">Create New Thread</h3>
          {state.status === "error" && (
            <Alert variant="destructive" className="mb-3">
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="thread-title">Title</Label>
              <Input id="thread-title" name="title" placeholder="Thread title..." required maxLength={255} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="thread-content">Content</Label>
              <Textarea
                id="thread-content"
                name="content"
                placeholder="Write your post..."
                rows={5}
                required
                maxLength={10000}
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={pending}>
                {pending ? "Posting…" : "Post Thread"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
