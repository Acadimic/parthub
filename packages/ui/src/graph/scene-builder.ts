import type {
  IScene,
  IScenePlane,
  SceneColour,
  SceneNumber,
  SceneObject,
  SceneObjectType,
  SceneVector,
} from '@repo/shared/interfaces';
import { sceneNumber } from '@repo/shared/utils';
import {
  Box3,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Euler,
  Group,
  Line,
  LineBasicMaterial,
  LineDashedMaterial,
  LineSegments,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  Vector3,
  BufferGeometry as LineGeometry,
} from 'three';
import type { ISceneLabel } from './labels';
import { solidExtent, solidGroup } from './scene-solids';
import type { IObjectState, SceneState } from './scene-steps';

/** The theme's colour for each role a scene may name, read off the page. */
export type SceneColours = Record<SceneColour, string>;

/** The object types this version draws; the others are listed to the reader as coming later. */
export const DRAWN_SCENE_TYPES: readonly SceneObjectType[] = [
  'point',
  'segment',
  'line',
  'vector',
  'plane',
  'angle',
  'cube',
  'cuboid',
  'prism',
  'pyramid',
  'cylinder',
  'cone',
  'frustum',
  'sphere',
  'hemisphere',
  'label',
];

export interface IBuiltScene {
  /** Every object, in the scene's own units. */
  group: Group;
  labels: ISceneLabel[];
  /** Object types present in the scene but not drawn by this version. */
  skipped: SceneObjectType[];
}

type Values = Readonly<Record<string, number>>;

const UP = new Vector3(0, 0, 1);

const vec = (value: SceneVector, values: Values): Vector3 =>
  new Vector3(sceneNumber(value[0], values), sceneNumber(value[1], values), sceneNumber(value[2], values));

const num = (value: SceneNumber | undefined, values: Values, fallback: number): number =>
  value === undefined ? fallback : sceneNumber(value, values);

/**
 * The points that bound a scene, worked out from the numbers alone, so thin things — points, arrow
 * heads, arcs, dashes — can be sized against the whole scene before anything is built.
 */
const sceneBox = (objects: SceneObject[], values: Values): Box3 => {
  const box = new Box3();
  const add = (point: Vector3) => box.expandByPoint(point);
  objects.forEach((object) => {
    const at = 'position' in object && object.position ? vec(object.position, values) : new Vector3();
    if (object.type === 'point' || object.type === 'label') add(at);
    if (object.type === 'segment' || object.type === 'vector') {
      add(object.from ? vec(object.from, values) : new Vector3());
      add(vec(object.to, values));
    }
    if (object.type === 'line') add(vec(object.through, values));
    if (object.type === 'plane') planeCorners(object, values).forEach(add);
    const solid = solidExtent(object, values);
    if (solid) {
      add(at.clone().add(new Vector3(-solid.radius, -solid.radius, solid.below)));
      add(at.clone().add(new Vector3(solid.radius, solid.radius, solid.above)));
    }
  });
  if (box.isEmpty()) box.set(new Vector3(-1, -1, -1), new Vector3(1, 1, 1));
  return box;
};

/** Where an object points: a segment, line or vector's direction, or a plane's normal. */
interface IDirection {
  at: Vector3;
  direction: Vector3;
  isPlane: boolean;
}

/** Two planes meet along a line; the point on it nearest `near`, or null when they are parallel. */
const meetingPoint = (first: IDirection, second: IDirection, near: Vector3): Vector3 | null => {
  const n1 = first.direction;
  const n2 = second.direction;
  const line = n1.clone().cross(n2);
  const lengthSq = line.lengthSq();
  if (lengthSq < 1e-12) return null;
  const h1 = n1.dot(first.at);
  const h2 = n2.dot(second.at);
  const dot = n1.dot(n2);
  const point = n1
    .clone()
    .multiplyScalar(h1 - h2 * dot)
    .add(n2.clone().multiplyScalar(h2 - h1 * dot))
    .divideScalar(lengthSq);
  const along = line.normalize();
  return point.add(along.clone().multiplyScalar(along.dot(near.clone().sub(point))));
};

/**
 * The vertex and the two unit arms an angle's arc is drawn between. A plane's arm lies in the plane:
 * square to the line two planes meet along, or the line's own shadow on it. The arms are taken so
 * the angle is the acute one, as a textbook gives the angle between two planes or a line and a plane.
 */
