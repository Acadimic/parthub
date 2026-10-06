# Teacher dashboard: slim lists, full documents on open

Status: **phases 1–3 and the bug fixes done on dev, uncommitted** (2026-10-06). Results in §9. Scope: the teaching app (`apps/teaching`) and the
server routes it reads. Nothing here changes the learning or support apps.

## 1. What the dashboard loads today

Measured on dev, organization `manish97521` (531 lessons, 475 test papers, 22 courses).

| Route | Called from | Rows | Size today | Without heavy fields |
| --- | --- | --- | --- | --- |
| `GET material/all` | `/home`, `/study-materials`, AI material drawer | 531 | **30.8 MB** (`content` is 30.3 MB) | **≈ 0.2 MB** |
| `POST material/standards/all` | `/courses/[id]`, AI course drawers | per standard | same shape, full bodies | same ratio |
| `POST material/standard/subject/all` | `/study-materials/[standard]/[subject]` | per subject | full bodies (Spanish: 84 lessons) | same ratio |
| `GET test-paper/all` | `/home`, `/test-papers`, `/courses/[id]` | 475 | 342 KB (`instruction` 47 KB) | ≈ 290 KB |
| `GET course/all` | `/home`, `/courses`, `/orders` | 22 | 101 KB | smaller without `outline`/`outcomes`/`prerequisites` |
| `GET meet/all`, `batch/all`, `chapter/all`, `user/all`, `order/all`, mappings | various | small | ≤ 22 KB each | — |

`material/all` alone took over 5 minutes from a laptop against Atlas and timed out a 300 s client
twice (`question/all`, for comparison: 15.8 MB, 4,960 rows, 188 s).
Every other list is small. **The work is materials; everything else is tidying.**

Facts the design rests on:

- No list query has a projection, a limit or pagination. Every mapper spreads the lean document,
  so a `.select()` shrinks the response with no mapper change, as long as it keeps `_id`, `org`,
  `createdBy` and `updatedBy` (`database/base.transform.ts:33` reads them unguarded).
- The single reads already exist: `GET material/:id`, `GET course/:id`, `GET test-paper/:id`.
  `MaterialService.getByIds` exists; no route exposes it.
- Upserts are `findOneAndUpdate({ _id, org }, { ...payload })`: **a field the client leaves out is
  kept**. A slim row posted back cannot erase `content`. What can erase it is a client that opens
  the editor on a slim row and saves the empty editor.
- Every store `add*` replaces the row by id (`{ ...map, ...keyById(rows) }`). Today a list load
  that runs after a full load silently swaps full rows for whatever the list sent.
- The learning app defines `material/*all`, `test-paper/all`, `question/all` and `course/all`
  loaders but never calls them, so trimming these routes affects only the teaching app.

## 2. The rule

1. **List routes return list rows**: a projection that drops the heavy fields no list screen reads.
2. **Opening a row fetches the full document** (`GET x/:id`, or a new `POST x/ids` for several).
3. **Stores merge, never replace**, and remember which rows are full. A client-only flag
   (`isFull`, stripped from requests like `isNew`) says so; a slim load can no longer downgrade a
   full row.
4. **Anything that reads or edits a heavy field awaits `ensure…(id)` first**, and the editor stays
   disabled until the full row is in.

One DTO per entity stays: `content` and `attachments` are already optional on `MaterialDto`, so a
list row is a `MaterialDto` without them. No second class.

## 3. Phase 1: materials (the 30 MB)

**Server** (`apps/server/src/modules/material`)

- `material/all`, `material/standard/subject/all`, `material/standards/all`: `.select('-content')`.
  Keep `attachments` (281 KB across all 531 lessons). The study-material header counts them, the
  course stats count their videos, and the course review checks their links, so dropping them
  would only move the cost into a second fetch.
- New `POST material/ids` with a DTO class `{ ids: string[] }` (`@IsMongoId({ each: true })`,
  capped at 100), returning full documents through the existing `getByIds`.
  `@Permissions(VIEW_MATERIAL)`, `@Subdomains(TEACH)`, org-scoped.

**Teaching app** (`material.store.ts` and the call sites)

- `addMaterials` merges into the existing row; a row from `material/:id` or `material/ids` is
  marked `isFull`.
- New `loadMaterialsByIds(ids)` (skips rows already full) and `ensureMaterial(id)`.
- Call sites that need the body, from the screen map:

| Where | Today | Change |
| --- | --- | --- |
| `MaterialCard` expand (`StudyMaterialView`) | reads `content` from the list row | `ensureMaterial` on expand, skeleton until in |
| `UpsertMaterialModal` | opens on the store row, saves it | `ensureMaterial` on open; editor and Save disabled until full |
| `GenerateMaterialModal` | patches `content`, appends `attachments` | `ensureMaterial` first |
| `material-repair.hook.ts:13` | `if (!material.content) return 0` | load the paper's lessons by ids first |
| `CourseModuleView` (module drawer preview) | renders bodies from `material/standards/all` rows | `loadMaterialsByIds(module.materials)` on open |
| `AiWholeMaterialDrawer.tsx:262` | calls `loadMaterialStats` again, unguarded | guard with `shouldLoad`; with merging it is harmless either way |

Expected effect: `/home` and `/study-materials` fetch about 0.2 MB of lessons instead of 31 MB;
a subject page fetches its lesson list without bodies and each body on demand.

**Deploy order matters.** Ship the teaching app first (it copes with both full and slim rows),
then the server projection. The other order puts an old editor in front of slim rows.

## 4. Phase 2: trims on the other lists

Small wins, same pattern, no new routes:

