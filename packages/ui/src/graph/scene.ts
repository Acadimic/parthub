import type { GraphSample, ICurveSample, IGraphRange, IParametricSample, ISurfaceSample } from '@repo/shared/utils';
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  EdgesGeometry,
  GridHelper,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { GraphLabels } from './labels';
import { gridTriangles, heightRange } from './mesh';
import type { IGraphPalette } from './palettes';
import { type IGraphPoint, S, Stage } from './stage';

export type { IGraphPoint } from './stage';

/** Grid lines drawn over a surface, per side. */
const WIRE_LINES = 12;
const TUBE_RADIUS = 0.075;
const TUBE_SIDES = 10;

export interface IGraphTheme {
  /** Frame, floor grid and shadow lines. */
  line: string;
  /** The hover marker. */
  accent: string;
}

const toScene = (value: number, range: IGraphRange): number =>
  ((value - range.min) / (range.max - range.min)) * 2 * S - S;
const fromScene = (value: number, range: IGraphRange): number =>
  ((value + S) / (2 * S)) * (range.max - range.min) + range.min;
const clampScene = (value: number): number => Math.max(-S, Math.min(S, value));

/**
 * One 3D graph: a surface or a curve inside a framed cube, with axis ticks as HTML over the canvas.
 * Everything a graph shares with a 3D scene — rendering, controls, read-out, export — is `Stage`.
 */
