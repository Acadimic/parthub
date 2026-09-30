/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared', '@repo/ui'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  // With API_SERVER_URL set at build time, `/api/*` is proxied to the server, so
  // NEXT_PUBLIC_BASE_URL can be `/api` and the browser never calls another origin.
  async rewrites() {
    const target = process.env.API_SERVER_URL;
    return target ? [{ source: '/api/:path*', destination: `${target.replace(/\/$/, '')}/:path*` }] : [];
  },
};

module.exports = nextConfig;
