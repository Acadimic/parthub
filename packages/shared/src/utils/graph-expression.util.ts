import type { RichTextAttrValue } from '../interfaces/rich-text.interface';
import { formatMarkdownAttrs, parseMarkdownAttrs } from './pronunciation.util';

/**
 * 3D graphs of equations: the expression language, its compiler, the view settings and sampling.
 *
 * An equation node may carry `graph` (an expression in this language) and `graphView` (ranges and
 * slider settings that differ from the defaults). The expression is compiled to closures over a
 * fixed list of functions and constants — never `eval` or `Function` — so authored or AI-written
 * content cannot run code in a reader's browser. See `.claude/plans/GRAPH_3D.md`.
 */

export type GraphKind = 'surface' | 'curve';
export type GraphParam = 'a' | 'b' | 'c';
export const GRAPH_PARAMS: readonly GraphParam[] = ['a', 'b', 'c'];

export interface IGraphRange {
  min: number;
  max: number;
}

export interface IGraphParamSetting {
  value: number;
  min: number;
  max: number;
}

export interface IGraphView {
  x: IGraphRange;
  y: IGraphRange;
  t: IGraphRange;
  params: Record<GraphParam, IGraphParamSetting>;
}

/** Every name an expression can read. Unused ones are simply ignored. */
export interface IGraphScope {
  x: number;
  y: number;
  t: number;
  a: number;
  b: number;
  c: number;
}

type Evaluate = (scope: IGraphScope) => number;

export interface ICompiledGraph {
  kind: GraphKind;
  /** One function for a surface (`z`), three for a curve (`x`, `y`, `z` of `t`). */
  evaluate: Evaluate[];
  /** The slider parameters the expression actually uses, in `a b c` order. */
  params: GraphParam[];
}

export type GraphCompileResult = { isValid: true; graph: ICompiledGraph } | { isValid: false; message: string };

const FUNCTIONS: Record<string, (value: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sinh: Math.sinh,
  cosh: Math.cosh,
  tanh: Math.tanh,
  exp: Math.exp,
  log: Math.log,
  ln: Math.log,
  sqrt: Math.sqrt,
  abs: Math.abs,
};

const CONSTANTS: Record<string, number> = { pi: Math.PI, e: Math.E };

const VARIABLES: Record<GraphKind, (keyof IGraphScope)[]> = {
  surface: ['x', 'y', 'a', 'b', 'c'],
  curve: ['t', 'a', 'b', 'c'],
};

const HINTS: Record<GraphKind, string> = {
  surface: 'A surface can use x, y and the sliders a, b, c.',
  curve: 'A curve can use t and the sliders a, b, c.',
};

// ---------------------------------------------------------------------------
// Parsing: a recursive-descent parser that compiles straight to closures.
// ---------------------------------------------------------------------------

interface IToken {
  kind: 'number' | 'name' | 'symbol';
  text: string;
}

const tokenize = (source: string): IToken[] => {
  const tokens: IToken[] = [];
  let index = 0;
  while (index < source.length) {
    const rest = source.slice(index);
    const space = /^\s+/.exec(rest);
    const number = /^(\d+\.?\d*|\.\d+)/.exec(rest);
    const name = /^[a-zA-Z]+/.exec(rest);
    if (space) index += space[0].length;
    else if (rest.startsWith('**')) {
      tokens.push({ kind: 'symbol', text: '^' });
      index += 2;
    } else if (number) {
      tokens.push({ kind: 'number', text: number[0] });
      index += number[0].length;
    } else if (name) {
      tokens.push({ kind: 'name', text: name[0] });
      index += name[0].length;
    } else if ('+-*/^(),'.includes(rest[0])) {
      tokens.push({ kind: 'symbol', text: rest[0] });
      index += 1;
    } else {
      throw new Error(`"${rest[0]}" is not a symbol a graph can use.`);
    }
  }
  return tokens;
};

/** Why an unknown name failed, phrased as the fix: `sinx` → "Write sin(x)", `xy` → "Write x*y". */
const unknownNameMessage = (name: string, allowed: string[], hint: string): string => {
  const fn = Object.keys(FUNCTIONS).find((key) => name.startsWith(key) && name.length > key.length);
  if (fn) return `Unknown name "${name}". Write ${fn}(${name.slice(fn.length)}).`;
  if ([...name].every((char) => allowed.includes(char))) {
    return `Unknown name "${name}". Write ${[...name].join('*')} for a product.`;
  }
  return `Unknown name "${name}". ${hint}`;
};

