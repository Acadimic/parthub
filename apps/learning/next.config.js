/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/shared', '@repo/ui'],
  experimental: {
    optimizePackageImports: ['@phosphor-icons/react'],
  },
  // `next dev` writes AGENTS.md and CLAUDE.md into this workspace on every boot; the repo keeps its
  // agent instructions at the root, so the generated pair is noise in `git status`.
  agentRules: false,
  async redirects() {
    return [
      // `/profile` was an unreferenced stub next to the real page under account settings.
      { source: '/profile', destination: '/account-settings/profile', permanent: false },
    ];
  },
  // With API_SERVER_URL set at build time, `/api/*` is proxied to the server, so
  // NEXT_PUBLIC_BASE_URL can be `/api` and the browser never calls another origin.
  async rewrites() {
    const target = process.env.API_SERVER_URL;
    return target ? [{ source: '/api/:path*', destination: `${target.replace(/\/$/, '')}/:path*` }] : [];
  },
};

module.exports = nextConfig;
