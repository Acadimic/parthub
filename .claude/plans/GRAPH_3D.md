# 3D graphs of equations

**Status: done** (2026-10-07; first commit `3d9cf01`, then `3597de8` agent rules, `32322d4` PNG with
the typeset equation, `2b12aef` GIF, `0274d47` the Acadimic mark; parametric surfaces came with
`5f58493`). This file keeps the decisions and what is left; how the code is organised is
`packages/ui/src/three/README.md`, and the content model is the editor README §3c.

## Decisions

| Question                       | Decision                                                                                                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Renderer                       | **Plain `three` + `OrbitControls`.** No react-three-fiber or drei: one viewer in a modal gains nothing from a second React renderer, and both add bundle weight.                            |
| Plotly.js, Desmos 3D, GeoGebra | Rejected: several times the download, a look that is hard to restyle, or a paid licence for a third-party iframe.                                                                           |
| Where a graph lives            | **Two attributes on the existing equation nodes** (`graph`, `graphView`), not a new node, so every place that shows an equation can show its graph, answer options included.                |
| What is plotted                | **A plain expression stored beside the LaTeX** (`a*(x^2 - y^2)`), not the LaTeX itself, which is ambiguous to compute. The editor pre-fills it from the LaTeX (`graphExpressionFromLatex`). |
| Evaluating it                  | A small recursive-descent parser compiling to closures over a fixed list of functions. No `eval`, no `Function`.                                                                            |
| Loading                        | three.js loads only when a graph is opened, as its own chunk; hovering the cube starts the download.                                                                                        |
| Sliders                        | Up to three parameters, `a`, `b`, `c`, each a quantity the text names.                                                                                                                      |
| Popup                          | The core `Modal`, centred, above a full-screen exam (`z-[1400]`); the back button closes it.                                                                                                |

## Kinds drawn

Surfaces `z = f(x, y)`, curves `(x(t), y(t), z(t))`, and parametric surfaces
`(x(u,v), y(u,v), z(u,v))` (spheres, cones, tori, orbitals) at true scale.

## Later, when asked for

| Feature                          | What it needs                                                               |
| -------------------------------- | --------------------------------------------------------------------------- |
| Implicit surfaces (`F(x,y,z)=0`) | a marching-cubes pass over a ~48³ grid, in a Web Worker if slow phones jank |
| Several graphs in one view       | `graph` holding several expressions separated by `;`, each its own colour   |
| Animating a parameter            | a play button on a slider                                                   |
| 2D graphs `y = f(x)`             | the same attributes and evaluator with an SVG renderer, no three.js         |
| A graph in print                 | a still of the graph, as scenes already have (`ScenePrintStill`)            |
