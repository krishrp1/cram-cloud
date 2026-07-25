import "server-only";
import { createClient } from "@supabase/supabase-js";

// Service-role client: server-side only, bypasses bucket RLS. The bucket
// itself is kept private — access control is enforced by the app (semester
// scoping in lib/data/pdfs.ts and the file-serving route), not by the
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

export async function downloadPdf(key: string): Promise<Buffer> {
  const { data, error } = await bucket().download(key);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deletePdf(key: string): Promise<void> {
  const { error } = await bucket().remove([key]);
  if (error) throw error;
}
