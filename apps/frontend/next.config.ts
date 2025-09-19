import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/graphql',
        destination: 'http://localhost:3001/graphql',
      },
    ];
  },
};

export default nextConfig;
