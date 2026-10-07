import type {
  CubeFace,
  IScene,
  LatticeCell,
  MoleculeShape,
  SceneColour,
  SceneNumber,
  SceneObjectType,
} from '../interfaces/scene3d.interface';
import type { IRichTextNode } from '../interfaces/rich-text.interface';
import { compileExpression } from './graph-expression.util';

/**
 * The 3D scene format's parser: reads the JSON of a ```` ```scene3d ```` block and either returns
 * the scene or every reason it is not one, each with a path (`objects[2] "cone".radius`) a teacher
 * or the AI can act on. Pure TypeScript, so the editor, the AI validators and the course agent all
 * check a scene the same way. See `.claude/plans/3D_SCENES.md` §4.
 */

/** The rich-text node a scene is stored in; its `spec` attribute holds the scene's JSON. */
export const SCENE3D_NODE = 'scene3d';

/**
 * The scene block a ```` ```scene3d ```` fence becomes, or null. A fence whose JSON is not a valid
 * scene stays a code block, so a broken scene from an AI reply shows as its source rather than as a
 * broken scene; the reply's validator says what is wrong with it.
 */
export const sceneFenceNode = (language: string, body: string): IRichTextNode | null => {
  if (language !== SCENE3D_NODE) return null;
  const parsed = parseScene(body);
  return parsed.isValid ? { type: SCENE3D_NODE, attrs: { spec: JSON.stringify(parsed.scene) } } : null;
};

/** A scene's title, read without the full check — for search text and previews. */
export const sceneTitleOf = (spec: unknown): string => {
  try {
    const raw: unknown = typeof spec === 'string' ? JSON.parse(spec) : null;
    const title = typeof raw === 'object' && raw !== null && 'title' in raw ? raw.title : null;
    return typeof title === 'string' && title.trim() ? title.trim() : '3D scene';
  } catch {
    return '3D scene';
  }
};

export const SCENE_LIMITS = { bytes: 20_000, objects: 60, sliders: 8, steps: 12 } as const;

export const SCENE_COLOURS: readonly SceneColour[] = [
  'primary',
  'foreground',
  'muted',
  'chart-1',
  'chart-2',
  'chart-3',
  'chart-4',
  'chart-5',
];

const CUBE_FACES: readonly CubeFace[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];
const LATTICE_CELLS: readonly LatticeCell[] = ['sc', 'bcc', 'fcc', 'hcp'];

/** How many ligands each VSEPR shape has, and the lone pairs it may carry. */
export const MOLECULE_SHAPES: Readonly<Record<MoleculeShape, { ligands: number; lonePairs: readonly number[] }>> = {
  linear: { ligands: 2, lonePairs: [0, 3] },
  bent: { ligands: 2, lonePairs: [1, 2] },
  'trigonal-planar': { ligands: 3, lonePairs: [0] },
  'trigonal-pyramidal': { ligands: 3, lonePairs: [1] },
  tetrahedral: { ligands: 4, lonePairs: [0] },
  'trigonal-bipyramidal': { ligands: 5, lonePairs: [0] },
  'see-saw': { ligands: 4, lonePairs: [1] },
  't-shaped': { ligands: 3, lonePairs: [2] },
  'square-planar': { ligands: 4, lonePairs: [2] },
  'square-pyramidal': { ligands: 5, lonePairs: [1] },
  octahedral: { ligands: 6, lonePairs: [0] },
};

/** The solids a `slice` step can cut, and those an `unfold` or `fold` step can open into a net. */
const SLICEABLE: readonly SceneObjectType[] = [
  'cube',
  'cuboid',
  'prism',
  'pyramid',
  'cylinder',
  'cone',
  'frustum',
  'sphere',
  'hemisphere',
];
const UNFOLDABLE: readonly SceneObjectType[] = ['cube', 'cuboid', 'prism', 'pyramid', 'cylinder', 'cone', 'net'];
/** What an `angle` can be measured between. */
const ANGLE_SIDES: readonly SceneObjectType[] = ['segment', 'line', 'vector', 'plane'];

