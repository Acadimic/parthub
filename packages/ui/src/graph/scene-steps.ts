import type { IScene, ISceneStep, SceneVector } from '@repo/shared/interfaces';
import { sceneNumber } from '@repo/shared/utils';
import { Quaternion, Vector3 } from 'three';

type Values = Readonly<Record<string, number>>;

/** How one object looks at a step. Every field is a number, so two states blend by interpolation. */
export interface IObjectState {
  /** 0 hidden, 1 shown; in between while it fades. */
  shown: number;
  /** 0 a closed solid, 1 opened flat into its net. */
  open: number;
  /** Where a slice cuts it, above its base, and how far apart the two parts have moved (0 to 1). */
  cut: { at: number; gap: number } | null;
  /** Its turn about its centre, as a quaternion `[x, y, z, w]`; each `rotate` step adds to it in order. */
  turn: [number, number, number, number];
  /** 1 while a step singles it out. */
  highlight: number;
}

export type SceneState = Record<string, IObjectState>;

/** Where a step puts the camera, in the scene's units; null leaves it where the reader has it. */
export interface IStepCamera {
  position: [number, number, number];
  target: [number, number, number] | null;
}

const AXES = { x: 0, y: 1, z: 2 } as const;

const point = (value: SceneVector, values: Values): [number, number, number] => [
  sceneNumber(value[0], values),
  sceneNumber(value[1], values),
  sceneNumber(value[2], values),
];

/** Applies one step's show, hide and action to the state before it. */
const applyStep = (before: SceneState, step: ISceneStep, values: Values): SceneState => {
  const state: SceneState = Object.fromEntries(
    Object.entries(before).map(([id, object]) => [id, { ...object, turn: [...object.turn], highlight: 0 }]),
  );
  step.show?.forEach((id) => state[id] && (state[id].shown = 1));
  step.hide?.forEach((id) => state[id] && (state[id].shown = 0));
  const action = step.action;
  if (!action) return state;
  if ('slice' in action && state[action.slice]) {
    Object.assign(state[action.slice], { cut: { at: sceneNumber(action.at, values), gap: 1 }, open: 0 });
  } else if ('unfold' in action && state[action.unfold]) {
    Object.assign(state[action.unfold], { open: 1, cut: null });
  } else if ('fold' in action && state[action.fold]) {
    state[action.fold].open = 0;
  } else if ('rotate' in action && state[action.rotate]) {
    const axis = new Vector3().setComponent(AXES[action.axis], 1);
    const by = new Quaternion().setFromAxisAngle(axis, (sceneNumber(action.angle, values) * Math.PI) / 180);
    // Applied after the turns before it, about the scene's own axes, so "tip it, then turn it" reads as said.
    state[action.rotate].turn = by.multiply(new Quaternion(...state[action.rotate].turn)).toArray();
  } else if ('highlight' in action && state[action.highlight]) {
    state[action.highlight].highlight = 1;
  }
  return state;
};

/**
 * The objects that wait for a step to show them: those whose first mention in the steps is a `show`.
 * One hidden first and shown again later is there from the start, as its author meant.
 */
const revealedLater = (steps: ISceneStep[]): Set<string> => {
  const first = new Map<string, 'show' | 'hide'>();
  steps.forEach((step) => {
    step.hide?.forEach((id) => first.has(id) || first.set(id, 'hide'));
    step.show?.forEach((id) => first.has(id) || first.set(id, 'show'));
  });
  return new Set([...first].filter(([, kind]) => kind === 'show').map(([id]) => id));
};

/**
 * The state at each step, in order; one state, with everything shown, for a scene without steps.
 * An object whose first mention is a step's `show` starts hidden, so it can appear when that step comes.
 */
export const sceneStepStates = (scene: IScene, values: Values): SceneState[] => {
  const steps = scene.steps ?? [];
  const revealed = revealedLater(steps);
  const start: SceneState = Object.fromEntries(
    scene.objects.map((object) => [
      object.id,
      // A net starts flat, so its `open` starts at 1; a `fold` step folds it up.
      {
        shown: revealed.has(object.id) ? 0 : 1,
        open: object.type === 'net' ? 1 : 0,
        cut: null,
        turn: [0, 0, 0, 1],
        highlight: 0,
      },
    ]),
  );
  if (!steps.length) return [start];
  const states: SceneState[] = [];
  steps.reduce((before, step) => {
    const next = applyStep(before, step, values);
    states.push(next);
    return next;
  }, start);
  return states;
};

/** The camera each step leaves in place: its own, or the last one set before it. */
export const sceneStepCameras = (scene: IScene, values: Values): (IStepCamera | null)[] => {
  let current: IStepCamera | null = null;
  return (scene.steps ?? [{ label: '' }]).map((step) => {
    if (step.camera) {
      current = {
        position: point(step.camera.position, values),
        target: step.camera.target ? point(step.camera.target, values) : null,
      };
    }
    return current;
  });
};

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Smooth start and stop, so a solid eases open rather than jerking. */
export const easeInOut = (t: number): number => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

const mixCut = (from: IObjectState['cut'], to: IObjectState['cut'], t: number): IObjectState['cut'] => {
  const cut = to ?? from;
  if (!cut) return null;
  const gap = lerp(from?.gap ?? 0, to?.gap ?? 0, t);
  // Leaving a cut, the parts close up first and the cut goes once they meet.
  return gap <= 0 && !to ? null : { at: cut.at, gap };
};

/** The state `t` of the way from `from` to `to`. */
export const mixStates = (from: SceneState, to: SceneState, t: number): SceneState =>
  Object.fromEntries(
    Object.entries(to).map(([id, end]) => {
      const begin = from[id] ?? end;
      const object: IObjectState = {
        shown: lerp(begin.shown, end.shown, t),
        open: lerp(begin.open, end.open, t),
        cut: mixCut(begin.cut, end.cut, t),
        turn: new Quaternion(...begin.turn).slerp(new Quaternion(...end.turn), t).toArray(),
        highlight: lerp(begin.highlight, end.highlight, t),
      };
      return [id, object];
    }),
  );
