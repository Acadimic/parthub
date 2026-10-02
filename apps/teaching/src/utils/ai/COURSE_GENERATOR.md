# Generating a course with an external model

Phase 1 of `.claude/plans/AI_COURSE_GENERATOR.md`: the course blueprint. The teaching app writes a
prompt, the teacher runs it in any model with web search, and pastes the JSON back. The import
creates the course, its plans and one module per day; lessons and tests the plan asks for are
stored on the modules as pending work for the next phase to generate.

Entry points: **Generate with AI** on `/courses`, and in its empty state.

## The three steps

1. **Setup** — standards (one or more), subjects (optional), weeks and study days a week, pace
   (light / standard / intensive → about 45 / 75 / 120 minutes a day), exam style, language,
   whether days may carry quizzes and weekly live sessions, and a pricing hint. The step shows
   how many saved lessons and test papers the prompt will offer for reuse.
2. **Prompt** — `buildCourseBlueprintPrompt` in `course-generator.ts`. The workspace data block
   carries the standards, subjects, chapters, **every saved lesson and test paper for those
   standards** (id, name, level, duration, chapter, tag), and the minted course id. The model is
   told to research the official syllabus, write it as the `outline`, lay it across the days,
   climb easy → hard within each week, size each day to the pace, and **reuse an existing lesson
   or test by id wherever one fits** before asking for a new one.
3. **Import** — parsed and checked (`validateAiCourse`): wrong course id, standards or subjects
   outside the setup, unknown `use` ids, a lesson used twice, unknown chapter ids, empty days,
   days far over the pace, a week whose levels fall back, outline lines no day covers, bad plans.
   Previewed week by week with what is reused and what is to generate, then written through
   `POST course/upsert/course/plans` and the new `POST course/upsert/course/modules`. If the
   modules fail after the course was written, the course and plans are soft-deleted again.

## The JSON the model returns

`IAiCourse` in `packages/shared/src/interfaces/ai-course.interface.ts`, format `acadimic.course/v1`:
`courseId`, `standards`, `subjects`, `title`, `tagline`, `description` (plain prose), `outcomes`,
`prerequisites`, `outline`, `plans`, and `weeks[]` of `days[]`. A day has `ref`, `name`,
`description`, `topics`, `estimatedMins`, `lessons[]`, `tests[]` and an optional `session`. Each
lesson or test is either `{ "use": "<id>" }` or `{ "generate": { … } }`.

## What the import writes

- `Course`: name, tagline and description joined as the description, standards, subjects,
  `isPublished: false`, `tag: 'ai_generated'`, plus the new `outline`, `outcomes` and
  `prerequisites` fields.
- `Plan`s from the reply's `plans`, or one plan from the setup's pricing hint.
- One `CourseModule` per day, numbered across weeks, with `week`, `topics`, the description
  prefixed by the week's theme, `materials` and `testPapers` set to the `use` ids, and `pending`
  holding every `generate` spec as `IAiPendingWork` (`status: 'pending'`). Module cards show the
  topics and a "N lessons and M quizzes to generate" chip; the course page's Modules header totals
  them. Sessions in the reply are shown in the preview only; creating meets is Phase 3.

## Next phases

Phase 2 turns each module's pending work into the study material and test paper generators'
prompts and links what comes back into the module; Phase 3 creates the live sessions and a cover;
Phase 4 reviews coverage and pace before publishing. See the plan for the details.

## Phase 2 — filling the modules

**Generate content** on the course page (in the generation panel, shown on any course that came
from a plan). Prompts: one study-material prompt per day that still owes lessons — its planned
lessons as an explicit list with refs `L1…`, `courseModule` echoed — and one test-paper prompt per
planned quiz, each quiz its own paper with a minted id. Import: add any number of replies, files or
pasted; each is read by its `format`, matched to the day or quiz it answers (`courseModule`,
`testPaperId`), checked as the generators check any reply, and imported: lessons through
`material/bulk-upsert`, quizzes as a paper, a section and questions (`createPaperFromImport`,
shared with the test paper generator). Each import then calls `POST course/link-module`, which
appends the ids to the module and marks the pending items done with what was created. The
builders and the reply reader are in `course-modules.ts`.

