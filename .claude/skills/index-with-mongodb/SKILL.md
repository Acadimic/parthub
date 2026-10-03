---
description: >
  Design, check and ship MongoDB indexes for apps/server: derive an index from the query that will
  use it (equality, sort, range), keep `org` and `_deleted` in the right places, avoid the indexes
  that cost every write and serve no read, prove the planner uses the index with explain, and roll
  an index change out through `sync-indexes` without a uniqueness gap. Ships two read-only scripts —
  an index report and an explain runner.
when_to_use: >
  Trigger before adding, changing or removing an `XSchema.index(...)`, `unique`, `index: true` or
  TTL option; when a new query filters or sorts on a field no index starts with; when a list
  endpoint, a lookup in a guard or anything per-request feels slow; when a collection grows fast
  (logs, results, events); before running `GET sync-indexes` against production; and when asked
  "what indexes should we have". Use `query-with-mongoose` for how a query is written; this skill is
  how it is served.
argument-hint: '[the collection or query]'
---

# Index with MongoDB

An index is designed **from a query**, never from a schema. Start with the filter and sort the
service actually sends, then build the index that answers it. `query-with-mongoose` owns the shape of
the query (org first, `_deleted: { $ne: true }`, `.lean()`); this skill owns what serves it.

## must

1. **Every index comes from a named query.** Write the call site next to the index as its comment:
   `// MaterialService.getMaterials: { org, chapter, _deleted } sorted by order`. An index nobody can
   trace to a query cannot be safely dropped later, and every index is paid for on every insert,
   update and delete of that collection.

2. **Order keys equality → sort → range (the ESR rule).**
   - **Equality** fields first: `org`, a parent id, a status, `_deleted`.
   - **Sort** fields next, in the same order and direction the query sorts (or all reversed).
   - **Range** fields last: `$gt`/`$lt`, `$in` with many values, `$ne`, `$regex`.

   `{ org: 1, chapter: 1, order: 1 }` serves `find({ org, chapter }).sort({ order: 1 })` from the index
   alone; `{ org: 1, order: 1, chapter: 1 }` makes Mongo read every row of the org to filter by
   chapter.

3. **`org` leads every index on an org-owned collection**, because every query on one filters by it
   (`query-with-mongoose` rule 1). Platform collections (`Standard`, `Subject`,
   `StandardSubjectMapping`, `Org`) and caller-scoped ones (`createdBy`, `follower`) lead with what
   their queries filter by instead.

4. **Every unique index is partial on live rows**: `partialFilterExpression: { _deleted: false }`,
   plus `<field>: { $exists: true }` for an optional key. Without it a soft-deleted row keeps its
   value reserved and re-creating it fails with E11000. A plain `unique: true` is a defect, not a
   style choice.

5. **A query-serving index is never partial.** Reads filter `_deleted: { $ne: true }`, and the
   planner only uses a partial index when the query _implies_ its filter — `$ne: true` does not
   imply `_deleted: false`. Put `_deleted` in the key instead (`{ org: 1, _deleted: 1 }`); the
   explain script shows `$ne` costs one extra key per scan, not a collection scan.

6. **Prove it with explain before calling it done.** Run the query through
   `scripts/explain.mjs` (below). The plan must show `IXSCAN` on the index you meant, and `keys` and
   `documents` should both be close to `returned`. `COLLSCAN`, or `documents` far above
   `returned`, means the index does not fit the query. `SORT` in the plan means the sort is done in
   memory — fine for twenty rows, not for a list that grows.

7. **A new unique index is checked for duplicates first.** Building it fails on existing duplicates,
   and `sync-indexes` will have dropped the old index by then. Group by the key over live rows
   (`$match: { _deleted: false }`, `$group`, `$match: { count: { $gt: 1 } }`) and clean up before
   shipping.

8. **Never hand-build an index in Atlas or a shell.** `sync-indexes` drops every index a schema does
   not declare. If it is worth having, it is worth declaring.

## should

- **Prefer one compound index over several single-field ones.** `{ email: 1 }` is redundant next to
  `{ email: 1, org: 1 }`: any prefix of a compound index is served by it. Drop the shorter one.
- **Watch the write side.** A collection written on every request (the activity log) pays for each
  index on every write anywhere in the app. Keep its index count to what is actually read.
- **Logs and other append-only rows get a TTL index** (`{ createdAt: 1 }, { expireAfterSeconds }`)
  so they stop growing, unless something requires keeping them forever. A TTL index must be on a
  single date field.
- **`$regex` only uses an index when it is anchored and case-sensitive** (`/^abc/`). For
  case-insensitive lookups store a normalised field (`slug`, lowercased email) and index that. For
  real search, Atlas Search, not an index.
- **`$in` is equality for a handful of values** and a range for many. `getXByIds(ids)` on `_id` is
  always fine; on another field, put the `$in` field after the true equality fields.
- **`skip` pagination reads and throws away every skipped row.** For a list that grows, page on
  the sort key instead (`{ order: { $gt: lastOrder } }`) and index it.
- **A covered query reads no documents at all**: project only indexed fields
  (`.select('org order _id')`) and `documents` drops to 0. Worth it for hot existence checks and
  id lists, not as a habit.
- **Small collections do not need more than the convention.** Under a few thousand rows a scan is
  cheap; the cost of an index is on writes and RAM. Index for the collections that grow:
  questions, materials, results, enrollments, logs.

## Shipping an index change

1. Declare it on the schema, with the query comment (must 1).
2. Check it on dev: start the server (new indexes build at startup with `autoIndex`), then run
   `explain.mjs` on the real query.
3. For a **changed or removed** index, run `GET sync-indexes` on dev (`@Private()`: send `api-key`,
   `app`, `timezone` and `timezone-offset`). It reports what it dropped and built.
4. Production: ask before running `sync-indexes` there. It drops before it builds, so a changed
   unique index briefly enforces nothing, and a build on a large collection is real work on the
   primary. Run it when traffic is low, after the deploy that declares the index.

## The scripts

Both are read-only and need `DB_URL`, so run them through `env-cmd` from `apps/server`:

```bash
cd apps/server

# Collections: count, data size, average document, every index with its options, and usage
# counts where the user may read $indexStats ("?" means not permitted, not unused).
npx env-cmd -f .env.development node ../../.claude/skills/index-with-mongodb/scripts/index-report.mjs [collection...]

# One query: winning plan, keys and documents examined. Filter and sort are Extended JSON.
npx env-cmd -f .env.development node ../../.claude/skills/index-with-mongodb/scripts/explain.mjs \
  questions '{"org":{"$oid":"<orgId>"},"section":{"$oid":"<id>"},"_deleted":{"$ne":true}}' '{"order":1}'
```

Point them at production only with a read-only user, and never paste its `DB_URL` into a chat.

## Where indexes live

```
apps/server/src/modules/<domain>/<domain>.schema.ts      XSchema.index(...) at the bottom
apps/server/src/modules/<domain>/schemas/*.schema.ts     the same, for a module's second collection
apps/server/src/database/index-sync.service.ts           what GET sync-indexes drops and builds
```

## Related skills

- `query-with-mongoose` — how the query is written: org, `_deleted`, `.lean()`, the plugins
- `add-server-module` — creating the schema the index goes on
- `verify-changes` — the build and lint ladder before committing
