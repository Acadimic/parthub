import type { IGraphRange, IParametricSample, ISurfaceSample } from '@repo/shared/utils';

/** Pure helpers for building a surface mesh from a grid of sampled points. */

/**
 * The heights a surface's colours run over. A parametric shape's z axis is widened to match its
 * widest side (true proportions), so colouring by the axis would leave a flat torus or a short cone
 * in one band of colour; its own lowest and highest points are used instead.
 */
export const heightRange = (sample: ISurfaceSample | IParametricSample): IGraphRange => {
  if (sample.kind === 'surface') return sample.bounds.z;
  let min = Infinity;
  let max = -Infinity;
  for (let k = 2; k < sample.points.length; k += 3) {
    const z = sample.points[k];
    if (z < min) min = z;
    if (z > max) max = z;
  }
  return max - min > 1e-9 ? { min, max } : { min: min - 1, max: max + 1 };
};

/**
 * Triangles for a `size × size` grid of points. A triangle with an undefined corner is left out, so
 * a hole stays a hole; a cell on the edge of one keeps whichever half is whole, which smooths the
 * rim to a diagonal instead of a staircase.
 */
export const gridTriangles = (size: number, valid: Uint8Array): number[] => {
  const indices: number[] = [];
  const triangle = (a: number, b: number, c: number) => {
    if (valid[a] && valid[b] && valid[c]) indices.push(a, b, c);
  };
  for (let j = 0; j < size - 1; j += 1) {
    for (let i = 0; i < size - 1; i += 1) {
      const a = j * size + i;
      const b = a + 1;
      const c = a + size;
      const d = c + 1;
      if (valid[a] && valid[d]) {
        triangle(a, b, d);
        triangle(a, d, c);
      } else {
        triangle(a, b, c);
        triangle(b, d, c);
      }
    }
  }
  return indices;
};
