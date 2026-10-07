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
  'An equation can open as an interactive 3D graph the student turns and reshapes with sliders. Add',
  'one where seeing the shape teaches something — a surface z = f(x, y) (paraboloid, saddle, waves, a',
  'maximum or minimum) or a curve in space (helix, projectile path) — in maths and physics only, and',
  'at most three in a lesson or one in a question. Never on a number, a one-variable equation or an',
  'identity.',
  '- Straight after the closing $ or $$ of the equation, with no space, write {graph=EXPR}: the same',
  '  function in calculator syntax, with no spaces and no quotes. Example: $z = x^2 - y^2${graph=x^2-y^2}.',
  '- EXPR uses * for every product (2*x, x*y), ^ for powers, brackets, and sin cos tan asin acos atan',
  '  sinh cosh tanh exp ln log sqrt abs pi e. A surface uses x and y; a curve is (x(t),y(t),z(t)) in t,',
  '  e.g. $\\vec r(t) = (\\cos t, \\sin t, t/4)${graph=(cos(t),sin(t),t/4)}.',
  '- Up to three sliders a, b, c show what a coefficient does: $z = a\\sin(bx)${graph=a*sin(b*x)}.',
  '- Optional settings after EXPR, each only when the default is wrong: x=-2..2 and y=-2..2 for the',
  '  plotted range (default -4..4), t=0..4*pi for a curve (default 0..2*pi), a=1[0.1..5] for a',
  "  slider's start and range (default 1 on 0.1..3). Pick a range where the interesting part is.",
  '- The graph is an extra: the text must read and the question must be answerable without it.',
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
