import type { IScene, SceneObjectType } from '@repo/shared/interfaces';
import { SCENE_COLOURS } from '@repo/shared/utils';
import { Box3, BufferGeometry, type Group, Line, LineBasicMaterial, Mesh, type Object3D, Vector3 } from 'three';
import { type ISceneLabel, SceneLabels } from './labels';
import { SceneBuilder, type SceneColours, sceneReach } from './scene-builder';
import {
  easeInOut,
  type IStepCamera,
  mixStates,
  sceneStepCameras,
  sceneStepStates,
  type SceneState,
} from './scene-steps';
import { type IFrameRecording, type IGraphPoint, S, Stage } from './stage';

export interface ISceneTheme {
  /** Axes and frame lines. */
  line: string;
  /** The hover marker. */
  accent: string;
  colours: SceneColours;
}

/** Room left round the scene, so labels at its edges stay in view. */
const MARGIN = 1.1;
/** The sphere round the stage's cube, which is what the camera is placed to show in full. */
const VIEW_RADIUS = S * Math.sqrt(3);
/** How long one step takes to turn into the next. */
export const STEP_MS = 1400;
/** Frames per step change in a GIF, each shown for `GIF_FRAME_MS`; the step then holds for `GIF_HOLD_MS`. */
const GIF_STEP_FRAMES = 12;
const GIF_FRAME_MS = 80;
const GIF_HOLD_MS = 1600;
/** Colours for building a scene only to measure it, before the page's theme has been read. */
const MEASURING = Object.fromEntries(SCENE_COLOURS.map((role) => [role, '#888888'])) as SceneColours;

const disposeTree = (root: Object3D): void => {
  root.traverse((node) => {
    // Line covers LineSegments, its subclass; these are the only kinds a scene builds.
    if (!(node instanceof Mesh || node instanceof Line)) return;
    node.geometry.dispose();
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((item) => item.dispose());
  });
};

/**
 * One interactive 3D scene: its objects scaled into the stage's cube at one scale for the whole
 * slider range and every step — so a slider visibly grows a solid and a net opens without the view
 * re-zooming — with its labels over the canvas, the hover read-out in the scene's own units, and
 * animated steps.
 */
export class SceneStage extends Stage {
  protected readonly labels: SceneLabels;
  private content: Group | null = null;
  private source: IScene | null = null;
  private values: Readonly<Record<string, number>> = {};
  private theme: ISceneTheme | null = null;
  private scale = 1;
  private readonly centre = new Vector3();
  private readonly reach = new Box3();
  private states: SceneState[] = [];
  private cameras: (IStepCamera | null)[] = [];
  private step = 0;
  /** What is drawn now: a step's state, or a blend while one step turns into the next. */
  private shown: SceneState = {};
  private transition: { from: SceneState; to: SceneState; startedAt: number } | null = null;

  constructor(host: HTMLElement, labelLayer: HTMLElement, onHover: (point: IGraphPoint | null) => void) {
    super(host, onHover, 'Interactive 3D scene.');
    this.labels = new SceneLabels(labelLayer);
    this.start();
  }

  setTheme(theme: ISceneTheme): void {
    this.theme = theme;
    this.markerMaterial.color.setStyle(theme.accent);
    this.redraw();
  }

  /**
   * Draws `scene` at the slider `values`; returns the object types this version cannot draw yet. A
   * new scene starts at its first step; new values keep the step the reader is on.
   */
  setScene(scene: IScene, values: Readonly<Record<string, number>>): SceneObjectType[] {
    this.values = values;
    this.states = sceneStepStates(scene, values);
    this.cameras = sceneStepCameras(scene, values);
    if (scene !== this.source) {
      this.source = scene;
      this.step = 0;
      this.fit(scene, values);
      const camera = this.cameras[0];
      if (camera) this.placeCamera(this.stepPose(camera), this.stepPose(camera), 1);
    }
    this.step = Math.min(this.step, this.states.length - 1);
    this.transition = null;
    this.shown = this.states[this.step];
    return this.redraw();
  }

  /** Moves to step `index`, animating the change and flying the camera if the step sets a view. */
  setStep(index: number): void {
    const target = this.states[index];
    if (!target || index === this.step) return;
    const camera = this.cameras[index];
    if (camera !== this.cameras[this.step]) {
      const pose = camera ? this.stepPose(camera) : this.homePose();
      this.flyTo(pose.position, pose.target);
    }
    this.transition = { from: this.shown, to: target, startedAt: performance.now() };
    this.step = index;
    this.requestRender();
  }

