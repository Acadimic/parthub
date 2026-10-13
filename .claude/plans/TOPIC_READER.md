# Topic reader — read a lesson one topic at a time

Plan, 2026-10-13. Status: **built 2026-10-13 (steps 1–5), uncommitted.** §6 records where the build differs from the plan. Decisions from
Manish (2026-10-13): the current full-lesson view stays; the new view is added beside it. A lesson is
read topic by topic with its own Prev/Next, and only after every topic, video and other attachment
has been opened can the learner mark the lesson complete. The module-wise item pager stays.

---

## 1. What exists today

- **A lesson is one rich-text body.** `MaterialDto` has a single `content: IRichText` plus an
  `attachments: AttachmentDto[]` list. There is no sections or topics array on the material.
- **Topics exist only as headings in the body.** `doc.content` is a flat list; a topic is a
  `heading` node (levels 1–3) followed by its paragraphs. Nothing nests under a heading.
- **AI-written lessons follow a fixed outline** (`packages/shared/src/ai/study-material-prompt.ts`):
  `# Title` + intro, then `## Before you start`, `## The ideas` (a `###` per topic), `## Worked
  examples`, `## Where this shows up`, `## Common mistakes`, `## Check yourself`, `## Important
  notes`, `## Key terms`, `## Summary`, and an appended `## References and further learning`.
  Teacher-written lessons may have no headings at all.
- **Videos are attachments, not text.** The chip row in `FrameToolbar`
  (`modules/courses/components/course-modules/CourseModuleContent.tsx`) swaps the body for one
  attachment at a time (`MaterialItem.tsx`, via `selectorStore.selectedContent` and
  `selectedAttachment`). The body and a video are never on screen together.
- **Completion is one row per item.** `CompletedModule` (`apps/server/.../completed-module.schema.ts`)
  holds `{course, courseModule, collectionItem, collectionRef, isCompleted, isSkipped}` per learner.
  `MarkCompleteButton.tsx` creates or patches it; nothing completes automatically.
- **Navigation is a flat item list.** `hooks/course.hook.ts`: `getCourseItems` (modules by `day`,
  lessons then tests), `selectItem`, `selectAdjacentItem(courseId, ±1)`. The selection lives in
  `stores/selector.store.ts`, not in the URL.
- **`RichTextView` renders a partial document.** It reads only `value.doc.content`
  (`packages/ui/src/content/RichTextView.tsx`), so a slice wrapped in a doc renders as-is. Headings
  get no `id`, so there are no in-page anchors.
- **No utility splits a document by heading.** `rich-text-plain.util.ts` has `docToPlainText` and
  `isRichTextEmpty`; `rich-text.util.ts` has the Markdown importer and `repairRichText`.

---

## 2. Decisions

| Question                       | Decision                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Store topics or derive them?   | **Derive at read time** from heading nodes. No schema change, no migration, every lesson works on day one, teaching keeps authoring as now. A lesson with no headings is one topic, so the reader degrades to today's view. |
| Split level                    | **`##` and `###`** (`MAX_TOPIC_LEVEL = 3`). `##` alone leaves "The ideas" too large. A `###` page shows its parent in the title: "The ideas · Ohm's law". One constant, easy to change.                                      |
| What is a page?                | Text topics in document order, then one page per video attachment, then one per file or link attachment. "Topic 3 of 9" counts them all, so videos are visibly part of the lesson.                                        |
| Both views                     | A **Reader / Full lesson** toggle in the lesson header, remembered in `localStorage`. The `FrameToolbar` (chips, mark complete, like, bookmark, doubt, item pager) is shared by both.                                       |
| Where does the page index live | **Selector store** (`selectedTopicIndex`), beside the item selection, not the URL. `selectItem` resets it; `selectAdjacentItem(-1)` lands on the last page of the previous item.                                            |
| Edges                          | Next on the last page = the existing item pager's Next. Prev on the first page = previous item, last page. An attachment chip jumps to that page instead of swapping the body.                                              |
| Completion gate                | The swipe is disabled with "Open all N topics first" until every page of the lesson has been opened. In the full view the swipe behaves as today.                                                                        |
| Where viewed pages live        | **Phase 1: client, `localStorage`**, keyed by user + material, invalidated when the page count changes. **Phase 2 (deferred):** a `viewedTopics: string[]` on `CompletedModule`, upserted with `isCompleted: false`.          |

