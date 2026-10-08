import { type PerspectiveCamera, Vector3 } from 'three';
import type { ILabelSnapshot } from '../three/snapshot';
import type { IStageLabels } from '../three/stage';

/** Text pinned to a point of a 3D scene, such as an object's label. */
export interface ISceneLabel {
  text: string;
  position: Vector3;
}

/**
 * A scene's labels — "r = 3 cm" beside a radius, "Apex" at a cone's tip — as HTML over the canvas,
 * replaced whenever the scene is redrawn. In a saved image they are drawn as notes.
 */
export class SceneLabels implements IStageLabels {
  private labels: { element: HTMLSpanElement; position: Vector3 }[] = [];
  private readonly projected = new Vector3();

  constructor(private readonly layer: HTMLElement) {}

  set(labels: ISceneLabel[]): void {
    // An animation sets the same labels every frame; only their places change, so the spans stay.
    const isSame =
      labels.length === this.labels.length &&
      labels.every((label, index) => label.text === this.labels[index].element.textContent);
    if (isSame) {
      labels.forEach((label, index) => this.labels[index].position.copy(label.position));
      return;
    }
    this.dispose();
    this.labels = labels.map(({ text, position }) => {
      const element = document.createElement('span');
      element.className =
        'pointer-events-none absolute left-0 top-0 whitespace-nowrap bg-card/80 px-1 text-xs font-medium text-foreground';
      element.textContent = text;
      this.layer.appendChild(element);
      return { element, position: position.clone() };
    });
  }

  place(camera: PerspectiveCamera, width: number, height: number): void {
    this.labels.forEach(({ element, position }) => {
      this.projected.copy(position).project(camera);
      element.hidden = this.projected.z > 1;
      const left = ((this.projected.x + 1) / 2) * width;
      const top = ((1 - this.projected.y) / 2) * height;
      element.style.transform = `translate(${left}px, ${top}px) translate(-50%, -50%)`;
    });
  }

  snapshot(camera: PerspectiveCamera, width: number, height: number): ILabelSnapshot[] {
    return this.labels.flatMap(({ element, position }) => {
      this.projected.copy(position).project(camera);
      if (this.projected.z > 1) return [];
      const x = ((this.projected.x + 1) / 2) * width;
      const y = ((1 - this.projected.y) / 2) * height;
      return [{ text: element.textContent ?? '', kind: 'note' as const, x, y }];
    });
  }

  dispose(): void {
    this.labels.forEach(({ element }) => element.remove());
    this.labels = [];
  }
}
