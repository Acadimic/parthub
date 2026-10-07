import type { SceneNumber, SceneObject } from '@repo/shared/interfaces';
import { sceneNumber } from '@repo/shared/utils';
import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  Float32BufferAttribute,
  Group,
  Matrix4,
  type Mesh,
  PlaneGeometry,
  Shape,
  ShapeGeometry,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three';

type Values = Readonly<Record<string, number>>;

/** How a solid's faces are made: the builder owns materials and outlines, this file owns shapes. */
export interface ISolidPaint {
  /** One face or the whole surface, in the solid's colour and outlined. */
  face(geometry: BufferGeometry): Mesh;
  /** The face a cut leaves, in a colour of its own. */
  section(geometry: BufferGeometry): Mesh;
}

/** How far a solid reaches sideways and up and down from its `position`. */
export const solidExtent = (
  object: SceneObject,
  values: Values,
): { radius: number; below: number; above: number } | null => {
  const n = (value: SceneNumber) => sceneNumber(value, values);
  switch (object.type) {
    case 'cube':
      return { radius: n(object.size) / 2, below: 0, above: n(object.size) };
    case 'cuboid':
      return { radius: Math.max(n(object.length), n(object.width)) / 2, below: 0, above: n(object.height) };
    case 'sphere':
      return { radius: n(object.radius), below: -n(object.radius), above: n(object.radius) };
    case 'hemisphere':
      return { radius: n(object.radius), below: 0, above: n(object.radius) };
    case 'prism':
    case 'pyramid':
    case 'cylinder':
    case 'cone':
    case 'frustum':
      return { radius: n(object.radius), below: 0, above: n(object.height) };
    default:
      return null;
  }
};

/** A round or many-sided solid as three.js builds it: a bottom and top radius about its own y axis. */
interface ITapered {
  bottom: number;
  top: number;
  height: number;
  sides: number;
}

const tapered = (object: SceneObject, values: Values): ITapered | null => {
  const n = (value: SceneNumber) => sceneNumber(value, values);
  switch (object.type) {
    case 'prism':
      return { bottom: n(object.radius), top: n(object.radius), height: n(object.height), sides: object.sides };
    case 'pyramid':
      return { bottom: n(object.radius), top: 0, height: n(object.height), sides: object.sides };
    case 'cylinder':
      return { bottom: n(object.radius), top: n(object.radius), height: n(object.height), sides: 64 };
    case 'cone':
      return { bottom: n(object.radius), top: 0, height: n(object.height), sides: 64 };
    case 'frustum':
      return { bottom: n(object.radius), top: n(object.topRadius), height: n(object.height), sides: 64 };
    default:
      return null;
  }
};

/** three.js builds these along y; this stands them on z, the scene's up. */
const STAND_UP = new Matrix4().makeRotationX(Math.PI / 2);

/** A piece of a tapered solid from height `low` to `high`, standing on z. */
const taperedPiece = (shape: ITapered, low: number, high: number): BufferGeometry => {
  const radiusAt = (z: number) => shape.bottom + ((shape.top - shape.bottom) * z) / shape.height;
  return new CylinderGeometry(radiusAt(high), radiusAt(low), high - low, shape.sides)
    .applyMatrix4(STAND_UP)
    .translate(0, 0, (low + high) / 2);
};

/** The polygon or circle where a tapered solid is cut at height `z`; its corners meet the solid's. */
const taperedSection = (shape: ITapered, z: number): BufferGeometry =>
  new CircleGeometry(
    shape.bottom + ((shape.top - shape.bottom) * z) / shape.height,
    shape.sides,
    -Math.PI / 2,
  ).translate(0, 0, z);

/** A ball cut between polar angles, measured from the top; the sphere's centre sits at `centre`. */
const ballPiece = (radius: number, from: number, to: number, centre: number): BufferGeometry =>
  new SphereGeometry(radius, 64, 24, 0, Math.PI * 2, from, to - from).applyMatrix4(STAND_UP).translate(0, 0, centre);