---

## 3. Shared splitter (step 1)

`packages/shared/src/utils/rich-text-sections.util.ts`, exported from `@repo/shared/utils`.

```ts
interface IRichTextSection {
  /** `section-<index>`; stable while the document keeps the same heading structure. */
  key: string;
  /** The heading's text; '' for leading content before the first heading. */
  title: string;
  /** The nearest enclosing heading above `level`, for "The ideas · Ohm's law". '' at the top. */
  parentTitle: string;
  /** 0 for leading content, else the heading's level. */
  level: number;
  /** A full `IRichText` holding just this section, so `RichTextView` renders it unchanged. */
  content: IRichText;
}

const MAX_TOPIC_LEVEL = 3;
splitRichTextIntoSections(value: IRichText | null, maxLevel = MAX_TOPIC_LEVEL): IRichTextSection[];
```

Rules:

- A heading at `level <= maxLevel` starts a section. Deeper headings stay inside the section.
- Text before the first heading is an untitled level-0 section. A lesson beginning `# Title` +
  intro has no such text: its first section is the `#` heading with the intro under it, so the
  reader opens on the title page as the lesson reads today.
- A level-1 heading is the document's own title, so it never becomes a `parentTitle`; the
  `##` sections under it carry no parent.
- An empty section (a heading with nothing under it, as `## The ideas` is when every topic is a
  `###`) is dropped, so the learner never lands on a blank page; its title becomes the next
  section's `parentTitle`.
- A document with no headings returns one section holding the whole body.
- `null`, or a body with no readable text, returns `[]`.
- Each section's `text` projection is computed with `docToPlainText`, so `isRichTextEmpty` works
  on it and the "no readable text" test is the same one the rest of the code uses.

Lives in `packages/shared` (pure TS) so the print module and the teaching preview can reuse it.

---

## 4. Learning app (steps 2–4, as planned; see §6 for the names that changed)

### Store

- `selector.store.ts`: `selectedTopicIndex: number`, `setSelectedTopicIndex`, and
  `lessonViewMode: LessonViewMode` (`READER | FULL`, new enum in `apps/learning/src/enums`),
  read from and written to `localStorage` under a new `StorageKey`.
- `course.store.ts`: `viewedPagesMap: Record<materialId, string[]>` (page keys), `markPageViewed`,
  `hasViewedEveryPage(materialId, pageKeys)`; persisted per user under one `StorageKey`.
- `hooks/course.hook.ts`: `selectItem` resets the topic index to 0; `selectAdjacentItem(-1)` sets
  it to the last page of the previous item (needs the page count, so the hook builds the page list
  through the same helper the reader uses).

### Page list

`hooks/lesson-pages.hook.ts` — `useLessonPages(material)` returns
`{ kind: 'section', key, title, parentTitle, content } | { kind: 'attachment', key, title, attachment }[]`:
sections from the splitter, then video attachments (`isVideoAttachment`), then the rest. Keys are
`section-<i>` and the attachment's `key`.

### Components (`modules/courses/components/course-modules/`)

- `LessonViewToggle.tsx` — Reader / Full lesson, in `LessonHeader`.
- `content/TopicReader.tsx` — renders the current page: `ViewTextContent` for a section (its
  heading is inside the content, so nothing is repeated above it), `VideoPlayer` /
  `ViewUrlContent` for an attachment; marks the page viewed on mount.
- `TopicPager.tsx` — Prev, "Topic i of N" with a dropdown listing every page and a tick on viewed
  ones, Next. At the ends it calls `selectAdjacentItem`.
- `MaterialItem.tsx` — branches on `lessonViewMode`; the full view is untouched.
- `FrameToolbar` — in reader mode an attachment chip sets `selectedTopicIndex` to that page.
- `MarkCompleteButton.tsx` — in reader mode, disabled with a hint until `hasViewedEveryPage`.

Every control comes from `@repo/ui/core` / `@repo/ui/app` (`use-ui-component` first).

### Step 5 — verify

`pnpm build:shared`, `pnpm typecheck:ui`, learning typecheck, `pnpm lint`, then a browser pass
with the saved learner account on an AI lesson, a heading-free lesson and a lesson with videos.

---

## 5. Deferred

- Server-side viewed pages (`CompletedModule.viewedTopics`) so progress follows the learner across
  devices.
