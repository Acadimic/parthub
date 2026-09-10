# parthhub-app

A pnpm monorepo: three Next.js apps, one NestJS server, and three shared packages.

| Workspace              | What it is                                          | Dev port |
| ---------------------- | --------------------------------------------------- | -------- |
| `apps/learning`        | Student-facing Next.js app                          | 3000     |
| `apps/teaching`        | Teacher-facing Next.js app                          | 3001     |
| `apps/support`         | Platform support Next.js app                        | 3002     |
| `apps/server`          | NestJS 12 on Fastify 5, MongoDB via Mongoose        | 9000     |
| `packages/shared`      | Enums, DTOs, interfaces — compiled, consumed as JS  | —        |
| `packages/ui`          | Shared React layer — no build, consumed as source   | —        |
| `packages/eslint-config` | The lint rules all six lintable workspaces spread | —        |

## Prerequisites

- **[Volta](https://volta.sh)** — `curl https://get.volta.sh | bash`. It reads the `volta.node`
  pin in `package.json` and gives you Node 24.21.0 in this repo automatically. Without Volta,
  install Node 24.21.0 yourself; other majors are not tested.
- **pnpm 10.12.1** — `corepack enable` picks the version out of `packageManager`.
- **MongoDB** the server can reach, local or hosted.

## Setup

```bash
git clone <repo-url> && cd parthhub-app
pnpm bootstrap
```

`bootstrap` is `pnpm install && pnpm build:shared`. The second half is not optional: every
consumer types against `packages/shared/dist/*.d.ts` rather than its source, so before that
build the server and all three apps fail with errors that read like missing modules.

Then create the environment files — they are gitignored, so a fresh clone has none:

```bash
cp apps/server/.env.example   apps/server/.env.development
cp apps/learning/.env.example apps/learning/.env
cp apps/teaching/.env.example apps/teaching/.env
cp apps/support/.env.example  apps/support/.env
```

Fill them in. On the server only `NODE_ENV` and `DB_URL` are enforced; everything else is
optional and the feature behind it degrades if unset. Each template says what its keys do.

## Running

```bash
pnpm start:server     # NestJS, loads .env.development via env-cmd
pnpm start:learning   # :3000
pnpm start:teaching   # :3001
pnpm start:support    # :3002
```

## Everyday commands

```bash
pnpm build:shared     # rerun after ANY change in packages/shared
pnpm typecheck:ui     # packages/ui has no build step
pnpm lint             # all six lintable workspaces; must exit 0
pnpm format           # Prettier

pnpm add:server <pkg> # add a dependency to one workspace, never the root
                      # also add:learning | add:teaching | add:support
pnpm install:server   # install scoped to one workspace and what it depends on
```

Adding a dependency with a bare `pnpm add` at the repo root writes it to the root manifest.
Hoisting still makes the import resolve, so nothing looks broken until an install that scopes
to a single workspace — use the `add:*` scripts.

## Troubleshooting

**Type errors naming `@repo/shared` symbols that clearly exist.** The `dist` is stale. Run
`pnpm build:shared`.

**`ERR_REQUIRE_CYCLE_MODULE` from `@angular-devkit/schematics` → `ora`,** on `nest build` or
`nest start`. Not a broken dependency — the wrong Node. The Nest CLI hits a `require()` of the
ESM-only `ora` inside a cycle, which throws on Node 22 and is fine on 24. Check `node -v`.

The floor comes from `@angular-devkit/schematics`, which the Nest CLI depends on:
`^22.22.3 || ^24.15.0 || >=26.0.0`. Node 22.14 is below it.

If `node -v` says 24.21.0 but the error persists, **check what Node your package manager runs
on** — that is the one that matters, and it can differ:

```bash
pnpm exec node -v                      # the runtime the scripts actually get
cat ~/.volta/tools/user/bins/pnpm.json # if Volta installed pnpm: platform.node
```

A Volta-installed pnpm is bound to whichever Node was the default when it was installed, and that
binding **overrides the project's `volta.node` pin, your PATH, and everything else**. If
`platform.node` is not 24.21.0, rebind it:

```bash
volta install pnpm@10.33.0             # binds pnpm to the current default Node
```

Or take Volta out of it entirely and let `packageManager` drive: `volta uninstall pnpm && corepack enable`.

As a one-off that needs no setup change:

```bash
env -u _VOLTA_TOOL_RECURSION volta run --node 24.21.0 -- pnpm start:server
```

**A dependency resolves at runtime but no workspace declares it.** Something was installed at
the repo root. Move it to the workspace that imports it.

**A broken `node_modules` tree** (dangling symlinks, a stray `package-lock.json` from an
accidental `npm install`) is fastest to fix by starting over:

```bash
find . -name node_modules -type d -prune -not -path '*/.next/*' -exec rm -rf {} +
pnpm install --frozen-lockfile && pnpm build:shared
```

## Conventions

`CLAUDE.md` documents the architecture, the package layering and the two-tier lint rules.
The per-task conventions live as skills in `.claude/skills/`; `packages/ui/README.md` covers
the component layers.
