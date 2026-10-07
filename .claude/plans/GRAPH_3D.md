# 3D graphs of equations

Written 2026-10-07. Status: **all five phases built 2026-10-07, uncommitted.** Review it in the
teaching app's Editor Lab (`/editor`, "3D graphs" sample). Results of the checks are under §9.
Decisions from Manish (2026-10-07):

- Three.js, chosen for load speed and a learner experience that matches the apps, over Plotly.js.
  The side-by-side demo that informed it: https://claude.ai/artifact/UeUu5dP82RRkrgq51XQxcx.
- A graph is **a property of an equation**, not a separate block: any equation that carries one
  shows a cube icon, wherever it appears — study material, questions, answer options, solutions.
- The reading view shows only the static cube icon next to the equation; the graph opens in a modal.
- Up to **three sliders** (`a`, `b`, `c`).

## 1. Decisions

| Question                    | Decision                                                                                                                                                                                                                                            |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renderer                    | **Plain `three` + `OrbitControls`**, in a `useEffect`. No react-three-fiber or drei: one viewer in a modal gains nothing from a second React renderer, and both add bundle weight.                                                                  |
| Plotly.js                   | Rejected. Several times the download for one surface, a data-analysis look that is hard to restyle, and nothing beyond what it ships.                                                                                                               |
| Desmos 3D / GeoGebra embeds | Rejected. Commercial use needs a paid licence, and they are third-party iframes.                                                                                                                                                                    |
| Where a graph lives         | **Two new attributes on the existing equation nodes** (`inlineMath`, `blockMath`). No new node type, so every place that already renders an equation can show a graph, options included.                                                            |
| What is plotted             | **A plain expression stored beside the LaTeX** (`graph: "a*(x^2 - y^2)"`), not the LaTeX itself. LaTeX is written for reading and is ambiguous to compute (`f(x)`, `xy`, `\frac{dy}{dx}`); the editor pre-fills the expression from the LaTeX (§5). |
| Pre-fill from LaTeX         | `graphExpressionFromLatex` in `@repo/shared/utils`, a small LaTeX → expression rewrite (fractions, roots, powers, functions, `\cdot`, `\pi`), not MathLive's `ascii-math` output: it needs no MathLive instance and the validators can use it.      |
| Evaluating it               | A ~150-line recursive-descent parser that compiles the expression to closures over a fixed list of functions and constants. No `eval`, no `Function`, nothing outside that list. It is the parser the demo already runs.                            |
| Loading                     | Three.js loads **only when the modal opens**, as a separate chunk. Hovering or focusing the icon starts the import, so it is usually ready by the click. A page whose graphs nobody opens downloads none of it.                                     |

## 2. Scope of version 1

| Kind    | Expression                                         | Variables | Rendered as                                   |
| ------- | -------------------------------------------------- | --------- | --------------------------------------------- |
| Surface | `z = f(x, y)`, e.g. `a*(x^2 - y^2)/4`              | `x`, `y`  | a coloured mesh, height mapped to a colourmap |
| Curve   | `(x(t), y(t), z(t))`, e.g. `(cos(t), sin(t), t/4)` | `t`       | a tube along the curve                        |

- **Sliders**: up to three parameters, `a`, `b` and `c`. The modal shows one slider for each that
  the expression actually uses, so `sin(x)*cos(y)` shows none and `a*sin(b*x)` shows two.
- **Defaults**: `x` and `y` run `-4..4`, `t` runs `0..2π`, each parameter starts at 1 on `0.1..3`.
  The teacher can change any of them.
- **Functions**: `sin cos tan asin acos atan sinh cosh tanh exp log ln sqrt abs`; constants `pi`,
  `e`; `^` or `**`; implicit multiplication (`2x`, `3(1-x)`, `2sin(t)`).

Out of version 1: parametric surfaces, implicit surfaces (`x²+y²+z²=4`), several graphs in one
view, 2D graphs, animating a parameter. Each is listed in §8 with what it needs.

## 3. The equation attributes

