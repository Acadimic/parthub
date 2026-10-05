# Print a course or a test paper as a PDF

Written 2026-10-04. Status: **built 2026-10-04 (phases 1–4), uncommitted.** Phase 5 (server-side PDF) not started. Decisions from Manish (2026-10-04): learners print
too; A4 only; every document carries the Acadimic logo and a clickable `www.acadimic.com`; a very
light watermark if it is cheap (it is — see §2).

A teacher (teaching app) or a learner (learning app) prints:

1. **A course with its contents**: cover, outline, then every module's lessons in full, plus its
   quizzes (with or without answers).
2. **A test paper**, in one of three versions:
   - **Question paper**: what a student sits.
   - **With answers**: the correct option is marked and the solution sits under each question.
   - **Answer key**: one compact table of question number → answer, with no question text.

The output should look like a well-set book or exam paper, not a web page printed to paper.

## 1. Decision: a print route plus the browser's "Save as PDF"

Each document is a page in the app with no chrome. It renders the real content through
`RichTextView`, waits until every image and equation is ready, then calls `window.print()`. The
teacher chooses _Save as PDF_ (or a printer) in the dialog.

| Option                                        | Verdict                                                                                                                                                                                                                                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Print route + `@media print` CSS (chosen)** | Zero new dependencies. Reuses `RichTextView` as it is, so KaTeX equations, tables, images, `<br>` cells and figures print exactly as they read. Text stays vector and selectable.                                                                                                       |
| `@react-pdf/renderer` / jsPDF in the browser  | Every node type (tables, KaTeX, images, lists, listening blocks) would have to be re-implemented in a second renderer. KaTeX has no react-pdf path. Rejected.                                                                                                                           |
| Puppeteer/Chromium on the server (Cloud Run)  | Gives a one-click download and identical output everywhere, but it adds a ~300 MB image, a cold start and auth-forwarding to sign S3 images. **Deferred**: phase 4, only if one-click download becomes a requirement. It can render these same print routes, so nothing is thrown away. |
| Paged.js polyfill                             | Gives running headers, page numbers and a TOC with page numbers in every browser. Hold it in reserve: adopt it only if Chrome's native `@page` margin boxes (check C4) fall short.                                                                                                      |

This is the simplest option that produces a good result. The one cost is the extra click in the
print dialog.

## 2. What the documents look like

Shared print stylesheet, A4 only, light theme forced whatever the app's colour mode.

- **Brand**: the Acadimic logo (`/images/acadimic-light.svg`, already in every app's `public/`) on
  the cover and in the closing panel. Both carry `www.acadimic.com` as a real link to
  `https://www.acadimic.com`; Chrome keeps `<a href>` clickable in a saved PDF. There is no running
  header (Manish, 2026-10-04): an `@page` margin box can't hold a link, and the header read as part
  of the content.
- **Course link** (Manish, 2026-10-05): the closing panel of a course, module, quiz or result
  printout also prints the course's full public address, `/courses/<slug>`, as a live link, so a
  reader can open it on Acadimic. Each app passes it as `courseUrl`; it is `null`, and the line is
  left out, for a draft and for a standalone test paper.
- **Watermark**: the word "ACADIMIC", rotated −30°, in the accent colour at ~4% opacity, centred on
  every page. It is one `position: fixed` element inside `@media print`, which Chrome and Firefox
  repeat on every printed page. That makes it about ten lines, so it stays in. It is
  `pointer-events: none` and sits behind the text, so text selection and links still work. If C4
  shows it doubling or missing on some pages in a browser, drop it rather than build around it.

- **Page**: `@page { size: A4; margin: 16mm 16mm 20mm; }`, as built. The running footer, under a
  hairline, holds the document name on the left and `Page N of M` on the right, via
  `@bottom-left` / `@bottom-right` margin boxes with `counter(page)` / `counter(pages)`. The cover is
  a named page with no footer.
- **Type**: the app's sans for headings, at a 1.15× scale step. Body text is 10.5pt with 1.5 line
  height and `hyphens: auto`, and `orphans`/`widows: 3`. Equations inherit the size.
- **Colour**: one accent, the theme `primary`, on rules, section bands, the number badges and the
  cover. Everything else is near-black on white, so the document survives a greyscale printer. Set
  `print-color-adjust: exact` only on the elements that carry the accent.
- **Cover** (course and paper): the org name, the title in large type, and a subtitle (standard ·
  subject, or paper type · year). There's a stat row (modules · lessons · quizzes · hours, or
  questions · marks · duration), the course thumbnail if one exists, and a printed date.