const angleArms = (first: IDirection, second: IDirection): { at: Vector3; a: Vector3; b: Vector3 } | null => {
  const a = first.direction.clone().normalize();
  const b = second.direction.clone().normalize();
  if (!first.isPlane && !second.isPlane) return { at: first.at, a, b };
  if (first.isPlane && second.isPlane) {
    const at = meetingPoint({ ...first, direction: a }, { ...second, direction: b }, first.at);
    if (!at) return null;
    const line = a.clone().cross(b);
    const armA = a.clone().cross(line).normalize();
    const armB = b.clone().cross(line).normalize();
    return { at, a: armA, b: armA.dot(armB) < 0 ? armB.negate() : armB };
  }
  const [plane, line] = first.isPlane ? [a, b] : [b, a];
  const shadow = line.clone().sub(plane.clone().multiplyScalar(line.dot(plane)));
  if (shadow.lengthSq() < 1e-12) return null;
  return { at: first.isPlane ? second.at : first.at, a: line, b: shadow.normalize() };
};

/** A plane's four corners when it has a size; only its point otherwise, since its size then follows the scene. */
const planeCorners = (plane: IScenePlane, values: Values): Vector3[] => {
  const point = vec(plane.point, values);
  if (plane.size === undefined) return [point];
  const half = num(plane.size, values, 1) / 2;
  const turn = new Quaternion().setFromUnitVectors(UP, vec(plane.normal, values).normalize());
  return [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ].map(([x, y]) => new Vector3(x * half, y * half, 0).applyQuaternion(turn).add(point));
};

/** The colour of the face a slice leaves, so the cut stands out from the solid. */
const SECTION_COLOUR: SceneColour = 'chart-4';

/** Multiplies the opacity of everything in `root` by `factor`, for a fading or dimmed object. */
const fade = (root: Object3D, factor: number): void => {
  if (factor >= 0.999) return;
  root.traverse((node) => {
    if (!(node instanceof Mesh || node instanceof Line)) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material: Material) => {
      material.opacity *= factor;
      material.transparent = true;
      material.depthWrite = false;
    });
  });
};

/** Builds a scene's objects from its numbers at the given slider values. */
export class SceneBuilder {
  private readonly group = new Group();
  /** The group the object being drawn goes into, so its step can turn and fade it as one. */
  private layer = new Group();
  private readonly labels: ISceneLabel[] = [];
  private readonly skipped = new Set<SceneObjectType>();
  /** Lengths for thin things, relative to the scene. */
  private readonly unit: number;
  private readonly extent: number;
  private readonly directions = new Map<string, IDirection>();

  constructor(
    private readonly scene: IScene,
    private readonly values: Values,
    private readonly colours: SceneColours,
    private readonly state: SceneState,
  ) {
    const size = sceneBox(scene.objects, values).getSize(new Vector3());
    this.extent = Math.max(size.x, size.y, size.z, 1e-6);
    this.unit = this.extent / 100;
  }

  build(): IBuiltScene {
    // Angles measure what the other objects define, so they are drawn last.
    const ordered = [...this.scene.objects].sort((a, b) => Number(a.type === 'angle') - Number(b.type === 'angle'));
    const strongest = Math.max(0, ...Object.values(this.state).map((object) => object.highlight));
    ordered.forEach((object) => {
      const state = this.state[object.id];
      if (!DRAWN_SCENE_TYPES.includes(object.type)) this.skipped.add(object.type);
      else if (state && state.shown > 0.01) this.drawStaged(object, state, 1 - 0.75 * (strongest - state.highlight));
    });
    return { group: this.group, labels: this.labels, skipped: [...this.skipped] };
  }

