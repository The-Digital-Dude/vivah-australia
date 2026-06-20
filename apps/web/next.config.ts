import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vivah/shared', '@vivah/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: '*.cloudinary.com' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
};

export default nextConfig;
