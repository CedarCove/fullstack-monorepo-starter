/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@grasp/api', '@grasp/database'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
