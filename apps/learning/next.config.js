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
  // A cached course page is served stale for at most an hour before it is rebuilt in the request,
  // so a course nobody visited for two days never hands a crawler an expired signed cover URL.
  expireTime: 3600,
  async redirects() {
    return [
      // `/profile` was an unreferenced stub next to the real page under account settings.
      { source: '/profile', destination: '/account-settings/profile', permanent: false },
    ];
  },
  // The browser calls `/api` on its own origin; API_SERVER_URL stays server-side, read at build time.
  async rewrites() {
    const target = process.env.API_SERVER_URL.replace(/\/$/, '');
    return [{ source: '/api/:path*', destination: `${target}/:path*` }];
  },
};

module.exports = nextConfig;
