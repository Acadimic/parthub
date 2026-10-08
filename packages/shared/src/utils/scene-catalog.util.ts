import { type ISceneCatalogEntry } from './scene-catalog-fields.util';
import { cubeNet, dice, molecule, paintedCube, unitCell } from './scene-catalog-models.util';
import { cone, cylinder, planes, prism, sphere, vectors } from './scene-catalog-solids.util';

export {
  type ISceneCatalogEntry,
  sceneCatalogDefaults,
  type SceneField,
  type SceneFieldValue,
  type SceneFieldValues,
} from './scene-catalog-fields.util';
export { CUBE_NETS, netSketch } from './scene-catalog-models.util';

/**
 * The templates a teacher starts a 3D scene from, each with a short form for its key numbers. A
 * template knows its fields and builds a scene from their values, so the editor never asks a teacher
 * to write the scene format; the JSON stays behind "Advanced" for anything a template does not cover.
 */
export const SCENE_CATALOG: readonly ISceneCatalogEntry[] = [
  cone,
  cylinder,
  sphere,
  prism,
  planes,
  vectors,
  cubeNet,
  dice,
  paintedCube,
  molecule,
  unitCell,
];
