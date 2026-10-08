import type { CubeFace, SceneColour, SceneObject } from '@repo/shared/interfaces';
import { foldCubeNet, type NetDirection, sceneNumber } from '@repo/shared/utils';
import { DIE_SIZE } from './scene-solids';
import {
  BoxGeometry,
  CanvasTexture,
  Group,
  type Material,
  Mesh,
  PlaneGeometry,
  Quaternion,
  SRGBColorSpace,
  Vector3,
} from 'three';

type Values = Readonly<Record<string, number>>;

/** How the builder colours a reasoning object; this file owns the shapes and the face pictures. */
export interface IReasoningPaint {
  /** A plain material in the object's own colour, or in `role` when the object names none. */
  own(role: SceneColour): Material;
  /** A plain material in `role`, whatever the object's colour. */
  role(role: SceneColour): Material;
  /** A material showing `texture`, at the object's opacity. */
  textured(texture: CanvasTexture): Material;
  /** The object's own colour as CSS, or `role`'s. */
  colour(role: SceneColour): string;
  outline(mesh: Mesh): void;
}

/** Faces are drawn as card: a pale face and dark ink, as dice and printed nets are, in either theme. */
const CARD = '#f8fafc';
const INK = '#111827';
const TEXTURE_SIZE = 256;

/** The pip positions on a face, as fractions of its side, for 1 to 6. */
const PIPS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [
    [0.28, 0.28],
    [0.72, 0.72],
  ],
  3: [
    [0.25, 0.25],
    [0.5, 0.5],
    [0.75, 0.75],
  ],
  4: [
    [0.28, 0.28],
    [0.72, 0.28],
    [0.28, 0.72],
    [0.72, 0.72],
  ],
  5: [
    [0.25, 0.25],
    [0.75, 0.25],
    [0.5, 0.5],
    [0.25, 0.75],
    [0.75, 0.75],
  ],
  6: [
    [0.28, 0.22],
    [0.72, 0.22],
    [0.28, 0.5],
    [0.72, 0.5],
    [0.28, 0.78],
    [0.72, 0.78],
  ],
};

