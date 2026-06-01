import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vivah/shared', '@vivah/ui'],
  experimental: {
    externalDir: true,
  },
};

export default nextConfig;
