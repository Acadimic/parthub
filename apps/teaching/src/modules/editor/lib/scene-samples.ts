import type { IRichTextDoc } from '@repo/shared/interfaces';
import {
  cubeNetTemplate,
  diceTemplate,
  LATTICE_FACTS,
  paintedCubeTemplate,
  richTextFromMarkdown,
} from '@repo/shared/utils';

const scene = (value: object): string => `\`\`\`scene3d\n${JSON.stringify(value, null, 2)}\n\`\`\``;

const CONE = scene({
  version: 1,
  title: 'Slant height of a cone',
  sliders: [{ name: 'h', label: 'Height h', min: 2, max: 8, value: 4, step: 0.5 }],
  objects: [
    { id: 'cone', type: 'cone', radius: 3, height: 'h', colour: 'chart-1', opacity: 0.55 },
    { id: 'r', type: 'segment', from: [0, 0, 0], to: [3, 0, 0], label: 'r = 3', colour: 'foreground' },
    { id: 'h', type: 'segment', from: [0, 0, 0], to: [0, 0, 'h'], label: 'h', dashed: true, colour: 'foreground' },
    { id: 'l', type: 'segment', from: [3, 0, 0], to: [0, 0, 'h'], label: 'l', colour: 'primary' },
  ],
  steps: [
    { label: 'The cone, its radius, height and slant height' },
    { label: 'Cut halfway up: the section is a circle', hide: ['r', 'h', 'l'], action: { slice: 'cone', at: 'h/2' } },
    { label: 'Open the curved surface into a sector', action: { unfold: 'cone' } },
    { label: 'Fold it back into the cone', show: ['r', 'h', 'l'], action: { fold: 'cone' } },
  ],
});

const CUBE_NET = scene({
  version: 1,
  title: 'The net of a cube',
  objects: [{ id: 'cube', type: 'cube', size: 2, colour: 'chart-2', opacity: 0.9 }],
  steps: [
    { label: 'A cube of side 2' },
    { label: 'Open it out into a net of six squares', action: { unfold: 'cube' } },
    { label: 'Look straight down on the net', camera: { position: [0, -0.5, 16] } },
    { label: 'Fold it back up', action: { fold: 'cube' }, camera: { position: [6, -7, 5] } },
  ],
});

const CYLINDER_NET = scene({
  version: 1,
  title: 'The curved surface of a cylinder is a rectangle',
  objects: [
    { id: 'can', type: 'cylinder', radius: 1, height: 2.5, colour: 'chart-1', opacity: 0.9 },
    { id: 'w', type: 'label', position: [0, -1.1, 1.25], text: '2πr wide, 2.5 high' },
  ],
  steps: [
    { label: 'A cylinder of radius 1 and height 2.5' },
    { label: 'Unroll it: the curved surface becomes a rectangle', show: ['w'], action: { unfold: 'can' } },
  ],
});

const VECTORS = scene({
  version: 1,
  title: 'A box, its base plane and two vectors',
  axes: true,
  objects: [
    {
      id: 'box',
      type: 'cuboid',
      length: 4,
      width: 3,
      height: 2,
      position: [2, 1.5, 0],
      colour: 'chart-2',
      opacity: 0.35,
    },
    { id: 'base', type: 'plane', point: [0, 0, 0], normal: [0, 0, 1], size: 6, colour: 'muted', opacity: 0.2 },
    { id: 'a', type: 'vector', to: [4, 0, 0], label: 'a', colour: 'chart-1' },
    { id: 'b', type: 'vector', to: [0, 3, 0], label: 'b', colour: 'chart-3' },
    { id: 'sum', type: 'vector', to: [4, 3, 2], colour: 'primary' },
    { id: 'corner', type: 'point', position: [4, 3, 2], label: 'P(4, 3, 2)' },
  ],
});

const PLANES = scene({
  version: 1,
  title: 'The angle between two planes',
  sliders: [{ name: 't', label: 'Tilt', min: 0.2, max: 3, value: 1 }],
  objects: [
    { id: 'floor', type: 'plane', point: [0, 0, 0], normal: [0, 0, 1], size: 6, colour: 'chart-2', opacity: 0.35 },
    { id: 'roof', type: 'plane', point: [0, 0, 0], normal: [0, '-t', 1], size: 6, colour: 'chart-4', opacity: 0.35 },
    { id: 'theta', type: 'angle', between: ['floor', 'roof'], showValue: true },
  ],
});

const BALLS = scene({
  version: 1,
  title: 'A sphere and a hemisphere of the same radius',
  sliders: [{ name: 'r', label: 'Radius r', min: 1, max: 3, value: 2, step: 0.1 }],
  objects: [
    { id: 'sphere', type: 'sphere', radius: 'r', position: [-3.5, 0, 0], colour: 'chart-1', opacity: 0.8 },
    { id: 'half', type: 'hemisphere', radius: 'r', position: [3.5, 0, 0], colour: 'chart-3', opacity: 0.8 },
    { id: 'rs', type: 'segment', from: [-3.5, 0, 0], to: ['r - 3.5', 0, 0], label: 'r' },
  ],
  steps: [
    { label: 'A sphere and a hemisphere' },
    { label: 'Cut the sphere through its centre', hide: ['rs'], action: { slice: 'sphere', at: 'r' } },
    { label: 'Each half is the hemisphere', action: { highlight: 'half' } },
  ],
});