`IRichTextNode.attrs` holds primitives only (`rich-text.interface.ts`), so both are strings:

| Attr        | Type           | Notes                                                                                                    |
| ----------- | -------------- | -------------------------------------------------------------------------------------------------------- |
| `graph`     | string \| null | the expression to plot. `null` (the default) means the equation has no graph. Its shape decides the kind |
| `graphView` | string \| null | ranges and slider settings that differ from the defaults, e.g. `x=-2..2 y=-2..2 a=1[0.1..5]`             |

`graphView` uses the attribute syntax the content already has (`parseMarkdownAttrs` /
`formatMarkdownAttrs` in `pronunciation.util.ts`): `x`, `y`, `t` take `min..max`; `a`, `b`, `c` take
`value[min..max]`. Anything left out takes the default, so most graphs store no `graphView` at all.
The kind is derived from `graph` (three top-level parts → curve), never stored, so an edited
expression cannot disagree with it.

**Markdown** carries them in braces right after the equation, the way a pronunciation span carries
its attributes:

```
The saddle $z = a(x^2 - y^2)${graph="a*(x^2 - y^2)" a=1[0.1..3]} has no maximum.

$$ \vec r(t) = (\cos t, \sin t, t/4) $${graph="(cos(t), sin(t), t/4)" t=0..12.57}
```

The four paths every content change has to reach (editor README §11), each a small edit rather
than a new node:

1. **Editor** — `editor/extensions/math-nodes.ts` declares the two attrs on both nodes;
   `MathNodeView.tsx` shows the cube icon on an equation that has a graph.
2. **Reading view** — wherever `RichTextView` renders `inlineMath` and `blockMath` (through
   `MathRender`), an equation with `graph` renders `GraphIcon` beside it.
3. **Markdown out** — the math serializer in `markdown/doc-to-markdown.ts` appends `{graph=… …}`
   when `graph` is set.
4. **Markdown in** — the inline and display math readers in
   `@repo/shared/src/utils/rich-text.util.ts` read an optional `{…}` after the closing `$` or `$$`.

The plain-text projection (`IRichText.text`) is unchanged: it already holds the LaTeX. The server
stores the document as it is, so it needs no change.

## 4. Where the code lives

```
packages/shared/src/utils/graph-expression.util.ts   parser, compiler, kind detection, graphView read/write, sampling
packages/ui/src/graph/                                the Three.js viewer (lazy chunk)
  Graph3DViewer.tsx      canvas, controls, axes, labels, hover, sliders, dispose on unmount
  scene.ts               mesh/tube builders, colourmap, label projection: plain TS, no React
packages/ui/src/content/GraphIcon.tsx                 the cube icon button + the modal that lazy-loads the viewer
packages/ui/src/editor/equation/GraphPanel.tsx        the "3D graph" section of the equation editor, with a live preview
```

- **The evaluator is in `packages/shared`**, not `packages/ui`: it is pure TypeScript, and the AI
  validators and `tools/course-agent` need it to reject a graph that does not compile or plots
  nothing finite. Export it from `@repo/shared/utils`.
- **No new `@repo/ui` subpath.** Both consumers (the icon in the reading view and the panel in the
  editor) are inside `packages/ui`, so they reach the viewer with a relative dynamic
  `import('../graph/Graph3DViewer')` through `React.lazy`, which Next splits into its own chunk. This
  follows `core/MathField`, which already does `await import('mathlive')`.
- **Dependency**: `pnpm --filter @repo/ui add three` and `-D @types/three`, pinned exactly (read
  `upgrade-a-dependency` first). The server and `packages/shared` never see it.

## 5. The experience

**Reading view (learning app, and teaching's preview).** An equation with a graph shows a small
cube icon right after it — inline after an inline equation, at the right end of a display
equation's line. It is a real button (`aria-label="Open 3D graph of this equation"`, a 32px touch
target, a tooltip "View in 3D"). Nothing else changes about the equation, and nothing heavy renders
until the icon is clicked.

