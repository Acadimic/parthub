import { validateGraph } from '../utils/graph-expression.util';
import { parseMarkdownAttrs } from '../utils/pronunciation.util';
import type { IAiIssue } from './common';

/**
 * What the prompts tell a model about 3D graphs; one block shared by the lesson and paper prompts.
 *
 * Plain strings rather than a template literal on purpose: the examples hold a `$` followed by `{`,
 * which a minifier folding a template literal turned into a live `${…}` placeholder, and the
 * teaching build failed with "x is not defined".
 */
export const GRAPH_RULES = [
  '',
  'An equation can open as an interactive 3D graph that the student turns and reshapes with sliders.',
  'Add one to every equation whose shape is the point — in maths, physics and the other sciences,',
  'wherever one of these appears:',
  '- a function of two variables or a surface: paraboloid, saddle, plane z = ax + by + c, cone, waves,',
  '  a hill with a maximum, minimum or saddle point, a partial derivative or tangent plane;',
  '- a curve in space given by parametric equations: a line through a point in a direction, a helix, a',
  '  projectile or charged-particle path;',
  '- a quantity spread over a plane: the potential or field strength of charges, temperature across a',
  '  plate, a wave on a membrane, interference of two sources, a probability density in two variables;',
  '- a family of shapes where a coefficient changes the picture: one graph with a slider for it, not',
  '  several separate equations.',
  'Skip it for a plain number, a one-variable function y = f(x) (draw that as a figure), an identity,',
  'and any subject where nothing has a shape. One graph per idea that has a shape; never two graphs',
  'of the same thing. In a quiz, put it on the equation in the question; when the options are shapes',
  'to compare, give each option its own graph. The text must read, and a question must be answerable,',
  'without opening any graph.',
  'How to write one:',
  '- Straight after the closing $ or $$ of the equation, with no space, write {graph=EXPR}: the same',
  '  function in calculator syntax, with no spaces and no quotes. Example: $z = x^2 - y^2${graph=x^2-y^2}.',
  '- EXPR uses * for every product (2*x, x*y), ^ for powers, brackets, and sin cos tan asin acos atan',
  '  sinh cosh tanh exp ln log sqrt abs pi e. A surface uses x and y; a curve is (x(t),y(t),z(t)) in t,',
  '  e.g. $\\vec r(t) = (\\cos t, \\sin t, t/4)${graph=(cos(t),sin(t),t/4)}.',
  '- Up to three sliders a, b, c show what a coefficient does: $z = a\\sin(bx)${graph=a*sin(b*x)}.',
  '  Use a slider letter only for a quantity the text names and explains.',
  '- Only z = f(x, y) and curves in t can be drawn. A surface given implicitly, such as the sphere',
  '  x^2 + y^2 + z^2 = 9, cannot: graph its upper half, z = sqrt(9 - x^2 - y^2), when the shape matters.',
  '- EXPR plots exactly the function the LaTeX shows, with the same letters and constants.',
  '- Optional settings after EXPR, each only when the default is wrong: x=-2..2 and y=-2..2 for the',
  '  plotted range (default -4..4), t=0..4*pi for a curve (default 0..2*pi), a=1[0.1..5] for a',
  "  slider's start and range (default 1 on 0.1..3). Pick a range that shows the interesting part.",
].join('\n');

/** A graph attribute block anywhere in Markdown; group 1 holds its inside. */
const GRAPH_BLOCK = /\{\s*(graph=(?:"(?:[^"\\]|\\.)*"|[^\s"}]+)[^}]*)\}/g;

/**
 * Checks every `{graph=…}` in a field: that it follows an equation and that it draws. Warnings,
 * because the importer drops a graph it cannot draw and keeps the equation; they tell the teacher
 * which equation lost its graph and why.
 */
export const checkMarkdownGraphs = (markdown: string, path: string, issues: IAiIssue[]) => {
  const text = markdown ?? '';
  const pattern = new RegExp(GRAPH_BLOCK.source, 'g');
  for (let match = pattern.exec(text); match; match = pattern.exec(text)) {
    const before = text.slice(0, match.index);
    if (!/(\$|\\\)|\\\])$/.test(before)) {
      issues.push({
        level: 'warning',
        path,
        message: `{${match[1]}} is not straight after an equation's closing $, so it shows as text. Remove the space before it.`,
      });
      continue;
    }
    const attrs = parseMarkdownAttrs(match[1]);
    const view = Object.entries(attrs)
      .filter(([key]) => key !== 'graph')
      .map(([key, value]) => `${key}=${value}`)
      .join(' ');
    const result = validateGraph(attrs.graph ?? '', view || null);
    if (!result.isValid) {
      issues.push({
        level: 'warning',
        path,
        message: `The 3D graph "${attrs.graph}" cannot be drawn, so it is left out: ${result.message}`,
      });
    }
  }
};
