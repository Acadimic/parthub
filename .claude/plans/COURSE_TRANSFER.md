# Course transfer: dev → production

Copy one course, with everything it owns, from the dev database to production. The first course is
**Spanish for Beginners: The Magic Key Method** (`6ab7e10f2663a77295f78b78`). Spanish Intermediate,
Spanish Advanced and the Astrophysics course go through the same steps later.

The work happens in two steps with JSON files between them. An **export** reads dev and writes a
folder under `data/courses/`. An **import** reads that folder and writes to production. Dev and
production are never connected at the same time. You can review the folder before anything is
written, and a failed import can simply be run again.

Status (2026-10-01): export and import written and dry-run against production. The
`course-transfer` agent (`.claude/agents/course-transfer.md`) runs them for a course id or name.
Usage is in `tools/course-transfer/README.md`.

## What is copied

| Collection           | Why it is included                                                          |
| -------------------- | --------------------------------------------------------------------------- |
| `courses`            | the course itself, including the cover in `attachments[]`                   |
| `plans`              | pricing, linked through `plan.courses`                                      |
| `coursemodules`      | the 60 days, their `materials[]`, `testPapers[]`, `meets[]` and `pending[]` |
| `materials`          | 84 lessons, including any file `attachments[]`                              |
| `testpapers`         | 24 quizzes                                                                  |
| `testpapersections`  | the sections and subsections of those quizzes                               |
| `questions`          | every question in those sections                                            |
| `meets`              | replaced by one weekly meet (decision 2); the 12 dev labs give its agenda   |
| `chapters`           | only the chapters a material or question points at                          |

**Left behind:** learner and commerce data (enrollments, orders, coupons, completed modules, test
results, bookmarks, reactions, product and batch mappings), batches, activity logs, and the course
agent's run file. Dev learners are test accounts.

**Already in production:** standards and subjects, which have the same `_id`s in both databases
(imported from `data/support/` on 2026-09-30). Their references need no remapping.

## Rules the import has to respect

- **Every document keeps its dev `_id`.** Every upsert route filters on `{ _id, org }` with
  `upsert: true`, so a client-supplied id becomes the stored id (for example
  `course.service.ts:128`, `material.service.ts:41`, `question.service.ts:50`). The same `_id`s on
  a rerun make the import idempotent.
- **Ownership comes from production, never from the export.** The change-tracking plugin writes
  `org`, `createdBy` and `updatedBy` from the caller and strips them from any payload
  (`database/plugins/change-tracking.plugin.ts:137-200`). The export drops all six base fields and
  `__v`: `forbidNonWhitelisted` rejects unknown keys with a 400.
- **Everything the course contains must be in the course's org.** Materials, test papers, sections,
  questions and plans are all read under `course.org`, so a child in another org silently
  disappears. Importing as one teacher satisfies this.
- **Files must be moved, not just referenced.** A dev address
  (`…/acadimic-dev/orgs/<devOrg>/<entity>/<object>`) does not resolve in production:
  `resolveKey` re-roots it under the production prefix and org, which gives a key that does not
  exist. Each file is uploaded again into `acadimic/orgs/<prodOrg>/<entity>/<object>`, and `url` is
  rewritten to the address the presign returns, minus its query string, as
  `data/support/README.md` does for logos. `key` stays as it is. Rich text has no image node, so
  the only files are the `attachments[]` on the course and the materials.
- **Unique indexes to watch:** `CourseModule {course, day}`,
  `Material {standard, subject, chapter, order, org}`, `Chapter {name, standard, subject, org}` and
  `Meet.meetingId`. The production org holds no courses yet, so none should collide. The importer
  reuses a production chapter whose name already exists and remaps to it.
- **Values computed on the server:** `TestPaper.totalQuestions` and `maxMarks` are recomputed when
  questions go through the API. `Course.stats` is copied as it is.

## The folder

```
data/courses/<course slug>/           (gitignored, like the rest of data/)
  manifest.json      source course id, export time, a count per collection, the file list
  course.json        the course with its plans
  modules.json
  materials.json
  test-papers.json   papers with their sections, subsections and questions, grouped per paper
  meets.json
  chapters.json
  files/<entity id>/<object id>   every S3 object an attachment points at, plus its content type
```

The scripts are reused for every later course, so they go in `tools/course-transfer/`
(`export.mjs`, `import.mjs`, `README.md`), which is committed. Only the output goes in `data/`.

## Steps

### 1. Export (read-only against dev)

`node tools/course-transfer/export.mjs --course <id or name>`