type FieldRule =
  | { kind: 'number'; positive?: boolean }
  | { kind: 'vector' }
  | { kind: 'boolean' }
  | { kind: 'text' }
  | { kind: 'ref'; types: readonly SceneObjectType[] }
  | { kind: 'refPair'; types: readonly SceneObjectType[] }
  | { kind: 'integer'; min: number; max: number }
  | { kind: 'choice'; values: readonly string[] }
  | { kind: 'texts'; length: number }
  | { kind: 'faces' }
  | { kind: 'cells' }
  | { kind: 'triples' }
  | { kind: 'ligands' };

interface IField {
  rule: FieldRule;
  isRequired: boolean;
}

const req = (rule: FieldRule): IField => ({ rule, isRequired: true });
const opt = (rule: FieldRule): IField => ({ rule, isRequired: false });
const NUMBER: FieldRule = { kind: 'number' };
const LENGTH: FieldRule = { kind: 'number', positive: true };
const VECTOR: FieldRule = { kind: 'vector' };
const BOOLEAN: FieldRule = { kind: 'boolean' };
const TEXT: FieldRule = { kind: 'text' };
const PLACED = { position: opt(VECTOR) };
const ROUND = { ...PLACED, radius: req(LENGTH), height: req(LENGTH) };
const REGULAR = { ...ROUND, sides: req({ kind: 'integer', min: 3, max: 12 }) };

/** Every field each object type takes, beyond `id`, `type`, `label`, `colour` and `opacity`. */
const OBJECT_FIELDS: Record<SceneObjectType, Record<string, IField>> = {
  point: { position: req(VECTOR) },
  segment: { from: req(VECTOR), to: req(VECTOR), dashed: opt(BOOLEAN) },
  line: { through: req(VECTOR), direction: req(VECTOR) },
  vector: { from: opt(VECTOR), to: req(VECTOR) },
  plane: { point: req(VECTOR), normal: req(VECTOR), size: opt(LENGTH) },
  angle: { between: req({ kind: 'refPair', types: ANGLE_SIDES }), showValue: opt(BOOLEAN) },
  cube: { ...PLACED, size: req(LENGTH) },
  cuboid: { ...PLACED, length: req(LENGTH), width: req(LENGTH), height: req(LENGTH) },
  prism: REGULAR,
  pyramid: REGULAR,
  cylinder: ROUND,
  cone: ROUND,
  frustum: { ...ROUND, topRadius: req(NUMBER) },
  sphere: { ...PLACED, radius: req(LENGTH) },
  hemisphere: { ...PLACED, radius: req(LENGTH) },
  die: { ...PLACED, size: opt(LENGTH), faces: opt({ kind: 'texts', length: 6 }) },
  cubeGrid: {
    ...PLACED,
    n: req({ kind: 'integer', min: 2, max: 6 }),
    painted: opt({ kind: 'faces' }),
    hidden: opt({ kind: 'triples' }),
  },
  net: {
    ...PLACED,
    of: req({ kind: 'choice', values: ['cube'] }),
    cells: req({ kind: 'cells' }),
    labels: opt({ kind: 'texts', length: 6 }),
  },
  molecule: {
    ...PLACED,
    shape: req({ kind: 'choice', values: Object.keys(MOLECULE_SHAPES) }),
    central: req(TEXT),
    ligands: req({ kind: 'ligands' }),
    lonePairs: opt({ kind: 'integer', min: 0, max: 3 }),
  },
  atom: { element: req(TEXT), position: req(VECTOR) },
  bond: {
    from: req({ kind: 'ref', types: ['atom'] }),
    to: req({ kind: 'ref', types: ['atom'] }),
    order: opt({ kind: 'integer', min: 1, max: 3 }),
  },
  lattice: {
    ...PLACED,
    cell: req({ kind: 'choice', values: LATTICE_CELLS }),
    cells: opt({ kind: 'integer', min: 1, max: 3 }),
    element: opt(TEXT),
    showShares: opt(BOOLEAN),
  },
  label: { position: req(VECTOR), text: req(TEXT) },
};

const COMMON_FIELDS = ['id', 'type', 'label', 'colour', 'opacity'];
const ID = /^[A-Za-z][\w-]{0,31}$/;
const SLIDER_NAME = /^[A-Za-z][A-Za-z0-9]{0,7}$/;
const RESERVED_NAMES = ['pi', 'e'];

