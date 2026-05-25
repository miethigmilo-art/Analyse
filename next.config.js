/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma', 'ioredis', 'openai'],
  images: {
    domains: ['logo.clearbit.com'],
  },
};

module.exports = nextConfig;