  /** Draws one object into its own group, then turns it and fades it as its step says. */
  private drawStaged(object: SceneObject, state: IObjectState, emphasis: number): void {
    this.layer = new Group();
    const firstLabel = this.labels.length;
    this.draw(object, state);
    const pivot = 'position' in object && object.position ? vec(object.position, this.values) : new Vector3();
    const turn = new Quaternion().setFromEuler(new Euler(...state.turn, 'XYZ'));
    const move = new Matrix4()
      .makeTranslation(pivot.x, pivot.y, pivot.z)
      .multiply(new Matrix4().makeRotationFromQuaternion(turn))
      .multiply(new Matrix4().makeTranslation(-pivot.x, -pivot.y, -pivot.z));
    this.layer.applyMatrix4(move);
    this.labels.slice(firstLabel).forEach((label) => label.position.applyMatrix4(move));
    // A label shows once its object is mostly in; a half-faded word reads as a mistake.
    if (state.shown < 0.5) this.labels.splice(firstLabel);
    const direction = this.directions.get(object.id);
    if (direction) {
      direction.at.applyMatrix4(move);
      direction.direction.applyQuaternion(turn);
    }
    fade(this.layer, state.shown * emphasis);
    this.group.add(this.layer);
  }

  private colour(object: SceneObject, fallback: SceneColour): string {
    return this.colours[object.colour ?? fallback];
  }

  private surface(object: SceneObject, fallback: SceneColour, opacity: number): MeshStandardMaterial {
    const alpha = Math.max(0, Math.min(1, num(object.opacity, this.values, opacity)));
    return new MeshStandardMaterial({
      color: this.colour(object, fallback),
      roughness: 0.45,
      metalness: 0.05,
      side: DoubleSide,
      transparent: alpha < 1,
      opacity: alpha,
      depthWrite: alpha >= 1,
    });
  }

  /** A solid's edges, drawn faintly over it so its faces read at a glance. */
  private outline(mesh: Mesh): void {
    const edges = new LineSegments(
      new EdgesGeometry(mesh.geometry, 25),
      new LineBasicMaterial({ color: this.colours.foreground, transparent: true, opacity: 0.45 }),
    );
    mesh.add(edges);
  }

  private label(text: string | undefined, position: Vector3): void {
    if (text?.trim()) this.labels.push({ text: text.trim(), position });
  }

  private line(points: Vector3[], colour: string, isDashed: boolean): Line {
    const geometry = new LineGeometry().setFromPoints(points);
    const material = isDashed
      ? new LineDashedMaterial({ color: colour, dashSize: this.unit * 3, gapSize: this.unit * 2 })
      : new LineBasicMaterial({ color: colour });
    const line = new Line(geometry, material);
    if (isDashed) line.computeLineDistances();
    this.layer.add(line);
    return line;
  }

  private draw(object: SceneObject, state: IObjectState): void {
    const values = this.values;
    switch (object.type) {
      case 'point': {
        const at = vec(object.position, values);
        const dot = new Mesh(new SphereGeometry(this.unit * 1.6, 16, 12), this.surface(object, 'foreground', 1));
        dot.position.copy(at);
        this.layer.add(dot);
        return this.label(object.label, at.clone().add(new Vector3(0, 0, this.unit * 5)));
      }
      case 'segment': {
        const from = vec(object.from, values);
        const to = vec(object.to, values);
        this.line([from, to], this.colour(object, 'foreground'), object.dashed === true);
        this.directions.set(object.id, { at: from, direction: to.clone().sub(from), isPlane: false });
        return this.label(object.label, from.clone().lerp(to, 0.5));
      }
      case 'line': {
        const through = vec(object.through, values);
        const direction = vec(object.direction, values).normalize();
        const reach = direction.clone().multiplyScalar(this.extent);
        this.line([through.clone().sub(reach), through.clone().add(reach)], this.colour(object, 'muted'), false);
        this.directions.set(object.id, { at: through, direction, isPlane: false });
        return this.label(object.label, through.clone().add(reach.multiplyScalar(0.8)));
      }
      case 'vector':
        return this.arrow(
          object.id,
          object,
          object.from ? vec(object.from, values) : new Vector3(),
          vec(object.to, values),
        );
      case 'plane':
        return this.plane(object);
      case 'angle':
        return this.angle(object.between, object.showValue === true, object.label, object);
      case 'label':
        return this.label(object.text, vec(object.position, values));
      default:
        return this.solid(object, state);
    }
  }

