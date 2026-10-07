import type { GraphSample, ICurveSample, IGraphRange, IParametricSample, ISurfaceSample } from '@repo/shared/utils';
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  GridHelper,
  HemisphereLight,
  Line,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GraphLabels } from './labels';
import { gridTriangles, heightRange } from './mesh';
import type { IGraphPalette } from './palettes';
import { composeGraphImage, type IGraphImageColours, type IGraphImageFooter, type ILabelSnapshot } from './snapshot';

/** Half the side of the cube every graph is scaled into, so each axis spans `-S..S`. */
const S = 3;
const HOME = new Vector3(8.8, -10.6, 7.2);
/** Aimed a little below the centre, which lifts the cube and leaves room for the labels under it. */
const TARGET = new Vector3(0, 0, -0.6);
const Z_AXIS = new Vector3(0, 0, 1);
/** Grid lines drawn over a surface, per side. */
const WIRE_LINES = 12;
const TUBE_RADIUS = 0.075;
const TUBE_SIDES = 10;

export interface IGraphPoint {
  x: number;
  y: number;
  z: number;
}

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
 * One 3D graph drawn with three.js: a surface or a curve inside a framed cube, with axis labels as
 * HTML over the canvas, hover read-out, orbit controls and keyboard rotation.
 *
 * It renders on demand — a frame only when the camera, the data or the size changes — so an idle
 * graph costs nothing, and `dispose` releases the WebGL context so opening many graphs never leaks.
 */
