/**
 * An interactive 3D scene in authored content: the JSON a teacher, a template or the AI writes in a
 * ```` ```scene3d ```` block, version 1. See `.claude/plans/3D_SCENES.md` §4.
 *
 * These are the shapes as written. Optional fields are optional in the format itself; the parser
 * (`parseScene` in `@repo/shared/utils`) checks every field and the renderer applies the defaults.
 */

/** A number, or an expression of the scene's sliders: `4`, `"h"`, `"r/2"`. */
export type SceneNumber = number | string;

/** `[x, y, z]`; each part may be a slider expression. */
export type SceneVector = [SceneNumber, SceneNumber, SceneNumber];

/** A theme colour role, so a scene follows the light and dark themes. */
export type SceneColour =
  'primary' | 'foreground' | 'muted' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5';

export type CubeFace = 'top' | 'bottom' | 'front' | 'back' | 'left' | 'right';

/** VSEPR shapes. Each fixes its ligand and lone-pair count, so the drawing is exact. */
export type MoleculeShape =
  | 'linear'
  | 'bent'
  | 'trigonal-planar'
  | 'trigonal-pyramidal'
  | 'tetrahedral'
  | 'trigonal-bipyramidal'
  | 'see-saw'
  | 't-shaped'
  | 'square-planar'
  | 'square-pyramidal'
  | 'octahedral';

export type LatticeCell = 'sc' | 'bcc' | 'fcc' | 'hcp';

interface ISceneObjectBase {
  /** Unique in the scene; steps refer to objects by it. */
  id: string;
  /** Text shown beside the object. */
  label?: string;
  colour?: SceneColour;
  /** 0 (invisible) to 1 (solid). */
  opacity?: SceneNumber;
}

/** Solids and grouped objects sit at `position`, with their axis along z. */
interface IScenePlaced extends ISceneObjectBase {
  position?: SceneVector;
}

// Geometry

export interface IScenePoint extends ISceneObjectBase {
  type: 'point';
  position: SceneVector;
}

export interface ISceneSegment extends ISceneObjectBase {
  type: 'segment';
  from: SceneVector;
  to: SceneVector;
  dashed?: boolean;
}

/** An infinite line, drawn across the scene's frame. */
export interface ISceneLine extends ISceneObjectBase {
  type: 'line';
  through: SceneVector;
  direction: SceneVector;
}

/** An arrow; from the origin unless `from` is given. */
export interface ISceneArrow extends ISceneObjectBase {
  type: 'vector';
  from?: SceneVector;
  to: SceneVector;
}

export interface IScenePlane extends ISceneObjectBase {
  type: 'plane';
  point: SceneVector;
  normal: SceneVector;
  /** Side of the square drawn of the plane. */
  size?: SceneNumber;
}

/** The angle between two segments, lines, vectors or planes, marked with an arc. */
export interface ISceneAngle extends ISceneObjectBase {
  type: 'angle';
  between: [string, string];
  showValue?: boolean;
}

// Solids

export interface ISceneCube extends IScenePlaced {
  type: 'cube';
  size: SceneNumber;
}

export interface ISceneCuboid extends IScenePlaced {
  type: 'cuboid';
  length: SceneNumber;
  width: SceneNumber;
  height: SceneNumber;
}

/** A right prism or pyramid on a regular polygon of `sides` sides inscribed in a circle of `radius`. */
export interface ISceneRegularSolid extends IScenePlaced {
  type: 'prism' | 'pyramid';
  sides: number;
  radius: SceneNumber;
  height: SceneNumber;
}

export interface ISceneRound extends IScenePlaced {
  type: 'cylinder' | 'cone';
  radius: SceneNumber;
  height: SceneNumber;
}

export interface ISceneFrustum extends IScenePlaced {
  type: 'frustum';
  radius: SceneNumber;
  topRadius: SceneNumber;
  height: SceneNumber;
}

export interface ISceneBall extends IScenePlaced {
  type: 'sphere' | 'hemisphere';
  radius: SceneNumber;
}