export class GraphScene extends Stage {
  private readonly frameMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.35 });
  private readonly frame = new LineSegments(
    new EdgesGeometry(new BoxGeometry(2 * S, 2 * S, 2 * S)),
    this.frameMaterial,
  );
  private floorGrid: GridHelper | null = null;
  private readonly bodyMaterial = new MeshStandardMaterial({
    vertexColors: true,
    side: DoubleSide,
    roughness: 0.38,
    metalness: 0.08,
    // Pushes the surface back a hair so the grid lines drawn on it never flicker through.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  private readonly floorMaterial = new MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: DoubleSide,
  });
  private readonly wireMaterial = new LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3 });
  private readonly shadowMaterial = new LineBasicMaterial({ transparent: true, opacity: 0.5 });
  private body: Mesh | null = null;
  private floor: Mesh | null = null;
  private extras: (LineSegments | Line)[] = [];
  private sample: GraphSample | null = null;
  private stops: Color[] = [];
  private showWire = true;
  protected readonly labels: GraphLabels;

  constructor(host: HTMLElement, labelLayer: HTMLElement, onHover: (point: IGraphPoint | null) => void) {
    super(host, onHover, 'Interactive 3D graph.');
    this.scene.add(this.frame);
    this.labels = new GraphLabels(labelLayer, S);
    this.start();
  }

  protected pickTarget(): Object3D | null {
    return this.sample ? this.body : null;
  }

  protected readPoint(point: Vector3): IGraphPoint {
    const bounds = this.sample?.bounds;
    if (!bounds) return { x: 0, y: 0, z: 0 };
    return { x: fromScene(point.x, bounds.x), y: fromScene(point.y, bounds.y), z: fromScene(point.z, bounds.z) };
  }

  setTheme(theme: IGraphTheme): void {
    this.frameMaterial.color.setStyle(theme.line);
    this.shadowMaterial.color.setStyle(theme.line);
    this.markerMaterial.color.setStyle(theme.accent);
    if (this.floorGrid) {
      this.scene.remove(this.floorGrid);
      this.floorGrid.dispose();
    }
    this.floorGrid = new GridHelper(2 * S, 10, theme.line, theme.line);
    this.floorGrid.rotation.x = Math.PI / 2;
    this.floorGrid.position.z = -S;
    const materials = Array.isArray(this.floorGrid.material) ? this.floorGrid.material : [this.floorGrid.material];
    materials.forEach((material) => {
      material.transparent = true;
      material.opacity = 0.22;
    });
    this.scene.add(this.floorGrid);
    this.requestRender();
  }

  setPalette(palette: IGraphPalette): void {
    this.stops = palette.stops.map((stop) => new Color(stop));
    if (this.sample) this.setSample(this.sample);
  }

  setWire(isShown: boolean): void {
    this.showWire = isShown;
    if (this.sample) this.setSample(this.sample);
  }

  setSample(sample: GraphSample): void {
    this.sample = sample;
    if (sample.kind !== 'curve') this.drawSurface(sample);
    else this.drawCurve(sample);
    this.labels.setSample(sample);
    this.clearHover();
  }

  dispose(): void {
    this.clearShapes();
    this.floorGrid?.dispose();
    this.frame.geometry.dispose();
    [this.frameMaterial, this.bodyMaterial, this.floorMaterial, this.wireMaterial, this.shadowMaterial].forEach(
      (material) => material.dispose(),
    );
    super.dispose();
  }

  // -------------------------------------------------------------------------
  // Drawing
  // -------------------------------------------------------------------------

  private colourAt(t: number, out: Color): Color {
    const stops = this.stops;
    if (stops.length < 2) return out.set(0x8b5cf6);
    const scaled = Math.max(0, Math.min(1, t)) * (stops.length - 1);
    const index = Math.min(Math.floor(scaled), stops.length - 2);
    return out.copy(stops[index]).lerp(stops[index + 1], scaled - index);
  }

  private clearShapes(): void {
    [this.body, this.floor, ...this.extras].forEach((shape) => {
      if (!shape) return;
      this.scene.remove(shape);
      shape.geometry.dispose();
    });
    this.body = null;
    this.floor = null;
    this.extras = [];
  }

  /** The surface mesh and its floor map are kept between redraws of the same size and refilled. */
  private ensureSurface(size: number): { body: BufferGeometry; floor: BufferGeometry } {
    const current = this.body?.geometry;
    if (this.floor && current?.userData.size === size) return { body: current, floor: this.floor.geometry };
    this.clearShapes();
    const body = new BufferGeometry();
    const floor = new BufferGeometry();
    const colors = new BufferAttribute(new Float32Array(size * size * 3), 3);
    body.setAttribute('position', new BufferAttribute(new Float32Array(size * size * 3), 3));
    body.setAttribute('color', colors);
    floor.setAttribute('position', new BufferAttribute(new Float32Array(size * size * 3), 3));
    floor.setAttribute('color', colors);
    body.userData.size = size;
    this.body = new Mesh(body, this.bodyMaterial);
    this.floor = new Mesh(floor, this.floorMaterial);
    this.scene.add(this.floor, this.body);
    return { body, floor };
  }

  /**
   * A grid of points as a coloured mesh: `z = f(x, y)` over its x–y grid, or a parametric surface
   * over its u–v grid. Only the first has a floor map; a closed shape's shadow would only confuse.
   */
  private drawSurface(sample: ISurfaceSample | IParametricSample): void {
    const { size, bounds } = sample;
    const geometries = this.ensureSurface(size);
    const point = (i: number, j: number): [number, number, number] => {
      if (sample.kind === 'surface') return [sample.xs[i], sample.ys[j], sample.z[j * size + i]];
      const k = (j * size + i) * 3;
      return [sample.points[k], sample.points[k + 1], sample.points[k + 2]];
    };
    if (this.floor) this.floor.visible = sample.kind === 'surface';
    // Created as plain BufferAttributes in `ensureSurface`; three types the getter more loosely.
    const position = geometries.body.getAttribute('position') as BufferAttribute;
    const floorPosition = geometries.floor.getAttribute('position') as BufferAttribute;
    const color = geometries.body.getAttribute('color') as BufferAttribute;
    const valid = new Uint8Array(size * size);
    const tint = new Color();
    const heights = heightRange(sample);
    const span = heights.max - heights.min;
    for (let j = 0; j < size; j += 1) {
      for (let i = 0; i < size; i += 1) {
        const k = j * size + i;
        const [px, py, value] = point(i, j);
        valid[k] = Number.isFinite(px) && Number.isFinite(py) && Number.isFinite(value) ? 1 : 0;
        const x = valid[k] ? toScene(px, bounds.x) : 0;
        const y = valid[k] ? toScene(py, bounds.y) : 0;
        position.setXYZ(k, x, y, valid[k] ? clampScene(toScene(value, bounds.z)) : -S);
        floorPosition.setXYZ(k, x, y, -S + 0.01);
        this.colourAt(valid[k] ? (value - heights.min) / span : 0, tint);
        color.setXYZ(k, tint.r, tint.g, tint.b);
      }
    }
    const indices = gridTriangles(size, valid);
    const index = new BufferAttribute(new Uint32Array(indices), 1);
    geometries.body.setIndex(index);
    geometries.floor.setIndex(index);
    position.needsUpdate = true;
    floorPosition.needsUpdate = true;
    color.needsUpdate = true;
    geometries.body.computeVertexNormals();
    geometries.body.computeBoundingSphere();

    this.extras.forEach((shape) => {
      this.scene.remove(shape);
      shape.geometry.dispose();
    });
    this.extras = this.showWire ? [this.surfaceWire(size, position, valid)] : [];
    this.scene.add(...this.extras);
    this.requestRender();
  }

  /** A light grid traced over the surface, which is what makes its shape legible at a glance. */
  private surfaceWire(size: number, position: BufferAttribute, valid: Uint8Array): LineSegments {
    const step = Math.max(1, Math.round((size - 1) / WIRE_LINES));
    const segments: number[] = [];
    const push = (from: number, to: number) => {
      if (!valid[from] || !valid[to]) return;
      segments.push(position.getX(from), position.getY(from), position.getZ(from));
      segments.push(position.getX(to), position.getY(to), position.getZ(to));
    };
    for (let line = 0; line < size; line += step) {
      for (let k = 0; k < size - 1; k += 1) {
        push(line * size + k, line * size + k + 1);
        push(k * size + line, (k + 1) * size + line);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(segments), 3));
    return new LineSegments(geometry, this.wireMaterial);
  }

  private drawCurve(sample: ICurveSample): void {
    this.clearShapes();
    const { points, count, bounds } = sample;
    const path: Vector3[] = [];
    for (let i = 0; i < count; i += 1) {
      const [x, y, z] = [points[i * 3], points[i * 3 + 1], points[i * 3 + 2]];
      if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
        path.push(new Vector3(toScene(x, bounds.x), toScene(y, bounds.y), toScene(z, bounds.z)));
      }
    }
    if (path.length < 2) {
      this.requestRender();
      return;
    }
    const segments = Math.min(path.length * 2, 900);
    const tube = new TubeGeometry(new CatmullRomCurve3(path), segments, TUBE_RADIUS, TUBE_SIDES, false);
    // Coloured along its length, so the direction of travel reads from the gradient.
    const ring = TUBE_SIDES + 1;
    const vertices = tube.getAttribute('position').count;
    const colors = new Float32Array(vertices * 3);
    const tint = new Color();
    for (let v = 0; v < vertices; v += 1) {
      this.colourAt(Math.floor(v / ring) / segments, tint);
      colors.set([tint.r, tint.g, tint.b], v * 3);
    }
    tube.setAttribute('color', new BufferAttribute(colors, 3));
    this.body = new Mesh(tube, this.bodyMaterial);
    const shadow = new BufferGeometry().setFromPoints(path.map((point) => new Vector3(point.x, point.y, -S + 0.01)));
    this.extras = [new Line(shadow, this.shadowMaterial)];
    this.scene.add(this.body, ...this.extras);
    this.requestRender();
  }
}
