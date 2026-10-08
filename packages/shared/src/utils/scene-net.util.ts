import type { CubeFace } from '../interfaces/scene3d.interface';

/** Which way a square lies from the one it hangs from, in the flat net: `[row step, column step]`. */
export type NetDirection = 'north' | 'south' | 'east' | 'west';

const STEPS: Record<NetDirection, [number, number]> = {
  north: [-1, 0],
  south: [1, 0],
  east: [0, 1],
  west: [0, -1],
};

/** The cube's faces by where they point while it sits under the net: up against the square, down, and the four sides. */
type Orientation = Record<'up' | 'down' | NetDirection, CubeFace>;

/** The cube tipped over its upper edge on `direction`: that side comes up against the next square. */
const roll = (cube: Orientation, direction: NetDirection): Orientation => {
  const opposite: Record<NetDirection, NetDirection> = { north: 'south', south: 'north', east: 'west', west: 'east' };
  const back = opposite[direction];
  return { ...cube, up: cube[direction], [direction]: cube.down, down: cube[back], [back]: cube.up };
};

export interface ICubeNetFold {
  /** The face of the folded cube each square becomes, in the order the cells were given. */
  faces: CubeFace[];
  /** The square each one is hinged to, or -1 for the first, which stays put and becomes the top. */
  parents: number[];
  /** Which way each square lies from its parent. */
  directions: (NetDirection | null)[];
}

export type CubeNetResult = ({ isValid: true } & ICubeNetFold) | { isValid: false; error: string };

/**
 * Folds six `[row, column]` squares into a cube, the way a net is folded on paper: the first square
 * becomes the top and every other square folds down on the edge it shares with a square already
 * placed. It is a cube's net only when the squares are joined edge to edge and land on six different
 * faces. Rows run down the page and columns across.
 */
export const foldCubeNet = (cells: readonly (readonly [number, number])[]): CubeNetResult => {
  const key = ([row, column]: readonly [number, number]) => `${row},${column}`;
  const index = new Map(cells.map((cell, position) => [key(cell), position]));
  if (cells.length !== 6 || index.size !== 6) return { isValid: false, error: 'needs six different squares.' };
  const start: Orientation = { up: 'top', down: 'bottom', north: 'back', south: 'front', east: 'right', west: 'left' };
  const placed = new Map<number, Orientation>([[0, start]]);
  const parents = Array<number>(6).fill(-1);
  const directions = Array<NetDirection | null>(6).fill(null);
  const queue = [0];
  while (queue.length) {
    const current = queue.shift() ?? 0;
    const [row, column] = cells[current];
    (Object.keys(STEPS) as NetDirection[]).forEach((direction) => {
      const next = index.get(key([row + STEPS[direction][0], column + STEPS[direction][1]]));
      if (next === undefined || placed.has(next)) return;
      placed.set(next, roll(placed.get(current) ?? start, direction));
      parents[next] = current;
      directions[next] = direction;
      queue.push(next);
    });
  }
  if (placed.size !== 6) return { isValid: false, error: 'the squares must all join edge to edge.' };
  const faces = cells.map((_, position) => placed.get(position)?.up ?? 'top');
  const clash = faces.findIndex((face, position) => faces.indexOf(face) !== position);
  if (clash >= 0) {
    return {
      isValid: false,
      error: `squares ${faces.indexOf(faces[clash]) + 1} and ${clash + 1} would fold onto the same face, so this is not a cube's net.`,
    };
  }
  return { isValid: true, faces, parents, directions };
};

const OPPOSITE: Record<CubeFace, CubeFace> = {
  top: 'bottom',
  bottom: 'top',
  front: 'back',
  back: 'front',
  left: 'right',
  right: 'left',
};

/**
 * For each square, the square opposite it once the net is folded — the answer to "which face is
 * opposite X?" — or null when the cells are not a cube's net.
 */
export const oppositeNetSquares = (cells: readonly (readonly [number, number])[]): number[] | null => {
  const folded = foldCubeNet(cells);
  if (!folded.isValid) return null;
  return folded.faces.map((face) => folded.faces.indexOf(OPPOSITE[face]));
};