const SOLIDS = scene({
  version: 1,
  title: 'Prism, pyramid and frustum',
  objects: [
    { id: 'prism', type: 'prism', sides: 6, radius: 1.5, height: 3, position: [-4.5, 0, 0], colour: 'chart-1' },
    { id: 'pyramid', type: 'pyramid', sides: 4, radius: 1.8, height: 3.5, position: [0, 0, 0], colour: 'chart-2' },
    {
      id: 'frustum',
      type: 'frustum',
      radius: 1.8,
      topRadius: 1,
      height: 2.5,
      position: [4.5, 0, 0],
      colour: 'chart-3',
    },
    { id: 'p', type: 'label', position: [-4.5, 0, 3.6], text: 'hexagonal prism' },
    { id: 'q', type: 'label', position: [0, 0, 4.1], text: 'square pyramid' },
    { id: 'f', type: 'label', position: [4.5, 0, 3.1], text: 'frustum of a cone' },
  ],
  steps: [
    { label: 'Three solids' },
    { label: 'Open the pyramid: a square and four triangles', hide: ['q'], action: { unfold: 'pyramid' } },
    { label: 'Fold the pyramid back up', show: ['q'], action: { fold: 'pyramid' } },
    { label: 'Open the prism: two hexagons and six rectangles', hide: ['p'], action: { unfold: 'prism' } },
    { label: 'Fold the prism back up', show: ['p'], action: { fold: 'prism' } },
    { label: 'Cut the frustum across', action: { slice: 'frustum', at: 1.2 } },
    { label: 'Tip the frustum over', hide: ['f'], action: { rotate: 'frustum', axis: 'y', angle: 90 } },
  ],
});

/** 3D scenes, written as Markdown fences so the preset also exercises the import path. */
export const SCENES_DOC: IRichTextDoc = richTextFromMarkdown(
  [
    '# 3D scenes',
    'A scene opens from its card. Drag to turn it, scroll to zoom, move the sliders, and follow its steps.',
    '## Mensuration',
    'A cone of radius 3: as the height grows, so does the slant height $l = \\sqrt{r^2 + h^2}$.',
    CONE,
    'A cube opens into a net of six squares, and a cylinder unrolls into a rectangle and two circles.',
    CUBE_NET,
    CYLINDER_NET,
    'The volume of a hemisphere is half that of the sphere: $\\tfrac{2}{3}\\pi r^3$.',
    BALLS,
    SOLIDS,
    '## 3D geometry',
    VECTORS,
    'Tilt the second plane and watch the angle between them change.',
    PLANES,
  ].join('\n\n'),
).doc;

const NET = cubeNetTemplate({
  cells: [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 2],
  ],
  labels: ['A', 'B', 'C', 'D', 'E', 'F'],
  asked: 2,
});
const DICE = diceTemplate({ faces: ['1', '6', '2', '5', '3', '4'] });
const PAINTED = paintedCubeTemplate({ n: 4 });

/** Three aptitude questions, each with its picture and a solution scene that works it out. */
export const APTITUDE_DOC: IRichTextDoc = richTextFromMarkdown(
  [
    '# Aptitude: cubes and dice',
    '## 1. Folding a net',
    'The net below is folded into a cube. Which letter is on the face opposite **C**?',
    NET ? scene(NET.question) : '',
    '- A\n- B\n- E\n- F',
    `**Solution.** Fold it with C on top and turn the cube over: the face underneath is **${NET?.answer.opposite ?? ''}**.`,
    NET ? scene(NET.solution) : '',
    '## 2. Two views of a die',
    'Two positions of the same die are shown. Which number is on the face opposite **1**?',
    scene(DICE.question),
    '- 2\n- 3\n- 5\n- 6',
    `**Solution.** 2, 3, 4 and 5 all touch 1 in one view or the other, so the face opposite it is **${DICE.answer.opposite}**.`,
    scene(DICE.solution),
    '## 3. A painted cube',
    'A 4 cm cube is painted on all six faces and cut into 1 cm cubes. How many small cubes have exactly **two** painted faces?',
    scene(PAINTED.question),
    '- 8\n- 16\n- 24\n- 32',
    `**Solution.** Two painted faces means an edge, but not a corner: 12 edges with 2 such cubes each, so **${PAINTED.answer.counts[2]}**.`,
    scene(PAINTED.solution),
  ]
    .filter(Boolean)
    .join('\n\n'),
).doc;

