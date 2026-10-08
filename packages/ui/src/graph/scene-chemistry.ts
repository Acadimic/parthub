import type { SceneObject } from '@repo/shared/interfaces';
import {
  elementOf,
  HCP_HEIGHT,
  LATTICE_RADIUS,
  latticeSites,
  type ILatticeSite,
  moleculeDirections,
} from '@repo/shared/utils';
import {
  BufferGeometry,
  CylinderGeometry,
  Group,
  LineSegments,
  type Material,
  Mesh,
  Quaternion,
  SphereGeometry,
  Vector3,
} from 'three';
import type { ISceneLabel } from './labels';

/** How the builder colours chemistry; this file owns the shapes and the sizes. */
export interface IChemistryPaint {
  /** An atom in an element's colour, at the object's opacity. */
  atom(colour: string): Material;
  /** An atom in the object's own colour, for a lattice that names no element. */
  own(): Material;
  /** A bond's stick. */
  bond(): Material;
  /** A lone pair's faint lobe. */
  lonePair(): Material;
  /** A unit cell's edges. */
  edges(): Material;
}

export interface IChemistryShape {
  group: Group;
  /** Element symbols and share fractions, positioned relative to the group. */
  labels: ISceneLabel[];
}

/** A ball-and-stick atom's radius, in ångström, from its covalent radius: small enough to see the bonds. */
export const atomRadius = (symbol: string): number => 0.12 + 0.2 * elementOf(symbol).radius;

const BOND_RADIUS = 0.07;
/** How far apart the sticks of a double or triple bond sit. */
const BOND_SPACING = 0.16;
const Y_AXIS = new Vector3(0, 1, 0);

/** A stick from `from` to `to`. */
const stick = (from: Vector3, to: Vector3, radius: number, material: Material): Mesh => {
  const along = to.clone().sub(from);
  const mesh = new Mesh(new CylinderGeometry(radius, radius, along.length(), 14), material);
  mesh.quaternion.setFromUnitVectors(Y_AXIS, along.clone().normalize());
  mesh.position.copy(from).add(along.multiplyScalar(0.5));
  return mesh;
};

/** Where each stick of a single, double or triple bond sits, in `BOND_SPACING`s from the line between the atoms. */
const BOND_OFFSETS: Record<number, number[]> = { 1: [0], 2: [-0.5, 0.5], 3: [-1, 0, 1] };

/** One, two or three sticks between two atoms, side by side. */
export const bondSticks = (from: Vector3, to: Vector3, order: number, paint: IChemistryPaint): Mesh[] => {
  const along = to.clone().sub(from).normalize();
  // Any direction square to the bond will do; prefer one in the horizontal, so double bonds read flat.
  const side = new Vector3(0, 0, 1).cross(along);
  if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
  side.normalize().multiplyScalar(BOND_SPACING);
  return (BOND_OFFSETS[order] ?? [0]).map((offset) => {
    const shift = side.clone().multiplyScalar(offset);
    return stick(from.clone().add(shift), to.clone().add(shift), BOND_RADIUS * (order > 1 ? 0.8 : 1), paint.bond());
  });
};

/** An atom as a ball in its element's colour. */
export const atomBall = (symbol: string, at: Vector3, paint: IChemistryPaint): Mesh => {
  const mesh = new Mesh(new SphereGeometry(atomRadius(symbol), 32, 20), paint.atom(elementOf(symbol).colour));
  mesh.position.copy(at);
  return mesh;
};

/**
 * A molecule from its VSEPR shape, centred on the origin: the central atom, each ligand at the sum
 * of the two covalent radii along its direction, and a faint lobe for each lone pair.
 */