/** The solid whole, standing on its base at the origin; a sphere is centred there. */
const wholeSolid = (object: SceneObject, values: Values, paint: ISolidPaint): Mesh[] => {
  const n = (value: SceneNumber) => sceneNumber(value, values);
  const shape = tapered(object, values);
  if (shape) return [paint.face(taperedPiece(shape, 0, shape.height))];
  switch (object.type) {
    case 'cube':
      return [
        paint.face(new BoxGeometry(n(object.size), n(object.size), n(object.size)).translate(0, 0, n(object.size) / 2)),
      ];
    case 'cuboid':
      return [
        paint.face(
          new BoxGeometry(n(object.length), n(object.width), n(object.height)).translate(0, 0, n(object.height) / 2),
        ),
      ];
    case 'sphere':
      return [paint.face(ballPiece(n(object.radius), 0, Math.PI, 0))];
    case 'hemisphere':
      return [
        paint.face(ballPiece(n(object.radius), 0, Math.PI / 2, 0)),
        paint.face(new CircleGeometry(n(object.radius), 64)),
      ];
    default:
      return [];
  }
};

/** How far the top part of a cut solid moves up, at full gap: enough to see the cut face clearly. */
const LIFT = 0.35;

/** The solid cut across at height `at` above its base, its top part lifted by `gap`. */
const cutSolid = (
  object: SceneObject,
  values: Values,
  cut: { at: number; gap: number },
  paint: ISolidPaint,
): Mesh[] => {
  const extent = solidExtent(object, values);
  if (!extent) return [];
  const height = extent.above - extent.below;
  const z = extent.below + Math.max(height * 0.01, Math.min(height * 0.99, cut.at));
  const lift = cut.gap * LIFT * height;
  const raise = (meshes: Mesh[]): Mesh[] => {
    meshes.forEach((mesh) => mesh.position.setZ(mesh.position.z + lift));
    return meshes;
  };
  const shape = tapered(object, values);
  if (shape) {
    return [
      paint.face(taperedPiece(shape, 0, z)),
      paint.section(taperedSection(shape, z)),
      ...raise([paint.face(taperedPiece(shape, z, shape.height)), paint.section(taperedSection(shape, z))]),
    ];
  }
  if (object.type === 'cube' || object.type === 'cuboid') {
    const n = (value: SceneNumber) => sceneNumber(value, values);
    const [length, width] =
      object.type === 'cube' ? [n(object.size), n(object.size)] : [n(object.length), n(object.width)];
    const box = (low: number, high: number) =>
      new BoxGeometry(length, width, high - low).translate(0, 0, (low + high) / 2);
    const section = () => new PlaneGeometry(length, width).translate(0, 0, z);
    return [
      paint.face(box(0, z)),
      paint.section(section()),
      ...raise([paint.face(box(z, height)), paint.section(section())]),
    ];
  }
  // A sphere or hemisphere: the cut is a circle, the parts are caps of the ball.
  const radius = extent.radius;
  const polar = Math.acos(Math.max(-1, Math.min(1, z / radius)));
  const disc = () => new CircleGeometry(Math.sqrt(Math.max(radius * radius - z * z, 0)), 64).translate(0, 0, z);
  const bottom = object.type === 'sphere' ? Math.PI : Math.PI / 2;
  const lower = [paint.face(ballPiece(radius, polar, bottom, 0)), paint.section(disc())];
  if (object.type === 'hemisphere') lower.push(paint.face(new CircleGeometry(radius, 64)));
  return [...lower, ...raise([paint.face(ballPiece(radius, 0, polar, 0)), paint.section(disc())])];
};

// ---------------------------------------------------------------------------
// Nets
// ---------------------------------------------------------------------------

/** A flat polygon in its own xy plane. */
const polygon = (points: Vector2[]): BufferGeometry => new ShapeGeometry(new Shape(points));

/**
 * A hinge on the base edge from `a` to `b`: x runs along the edge, y points out of the base and z up,
 * so a face drawn flat in its xy plane lies outward on the floor and swings up as the hinge turns
 * about x.
 */