/** Twelve VSEPR shapes, one per step, each with the angles it fixes. */
const VSEPR: [string, string, string, string | string[], number | undefined, string][] = [
  ['co2', 'linear', 'C', 'O', 0, 'CO₂ — linear, 180°'],
  ['h2o', 'bent', 'O', 'H', 2, 'H₂O — bent; two bonds and two lone pairs point to the corners of a tetrahedron'],
  ['bf3', 'trigonal-planar', 'B', 'F', 0, 'BF₃ — trigonal planar, 120°'],
  ['nh3', 'trigonal-pyramidal', 'N', 'H', 1, 'NH₃ — trigonal pyramidal; one lone pair on top'],
  ['ch4', 'tetrahedral', 'C', 'H', 0, 'CH₄ — tetrahedral, 109.5°'],
  ['pcl5', 'trigonal-bipyramidal', 'P', 'Cl', 0, 'PCl₅ — trigonal bipyramidal, 90° and 120°'],
  ['sf4', 'see-saw', 'S', 'F', 1, 'SF₄ — see-saw; the lone pair takes an equatorial place'],
  ['clf3', 't-shaped', 'Cl', 'F', 2, 'ClF₃ — T-shaped; two equatorial lone pairs'],
  ['xef4', 'square-planar', 'Xe', 'F', 2, 'XeF₄ — square planar; lone pairs above and below'],
  ['brf5', 'square-pyramidal', 'Br', 'F', 1, 'BrF₅ — square pyramidal'],
  ['sf6', 'octahedral', 'S', 'F', 0, 'SF₆ — octahedral, 90°'],
  ['xef2', 'linear', 'Xe', 'F', 3, 'XeF₂ — linear, with three lone pairs round the middle'],
];

const MOLECULES = scene({
  version: 1,
  title: 'VSEPR shapes',
  objects: VSEPR.map(([id, shape, central, ligands, lonePairs]) => ({
    id,
    type: 'molecule',
    shape,
    central,
    ligands,
    ...(lonePairs ? { lonePairs } : {}),
  })),
  steps: VSEPR.map(([id, , , , , label], index) => ({
    label,
    show: [id],
    ...(index ? { hide: [VSEPR[index - 1][0]] } : {}),
  })),
});

const ETHENE = scene({
  version: 1,
  title: 'Ethene: a carbon–carbon double bond',
  objects: [
    { id: 'c1', type: 'atom', element: 'C', position: [-0.67, 0, 0] },
    { id: 'c2', type: 'atom', element: 'C', position: [0.67, 0, 0] },
    { id: 'h1', type: 'atom', element: 'H', position: [-1.23, 0.93, 0] },
    { id: 'h2', type: 'atom', element: 'H', position: [-1.23, -0.93, 0] },
    { id: 'h3', type: 'atom', element: 'H', position: [1.23, 0.93, 0] },
    { id: 'h4', type: 'atom', element: 'H', position: [1.23, -0.93, 0] },
    { id: 'cc', type: 'bond', from: 'c1', to: 'c2', order: 2 },
    { id: 'b1', type: 'bond', from: 'c1', to: 'h1' },
    { id: 'b2', type: 'bond', from: 'c1', to: 'h2' },
    { id: 'b3', type: 'bond', from: 'c2', to: 'h3' },
    { id: 'b4', type: 'bond', from: 'c2', to: 'h4' },
  ],
});

const COUNTS: Record<string, string> = {
  sc: '8 corners × 1/8 = 1 atom',
  bcc: '8 × 1/8 + 1 in the middle = 2 atoms',
  fcc: '8 × 1/8 + 6 faces × 1/2 = 4 atoms',
  hcp: '12 × 1/6 + 2 × 1/2 + 3 inside = 6 atoms',
};
const CELLS = ['sc', 'bcc', 'fcc', 'hcp'] as const;

const UNIT_CELLS = scene({
  version: 1,
  title: 'Atoms in a unit cell',
  objects: CELLS.map((cell) => ({ id: cell, type: 'lattice', cell, showShares: true, colour: 'chart-1' })),
  steps: CELLS.map((cell, index) => ({
    label: `${LATTICE_FACTS[cell].name}: ${COUNTS[cell]}`,
    show: [cell],
    ...(index ? { hide: [CELLS[index - 1]] } : {}),
  })),
});

const COPPER = scene({
  version: 1,
  title: 'Copper: 2 × 2 × 2 face-centred cubic cells',
  objects: [{ id: 'cu', type: 'lattice', cell: 'fcc', cells: 2, element: 'Cu' }],
});

/** Molecules from their VSEPR shapes, a molecule built from atoms and bonds, and unit cells. */
export const MOLECULES_DOC: IRichTextDoc = richTextFromMarkdown(
  [
    '# Molecules and crystals',
    '## VSEPR shapes',
    'Step through the twelve shapes, drawn at their ideal angles. Lone pairs are the faint lobes: they take corners of the shape too, which is why a molecule that has them is bent, pyramidal or T-shaped.',
    MOLECULES,
    '## Built from atoms and bonds',
    ETHENE,
    '## Unit cells',
    'Each atom is cut to the part of it inside the cell, so the shares can be added up.',
    UNIT_CELLS,
    COPPER,
  ].join('\n\n'),
).doc;
