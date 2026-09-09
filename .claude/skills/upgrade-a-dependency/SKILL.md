---
description: >
  Upgrade a dependency across this monorepo without leaving a half-migrated tree: establish a green
  baseline, move locked version sets together, then walk the verification ladder so each class of
  breakage is caught by the step that can see it. Includes how to read a failure, how to roll back
  cleanly, the codemod discipline that a blind find-and-replace gets wrong, and the repo's current
  upgrade backlog with the hazard each one carries.
when_to_use: >
  Trigger before changing any version in a package.json, before `pnpm update`, when a dependency
  deprecation warning appears, when asked to "update the packages" or take a security fix, and when
  a version bump has already broken the build and you need a route out. Use `extend-a-package` for
  where a dependency belongs and which versions are pinned together.
argument-hint: '[the dependency, or "audit"]'
---

# Upgrade a dependency

Six lintable workspaces, three of them Next apps sharing exact pins, one server, two libraries. An
upgrade is rarely one manifest edit, and `pnpm update -r` across a major is how a whole afternoon
disappears.

## must

1. **Establish the baseline before touching anything.** Record that the tree is green — all six
   typechecks at 0, `pnpm lint` exit 0, all five builds — and that `git status` is clean. Without
   that, the first failure is unattributable and you will be bisecting your own edits.

2. **One dependency, or one locked set, per change and per commit.** A commit that bumps Mongoose
   and Next together cannot be reverted usefully. See the locked sets in must #4.

3. **Read the release notes for the target version first.** Do not migrate from memory of the API —
   these libraries change faster than anyone's recall, and a wrong assumption here costs more than
   the ten minutes of reading. Note the majors you are crossing: 8 → 12 is three sets of breaking
   changes, not one.

4. **Move a locked set together, in the same commit.**
   - `react`, `react-dom`, `@types/react`, `@types/react-dom`, `next` — in all three apps **and**
     `packages/ui`'s `peerDependencies` and `devDependencies`. Then prove there is one copy:
     `ls node_modules/.pnpm | grep -E '^react@'` must print exactly one version.
   - `@nestjs/*` — common, core, platform-fastify, mongoose, config, cli, schematics — plus
     `nestjs-cls` and `nestjs-pino`, which track the Nest major.
   - `mongoose` with `@nestjs/mongoose`.
   - `class-validator`, `class-transformer` and `reflect-metadata`: the decorators, the transformer
     that reads them and the polyfill that stores the metadata are one unit.
   - `eslint` with `@typescript-eslint/*`. (`eslint-config-next` is gone — see the note below.)
   - `fastify` **tracks whatever `@nestjs/platform-fastify` depends on, exactly**, not npm's latest.
     The adapter pins a precise version; a caret here resolves a different patch and the plugin
     types stop matching the adapter's, so `app.register(compression)` fails to typecheck.
   - `@types/node` **tracks the Node major in `volta.node`**, never npm's latest. Types ahead of the
     runtime describe APIs that are not there: it compiles, then fails.
   - `zustand` on its own: it has no companion packages, and `packages/ui` deliberately does not
     depend on it (the request hooks type the store structurally).

5. **`skipLibCheck: true` is set in all six tsconfigs.** Library type breakages are therefore
   invisible until your own code touches them. A green typecheck after an upgrade is necessary and
   nowhere near sufficient — the build and a runtime smoke test are what find the rest.

6. **Never hand-edit `pnpm-lock.yaml`.** To roll back:
   `git checkout -- '**/package.json' pnpm-lock.yaml && pnpm install`. To confirm a landed upgrade
   is internally consistent: `pnpm install --frozen-lockfile`.

7. **Do not leave a half-migrated tree.** Either the upgrade lands green, or it is reverted and the
   reason recorded: pin the version, comment why, and note what blocked it. A repo where
   `pnpm lint` or a build is red is a repo where the next person cannot tell their breakage from
   yours.

## The verification ladder

Each rung catches a class of failure the one above cannot see. Walk it in order and stop at the
first failure — later rungs will only produce noise.

Run all of it on the **pinned** runtime. Claude Code is itself installed through Volta, so a plain
`node`/`pnpm` in its session reports the Node running Claude Code, not `volta.node`. Wrap every
command:

```bash
env -u _VOLTA_TOOL_RECURSION volta run --node 24.20.0 -- pnpm exec tsc --noEmit
```

