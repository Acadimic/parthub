# Interactive 3D scenes in course content

Written 2026-10-08. Status: **phases 1–4 committed (5f58493, 3f72120, 17ab4cb, 06cc539); phase 5
built (2026-10-08), uncommitted;** phases 6–8 not started. Phase 5: `die`, `cubeGrid` and `net` drawn
by `graph/scene-reasoning.ts`; `foldCubeNet`/`oppositeNetSquares` in shared (`scene-net.util.ts`; the
parser rejects a net that does not fold); three templates with their answers in
`scene-templates.util.ts` (`cubeNetTemplate`, `diceTemplate`, `paintedCubeTemplate`,
`paintedCubeCounts`), each a question scene and a solution scene; the Editor Lab "Aptitude" preset.
`rotate` steps now compose in order (quaternions) and turn an object about its centre. Decided (Manish, 2026-10-08): scenes go in study materials,
questions and solutions, not answer options. Follows `GRAPH_3D.md`, whose viewer, popup,
sliders, PNG/GIF export, lazy loading and AI pipeline this reuses.

Equations can already open as 3D graphs. This plan adds the rest of what a course wants to show in
3D: solids and their nets, 3D geometry and vectors, cubes and dice for reasoning, molecules and
crystal lattices, and later simulations. It does that with two pieces:

- **A. Parametric surfaces** — a small extension of the equation graph, for shapes given by
  `(x(u,v), y(u,v), z(u,v))`: sphere, cone, torus, orbital shapes, the DNA double helix.
- **B. A 3D scene block** — one new content block that holds a short description of objects
  (solids, vectors, planes, atoms, labels), sliders and steps, written by a teacher or the AI and
  shown by the same viewer.

## 1. Decisions

