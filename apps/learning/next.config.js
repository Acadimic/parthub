/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@parthhub/shared'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

module.exports = nextConfig;