```bash
pnpm install                                     # resolution: peer conflicts, duplicate instances
ls node_modules/.pnpm | grep -E '^react@'        # exactly one React, always
pnpm build:shared                                # if shared or its deps moved
# typecheck each affected workspace — the fastest signal, and it names the API that changed
pnpm lint                                        # renamed or removed lint rules, new defaults
pnpm build:server && pnpm build:teaching         # bundler, plugin and config-schema breaks
cd apps/server && node -e "require('./dist/app.module.js')"   # decorators, DI, import cycles
```

`next build` prerenders, so it executes module-level code — that is the closest thing to a runtime
test this repo has. There is no test suite, so finish with a manual pass over one screen the
dependency actually drives.

## The server needs more than a build

Loading the compiled graph proves the decorators evaluate and the DI wiring resolves. It touches
**no database, no Fastify plugin and no middleware** — `main.ts` registers compression, helmet, the
global pipe, `TransformInterceptor`, `HttpExceptionFilter` and CORS at bootstrap, and none of that
runs until the process listens. So after any server-side upgrade, run it:

```bash
pnpm start:server                     # env-cmd -f .env.development nest start --watch
curl -s localhost:9000/health         # `@Public()`; returns OK only if Mongoose actually connected
curl -s localhost:9000/               # `@Public()`; proves the pipeline serves a response
```

Then, with a real token from one of the apps, exercise the parts an upgrade silently breaks:

1. **One write.** Confirm the change-tracking plugin still stamped `org`, `createdBy` and
   `updatedBy` — a Mongoose major can change which hooks fire for `findOneAndUpdate`, `insertMany`
   and `bulkWrite`, and the plugin is attached to all of them.
2. **One read.** Confirm soft-deleted rows are still filtered.
3. **One 404.** Confirm the error shape is still `{ error: { code, message } }` and that a success
   is still wrapped as `{ data }` — those come from the filter and the interceptor, not from your
   controllers.
4. **One rejected body.** Post an unknown property and confirm it still 400s, which is what proves
   `whitelist` / `forbidNonWhitelisted` survived a `class-validator` bump.

### The decorator-metadata hazard

This is the backend break that a green typecheck will not warn you about. The server compiles with
`experimentalDecorators: true` and `emitDecoratorMetadata: true`, and both NestJS dependency
injection and class-validator read that emitted metadata through `reflect-metadata` at runtime. A
TypeScript major that changes decorator emit therefore breaks DI and request validation **at
runtime while everything still compiles**. It is why TypeScript goes last and why its upgrade ends
with the smoke run above rather than a build.

The TypeScript 5 to 6 upgrade proved the point twice over. Decorator emit itself survived — DI and
validation both still work — but `esModuleInterop` can no longer be switched off in 6, and its
`__importStar` helper copies only own enumerable properties. `import * as sgMail from '@sendgrid/mail'`
therefore produced an object missing `setApiKey` and `send`, which live on the module's prototype.
tsc, eslint and `nest build` were all green while the server could not start. A default import
fixes it; check for `import * as` of any CommonJS package before upgrading TypeScript.

### The `dist` trap

`nest-cli.json` sets `deleteOutDir: true`, while the tsconfig is `incremental` with
`tsBuildInfoFile: ./dist/.tsbuildinfo` — the build deletes the directory holding its own
incremental state. That combination has already produced a phantom `Cannot find module
'dist/main'` in this repo. After an upgrade that changes the compiler or the Nest CLI, delete
`dist` and rebuild before believing any error it reports.

## Reading a failure

| What you see                                    | What it usually is                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| Type error in **your** code                     | The real migration work. Fix the call site, do not cast it away.          |
| Type error inside `node_modules`                | A type-version mismatch (`@types/react` against a different React). `skipLibCheck` normally hides these, so one that surfaces is on a path you import. |
| `unmet peer dependency` warning                 | Usually not a breakage. This repo already has one: `react-fast-scroll-pdf` in `apps/learning` wants React 18 and gets 19. |
| A lint rule "does not exist"                    | Renamed, not removed. Check the plugin changelog before deleting the rule. |
| Two copies of a library at runtime, broken hooks | A locked set moved out of step — see must #4.                            |
| A Tailwind class silently stops working         | The palette plugin or the config schema, not your class. See `style-with-tailwind`. |
| Build passes, screen is blank                   | A default export or entry point moved. Check the release notes for renamed exports. |
| Server compiles, then DI or validation fails at runtime | Decorator metadata. See the hazard above — suspect the TypeScript or `reflect-metadata` version, not your module. |
| `Cannot find module 'dist/main'`                | Stale `dist`. Delete it and rebuild; see the `dist` trap above.        |
| `X.someMethod is not a function` at boot, after a TypeScript upgrade | `import * as X` from a CommonJS package. TypeScript 6 forces `esModuleInterop` on, and its `__importStar` copies only own enumerable properties — methods on the module's prototype vanish. Use a default import. |
| `eslint --fix` crashes while `eslint` is fine   | A rule's *fixer* is incompatible with the TypeScript version. Ours: `no-unnecessary-type-assertion` dies inside TS 6. Keep that rule at zero reports and `lint:fix` stays usable. |
| A stale `.tsbuildinfo` inventing a dependency conflict | `tsc --noEmit` replays a previous resolution. `rm -rf dist` before believing any resolution error. |