const hinge = (a: Vector3, b: Vector3, centre: Vector3): { pivot: Group; length: number } => {
  const middle = a.clone().add(b).multiplyScalar(0.5);
  const along = b.clone().sub(a);
  const out = new Vector3(-along.y, along.x, 0).normalize();
  if (out.dot(middle.clone().sub(centre)) < 0) out.negate();
  const x = out.clone().cross(new Vector3(0, 0, 1));
  const origin = along.dot(x) > 0 ? a : b;
  const pivot = new Group();
  pivot.quaternion.setFromRotationMatrix(new Matrix4().makeBasis(x, out, new Vector3(0, 0, 1)));
  pivot.position.copy(origin);
  return { pivot, length: along.length() };
};

/** The corners of a box's or a regular solid's base, matching how the solid itself is drawn. */
const baseCorners = (object: SceneObject, values: Values): Vector3[] => {
  const n = (value: SceneNumber) => sceneNumber(value, values);
  if (object.type === 'cube' || object.type === 'cuboid') {
    const [x, y] =
      object.type === 'cube' ? [n(object.size) / 2, n(object.size) / 2] : [n(object.length) / 2, n(object.width) / 2];
    return [new Vector3(-x, -y, 0), new Vector3(x, -y, 0), new Vector3(x, y, 0), new Vector3(-x, y, 0)];
  }
  if (object.type !== 'prism' && object.type !== 'pyramid') return [];
  const radius = n(object.radius);
  return Array.from({ length: object.sides }, (_, index) => {
    const angle = (2 * Math.PI * index) / object.sides;
    return new Vector3(radius * Math.sin(angle), -radius * Math.cos(angle), 0);
  });
};

/**
 * A box, prism or pyramid opened `open` of the way into its net: the base stays on the floor, each
 * side swings out on its base edge, and a prism's top swings out on the far edge of its first side.
 */
const flatNet = (object: SceneObject, values: Values, open: number, paint: ISolidPaint): Group => {
  const group = new Group();
  const corners = baseCorners(object, values);
  const centre = new Vector3();
  const height = solidExtent(object, values)?.above ?? 1;
  const isPyramid = object.type === 'pyramid';
  group.add(paint.face(polygon(corners.map((corner) => new Vector2(corner.x, corner.y)))));
  corners.forEach((corner, index) => {
    const { pivot, length } = hinge(corner, corners[(index + 1) % corners.length], centre);
    const toLocal = pivot.matrix.compose(pivot.position, pivot.quaternion, pivot.scale).clone().invert();
    const apothem = corner
      .clone()
      .add(corners[(index + 1) % corners.length])
      .multiplyScalar(0.5)
      .length();
    // Closed, a side stands square to the base, or leans in to a pyramid's apex.
    const closed = isPyramid ? Math.PI - Math.atan2(height, apothem) : Math.PI / 2;
    const side = new Group();
    side.rotation.x = closed * (1 - open);
    const outline = isPyramid
      ? [new Vector2(0, 0), new Vector2(length, 0), new Vector2(length / 2, Math.hypot(height, apothem))]
      : [new Vector2(0, 0), new Vector2(length, 0), new Vector2(length, height), new Vector2(0, height)];
    side.add(paint.face(polygon(outline)));
    if (!isPyramid && index === 0) {
      const top = new Group();
      top.position.set(0, height, 0);
      top.rotation.x = (Math.PI / 2) * (1 - open);
      // The base as seen from this side's hinge, mirrored so it lies beyond the side's top edge.
      top.add(
        paint.face(
          polygon(corners.map((point) => point.clone().applyMatrix4(toLocal)).map((p) => new Vector2(p.x, -p.y))),
        ),
      );
      side.add(top);
    }
    pivot.add(side);
    group.add(pivot);
  });
  return group;
};

/** A surface from a grid of points, skipping the triangles that collapse to a line at a cone's apex. */
const gridSurface = (columns: number, rows: number, at: (column: number, row: number) => Vector3): BufferGeometry => {
  const points = Array.from({ length: (columns + 1) * (rows + 1) }, (_, index) =>
    at(index % (columns + 1), Math.floor(index / (columns + 1))),
  );
  const indices: number[] = [];
  const add = (a: number, b: number, c: number) => {
    const area = points[b].clone().sub(points[a]).cross(points[c].clone().sub(points[a])).lengthSq();
    if (area > 1e-12) indices.push(a, b, c);
  };
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const corner = row * (columns + 1) + column;
      add(corner, corner + 1, corner + columns + 2);
      add(corner, corner + columns + 2, corner + columns + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      points.flatMap((point) => point.toArray()),
      3,
    ),
  );
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/** A disc swung on a hinge along x through `at`: flat towards +y at angle 0, turned about x by `angle`. */
const hingedDisc = (radius: number, at: Vector3, angle: number, paint: ISolidPaint): Group => {
  const pivot = new Group();
  pivot.position.copy(at);
  pivot.rotation.x = angle;
  pivot.add(paint.face(new CircleGeometry(radius, 64).translate(0, radius, 0)));
  return pivot;
};