const parseExpression = (source: string, allowed: (keyof IGraphScope)[], hint: string, used: Set<string>): Evaluate => {
  const tokens = tokenize(source);
  let position = 0;
  const peek = (): IToken | undefined => tokens[position];
  const isSymbol = (text: string) => peek()?.kind === 'symbol' && peek()?.text === text;
  const expect = (text: string) => {
    if (!isSymbol(text)) {
      throw new Error(text === ')' ? 'A bracket is opened but never closed.' : `Expected "${text}".`);
    }
    position += 1;
  };
  /** True when the next token can start a factor written straight after another (`2x`, `3(1-x)`). */
  const startsFactor = (allowFunction: boolean) => {
    const token = peek();
    if (!token) return false;
    if (token.kind === 'number') return true;
    if (token.kind === 'name') return allowFunction || !(token.text.toLowerCase() in FUNCTIONS);
    return token.text === '(';
  };

  const sum = (): Evaluate => {
    let left = product();
    while (isSymbol('+') || isSymbol('-')) {
      const operator = tokens[position].text;
      position += 1;
      const right = product();
      const previous = left;
      left = operator === '+' ? (scope) => previous(scope) + right(scope) : (scope) => previous(scope) - right(scope);
    }
    return left;
  };

  const product = (): Evaluate => {
    let left = unary();
    for (;;) {
      if (isSymbol('*') || isSymbol('/')) {
        const operator = tokens[position].text;
        position += 1;
        const right = unary();
        const previous = left;
        left = operator === '*' ? (scope) => previous(scope) * right(scope) : (scope) => previous(scope) / right(scope);
      } else if (startsFactor(true)) {
        const right = power();
        const previous = left;
        left = (scope) => previous(scope) * right(scope);
      } else {
        return left;
      }
    }
  };

  const unary = (): Evaluate => {
    if (isSymbol('-')) {
      position += 1;
      const operand = unary();
      return (scope) => -operand(scope);
    }
    if (isSymbol('+')) {
      position += 1;
      return unary();
    }
    return power();
  };

  const power = (): Evaluate => {
    const base = atom();
    if (!isSymbol('^')) return base;
    position += 1;
    const exponent = unary();
    return (scope) => Math.pow(base(scope), exponent(scope));
  };

  /** `sin x`, `sin 2t`: without brackets a function takes the product of plain factors after it. */
  const bareArgument = (): Evaluate => {
    let argument = power();
    while (startsFactor(false)) {
      const right = power();
      const previous = argument;
      argument = (scope) => previous(scope) * right(scope);
    }
    return argument;
  };

  const atom = (): Evaluate => {
    const token = peek();
    if (!token) throw new Error('The expression ends too early.');
    position += 1;
    if (token.kind === 'number') {
      const value = parseFloat(token.text);
      return () => value;
    }
    if (token.kind === 'symbol') {
      if (token.text !== '(') throw new Error(`Unexpected "${token.text}".`);
      const inner = sum();
      expect(')');
      return inner;
    }
    const name = token.text.toLowerCase();
    const fn = FUNCTIONS[name];
    if (fn) {
      if (isSymbol('(')) {
        position += 1;
        const argument = sum();
        expect(')');
        return (scope) => fn(argument(scope));
      }
      if (!startsFactor(false)) throw new Error(`Write ${name}(…) with brackets.`);
      const argument = bareArgument();
      return (scope) => fn(argument(scope));
    }
    if (name in CONSTANTS) {
      const value = CONSTANTS[name];
      return () => value;
    }
    const variable = allowed.find((key) => key === token.text);
    if (!variable) throw new Error(unknownNameMessage(token.text, allowed, hint));
    used.add(variable);
    return (scope) => scope[variable];
  };

  if (!tokens.length) throw new Error('The expression is empty.');
  const compiled = sum();
  const extra = peek();
  if (extra) throw new Error(extra.text === ',' ? 'A curve needs exactly three parts.' : `Unexpected "${extra.text}".`);
  return compiled;
};

