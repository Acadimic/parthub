# syntax=docker/dockerfile:1
# Builds apps/server for Cloud Run. Context is the repo root; the image carries the server, its
# production dependencies and the compiled @repo/shared it resolves through dist/.
FROM node:24-bookworm-slim AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable && corepack prepare pnpm@10.12.1 --activate
WORKDIR /repo
# Every workspace manifest, so the lockfile matches the workspace graph under --frozen-lockfile.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/learning/package.json apps/learning/
COPY apps/teaching/package.json apps/teaching/
COPY apps/support/package.json apps/support/
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY packages/eslint-config/package.json packages/eslint-config/

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --filter @repo/server...
COPY packages/shared packages/shared
COPY apps/server apps/server
RUN pnpm --filter @repo/shared build && pnpm --filter @repo/server build

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --prod --filter @repo/server...

FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=prod-deps /repo/node_modules ./node_modules
COPY --from=prod-deps /repo/apps/server/node_modules ./apps/server/node_modules
COPY --from=prod-deps /repo/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared/package.json packages/shared/
COPY --from=build /repo/packages/shared/dist packages/shared/dist
COPY apps/server/package.json apps/server/
COPY --from=build /repo/apps/server/dist apps/server/dist
USER node
EXPOSE 8080
CMD ["node", "apps/server/dist/main.js"]
