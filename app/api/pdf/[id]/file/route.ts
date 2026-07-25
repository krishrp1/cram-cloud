import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getPdfRowForUser } from "@/lib/data/pdfs";
import { downloadPdf } from "@/lib/storage";

// The one Route Handler in the app — binary PDF bytes can't come back from
// a Server Component or Server Action. getPdfRowForUser() re-applies the
// same semester-scoping check as everywhere else.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const pdf = await getPdfRowForUser(id, user);
  if (!pdf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let buffer: Buffer;
  try {
    buffer = await downloadPdf(pdf.filename);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${pdf.filename}"`,
    },
  });
}