- Heading `id`s in `RichTextView`, for jump links in the full view.
- Auto-complete when the last page is viewed (Manish chose an explicit swipe).

---

## 6. As built (2026-10-13)

- **Page index is `number | 'last'`** (`selectedLessonPageIndex` in the selector store), not a plain
  number: going back from the next lesson asks for the previous one's last page before its body
  has arrived, so the reader resolves `'last'` once it knows the page count.
- **Pages are built by a pure helper, not a hook:** `getLessonPages(material)` and
  `getLessonPageTitle` in `apps/learning/src/utils/helpers/lesson-pages.ts`, which also holds the
  `localStorage` reads and writes. `hooks/lesson-reader.hook.ts` (`useLessonReader`) wraps them with
  the selection and the moves; the pager, the reader, the chip row and the swipe all read it.
- **Viewed pages live in the course store** as `viewedLessonPagesMap`, with `markLessonPageViewed`,
  `isLessonPageViewed`, `countUnviewedLessonPages` and `restoreViewedLessonPages`; stored per user
  under `StorageKey.VIEWED_LESSON_PAGES`. The view mode is `lessonViewMode` in the selector store
  under `StorageKey.LESSON_VIEW_MODE`. Both keys were added to the shared `StorageKey` enum, and
  both are restored in `CourseModuleContent` when the signed-in user is known.
- **No invalidation on page count:** the gate is "every key the lesson has now has been opened", so
  an edited lesson only asks for its new pages again.
- **The attachment viewer was extracted** from `MaterialItem` into `content/AttachmentContent.tsx`
  so the reader and the full view share it.
- **Chip row:** `useFrameChips` in `CourseModuleContent.tsx` decides what the chips mark and do in
  each mode. The frame's `FrameToolbar` is unchanged.
- **Swipe while locked** shows "3 of 15 topics read" on the disabled track, with the hint in a
  tooltip.
- **Verified in the browser** (Spanish C1–C2, lesson 1: 13 sections + 1 video + 1 link = 15 pages):
  Next/Prev, the list with ticks and jump, Prev disabled at the start of the course, the swipe
  locked until page 15 and live after it, the lock surviving a reload, Full lesson showing all ten
  `h2`s with no pager and the mode surviving a reload, Next lesson landing on page 1 of the next
  lesson and Previous landing on page 15 of this one, and the phone layout. A page error with the
  message "Y" fires whenever the YouTube embed mounts, in the full view as well, so it predates this.
- **Not run:** `pnpm build:learning`, because the dev server was serving the app from the same
  `.next` folder during the session. Typecheck and lint of the app, and the repo lint, are clean.

---

## 7. Game-style reader (2026-10-13, second pass)

Manish asked for the reader to feel like a game, to work on phones, and to turn pages by tapping
the left and right of the screen. Patterns taken from the research: Kindle's edge tap zones
(right and centre-right forward, left back, reachable by thumb), the segmented story-style
progress strip, and Duolingo's visible small wins with "juicy" motion.

- **Progress strip** (`content/ReaderProgress.tsx`): one segment per page above the content,
  filled once opened, taller and glowing on the current page, each a `role="tab"` that jumps to
  its page; "N left" at the end, replaced by "All read" with a pop when nothing is left. Segments
  carry a native `title` rather than the `Tooltip`, whose wrapping span took their flex width.
- **Tap zones and keys** (`hooks/reader-gestures.hook.ts`, `useReaderGestures`): the outer 28%
  of the page on each side turns back or forward on a touch or pen tap (under 350 ms, under 10 px
  of travel), never on a mouse click, never on an interactive element (`a, button, input, select,
  textarea, audio, video, iframe, summary, label, [role=button], [contenteditable]`), and never
  while text is selected. Arrow keys turn pages on every device unless the focus is in a field.
  Disabled while the viewer is full screen (that modal has its own bar).
- **Motion** (in `packages/ui/src/themes/preset.ts`): `page-in-right` / `page-in-left` play as a
  page arrives from the side it was asked for (`motion-safe:` only), `tap-flash` lights the edge
  tapped, `pop-in` is the reward bounce. All four join the preset's keyframes rather than living
  in a component.
