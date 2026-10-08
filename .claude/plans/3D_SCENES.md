# Interactive 3D scenes in course content

**Status: done** (2026-10-08). All eight phases are built; this file keeps the decisions and what is
left. How the code is organised is `packages/ui/src/three/README.md`; the content model is the
editor README §3d; the format is `IScene` in `packages/shared/src/interfaces/scene3d.interface.ts`,
checked by `parseScene` (limits in `SCENE_LIMITS`: 60 objects, 8 sliders, 12 steps, 20 KB of
compact JSON).

| Phase                                                                      | Commit    |
| -------------------------------------------------------------------------- | --------- |
| 1. Parametric surfaces (a fourth graph kind)                               | `5f58493` |
| 2. The scene format and parser, in shared                                  | `3f72120` |
| 3. The `scene3d` block, card, popup, solids and geometry, print still      | `17ab4cb` |
| 4. Steps: slice, unfold, fold, rotate, highlight, camera; steps GIF        | `06cc539` |
| 5. Dice, painted cubes, cube nets; aptitude question builders with answers | `d7bb495` |
| 6. Molecules, atoms, bonds, unit cells; chemistry answer keys              | `12a01ec` |
| 7. Teacher editing: template gallery, form, preview, JSON, Edit; auto-play | `30c7b9c` |
| 8. AI prompt rules, `checkMarkdownScenes`, course-agent section            | `11afbfa` |
| Afterwards: steps list beside a scene, no empty side panel                 | `230004c` |

## Decisions

| Question                       | Decision                                                                                          | Why                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| One block or one per subject?  | **One `scene3d` block**, object types per subject                                                 | One renderer, popup, export, AI rule and validator; a new subject is new object types.  |
| How is a scene described?      | **A small versioned JSON format**                                                                 | Checkable in shared, writable by the AI, readable by a teacher.                         |
| Where does it live?            | **A block node** with `spec` (the JSON as a string) and `template` (the editor form it came from) | Node attributes must be primitives. The scene's own `title` serves as its caption.      |
| In Markdown?                   | **A ` ```scene3d ` fence**                                                                        | The AI already writes fences; a fence the parser refuses stays a code block.            |
| Can numbers move?              | **Any number may be a slider expression** (`"h/2"`)                                               | Reuses the graph expression compiler.                                                   |
| Molecules?                     | **From named VSEPR shapes**, not coordinates                                                      | Models get coordinates wrong; atoms and bonds stay possible for teachers.               |
| Subject order                  | **Mensuration and 3D geometry first**, then aptitude, then chemistry                              | Its pieces (solids, slicing, unfolding) are what the others reuse. (Manish, 2026-10-08) |
| Teacher editing                | **Templates with a form for their key numbers**, JSON behind "Advanced"                           | Most scenes come from the AI; teachers change numbers. (Manish, 2026-10-08)             |
| Where scenes appear            | **Every editor**, answer options included                                                         | First study material, questions and solutions; widened by Manish the same day.          |
| Print                          | **A still of the first step**                                                                     | WebGL cannot print; printed questions need their figure.                                |
| Opening                        | **Plays its steps at once** for a reader; not in the teacher's preview or with reduced motion     | Asked by Manish.                                                                        |
| A first mention that is `show` | **The object starts hidden**                                                                      | Lets a step reveal it.                                                                  |
| Questions with a scene         | **The puzzle also as a flat figure** in the text                                                  | A scene opens behind a click; the question must be answerable without it.               |

## Checks that still apply to any change

- Every object type draws in light and dark themes, at phone width, and in PNG and GIF exports.
- A scene round-trips through the editor, Markdown export and import, and an AI reply, unchanged.
- A broken scene never throws past the parser: bad JSON, unknown types, missing ids, limits.
- Opening and closing twenty scenes leaks no WebGL context.
- Nothing three.js reaches a page until a scene is opened.

## Later, when asked for

A drag-and-drop scene builder; physics simulations (projectile, field lines, pendulum); astronomy
(orbits, seasons, Moon phases); geography (globe, time zones); biology (uploaded 3D models).