/** Splits on commas outside brackets. */
const splitTopLevel = (source: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  [...source].forEach((char, index) => {
    if (char === '(') depth += 1;
    else if (char === ')') depth -= 1;
    else if (char === ',' && depth === 0) {
      parts.push(source.slice(start, index));
      start = index + 1;
    }
  });
  parts.push(source.slice(start));
  return parts;
};

/** Drops a leading `z =` or `r(t) =`, which a teacher often types out of habit. */
const stripLeftSide = (source: string): string => source.trim().replace(/^(z|r\s*\(\s*t\s*\))\s*=/i, '');

/**
 * Compiles a graph expression. Three top-level parts, optionally bracketed, make a curve
 * `(x(t), y(t), z(t))`; one part makes a surface `z = f(x, y)`.
 */
export const compileGraph = (expression: string): GraphCompileResult => {
  const source = stripLeftSide(expression);
  if (!source.trim()) return { isValid: false, message: 'Type an expression, for example sin(x)*cos(y).' };
  const unwrapped = source.trim().startsWith('(') && source.trim().endsWith(')') ? source.trim().slice(1, -1) : source;
  const tuple = splitTopLevel(unwrapped);
  const parts = tuple.length === 3 ? tuple : splitTopLevel(source);
  const kind: GraphKind = parts.length === 3 ? 'curve' : 'surface';
  if (parts.length !== 1 && parts.length !== 3) {
    return { isValid: false, message: 'A curve needs three parts, like (cos(t), sin(t), t/4).' };
  }
  const used = new Set<string>();
  try {
    const evaluate = parts.map((part) => parseExpression(part, VARIABLES[kind], HINTS[kind], used));
    return { isValid: true, graph: { kind, evaluate, params: GRAPH_PARAMS.filter((param) => used.has(param)) } };
  } catch (error) {
    return { isValid: false, message: error instanceof Error ? error.message : 'The expression could not be read.' };
  }
};