// Reasoning

/** A die; standard faces 1–6 with opposite faces adding to 7 unless `faces` says otherwise. */
export interface ISceneDie extends IScenePlaced {
  type: 'die';
  size?: SceneNumber;
  /** Six labels in the order top, bottom, front, back, left, right. */
  faces?: string[];
}

/** An n × n × n block of small cubes, as in painted-cube questions. */
export interface ISceneCubeGrid extends IScenePlaced {
  type: 'cubeGrid';
  n: number;
  /** The faces painted before cutting; all six when absent. */
  painted?: CubeFace[];
  /** Small cubes left out, by `[column, row, layer]` from 0. */
  hidden?: [number, number, number][];
}

/** A flat net of a cube: six squares at `[row, column]` cells, which a `fold` step folds up. */
export interface ISceneNet extends IScenePlaced {
  type: 'net';
  of: 'cube';
  cells: [number, number][];
  labels?: string[];
}

// Chemistry

export interface ISceneMolecule extends IScenePlaced {
  type: 'molecule';
  shape: MoleculeShape;
  /** Element symbol of the central atom: `"C"`, `"S"`. */
  central: string;
  /** One symbol for all ligands, or one per ligand. */
  ligands: string | string[];
  lonePairs?: number;
}

export interface ISceneAtom extends ISceneObjectBase {
  type: 'atom';
  element: string;
  position: SceneVector;
}

export interface ISceneBond extends ISceneObjectBase {
  type: 'bond';
  from: string;
  to: string;
  order?: 1 | 2 | 3;
}

/** Unit cells of a crystal lattice. */
export interface ISceneLattice extends IScenePlaced {
  type: 'lattice';
  cell: LatticeCell;
  /** Unit cells along each edge, 1 to 3. */
  cells?: number;
  element?: string;
  /** Label each atom with the share of it inside one cell (1/8 at a corner, 1/2 on a face). */
  showShares?: boolean;
}

// Text

export interface ISceneLabel extends ISceneObjectBase {
  type: 'label';
  position: SceneVector;
  text: string;
}

export type SceneObject =
  | IScenePoint
  | ISceneSegment
  | ISceneLine
  | ISceneArrow
  | IScenePlane
  | ISceneAngle
  | ISceneCube
  | ISceneCuboid
  | ISceneRegularSolid
  | ISceneRound
  | ISceneFrustum
  | ISceneBall
  | ISceneDie
  | ISceneCubeGrid
  | ISceneNet
  | ISceneMolecule
  | ISceneAtom
  | ISceneBond
  | ISceneLattice
  | ISceneLabel;

export type SceneObjectType = SceneObject['type'];

export interface ISceneSlider {
  /** The name expressions use: a letter or a short word, `h`, `r`, `angle`. */
  name: string;
  label?: string;
  min: number;
  max: number;
  value: number;
  step?: number;
}

/**
 * What a step does besides showing and hiding objects. One kind per step, and each lasts until a
 * later step changes it: `slice` cuts a solid across at height `at` above its base (a sphere's base
 * is its lowest point) and lifts the top part away; `unfold` opens a solid into its net and `fold`
 * closes it; `rotate` turns an object by `angle` degrees about its own position; `highlight` dims
 * everything else for that step only.
 */
export type SceneAction =
  | { slice: string; at: SceneNumber }
  | { unfold: string }
  | { fold: string }
  | { rotate: string; axis: 'x' | 'y' | 'z'; angle: SceneNumber }
  | { highlight: string };

export interface ISceneStep {
  label: string;
  show?: string[];
  hide?: string[];
  action?: SceneAction;
  camera?: { position: SceneVector; target?: SceneVector };
}

export interface IScene {
  version: 1;
  title?: string;
  /** Draw x, y, z axes and a frame; off by default, since a solid usually reads better without. */
  axes?: boolean;
  sliders?: ISceneSlider[];
  objects: SceneObject[];
  steps?: ISceneStep[];
}
