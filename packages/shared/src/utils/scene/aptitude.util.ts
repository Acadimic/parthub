import type { CubeFace, IScene, ISceneStep, SceneObject } from '../../interfaces/scene3d.interface';
import { oppositeNetSquares } from './net.util';

/**
 * Ready-made scenes for the aptitude questions a picture helps most with. Each gives two scenes: the
 * question's, which shows the puzzle and nothing more, and the solution's, whose steps work it out —
 * so a learner can attempt the question before anything gives the answer away. The answer itself is
 * returned too, so a generated question can be checked against its own picture.
 */
export interface ISceneTemplate<TAnswer> {
  question: IScene;
  solution: IScene;
  answer: TAnswer;
}

const ALL_FACES: readonly CubeFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

// ---------------------------------------------------------------------------
// Folding a net
// ---------------------------------------------------------------------------

export interface ICubeNetTemplateInput {
  /** Six `[row, column]` squares that fold into a cube. */
  cells: [number, number][];
  /** What is written on each square, in the same order. */
  labels: string[];
  /** The square the question asks about: which face ends up opposite it. */
  asked: number;
}

/** "This net is folded into a cube. Which face is opposite the one marked X?" Null when the cells do not fold. */
export const cubeNetTemplate = ({
  cells,
  labels,
  asked,
}: ICubeNetTemplateInput): ISceneTemplate<{ opposite: string }> | null => {
  const opposite = oppositeNetSquares(cells);
  if (!opposite || !labels[opposite[asked]]) return null;
  // The first square stays put and becomes the top, so the asked one goes first: turning the folded
  // cube over then brings its opposite face up.
  const order = [asked, ...cells.map((_, index) => index).filter((index) => index !== asked)];
  const net: SceneObject = {
    id: 'net',
    type: 'net',
    of: 'cube',
    cells: order.map((index) => cells[index]),
    labels: order.map((index) => labels[index]),
  };
  const steps: ISceneStep[] = [
    { label: 'The net, flat' },
    { label: `Fold it into a cube, with ${labels[asked]} on top`, action: { fold: 'net' } },
    {
      label: `Turn it over to see the face opposite ${labels[asked]}`,
      action: { rotate: 'net', axis: 'x', angle: 180 },
    },
  ];
  return {
    question: { version: 1, title: 'Fold this net into a cube', objects: [net] },
    solution: { version: 1, title: 'Folding the net', objects: [net], steps },
    answer: { opposite: labels[opposite[asked]] },
  };
};

// ---------------------------------------------------------------------------
// Two views of a die
// ---------------------------------------------------------------------------

/** A die's six faces in the format's order: top, bottom, front, back, left, right. */
type DieFaces = [string, string, string, string, string, string];

/** The same die turned a quarter-turn about the vertical, so its right side comes round to the front. */
const quarterTurn = ([top, bottom, front, back, left, right]: DieFaces): DieFaces => [
  top,
  bottom,
  right,
  left,
  front,
  back,
];

/** The same die tipped forward a quarter-turn, so its top comes down to the front. */
const tipForward = ([top, bottom, front, back, left, right]: DieFaces): DieFaces => [
  back,
  front,
  top,
  bottom,
  left,
  right,
];

export interface IDiceTemplateInput {
  /** The die's faces in the format's order: top, bottom, front, back, left, right. */
  faces: DieFaces;
}

/**
 * "Two positions of the same die are shown. Which face is opposite the one on top?" The second
 * view is the die tipped forward and turned, so the two views share a face and between them show
 * five of the six — enough to work out the hidden one.
 */