- **First-use hint** (`TapHint` in `TopicReader.tsx`): on a coarse-pointer screen, once, an
  overlay names the two zones ("Back", "Next", "Tap the edges to turn"); it never catches a touch,
  and goes on the first turn or after six seconds. Remembered under `StorageKey.READER_HINT_SEEN`.
- **Pager** (`TopicPager.tsx`): round Back, a "3/15 · title" pill that opens the **page path**
  (a vertical line through every page with ticks on the ones done and the current one lit), and
  a glowing Next that becomes "Next lesson" on the last page. The **All topics read** banner
  appears above it once every page is open and the lesson is not yet complete.
- **Verified** (Playwright, desktop 1440×900 and an emulated iPhone 13 with touch): arrow keys,
  strip clicks, the path, the banner and the live swipe; on the phone the hint shows once and is
  stored, right and left edge taps turn, a centre tap, a vertical drag on the edge and a tap on
  the audio Play button inside the content do not.
- **Full screen fix (same day):** the page-turn animation's final keyframe left a `transform` on
  the page wrapper, and `FullScreenModal` is a `fixed` element rendered inside it rather than
  portalled, so a transformed ancestor became its containing block and "full screen" opened inside
  the page box. `PageArrival` in `TopicReader.tsx` now drops the animation class on
  `animationend`, so nothing transformed stays above the modal. Checked on desktop and phone: the
  modal's box equals the viewport, and Exit closes it.
- **Full screen, topic-wise (2026-10-14):** `FullScreenBar` reads the reader through
  `useFullScreenMoves`: in Topics mode Previous and Next move one topic, naming the neighbouring
  lesson past either end (and leaving full screen first when that is a test paper); in the full
  view they move one lesson as before. The centre shows the topic's title and "Topic 3 / 15 ·
  lesson". Edge taps and arrow keys now work in full screen as well: the gesture hook measures a
  tap against the nearest `data-reader-surface` ancestor (the page wrapper, or the full-screen
  surface in `ViewTextContent`, `ViewUrlContent` and `VideoPlayer`), so a tap at the screen's edge
  is read against the screen, not the page box underneath. Checked on desktop (bar buttons, arrow
  key, handover to the next lesson while staying full screen) and phone (edge taps, centre tap).
- **Full-screen shake (2026-10-14):** a turn in full screen remounted the page wrapper with the
  arrival animation, so for its 280 ms the wrapper's `transform` pinned the full-screen view to the
  page box, which then jumped back to the viewport. `PageArrival` takes `isAnimated={!isFullScreen}`
  and plays nothing while full screen. Sampled the modal's box every 30 ms through a Next and an
  ArrowLeft: it stayed at 0,0 1440×900 throughout.
- **Topic dropdown in full screen (2026-10-14):** the page path moved out of `TopicPager` into
  `components/tools/TopicPicker.tsx` (`TopicPath`, the list; `TopicPicker`, the list in a popover
  under a caller-styled trigger). The pager and the full-screen bar both use it; in full screen the
  bar's centre is the trigger, showing the topic's title over "Topic 5 / 15 · lesson". The popover
  paints at z-1400, above the z-1300 modal. Checked on desktop and phone: 15 rows, a pick moves the
  page, closes the popover and keeps full screen, and the pager behind agrees after exit.

---

## 8. Review and verification (2026-10-14)

The verification ladder ran green before and after the review: `build:shared`, `typecheck:ui`,
`tsc --noEmit` in all six workspaces, `pnpm lint` (exit 0; the only two warnings are pre-existing
in teaching), and `pnpm build:learning` (the dev server keeps its own `.next/dev`, so the build is
safe beside it). A `/code-review high` pass over the working tree raised eight findings, all fixed:

1. **Full screen into a test paper by key or tap** left the frame's `isFullScreen` true, so the
   next lesson opened full screen. `CourseModuleContent` now drops the flag whenever a test paper
   is selected. Checked on the Astrophysics course: ArrowRight from a full-screen last topic into
   a quiz closes the modal, and the lesson before it reopens windowed.
2. **Arrow keys while a tab strip, menu, player or field had focus** also turned pages. The hook
   now ignores the keys when `document.activeElement` sits in `ARROW_KEY_OWNERS`; the progress
   strip stopped claiming `role="tablist"` so it is not one of them. Checked: ArrowLeft with the
   outline's Tests tab focused leaves the page alone.