const molecule = (object: Extract<SceneObject, { type: 'molecule' }>, paint: IChemistryPaint): IChemistryShape => {
  const group = new Group();
  const labels: ISceneLabel[] = [];
  const centre = new Vector3();
  const directions = moleculeDirections(object.shape, object.lonePairs);
  group.add(atomBall(object.central, centre, paint));
  labels.push({ text: object.central, position: centre.clone() });
  directions.ligands.forEach((direction, index) => {
    const symbol = Array.isArray(object.ligands) ? (object.ligands[index] ?? 'X') : object.ligands;
    const at = new Vector3(...direction).multiplyScalar(elementOf(object.central).radius + elementOf(symbol).radius);
    group.add(stick(centre, at, BOND_RADIUS, paint.bond()), atomBall(symbol, at, paint));
    labels.push({ text: symbol, position: at });
  });
  directions.lonePairs.forEach((direction) => {
    const lobe = new Mesh(new SphereGeometry(1, 24, 16), paint.lonePair());
    const pointing = new Vector3(...direction);
    lobe.scale.set(0.22, 0.5, 0.22);
    lobe.quaternion.setFromUnitVectors(Y_AXIS, pointing);
    lobe.position.copy(pointing.multiplyScalar(atomRadius(object.central) + 0.4));
    group.add(lobe);
  });
  return { group, labels };
};

// ---------------------------------------------------------------------------
// Lattices
// ---------------------------------------------------------------------------

/** A unit cell's edge in scene units: large beside a molecule's ångström, as a model would be. */
export const LATTICE_EDGE = 2;
/** Atoms are drawn at this share of their touching size unless their shares are shown, so the cell can be seen through. */
const OPEN_SIZE = 0.4;

const FRACTIONS: Record<string, string> = { '1': '1', '0.5': '1/2', '0.125': '1/8', '0.1667': '1/6' };
const fraction = (share: number) => FRACTIONS[String(Number(share.toFixed(4)))] ?? String(share);

/**
 * The part of a site's atom inside the cell: an eighth of a sphere at a cubic corner, a sixth at a
 * hexagonal corner, half on a face, all of it inside. `inward` points into the cell from the site.
 */
const atomPart = (site: ILatticeSite, radius: number, inward: Vector3, isHexagonal: boolean): BufferGeometry => {
  if (site.share >= 1) return new SphereGeometry(radius, 32, 20);
  if (site.kind === 'face') {
    const half = new SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    return half.applyQuaternion(new Quaternion().setFromUnitVectors(Y_AXIS, inward.clone().normalize()));
  }
  if (isHexagonal) {
    // A 120° wedge of the half that points into the prism, centred on the way to the hexagon's middle.
    const toward = Math.atan2(inward.y, inward.x);
    const wedge = new SphereGeometry(radius, 20, 12, toward - Math.PI - Math.PI / 3, (2 * Math.PI) / 3, 0, Math.PI / 2);
    return wedge.rotateX(Math.PI / 2).scale(1, 1, Math.sign(inward.z) || 1);
  }
  // The octant three.js builds is (−x, +y, +z); mirroring it on each axis turns it into the cell.
  const octant = new SphereGeometry(radius, 16, 12, 0, Math.PI / 2, 0, Math.PI / 2);
  return octant.scale(-Math.sign(inward.x), Math.sign(inward.y), Math.sign(inward.z));
};

/** A cubic cell's twelve edges, or a hexagonal prism's eighteen, as pairs of points. */
const cellEdges = (isHexagonal: boolean, cells: number): Vector3[] => {
  if (isHexagonal) {
    const corner = (index: number, z: number) =>
      new Vector3(Math.cos((Math.PI / 3) * index), Math.sin((Math.PI / 3) * index), z);
    return [0, 1, 2, 3, 4, 5].flatMap((index) => [
      corner(index, 0),
      corner(index + 1, 0),
      corner(index, HCP_HEIGHT),
      corner(index + 1, HCP_HEIGHT),
      corner(index, 0),
      corner(index, HCP_HEIGHT),
    ]);
  }
  const lines: Vector3[] = [];
  for (let a = 0; a <= cells; a += 1) {
    for (let b = 0; b <= cells; b += 1) {
      lines.push(new Vector3(0, a, b), new Vector3(cells, a, b));
      lines.push(new Vector3(a, 0, b), new Vector3(a, cells, b));
      lines.push(new Vector3(a, b, 0), new Vector3(a, b, cells));
    }
  }
  return lines;
};