export const diceTemplate = ({ faces }: IDiceTemplateInput): ISceneTemplate<{ opposite: string }> => {
  const second = quarterTurn(tipForward(faces));
  const first: SceneObject = { id: 'first', type: 'die', faces, position: [-1.8, 0, 0], label: 'First view' };
  const twin: SceneObject = { id: 'second', type: 'die', faces: second, position: [1.8, 0, 0], label: 'Second view' };
  const solo: SceneObject = { id: 'die', type: 'die', faces };
  return {
    question: { version: 1, title: 'Two views of the same die', objects: [first, twin] },
    solution: {
      version: 1,
      title: 'Turning the die',
      objects: [solo],
      steps: [
        { label: 'The die as in the first view' },
        { label: 'Tip it forward, so the top comes to the front', action: { rotate: 'die', axis: 'x', angle: 90 } },
        {
          label: 'Turn it a quarter: now it matches the second view',
          action: { rotate: 'die', axis: 'z', angle: -90 },
        },
        {
          label: `Roll it over: the face that was under ${faces[0]} is ${faces[1]}`,
          action: { rotate: 'die', axis: 'y', angle: -90 },
        },
      ],
    },
    answer: { opposite: faces[1] },
  };
};

// ---------------------------------------------------------------------------
// A painted cube cut into small cubes
// ---------------------------------------------------------------------------

export interface IPaintedCubeTemplateInput {
  /** Small cubes along each edge, 2 to 6. */
  n: number;
  /** The sides painted before cutting; all six when absent. */
  painted?: CubeFace[];
}

/** How many painted faces the small cube at `[column, row, layer]` has. */
const paintedFaces = (n: number, painted: ReadonlySet<CubeFace>, [column, row, layer]: number[]): number =>
  [
    column === 0 && painted.has('left'),
    column === n - 1 && painted.has('right'),
    row === 0 && painted.has('front'),
    row === n - 1 && painted.has('back'),
    layer === 0 && painted.has('bottom'),
    layer === n - 1 && painted.has('top'),
  ].filter(Boolean).length;

const everyCube = (n: number): [number, number, number][] =>
  Array.from({ length: n * n * n }, (_, index) => [index % n, Math.floor(index / n) % n, Math.floor(index / (n * n))]);

/**
 * How many small cubes have 0, 1, 2 and 3 painted faces once an n × n × n cube, painted on the given
 * sides, is cut up. The answer key for every painted-cube question.
 */
export const paintedCubeCounts = (
  n: number,
  painted: readonly CubeFace[] = ALL_FACES,
): [number, number, number, number] => {
  const sides = new Set(painted);
  const counts: [number, number, number, number] = [0, 0, 0, 0];
  everyCube(n).forEach((cube) => (counts[paintedFaces(n, sides, cube)] += 1));
  return counts;
};

const WORDS = ['no', 'one', 'two', 'three'];

/**
 * "A cube painted on its faces is cut into n³ small cubes. How many have exactly k painted faces?"
 * The solution pulls the block apart: one step for each number of painted faces, showing only the
 * small cubes with that many, and the count in the step's label.
 */
export const paintedCubeTemplate = ({
  n,
  painted = [...ALL_FACES],
}: IPaintedCubeTemplateInput): ISceneTemplate<{ counts: [number, number, number, number] }> => {
  const sides = new Set(painted);
  const counts = paintedCubeCounts(n, painted);
  const block: SceneObject = { id: 'block', type: 'cubeGrid', n, painted };
  const kinds = [3, 2, 1, 0].filter((faces) => counts[faces] > 0);
  const parts: SceneObject[] = kinds.map((faces) => ({
    id: `faces${faces}`,
    type: 'cubeGrid',
    n,
    painted,
    hidden: everyCube(n).filter((cube) => paintedFaces(n, sides, cube) !== faces),
  }));
  const steps: ISceneStep[] = [
    { label: `The ${n} × ${n} × ${n} block, painted and cut` },
    ...kinds.map((faces, index) => ({
      label: `${counts[faces]} small ${counts[faces] === 1 ? 'cube has' : 'cubes have'} ${WORDS[faces]} painted ${faces === 1 ? 'face' : 'faces'}`,
      show: [`faces${faces}`],
      hide: index === 0 ? ['block'] : [`faces${kinds[index - 1]}`],
    })),
  ];
  return {
    question: {
      version: 1,
      title: `A painted ${n} × ${n} × ${n} cube, cut into ${n ** 3} small cubes`,
      objects: [block],
    },
    solution: { version: 1, title: 'Counting the painted faces', objects: [block, ...parts], steps },
    answer: { counts },
  };
};
