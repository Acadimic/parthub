import {
  AmbientLight,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  PerspectiveCamera,
  Raycaster,
  Scene,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { composeGraphImage, type IGraphImageColours, type IGraphImageFooter, type ILabelSnapshot } from './snapshot';

/** Half the side of the cube a graph or a scene is scaled into, so each axis spans `-S..S`. */
export const S = 3;
const HOME = new Vector3(8.8, -10.6, 7.2);
/** Aimed a little below the centre, which lifts the cube and leaves room for the labels under it. */
const TARGET = new Vector3(0, 0, -0.6);
export const Z_AXIS = new Vector3(0, 0, 1);
/** How long a camera flight to a step's view takes. */
const FLIGHT_MS = 1200;

/** Receives one captured frame; it must copy the canvas before its first `await`. */
export type FrameCallback = (source: HTMLCanvasElement, labels: ILabelSnapshot[], index: number) => Promise<void>;

/** A recording for a GIF: how many frames, how long each shows, and the capture itself. */
export interface IFrameRecording {
  count: number;
  delay: (index: number) => number;
  capture: (onFrame: FrameCallback) => Promise<boolean>;
}

export interface IGraphPoint {
  x: number;
  y: number;
  z: number;
}

/** The HTML labels laid over the canvas: placed every frame, copied into saved images. */
export interface IStageLabels {
  place(camera: PerspectiveCamera, width: number, height: number): void;
  snapshot(camera: PerspectiveCamera, width: number, height: number): ILabelSnapshot[];
  dispose(): void;
}

/**
 * What a graph and a 3D scene share: the renderer, camera, orbit controls and lights; rendering on
 * demand; resizing; hover and tap read-out; keyboard turning; saving a PNG; recording a turn for a
 * GIF; and releasing the WebGL context on `dispose`. Subclasses draw the content and say what can be
 * pointed at and how a point reads in the content's own units.
 */
export abstract class Stage {
  protected readonly renderer: WebGLRenderer;
  protected readonly scene = new Scene();
  protected readonly camera = new PerspectiveCamera(34, 1, 0.1, 200);
  protected readonly controls: OrbitControls;
  protected readonly markerMaterial = new MeshBasicMaterial();
  protected readonly marker = new Mesh(new SphereGeometry(0.1, 24, 16), this.markerMaterial);
  protected abstract readonly labels: IStageLabels;
  protected isDisposed = false;
  private isSpinning = false;
  private isPending = false;
  private readonly resizeObserver: ResizeObserver;
  private readonly raycaster = new Raycaster();
  private readonly pointer = new Vector2();
  private pressedAt: { x: number; y: number } | null = null;
  private isFramed = false;
  /** True while a capture drives the camera; the render loop and the controls stand aside. */
  private isCapturing = false;
  private flight: {
    fromPosition: Vector3;
    fromTarget: Vector3;
    toPosition: Vector3;
    toTarget: Vector3;
    startedAt: number;
  } | null = null;

  constructor(
    protected readonly host: HTMLElement,
    private readonly onHover: (point: IGraphPoint | null) => void,
    description: string,
  ) {
    // Throws where WebGL is unavailable; the component shows its fallback.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const canvas = this.renderer.domElement;
    canvas.className = 'block h-full w-full outline-none';
    canvas.tabIndex = 0;
    canvas.setAttribute(
      'aria-label',
      `${description} Drag or use the arrow keys to rotate; scroll, pinch or press plus and minus to zoom.`,
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
    // The reader taking hold of the view ends any flight to a step's view.
    this.controls.addEventListener('start', () => (this.flight = null));

    const key = new DirectionalLight(0xffffff, 1.7);
    key.position.set(5, -6, 9);
    const rim = new DirectionalLight(0xffffff, 0.6);
    rim.position.set(-7, 5, 4);
    this.scene.add(new AmbientLight(0xffffff, 0.55), new HemisphereLight(0xffffff, 0x334155, 0.9), key, rim);
    this.marker.visible = false;
    this.scene.add(this.marker);

    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('keydown', this.handleKeyDown);
    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(host);
  }

  /** What a pointer can land on, or null when there is nothing to read. */
  protected abstract pickTarget(): Object3D | null;
  /** A point in the cube, in the content's own units. */
  protected abstract readPoint(point: Vector3): IGraphPoint;

  /** Call at the end of a subclass constructor, once its labels exist: frames the view at its real size. */
  protected start(): void {
    this.resize();
  }

  setSpin(isSpinning: boolean): void {
    this.isSpinning = isSpinning;
    this.controls.autoRotate = isSpinning;
    this.requestRender();
  }

  resetView(): void {
    this.flight = null;
    const home = this.homePose();
    this.camera.position.copy(home.position);
    this.controls.target.copy(home.target);
    this.controls.update();
    this.requestRender();
  }

  /** Where `resetView` puts the camera, in cube coordinates. */
  protected homePose(): { position: Vector3; target: Vector3 } {
    const aspect = this.camera.aspect || 1;
    // A tall, narrow phone screen needs the camera further back to keep the cube in frame.
    const distance = aspect < 1 ? Math.pow(1 / aspect, 0.75) : 1;
    return { position: HOME.clone().multiplyScalar(distance).add(TARGET), target: TARGET.clone() };
  }

  /** Moves the camera smoothly to `position`, looking at `target`, both in cube coordinates. */
  protected flyTo(position: Vector3, target: Vector3): void {
    this.flight = {
      fromPosition: this.camera.position.clone(),
      fromTarget: this.controls.target.clone(),
      toPosition: position.clone(),
      toTarget: target.clone(),
      startedAt: performance.now(),
    };
    this.requestRender();
  }

  /** Puts the camera `t` of the way along a flight between two poses, with no animation. */
  protected placeCamera(
    from: { position: Vector3; target: Vector3 },
    to: { position: Vector3; target: Vector3 },
    t: number,
  ): void {
    this.camera.position.copy(from.position).lerp(to.position, t);
    this.controls.target.copy(from.target).lerp(to.target, t);
    this.camera.lookAt(this.controls.target);
  }

  /** The camera's pose now, in cube coordinates. */
  protected cameraPose(): { position: Vector3; target: Vector3 } {
    return { position: this.camera.position.clone(), target: this.controls.target.clone() };
  }

  /**
   * Called before each frame is drawn, for content that animates; returns true while it still
   * moves, which asks for another frame.
   */
  protected advance(_now: number): boolean {
    return false;
  }

  /** The content as it is on screen, with its labels and `footer` under it, as a PNG. */
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
   * view. See `captureFrames`.
   */
  captureTurn(count: number, onFrame: FrameCallback): Promise<boolean> {
    const target = this.controls.target.clone();
    const offset = this.camera.position.clone().sub(target);
    return this.captureFrames(
      count,
      (index) => {
        const turned = offset.clone().applyAxisAngle(Z_AXIS, (2 * Math.PI * index) / count);
        this.camera.position.copy(target).add(turned);
        this.camera.lookAt(target);
      },
      onFrame,
    );
  }

  /**
   * Renders `count` frames, each set up by `prepare`, and hands each to `onFrame`, which must copy
   * the canvas before its first `await` (see `drawGraphFrame`). The view, the spin and the controls
   * are put back afterwards. Resolves false when the content was closed before the last frame.
   */
  protected async captureFrames(
    count: number,
    prepare: (index: number) => void,
    onFrame: FrameCallback,
  ): Promise<boolean> {
    const start = this.cameraPose();
    const wasSpinning = this.isSpinning;
    const isMarked = this.marker.visible;
    this.setSpin(false);
    this.flight = null;
    this.marker.visible = false;
    this.controls.enabled = false;
    this.isCapturing = true;
    try {
      for (let index = 0; index < count; index += 1) {
        if (this.isDisposed) return false;
        prepare(index);
        this.renderer.render(this.scene, this.camera);
        const width = this.host.clientWidth;
        const height = this.host.clientHeight;
        this.labels.place(this.camera, width, height);
        await onFrame(this.renderer.domElement, this.labels.snapshot(this.camera, width, height), index);
      }
      return !this.isDisposed;
    } finally {
      this.isCapturing = false;
      this.camera.position.copy(start.position);
      this.controls.target.copy(start.target);
      this.controls.enabled = true;
      this.marker.visible = isMarked;
      this.setSpin(wasSpinning);
      this.requestRender();
    }
  }

  /** Releases everything the stage made; subclasses dispose their own content first, then call this. */
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
    this.marker.geometry.dispose();
    this.markerMaterial.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
    this.labels.dispose();
  }

  // -------------------------------------------------------------------------
  // Rendering and size
  // -------------------------------------------------------------------------

  protected readonly requestRender = (): void => {
    if (this.isPending || this.isDisposed) return;
    this.isPending = true;
    requestAnimationFrame(this.renderFrame);
  };

  private readonly renderFrame = (): void => {
    this.isPending = false;
    if (this.isDisposed || this.isCapturing) return;
    const now = performance.now();
    const isAnimating = this.advance(now);
    const isFlying = this.fly(now);
    const isMoving = this.controls.update();
    this.renderer.render(this.scene, this.camera);
    this.labels.place(this.camera, this.host.clientWidth, this.host.clientHeight);
    if (isMoving || isAnimating || isFlying || this.isSpinning) this.requestRender();
  };

  /** One frame of a camera flight; true while it is still under way. */
  private fly(now: number): boolean {
    const flight = this.flight;
    if (!flight) return false;
    const t = Math.min(1, (now - flight.startedAt) / FLIGHT_MS);
    const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    this.placeCamera(
      { position: flight.fromPosition, target: flight.fromTarget },
      { position: flight.toPosition, target: flight.toTarget },
      eased,
    );
    if (t >= 1) this.flight = null;
    return t < 1;
  }

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
    const target = this.pickTarget();
    if (!target) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(target, true)[0];
    if (!hit) {
      this.clearHover();
      return;
    }
    this.marker.position.copy(hit.point);
    this.marker.visible = true;
    this.onHover(this.readPoint(hit.point));
    this.requestRender();
  }

  protected readonly clearHover = (): void => {
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
