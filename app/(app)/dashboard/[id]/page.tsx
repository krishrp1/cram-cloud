import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/dal";
import { getPdfForUser } from "@/lib/data/pdfs";
import { listCommentsForPdf } from "@/lib/data/comments";
import { CommentSection } from "@/components/dashboard/comment-section";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function PdfDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const pdf = await getPdfForUser(id, user);
  if (!pdf) notFound();

  const comments = await listCommentsForPdf(pdf.id);
  const fileUrl = `/api/pdf/${pdf.id}/file`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b p-4">
        <div>
          <h2 className="font-heading text-lg font-semibold">{pdf.title}</h2>
          <div className="text-sm text-muted-foreground">
            {pdf.semester} · Uploaded by {pdf.uploadedBy} · {formatDate(pdf.uploadDate)}
          </div>
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener"
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Open in new tab
        </a>
      </div>

      <div className="flex-1 overflow-hidden">
        <iframe src={fileUrl} title={pdf.title} className="h-full w-full border-none" />
      </div>

      <CommentSection pdfId={pdf.id} comments={comments} />
    </div>
  );
}
