import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://starkedge.proofhub.com/api/v3/:path*',
      },
    ];
  },
};

export default nextConfig;