/** A number written with constants and arithmetic only: `2pi`, `-3.5`, `pi/2`. */
const parseConstant = (source: string): number | null => {
  try {
    const value = parseExpression(source, [], 'Use a number.', new Set())({ x: 0, y: 0, t: 0, a: 0, b: 0, c: 0 });
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// The view: ranges and sliders, stored as `x=-2..2 t=0..4pi a=1[0.1..5]`.
// ---------------------------------------------------------------------------

export const DEFAULT_GRAPH_VIEW: IGraphView = {
  x: { min: -4, max: 4 },
  y: { min: -4, max: 4 },
  t: { min: 0, max: 2 * Math.PI },
  params: {
    a: { value: 1, min: 0.1, max: 3 },
    b: { value: 1, min: 0.1, max: 3 },
    c: { value: 1, min: 0.1, max: 3 },
  },
};

const RANGE = /^(.+?)\.\.(.+)$/;
const PARAM = /^([^[]+)\[(.+?)\.\.(.+)\]$/;
const RANGE_KEYS = ['x', 'y', 't'] as const;
const VIEW_KEYS: string[] = [...RANGE_KEYS, ...GRAPH_PARAMS];

const parseRange = (value: string, fallback: IGraphRange): IGraphRange => {
  const match = RANGE.exec(value);
  const min = match ? parseConstant(match[1]) : null;
  const max = match ? parseConstant(match[2]) : null;
  return min !== null && max !== null && max > min ? { min, max } : fallback;
};

const parseParam = (value: string, fallback: IGraphParamSetting): IGraphParamSetting => {
  const match = PARAM.exec(value);
  const initial = match ? parseConstant(match[1]) : parseConstant(value);
  const min = match ? parseConstant(match[2]) : fallback.min;
  const max = match ? parseConstant(match[3]) : fallback.max;
  if (initial === null || min === null || max === null || max <= min) return fallback;
  return { value: Math.min(Math.max(initial, min), max), min, max };
};

/** Reads a stored `graphView`. Missing or unreadable entries take the default, never an error. */
export const parseGraphView = (source: string | null): IGraphView => {
  const attrs = source ? parseMarkdownAttrs(source) : {};
  const view: IGraphView = {
    x: attrs.x ? parseRange(attrs.x, DEFAULT_GRAPH_VIEW.x) : DEFAULT_GRAPH_VIEW.x,
    y: attrs.y ? parseRange(attrs.y, DEFAULT_GRAPH_VIEW.y) : DEFAULT_GRAPH_VIEW.y,
    t: attrs.t ? parseRange(attrs.t, DEFAULT_GRAPH_VIEW.t) : DEFAULT_GRAPH_VIEW.t,
    params: { ...DEFAULT_GRAPH_VIEW.params },
  };
  GRAPH_PARAMS.forEach((param) => {
    const value = attrs[param];
    if (value) view.params[param] = parseParam(value, DEFAULT_GRAPH_VIEW.params[param]);
  });
  return view;
};

/** Up to four significant figures, without trailing zeros. */
export const formatGraphNumber = (value: number): string => String(Number(value.toPrecision(4)));

/** Equal to four significant figures, so a default shown as `6.283` still reads as `2π`. */
const isNear = (a: number, b: number) => Math.abs(a - b) <= 5e-4 * Math.max(1, Math.abs(b));
const sameRange = (a: IGraphRange, b: IGraphRange) => isNear(a.min, b.min) && isNear(a.max, b.max);

/** Writes a view back as a `graphView` string holding only what differs from the defaults. */
export const formatGraphView = (view: IGraphView): string | null => {
  const entries: [string, string][] = [];
  RANGE_KEYS.forEach((key) => {
    if (!sameRange(view[key], DEFAULT_GRAPH_VIEW[key])) {
      entries.push([key, `${formatGraphNumber(view[key].min)}..${formatGraphNumber(view[key].max)}`]);
    }
  });
  GRAPH_PARAMS.forEach((param) => {
    const setting = view.params[param];
    const fallback = DEFAULT_GRAPH_VIEW.params[param];
    if (!isNear(setting.value, fallback.value) || !sameRange(setting, fallback)) {
      const { value, min, max } = setting;
      entries.push([param, `${formatGraphNumber(value)}[${formatGraphNumber(min)}..${formatGraphNumber(max)}]`]);
    }
  });
  return entries.length ? formatMarkdownAttrs(entries) : null;
};

// ---------------------------------------------------------------------------
// Markdown: `$z = x^2$` followed by `{graph="x^2" x=-2..2}`.
// ---------------------------------------------------------------------------

export interface IGraphAttrs {
  graph: string;
  graphView: string | null;
}

/** The attribute block that follows an equation, `{graph="…" …}`, as written in Markdown. */
export const GRAPH_MARKDOWN_BLOCK = /^\{\s*(graph=(?:"(?:[^"\\]|\\.)*"|[^\s"}]+)[^}]*)\}/;

/**
 * Reads the inside of an attribute block. Null when it names no graph, or names one that cannot be
 * drawn — the equation is kept and only the graph is dropped, so a bad expression in an imported or
 * AI-written document never reaches a reader as a broken graph.
 */
export const graphAttrsFromMarkdown = (source: string): IGraphAttrs | null => {
  const attrs = parseMarkdownAttrs(source);
  const graph = attrs.graph?.trim();
  if (!graph) return null;
  const entries = VIEW_KEYS.filter((key) => attrs[key]).map((key): [string, string] => [key, attrs[key]]);
  const graphView = entries.length ? formatMarkdownAttrs(entries) : null;
  return validateGraph(graph, graphView).isValid ? { graph, graphView } : null;
};

/** An equation node's graph, or null when it has none. */
export const graphAttrsOfNode = (attrs: Record<string, RichTextAttrValue> | undefined): IGraphAttrs | null => {
  const graph = attrs?.graph;
  if (typeof graph !== 'string' || !graph.trim()) return null;
  const graphView = attrs?.graphView;
  return { graph, graphView: typeof graphView === 'string' && graphView.trim() ? graphView : null };
};

/** The attribute block written after an equation that has a graph. */
export const graphAttrsToMarkdown = ({ graph, graphView }: IGraphAttrs): string =>
  `{${formatMarkdownAttrs([['graph', graph]])}${graphView ? ` ${graphView}` : ''}}`;

// ---------------------------------------------------------------------------
// From LaTeX: the editor pre-fills the expression from the equation the teacher already wrote.
// ---------------------------------------------------------------------------

