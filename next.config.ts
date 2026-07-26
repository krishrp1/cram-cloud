import type { NextConfig } from "next";

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
        ],
      },
    ];
  },
};

export default nextConfig;
