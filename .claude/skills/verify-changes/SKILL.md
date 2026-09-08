---
description: >
  The verification sequence for this monorepo, in the order that actually catches things: build
  packages/shared first if it changed, then typecheck each affected workspace, then lint, then
  build. Six workspaces with two ESLint generations, one package consumed as source and one as
  compiled output, so "it compiled" in one place proves nothing about the next. Use this before
  reporting any change complete, and before asking to commit.
when_to_use: >
  Trigger when a code change is finished and before saying it works; after editing packages/shared
  or packages/ui, whose consumers break elsewhere; before any git commit; and when a typecheck or
  build fails in a way that looks stale.
argument-hint: '[what changed]'
---

# Verify changes

## must

1. **`pnpm build:shared` first, if `packages/shared` changed.** The server and the apps read its
   compiled `dist`, so until it is rebuilt every consumer typechecks against the old shape and the
   errors you see are fiction.
2. **Typecheck every workspace that consumes what you touched**, not only the one you edited:
   - changed `packages/shared` → all six
   - changed `packages/ui` → `pnpm typecheck:ui` **and** at least one app, because the package has
     no build step and is compiled by its consumers
   - changed one app or the server → that workspace
3. **`pnpm lint` must exit 0.** Errors are defects: `no-explicit-any` and the
   `no-restricted-imports` layer rules. Warnings are the "should" tier and do not fail — but do not
   add new ones to a file you are editing.
4. **Report what you actually ran.** If a build was not run, say so. Never describe a change as
   verified on the strength of a typecheck alone.
5. **Ask before committing.** Present the diff and wait, even when everything is green.

## The sequence

```bash
pnpm build:shared                              # only if packages/shared changed
pnpm typecheck:ui                              # only if packages/ui changed

pnpm --filter @repo/teaching exec tsc --noEmit  # per affected workspace
pnpm --filter @repo/learning exec tsc --noEmit
pnpm --filter @repo/admin    exec tsc --noEmit
pnpm --filter @repo/server   exec tsc --noEmit
pnpm --filter @repo/shared   exec tsc --noEmit

pnpm lint                                      # all six; must exit 0
pnpm build:server                              # nest build
pnpm build:teaching                            # next build also runs page-level code
```

`pnpm --filter <workspace> lint:fix` applies the autofixable rules. `pnpm lint` never rewrites
files.

## should

- Run the build for any app you changed. `next build` prerenders, so it executes module-level code
  that a typecheck never runs.
- Prove a claim with the check that would have caught it being false. For a rule change, ask ESLint
  what it resolved (`eslint --print-config <file>`) rather than assuming the config was picked up.
  For a new lint rule, plant a violation, confirm it fails, and delete the probe.
- For a large mechanical diff, filter it to the lines that are *not* the mechanical change and read
  those. `git diff -U0 | grep '^[+-]' | grep -v <the expected pattern>` turns 400 files into a
  handful of lines to check by hand.
- After the server's compiled output changes, `node -e "require('./dist/app.module.js')"` from
  `apps/server` loads the whole module graph and evaluates every decorator without needing a
  database.
- Check `git status` before committing for files you did not mean to touch — a stray `--fix`,
  a Prettier run over a wider glob than intended, or a deletion you did not notice.

## There are no tests

This repo has no test suite: no `test` script, no spec files. Typecheck, lint and build are the
whole safety net, which is why the order above matters and why runtime behaviour has to be stated
as unverified when it is.