export type SceneParseResult = { isValid: true; scene: IScene } | { isValid: false; errors: string[] };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** "a cone", "an atom", "a segment, line, vector or plane". */
const aOrAn = (words: string): string => `${/^[aeiou]/i.test(words) ? 'an' : 'a'} ${words}`;

const describe = (value: unknown): string => (typeof value === 'string' ? `"${value}"` : JSON.stringify(value));

/** Collects errors while one scene is checked; `sliders` are the names numbers may use. */
class SceneChecker {
  readonly errors: string[] = [];
  readonly types = new Map<string, SceneObjectType>();
  sliders: Record<string, number> = {};

  add(path: string, message: string): void {
    this.errors.push(`${path}: ${message}`);
  }

  /** A number or a slider expression, which must give a finite value at the sliders' start. */
  number(path: string, value: unknown, isPositive: boolean): void {
    let evaluated: number;
    if (typeof value === 'number') evaluated = value;
    else if (typeof value === 'string') {
      const compiled = compileExpression(value, Object.keys(this.sliders));
      if (!compiled.isValid) {
        this.add(path, compiled.message);
        return;
      }
      evaluated = compiled.evaluate(this.sliders);
    } else {
      this.add(path, `must be a number or a slider expression, not ${describe(value)}.`);
      return;
    }
    if (!Number.isFinite(evaluated)) this.add(path, 'does not give a number at the sliders’ starting values.');
    else if (isPositive && evaluated <= 0) this.add(path, `must be more than 0 (it is ${evaluated}).`);
  }

  vector(path: string, value: unknown): void {
    if (!Array.isArray(value) || value.length !== 3) {
      this.add(path, `must be [x, y, z], not ${describe(value)}.`);
      return;
    }
    value.forEach((part, index) => this.number(`${path}[${index}]`, part, false));
  }

  ref(path: string, value: unknown, types: readonly SceneObjectType[]): void {
    const type = typeof value === 'string' ? this.types.get(value) : undefined;
    if (!type) this.add(path, `${describe(value)} is not the id of an object in this scene.`);
    else if (!types.includes(type)) {
      const options = types.length > 1 ? `${types.slice(0, -1).join(', ')} or ${types[types.length - 1]}` : types[0];
      this.add(path, `"${value}" is ${aOrAn(type)}; it must be ${aOrAn(options)}.`);
    }
  }

  field(path: string, value: unknown, rule: FieldRule): void {
    switch (rule.kind) {
      case 'number':
        return this.number(path, value, rule.positive === true);
      case 'vector':
        return this.vector(path, value);
      case 'ref':
        return this.ref(path, value, rule.types);
      case 'refPair':
        if (!Array.isArray(value) || value.length !== 2) this.add(path, 'must name two objects: ["a", "b"].');
        else value.forEach((part, index) => this.ref(`${path}[${index}]`, part, rule.types));
        return undefined;
      default:
        return this.plainField(path, value, rule);
    }
  }

  /** True or false, text, a whole number in range, or one of a list of words. */
  plainField(path: string, value: unknown, rule: FieldRule): void {
    if (rule.kind === 'boolean' && typeof value !== 'boolean') this.add(path, 'must be true or false.');
    if (rule.kind === 'text' && (typeof value !== 'string' || !value.trim())) this.add(path, 'must be some text.');
    if (
      rule.kind === 'integer' &&
      !(Number.isInteger(value) && Number(value) >= rule.min && Number(value) <= rule.max)
    ) {
      this.add(path, `must be a whole number from ${rule.min} to ${rule.max}, not ${describe(value)}.`);
    }
    if (rule.kind === 'choice' && !(typeof value === 'string' && rule.values.includes(value))) {
      this.add(path, `must be one of ${rule.values.join(', ')}, not ${describe(value)}.`);
    }
    if (rule.kind === 'ligands') this.ligands(path, value);
    else if (['texts', 'faces', 'cells', 'triples'].includes(rule.kind)) this.listField(path, value, rule);
  }

