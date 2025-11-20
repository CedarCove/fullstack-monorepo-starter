/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/api', '@repo/database'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
