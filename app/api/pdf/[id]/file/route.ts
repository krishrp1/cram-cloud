import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getPdfRowForUser } from "@/lib/data/pdfs";
import { getSignedPdfUrl } from "@/lib/storage";

// The one Route Handler in the app — getPdfRowForUser() re-applies the same
// semester-scoping check as everywhere else, then we redirect to a short-lived
// signed URL so large PDFs stream straight from storage instead of being
// buffered through this function (which would blow the response size limit).
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

  let signedUrl: string;
  try {
    signedUrl = await getSignedPdfUrl(pdf.filename);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.redirect(signedUrl, { status: 302 });
}