  ligands(path: string, value: unknown): void {
    const isSymbol = (part: unknown) => typeof part === 'string' && /^[A-Z][a-z]?$/.test(part);
    if (!(isSymbol(value) || (Array.isArray(value) && value.length > 0 && value.every(isSymbol)))) {
      this.add(path, 'must be an element symbol such as "H", or a list of them.');
    }
  }

  /** The list-valued fields: labels, cube faces, net cells, hidden cubes. */
  listField(path: string, value: unknown, rule: FieldRule): void {
    if (!Array.isArray(value)) {
      this.add(path, 'must be a list.');
      return;
    }
    const isCell = (part: unknown, size: number) =>
      Array.isArray(part) && part.length === size && part.every((n) => Number.isInteger(n) && n >= 0 && n < 6);
    const problems: Partial<Record<FieldRule['kind'], { isWrong: boolean; message: string }>> = {
      texts: {
        isWrong:
          rule.kind === 'texts' && (value.length !== rule.length || !value.every((part) => typeof part === 'string')),
        message: `must be ${rule.kind === 'texts' ? rule.length : 0} pieces of text.`,
      },
      faces: {
        isWrong: !value.every((part) => CUBE_FACES.includes(part)),
        message: `may hold only ${CUBE_FACES.join(', ')}.`,
      },
      cells: {
        isWrong: value.length !== 6 || !value.every((part) => isCell(part, 2)),
        message: 'must be six [row, column] cells, each from 0 to 5.',
      },
      triples: {
        isWrong: !value.every((part) => isCell(part, 3)),
        message: 'must be a list of [column, row, layer] positions.',
      },
    };
    const problem = problems[rule.kind];
    if (problem?.isWrong) this.add(path, problem.message);
  }
}

const checkSliders = (checker: SceneChecker, sliders: unknown): void => {
  if (sliders === undefined) return;
  if (!Array.isArray(sliders)) {
    checker.add('sliders', 'must be a list.');
    return;
  }
  if (sliders.length > SCENE_LIMITS.sliders) checker.add('sliders', `at most ${SCENE_LIMITS.sliders}.`);
  sliders.forEach((slider, index) => {
    const path = `sliders[${index}]`;
    if (!isRecord(slider)) {
      checker.add(path, 'must be an object.');
      return;
    }
    const { name, min, max, value, step } = slider;
    const numbers = [min, max, value].every((part) => typeof part === 'number' && Number.isFinite(part));
    if (typeof name !== 'string' || !SLIDER_NAME.test(name) || RESERVED_NAMES.includes(name)) {
      checker.add(`${path}.name`, 'must be a short name of letters and digits, such as "h" or "r2"; not pi or e.');
    } else if (name in checker.sliders) {
      checker.add(`${path}.name`, `"${name}" is used by two sliders.`);
    } else if (!numbers) {
      checker.add(path, 'needs numbers for min, max and value.');
    } else if (Number(min) >= Number(max) || Number(value) < Number(min) || Number(value) > Number(max)) {
      checker.add(path, 'needs min below max, and value between them.');
    } else {
      checker.sliders[name] = Number(value);
    }
    if (step !== undefined && !(typeof step === 'number' && step > 0)) {
      checker.add(`${path}.step`, 'must be more than 0.');
    }
  });
};

/** Every object: its id, its type, its fields; ids are collected first so references can point forward. */
const checkObjects = (checker: SceneChecker, objects: unknown): void => {
  if (!Array.isArray(objects) || !objects.length) {
    checker.add('objects', 'must be a list of at least one object.');
    return;
  }
  if (objects.length > SCENE_LIMITS.objects) checker.add('objects', `at most ${SCENE_LIMITS.objects}.`);
  objects.forEach((object) => {
    if (!isRecord(object) || typeof object.id !== 'string' || typeof object.type !== 'string') return;
    if (object.type in OBJECT_FIELDS) checker.types.set(object.id, object.type as SceneObjectType);
  });
  const seen = new Set<string>();
  objects.forEach((object, index) => {
    if (!isRecord(object)) {
      checker.add(`objects[${index}]`, 'must be an object.');
      return;
    }
    const path = `objects[${index}]${typeof object.id === 'string' ? ` "${object.id}"` : ''}`;
    if (typeof object.id !== 'string' || !ID.test(object.id)) {
      checker.add(path, 'needs an id: letters, digits, - or _.');
    } else if (seen.has(object.id)) checker.add(path, `the id "${object.id}" is used twice.`);
    else seen.add(object.id);
    const type = typeof object.type === 'string' ? object.type : '';
    if (!(type in OBJECT_FIELDS)) {
      checker.add(
        path,
        `${describe(object.type)} is not an object type; use one of ${Object.keys(OBJECT_FIELDS).join(', ')}.`,
      );
      return;
    }
    checkObjectFields(checker, path, object, OBJECT_FIELDS[type as SceneObjectType]);
    if (type === 'molecule') checkMolecule(checker, path, object);
  });
};

