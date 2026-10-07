import type { GraphSample } from '@repo/shared/utils';
import { formatGraphNumber } from '@repo/shared/utils';
import { type PerspectiveCamera, Vector3 } from 'three';

type Axis = 'x' | 'y' | 'z';
const AXES: Axis[] = ['x', 'y', 'z'];

interface ILabel {
  element: HTMLSpanElement;
  position: Vector3;
}

/**
 * Axis titles and three ticks per axis, as HTML laid over the canvas: crisp at any zoom, themed by
 * the same Tailwind tokens as the page, and selectable. Tick positions in the cube never move, so a
 * redraw only rewrites their text.
 */
export class GraphLabels {
  private readonly labels: ILabel[] = [];
  private readonly ticks: Record<Axis, HTMLSpanElement[]> = { x: [], y: [], z: [] };
  private readonly projected = new Vector3();

  /** `half` is half the side of the graph's cube. */
  constructor(
    private readonly layer: HTMLElement,
    half: number,
  ) {
    const near = half + 0.45;
    const far = half + 1.1;
    const title = 'font-serif text-sm italic font-semibold text-foreground';
    const tick = 'font-mono text-xxs tabular-nums text-muted-foreground';
    this.add([0, -far, -half], title, 'x');
    this.add([far, 0, -half], title, 'y');
    this.add([-far, -far, 0], title, 'z');
    [-1, 0, 1].forEach((step) => {
      this.ticks.x.push(this.add([step * half, -near, -half], tick, ''));
      this.ticks.y.push(this.add([near, step * half, -half], tick, ''));
      this.ticks.z.push(this.add([-near, -near, step * half], tick, ''));
    });
  }

  setSample(sample: GraphSample): void {
    AXES.forEach((axis) => {
      const range = sample.bounds[axis];
      const span = range.max - range.min;
      this.ticks[axis].forEach((element, index) => {
        const value = range.min + (span * index) / 2;
        // Rounding noise around zero (`-6.9e-7` on a unit circle) reads as zero.
        element.textContent = formatGraphNumber(Math.abs(value) < span * 1e-4 ? 0 : value);
      });
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

  dispose(): void {
    this.labels.forEach(({ element }) => element.remove());
  }

  private add(position: [number, number, number], className: string, text: string): HTMLSpanElement {
    const element = document.createElement('span');
    element.className = `pointer-events-none absolute left-0 top-0 whitespace-nowrap ${className}`;
    element.textContent = text;
    this.layer.appendChild(element);
    this.labels.push({ element, position: new Vector3(...position) });
    return element;
  }
}
