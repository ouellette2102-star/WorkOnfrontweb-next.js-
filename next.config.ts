import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode for better development warnings
  reactStrictMode: true,

  // React compiler (experimental)
  reactCompiler: true,

  // Logging configuration
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === "development",
    },
  },

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