const checkObjectFields = (
  checker: SceneChecker,
  path: string,
  object: Record<string, unknown>,
  fields: Record<string, IField>,
): void => {
  Object.entries(fields).forEach(([name, field]) => {
    const value = object[name];
    if (value === undefined) {
      if (field.isRequired) checker.add(`${path}.${name}`, 'is missing.');
      return;
    }
    checker.field(`${path}.${name}`, value, field.rule);
  });
  Object.keys(object)
    .filter((name) => !(name in fields) && !COMMON_FIELDS.includes(name))
    .forEach((name) => {
      const known = [...Object.keys(fields), ...COMMON_FIELDS.slice(2)].join(', ');
      checker.add(`${path}.${name}`, `is not a field of ${aOrAn(String(object.type))}; it takes ${known}.`);
    });
  if (object.label !== undefined && typeof object.label !== 'string') checker.add(`${path}.label`, 'must be text.');
  if (object.colour !== undefined && !SCENE_COLOURS.includes(object.colour as SceneColour)) {
    checker.add(`${path}.colour`, `must be one of ${SCENE_COLOURS.join(', ')}.`);
  }
  if (object.opacity !== undefined) checker.number(`${path}.opacity`, object.opacity, true);
};

/** A VSEPR shape fixes how many ligands and lone pairs there are; the counts must match it. */
const checkMolecule = (checker: SceneChecker, path: string, object: Record<string, unknown>): void => {
  const shape = MOLECULE_SHAPES[object.shape as MoleculeShape];
  if (!shape) return;
  if (Array.isArray(object.ligands) && object.ligands.length !== shape.ligands) {
    checker.add(`${path}.ligands`, `${aOrAn(String(object.shape))} molecule has ${shape.ligands} ligands.`);
  }
  const lonePairs = typeof object.lonePairs === 'number' ? object.lonePairs : shape.lonePairs[0];
  if (!shape.lonePairs.includes(lonePairs)) {
    checker.add(
      `${path}.lonePairs`,
      `${aOrAn(String(object.shape))} molecule has ${shape.lonePairs.join(' or ')} lone pairs.`,
    );
  }
};

const ACTIONS: Record<string, readonly SceneObjectType[]> = {
  slice: SLICEABLE,
  unfold: UNFOLDABLE,
  fold: UNFOLDABLE,
  rotate: Object.keys(OBJECT_FIELDS) as SceneObjectType[],
  highlight: Object.keys(OBJECT_FIELDS) as SceneObjectType[],
};

const checkAction = (checker: SceneChecker, path: string, action: unknown): void => {
  const kinds = isRecord(action) ? Object.keys(ACTIONS).filter((kind) => kind in action) : [];
  if (!isRecord(action) || kinds.length !== 1) {
    checker.add(path, `must be one of ${Object.keys(ACTIONS).join(', ')}, e.g. { "unfold": "cone" }.`);
    return;
  }
  const [kind] = kinds;
  checker.ref(`${path}.${kind}`, action[kind], ACTIONS[kind]);
  if (kind === 'slice') checker.number(`${path}.at`, action.at, false);
  if (kind === 'rotate') {
    checker.field(`${path}.axis`, action.axis, { kind: 'choice', values: ['x', 'y', 'z'] });
    checker.number(`${path}.angle`, action.angle, false);
  }
};