| Question                            | Recommendation                                                                               | Why                                                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| One block or one block per subject? | **One `scene3d` block** with object types per subject                                        | One renderer, one popup, one export, one AI rule, one validator. A new subject is new object types, not a new pipeline.          |
| How is a scene described?           | **A small JSON format** (§4), versioned                                                      | Validatable in `packages/shared`, writable by the AI the way `figures` SVGs are, readable by a teacher.                          |
| Where does it live in a document?   | **A block node `scene3d`** with `spec` (the JSON, as a string) and `caption`                 | Node attributes must be primitives (`rich-text.interface.ts`); a JSON string is one, and it keeps the four content paths simple. |
| How does it arrive in Markdown?     | **A fenced block** ` ```scene3d ` holding the JSON                                           | The AI already writes fenced blocks; the reader learns one language tag. Today it ignores the tag, so this is a small change.    |
| Can numbers move?                   | **Yes: any number may be an expression of the sliders** (`"height": "h"`, `"radius": "r/2"`) | Reuses the graph expression compiler; one rule covers every object.                                                              |
| Molecules from coordinates?         | **No — from named shapes** (`tetrahedral`, `octahedral`…)                                    | Models get 3D coordinates wrong; a named VSEPR shape is drawn exactly by code. Coordinates stay possible for teachers.           |
| Teacher editing in v1?              | **Templates + a form for their key numbers**, JSON behind "Advanced" (recommended, §12)      | Most scenes come from the AI; teachers change numbers. A visual builder is a project of its own.                                 |
| Print?                              | **A still picture of the scene at its first step** (recommended, §12)                        | WebGL cannot print, but a printed mensuration question needs its figure; the PNG drawing already exists.                         |

## 2. Where it is used first

Ordered by how much content the courses have and how much 3D helps it:

1. **CBSE solids and mensuration** (Class IX–X): cone, cylinder, sphere, frustum; slicing; the net
   unfolding; volume by slices.
2. **Aptitude cubes and dice** (non-verbal reasoning course): fold a net into a cube, a die's
   opposite faces, painted-cube counting, cutting a cube into smaller cubes.
3. **3D geometry and vectors** (Class XI–XII): lines and planes, the angle between them, vector
   sum, cross product, projection.
4. **Chemistry** (Class XI–XII): VSEPR shapes, hybridisation, isomers; unit cells (simple,
   body-centred, face-centred cubic) and atoms shared at corners and faces. Orbitals via piece A.
5. **Later**: physics simulations (projectile, field lines, pendulum), astronomy (orbits, seasons,
   Moon phases), geography (globe, time zones), biology (uploaded 3D models).

## 3. Piece A — parametric surfaces

The graph expression language gains one shape: three parts in `u` and `v`.

```
$$x^2 + y^2 + z^2 = 9$${graph=(3*cos(u)*sin(v),3*sin(u)*sin(v),3*cos(v)) u=0..2*pi v=0..pi}
```

- **Kind detection**: three top-level parts using `u`/`v` → parametric surface; using `t` → curve
  (as today). Ranges `u=` and `v=` in `graphView`, default `0..2*pi`.
- **Drawing**: the surface mesh builder already works on a grid; it is fed `(x, y, z)` per grid
  point instead of `(x, y, f(x, y))`.
- **Unlocks**: spheres, cones, cylinders, tori, surfaces of revolution, the DNA double helix (two
  helices plus rungs as a ribbon), s/p/d orbital shapes as `r(θ, φ)` surfaces.
- **AI rule**: the "3D graphs" section gains one line and an example; the sphere note changes from
  "graph its upper half" to "use the parametric form".

Small: the shared compiler, the sampler and one branch in the scene builder. About a day.

## 4. Piece B — the scene format (version 1)

```json
{
  "version": 1,
  "title": "Volume of a cone",
  "axes": false,
  "sliders": [{ "name": "h", "label": "height (cm)", "min": 1, "max": 8, "value": 4 }],
  "objects": [
    { "id": "cone", "type": "cone", "radius": 3, "height": "h", "colour": "primary" },
    { "id": "axis", "type": "segment", "from": [0, 0, 0], "to": [0, 0, "h"], "dashed": true, "label": "h" },
    { "id": "r", "type": "segment", "from": [0, 0, 0], "to": [3, 0, 0], "label": "r = 3 cm" }
  ],
  "steps": [
    { "label": "The cone", "show": ["cone", "axis", "r"] },
    { "label": "Cut horizontally", "action": { "slice": "cone", "at": "h/2" } },
    { "label": "Unfold the curved surface", "action": { "unfold": "cone" } }
  ]
}
```

**Common to every object**: `id` (unique, used by steps), `label` (shown beside it), `colour` (a
theme role — `primary`, `muted`, `chart-1`…`chart-5` — so scenes follow light and dark), `opacity`,
`position` and `rotation` where they make sense. Any number may be a slider expression.

**Object types**, grouped by what they serve:

| Group     | Types                                                                                                                                                                                                                                                                                                 | Notes                                                                                            |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Geometry  | `point`, `segment`, `line`, `vector`, `plane`, `angle`                                                                                                                                                                                                                                                | `vector` draws an arrow; `angle` marks the angle between two ids with its value                  |
| Solids    | `cube`, `cuboid`, `prism`, `pyramid`, `cylinder`, `cone`, `frustum`, `sphere`, `hemisphere`                                                                                                                                                                                                           | Each knows its net and its cross-section, used by the `unfold` and `slice` actions               |
| Reasoning | `die` (faces 1–6 or labels), `cubeGrid` (n×n×n, painted faces, hidden cubes), `net` (a flat net that folds)                                                                                                                                                                                           | Built for the aptitude question styles that are hard to picture                                  |
| Chemistry | `molecule` (`shape`: `linear`, `bent`, `trigonal-planar`, `trigonal-pyramidal`, `tetrahedral`, `trigonal-bipyramidal`, `see-saw`, `t-shaped`, `square-planar`, `octahedral`; `central`, `ligands`, `lonePairs`), `atom`, `bond`, `lattice` (`cell`: `sc`, `bcc`, `fcc`, `hcp`; `cells`; `showShares`) | Element colours and radii from the standard CPK table; shared-atom fractions labelled on request |
| Text      | `label`                                                                                                                                                                                                                                                                                               | Free text at a point, for notes the objects do not carry                                         |

**Steps** are optional. Each one names what to `show` or `hide`, an optional `action` (`slice`,
`unfold`, `fold`, `rotate`, `highlight`) and an optional `camera`. The learner moves with Previous
and Next, or plays them. A scene with no steps shows everything at once.

**Limits**, checked on import: at most 60 objects, 8 sliders, 12 steps and 20 KB of JSON; ids
unique; every id a step names exists; every slider a number names exists.

## 5. Storage and the content paths

A node type has to exist in four places or it is lost on one path (editor README §11):

1. **Editor** — `editor/extensions/scene3d.ts`, an atomic block with `spec` and `caption`, and a
   node view showing the card (below) with Edit.
2. **Reading view** — `RichTextView` renders the card: a cube icon, the title and caption, the
   step count, and **Open in 3D**, which opens the same popup the graphs use.
3. **Markdown out** — a ` ```scene3d ` fence holding the JSON, then the caption as the next
   paragraph.