- **Course body**: a table of contents (module → lessons), then each module starting on a new page
  under a band that says "Module 3 · Week 2". Lessons are `h2` with a reading-time chip. Quizzes
  inside a course use the test-paper layout below.
- **Test paper body**:
  - The header block has the name, roll number and date lines (question paper only), the
    instructions box, and marks/duration.
  - Each section starts with a heading band showing the section name, its instructions and the
    marking scheme (+4 / −1).
  - For each question: a circled number, the marks right-aligned, and the body. Options are
    lettered (A)–(D), set two-up when every option is short and one per line otherwise.
    Integer/fill-in-the-blank questions get an answer box. Subjective questions get ruled lines
    sized by marks.
  - _With answers_: the correct option gets a tick and an accent outline, the answer goes in the box
    for typed answers, and a tinted "Solution" panel sits under the question.
- **Breaks**: `break-inside: avoid` on a question, an option list, a figure and a table row.
  `break-after: avoid` on headings. A question longer than a page is allowed to break.
- **Screen preview**: the same page on screen shows a sticky toolbar with the version picker,
  _Print / Save PDF_ and _Back_, and the pages as white sheets on a muted background. The toolbar
  is `print:hidden`.

The design is mocked first as a static HTML file in the scratchpad (checkpoint C1) so the look is
agreed before any React is written.

## 3. Where it goes

Both teaching and learning print, so the presentation lives in `packages/ui` from the start. It
gets its own **`@repo/ui/print`** subpath, not `./app`, because it renders through `RichTextView`
(KaTeX), and `./app` doesn't import `./content` today. Putting it in `./app` would pull KaTeX into
every screen that imports a button. Adding the subpath follows `extend-a-package`.

Shared, in `packages/ui/src/print/` (pure presentation over DTOs; no store, no service, no app alias):

| File                 | What                                                                                                                                                                                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PrintShell.tsx`     | The screen toolbar (version picker, _Print / Save PDF_, _Back_), the A4 sheet frame, `data-theme="light"`, the watermark, the page footer, and the eager-image media context.                             |
| `PrintCover.tsx`     | Logo, title, subtitle, stat row, thumbnail, date, clickable `www.acadimic.com`.                                                                                                                           |
| `PrintToc.tsx`       | Module → lesson list for a course.                                                                                                                                                                        |
| `PrintTestPaper.tsx` | Header block, instructions, sections, and the three versions. Used alone and inside a course.                                                                                                             |
| `PrintQuestion.tsx`  | Number, marks, body, options or answer box or ruled lines, optional answer and solution.                                                                                                                  |
| `PrintAnswerKey.tsx` | The compact key table.                                                                                                                                                                                    |
| `PrintCourse.tsx`    | Cover + TOC + modules + lessons + embedded `PrintTestPaper`s.                                                                                                                                             |
| `use-print-ready.ts` | Resolves when `isLoaded`, `document.fonts.ready` and every `<img>` in the sheet is `complete`. Then sets `document.title` (the PDF's file name) and calls `window.print()` once.                          |
| `print.css`          | The `@page` rules, margin boxes and watermark. Tailwind can't express these. Each app imports it from its `_app` (global CSS has to be imported there in the Pages Router).                               |
| `question-kind.ts`   | `hasChoices` / `isMultiple` per `QuestionType`. This is the subset of teaching's `QUESTION_TYPES` that print needs, without the icons. Teaching's file then spreads it rather than keeping a second copy. |

Teaching app. New files:

| Place                                                 | What                                                                                                                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/teaching/src/pages/courses/[_id]/print.tsx`     | Four-line page, `Layout.NONE`, renders `CoursePrint`. `pages/courses/[_id].tsx` has to move to `[_id]/index.tsx` for this; check C2.                                                                             |
| `apps/teaching/src/pages/test-papers/[_id]/print.tsx` | Same for `TestPaperPrint`; the version comes from `?version=questions\|answers\|key`. Same move of `[_id].tsx`.                                                                                                  |
| `apps/teaching/src/modules/print/CoursePrint.tsx`     | Loads `course/modules/contents/:courseId` (it already embeds materials with `content`, test papers and meets) plus each quiz through `course/test-paper/sections/:courseId/:testPaperId`. Renders `PrintCourse`. |
| `apps/teaching/src/modules/print/TestPaperPrint.tsx`  | Loads the paper and `test-paper/sections-with-questions/:id` through the existing `loadTestPaperSectionsWithQuestions`. Renders `PrintTestPaper`.                                                                |

