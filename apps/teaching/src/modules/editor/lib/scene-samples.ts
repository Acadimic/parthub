import type { IRichTextDoc } from '@repo/shared/interfaces';
import { richTextFromMarkdown } from '@repo/shared/utils';

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