/** A face's picture: a card with a coloured rim, holding pips for a number from 1 to 6, or text. */
const faceTexture = (content: string, rim: string): CanvasTexture => {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE;
  canvas.height = TEXTURE_SIZE;
  const context = canvas.getContext('2d');
  if (context) {
    const size = TEXTURE_SIZE;
    context.fillStyle = CARD;
    context.fillRect(0, 0, size, size);
    context.strokeStyle = rim;
    context.lineWidth = size * 0.07;
    context.strokeRect(0, 0, size, size);
    context.fillStyle = INK;
    const pips = /^[1-6]$/.test(content) ? PIPS[Number(content)] : null;
    if (pips) {
      pips.forEach(([x, y]) => {
        context.beginPath();
        context.arc(x * size, y * size, size * 0.085, 0, Math.PI * 2);
        context.fill();
      });
    } else {
      // The text is shrunk to fit the face, never cut.
      const fontSize = Math.min(size * 0.5, (size * 0.8) / Math.max(1, content.length * 0.6));
      context.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(content, size / 2, size / 2, size * 0.84);
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

/** A die's faces in the format's order — top, bottom, front, back, left, right — opposite faces adding to 7. */
const STANDARD_DIE = ['1', '6', '2', '5', '3', '4'];

/**
 * A die standing on its base at the origin. The box is built upright (y up) and turned to stand on
 * z, so the writing on its sides reads the right way up; its six materials then sit in three.js's
 * order +x, −x, +z, −z, −y, +y: right, left, top, bottom, front, back.
 */
const die = (object: Extract<SceneObject, { type: 'die' }>, values: Values, paint: IReasoningPaint): Group => {
  const size = object.size === undefined ? DIE_SIZE : sceneNumber(object.size, values);
  const [top, bottom, front, back, left, right] = object.faces ?? STANDARD_DIE;
  const rim = paint.colour('primary');
  const materials = [right, left, top, bottom, front, back].map((face) => paint.textured(faceTexture(face, rim)));
  const mesh = new Mesh(new BoxGeometry(size, size, size).rotateX(Math.PI / 2).translate(0, 0, size / 2), materials);
  paint.outline(mesh);
  const group = new Group();
  group.add(mesh);
  return group;
};

/** Gap left between the small cubes, as a share of their side, so the cuts read. */
const GRID_GAP = 0.06;

/** Which outer side of the block each face of a small cube is on, in three.js's box order. */
const BOX_SIDES: { face: CubeFace; axis: 0 | 1 | 2; end: 'low' | 'high' }[] = [
  { face: 'right', axis: 0, end: 'high' },
  { face: 'left', axis: 0, end: 'low' },
  { face: 'back', axis: 1, end: 'high' },
  { face: 'front', axis: 1, end: 'low' },
  { face: 'top', axis: 2, end: 'high' },
  { face: 'bottom', axis: 2, end: 'low' },
];

/**
 * An n × n × n block of unit cubes, standing on its base and centred over the origin. A small cube's
 * face is painted when it lies on one of the painted sides of the block; the rest are plain, so
 * "how many have exactly two painted faces" can be counted off the picture.
 */
const cubeGrid = (object: Extract<SceneObject, { type: 'cubeGrid' }>, paint: IReasoningPaint): Group => {
  const group = new Group();
  const n = object.n;
  const painted = new Set<CubeFace>(object.painted ?? ['top', 'bottom', 'front', 'back', 'left', 'right']);
  const hidden = new Set((object.hidden ?? []).map((cell) => cell.join(',')));
  const colour = paint.own('chart-1');
  const plain = paint.role('muted');
  const pitch = 1 + GRID_GAP;
  const offset = ((n - 1) * pitch) / 2;
  for (let column = 0; column < n; column += 1) {
    for (let row = 0; row < n; row += 1) {
      for (let layer = 0; layer < n; layer += 1) {
        if (hidden.has(`${column},${row},${layer}`)) continue;
        const at = [column, row, layer];
        const materials = BOX_SIDES.map(({ face, axis, end }) => {
          const isOuter = at[axis] === (end === 'low' ? 0 : n - 1);
          return isOuter && painted.has(face) ? colour : plain;
        });
        const cube = new Mesh(new BoxGeometry(1, 1, 1), materials);
        cube.position.set(column * pitch - offset, row * pitch - offset, layer * pitch + 0.5);
        paint.outline(cube);
        group.add(cube);
      }
    }
  }
  return group;
};

/** Where each net direction points on the floor: rows run down the page, towards the viewer. */
const NET_STEPS: Record<NetDirection, Vector3> = {
  north: new Vector3(0, 1, 0),
  south: new Vector3(0, -1, 0),
  east: new Vector3(1, 0, 0),
  west: new Vector3(-1, 0, 0),
};

/**
 * A cube's net, flat with its first square at the origin when `open` is 1, folding down along the edges the
 * squares share as `open` falls to 0. It folds away from the viewer, so the writing on the flat net
 * ends up outside the cube, as on a paper net; the first square stays where it is and becomes the top.
 */
const net = (object: Extract<SceneObject, { type: 'net' }>, open: number, paint: IReasoningPaint): Group => {
  const group = new Group();
  const cells = object.cells;
  // Measured from the first square, which stays put: the folded cube then hangs straight below
  // `position`, so a turn about the object's centre turns the cube in place.
  const middle = new Vector3(cells[0][1], -cells[0][0], 0);
  const rim = paint.colour('primary');
  const square = (index: number) => {
    const mesh = new Mesh(new PlaneGeometry(1, 1), paint.textured(faceTexture(object.labels?.[index] ?? '', rim)));
    paint.outline(mesh);
    return mesh;
  };
  const folded = foldCubeNet(cells);
  if (!folded.isValid) {
    // Not a cube's net: shown flat, as given, rather than folded wrongly.
    cells.forEach(([row, column], index) => {
      const mesh = square(index);
      mesh.position.set(column, -row, 0).sub(middle);
      group.add(mesh);
    });
    return group;
  }
  const frames: (Group | null)[] = cells.map(() => null);
  const root = new Group();
  root.position.set(cells[0][1], -cells[0][0], 0).sub(middle);
  root.add(square(0));
  frames[0] = root;
  group.add(root);
  const angle = (Math.PI / 2) * (1 - Math.max(0, Math.min(1, open)));
  // A square can only hang from one already placed, so this walks the fold outwards from the first.
  while (frames.some((frame) => !frame)) {
    folded.parents.forEach((parent, index) => {
      const direction = folded.directions[index];
      const holder = parent >= 0 ? frames[parent] : null;
      if (frames[index] || !holder || !direction) return;
      const step = NET_STEPS[direction];
      const hinge = new Group();
      hinge.position.copy(step).multiplyScalar(0.5);
      hinge.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1).cross(step), angle));
      const frame = new Group();
      frame.position.copy(step).multiplyScalar(0.5);
      frame.add(square(index));
      hinge.add(frame);
      holder.add(hinge);
      frames[index] = frame;
    });
  }
  return group;
};

/** The reasoning objects — a die, a block of small cubes, a cube's net — or null for anything else. */
export const reasoningGroup = (
  object: SceneObject,
  values: Values,
  open: number,
  paint: IReasoningPaint,
): Group | null => {
  if (object.type === 'die') return die(object, values, paint);
  if (object.type === 'cubeGrid') return cubeGrid(object, paint);
  if (object.type === 'net') return net(object, open, paint);
  return null;
};