  /** The steps played through once for a GIF, holding on each; the reader's view is the start. */
  stepRecording(): IFrameRecording {
    const count = 1 + (this.states.length - 1) * GIF_STEP_FRAMES;
    const frame = (index: number) => {
      if (index === 0) return { from: 0, to: 0, t: 1 };
      const to = Math.ceil(index / GIF_STEP_FRAMES);
      return { from: to - 1, to, t: (index - (to - 1) * GIF_STEP_FRAMES) / GIF_STEP_FRAMES };
    };
    return {
      count,
      delay: (index) => (frame(index).t >= 1 ? GIF_HOLD_MS : GIF_FRAME_MS),
      capture: async (onFrame) => {
        const view = this.cameraPose();
        const pose = (step: number) => {
          const camera = this.cameras[step];
          return camera ? this.stepPose(camera) : view;
        };
        try {
          return await this.captureFrames(
            count,
            (index) => {
              const { from, to, t } = frame(index);
              this.shown = mixStates(this.states[from], this.states[to], easeInOut(t));
              this.redraw(false);
              this.placeCamera(pose(from), pose(to), easeInOut(t));
            },
            onFrame,
          );
        } finally {
          this.shown = this.states[this.step];
          this.redraw();
        }
      },
    };
  }

  protected advance(now: number): boolean {
    const transition = this.transition;
    if (!transition) return false;
    const t = Math.min(1, (now - transition.startedAt) / STEP_MS);
    this.shown = mixStates(transition.from, transition.to, easeInOut(t));
    if (t >= 1) this.transition = null;
    this.redraw(t >= 1);
    return t < 1;
  }

  protected pickTarget(): Object3D | null {
    return this.content;
  }

  protected readPoint(point: Vector3): IGraphPoint {
    const real = point.clone().divideScalar(this.scale).add(this.centre);
    return { x: real.x, y: real.y, z: real.z };
  }

  dispose(): void {
    if (this.content) disposeTree(this.content);
    super.dispose();
  }

  /**
   * One scale and centre for the scene, from the room its objects take across every slider value
   * and every step — a net lies much wider than its solid. Fitted by the sphere round that room, so
   * a long row of solids fills the view as a compact one does.
   */
  private fit(scene: IScene, values: Readonly<Record<string, number>>): void {
    this.reach.copy(sceneReach(scene, values));
    if (scene.axes) this.reach.expandByPoint(new Vector3());
    if (this.states.length > 1) {
      this.states.forEach((state) => {
        const { group } = new SceneBuilder(scene, values, MEASURING, state).build();
        this.reach.union(new Box3().setFromObject(group));
        disposeTree(group);
      });
    }
    const radius = this.reach.getSize(new Vector3()).length() / 2;
    this.scale = VIEW_RADIUS / (Math.max(radius, 1e-6) * MARGIN);
    this.reach.getCenter(this.centre);
  }

  private toCube(point: Vector3): Vector3 {
    return point.clone().sub(this.centre).multiplyScalar(this.scale);
  }

  /** A step's camera in cube coordinates; without a target it looks where the home view does. */
  private stepPose(camera: IStepCamera): { position: Vector3; target: Vector3 } {
    return {
      position: this.toCube(new Vector3(...camera.position)),
      target: camera.target ? this.toCube(new Vector3(...camera.target)) : this.homePose().target,
    };
  }

  /**
   * Rebuilds the drawing from `shown`. Mid-animation (`isSettled` false) it leaves the hover and the
   * next frame to the animation, which already asks for one.
   */
  private redraw(isSettled = true): SceneObjectType[] {
    const scene = this.source;
    const theme = this.theme;
    if (!scene || !theme) return [];
    if (this.content) {
      this.scene.remove(this.content);
      disposeTree(this.content);
    }
    const built = new SceneBuilder(scene, this.values, theme.colours, this.shown).build();
    const labels: ISceneLabel[] = [...built.labels];
    if (scene.axes) labels.push(...this.axes(built.group, theme.line));
    built.group.scale.setScalar(this.scale);
    built.group.position.copy(this.centre).multiplyScalar(-this.scale);
    this.content = built.group;
    this.scene.add(built.group);
    this.labels.set(labels.map((label) => ({ text: label.text, position: this.toCube(label.position) })));
    if (isSettled) {
      this.clearHover();
      this.requestRender();
    }
    return built.skipped;
  }

  /** x, y and z axes from the origin across the room the scene takes, each named at its end. */
  private axes(group: Group, colour: string): ISceneLabel[] {
    const size = this.reach.getSize(new Vector3());
    const pad = Math.max(size.x, size.y, size.z) * 0.12;
    const material = new LineBasicMaterial({ color: colour, transparent: true, opacity: 0.7 });
    return (['x', 'y', 'z'] as const).map((name) => {
      const low = Math.min(this.reach.min[name], 0);
      const end = new Vector3().setComponent('xyz'.indexOf(name), Math.max(this.reach.max[name], 0) + pad);
      const start = new Vector3().setComponent('xyz'.indexOf(name), low < 0 ? low - pad : 0);
      group.add(new Line(new BufferGeometry().setFromPoints([start, end]), material.clone()));
      return { text: name, position: end.clone().multiplyScalar(1 + 0.4 * (pad / end.length())) };
    });
  }
}
