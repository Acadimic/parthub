import { parseScene, SCENE_LIMITS } from '../utils/scene/format.util';
import type { IAiIssue } from './common';

/**
 * What the prompts tell a model about 3D scenes; one block shared by the lesson and paper prompts.
 * Plain strings, like `GRAPH_RULES`, so no `$` followed by `{` can become a template placeholder.
 */
export const SCENE_RULES = [
  '',
  'A 3D scene is a model the student turns, zooms and steps through: solids, planes, vectors, dice,',
  'cube nets, painted cubes, molecules and crystal unit cells. Add one where the idea is a 3D shape',
  'that a flat picture shows badly:',
  '- mensuration: a cone, cylinder, sphere, hemisphere, frustum, prism, pyramid, cube or cuboid,',
  '  especially when its slant height, cross-section or net matters;',
  '- 3D geometry: planes and the angle between them, lines, vectors and their sum, points with axes;',
  '- reasoning: folding a cube net, two or more views of a die, a painted cube cut into small cubes;',
  '- chemistry: the shape of a molecule (VSEPR), bonds built atom by atom, a unit cell and its atoms.',
  'Skip it where a flat figure or a 3D graph of an equation already says it. One scene per idea.',
  'In a quiz, a question must be answerable from its text alone, and its scene must not give the',
  'answer away: show the puzzle in the question and work it out in the solution, with steps. When',
  'the options are shapes to compare, each option may have its own scene, after its words.',
  'The numbers in a scene are the numbers in the text: a cone of radius 3 cm is radius 3 in the scene.',
  'How to write one: a fenced block with the language scene3d, holding one JSON object, on its own',
  'lines, e.g.',
  '```scene3d',
  '{ "version": 1, "title": "A cone", "sliders": [{ "name": "h", "label": "Height", "min": 2, "max": 8, "value": 4 }],',
  '  "objects": [{ "id": "cone", "type": "cone", "radius": 3, "height": "h" },',
  '    { "id": "l", "type": "segment", "from": [3, 0, 0], "to": [0, 0, "h"], "label": "l" }],',
  '  "steps": [{ "label": "The cone" }, { "label": "Cut it halfway up", "action": { "slice": "cone", "at": "h/2" } },',
  '    { "label": "Open its curved surface", "hide": ["l"], "action": { "unfold": "cone" } }] }',
  '```',
  'The format:',
  '- "version": 1, a short "title", "objects" (every object has a unique "id"), and optionally',
  '  "axes": true, "sliders" and "steps". z is up. A number may be a slider expression such as "h/2".',
  '- Geometry: point {position}, segment {from, to, dashed?}, line {through, direction},',
  '  vector {from?, to}, plane {point, normal, size?}, angle {between: [id, id], showValue?},',
  '  label {position, text}. Positions are [x, y, z].',
  '- Solids stand on their base at "position" (default the origin): cube {size}, cuboid {length,',
  '  width, height}, prism and pyramid {sides, radius, height}, cylinder and cone {radius, height},',
  '  frustum {radius, topRadius, height}, sphere and hemisphere {radius}.',
  '- Reasoning: die {size?, faces?: six labels in the order top, bottom, front, back, left, right};',
  '  cubeGrid {n: 2 to 6, painted?: faces, hidden?: [[column, row, layer], …]};',
  '  net {of: "cube", cells: six [row, column] squares that fold into a cube, labels?: six texts}.',
  '- Chemistry: molecule {shape, central, ligands, lonePairs?} with shape one of linear, bent,',
  '  trigonal-planar, trigonal-pyramidal, tetrahedral, trigonal-bipyramidal, see-saw, t-shaped,',
  '  square-planar, square-pyramidal, octahedral (H2O is bent with lonePairs 2, XeF2 linear with 3);',
  '  atom {element, position} and bond {from, to, order?} in ångström; lattice {cell: sc, bcc, fcc or',
  '  hcp, cells?: 1 to 3, element?, showShares?: true to cut each atom to its share of one cell}.',
  '- Any object may have "label", "colour" (primary, muted, foreground, chart-1 … chart-5) and',
  '  "opacity".',
  '- "sliders": up to 8 of { name, label, min, max, value }. "steps": up to 12 of { label, show?: [ids],',
  '  hide?: [ids], action?, camera? }; an action is one of { "slice": id, "at": height above the base },',
  '  { "unfold": id }, { "fold": id } (a net starts flat; fold folds it up), { "rotate": id, "axis":',
  '  "x" | "y" | "z", "angle": degrees }, { "highlight": id }. An object a step shows before any step',
  '  hides it starts hidden. Steps run in order and each lasts until a later step changes it.',
  `- At most ${SCENE_LIMITS.objects} objects and ${SCENE_LIMITS.bytes / 1000} KB of JSON. A scene that does not parse is kept as`,
  '  code, so check every id a step or angle names exists and every number is in range.',
].join('\n');

/** A ```scene3d fence; group 1 holds its body. */
const SCENE_FENCE = /^```scene3d[ \t]*\n([\s\S]*?)\n```[ \t]*$/gm;

/**
 * Checks every ```scene3d block in a field against the scene parser. Warnings, because the importer
 * keeps a scene it cannot read as a code block; they tell the teacher which scene and why.
 */
export const checkMarkdownScenes = (markdown: string, path: string, issues: IAiIssue[]) => {
  const pattern = new RegExp(SCENE_FENCE.source, 'gm');
  const text = markdown ?? '';
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const parsed = parseScene(match[1]);
    if (parsed.isValid) continue;
    const errors = parsed.errors.slice(0, 3).join(' ');
    issues.push({
      level: 'warning',
      path,
      message: `A 3D scene cannot be drawn, so it is kept as code: ${errors}${parsed.errors.length > 3 ? ` (and ${parsed.errors.length - 3} more)` : ''}`,
    });
  }
};