/**
 * A crystal lattice standing on its base, centred over the origin: `cells` unit cells along each
 * edge (a hexagonal cell is always drawn alone). With `showShares`, a single cell's atoms are cut to
 * the part the cell holds and labelled with it, which is how "atoms per unit cell" is counted.
 */
const lattice = (object: Extract<SceneObject, { type: 'lattice' }>, paint: IChemistryPaint): IChemistryShape => {
  const group = new Group();
  const labels: ISceneLabel[] = [];
  const isHexagonal = object.cell === 'hcp';
  const cells = isHexagonal ? 1 : (object.cells ?? 1);
  const showShares = object.showShares === true && cells === 1;
  const radius = LATTICE_RADIUS[object.cell] * (showShares ? 1 : OPEN_SIZE);
  const colour = elementOf(object.element ?? '').colour;
  // Cubic cells run from 0 to `cells`; this moves the block to stand centred over the origin.
  const shift = isHexagonal ? new Vector3() : new Vector3(-cells / 2, -cells / 2, 0);
  const sites = new Map<string, ILatticeSite>();
  for (let x = 0; x < cells; x += 1) {
    for (let y = 0; y < cells; y += 1) {
      for (let z = 0; z < cells; z += 1) {
        latticeSites(object.cell).forEach((site) => {
          const position: [number, number, number] = [site.position[0] + x, site.position[1] + y, site.position[2] + z];
          sites.set(position.map((part) => part.toFixed(3)).join(','), { ...site, position });
        });
      }
    }
  }
  const middle = isHexagonal ? new Vector3(0, 0, HCP_HEIGHT / 2) : new Vector3(0.5, 0.5, 0.5);
  sites.forEach((site) => {
    const at = new Vector3(...site.position);
    const inward = middle.clone().sub(at);
    const mesh = new Mesh(
      showShares ? atomPart(site, radius, inward, isHexagonal) : new SphereGeometry(radius, 24, 16),
      object.element ? paint.atom(colour) : paint.own(),
    );
    mesh.position.copy(at.clone().add(shift));
    group.add(mesh);
    if (showShares) {
      const inside = site.share >= 1 ? at : at.clone().add(inward.normalize().multiplyScalar(radius * 0.55));
      labels.push({ text: fraction(site.share), position: inside.add(shift) });
    }
  });
  const edges = new LineSegments(new BufferGeometry().setFromPoints(cellEdges(isHexagonal, cells)), paint.edges());
  edges.position.copy(shift);
  group.add(edges);
  group.scale.setScalar(LATTICE_EDGE);
  labels.forEach((label) => label.position.multiplyScalar(LATTICE_EDGE));
  return { group, labels };
};

/** How far a lattice reaches from its `position`, in scene units. */
export const latticeReach = (object: Extract<SceneObject, { type: 'lattice' }>): { radius: number; height: number } =>
  object.cell === 'hcp'
    ? { radius: LATTICE_EDGE * 1.5, height: LATTICE_EDGE * (HCP_HEIGHT + 1) }
    : { radius: (LATTICE_EDGE * ((object.cells ?? 1) + 1)) / 2, height: LATTICE_EDGE * ((object.cells ?? 1) + 0.5) };

/** How far a molecule's atoms and lone pairs reach from its centre, in ångström. */
export const moleculeReach = (object: Extract<SceneObject, { type: 'molecule' }>): number => {
  const symbols = Array.isArray(object.ligands) ? object.ligands : [object.ligands];
  const central = elementOf(object.central).radius;
  return Math.max(
    atomRadius(object.central) + 1,
    ...symbols.map((symbol) => central + elementOf(symbol).radius + atomRadius(symbol)),
  );
};

/** A molecule or a lattice, or null for anything else; atoms and bonds are drawn by the builder, which knows where every atom is. */
export const chemistryShape = (object: SceneObject, paint: IChemistryPaint): IChemistryShape | null => {
  if (object.type === 'molecule') return molecule(object, paint);
  if (object.type === 'lattice') return lattice(object, paint);
  return null;
};
