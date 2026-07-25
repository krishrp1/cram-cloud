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
};

export default nextConfig;