## Phase 3 — sessions and cover

**Schedule sessions**: the teacher picks the first teaching day, a time and the teaching weekdays;
every module takes the next teaching day in order, and each planned session (kept on the module as
pending work of kind `session`) becomes a one-off meet on its module's day with the planned title,
duration and agenda. Meets are linked into the module and the course. A **cover** is drawn at
import from the course name and subjects (`course-cover.ts`: a seeded gradient and pattern,
rendered on a canvas) and uploaded like any attachment; the course form can replace it.

## Phase 4 — review and publish

**Review & publish** runs the checks the app can do itself (`course-review.ts`): days with no
content, items still to generate, unscheduled sessions, days far from the course's median length,
weeks whose lesson levels fall back, syllabus lines no day covers, topics taught twice, links to
content that no longer exists, and — on request — dead references across every linked lesson's
attachments through `common/verify-links`. It shows the coverage matrix and load per day, offers a
digest prompt whose reply (`acadimic.course-review/v1`) is shown as findings, and holds the publish
switch: errors keep it off, warnings do not. Publishing sets `isPublished` and `publishedDate`.

## Not built

Phase 5 (server-side automation against a provider) needs provider credentials and a job model the
repo does not have yet; the copy-and-paste path is the whole flow today. Phase 6 (learner
enrichments) was never sized. The `source` provenance field on generated rows was not added: the
module's pending items carry `createdId`, and generated courses are tagged `ai_generated`.

## The terminal agent

The generation core now lives in `packages/shared/src/ai/` (published as `@repo/shared/ai`; the
files under `apps/teaching/src/utils/ai/` re-export it), so the same builders, validators and
converters run in the app, in a terminal, and later on the server. Two things sit on top of it:

- **`tools/course-agent/cli.mjs`** — the pipeline as commands: `login`, `workspace`,
  `course:prompt`, `course:import`, `course:prompts`, `course:content`, `course:sessions`,
  `course:status`, `course:review`, `course:publish`. `course:content` uploads a reply's figures
  after the reply passes its checks and points the images at them; `tools/course-agent/svg.mjs`
  draws charts and diagrams from data for the replies the agent writes. It signs in with Firebase email and password
  (or a browser id token for a one-off run), keeps the session and each run's ids in
  `.course-agent/` (git-ignored), and calls the API as the signed-in teacher. `--help` lists
  everything. It never calls a model.
- **The `course-builder` agent** (`.claude/agents/course-builder.md`) — a Claude Code agent that
  interviews the teacher (standards and subjects first, then length, pace, exam style, language,
  quizzes, sessions, pricing), then runs the pipeline and **answers every prompt itself**: it
  researches with web search, opens the sources it cites, writes the JSON the prompts ask for, lets
  the tool validate and import it, fixes what is reported, and checkpoints with the teacher between
  phases. It never publishes without being told to.

Running it: in Claude Code, `@course-builder build a Class 10 Physics course for the CBSE board`
(or ask for a course in plain words and the agent is picked up). It needs the API running and a
teacher account to sign in with.

### Towards end users

The agent is the shape of the Phase 5 product feature. What it does by hand today — ask, plan,
write, validate, import, review — is exactly what a server-side job runner would do with a
provider key: the `cli.mjs` commands map one-to-one onto job steps, the interview onto a chat
setup screen, the checkpoints onto job states a teacher approves. Moving the core into
`@repo/shared/ai` was the prerequisite; the remaining pieces are the `GenerationJob` collection,
provider adapters with web-search tools, per-organization caps and cost display, described in
`.claude/plans/AI_COURSE_GENERATOR.md` §6.
