/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared', '@repo/ui'],
  // Next exposes only NEXT_PUBLIC_* to the browser on its own; this inlines the server's address at
  // build time so the same name serves the browser and the Next server.
  env: { API_SERVER_URL: process.env.API_SERVER_URL },
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
};

module.exports = nextConfig;