- `test-paper/all`: drop `instruction` (no teaching list or detail reads it from the row; the
  editor works from `sections-with-questions`). Keep `sections`: the detail page decides which
  sections to show from it, and section saves rebuild it from the row.
- `course/all`: drop `outline`, `outcomes`, `prerequisites` (written at creation, never read by the
  teaching UI; the public catalogue already drops them with `CATALOGUE_EXCLUDED_FIELDS`).
- Course modules, meets, batches, chapters, users, orders: leave as they are. `pending` on a
  module is read by the module card; the rest are already small.

## 5. Phase 3: fetches that repeat on every visit

Not payload size, but the same symptom (slow screens, repeated downloads):

- `/courses/[id]` reloads `test-paper/all`, `meet/all` and the standard's lessons on every visit
  (`Course.tsx:170-173`); `/test-papers/[id]` reloads chapters; `/batches` and `/orders` reload
  on every mount. Guard with `shouldLoad` / `useLoadOnce`, as `/courses` and `/test-papers` do.
- Split request keys shared by two loaders (`materials` for both standard-subject and standards
  loads; `chapters` for both chapter loads), so one finishing does not mark the other loaded.

## 6. Bugs found on the way (separate, small)

1. **Editing a course from the Courses table zeroes its stats.** `UpsertCourseModal.tsx:162`
   recalculates stats on save, and on `/courses` the course's modules and lessons are not loaded,
   so modules, tests, videos and durations are saved as 0. Fix: recalculate only where the
   modules are loaded (the course page already does it after module and session edits).
2. **`GET plan/:id` reads any organization's plan**: `plan.service.ts:65` is a bare `findById`
   with no `org` and no `_deleted` filter. Security fix.
3. **Students and Collaborators pages never load users**: `loadUsers` and
   `loadStudentStandardMappings` run only from Retry or after a save, so the tables (and attendee
   and batch member names) are empty on a fresh visit.
4. `GET subject/:id` has no `_deleted` filter (minor).

## 7. Not doing now

- **Pagination.** With bodies gone the largest list is about 0.3 MB for 475 rows; paging would
  change every table's client-side filter, sort and search for little gain. Revisit past a few
  thousand rows per organization.
- **Server-side material roll-ups** (`/home` and `/study-materials` only need counts per standard
  and subject). The slim list already gets them under 0.2 MB, and the client roll-up updates
  without a refetch.
- `question/all` returns 16.9 MB on dev but nothing calls it; leave it, or remove the dead
  loaders, in a later tidy-up.

## 8. Verification

- `verify-changes` ladder: `build:shared`, typecheck server, teaching, learning, lint, build.
- Re-measure every route above with the same script; record before and after here.
- Browser run on dev as a teacher: open a subject, expand a lesson, edit and save it, then confirm
  in the database that `content` and `attachments` are intact; generate a lesson; repair
  equations; open a course module preview; run the course review; edit a course from the table
  and confirm its stats are unchanged.
- Production: deploy the teaching app, then the server; repeat the size check against prod.

## 9. Results (dev, 2026-10-06)

| Route | Before | After |
| --- | --- | --- |
| `GET material/all` | timed out after 300 s (≈ 31 MB) | 571 KB, 8.7 s from a laptop to Atlas (611 lessons) |
| `POST material/standard/subject/all` (Spanish C1–C2) | full bodies | 63 KB for 84 lessons; one opened lesson is 51 KB via `material/ids` |
| `POST material/standards/all` (Astrophysics course page) | several MB | 145 KB |
| `GET course/all` | 101 KB | 49 KB |
| `GET test-paper/all` | 342 KB | 341 KB (the instructions were mostly empty, as expected) |

Checked in the browser as the dev teacher: a lesson expands with one batched fetch; the editor
opened from a collapsed card shows "Loading content…" with Save disabled, then the full body; saving
it unchanged leaves `content` and all attachments byte-identical; Home, Study Materials, a course
page and Test Papers load with no page errors.

Done beyond the plan:
- **Free plans could not be saved**: the course form treated an amount of 0 as missing, so no course
  with a free plan (every course on dev and production) could be edited. 0 now means free.
- **`chapters` request key**: a subject page's chapter load marked the key loaded, so the AI drawers
  skipped loading the organization's chapters. `loadOrgChapters` now has its own `orgChapters` key.
- The course page always reads its course by id (merged into the store), since the course review
  reads the syllabus arrays the list now omits.

Found, not fixed:
- **Only 2 of 611 lessons have a chapter**, and the lesson form requires one, so almost no imported
  lesson can be saved from the teaching app until a chapter is picked.
- `AiWholeMaterialDrawer.tsx:262` reloads `material/all` after an import on purpose (new rows); now
  cheap, left as is. Orders still reload on every visit, deliberately (payments arrive from outside).
- Production builds were not run while the dev servers were up (they share `.next` and `dist`).

### Indexes (checked 2026-10-06, `index-with-mongodb` scripts on dev)

Every changed query is served by an existing index, with keys and documents examined equal to rows
returned: `material/all` → `{ org, _deleted }` (611 rows, 3 ms); `material/standard/subject/all` →
`{ org, standard, subject, order }` (84, 1 ms); `material/standards/all` → same index plus an
in-memory sort of 252 slim rows (7 ms); `material/ids`, `plan/:id`, `subject/:id` → `_id`;
`course/all` → `{ org, _deleted }` plus a sort of 22 rows. No index added.

Unrelated defects the report showed, left for a separate change (each needs a duplicate check and a
production `sync-indexes`): `studentstandardmappings { student, standard, org }` and
`users { uid, org }` are unique without `partialFilterExpression: { _deleted: false }`.
