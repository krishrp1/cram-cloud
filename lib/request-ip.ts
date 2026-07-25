import "server-only";
import { headers } from "next/headers";

// Vercel sets x-forwarded-for on every request; not spoofable by the
// client since Vercel's edge overwrites it before the request reaches the
// function.
export async function getRequestIp(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return "unknown";
}
