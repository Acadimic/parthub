import { flagOf, type ISceneCatalogEntry, number, numberOf, steps, toggle } from './scene-catalog-fields.util';
import type { SceneObject } from '../interfaces/scene3d.interface';

/** The mensuration and 3D geometry templates. */
// ---------------------------------------------------------------------------
// Mensuration
// ---------------------------------------------------------------------------

export const cone: ISceneCatalogEntry = {
  key: 'cone',
  title: 'Cone',
  description: 'Radius, height and slant height; cut it and open it into its sector.',
  group: 'Mensuration',
  fields: [
    number('radius', 'Radius', 3, [0.5, 20, 0.5]),
    number('height', 'Height', 4, [0.5, 30, 0.5]),
    toggle('slider', 'Let learners change the height', true),
    toggle('lengths', 'Mark r, h and l', true),
    toggle('steps', 'Add steps: cut it, then open it out', true),
  ],
  build: (values) => {
    const radius = numberOf(values, 'radius', 3);
    const height = numberOf(values, 'height', 4);
    const h = flagOf(values, 'slider') ? 'h' : height;
    const marks: SceneObject[] = flagOf(values, 'lengths')
      ? [
          { id: 'r', type: 'segment', from: [0, 0, 0], to: [radius, 0, 0], label: `r = ${radius}` },
          { id: 'h', type: 'segment', from: [0, 0, 0], to: [0, 0, h], label: 'h', dashed: true },
          { id: 'l', type: 'segment', from: [radius, 0, 0], to: [0, 0, h], label: 'l', colour: 'primary' },
        ]
      : [];
    const hide = marks.map((mark) => mark.id);
    return steps(
      {
        version: 1,
        title: 'A cone',
        ...(flagOf(values, 'slider')
          ? { sliders: [{ name: 'h', label: 'Height h', min: height / 2, max: height * 2, value: height }] }
          : {}),
        objects: [{ id: 'cone', type: 'cone', radius, height: h, colour: 'chart-1', opacity: 0.6 }, ...marks],
      },
      [
        { label: 'The cone' },
        {
          label: 'Cut halfway up: the section is a circle',
          hide,
          action: { slice: 'cone', at: flagOf(values, 'slider') ? 'h/2' : height / 2 },
        },
        { label: 'Open the curved surface into a sector', action: { unfold: 'cone' } },
        { label: 'Fold it back', show: hide, action: { fold: 'cone' } },
      ],
      flagOf(values, 'steps'),
    );
  },
};

export const cylinder: ISceneCatalogEntry = {
  key: 'cylinder',
  title: 'Cylinder',
  description: 'Unrolls into a rectangle 2πr wide and two circles.',
  group: 'Mensuration',
  fields: [
    number('radius', 'Radius', 1.5, [0.5, 20, 0.5]),
    number('height', 'Height', 4, [0.5, 30, 0.5]),
    toggle('steps', 'Add a step that unrolls it', true),
  ],
  build: (values) =>
    steps(
      {
        version: 1,
        title: 'A cylinder',
        objects: [
          {
            id: 'cylinder',
            type: 'cylinder',
            radius: numberOf(values, 'radius', 1.5),
            height: numberOf(values, 'height', 4),
            colour: 'chart-1',
          },
        ],
      },
      [
        { label: 'The cylinder' },
        { label: 'Unroll it: the curved surface is a rectangle', action: { unfold: 'cylinder' } },
      ],
      flagOf(values, 'steps'),
    ),
};

export const sphere: ISceneCatalogEntry = {
  key: 'sphere',
  title: 'Sphere and hemisphere',
  description: 'A sphere beside a hemisphere of the same radius; cut the sphere in two.',
  group: 'Mensuration',
  fields: [
    number('radius', 'Radius', 2, [0.5, 20, 0.5]),
    toggle('steps', 'Add a step that cuts the sphere through its centre', true),
  ],
  build: (values) => {
    const radius = numberOf(values, 'radius', 2);
    return steps(
      {
        version: 1,
        title: 'A sphere and a hemisphere',
        objects: [
          { id: 'sphere', type: 'sphere', radius, position: [-radius * 1.6, 0, 0], colour: 'chart-1' },
          { id: 'half', type: 'hemisphere', radius, position: [radius * 1.6, 0, 0], colour: 'chart-3' },
        ],
      },
      [
        { label: 'A sphere and a hemisphere' },
        { label: 'Cut the sphere through its centre', action: { slice: 'sphere', at: radius } },
      ],
      flagOf(values, 'steps'),
    );
  },
};

