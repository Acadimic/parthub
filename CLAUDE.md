# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Install dependencies (pnpm 10.12.1 required)
pnpm install

# Development
pnpm dev:learning        # Next.js dev server (port 3000)
pnpm dev:teaching        # Next.js dev server (port 3001)
pnpm dev:admin           # Next.js dev server (port 3002)
pnpm dev:server          # NestJS dev server (uses .env.development via env-cmd)

# Build
pnpm build:shared        # Build shared package (run first if shared types changed)
pnpm build:learning      # Build Next.js app
pnpm build:teaching      # Build Next.js teaching app
pnpm build:admin         # Build Next.js admin app
pnpm build:server        # Build NestJS app (nest build)

# Lint & Format
pnpm lint                # Run ESLint across all workspaces
pnpm format              # Prettier across all workspaces

# Single workspace commands
pnpm --filter @parthhub/learning <script>
pnpm --filter @parthhub/teaching <script>
pnpm --filter @parthhub/admin <script>
pnpm --filter @parthhub/server <script>
pnpm --filter @parthhub/shared <script>
```

## Architecture

**Monorepo** with pnpm workspaces: `apps/learning`, `apps/teaching`, `apps/admin`, `apps/server`, `packages/shared`.

### Learning (`apps/learning`) — Next.js 15 Pages Router

- **State management:** MobX State Tree. Root store in `src/stores/root.store.ts` with sub-stores (user, course, material, selector, toast). Access via `useStores()` hook. Async actions use MST `flow(function*(...) { ... })`.
- **Layouts:** Pages declare their layout via `Component.layout = Layout.AUTH | Layout.SIDEBAR | ...`. Layout components live in `src/layouts/`.
- **Component layers:** Two-layer system enforced by convention:
  - `components/ui/` — Raw shadcn primitives. **Never import these in feature code.**
  - `components/core/` — Wrappers adding label, error, consistent API. Feature code (`modules/`, `layouts/`, `pages/`) imports only from `core/`. Use the `/create-core-component` skill to create new wrappers.
- **Auth:** Firebase Authentication (email/password + Google/Microsoft OAuth). Token management and refresh in `src/utils/firebase/`.
- **HTTP:** Axios with separate auth/unauth callers in `src/services/http.service.ts`. Request interceptor adds Bearer token + permission headers.
- **Styling:** TailwindCSS 3 + MUI 6 + Emotion CSS-in-JS. Light/dark theme via `tw-colors` plugin and `ColorModeContext`.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).

### Teaching (`apps/teaching`) — Next.js 15 Pages Router

- **Purpose:** Teacher-facing app for managing courses, study materials, test papers, students, and sessions.
- **State management:** MobX State Tree (same pattern as Learning).
- **Component layers:** Same two-layer system as Learning (`components/ui/` → `components/core/` → feature code).
- **Styling:** TailwindCSS 3 + shadcn/ui + tw-colors. No MUI dependency.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).
- **Auth:** Firebase Authentication (same as Learning).

### Admin (`apps/admin`) — Next.js 15 Pages Router

- **Purpose:** Admin app for managing standards, subjects, and test papers across the platform.
- **State management:** MobX State Tree. Root store with sub-stores (standard, course, selector). Access via `useStores()` hook.
- **Component layers:** Same two-layer system (`components/ui/` → `components/core/` → feature code). UI primitives and core wrappers shared with Teaching app.
- **Styling:** TailwindCSS 3 + shadcn/ui + tw-colors. No MUI dependency.
- **Icons:** Phosphor Icons (`@phosphor-icons/react`).
- **Auth:** Firebase Authentication (same as Learning/Teaching).
- **Pages:** Home, Standards, Subjects, Test Papers, Profile, Sign In.

### Server (`apps/server`) — NestJS 10 + Fastify

- **Module structure:** One NestJS module per domain (Auth, User, Firebase, Org, Subject, Course, Material, Chapter, TestPaper, Question). Each has controller → service → Mongoose schema.
- **Database:** MongoDB via Mongoose 8. Base schemas in `src/base-schemas/`.
- **Auth:** Firebase Admin SDK validates JWTs via `passport-firebase-jwt`. Global `FirebaseAuthGuard` applied via `APP_GUARD`. Use `@Public()` decorator to exempt endpoints.
- **HTTP:** Fastify adapter with Brotli compression and Helmet. Global `ValidationPipe` with whitelist/transform.
- **Logging:** nestjs-pino with pino-pretty in dev. Authorization headers redacted.
- **Config:** `@nestjs/config` with typed `AppConfigService`.

### Shared (`packages/shared`)

Enums, DTOs, and interfaces consumed by both client and server. Compiled with `tsc` to CommonJS. **Rebuild after changes** (`pnpm build:shared`) before dependent packages can see updates.

## Path Aliases

**Learning** (`apps/learning/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Teaching** (`apps/teaching/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Admin** (`apps/admin/tsconfig.json`):
`@pages/*`, `@components/*`, `@modules/*`, `@enums`, `@utils/*`, `@interfaces`, `@services`, `@stores`, `@layouts`, `@themes`, `@styles/*`, `@hooks/*`

**Server** (`apps/server/tsconfig.json`):
`@modules/*`, `@config`, `@strategies`, `@decorators`, `@guards`, `@interfaces`, `@enums`, `@utils`, `@pipes`, `@base-schemas`, `@dtos`, `@constants`

## Code Style

- Prettier: 120 char width, single quotes, trailing commas, 2-space indent, LF line endings
- Learning ESLint: next/core-web-vitals + prettier
- Server ESLint: @typescript-eslint/recommended + prettier (loose — `noImplicitAny: false`, `strictNullChecks: false`)
