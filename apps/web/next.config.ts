import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vivah/shared', '@vivah/ui'],
};

export default nextConfig;
