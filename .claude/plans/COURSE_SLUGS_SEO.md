# Course slugs and search

Status: **phase 1 built, 2026-10-04**, uncommitted. Phase 2 not started.

A published course gets one public address, `/courses/<slug>`, that the share button, every
in-app link, the sitemap and Google all use. Its slug follows the course name. Old slugs are not
kept: an address whose slug no course has shows a "course not found" page.

## Decisions (Manish, 2026-10-04)

| Question                                   | Decision                                                                                        |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Address                                    | `/courses/<slug>`                                                                               |
| A published course is renamed              | The slug changes with it. Old slugs are not stored: an unknown slug shows "course not found"    |
| Two courses would get the same slug        | Refused: the save fails with the server's duplicate message, and the teacher picks another name |
| Who sets the slug                          | The teaching app, `slugify(name)` on every save of the course form (revised 2026-10-05)         |
| Server-rendering the course page's content | Later, as phase 2. Phase 1 ships addresses, structured data, sitemap and robots                 |
| Existing data and old addresses            | No backfill: existing slugs stay as they are. No redirects; `/courses/name/<slug>` is gone      |
| The id address                             | Kept: `/courses/<id>/preview` and `/courses/<slug>` are both working pages                      |

## Where things stand

- `Course.slug` exists on the schema and as an optional DTO field. The AI course generator fills it;
  the teaching app sends `slug: ''`, and `upsert` writes the payload as sent. On dev 18 of 19
  published courses have one, none duplicated. There is no index on it.
- `/courses/name/[slug]` passes the slug to `Course` as a course id, so it never loads anything.
- Every link is `/courses/<id>/preview`: `CourseCard`, `ExploreMenu`, `ExploreSheet`,
  `CourseModules` (twice), `SessionCard`, `Course.tsx`, the enrol redirect and `ShareCourse`.
- The server-rendered HTML is the full-screen loader plus the `PageMeta` tags. No sitemap, no
  robots.txt, no structured data.

## Phase 1

### 1. Server: stores the slug, refuses a duplicate

**Schema** (`course.schema.ts`)

- `slug`: unique among live courses, across every organisation, since the address is global:
  `CourseSchema.index({ slug: 1 }, { unique: true, partialFilterExpression: { _deleted: false, slug: { $gt: '' } } })`.
  An empty slug is left out, so those rows do not collide. The lookup filters `_deleted: false`, so
  the same index serves it (explain: `IXSCAN {slug:1}`).
- A duplicate is refused by the index; `CourseService.upsert` turns that refusal into a 409
  "Another course already uses this name. Please choose a different name."

**Who sets it** — the teaching app's course form sends `slug: slugify(course.name)` on every save,
the same `slugify` the AI course generator uses, so a rename changes the slug and the old one is
gone. No organisation name, no numbering. A name with no English letter or digit would give an empty slug, so the
form refuses it: "Course name must contain at least one English letter or number."

**Errors** — teaching's `handleError` read only a bare `{ message }` and showed Axios's "Request
failed with status code 409"; it now reads `error.message` first, as learning's does. Support's had the same bug and the same fix.

**Public read** — `getPublicCourseBySlug(slug)`, a separate function per the house rule:

- `GET course/published/slug/:slug`, `@Public()`. Answers the same `PublishedCourseResponse` as
  `course/published/:courseId`, or 404.

**Rollout** — no backfill. A course without a slug gets one on its next save. Before
`sync-indexes` on production, check for duplicate non-empty slugs among live courses (the index
build fails on one); dev had none.

### 2. Learning app: one address per course

**Routes** — Next requires one name for a dynamic segment at a level, so `pages/courses/[courseId]`
becomes `pages/courses/[course]`:

| Path                              | What it does                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `/courses/[course]` (new `index`) | The preview, by slug. An unknown slug renders the "course not found" page with a 404 status           |
| `/courses/[course]/preview`       | By id, a working page as before. Its canonical link names the slug address, so Google counts one page |
| `/courses/[course]/modules`       | Unchanged, by id; signed in only                                                                      |
| `/courses/[course]/print`         | Unchanged, by id                                                                                      |
| `/courses/name/[slug]`            | Removed, with no redirect                                                                             |

- The page resolves the slug to an id from the catalogue the preview already loads
  (`getCourseBySlug` lookup in the course store), so in-app navigation needs no extra request.
  `getServerSideProps` keeps skipping the API on in-app navigation, as now.
- "Course not found" is the existing `BlankState` with a "Browse courses" link, served with a 404
  status (`notFound`-style, but rendered by the course page) so Google drops a dead slug from its
  index rather than keeping an empty page.

**Links** — one helper, `getCoursePath(course)`: `/courses/<slug>` when there is a slug, else
`/courses/<id>/preview`. Every link listed above uses it, and `ShareCourse` shares
`COMPANY.appUrl + getCoursePath(course)`, so a link copied on dev still names production.

### 2b. Teaching app: the course's public address

- `CourseHeader` (beside the publish toggle) shows `NEXT_PUBLIC_LEARN_URL/courses/<slug>` with a
  copy button. A draft shows it too, marked "Live once published", so the teacher can see it ahead.
- `UpsertCourseModal`: the Course Name field's hint says renaming changes the public link, and links
  already shared will stop working — the consequence of not keeping old slugs.
- The slug comes back from the server on save, so the header shows the new address straight after
  a rename with no extra request.

### 3. Search

- **Canonical and `og:url`** on the slug page only, where the server knows the real address. Other
  pages keep omitting them (see `PageMeta`).
- **Structured data**: a schema.org `Course` block as JSON-LD on the slug page — `name`,
  `description`, `image`, `provider` (Acadimic, the site URL), `offers` from the course's plans
  (price, currency, `category: Free | Paid`), and `hasCourseInstance` with `courseMode: online`. It
  makes the course eligible for Google's course results; Google's Rich Results Test checks it.
- **`/sitemap.xml`**: a page route that writes XML from `course/published` — every published
  course at `/courses/<slug>` with `lastmod` from `updatedAt`, plus `/`, `/courses`, `/about`,
  `/contact`, `/help`, `/terms`, `/privacy`, `/cookies`. Cached at the CDN for an hour.
- **`/robots.txt`**: a route as well, so the sitemap address comes from `NEXT_PUBLIC_APP_URL`.
  Disallows `/courses/*/modules`, `/courses/*/print`, `/account-settings`, `/activity`,
  `/sessions`, `/order/`, `/sign-in`, `/sign-up`.
- **Titles**: `<course name> — Online course | Acadimic`.

### 4. After release (Manish)

- Google Search Console: add the domain, submit `https://<app>/sitemap.xml`, and request
  indexing for a few course pages.
- Rich Results Test on one course page.
- No code can promise a ranking: these make the pages readable and eligible; content, links from
  other sites and time decide the position.

## Phase 2 (later)

Server-render the course page's real content — title, description, syllabus, price — so the first
HTML Google receives is the page, not the loader. Needs `_app` to stop gating public pages on
`mode`/`isReady` and the preview to take its first data from `getServerSideProps`. The biggest
single ranking lever left after phase 1.

## Verification

- Server: a duplicate slug is refused (E11000 → 409); `sync-indexes` builds the unique index;
  the slug route's 404.
- Learning: `/courses/<slug>` loads signed in and out; an unknown or renamed-away slug shows
  "course not found" with a 404; `/courses/<id>/preview` still works and names the slug address as
  canonical; the share button copies the slug address; `sitemap.xml` and `robots.txt` are valid;
  JSON-LD passes the Rich Results Test.
- Typecheck, lint and build in all touched workspaces (`verify-changes`).
