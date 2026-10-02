# Course transfer

Copies one course and everything it owns from one database to another server: dev to production.
The design and its reasons are in `.claude/plans/COURSE_TRANSFER.md`. The `course-transfer` agent
(`.claude/agents/course-transfer.md`) runs these steps for a course id or name.

```bash
# 1. Export from dev (read-only) into data/courses/<course slug>/
volta run node tools/course-transfer/export.mjs --course "<id or name>"

# 2. See what would be sent, then import (unpublished), then publish after review
volta run node tools/course-transfer/import.mjs --from data/courses/<slug> --session-start 2026-10-01T17:00+05:30 --dry-run
volta run node tools/course-transfer/import.mjs --from data/courses/<slug> --session-start 2026-10-01T17:00+05:30
volta run node tools/course-transfer/import.mjs --from data/courses/<slug> --publish
```

## Export

Reads the source database with `DB_URL` from `apps/server/.env.development` (`--env` for another
file), and downloads uploaded attachments from S3 with the same file's AWS keys. It writes
`manifest.json`, `course.json` (course and plans), `modules.json`, `materials.json`,
`test-papers.json` (each paper with its sections and questions), `meets.json`, `chapters.json`,
and `files/`. Ownership fields and `__v` are dropped. `_id`s are kept.

## Import

Signs in as a teacher (Firebase email and password) and writes through the API, so the server
stamps its own organization and user and validates every document. The settings come from
`data/courses/target.env`, which is gitignored with the rest of `data/`. Create it yourself:

```
COURSE_TRANSFER_BASE=https://test-gcp-950860815875.us-central1.run.app
COURSE_TRANSFER_EMAIL=<teacher email>
COURSE_TRANSFER_PASSWORD=<password>
COURSE_TRANSFER_FIREBASE_KEY=<the production web API key, NEXT_PUBLIC_FIREBASE_API_KEY>
# COURSE_TRANSFER_ORG=<org id>, only when the teacher belongs to more than one
```

- **Uploaded files** are uploaded again into the target organization's folder, and each
  attachment's `url` is rewritten to the new address. Link attachments stay as they are.
  Pictures inside lesson and question content (image nodes whose `src` is a dev bucket address)
  are exported once each to `files/content/`, uploaded into the target organization's `content/`
  folder, and every image node is pointed at the new address before the rows are written.
- **Sessions:** the exported meets are replaced by one weekly meet on `--session-days` (default
  `1,2,3,4,5`, where 0 is Sunday) from `--session-start`. The meet id, its start and the uploaded
  addresses are kept in the folder's `import-state.json`, so a rerun updates the same meet rather
  than creating another one.
- **Batches:** lessons are sent in batches under 800 KB, because the server accepts Fastify's
  default 1 MiB body.
- **Read-back:** fetches the course, plans, days, lessons, quizzes, questions and meet, and fails
  if any exported id is missing or the cover is not the new address.