3. **Viewed pages were written whole**, so a second tab could wipe the record.
   `writeViewedLessonPages` merges per material (a page once opened is never un-opened). Checked
   by planting another lesson's entry and opening a page: the entry survives.
4. **The page wrapper's key repeated across lessons** (`section-0` in every lesson), so scroll
   position carried over and the arrival did not play; going back to the previous lesson slid from
   the right. The key is now `<materialId>:<pageKey>`, the direction across lessons reads the move
   that was asked for (`'last'` means back), the "last position" ref is updated after commit so a
   StrictMode double render reads the same past, and `PageArrival` captures its side at mount.
   Checked: lesson B's topic 3 opens at scroll 0 after lesson A's was scrolled, and Previous into
   lesson A's last page plays `page-in-left`.
5. **A corrupted stored record threw inside an effect.** The read is wrapped and shape-checked;
   `'null'` in storage now yields an empty record and the lesson renders.
6. **Three video rules.** `AttachmentContent` and the picker's icon both use the shared
   `isVideoAttachment`, the rule that already orders the pages and labels the lesson; an uploaded
   video therefore opens in the player, signed.
7. **Duplicated labels.** `getItemName` and `getEdgeLabel` live in `utils/helpers/course-items.ts`;
   `useLessonReader` returns the Previous/Next labels and disabled flags once, and the pager and
   the full-screen bar read them.
8. **Six splits per lesson and a re-registered key listener.** `getLessonPages` caches by the
   immutable store row in a `WeakMap`; the splitter decides whether a section is empty before
   building its value; the keydown listener is registered once and reads the latest moves from a ref.
- **Toggle into the progress strip (2026-10-14, after 5eb6956):** Manish asked for the Topics /
  Full lesson toggle as icons only, tried it in the pager row and the chip row, and settled on the
  progress strip, which now shows in both views. `ReaderProgress` moved out of `TopicReader` to
  the top of the lesson card in `CourseModuleContent`, takes only the material, and starts with
  `LessonViewToggle` (two icon buttons in one pill; tooltips and `aria-label`s carry the words)
  and a divider before the segments and "N left". In the full view the segments still show what
  has been opened, and a tap on one switches to topics at that page. The pager row is set like the exam
  footer — a secondary Previous and a primary Next, rectangular, h-8, text-xs, words from `sm` up —
  at 40 px (was 56) and renders only in Topics mode; the header and
  the chip row carry no toggle. The strip is 41 px (h-7 icon buttons, py-1, a faint `bg-muted/30` band). Checked on desktop and phone: the toggle
  switches both ways from it, the ten `h2`s show in full, and a segment tap in full view lands on
  topic 5 in the reader.
- **Completion rules (2026-10-14):** Manish asked for three changes. (1) **Leaving** a lesson's last
  topic marks the lesson done — back, forward into the next lesson, or by picking another topic —
  not arriving at it, which a learner may do by stepping back from the next lesson. The page
  effect in `TopicReader` returns a cleanup that calls the course store's new
  `completeCourseModuleItem`, quietly (no toast; the badge and the Completed pill say it). The
  cleanup also runs on a StrictMode re-mount, a view switch and leaving the course, so it first
  checks that the selection has actually moved on from that page.
  (2) The swipe is free at any time: the "N of M topics read" lock and the "All topics read" banner
  are gone, and `MarkCompleteButton` saves through the store's new `saveCompletedModule` (the
  optimistic patch-or-create with rollback that used to live in the button). (3) A test paper is
  marked done when the learner finishes it: an attempt on Submit (`submitExamAndComplete` in
  `hooks/exam.hook.ts`, after the result saved), and a practice sitting when its analytics open,
  since practice never submits a result. Both read the course from the sitting and the module from
  the selection, so a paper opened outside a course marks nothing. `countUnviewedLessonPages` was
  removed with the lock. Checked in the browser: arriving at the last topic of a Spanish lesson adds
  nothing; Previous, Next into the next lesson, and a pick from the path each add the badge and the
  Undo pill with no toast, and switching to the full view from the last topic does not; the swipe on an unread lesson reads "Swipe to complete" and is not
  disabled; on the Astrophysics quiz both Practice → View analytics and Attempt → Submit mark the
  item, and Undo clears it. Every completion made by the checks was undone afterwards.
