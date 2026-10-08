import type { CubeFace, MoleculeShape } from '../interfaces/scene3d.interface';
import {
  flagOf,
  isSolution,
  type ISceneCatalogEntry,
  number,
  numberOf,
  PART,
  textOf,
  textsOf,
  toggle,
} from './scene-catalog-fields.util';
import { LATTICE_FACTS } from './scene-chemistry.util';
import { cubeNetTemplate, diceTemplate, paintedCubeTemplate } from './scene-templates.util';

/** The aptitude and chemistry templates. */
// ---------------------------------------------------------------------------
// Aptitude
// ---------------------------------------------------------------------------

/** The eleven nets of a cube, laid out wide. */
export const CUBE_NETS: [number, number][][] = [
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 0],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 1],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 2],
  ],
  [
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 3],
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 1],
  ],
  [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 1],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [1, 3],
    [1, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 2],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 3],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 1],
    [1, 2],
    [2, 2],
    [2, 3],
  ],
];

/** A net drawn in text, one row per line, so the form can show which one is chosen. */
export const netSketch = (cells: [number, number][]): string => {
  const rows = Math.max(...cells.map(([row]) => row)) + 1;
  const columns = Math.max(...cells.map(([, column]) => column)) + 1;
  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: columns }, (_, column) =>
      cells.some(([r, c]) => r === row && c === column) ? '■' : '·',
    ).join(' '),
  ).join('\n');
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export const cubeNet: ISceneCatalogEntry = {
  key: 'cube-net',
  title: 'Folding a net',
  description: 'One of the eleven nets of a cube, labelled; the solution folds it up.',
  group: 'Aptitude',
  fields: [
    {
      kind: 'choice',
      name: 'net',
      label: 'Net',
      value: '4',
      options: CUBE_NETS.map((_, index) => ({ value: String(index), label: `Net ${index + 1}` })),
    },
    { kind: 'texts', name: 'labels', label: 'What is on each square, in reading order', value: LETTERS },
    {
      kind: 'choice',
      name: 'asked',
      label: 'The square the question asks about',
      value: '2',
      options: LETTERS.map((_, index) => ({ value: String(index), label: `Square ${index + 1}` })),
    },
    PART,
  ],
  build: (values) => {
    const cells = CUBE_NETS[Math.round(Number(values.net))] ?? CUBE_NETS[4];
    const labels = textsOf(values, 'labels', LETTERS);
    const made = cubeNetTemplate({ cells, labels, asked: Math.round(Number(values.asked)) || 0 });
    if (!made) return { version: 1, title: 'A net', objects: [{ id: 'net', type: 'net', of: 'cube', cells, labels }] };
    return isSolution(values) ? made.solution : made.question;
  },
};

export const dice: ISceneCatalogEntry = {
  key: 'dice',
  title: 'Two views of a die',
  description: 'The same die from two sides; the solution turns it to find the hidden face.',
  group: 'Aptitude',
  fields: [
    {
      kind: 'texts',
      name: 'faces',
      label: 'Faces: top, bottom, front, back, left, right',
      hint: 'A number from 1 to 6 is drawn as pips; anything else as text.',
      value: ['1', '6', '2', '5', '3', '4'],
    },
    PART,
  ],
  build: (values) => {
    const [top, bottom, front, back, left, right] = textsOf(values, 'faces', ['1', '6', '2', '5', '3', '4']);
    const made = diceTemplate({ faces: [top, bottom, front, back, left, right] });
    return isSolution(values) ? made.solution : made.question;
  },
};

const ALL_FACES: CubeFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

export const paintedCube: ISceneCatalogEntry = {
  key: 'painted-cube',
  title: 'A painted cube, cut up',
  description: 'An n × n × n block painted on chosen sides; the solution sorts the small cubes by painted faces.',
  group: 'Aptitude',
  fields: [
    number('n', 'Small cubes along each edge', 4, [2, 6, 1]),
    { kind: 'faces', name: 'painted', label: 'Painted sides', value: ALL_FACES },
    PART,
  ],
  build: (values) => {
    const painted = Array.isArray(values.painted)
      ? ALL_FACES.filter((face) => (values.painted as string[]).includes(face))
      : ALL_FACES;
    const made = paintedCubeTemplate({ n: Math.round(numberOf(values, 'n', 4)), painted });
    return isSolution(values) ? made.solution : made.question;
  },
};

// ---------------------------------------------------------------------------
// Chemistry
// ---------------------------------------------------------------------------

