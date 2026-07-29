import { NextResponse } from "next/server";
import { pruneRateLimitHits } from "@/lib/rate-limit";

// Vercel Cron signs its own requests to this path with a bearer token
// matching CRON_SECRET — this route must reject anything else, otherwise
// it's a public, unauthenticated way to hammer the database.
export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await pruneRateLimitHits();
  return NextResponse.json({ deleted });
}
