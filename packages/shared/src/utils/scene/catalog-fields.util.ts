import type { CubeFace, IScene, ISceneStep } from '../../interfaces/scene3d.interface';

/** The parts a scene template is made of: its form's fields, and readers for their values. See `catalog.util.ts`. */
export interface IFieldBase {
  name: string;
  label: string;
  /** One line under the field, when its meaning is not plain from the label. */
  hint?: string;
}

export type SceneField =
  | (IFieldBase & { kind: 'number'; value: number; min: number; max: number; step: number })
  | (IFieldBase & { kind: 'toggle'; value: boolean })
  | (IFieldBase & { kind: 'choice'; value: string; options: { value: string; label: string }[] })
  | (IFieldBase & { kind: 'text'; value: string })
  | (IFieldBase & { kind: 'texts'; value: string[] })
  | (IFieldBase & { kind: 'faces'; value: CubeFace[] });

export type SceneFieldValue = SceneField['value'];
export type SceneFieldValues = Record<string, SceneFieldValue>;

export interface ISceneCatalogEntry {
  key: string;
  title: string;
  /** What a learner sees in it, for the gallery card. */
  description: string;
  group: 'Mensuration' | '3D geometry' | 'Aptitude' | 'Chemistry';
  fields: SceneField[];
  build: (values: SceneFieldValues) => IScene;
}

/** The values a template's form starts with. */
export const sceneCatalogDefaults = (entry: ISceneCatalogEntry): SceneFieldValues =>
  Object.fromEntries(entry.fields.map((field) => [field.name, field.value]));

// Readers for a form's values, each falling back when the value is missing or of the wrong kind.
export const numberOf = (values: SceneFieldValues, name: string, fallback: number): number => {
  const value = values[name];
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
};
export const flagOf = (values: SceneFieldValues, name: string): boolean => values[name] === true;
export const textOf = (values: SceneFieldValues, name: string, fallback: string): string => {
  const value = values[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
};
export const textsOf = (values: SceneFieldValues, name: string, fallback: string[]): string[] => {
  const value = values[name];
  return Array.isArray(value) && value.length === fallback.length
    ? value.map((item, index) => (typeof item === 'string' && item.trim() ? item.trim() : fallback[index]))
    : fallback;
};

export const number = (
  name: string,
  label: string,
  value: number,
  [min, max, step]: [number, number, number],
): SceneField => ({
  kind: 'number',
  name,
  label,
  value,
  min,
  max,
  step,
});
export const toggle = (name: string, label: string, value: boolean, hint?: string): SceneField => ({
  kind: 'toggle',
  name,
  label,
  value,
  ...(hint ? { hint } : {}),
});
export const PART: SceneField = {
  kind: 'choice',
  name: 'part',
  label: 'Use it for',
  value: 'question',
  options: [
    { value: 'question', label: 'The question — shows the puzzle only' },
    { value: 'solution', label: 'The solution — steps that work it out' },
  ],
};
export const isSolution = (values: SceneFieldValues) => values.part === 'solution';
export const steps = (scene: IScene, list: ISceneStep[], include: boolean): IScene =>
  include ? { ...scene, steps: list } : scene;
