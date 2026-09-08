---
description: >
  How to comment code in this repo. The bar is: a comment earns its place by saying something the
  code cannot. That means the constraint behind a line, the reason a safe-looking change would break
  something, or the contract of an exported shape — never a restatement of the syntax. Use this when
  writing or reviewing comments and docblocks.
when_to_use: >
  Trigger when adding, editing or reviewing comments, JSDoc or docblocks; when adding an
  `eslint-disable`, a `@ts-expect-error` or a non-obvious cast, each of which must carry a reason;
  when exporting something from packages/shared or packages/ui; and when you catch yourself about to
  write a comment that repeats the line under it.
argument-hint: '[file or area]'
---

# Write comments

## must

1. **A suppression carries its reason.** Every `eslint-disable`, `@ts-expect-error` or surprising
   cast is followed by why it is needed and what would happen otherwise. Repo rule, not taste:

   ```ts
   // The constraint must be `any[]`: `unknown[]` makes no concrete callback assignable to T.
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
   ```

2. **Never leave commented-out code.** Delete it. Git remembers, a comment block does not say
   whether it is a plan, a fallback or a leftover.
3. **Do not describe what the next line does.** `// set the name` above `self.name = name` is
   noise; it makes a file longer without making it clearer.
4. **A comment that is now wrong is worse than none.** If you change a line, read the comment above
   it. A stale comment misleads a reader who trusts it.

## should

**Comment the constraint, not the mechanics.** The valuable comments in this codebase all answer
"why is it written this way, and what breaks otherwise":

```ts
// org in the filter so an upsert cannot reach another organization's document
{ _id, org },
```

```ts
// The handlers below run after render, where the early return no longer narrows the ref.
const getApi = () => calendarRef.current?.getApi();
```

**Give an exported contract a docblock** that says what it is for and what the caller must know —
the invariant, the direction of the data, the failure mode. This is worth the space in
`packages/shared` and `packages/ui`, because the caller is in another workspace and will not read
the implementation:

```ts
/**
 * Ownership fields present on every entity's response.
 *
 * They are declared once here and inherited by each entity's DTO, so a single class serves both
 * directions. On a write they are ignored: the change-tracking plugin fills `org`, `createdBy` and
 * `updatedBy` from the request context and Mongoose owns the timestamps, so a value sent by a
 * client is stripped or overwritten rather than trusted.
 */
```

**Say when a list is load-bearing.** A constant that other code depends on gets a comment
explaining what to do when it changes — as `CLIENT_ONLY_KEYS` does: adding the field to the schema
and the DTO means removing it from the list.

**Prefer a name over a comment.** If a comment is needed to explain what a variable holds, rename
the variable. Comments are for what a name cannot carry.

**Match the density of the file you are in.** A shadcn primitive in `packages/ui/src/ui/` is
generated and carries none; a Mongoose plugin or an access guard carries several. Do not add a
docblock to every arrow function in a screen because a shared DTO has one.

**Write prose, in full sentences, in the third person.** No `TODO(me)`, no first-person notes, no
issue-tracker shorthand. A comment is read by someone who has never met you.

## The test

Before keeping a comment, ask: *if I delete this, does a competent reader lose information they
cannot recover from the code?* If no, delete it. If yes, make sure it says the thing that would
have been lost — usually a constraint, a consequence, or a decision and its alternative.