export const prism: ISceneCatalogEntry = {
  key: 'prism',
  title: 'Prism or pyramid',
  description: 'A regular prism or pyramid with any number of sides; open it into its net.',
  group: 'Mensuration',
  fields: [
    {
      kind: 'choice',
      name: 'solid',
      label: 'Solid',
      value: 'prism',
      options: [
        { value: 'prism', label: 'Prism' },
        { value: 'pyramid', label: 'Pyramid' },
      ],
    },
    number('sides', 'Sides of the base', 6, [3, 8, 1]),
    number('radius', 'Distance from the centre to a corner', 2, [0.5, 20, 0.5]),
    number('height', 'Height', 4, [0.5, 30, 0.5]),
    toggle('steps', 'Add a step that opens it into its net', true),
  ],
  build: (values) => {
    const type = values.solid === 'pyramid' ? 'pyramid' : 'prism';
    const sides = Math.round(numberOf(values, 'sides', 6));
    return steps(
      {
        version: 1,
        title: `A ${sides}-sided ${type}`,
        objects: [
          {
            id: 'solid',
            type,
            sides,
            radius: numberOf(values, 'radius', 2),
            height: numberOf(values, 'height', 4),
            colour: 'chart-2',
          },
        ],
      },
      [{ label: `The ${type}` }, { label: 'Open it into its net', action: { unfold: 'solid' } }],
      flagOf(values, 'steps'),
    );
  },
};

// ---------------------------------------------------------------------------
// 3D geometry
// ---------------------------------------------------------------------------

export const planes: ISceneCatalogEntry = {
  key: 'planes',
  title: 'Two planes and their angle',
  description: 'A floor and a tilted plane, with the angle between them marked.',
  group: '3D geometry',
  fields: [
    number('angle', 'Angle between them (degrees)', 60, [5, 85, 5]),
    toggle('slider', 'Let learners change the angle', true),
  ],
  build: (values) => {
    const angle = numberOf(values, 'angle', 60);
    const isLive = flagOf(values, 'slider');
    // A normal tipped `angle` degrees from straight up makes the plane meet the floor at that angle.
    const tilt = isLive ? 't' : Number(Math.tan((angle * Math.PI) / 180).toFixed(4));
    return {
      version: 1,
      title: 'The angle between two planes',
      ...(isLive
        ? { sliders: [{ name: 'a', label: 'Angle (degrees)', min: 5, max: 85, value: Math.min(85, angle) }] }
        : {}),
      objects: [
        { id: 'floor', type: 'plane', point: [0, 0, 0], normal: [0, 0, 1], size: 6, colour: 'chart-2', opacity: 0.35 },
        {
          id: 'roof',
          type: 'plane',
          point: [0, 0, 0],
          normal: isLive ? [0, '-tan(a*pi/180)', 1] : [0, typeof tilt === 'number' ? -tilt : 0, 1],
          size: 6,
          colour: 'chart-4',
          opacity: 0.35,
        },
        { id: 'theta', type: 'angle', between: ['floor', 'roof'], showValue: true },
      ],
    };
  },
};

export const vectors: ISceneCatalogEntry = {
  key: 'vectors',
  title: 'Adding two vectors',
  description: 'Vectors a and b from the origin, and their sum, on x, y and z axes.',
  group: '3D geometry',
  fields: [
    number('ax', 'a: x', 3, [-10, 10, 0.5]),
    number('ay', 'a: y', 0, [-10, 10, 0.5]),
    number('az', 'a: z', 1, [-10, 10, 0.5]),
    number('bx', 'b: x', 0, [-10, 10, 0.5]),
    number('by', 'b: y', 3, [-10, 10, 0.5]),
    number('bz', 'b: z', 2, [-10, 10, 0.5]),
    toggle('steps', 'Add steps: a, then b from its tip, then the sum', true),
  ],
  build: (values) => {
    const a: [number, number, number] = [
      numberOf(values, 'ax', 3),
      numberOf(values, 'ay', 0),
      numberOf(values, 'az', 1),
    ];
    const b: [number, number, number] = [
      numberOf(values, 'bx', 0),
      numberOf(values, 'by', 3),
      numberOf(values, 'bz', 2),
    ];
    const sum: [number, number, number] = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    return steps(
      {
        version: 1,
        title: 'Adding two vectors',
        axes: true,
        objects: [
          { id: 'a', type: 'vector', to: a, label: 'a', colour: 'chart-1' },
          { id: 'b', type: 'vector', to: b, label: 'b', colour: 'chart-3' },
          { id: 'shifted', type: 'vector', from: a, to: sum, label: 'b', colour: 'chart-3', opacity: 0.6 },
          { id: 'sum', type: 'vector', to: sum, label: 'a + b', colour: 'primary' },
        ],
      },
      [
        { label: 'Vector a', hide: ['b', 'shifted', 'sum'] },
        { label: 'Vector b', show: ['b'] },
        { label: 'Move b to start where a ends', hide: ['b'], show: ['shifted'] },
        { label: 'a + b runs from the start of a to the end of b', show: ['sum'] },
      ],
      flagOf(values, 'steps'),
    );
  },
};
