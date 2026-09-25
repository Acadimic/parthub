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
};

module.exports = nextConfig;