## Renames and codemods

When an upgrade renames exports, **rename by import specifier and let the compiler find the call
sites.** Do not run a text replacement over the source.

This repo has the scar: renaming the deprecated Phosphor icons (`CaretDown` → `CaretDownIcon`) with
a blind find-and-replace also rewrote user-visible strings, turning "Copy Link" into
"CopyIcon Link" in two files. The safe order is:

1. Change the import list only.
2. Let `tsc` list every call site, and fix those.
3. Before committing, grep the diff for the old token inside JSX text and string literals —
   the compiler cannot see those.

## The current backlog

The backend batch landed on 2026-09-08 and is done. **Re-run `pnpm outdated -r` rather than
trusting any list here.**

Already on their latest: NestJS 12.0.1 (core, common, platform-fastify, mongoose, config, cli,
schematics), Mongoose 9.9.5, firebase-admin 14.3.0, class-validator 0.15.1, the pino stack
(10.3.1 / 11 / 5.1.0 / 13.1.3), nestjs-cls 6.3, `@fastify/compress` 9.2, `@fastify/helmet` 13.1,
AWS SDK 3.1127, env-cmd 11, ESLint 10.10, prettier 3.9.6, typescript-eslint 8.70, TypeScript 6.0.3.
Node is pinned to 24.20.0 LTS via Volta.

**Held back on purpose** — each waits on someone else's release, so re-check before "fixing" one:

| Held | At | Blocked by |
| ---- | -- | ---------- |
| `fastify` | 5.12.1 | `@nestjs/platform-fastify@12.0.1` depends on that exact version |
| `@types/node` | 24.x | the Node 24 LTS runtime |
| `typescript` | 6.0.3 | `@typescript-eslint@8.70` peers `typescript <6.1.0`, and there is no 9.x |
| `eslint-plugin-react` | removed | its latest release still peers `eslint ^9.7` |

**Frontend, still pending**, in a sensible order:

| Upgrade | Hazard |
| ------- | ------ |
| `react` 19.0.0-rc → 19.2.x with `@types/react` 18 → 19 | Removes both the RC pin and the types mismatch. One commit, five manifests, then check `ls node_modules/.pnpm \| grep -E '^react@'` prints one version. |
| `next` 15 → 16 | Pages Router behaviour. `next lint` is already out of the path, so that part is done. |
| `zustand` 5 → 6, when it lands | The stores are the apps' spine. Check `useShallow`'s import path and whether `getInitialState` is still the SSR snapshot — the request hooks in `@repo/ui/hooks` rely on both. |
| `tailwindcss` 3 → 4 | Config moves into CSS. **Check `tw-colors` compatibility before starting** — the whole palette comes from that plugin. |
| `@fullcalendar/*` 6 → 7 | Teaching only, isolated to the calendar module. |

## Upgrading Node itself

Pinned through Volta, which writes it into the root `package.json`:

```bash
volta install node@<version> && volta pin node@<version>
```

Take the latest **LTS**, not the newest release — a server is the wrong place for the Current line.
Then move `@types/node` to the matching major, force a reinstall so native modules rebuild for the
new ABI (`pnpm install --force`), and walk the whole ladder. Node's floor is what gates several
upgrades: NestJS 12's CLI wants 22.22.3+, 24.15+ or 26+, Mongoose 9 wants 20.19+, firebase-admin 14
wants 22+, and ESLint 10 wants 20.19+/22.13+/24+.

## Worth doing before any UI upgrade

Each app declares 23–24 UI dependencies it does not import — the Radix packages, `cmdk`,
`lucide-react`, `clsx`, `tailwind-merge`, `class-variance-authority`, `randomcolor`,
`bson-objectid` — left over from before the primitives moved into `packages/ui`. They are why
`pnpm outdated` lists every Radix package as a dependency of all four workspaces, and why a Radix
bump currently looks like a four-manifest change instead of a one-manifest change. Removing them
(`bson-objectid` stays in `apps/server` and `packages/ui`, which do import it) makes every future
UI upgrade smaller. Verify with a build, since a genuinely-used package would fail to resolve.