const checkSteps = (checker: SceneChecker, steps: unknown): void => {
  if (steps === undefined) return;
  if (!Array.isArray(steps)) {
    checker.add('steps', 'must be a list.');
    return;
  }
  if (steps.length > SCENE_LIMITS.steps) checker.add('steps', `at most ${SCENE_LIMITS.steps}.`);
  const allTypes = Object.keys(OBJECT_FIELDS) as SceneObjectType[];
  steps.forEach((step, index) => {
    const path = `steps[${index}]`;
    if (!isRecord(step)) {
      checker.add(path, 'must be an object.');
      return;
    }
    if (typeof step.label !== 'string' || !step.label.trim()) {
      checker.add(`${path}.label`, 'must say what the step shows.');
    }
    (['show', 'hide'] as const).forEach((key) => {
      const ids = step[key];
      if (ids === undefined) return;
      if (!Array.isArray(ids)) checker.add(`${path}.${key}`, 'must be a list of ids.');
      else ids.forEach((id, n) => checker.ref(`${path}.${key}[${n}]`, id, allTypes));
    });
    if (step.action !== undefined) checkAction(checker, `${path}.action`, step.action);
    if (step.camera !== undefined) {
      if (!isRecord(step.camera)) checker.add(`${path}.camera`, 'must be { "position": [x, y, z] }.');
      else {
        checker.vector(`${path}.camera.position`, step.camera.position);
        if (step.camera.target !== undefined) checker.vector(`${path}.camera.target`, step.camera.target);
      }
    }
  });
};

/** Reads a scene from its JSON text, or from already-parsed JSON. */
export const parseScene = (input: string | unknown): SceneParseResult => {
  let raw: unknown = input;
  if (typeof input === 'string') {
    if (input.length > SCENE_LIMITS.bytes) {
      return { isValid: false, errors: [`scene: is over ${SCENE_LIMITS.bytes / 1000} KB; keep it smaller.`] };
    }
    try {
      raw = JSON.parse(input);
    } catch (error) {
      return {
        isValid: false,
        errors: [`scene: is not valid JSON (${error instanceof Error ? error.message : 'unknown error'}).`],
      };
    }
  }
  if (!isRecord(raw)) return { isValid: false, errors: ['scene: must be one JSON object.'] };
  const checker = new SceneChecker();
  if (raw.version !== 1) checker.add('version', 'must be 1.');
  if (raw.title !== undefined && typeof raw.title !== 'string') checker.add('title', 'must be text.');
  if (raw.axes !== undefined && typeof raw.axes !== 'boolean') checker.add('axes', 'must be true or false.');
  checkSliders(checker, raw.sliders);
  checkObjects(checker, raw.objects);
  checkSteps(checker, raw.steps);
  const known = ['version', 'title', 'axes', 'sliders', 'objects', 'steps'];
  Object.keys(raw)
    .filter((key) => !known.includes(key))
    .forEach((key) => checker.add(key, `is not part of a scene; it takes ${known.join(', ')}.`));
  // Every field has been checked against the format above, which is what the cast relies on.
  return checker.errors.length
    ? { isValid: false, errors: checker.errors }
    : { isValid: true, scene: raw as unknown as IScene };
};

/** The starting value of every slider in a scene. */
export const sceneSliderValues = (scene: IScene): Record<string, number> =>
  Object.fromEntries((scene.sliders ?? []).map((slider) => [slider.name, slider.value]));

const compiledNumbers = new Map<string, (values: Readonly<Record<string, number>>) => number>();

/**
 * A scene number at the current slider values. Expressions are compiled once and reused, since the
 * renderer asks again on every slider move. A number the parser accepted always compiles; anything
 * else reads as 0.
 */
export const sceneNumber = (value: SceneNumber, values: Readonly<Record<string, number>>): number => {
  if (typeof value === 'number') return value;
  const names = Object.keys(values);
  const key = `${names.join(',')}|${value}`;
  let evaluate = compiledNumbers.get(key);
  if (!evaluate) {
    const compiled = compileExpression(value, names);
    evaluate = compiled.isValid ? compiled.evaluate : () => 0;
    compiledNumbers.set(key, evaluate);
  }
  const result = evaluate(values);
  return Number.isFinite(result) ? result : 0;
};