- Reads dev directly through the MongoDB driver using `DB_URL` from `apps/server/.env.development`.
  Reads bypass no plugin, and the driver sees fields no API returns (`pending`, section trees),
  so this is the simplest complete read.
- Collects the course, walks its modules to find the material, test paper and meet ids, then
  follows sections → subsections → questions and the chapter references.
- Skips any document with `_deleted: true`, strips the base fields and `__v`. The 12 dev meets
  are exported only for their titles (decision 2).
- Downloads every attachment through `common/presigned-GET-urls`, or with `aws s3 cp` from the
  `speechcake` bucket.
- Writes `manifest.json` with the counts. For this course, expect 60 modules, 84 materials,
  24 test papers and 12 lab titles.

**Check:** read the manifest, spot-check a lesson and a quiz in the JSON, and confirm no file under
`files/` is empty.

### 2. Import (writes to production through the API, as a production teacher)

`node tools/course-transfer/import.mjs --from data/courses/<slug> --session-start 2026-10-01T17:00+05:30 [--dry-run] [--publish]`

The server address and teacher login come from `data/courses/target.env`.

The session is a production teacher login with the `organization` header, the same way the course
agent's CLI signs in (`tools/course-agent/cli.mjs:99-106`). The course routes are teacher-only;
none of them is `@Private()`. The import calls the routes the CLI already uses, in dependency order:

1. `common/presigned-PUT-urls`: upload each file and rewrite `url`.
2. `chapter/upsert`: only for chapters production does not already have.
3. `course/upsert/course/plans`: the course and its plans, **unpublished**.
4. `material/bulk-upsert`.
5. `test-paper/section/upsert` (subsections before their parents), then `test-paper/upsert`,
   then `question/bulk-upsert`. Totals are recomputed here.
6. `meet/upsert`: the one weekly meet from decision 2.
7. `course/upsert/course/modules`, with `materials[]`, `testPapers[]`, `meets[]` and `pending[]`
   carried over unchanged.
8. Read-back: fetch `course/:id`, `course/course/modules/:id` and the module contents, and compare
   every count and id with the manifest. The run fails on any difference.

`--dry-run` prints what would be sent and makes no writes. Every write is an upsert on the dev
`_id`, so a rerun after a failure continues from where it stopped.

### 3. Review, then publish

Open the course in the teaching app against production and read one lesson, one quiz and one
session. Then publish it (`course/upsert` with `isPublished: true`) and open it in the learning app
as a learner.

## Alternative: write straight to the production database

The importer could instead write documents with the driver and set `org`, `createdBy`, `updatedBy`,
`createdAt` and `updatedAt` itself. That is one script with no teacher login, and it is faster.
It skips everything the API does: validation, the activity log, and recomputed test totals. A
mistake in the export would reach production unchecked. **Recommended: the API import above.** Use
the database route only if a production teacher login is not available.

## Decisions

1. **Owner in production:** the organization of `acadimic.app@gmail.com` at
   `https://teach.acadimic.com`. That is also the `PRIVATE_API_EMAIL` account, so the course sits
   in the same org as the standard and subject logos. The password is supplied at run time through
   an environment variable and never written to a file.
2. **Sessions: one repeating event instead of the 12 one-off meets.** In dev, the 12 speaking labs
   fall on every fifth teaching day (Mon 5 Oct, Fri 16 Oct, Wed 28 Oct, …, Wed 10 Feb), 17:00 IST,
   45 min, so the weekday rotates. The importer does not copy them. It creates one meet with
   `frequency: weekly`, `weekDays: [1, 2, 3, 4, 5]` (Monday to Friday, one session per
   teaching day), `startTime` 2026-10-01 at 17:00 IST and `durationMins: 45`, and
   titles it for the course. The description lists the twelve lab titles in order. That meet goes
   in `course.meets`. Each of the 12 modules that had a lab gets it in `meets[]`, and the `pending`
   entries' `createdId` is rewritten to it. Limits: a weekly meet has no end date (the calendar
   repeats it indefinitely, `apps/teaching/src/utils/helpers/util.ts:115-129`), and the per-lab
   titles move into the description.
3. **Plans:** the course stays free.

## Noticed while planning (separate from this work)

`getPublishedCourses` (`course.service.ts:160-166`) runs `find({})` with no `isPublished` or
`_deleted` filter, so the public `course/published` route lists every course from every org,
including drafts and deleted ones. An imported, unpublished course would appear there immediately.
Fix it before the import, or accept that the draft is briefly visible.
