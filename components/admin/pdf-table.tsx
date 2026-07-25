"use client";

import { useTransition } from "react";
import { deletePdfAction } from "@/lib/actions/pdf";
import type { PdfListItem } from "@/lib/data/pdfs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function DeleteButton({ pdfId }: { pdfId: number }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (!confirm("Delete this PDF? This will also remove all its comments.")) return;
        startTransition(() => {
          deletePdfAction(String(pdfId));
        });
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}

export function PdfTable({ pdfs }: { pdfs: PdfListItem[] }) {
  if (pdfs.length === 0) {
    return <div className="p-8 text-center text-sm text-muted-foreground">No PDFs found.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Uploaded By</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pdfs.map((pdf) => (
          <TableRow key={pdf.id}>
            <TableCell className="max-w-64 truncate">{pdf.title}</TableCell>
            <TableCell>
              <Badge variant="secondary">{pdf.semester}</Badge>
            </TableCell>
            <TableCell>{pdf.uploadedBy}</TableCell>
            <TableCell>{formatDate(pdf.uploadDate)}</TableCell>
            <TableCell>
              <DeleteButton pdfId={pdf.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