export class GraphScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera = new PerspectiveCamera(34, 1, 0.1, 200);
  private readonly controls: OrbitControls;
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
  private readonly markerMaterial = new MeshBasicMaterial();
  private readonly marker = new Mesh(new SphereGeometry(0.1, 24, 16), this.markerMaterial);
  private body: Mesh | null = null;
  private floor: Mesh | null = null;
  private extras: (LineSegments | Line)[] = [];
  private sample: GraphSample | null = null;
  private stops: Color[] = [];
  private showWire = true;
  private isSpinning = false;
  private isPending = false;
  private isDisposed = false;
  private readonly labels: GraphLabels;
  private readonly resizeObserver: ResizeObserver;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private pressedAt: { x: number; y: number } | null = null;
  private isFramed = false;
  /** True while `captureTurn` drives the camera; the render loop and the controls stand aside. */
  private isCapturing = false;

  constructor(
    private readonly host: HTMLElement,
    labelLayer: HTMLElement,
    private readonly onHover: (point: IGraphPoint | null) => void,
  ) {
    // Throws where WebGL is unavailable; the component shows its fallback.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = this.renderer.domElement;
    canvas.className = 'block h-full w-full outline-none';
    canvas.tabIndex = 0;
    canvas.setAttribute(
      'aria-label',
      'Interactive 3D graph. Drag or use the arrow keys to rotate; scroll, pinch or press plus and minus to zoom.',
    );
    host.appendChild(canvas);

    this.camera.up.copy(Z_AXIS);
    this.camera.position.copy(HOME);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 40;
    this.controls.autoRotateSpeed = 1.6;
    this.controls.addEventListener('change', this.requestRender);

    const key = new DirectionalLight(0xffffff, 1.7);
    key.position.set(5, -6, 9);
    const rim = new DirectionalLight(0xffffff, 0.6);
    rim.position.set(-7, 5, 4);
    this.scene.add(new AmbientLight(0xffffff, 0.55), new HemisphereLight(0xffffff, 0x334155, 0.9), key, rim);
    this.marker.visible = false;
    this.scene.add(this.frame, this.marker);
    this.labels = new GraphLabels(labelLayer, S);

    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('keydown', this.handleKeyDown);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(host);
    this.resize();
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

  setSpin(isSpinning: boolean): void {
    this.isSpinning = isSpinning;
    this.controls.autoRotate = isSpinning;
    this.requestRender();
  }

  resetView(): void {
    const aspect = this.camera.aspect || 1;
    // A tall, narrow phone screen needs the camera further back to keep the cube in frame.
    const distance = aspect < 1 ? Math.pow(1 / aspect, 0.75) : 1;
    this.camera.position.copy(HOME).multiplyScalar(distance).add(TARGET);
    this.controls.target.copy(TARGET);
    this.controls.update();
    this.requestRender();
  }

  setSample(sample: GraphSample): void {
    this.sample = sample;
    if (sample.kind !== 'curve') this.drawSurface(sample);
    else this.drawCurve(sample);
    this.labels.setSample(sample);
    this.clearHover();
  }

  /** The graph as it is on screen, with its axis labels and `footer` under it, as a PNG. */
  snapshot(footer: IGraphImageFooter, colours: IGraphImageColours): Promise<Blob | null> {
    const isMarked = this.marker.visible;
    this.marker.visible = false;
    this.renderer.render(this.scene, this.camera);
    const labels = this.labels.snapshot(this.camera, this.host.clientWidth, this.host.clientHeight);
    const image = composeGraphImage(this.renderer.domElement, labels, footer, colours);
    this.marker.visible = isMarked;
    this.requestRender();
    return image;
  }

  /**
   * Turns the camera once round the vertical axis in `count` even steps, starting from the current
   * view, and hands each rendered frame to `onFrame`, which must copy the canvas before its first
   * `await` (see `drawGraphFrame`). The view, the spin and the controls are put back afterwards.
   * Resolves false when the graph was closed before the turn finished.
   */
  async captureTurn(
    count: number,
    onFrame: (source: HTMLCanvasElement, labels: ILabelSnapshot[], index: number) => Promise<void>,
  ): Promise<boolean> {
    const target = this.controls.target.clone();
    const start = this.camera.position.clone();
    const offset = start.clone().sub(target);
    const wasSpinning = this.isSpinning;
    const isMarked = this.marker.visible;
    this.setSpin(false);
    this.marker.visible = false;
    this.controls.enabled = false;
    this.isCapturing = true;
    try {
      for (let index = 0; index < count; index += 1) {
        if (this.isDisposed) return false;
        const turned = offset.clone().applyAxisAngle(Z_AXIS, (2 * Math.PI * index) / count);
        this.camera.position.copy(target).add(turned);
        this.camera.lookAt(target);
        this.renderer.render(this.scene, this.camera);
        const width = this.host.clientWidth;
        const height = this.host.clientHeight;
        this.labels.place(this.camera, width, height);
        await onFrame(this.renderer.domElement, this.labels.snapshot(this.camera, width, height), index);
      }
      return !this.isDisposed;
    } finally {
      this.isCapturing = false;
      this.camera.position.copy(start);
      this.controls.target.copy(target);
      this.controls.enabled = true;
      this.marker.visible = isMarked;
      this.setSpin(wasSpinning);
      this.requestRender();
    }
  }

  dispose(): void {
    this.isDisposed = true;
    this.resizeObserver.disconnect();
    this.controls.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.handlePointerMove);
    canvas.removeEventListener('pointerleave', this.handlePointerLeave);
    canvas.removeEventListener('pointerdown', this.handlePointerDown);
    canvas.removeEventListener('pointerup', this.handlePointerUp);
    canvas.removeEventListener('keydown', this.handleKeyDown);
    this.clearShapes();
    this.floorGrid?.dispose();
    this.frame.geometry.dispose();
    this.marker.geometry.dispose();
    [
      this.frameMaterial,
      this.bodyMaterial,
      this.floorMaterial,
      this.wireMaterial,
      this.shadowMaterial,
      this.markerMaterial,
    ].forEach((material) => material.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
    this.labels.dispose();
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

  // -------------------------------------------------------------------------
  // Rendering and size
  // -------------------------------------------------------------------------

  private readonly requestRender = (): void => {
    if (this.isPending || this.isDisposed) return;
    this.isPending = true;
    requestAnimationFrame(this.renderFrame);
  };

  private readonly renderFrame = (): void => {
    this.isPending = false;
    if (this.isDisposed || this.isCapturing) return;
    const isMoving = this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.place(this.camera, this.host.clientWidth, this.host.clientHeight);
    if (isMoving || this.isSpinning) this.requestRender();
  };

  private readonly resize = (): void => {
    const width = this.host.clientWidth;
    const height = this.host.clientHeight;
    if (!width || !height) return;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    // Framed once the real size is known; later resizes keep wherever the reader turned it.
    if (!this.isFramed) {
      this.isFramed = true;
      this.resetView();
    }
    this.requestRender();
  };

  // -------------------------------------------------------------------------
  // Pointer and keyboard
  // -------------------------------------------------------------------------

  private pick(clientX: number, clientY: number): void {
    const sample = this.sample;
    if (!this.body || !sample) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.body, false)[0];
    if (!hit) {
      this.clearHover();
      return;
    }
    this.marker.position.copy(hit.point);
    this.marker.visible = true;
    this.onHover({
      x: fromScene(hit.point.x, sample.bounds.x),
      y: fromScene(hit.point.y, sample.bounds.y),
      z: fromScene(hit.point.z, sample.bounds.z),
    });
    this.requestRender();
  }

  private readonly clearHover = (): void => {
    this.marker.visible = false;
    this.onHover(null);
    this.requestRender();
  };

  /** A lifted finger also "leaves", which would wipe the value a tap just read; only a mouse clears it. */
  private readonly handlePointerLeave = (event: PointerEvent): void => {
    if (event.pointerType === 'mouse') this.clearHover();
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    // A touch has no hover; it reads a point on tap instead. Dragging never reads one.
    if (event.pointerType !== 'mouse' || event.buttons) return;
    this.pick(event.clientX, event.clientY);
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.pressedAt = { x: event.clientX, y: event.clientY };
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const start = this.pressedAt;
    this.pressedAt = null;
    if (event.pointerType === 'mouse' || !start) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 6) this.pick(event.clientX, event.clientY);
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const angle = Math.PI / 24;
    const offset = this.camera.position.clone().sub(this.controls.target);
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      offset.applyAxisAngle(Z_AXIS, event.key === 'ArrowLeft' ? -angle : angle);
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      const axis = new Vector3().crossVectors(offset, Z_AXIS).normalize();
      const turned = offset.clone().applyAxisAngle(axis, event.key === 'ArrowUp' ? angle : -angle);
      // Stop short of the poles, where the view would flip over.
      const tilt = turned.angleTo(Z_AXIS);
      if (tilt > 0.1 && tilt < Math.PI - 0.1) offset.copy(turned);
    } else if (event.key === '+' || event.key === '=' || event.key === '-') {
      const length = offset.length() * (event.key === '-' ? 1.12 : 1 / 1.12);
      offset.setLength(Math.max(this.controls.minDistance, Math.min(this.controls.maxDistance, length)));
    } else {
      return;
    }
    event.preventDefault();
    this.camera.position.copy(this.controls.target).add(offset);
    this.controls.update();
    this.requestRender();
  };
}