- **Strip in full screen (2026-10-14):** `ReaderProgress` and `LessonViewToggle` moved to
  `components/tools/`, and `FullScreenStrip` (the strip for the selected lesson, nothing for a
  test paper) sits at the top of all three full-screen surfaces: the text viewer's modal, the URL
  viewer's modal and the pinned video player. The toggle works there too — Full lesson inside
  full screen shows the whole body with the strip above it — and a segment tap jumps the topic.
  Checked on desktop and phone, on a text topic and on the video page.

---

## 9. Second review (2026-10-14)

Before the second commit, `/code-review high` over the working tree raised ten findings. Nine
were fixed and re-verified; the tenth (the reader hook instantiated in several components, each
re-flattening the course's items) is a performance note left as a follow-up, since the page
splitting it also raised is already cached per lesson row.

1. **A full-view learner's first topic was marked read on a hard reload**, because the stored mode
   was restored in a parent effect after the reader had mounted. The selector store now reads the
   stored mode when it is created on the client, and `restoreLessonViewMode` is gone.
2. **Arrow keys turned pages behind an open dialog or popover.** The key handler now yields while
   a `[role="dialog"]` or a Radix popper is in the document.
3. **Every backward move landed on the last page**, including the item-wise pagers, and the
   `'last'` value lingered into the full view. `selectAdjacentItem` takes the landing page; the
   reader's Prev asks for `'last'`, the toolbar and the full-screen bar's item-wise moves ask for 0,
   and the full-screen bar routes topic-wise moves through the reader.
4. **A child's `animationend` cut the arrival short.** `PageArrival` now ends only on its own.
5. **An empty lesson read "All read".** The strip shows only the toggle when there are no pages.
6. **The toolbar pager hand-built its labels.** It uses `getEdgeLabel`.
7. **A failed create left a client-minted row** in the completed map. `saveCompletedModule` now
   removes a row it created when the save fails, and no longer re-patches a fresh row.
8. **The path's rows were raw `<button>`s.** They are the library `Button`.
9. **A practice sitting re-marked itself** whenever its analytics opened. `completeExamItem` marks
   each sitting once (by its id). A new Practice or Attempt is a new sitting, so finishing it
   again marks again, by design.

Verification after the fixes: lint exit 0, learning typecheck and production build green, and the
browser suites: hard reload in the full view marks nothing; item-wise Previous in the full view
then Topics opens page 1; ArrowRight with the picker open does nothing; the reader's Prev from the
next lesson lands on page 15; leaving the last topic back, forward or by a pick completes, a view
switch does not; practice and attempt both mark and undo; full-screen moves, taps and dropdown;
the reader suite; row heights.
- **Chip row removed (2026-10-14, after 7ede506):** Manish asked for the Lesson / attachment chip
  row under the content to go, and for its entries to live behind a ⋯ of their own, somewhere
  better. `SourcesMenu` in `components/tools/` (with `useSourceMenuItems`: the body, then each
  attachment, the current one lit) sits at the right end of the progress strip, so it is reachable
  in both views and inside full screen; it renders nothing for a lesson without attachments. In the
  reader an entry moves to that page; in the full view it swaps the frame's content, as the chips
  did. The actions ⋯ is unchanged. The entries carry the icon the chip row gave each attachment
  (`getAttachmentIcon`, now exported from `components/app/attachments/Attachment.tsx`: the red
  YouTube mark, PDF, picture, link), and the topic path uses the same, with an article icon on a section row and an indent icon on a
  sub-topic, every row reading from the left. `FrameToolbar` lost its
  four chip props. Checked on desktop, iPhone 13 and iPhone SE: no horizontal overflow, the strip
  stays 41 px, the menu opens inside the viewport, entries move the page in both views.
- **Strip segments by kind (2026-10-14):** each segment takes its content kind's colour — reading,
  video, document, link, audio — through `KIND_BAR` and `getAttachmentKind` in
  `components/app/badges/ContentKinds.tsx`, the same tones as the kind chips in the lesson header.
  Opened and unopened differ by opacity (70 % and 25 %), the current one is taller with a halo in
  its own tone. The pager row's top border is gone (its separation is the toolbar's line below).
- **Header badges (2026-10-14):** the lesson header's "Completed" badge is a 24 px tick tile with
  the word for screen readers only, and the kind chips, the tick and the duration badge form one
  row at one spacing (6 px) and one height (24 px).
