# 3D graphs, 3D scenes and drawn figures

The map of the three ways authored content shows a picture it computes, rather than one a teacher
uploads. Start here before touching any of them.

| Feature          | What a reader sees                                                              | Stored in content as                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **3D graph**     | a cube button beside an equation; opens a surface or curve with sliders         | `graph` and `graphView` attributes on `inlineMath` / `blockMath` nodes (Markdown: `$…${graph=…}`)                                |
| **3D scene**     | a card ("Open in 3D") for solids, nets, dice, molecules, unit cells, with steps | a `scene3d` block node: `spec` (the scene JSON) and `template` (the editor form it came from) — Markdown: a ` ```scene3d ` fence |
| **Drawn figure** | an ordinary picture: a chart, a triangle, a net, die views                      | an `image` node whose `src` is an SVG in the organization's `content/` folder                                                    |

**Stored names are data, not code.** `scene3d`, `spec`, `template`, `graph`, `graphView`, the scene
JSON (`IScene`) and the `{graph=…}` syntax live in saved content in dev and production. Renaming
any of them needs a migration of that content; everything else here can be renamed freely.

## Where the code lives

**`packages/ui/src/`**

- `three/` — the engine both 3D features share, and nothing feature-specific:
  - `stage.ts`: `Stage`, the abstract three.js stage — renderer, camera, orbit controls, lights,
    render-on-demand, resize, hover read-out (`IStagePoint`), keyboard turning, camera flights,
    `snapshot` (PNG) and `captureFrames` / `captureTurn` (GIF frames), `dispose`.
  - `snapshot.ts`: `drawFrame` / `composeImage` — the PNG or GIF frame with labels, a graph's typeset
    equation, the caption and the Acadimic mark (`brand.ts`).
  - `gif.ts`: `recordGif(recording, …)`; `turnRecording(stage)` turns once round.
  - `viewer-parts.tsx`: the toolbar, read-out, GIF progress and section titles both viewers use.
- `graph/` — equation graphs: `GraphStage` (`graph-stage.ts`) draws a sampled surface or curve
  (`mesh.ts`, `palettes.ts`), `graph-labels.ts` its axis ticks, `equation-image.ts` the typeset
  equation for downloads, `Graph3DViewer.tsx` the popup's body.
- `scene/` — 3D scenes: `SceneStage` (`scene-stage.ts`, steps and camera flights), `SceneBuilder`
  (`scene-builder.ts`, one group per object) with `scene-solids.ts` (whole, cut, nets),
  `scene-reasoning.ts` (die, cubeGrid, net), `scene-chemistry.ts` (molecule, atom, bond, lattice);
  `scene-steps.ts` (each step's state and the blend between two), `scene-labels.ts`,
  `scene-theme.tsx`; `Scene3DViewer.tsx` with `StepBar.tsx`, and `ScenePrintStill.tsx` for print.
- `content/` — `GraphButton.tsx` and `SceneCard.tsx` (what `RichTextView` renders), both opening
  `Viewer3DModal.tsx`; `RichTextImage.tsx` shows figures and **inverts drawn (SVG) figures in dark
  mode**. Only `RichTextView` is public: graphs and scenes are drawn by it, never imported by apps.
- `editor/` — `equation/GraphPanel.tsx` (a graph on an equation), `extensions/scene3d.ts` +
  `Scene3DNodeView.tsx` (the node, with Edit), `scene/SceneDialog.tsx` (gallery, form, preview,
  JSON) with `SceneForm.tsx` and `SceneGallery.tsx`.

Layering: `graph/` and `scene/` import from `three/`, never from each other; `three/` imports from
neither. three.js reaches a page only in the lazy chunks the two viewers load.

**`packages/shared/src/`** (public through `@repo/shared/utils` and `@repo/shared/ai`)

- `utils/graph/` — `expression.util.ts` (the safe expression compiler, `validateGraph`),
  `sample.util.ts` (sampling a surface or curve), `rich-text.util.ts` (graph attributes on nodes,
  used inside shared by the Markdown import).
- `utils/scene/` — `format.util.ts` (`parseScene`, limits, `sceneNumber`, the `scene3d` fence),
  `net.util.ts` (`foldCubeNet`), `chemistry.util.ts` (elements, VSEPR directions, lattice sites,
  `LATTICE_FACTS`), `aptitude.util.ts` (net, dice and painted-cube **questions** with solution
  scenes and answers), `catalog*.util.ts` (the editor gallery's **templates**: fields + `build`).
- `interfaces/scene3d.interface.ts` — the scene format, `IScene`.
- `ai/graphs.ts`, `ai/scenes.ts`, `ai/figures.ts` — the prompt rules (`GRAPH_RULES`, `SCENE_RULES`,
  `FIGURE_RULES`) and the reply checks (`checkMarkdownGraphs`, `checkMarkdownScenes`,
  `checkFigures`), all run by `checkMarkdownMath` in `ai/common.ts`.

**Elsewhere**

- `tools/course-agent/svg.mjs` — drawing helpers for figures (charts, geometry, solids, clocks,
  nets, die views, level curves; `transparent()` drops the white ground). To move into shared:
  `.claude/plans/FIGURES_2D.md`.
- `.claude/agents/course-builder.md` — how the course agent uses all three.

## Every content node reaches four paths

A node type must exist in all four, or it is lost on one (editor README §11): the editor extension,
`RichTextView`, `docToMarkdown` (`@repo/ui/editor`) and `richTextFromMarkdown`
(`@repo/shared/utils`). For scenes the Markdown is the fence; `richTextFromMarkdown` turns a fence
the parser accepts into a `scene3d` node and keeps any other as a code block. Printouts draw a scene
as a still at its first step (`ScenePrintStill`, waited on through `data-pending`).

## Checking a change

- `pnpm build:shared` before any consumer; then the ladder in the `verify-changes` skill.
- In the browser: the teaching app's Editor Lab presets "3D graphs", "3D scenes", "Aptitude" and
  "Molecules" exercise everything; open a scene, step it, download PNG and GIF, switch to dark mode,
  and print a course with a scene (`/courses/<id>/print`).
- Headless Chrome downloads are unreliable: patch `HTMLAnchorElement.prototype.click` and read the
  blob instead.