Learning app. New files:

| Place                                                              | What                                                                                                                                                  |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/learning/src/pages/courses/…/print.tsx` (exact route per C2) | `Layout.NONE`, renders the learning `CoursePrint`, from the same `course/modules/contents/:courseId` route the learner's course screen already calls. |
| `apps/learning/src/modules/print/CoursePrint.tsx`                  | Same shape as teaching's, with the answer rule below applied per quiz.                                                                                |
| A **Print** action on the learner's course screen                  | Shown to an enrolled learner only, which is the same gate the contents route already enforces.                                                        |

**Answers for learners** (revised 2026-10-04): a learner's quiz always prints with its correct
answers marked; the worked solutions print only once they have submitted that quiz (a non-practice
row in `course/test-paper/results`), which is when the result screen reveals them. Teachers always
get the version picker, defaulting to "With answers".

Existing files that change (both apps unless named):

| Place                                                                            | Change                                                                                                                                                                                                           |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/teaching/src/modules/courses/components/CourseHeader.tsx`                  | A **Print** action that opens `/courses/<id>/print` in a new tab.                                                                                                                                                |
| `apps/teaching/src/modules/test-papers/components/TestPaperDetails.tsx`          | **Print** in the existing `Menu`, with three items (Question paper, With answers, Answer key).                                                                                                                   |
| `packages/ui/src/contexts/rich-text-media-context` + `content/RichTextImage.tsx` | An `imageLoading: 'lazy' \| 'eager'` value on the media context, defaulting to `'lazy'`. The print shell provides `'eager'`. Lazy images below the fold are not reliably fetched before the print snapshot (C3). |
| `packages/ui/src/content/ListeningBlock.tsx`, `PronouncedText.tsx`               | `print:hidden` on the play/rate buttons, so a listening block prints as its transcript and a pronounced word as plain text.                                                                                      |
| `apps/teaching/src/modules/test-papers/components/question-types.ts`             | Read-only reuse: `QUESTION_TYPES[type].hasChoices / isMultiple` decides options vs answer box, so print doesn't add a fifth branch on question type.                                                             |

Plus: `packages/ui/package.json` gets the `./print` export, and each app's `_app.tsx` imports
`@repo/ui/print/print.css`.

No server change. No shared DTO change. No new dependency.

## 4. Checkpoints

Each checkpoint is a place to stop and confirm before going further.

- **C1 Look agreed**: a static A4 mockup (cover, a lesson page, a question page in both versions,
  the answer key) is published to the scratchpad and opened. Manish approves it before step 2.
- **C2 Routes**: moving `[_id].tsx` → `[_id]/index.tsx` keeps every existing link and
  `router.push` working: grep `push(` / `href=` for `/courses/` and `/test-papers/`. `Layout.NONE`
  renders without the sidebar and without the auth redirect loop.
- **C3 Images**: a course with figures (an aptitude course, ~300 SVGs) prints with every figure,
  including ones far below the fold. A signed URL that fails shows the alt text, not a spinner.
