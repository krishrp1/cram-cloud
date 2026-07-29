"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { uploadPdfAction } from "@/lib/actions/pdf";
import { IDLE_STATE } from "@/lib/action-state";
import { SEMESTERS, DEPARTMENT_GROUPS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function UploadForm() {
  const [state, formAction, pending] = useActionState(uploadPdfAction, IDLE_STATE);
  const [fileName, setFileName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // "Adjusting state during render" rather than in an effect (see
  // https://react.dev/learn/you-might-not-need-an-effect) — clears the
  // filename label the instant a success is observed, without the extra
  // render + cascading-setState-in-effect the lint rule flags.
  const [lastHandledState, setLastHandledState] = useState(state);
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.status === "success") setFileName("");
  }

  // The native file input reset is a DOM action, not state — legitimate
  // effect use (syncing with an external system), and calls no setState
  // itself so it doesn't trigger the cascading-render lint rule.
  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <div>
      {state.status === "error" && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}
      {state.status === "success" && (
        <Alert className="mb-4">
          <AlertDescription>Upload successful.</AlertDescription>
        </Alert>
      )}

      <form ref={formRef} action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pdf-title">Title</Label>
          <Input id="pdf-title" name="title" placeholder="e.g. Data Structures - Lecture 3" required maxLength={255} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pdf-branch">Branch</Label>
          <Select name="branch" required>
            <SelectTrigger id="pdf-branch" className="w-full">
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              {DEPARTMENT_GROUPS.map((dept) => (
                <SelectGroup key={dept.name}>
                  <SelectLabel>{dept.name}</SelectLabel>
                  {dept.branches.map((branch) => (
                    <SelectItem key={branch.value} value={branch.value}>
                      {branch.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pdf-semester">Semester</Label>
          <Select name="semester" required>
            <SelectTrigger id="pdf-semester" className="w-full">
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {SEMESTERS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="pdf-file">PDF File</Label>
          <div
            className={cn(
              "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragOver ? "border-primary bg-muted" : "border-border"
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const file = e.dataTransfer.files[0];
              if (file && file.type === "application/pdf" && fileInputRef.current) {
                const dt = new DataTransfer();
                dt.items.add(file);
                fileInputRef.current.files = dt.files;
                setFileName(file.name);
              }
            }}
          >
            <input
              ref={fileInputRef}
              id="pdf-file"
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              required
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full cursor-pointer"
              aria-label="Click to select a PDF file, or drag and drop"
            >
              <div aria-hidden className="text-muted-foreground mb-2 flex justify-center">
                <FileText className="size-9" />
              </div>
              <p className="mb-2 text-sm">Click to select PDF or drag &amp; drop</p>
              {fileName && <span className="block text-sm font-semibold text-primary">{fileName}</span>}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="bg-cta text-cta-foreground hover:bg-cta/90"
        >
          {pending ? "Uploading…" : "Upload PDF"}
        </Button>
      </form>
    </div>
  );
}
