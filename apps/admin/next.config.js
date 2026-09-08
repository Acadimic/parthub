/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared', '@repo/ui'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

module.exports = nextConfig;
