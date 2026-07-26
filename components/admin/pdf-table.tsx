"use client";

import { deletePdfAction } from "@/lib/actions/pdf";
import { branchLabel } from "@/lib/constants";
import type { PdfListItem } from "@/lib/data/pdfs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDeleteButton } from "@/components/ui/confirm-delete-button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
          <TableHead>Branch</TableHead>
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
              <Badge variant="secondary">{branchLabel(pdf.branch)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="secondary">{pdf.semester}</Badge>
            </TableCell>
            <TableCell>{pdf.uploadedBy}</TableCell>
            <TableCell>{formatDate(pdf.uploadDate)}</TableCell>
            <TableCell>
              <ConfirmDeleteButton
                confirmText="Delete this PDF? Notes with existing comments can't be deleted until those comments are removed."
                action={() => deletePdfAction(String(pdf.id))}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