4. **Markdown in** — `readFence` reads the fence's language tag; `scene3d` with valid JSON becomes
   the node, anything else stays a code block as today.

The plain-text projection gets the title and caption, so search finds a scene.

## 6. Rendering

- **Shared format and validation** in `packages/shared/src/utils/scene3d.util.ts`: the types, a
  parser that returns the scene or the reasons it is not valid, and the solid geometry that does not
  need three.js (net layouts, cross-section shapes, molecule shapes, lattice positions), so the AI
  validators and the course agent can check scenes without a browser.
- **Drawing** in `packages/ui/src/graph/`, beside the graph code: a `scene-builder.ts` that turns
  objects into three.js meshes, lines and labels. It reuses the scene's camera, controls, lighting,
  axis frame, label layer, palettes, hover read-out and dispose logic.
- **Popup** — the existing `GraphModal` grows a scene mode: the canvas, the sliders, a step bar
  (Previous / step label / Next / Play) under the canvas, and the PNG and GIF buttons. A GIF of a
  scene with steps plays the steps; without steps it turns once round, as graphs do.
- **Loading** — nothing new reaches a page until a scene is opened (the same lazy chunk).

## 7. Teacher editing

- **Insert 3D scene** in the editor toolbar opens a template gallery: cone with slice and net, cube
  net folding, die, painted cube grid, two planes and their angle, vector sum, tetrahedral molecule,
  FCC unit cell, sphere (piece A).
- The chosen template opens with a **form for its key numbers** (radius, height, slider ranges,
  painted faces, labels) beside the live scene; the teacher never needs to see JSON. An
  **Advanced** link shows the JSON with inline errors from the shared parser, for staff and unusual
  scenes. Only a valid scene is saved, as with graphs.
- A visual builder (place and drag objects in 3D) is out of version 1.

## 8. AI generation

