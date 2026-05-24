import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    domains: ['logo.clearbit.com', 'storage.googleapis.com'],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
};

export default nextConfig;