/** The `{…}` group starting at `index`, and where the source resumes after it. */
const readGroup = (source: string, index: number): { body: string; next: number } | null => {
  if (source[index] !== '{') return null;
  let depth = 0;
  for (let cursor = index; cursor < source.length; cursor += 1) {
    if (source[cursor] === '{') depth += 1;
    else if (source[cursor] === '}') depth -= 1;
    if (depth === 0) return { body: source.slice(index + 1, cursor), next: cursor + 1 };
  }
  return null;
};

/** `\frac{A}{B}` → `((A)/(B))` and `\sqrt[n]{A}` → `((A)^(1/(n)))`, innermost first. */
const rewriteFractionsAndRoots = (latex: string): string | null => {
  let source = latex;
  for (let guard = 0; guard < 50; guard += 1) {
    const frac = /\\[dt]?frac\s*/.exec(source);
    const root = /\\sqrt\s*/.exec(source);
    const match = [frac, root].filter((item): item is RegExpExecArray => !!item).sort((a, b) => b.index - a.index)[0];
    if (!match) return source;
    const start = match.index + match[0].length;
    if (match === frac) {
      const top = readGroup(source, start);
      const bottom = top ? readGroup(source, top.next) : null;
      if (!top || !bottom) return null;
      source = `${source.slice(0, match.index)}((${top.body})/(${bottom.body}))${source.slice(bottom.next)}`;
    } else {
      const indexMatch = /^\[([^\]]+)\]/.exec(source.slice(start));
      const radicand = readGroup(source, start + (indexMatch ? indexMatch[0].length : 0));
      if (!radicand) return null;
      const replacement = indexMatch ? `((${radicand.body})^(1/(${indexMatch[1]})))` : `sqrt(${radicand.body})`;
      source = `${source.slice(0, match.index)}${replacement}${source.slice(radicand.next)}`;
    }
  }
  return null;
};

const LATEX_WORDS: [RegExp, string][] = [
  [/\\(left|right|big|Big|bigg|Bigg)\b/g, ''],
  [/\\[,;:!]|\\quad|\\qquad|\\ /g, ' '],
  [/\\(cdot|times)/g, '*'],
  [/\\pi\b/g, ' pi '],
  [/\\mathrm\{e\}/g, ' e '],
  [/\\operatorname\{([a-z]+)\}/g, ' $1 '],
  [/\\(sinh|cosh|tanh|arcsin|arccos|arctan|sin|cos|tan|exp|ln|log)\b/g, ' $1 '],
];

const ARC: Record<string, string> = { arcsin: 'asin', arccos: 'acos', arctan: 'atan' };

/**
 * A best-effort graph expression for an equation's LaTeX, or null when it cannot be read.
 *
 * Handles what school equations are made of: fractions, roots, powers, the trig and log
 * functions, `\cdot`, `\pi`, and a left side (`z =`, `f(x,y) =`, `\vec r(t) =`), which is dropped.
 * Anything else — subscripts, sums, absolute bars — returns null and the teacher types it.
 */
export const graphExpressionFromLatex = (latex: string): string | null => {
  const rightSide = latex.includes('=') ? latex.slice(latex.lastIndexOf('=') + 1) : latex;
  const rewritten = rewriteFractionsAndRoots(rightSide);
  if (rewritten === null) return null;
  let source = LATEX_WORDS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), rewritten);
  source = source.replace(/\b(arcsin|arccos|arctan)\b/g, (word) => ARC[word]);
  if (/[\\_|&]/.test(source)) return null;
  source = source.replace(/\{/g, '(').replace(/\}/g, ')');
  // `xy` in LaTeX is a product; split runs of single-letter variables so the parser reads it so.
  source = source.replace(/[a-zA-Z]+/g, (word) =>
    word in FUNCTIONS || word in CONSTANTS || !/^[xytabc]+$/.test(word) ? word : [...word].join('*'),
  );
  source = source.replace(/\s+/g, ' ').replace(/\(\s+/g, '(').replace(/\s+\)/g, ')').trim();
  return compileGraph(source).isValid ? source : null;
};

// ---------------------------------------------------------------------------
// Sampling, shared by the viewer and the validators.
// ---------------------------------------------------------------------------