/**
 * A cylinder unrolling about its front line: its curve flattens into a rectangle standing where it
 * touched, and the two circles swing up and down to meet the rectangle's edges, as a net is drawn.
 */
const cylinderNet = (radius: number, height: number, open: number, paint: ISolidPaint): Group => {
  const group = new Group();
  const bend = Math.max(1 - open, 1e-4) / radius;
  const surface = gridSurface(96, 1, (column, row) => {
    const arc = (column / 96 - 0.5) * 2 * Math.PI * radius;
    const along = Math.sin(arc * bend) / bend;
    const depth = (1 - Math.cos(arc * bend)) / bend;
    return new Vector3(along, -radius + depth, row * height);
  });
  group.add(paint.face(surface));
  group.add(hingedDisc(radius, new Vector3(0, -radius, 0), (-Math.PI / 2) * open, paint));
  group.add(hingedDisc(radius, new Vector3(0, -radius, height), (Math.PI / 2) * open, paint));
  return group;
};

/**
 * A cone opening like an umbrella turned inside out: its curved surface flattens into the sector it
 * is cut from, level with the apex, and its base swings out to touch the sector's arc.
 */
const coneNet = (radius: number, height: number, open: number, paint: ISolidPaint): Group => {
  const group = new Group();
  const slant = Math.hypot(radius, height);
  const sector = (2 * Math.PI * radius) / slant;
  const tilt = Math.asin(radius / slant) + (Math.PI / 2 - Math.asin(radius / slant)) * open;
  const apex = new Vector3(0, 0, height);
  const surface = gridSurface(96, 1, (column, row) => {
    const around = ((column / 96 - 0.5) * sector) / Math.sin(tilt);
    const reach = row * slant;
    return apex
      .clone()
      .add(
        new Vector3(
          Math.sin(tilt) * Math.sin(around),
          -Math.sin(tilt) * Math.cos(around),
          -Math.cos(tilt),
        ).multiplyScalar(reach),
      );
  });
  group.add(paint.face(surface));
  const touch = apex.clone().add(new Vector3(0, -Math.sin(tilt), -Math.cos(tilt)).multiplyScalar(slant));
  group.add(hingedDisc(radius, touch, -Math.PI * open, paint));
  return group;
};

const NET_SOLIDS = new Set(['cube', 'cuboid', 'prism', 'pyramid', 'cylinder', 'cone']);

const net = (object: SceneObject, values: Values, open: number, paint: ISolidPaint): Group | null => {
  if (!NET_SOLIDS.has(object.type)) return null;
  const extent = solidExtent(object, values);
  if (!extent) return null;
  if (object.type === 'cylinder') return cylinderNet(extent.radius, extent.above, open, paint);
  if (object.type === 'cone') return coneNet(extent.radius, extent.above, open, paint);
  return flatNet(object, values, open, paint);
};

/**
 * A solid as a step leaves it — whole, cut, or opened some of the way into its net — standing on
 * its base at the group's origin. Null for anything that is not a solid.
 */
export const solidGroup = (
  object: SceneObject,
  values: Values,
  state: { open: number; cut: { at: number; gap: number } | null },
  paint: ISolidPaint,
): Group | null => {
  if (!solidExtent(object, values)) return null;
  if (state.open > 1e-3) {
    const opened = net(object, values, Math.min(state.open, 1), paint);
    if (opened) return opened;
  }
  const group = new Group();
  const meshes = state.cut ? cutSolid(object, values, state.cut, paint) : wholeSolid(object, values, paint);
  meshes.forEach((mesh) => group.add(mesh));
  return group;
};