- **C4 Pagination**: in Chrome, the `@page` margin boxes print the title and `Page N of M`, and
  the browser's own header/footer doesn't print on top of them (if it does, document "untick
  Headers and footers" in the toolbar hint). Safari and Firefox print legibly without page numbers;
  that is acceptable.
- **C5 Content fidelity**: equations (inline and display), tables with a narrow number column,
  `<br>` in cells, lists, code, links (the URL printed after the text via
  `a[href]::after`), images with captions, and listening blocks all print. Spanish CEFR and aptitude
  courses are the test set.
- **C6 Versions**: for one paper of every question type (single, multiple, boolean, integer,
  fill-in-the-blank, subjective), the question paper reveals no answer anywhere: no tick, no
  colour, no solution. The answers version marks exactly the `isCorrect` options. The key matches.
- **C7 Theme**: printing while the app is in dark mode still yields a white page (`data-theme="light"`
  on the shell).
- **C8 Size**: a full course (Spanish A1: 84 lessons, 24 quizzes) opens, renders and reaches the
  print dialog in a reasonable time, and the PDF is under ~20 MB.
- **C8b Brand**: the logo prints crisp (it's SVG). The `www.acadimic.com` link opens
  `https://www.acadimic.com` when clicked in the saved PDF (Chrome → Save as PDF, opened in Preview
  and in Chrome). The watermark is barely visible on screen-viewed PDFs and on a real greyscale
  print, and it never sits on top of text.
- **C8c Learner answers**: a learner who hasn't submitted a quiz finds no answer anywhere in the
  printout. Once they submit, the next print shows it.
- **C9 Verify**: `verify-changes`: `typecheck:ui`, teaching and learning typecheck, `pnpm lint` exits 0 with
  no new warnings, `build:teaching` and `build:learning`. Don't run a build while that app's dev server is up.

## 5. Phases

1. **Mockup** (C1): static HTML/CSS only, with the logo, link and watermark, to settle the visual design.
2. **Test paper print**, all three versions (C2–C7, C9). It's smaller, and it builds
   `PrintQuestion`, which the course reuses.
3. **Course print**: cover, TOC, modules, lessons, embedded quizzes. A toggle sets whether quizzes
   print with or without answers (C3, C5, C8, C8b, C9).
4. **Learning**: the course print for an enrolled learner with the answer rule (C2, C8c, C9).
5. _Optional, later_: server-side PDF on Cloud Run for one-click download or email. This only
   happens if asked for.

## 6. Open questions

- None blocking. Confirm the learner answer rule in §3 (answers only after the quiz is submitted)
  at C1.

## 7. Added 2026-10-04: one module, one quiz

- **One module**: `?module=<id>` on the course print route, in both apps. `PrintCourse` takes
  `scope: 'module'`, which drops the cover and contents and prints the module under the course's
  name; `IPrintModule.number` keeps the module's place in the course ("Module 03"). The teacher's
  quiz-answers switch applies; a learner's quizzes follow the submitted rule.
- **One quiz**: teaching prints a paper through the existing `/test-papers/<id>/print` (all three
  versions), now also from a print icon on each paper row in a module card. Learning prints
  `?quiz=<id>` on the course print route, read through the course and checked to belong to it: a
  question paper until submitted, then with answers; never a key.
- **Entry points**: teaching module card menu (_Print module_) and paper rows; learning's printer
  icon is a menu (_Print course_, _Print this module_, and _Print this quiz_ when a quiz is open).

## 8. Added 2026-10-04: a learner's submitted sitting

`/courses/<courseId>/print?result=<resultId>` in learning prints one saved sitting: every question
with the learner's pick (green and ticked when right, red and crossed when wrong), the correct
option marked where they missed it, typed answers beside the expected one, a result badge per
question, the score with right / wrong / skipped in the header, and every solution. Opened from
_Print Result_ in the result page's footer, for a test and for practice alike. Practice is never
saved, so the button hands the sitting on screen to the new tab through localStorage
(`modules/print/sitting-handoff.ts`); a link opened later falls back to the saved test result. `PrintTestPaper` takes
`sitting: IPrintSitting | null`; the result row already carries `responseMaps`, `resultMaps` and
`marksObtained`, so there is no server change.

## 9. Load time (2026-10-04)

A long course's lesson bodies are megabytes (Spanish A1–A2: 84 lessons, 4.7 MB), and the dev
machine reads Atlas at roughly 85 KB/s, so `course/modules/contents` took 55 s. Only a whole-course
printout needs every body now: quiz and result printouts in learning read the outline, and a
single module reads `GET course/course/module/contents/:courseId/:moduleId` (both apps). The Spanish
result printout went from 62 s to 13 s on dev; most of the rest is sign-in and the outline.

## 10. File size (2026-10-04)

Chrome cannot embed the macOS system font in a PDF, so every glyph of body text printed as a Type 3
shape. Printouts now use Inter from `@fontsource/inter`, declared as `'Inter Print'` in
`packages/ui/src/print/print-font.css` (imported by each app's `_app`) so the app's screens keep
their font and never download it. Measured: test paper with answers 589 → 376 KB, answer key
181 → 79 KB, result 492 → 226 KB, a 31-page module 1,017 → 633 KB, Quantitative Aptitude 5
6,172 → 2,781 KB, Data Interpretation 5,151 → 4,325 KB (its chart figures are SVG images, whose
labels keep their own font). Pagination is unchanged.
