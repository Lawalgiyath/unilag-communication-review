import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb",
    },
  },
  outputFileTracingIncludes: {
    "/**": ["./prisma/journal-template.db"],
  },
  poweredByHeader: false,
};

export default nextConfig;