export interface IGraphBounds {
  x: IGraphRange;
  y: IGraphRange;
  z: IGraphRange;
}

export interface ISurfaceSample {
  kind: 'surface';
  /** Points per side: the grid is `size × size`, row-major in `y`. */
  size: number;
  xs: Float64Array;
  ys: Float64Array;
  /** NaN where the expression is undefined. */
  z: Float64Array;
  bounds: IGraphBounds;
}

export interface ICurveSample {
  kind: 'curve';
  /** `x, y, z` interleaved; a point with any NaN is undefined. */
  points: Float64Array;
  count: number;
  bounds: IGraphBounds;
}

export type GraphSample = ISurfaceSample | ICurveSample;

/** Beyond this a value is treated as undefined rather than stretching the axis to it. */
const LIMIT = 1e6;

const clean = (value: number): number => (Number.isFinite(value) && Math.abs(value) < LIMIT ? value : NaN);

/**
 * The range a set of values is shown over. A spike — `1/x` near zero — would flatten everything
 * else, so when the extremes sit far outside the bulk of the values, the 2nd–98th percentile is used
 * and the viewer clips what lies beyond it.
 */
export const graphValueRange = (values: ArrayLike<number>): IGraphRange => {
  const finite = Array.from(values)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!finite.length) return { min: -1, max: 1 };
  const low = finite[0];
  const high = finite[finite.length - 1];
  const p02 = finite[Math.floor(finite.length * 0.02)];
  const p98 = finite[Math.ceil(finite.length * 0.98) - 1];
  const range = high - low > (p98 - p02) * 4 && p98 > p02 ? { min: p02, max: p98 } : { min: low, max: high };
  if (range.max - range.min < 1e-9) return { min: range.min - 1, max: range.max + 1 };
  return range;
};

export const sampleGraph = (
  graph: ICompiledGraph,
  view: IGraphView,
  values: Record<GraphParam, number>,
  size: number,
): GraphSample => {
  const scope: IGraphScope = { x: 0, y: 0, t: 0, ...values };
  if (graph.kind === 'surface') {
    const [evaluate] = graph.evaluate;
    const xs = new Float64Array(size);
    const ys = new Float64Array(size);
    const z = new Float64Array(size * size);
    for (let i = 0; i < size; i += 1) {
      xs[i] = view.x.min + ((view.x.max - view.x.min) * i) / (size - 1);
      ys[i] = view.y.min + ((view.y.max - view.y.min) * i) / (size - 1);
    }
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        scope.x = xs[i];
        scope.y = ys[j];
        z[j * size + i] = clean(evaluate(scope));
      }
    }
    return { kind: 'surface', size, xs, ys, z, bounds: { x: view.x, y: view.y, z: graphValueRange(z) } };
  }
  const count = size * 6;
  const points = new Float64Array(count * 3);
  for (let i = 0; i < count; i += 1) {
    scope.t = view.t.min + ((view.t.max - view.t.min) * i) / (count - 1);
    graph.evaluate.forEach((evaluate, axis) => {
      points[i * 3 + axis] = clean(evaluate(scope));
    });
  }
  const axis = (offset: number) => graphValueRange(points.filter((_value, index) => index % 3 === offset));
  return { kind: 'curve', points, count, bounds: { x: axis(0), y: axis(1), z: axis(2) } };
};

/** The starting value of every slider in a view. */
export const graphParamValues = (view: IGraphView): Record<GraphParam, number> => ({
  a: view.params.a.value,
  b: view.params.b.value,
  c: view.params.c.value,
});

/**
 * Compiles an expression and checks it draws something over its view: what the editor runs before
 * saving and what an AI reply's validator runs on every graph it carries.
 */
export const validateGraph = (expression: string, graphView: string | null): GraphCompileResult => {
  const compiled = compileGraph(expression);
  if (!compiled.isValid) return compiled;
  const view = parseGraphView(graphView);
  const sample = sampleGraph(compiled.graph, view, graphParamValues(view), 24);
  const values = sample.kind === 'surface' ? sample.z : sample.points;
  if (!Array.from(values).some((value) => Number.isFinite(value))) {
    return { isValid: false, message: 'The graph has no points to draw in this range. Try a different range.' };
  }
  return compiled;
};