/** The VSEPR shapes a teacher picks from, each with the lone pairs it carries and an example. */
const SHAPES: { value: string; label: string; shape: MoleculeShape; lonePairs: number; example: [string, string] }[] = [
  { value: 'linear', label: 'Linear (CO₂)', shape: 'linear', lonePairs: 0, example: ['C', 'O'] },
  { value: 'linear-3', label: 'Linear, 3 lone pairs (XeF₂)', shape: 'linear', lonePairs: 3, example: ['Xe', 'F'] },
  { value: 'bent-1', label: 'Bent, 1 lone pair (SO₂)', shape: 'bent', lonePairs: 1, example: ['S', 'O'] },
  { value: 'bent-2', label: 'Bent, 2 lone pairs (H₂O)', shape: 'bent', lonePairs: 2, example: ['O', 'H'] },
  {
    value: 'trigonal-planar',
    label: 'Trigonal planar (BF₃)',
    shape: 'trigonal-planar',
    lonePairs: 0,
    example: ['B', 'F'],
  },
  {
    value: 'trigonal-pyramidal',
    label: 'Trigonal pyramidal (NH₃)',
    shape: 'trigonal-pyramidal',
    lonePairs: 1,
    example: ['N', 'H'],
  },
  { value: 'tetrahedral', label: 'Tetrahedral (CH₄)', shape: 'tetrahedral', lonePairs: 0, example: ['C', 'H'] },
  {
    value: 'trigonal-bipyramidal',
    label: 'Trigonal bipyramidal (PCl₅)',
    shape: 'trigonal-bipyramidal',
    lonePairs: 0,
    example: ['P', 'Cl'],
  },
  { value: 'see-saw', label: 'See-saw (SF₄)', shape: 'see-saw', lonePairs: 1, example: ['S', 'F'] },
  { value: 't-shaped', label: 'T-shaped (ClF₃)', shape: 't-shaped', lonePairs: 2, example: ['Cl', 'F'] },
  { value: 'square-planar', label: 'Square planar (XeF₄)', shape: 'square-planar', lonePairs: 2, example: ['Xe', 'F'] },
  {
    value: 'square-pyramidal',
    label: 'Square pyramidal (BrF₅)',
    shape: 'square-pyramidal',
    lonePairs: 1,
    example: ['Br', 'F'],
  },
  { value: 'octahedral', label: 'Octahedral (SF₆)', shape: 'octahedral', lonePairs: 0, example: ['S', 'F'] },
];

export const molecule: ISceneCatalogEntry = {
  key: 'molecule',
  title: 'Shape of a molecule',
  description: 'Any VSEPR shape, with its lone pairs, in ball-and-stick.',
  group: 'Chemistry',
  fields: [
    {
      kind: 'choice',
      name: 'shape',
      label: 'Shape',
      value: 'tetrahedral',
      options: SHAPES.map(({ value, label }) => ({ value, label })),
    },
    { kind: 'text', name: 'central', label: 'Central atom', hint: 'Leave empty for the example’s.', value: '' },
    { kind: 'text', name: 'ligand', label: 'Atom bonded to it', hint: 'Leave empty for the example’s.', value: '' },
  ],
  build: (values) => {
    const choice = SHAPES.find((item) => item.value === values.shape) ?? SHAPES[6];
    const central = textOf(values, 'central', choice.example[0]);
    const ligand = textOf(values, 'ligand', choice.example[1]);
    return {
      version: 1,
      title: `${choice.label.replace(/ \(.*\)$/, '')}: ${central} with ${ligand}`,
      objects: [
        {
          id: 'molecule',
          type: 'molecule',
          shape: choice.shape,
          central,
          ligands: ligand,
          ...(choice.lonePairs ? { lonePairs: choice.lonePairs } : {}),
        },
      ],
    };
  },
};

export const unitCell: ISceneCatalogEntry = {
  key: 'unit-cell',
  title: 'Unit cell',
  description: 'A cubic or hexagonal cell; show the share of each atom inside it.',
  group: 'Chemistry',
  fields: [
    {
      kind: 'choice',
      name: 'cell',
      label: 'Cell',
      value: 'fcc',
      options: (['sc', 'bcc', 'fcc', 'hcp'] as const).map((cell) => ({ value: cell, label: LATTICE_FACTS[cell].name })),
    },
    number('cells', 'Cells along each edge', 1, [1, 3, 1]),
    toggle('shares', 'Cut each atom to its share of one cell', true, 'Only for a single cell.'),
    {
      kind: 'text',
      name: 'element',
      label: 'Element',
      hint: 'Colours the atoms, e.g. Cu; leave empty for plain.',
      value: '',
    },
  ],
  build: (values) => {
    const cell = (['sc', 'bcc', 'fcc', 'hcp'] as const).find((item) => item === values.cell) ?? 'fcc';
    const element = textOf(values, 'element', '');
    return {
      version: 1,
      title: `${LATTICE_FACTS[cell].name[0].toUpperCase()}${LATTICE_FACTS[cell].name.slice(1)}: ${LATTICE_FACTS[cell].atoms} atoms per cell`,
      objects: [
        {
          id: 'cell',
          type: 'lattice',
          cell,
          cells: Math.round(numberOf(values, 'cells', 1)),
          showShares: flagOf(values, 'shares'),
          ...(element ? { element } : { colour: 'chart-1' }),
        },
      ],
    };
  },
};
