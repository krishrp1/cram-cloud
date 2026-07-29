import type { NextConfig } from "next";

// Only the file-serving route redirects cross-origin (to a signed Supabase
// Storage URL, loaded in an <iframe>) — every other request stays same-origin.
const supabaseHost = process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).host : "";
const isDev = process.env.NODE_ENV === "development";

// Nonce-based script-src (Next's stricter option) forces every page into
// dynamic rendering — not worth that trade here since there's no XSS sink
// in this app to begin with (no dangerouslySetInnerHTML, all user content
// goes through JSX's default escaping). 'unsafe-inline' is required
// because Next.js injects its own inline hydration/RSC-payload scripts;
// this is Next's own documented default CSP shape for apps not using
// per-request nonces. 'unsafe-eval' only in dev — React uses eval there
// to reconstruct server error stacks in the browser, never in production.
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  `frame-src 'self'${supabaseHost ? ` https://${supabaseHost}` : ""}`,
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB request body cap — matches the
      // original API's MAX_CONTENT_LENGTH (50MB) for PDF uploads via
      // uploadPdfAction. A little headroom over 50MB for multipart
      // boundary/field overhead per Next's own sizing guidance.
      bodySizeLimit: "52mb",
    },
  },
  // The Express backend this replaced set these via middleware — carrying
  // them forward, since Next.js doesn't set any of them by default.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Content-Security-Policy", value: CSP },
        ],
      },
    ];
  },
};

export default nextConfig;