- **In an answer option** the click must not select the option: the icon's handler stops the event
  from reaching the option's click and keyboard handlers.
- **In a timed test** the modal opens over the question; closing it returns to the same place and
  the timer keeps running.
- **Printing** hides the icon (`print:hidden`); the equation prints as it does today. No placeholder.

**The popup** (`Modal` from `@repo/ui/core` with `position="center"`, added for this): a centred
window over a dimmed page on a laptop, full screen on a phone, with a full-screen toggle. The header
is the title and the close button; the footer carries the typeset equation, a one-line description
and the toggle. It closes on the close button, Escape (first press — focus starts on the popup, not
on a control with a tooltip), a click outside, and the back button; focus returns to the cube.

- Drag to rotate, scroll or pinch to zoom, right-drag or two-finger drag to pan; damping on.
- Arrow keys rotate (`controls.listenToKeyEvents`), and on-screen **Reset view** and **Spin**
  buttons, so it is usable without a mouse. Spin is off by default and never starts under
  `prefers-reduced-motion`.
- Hover (or tap, on touch) shows `x, y, z` with a marker on the surface.
- One labelled slider per parameter used, showing its value; the graph reshapes as it moves.
- Axes, a floor grid, a bounding box and tick labels in the theme's colours, re-read when the theme
  changes. Colours come from the shadcn tokens, not literals (`style-with-tailwind`).
- A one-line status while the chunk loads, and a plain message if WebGL is unavailable.

**Performance rules**, all already in the demo:

- render on demand: a frame only when the camera, a slider or the size changes;
- one geometry per graph, rewritten in place when a slider moves, never reallocated;
- grid capped at 80×80 for surfaces, 400 points for curves; pixel ratio capped at 2;
- on close, dispose geometry, materials and controls, then `renderer.dispose()` and
  `forceContextLoss()`, so opening many graphs never leaks a WebGL context.

**Editor (teaching app).** The existing equation editor (`equation/EquationEditor.tsx`) gains a
**3D graph** switch. Turning it on opens `GraphPanel`:

- the **expression** field, **pre-filled from the equation** — MathLive's `ascii-math` output of the
  LaTeX, passed through the shared parser. Where that converts cleanly (most school equations) the
  teacher changes nothing; where it does not, the field is left for the teacher to type, with the
  parser's message saying what is wrong ("Unknown name "xy". Write x*y for a product.");
- ranges and slider settings, collapsed under "Adjust view" since the defaults usually suit;
- the live viewer as a preview.

Saving is blocked until the expression compiles and plots at least one finite point. Turning the
switch off clears both attributes. In the editor, an equation with a graph shows the same cube icon,
so a teacher can see at a glance which equations have one. The Editor Lab (`/editor`) gets examples
in `modules/editor/lib/sample.ts`: a surface, a curve, and an option-style inline equation.

## 6. AI generation

- **Prompts**: add a short rule to the study-material and test-paper prompts in
  `packages/shared/src/ai/`: when seeing an equation in 3D helps, follow it with
  `{graph="…"}` in this expression syntax; only surfaces in `x, y` and curves in `t`, parameters
  `a`, `b`, `c`.
- **Validators**: the reply validator compiles each `graph` with the shared evaluator and samples
  it; one that fails to compile or plots nothing finite is an error the teacher sees, the same as a
  broken equation today. The course agent CLI gets this for free through `@repo/shared/ai`.

## 7. Phases

| #   | Phase                   | Done when                                                                                                                                                                                           |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Evaluator**           | `graph-expression.util.ts` in shared, with scratch checks: every demo preset, implicit multiplication, precedence (`-x^2`, `2^-x`), parameters `a b c`, `graphView` read/write, each error message. |
| 2   | **Viewer**              | `packages/ui/src/graph/` ported from the demo into a component with up to three sliders; tried in the Editor Lab on a hard-coded expression, in both themes and at phone width.                     |
| 3   | **Attributes + editor** | the four paths of §3, the icon in the editor, `GraphPanel` with pre-fill and preview; a graph survives save → reload → Markdown export → Markdown import unchanged.                                 |
| 4   | **Reading view**        | the icon and modal in the learning app's lessons, questions, options and solutions; selecting an option still works; the Three.js chunk is absent until the icon is used (checked in DevTools).     |
| 5   | **AI**                  | the prompt rule and the validator; one generated lesson and one generated test paper with graphs imported through the teaching app.                                                                 |