- **Prompt rules** — a "3D scenes" section beside "Figures" and "3D graphs" in the lesson and
  test-paper prompts: when to add one (a solid whose net or section matters, a cube or dice
  question, a molecule's shape, a unit cell, two planes or vectors in space), the format with two
  short examples, the limits, and the rule that a question must be answerable without opening it.
  The course-builder agent gets a matching section and a list of the templates to start from.
- **Validator** — `checkScenes` runs the shared parser on every ` ```scene3d ` block in a
  reply: a scene that does not parse or breaks a limit is a warning naming the problem, and the
  importer keeps it as a code block, so nothing broken reaches a learner.
- **Consistency** — the numbers a question states (radius 3 cm, height 4 cm) must be the numbers in
  its scene; the course agent's review checks this the way it checks figures against their text.

## 9. Phases

| #   | Phase                                     | Done when                                                                                                                                          |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Parametric surfaces** (piece A)         | Sphere, torus, cone and a p orbital draw from `{graph=…}`; AI rule updated; Editor Lab sample.                                                     |
| 2   | **Scene format and parser** in shared     | Types, parser, limits and slider expressions, with scratch checks for every object type and every error message.                                   |
| 3   | **Block and viewer: geometry and solids** | `scene3d` through the four paths; card and popup; `point`…`angle` and all solids; sliders; PNG export; a still picture of each scene in printouts. |
| 4   | **Steps: slice, unfold, fold**            | Previous/Next/Play; the cone and cube nets unfold and fold; GIF plays the steps.                                                                   |
| 5   | **Reasoning objects**                     | `die`, `cubeGrid`, `net`; three aptitude question templates.                                                                                       |
| 6   | **Chemistry objects**                     | `molecule` (all named shapes), `atom`, `bond`, `lattice` with shared fractions.                                                                    |
| 7   | **Teacher editing**                       | Template gallery, a form for each template's key numbers with live preview, and the JSON behind "Advanced", in the teaching app.                   |
| 8   | **AI rules and validator**                | Prompt sections, `checkScenes`, course-agent section; one generated mensuration lesson and one aptitude quiz imported with scenes.                 |

Phases 1 and 2 can be built at the same time. Each phase ends with the verification ladder
(`build:shared`, typecheck, lint, build) and a browser check in the Editor Lab.

## 10. Effort and risks

| Phase | Effort    | Main risk                                                                                                                  |
| ----- | --------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1     | ~1 day    | Orbital shapes need care to look right (signs of lobes as two colours).                                                    |
| 2     | ~1–2 days | Getting the format small enough for the AI to write reliably. Mitigation: templates and named shapes over raw coordinates. |
| 3     | ~3 days   | Label placement on many objects without clutter.                                                                           |
| 4     | ~3 days   | Unfolding animation of curved solids (cone, cylinder) — the hardest drawing work in the plan.                              |
| 5     | ~2 days   | Matching every common exam variant of dice and painted cubes.                                                              |
| 6     | ~2–3 days | Lone pairs and bond angles must be chemically exact; checked against a reference per shape.                                |
| 7     | ~2–3 days | A JSON editor is fine for staff but not for every teacher; the visual builder is the later fix.                            |
| 8     | ~2 days   | Models writing scenes whose numbers drift from the question; the consistency check is the guard.                           |

About three to four weeks for all of it; phases 1–4 alone (about two weeks) already cover
mensuration and 3D geometry.

## 11. Checks before calling a phase done

- Every object type draws in light and dark themes, at phone width, and in PNG and GIF exports.
- A scene round-trips through the editor, Markdown export and import, and an AI reply, unchanged.
- A broken scene never throws past the parser: bad JSON, unknown types, missing ids, limits.
- Opening and closing twenty scenes leaks no WebGL context (as for graphs).
- Steps work by keyboard; the popup closes by button, Escape, outside click and back.
- Nothing three.js reaches a page until a scene is opened.

## 12. Decisions and open questions

Asked 2026-10-08.

1. **Which subject first** — recommended: **mensuration and 3D geometry**. It is the largest block of
   CBSE content that gains from 3D, and its pieces (solids, slicing, unfolding) are what the others
   reuse: a die is a cube, a folding net is unfolding run backwards. Aptitude follows cheaply, then
   chemistry. **Decided (Manish, 2026-10-08).**
2. **Teacher editing** — recommended: **templates plus a small form for the key numbers** (radius,
   height, slider range, painted faces) with a live preview; the raw JSON behind an "Advanced" link
   for staff; a drag-and-drop builder only if teachers ask. About a day more than JSON alone, and
   usable by any teacher. **Decided (Manish, 2026-10-08).** Reflected in §1, §7 and phase 7.
3. **Where scenes appear** — **decided (Manish): study materials, questions and solutions; not
   answer options.**
4. **Print** — recommended: **a still picture of each scene at its first step**, drawn by the print
   page before it opens the print dialog, built with phase 3 so printed mensuration papers keep their
   figure. The same mechanism can later give 3D graphs a picture in print. _Awaiting
   confirmation._ Reflected in §1 and phase 3.
