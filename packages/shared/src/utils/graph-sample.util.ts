import type { GraphParam, ICompiledGraph, IGraphRange, IGraphScope, IGraphView } from './graph-expression.util';

/**
 * Sampling a compiled graph into points, shared by the 3D viewer and the validators. Split from
 * `graph-expression.util.ts`, which keeps the language, the view format and the Markdown form.
 */

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

export interface IParametricSample {
  kind: 'parametric';
  /** Points per side: the grid is `size × size` over `u` (columns) and `v` (rows). */
  size: number;
  /** `x, y, z` interleaved, row-major in `v`; a point with any NaN is undefined. */
  points: Float64Array;
  bounds: IGraphBounds;
}

export type GraphSample = ISurfaceSample | ICurveSample | IParametricSample;

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

/**
 * A parametric surface is a shape — a sphere, a cone, a torus — so its axes share one scale: each
 * range is widened about its middle to the longest of the three, or a sphere would be drawn as
 * whatever box its x, y and z ranges happened to make.
 */
const equalAspect = (x: IGraphRange, y: IGraphRange, z: IGraphRange): IGraphBounds => {
  const span = Math.max(x.max - x.min, y.max - y.min, z.max - z.min);
  const widen = (range: IGraphRange): IGraphRange => {
    const middle = (range.min + range.max) / 2;
    return { min: middle - span / 2, max: middle + span / 2 };
  };
  return { x: widen(x), y: widen(y), z: widen(z) };
};

const sampleParametric = (
  graph: ICompiledGraph,
  view: IGraphView,
  scope: IGraphScope,
  size: number,
): IParametricSample => {
  const points = new Float64Array(size * size * 3);
  for (let j = 0; j < size; j += 1) {
    scope.v = view.v.min + ((view.v.max - view.v.min) * j) / (size - 1);
    for (let i = 0; i < size; i += 1) {
      scope.u = view.u.min + ((view.u.max - view.u.min) * i) / (size - 1);
      graph.evaluate.forEach((evaluate, axis) => {
        points[(j * size + i) * 3 + axis] = clean(evaluate(scope));
      });
    }
  }
  const axis = (offset: number) => graphValueRange(points.filter((_value, index) => index % 3 === offset));
  return { kind: 'parametric', size, points, bounds: equalAspect(axis(0), axis(1), axis(2)) };
};

export const sampleGraph = (
  graph: ICompiledGraph,
  view: IGraphView,
  values: Record<GraphParam, number>,
  size: number,
): GraphSample => {
  const scope: IGraphScope = { x: 0, y: 0, t: 0, u: 0, v: 0, ...values };
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
  if (graph.kind === 'parametric') return sampleParametric(graph, view, scope, size);
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
