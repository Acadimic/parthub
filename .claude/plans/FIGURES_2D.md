# 2D figures from the editor

Written 2026-10-08. Status: **plan, not started; every open question decided (§5).** Follows `3D_SCENES.md` (whose template gallery
this mirrors) and the content-images work of 2026-10-02 (commit `dc1bd0d`).

## 1. Where things stand

- **The AI path already makes figures.** A lesson or quiz reply carries `figures: [{ ref, alt,
caption, svg }]`, placed as `![alt](figure:F1 "Caption")`; `course:content` and the five teaching
  drawers upload each SVG to the organization's `content/` folder and store an ordinary `image`
  node. `checkFigures` / `svgProblem` (`packages/shared/src/ai/figures.ts`) refuse unsafe SVG.
- **The course agent draws from data** with `tools/course-agent/svg.mjs`: charts (`bar`,
  `groupedBar`, `stackedBar`, `pie`, `line`), geometry (`rightTriangle`, `triangleSides`,
  `rectangle`, `circle`, `solid`, `elevation`, `depression`), and reasoning and word problems
  (`clock`, `track`, `venn`, `flow`, `alligation`, `roundTable`, `grid`, `timeline`, `tank`,
  `cubeNet`, `dieViews`). Six aptitude courses carry about 300 such figures.
- **A teacher can only upload a file.** The editor's Image button takes a picture from disk; there
  is no way to draw a labelled triangle, a pie chart or a clock without another tool.

## 2. What this adds

A **Figure** button beside "3D scene" in the editor toolbar, opening the same kind of dialog: a
gallery of figure templates, a short form for each one's numbers and labels beside a live preview,
and Insert. The figure is stored exactly like today's figures — an SVG in the organization's
`content/` folder, shown by the `image` node — so the reader, Markdown, print and the AI paths need
no change. Edit on an inserted figure reopens its form.

## 3. Design

- **Drawing moves into `packages/shared`** (`utils/figures/*.util.ts`): the `svg.mjs` builders
  become typed pure functions returning an SVG string, with no browser or React dependency. The
  course agent's `svg.mjs` shrinks to a re-export of the built package, so there is one copy, and
  every builder's output is checked by `svgProblem` in a scratch script per builder.
- **A figure catalog** like `SCENE_CATALOG`: each entry has a key, title, group (Geometry,
  Mensuration, Charts, Reasoning, Word problems), its form fields and `build(values) → svg`. The
  scene catalog's field kinds (number, toggle, choice, text, texts) cover most; two more are
  needed: **rows** (a small table of label + value, for charts) and **points** (labels along a
  track or a timeline).
- **The dialog** reuses the scene dialog's shape (`editor/scene/SceneDialog.tsx`): gallery → form
  and preview. The preview is the SVG itself in an `<img>` — no three.js. "Advanced" shows the SVG
  source, read-only, for staff to check.
- **Insert uploads at once**, like a picture dropped into the editor today (the accepted exception
  to upload-on-save): the SVG becomes a `File` and goes through the editor's existing
  `uploadImage` from `RichTextMediaContext`; the `image` node stores its address, `alt` (from the
  template, editable) and `caption`.
- **Edit** needs the template and values on the node: a new `figure` attribute on the `image` node,
  as the scene node's `template` attribute does. Saving an edit uploads a new file; the old one is
  removed with `common/delete-objects` when the document is saved, as replaced attachments are.
  An image without the attribute (uploaded, or from an AI reply) has no Edit.
- **Transparent, and readable in dark mode** (option A, §5): the shared builders take a
  `background` setting, transparent for editor figures; the reader adds
  `invert(1) hue-rotate(180deg)` to every drawn (SVG) figure when the app's theme is dark, so its
  dark ink turns light and its colours keep their hue; a photo is left alone. Print is always light,
  so it prints as drawn. Older white figures invert too, showing as dark cards with light ink.
- **Where it appears:** every editor, as with 3D scenes. The editor knows whether it can upload
  (`uploadImage` present); without it the button hides, as the Image button does.

## 4. Phases

| #   | Phase                  | Done when                                                                                                                                                                                         |
| --- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Builders in shared** | Every `svg.mjs` builder typed in `packages/shared`, `svg.mjs` re-exporting them, each output passing `svgProblem`; the aptitude update script still produces the same figures.                    |
| 2   | **Figure catalog**     | 12–15 templates with fields: right triangle, triangle by sides, rectangle, circle and sector, solid sketch, elevation/depression, clock, Venn, bar, pie, line, track, cube net, die views, table. |
| 3   | **Editor dialog**      | Toolbar button, gallery, form with live preview, Insert uploads and places the image; Edit reopens the form from the `figure` attribute; replaced files deleted on save.                          |
| 4   | **Docs and agent**     | Editor README, the course-builder agent pointing at the shared builders, browser check in the Editor Lab and a teaching drawer.                                                                   |

About four to five days in all; phase 1 is the riskiest (the agent and the aptitude update script
depend on the builders' exact output).

## 5. Decisions and open questions

1. **Which templates first?** — **Decided (Manish, 2026-10-08): the geometry and mensuration set
   plus bar and pie charts.**
2. **Dark mode and transparency.** Manish asked for transparent backgrounds. An image cannot take
   the page's theme colours, so dark ink on a transparent ground disappears in dark mode. Options:
   - **A (recommended):** draw figures with no background, and have the reader apply
     `invert(1) hue-rotate(180deg)` to _generated_ figures only (marked by the `figure` attribute)
     when the app's theme is dark. One file, follows the app's own theme toggle, prints as drawn.
   - B: the SVG carries its own `prefers-color-scheme` colours — follows the device setting, not
     the app's toggle, so it can disagree with the page.
   - C: inline the SVG into the page so it uses theme tokens — best looking, most work (fetch,
     sanitise on every display, print changes).
     **Decided (Manish, 2026-10-08): option A.** New figures are drawn transparent from the start.
     The ~300 existing aptitude figures are to be redrawn transparent too, **later**, as separate
     work with the update script; until then they keep their white ground, which the dark-mode invert
     turns into a dark card — **decided (Manish, 2026-10-08): every SVG figure inverts in dark mode.**
     Built in `packages/ui/src/content/RichTextImage.tsx` (an image whose address ends in `.svg`).
3. **Editable after insert?** — **Decided (Manish, 2026-10-08): yes**, through the `figure`
   attribute.
