import type { IScene, SceneObjectType } from '@repo/shared/interfaces';
import { Box3, BufferGeometry, type Group, Line, LineBasicMaterial, Mesh, type Object3D, Vector3 } from 'three';
import { type ISceneLabel, SceneLabels } from './labels';
import { SceneBuilder, type SceneColours, sceneReach } from './scene-builder';
import { type IGraphPoint, S, Stage } from './stage';

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
 * slider range — so a slider visibly grows a solid rather than the view re-zooming to fit — with its
 * labels over the canvas and the hover read-out in the scene's own units.
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

  /** Draws `scene` at the slider `values`; returns the object types this version cannot draw yet. */
  setScene(scene: IScene, values: Readonly<Record<string, number>>): SceneObjectType[] {
    if (scene !== this.source) {
      this.source = scene;
      this.fit(scene, values);
    }
    this.values = values;
    return this.redraw();
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
   * One scale and centre for the scene, from the room its objects take across every slider value.
   * Fitted by the sphere round that room, so a long row of solids fills the view as a compact one does.
   */
  private fit(scene: IScene, values: Readonly<Record<string, number>>): void {
    this.reach.copy(sceneReach(scene, values));
    if (scene.axes) this.reach.expandByPoint(new Vector3());
    const radius = this.reach.getSize(new Vector3()).length() / 2;
    this.scale = VIEW_RADIUS / (Math.max(radius, 1e-6) * MARGIN);
    this.reach.getCenter(this.centre);
  }

  private toCube(point: Vector3): Vector3 {
    return point.clone().sub(this.centre).multiplyScalar(this.scale);
  }

  private redraw(): SceneObjectType[] {
    const scene = this.source;
    const theme = this.theme;
    if (!scene || !theme) return [];
    if (this.content) {
      this.scene.remove(this.content);
      disposeTree(this.content);
    }
    const built = new SceneBuilder(scene, this.values, theme.colours).build();
    const labels: ISceneLabel[] = [...built.labels];
    if (scene.axes) labels.push(...this.axes(built.group, theme.line));
    built.group.scale.setScalar(this.scale);
    built.group.position.copy(this.centre).multiplyScalar(-this.scale);
    this.content = built.group;
    this.scene.add(built.group);
    this.labels.set(labels.map((label) => ({ text: label.text, position: this.toCube(label.position) })));
    this.clearHover();
    this.requestRender();
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
