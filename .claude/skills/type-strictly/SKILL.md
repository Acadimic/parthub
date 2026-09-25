---
description: >
  Keep the types honest: no optional parameter that stands in for a decision, no default in front of
  a required argument, no sentinel value meaning "nobody". When a value is genuinely absent
  sometimes, model the two cases as a union so the compiler makes every caller handle both, rather
  than marking a field `?` and letting `undefined` travel. Use it whenever you are about to write
  `?`, `!`, `as`, or a parameter you expect most callers to omit.
when_to_use: >
  Trigger BEFORE adding `?` to a parameter, property or DTO field; before a default value on a
  parameter; before `!`, `as`, `?? ''` or `?.` written to satisfy the compiler; and when a function
  takes a boolean that changes what it does. Also when a type says a field is always present and
  some code path knows better, or when you catch an empty string, `0` or `-1` being used to mean
  "none".
argument-hint: '[the signature or shape you are declaring]'
---

# Type strictly

The compiler only helps where the types tell the truth. Every `?` is a claim that callers may
ignore the value, and every sentinel (`''`, `0`, `-1`) is a claim the compiler cannot check at all.
This skill is about not making those claims by accident.

## must

1. **No optional parameter when its absence is a decision.**
   If omitting an argument selects different behaviour, that is a choice the caller is making —
   name it. An optional parameter cannot distinguish "I mean the other case" from "I forgot".

   ```ts
   // No: does an absent batch mean "every batch", or did this caller forget one?
   getStudents(orgId: string, batchId?: string)

   // Yes: both cases are stated, and neither is reachable by omission.
   type StudentScope = { kind: 'batch'; batchId: string } | { kind: 'all-batches' };
   getStudents(orgId: string, scope: StudentScope)
   ```

   The reverse holds too: if only one case turns out to be real, drop the union rather than keep a
   parameter no caller ever varies. `S3Service.resolveKey` briefly took a scope like the one above,
   until every upload gained an organization and `orgId: string` became the whole truth.

2. **No sentinel value standing in for absence.** `''`, `0` and `-1` are not "no value" — they are
   values the type says are fine. `new Types.ObjectId('')` throws at runtime and typechecks
   perfectly. If a request can have no organization, the context type must say so; do not put an
   empty string in a `string` field and rely on everyone remembering.

3. **No default in front of a required parameter.** `f(a: string, b = false, c: string)` compiles,
   but no caller can ever leave `b` out, so the default is a lie and the signature reads wrong.
   Required parameters first, defaulted ones last.

4. **Never satisfy the compiler with `!`, `as` or `?? ''`.** Those turn a type error into a runtime
   one. Narrow instead — `if (ctx.kind !== 'identified') throw ...` — and let the branch that cannot
   continue say so. `@typescript-eslint/no-non-null-assertion` is on for a reason; a cast needs a
   comment giving the reason (see `write-comments`).

5. **No `any`.** Already an ESLint error in all six workspaces. Take `unknown` and narrow, or
   declare the shape. The one allowed exception is a generic constraint such as
   `<T extends (...args: any[]) => void>`, with an inline disable saying why.

6. **A union beats a bag of optional fields.** Two optional properties describe four shapes, of
   which perhaps two are real. Write the two.

   ```ts
   // No: what is a context with a userId but no subdomain?
   interface IRequestContext { userId: string; orgId: string; subdomain?: Subdomain }

   // Yes: the two kinds of request this server actually serves.
   type IRequestContext =
     | { kind: 'identified'; userId: string; orgId: string; subdomain: Subdomain }
     | { kind: 'anonymous' };
   ```

## should

- **Prefer two functions to one boolean parameter** when the boolean changes what the function
  does rather than tuning it. `getOrgFiles()` / `getSharedFiles()` reads better than
  `getFiles(isShared: boolean)`, and a call site with a bare `true` in it tells the reader nothing.
- **Make a field optional only when absence has exactly one meaning** and every reader treats it the
  same way. `description?: string` is fine — nothing branches on it. `orgId?: string` was not.
- **Let the narrow type flow.** If a helper returns `T | undefined` and its one caller cannot
  continue without a `T`, put the throw in the helper and return `T`. Do not push the `undefined`
  outward for each caller to re-check.
- **Widen at the edge, not in the middle.** A DTO field the client may omit is optional at the
  boundary; the moment it is read, resolve it once into a required internal shape.
- **A defaulted parameter is still a decision** — prefer it only where every caller would pass the
  same value anyway.

## Where this repo already relies on it

- `BaseOwnedDto` marks `_id` optional for validation and required for the type, with a docblock
  explaining exactly why. That comment is the standard: an optional field that surprises someone
  earns a reason.
- The server's tsconfig sets `strict: true` with `strictPropertyInitialization` off, only so
  Mongoose schema classes and Nest DTOs can declare `@Prop() name: string` with no initializer. That
  is a scoped exception, not licence to leave fields unset elsewhere.
- A single-document Mongoose lookup returns `XDocument | null` and the caller handles the miss — a
  controller throws `NotFoundException`. That is rule 4 in practice: narrow, do not assert.

## Changing an existing optional to required

Removing a `?` moves the problem; it does not delete it. Before you do it, find what relied on the
absence:

```bash
grep -rn "getOrgIdSafe\|\.orgId" apps/server/src   # who reads it
grep -rn "@Public()" -A 6 apps/server/src/modules  # which paths genuinely have no value
```

If some code path really has no value, the field was telling the truth and the fix is a union, not
a required field with a fake value poured into it. Check the runtime path, not just `tsc` — an
empty string satisfies `string`, so the build stays green and the request throws in production.

## Verify

```bash
pnpm --filter @repo/server exec tsc --noEmit
pnpm lint
```

`tsc` passing is necessary and not sufficient here: the failure mode this skill guards against is
code that typechecks and lies. Trace one real request through the path you changed — including a
`@Public()` and a `@Private()` one, which carry the least context — before calling it done.

## Related skills

- `define-data-shape` — where a type belongs, and the enum/DTO rules it must follow.
- `write-comments` — every cast, disable and surprising optional needs its reason.
- `add-api-endpoint` — DTO validation, and why `_id` is optional on the wire but required on the type.
- `verify-changes` — the full ladder; a type change to `packages/shared` breaks other workspaces.