Each phase ends with the `verify-changes` ladder: `build:shared`, typecheck, lint, build of every
affected workspace.

## 8. Later, when asked for

| Feature                             | What it needs                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------------- |
| Parametric surfaces (sphere, torus) | a third kind with `u, v` ranges; the surface mesh builder already handles a grid          |
| Implicit surfaces (`F(x,y,z)=0`)    | a small marching-cubes pass over a ~48³ grid; move it to a Web Worker if slow phones jank |
| Several graphs in one view          | `graph` holding several expressions separated by `;`, each with its own colour            |
| Animating a parameter               | a play button on a slider                                                                 |
| 2D graphs `y = f(x)`                | the same attributes and evaluator with an SVG renderer, no Three.js                       |

## 9. Checks before calling it done

Results, 2026-10-07, in Chrome through Playwright against the teaching app's Editor Lab:

| Check | Result                                                                                                                                                                                                                                                                   |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1    | Passed. Three.js is its own chunk, 141 KB gzipped (teaching and learning production builds), fetched only on the first open.                                                                                                                                             |
| C2    | Passed. 20 opens and closes leave no canvas in the page and no WebGL warning in the console.                                                                                                                                                                             |
| C3    | Passed on desktop. Frames hold at 16.7 ms (p95 and max) while a slider is driven at 80×80. Not measured on a real mid-range phone.                                                                                                                                       |
| C4    | Passed in an emulated Pixel 7: a tap reads the point. A lifted finger fires `pointerleave`, which had wiped the value; fixed. Not yet tried on real iOS Safari or Android devices.                                                                                       |
| C5    | Passed. Tab to the cube, Enter opens, arrow keys and + turn and zoom, Escape closes.                                                                                                                                                                                     |
| C6    | Passed. Both themes legible after the viewer was given an explicit text colour (the modal renders outside the themed wrapper).                                                                                                                                           |
| C7    | Passed. Editor → Markdown → import keeps every graph; an AI reply's graphs import, and a graph that cannot be drawn is dropped with a warning while its equation stays.                                                                                                  |
| C8    | Passed. In an option row built like the exam's (`label` + radio), a click or Enter on the cube and use of the graph leave the radio unchecked; clicking the row still selects it. Not run on a real test paper: adding a graph to a dev question needs a database write. |
| C9    | Passed. Unknown names, unbalanced brackets, `1/x`, and expressions with nothing to draw all give a message and never reach the document.                                                                                                                                 |

The original checklist:

- **C1** Three.js is a separate chunk: a lesson page with graphs loads no Three.js until an icon is
  used. Record the chunk's gzipped size here.
- **C2** Opening and closing the modal twenty times leaves no extra WebGL contexts (the console
  warns past ~16) and the JS heap returns to its starting level.
- **C3** A redraw on a slider stays under one frame (16 ms) at 80×80 on a mid-range phone.
- **C4** Touch: rotate, pinch and tap readout work on iOS Safari and Android Chrome, and the page
  behind the modal does not scroll.
- **C5** Keyboard: the icon can be reached and opened, and the modal rotated, reset and closed,
  without a mouse.
- **C6** Both themes: axes, labels, grid and tooltip are legible, and switching theme with the modal
  open recolours them.
- **C7** A graph round-trips through Markdown export and import, and through an AI reply, unchanged;
  an equation without a graph serializes exactly as it does today.
- **C8** In an answer option, clicking or pressing Enter on the icon opens the graph and does not
  select or submit the option.
- **C9** Bad input never throws past the editor: unknown names, unbalanced brackets, division by
  zero (`1/x`), and expressions that are infinite everywhere.
