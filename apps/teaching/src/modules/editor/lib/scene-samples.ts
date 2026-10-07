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
});

/** 3D scenes, written as Markdown fences so the preset also exercises the import path. */
export const SCENES_DOC: IRichTextDoc = richTextFromMarkdown(
  [
    '# 3D scenes',
    'A scene opens from its card. Drag to turn it, scroll to zoom, and move the sliders.',
    '## Mensuration',
    'A cone of radius 3: as the height grows, so does the slant height $l = \\sqrt{r^2 + h^2}$.',
    CONE,
    'The volume of a hemisphere is half that of the sphere: $\\tfrac{2}{3}\\pi r^3$.',
    BALLS,
    SOLIDS,
    '## 3D geometry',
    VECTORS,
    'Tilt the second plane and watch the angle between them change.',
    PLANES,
  ].join('\n\n'),
).doc;
