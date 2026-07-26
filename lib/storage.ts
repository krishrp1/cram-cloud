import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: server-side only, bypasses bucket RLS. The bucket
// itself is kept private — access control is enforced by the app (the
// file-serving route requires an authenticated session), not by the
// bucket's own policies, so this must never be exposed to the browser.
const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);

const bucket = () => supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || "pdfs");

export async function uploadPdf(key: string, buffer: Buffer): Promise<void> {
  const { error } = await bucket().upload(key, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw error;
}

export async function getSignedPdfUrl(key: string, expiresInSeconds = 60): Promise<string> {
  const { data, error } = await bucket().createSignedUrl(key, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function deletePdf(key: string): Promise<void> {
  const { error } = await bucket().remove([key]);
  if (error) throw error;
}