  private arrow(id: string, object: SceneObject, from: Vector3, to: Vector3): void {
    const direction = to.clone().sub(from);
    const length = direction.length();
    if (length < 1e-9) return;
    const material = this.surface(object, 'chart-1', 1);
    const head = Math.min(this.unit * 6, length * 0.35);
    const shaft = new Mesh(new CylinderGeometry(this.unit * 0.7, this.unit * 0.7, length - head, 12), material);
    const tip = new Mesh(new ConeGeometry(this.unit * 2.2, head, 16), material);
    const turn = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.clone().normalize());
    shaft.quaternion.copy(turn);
    tip.quaternion.copy(turn);
    shaft.position.copy(from).add(direction.clone().multiplyScalar((length - head) / 2 / length));
    tip.position.copy(to).sub(direction.clone().multiplyScalar(head / 2 / length));
    this.layer.add(shaft, tip);
    this.directions.set(id, { at: from, direction, isPlane: false });
    this.label(
      object.label,
      to.clone().add(
        direction
          .clone()
          .normalize()
          .multiplyScalar(this.unit * 6),
      ),
    );
  }

  private plane(object: IScenePlane): void {
    const point = vec(object.point, this.values);
    const normal = vec(object.normal, this.values);
    const side = num(object.size, this.values, this.extent * 1.2);
    const sheet = new Mesh(new PlaneGeometry(side, side), this.surface(object, 'muted', 0.35));
    sheet.quaternion.setFromUnitVectors(UP, normal.clone().normalize());
    sheet.position.copy(point);
    this.outline(sheet);
    this.layer.add(sheet);
    this.directions.set(object.id, { at: point, direction: normal.clone().normalize(), isPlane: true });
    this.label(
      object.label,
      point.clone().add(new Vector3(side * 0.4, side * 0.4, 0).applyQuaternion(sheet.quaternion)),
    );
  }

  /**
   * The angle between two directions — segments, lines, vectors, or the normals of planes — as an
   * arc at their shared point (or the first one's start), with its size in degrees when asked.
   */
  private angle(between: [string, string], showValue: boolean, label: string | undefined, object: SceneObject): void {
    const first = this.directions.get(between[0]);
    const second = this.directions.get(between[1]);
    const arms = first && second ? angleArms(first, second) : null;
    if (!arms) return;
    const { at, a, b } = arms;
    const degrees = (Math.acos(Math.max(-1, Math.min(1, a.dot(b)))) * 180) / Math.PI;
    const radius = this.unit * 18;
    const turn = new Quaternion().setFromUnitVectors(a, b);
    const points = Array.from({ length: 25 }, (_, index) =>
      a
        .clone()
        .applyQuaternion(new Quaternion().slerp(turn, index / 24))
        .multiplyScalar(radius)
        .add(at),
    );
    this.line(points, this.colour(object, 'chart-3'), false);
    const middle = points[12].clone().sub(at).multiplyScalar(1.5).add(at);
    const value = `${Number(degrees.toFixed(1))}°`;
    this.label(showValue ? `${label ?? 'θ'} = ${value}` : label, middle);
  }

  /** A solid as its step leaves it — whole, cut, or opening into its net — standing on its base at `position`. */
  private solid(object: SceneObject, state: IObjectState): void {
    const values = this.values;
    const group = solidGroup(object, values, state, {
      face: (geometry) => {
        const mesh = new Mesh(geometry, this.surface(object, 'primary', 0.92));
        this.outline(mesh);
        return mesh;
      },
      section: (geometry) => new Mesh(geometry, this.surface({ ...object, colour: SECTION_COLOUR }, 'primary', 0.95)),
    });
    const extent = solidExtent(object, values);
    if (!group || !extent) return;
    const at = 'position' in object && object.position ? vec(object.position, values) : new Vector3();
    group.position.copy(at);
    this.layer.add(group);
    // A label sits over the solid while it is whole; an opened net has no top to sit over.
    if (state.open > 0.5) return;
    const top = object.type === 'sphere' ? extent.above : extent.above + this.unit * 4;
    this.label('label' in object ? object.label : undefined, at.clone().add(new Vector3(0, 0, top)));
  }
}

/** The bounds a scene's objects can reach across its sliders' whole ranges, for a steady scale. */
export const sceneReach = (scene: IScene, values: Values): Box3 => {
  const sliders = scene.sliders ?? [];
  const at = (pick: 'min' | 'max') => Object.fromEntries(sliders.map((slider) => [slider.name, slider[pick]]));
  return sceneBox(scene.objects, values)
    .union(sceneBox(scene.objects, at('min')))
    .union(sceneBox(scene.objects, at('max')));
};
