import type { LatticeCell, MoleculeShape } from '../interfaces/scene3d.interface';

type Point = [number, number, number];

/**
 * Element colours (the CPK colours as Jmol draws them) and covalent radii in ångström, for the
 * elements school chemistry draws. Anything else falls back to `UNKNOWN_ELEMENT`.
 */
export const ELEMENTS: Readonly<Record<string, { colour: string; radius: number }>> = {
  H: { colour: '#FFFFFF', radius: 0.31 },
  He: { colour: '#D9FFFF', radius: 0.28 },
  Li: { colour: '#CC80FF', radius: 1.28 },
  Be: { colour: '#C2FF00', radius: 0.96 },
  B: { colour: '#FFB5B5', radius: 0.84 },
  C: { colour: '#909090', radius: 0.76 },
  N: { colour: '#3050F8', radius: 0.71 },
  O: { colour: '#FF0D0D', radius: 0.66 },
  F: { colour: '#90E050', radius: 0.57 },
  Ne: { colour: '#B3E3F5', radius: 0.58 },
  Na: { colour: '#AB5CF2', radius: 1.66 },
  Mg: { colour: '#8AFF00', radius: 1.41 },
  Al: { colour: '#BFA6A6', radius: 1.21 },
  Si: { colour: '#F0C8A0', radius: 1.11 },
  P: { colour: '#FF8000', radius: 1.07 },
  S: { colour: '#FFFF30', radius: 1.05 },
  Cl: { colour: '#1FF01F', radius: 1.02 },
  Ar: { colour: '#80D1E3', radius: 1.06 },
  K: { colour: '#8F40D4', radius: 2.03 },
  Ca: { colour: '#3DFF00', radius: 1.76 },
  Ti: { colour: '#BFC2C7', radius: 1.6 },
  Cr: { colour: '#8A99C7', radius: 1.39 },
  Mn: { colour: '#9C7AC7', radius: 1.39 },
  Fe: { colour: '#E06633', radius: 1.32 },
  Co: { colour: '#F090A0', radius: 1.26 },
  Ni: { colour: '#50D050', radius: 1.24 },
  Cu: { colour: '#C88033', radius: 1.32 },
  Zn: { colour: '#7D80B0', radius: 1.22 },
  As: { colour: '#BD80E3', radius: 1.19 },
  Se: { colour: '#FFA100', radius: 1.2 },
  Br: { colour: '#A62929', radius: 1.2 },
  Kr: { colour: '#5CB8D1', radius: 1.16 },
  Ag: { colour: '#C0C0C0', radius: 1.45 },
  Sn: { colour: '#668080', radius: 1.39 },
  I: { colour: '#940094', radius: 1.39 },
  Xe: { colour: '#429EB0', radius: 1.4 },
  Cs: { colour: '#57178F', radius: 2.44 },
  Pt: { colour: '#D0D0E0', radius: 1.36 },
  Au: { colour: '#FFD123', radius: 1.36 },
  Hg: { colour: '#B8B8D0', radius: 1.32 },
  Pb: { colour: '#575961', radius: 1.46 },
};

export const UNKNOWN_ELEMENT = { colour: '#FF1493', radius: 0.9 } as const;

/** An element's colour and radius, matched however its symbol is cased: `"cl"` is chlorine. */
export const elementOf = (symbol: string): { colour: string; radius: number } => {
  const key = symbol.trim().charAt(0).toUpperCase() + symbol.trim().slice(1).toLowerCase();
  return ELEMENTS[key] ?? UNKNOWN_ELEMENT;
};

// ---------------------------------------------------------------------------
// VSEPR shapes
// ---------------------------------------------------------------------------

const TETRAHEDRAL_TILT = Math.acos(-1 / 3);
const around = (polar: number, azimuth: number): Point => [
  Math.sin(polar) * Math.cos(azimuth),
  Math.sin(polar) * Math.sin(azimuth),
  Math.cos(polar),
];
const third = (index: number) => (2 * Math.PI * index) / 3;

/** The electron domains of each arrangement, as unit directions, z up. */
const DOMAINS = {
  /** Two, opposite. */
  linear: [
    [1, 0, 0],
    [-1, 0, 0],
  ] as Point[],
  /** Three, 120° apart in a plane. */
  trigonal: [0, 1, 2].map((index) => around(Math.PI / 2, third(index))),
  /** Four: one up, three below at 109.5° from it. */
  tetrahedral: [[0, 0, 1] as Point, ...[0, 1, 2].map((index) => around(TETRAHEDRAL_TILT, third(index)))],
  /** Five: two axial, three in the equator. */
  bipyramidal: [
    [0, 0, 1] as Point,
    [0, 0, -1] as Point,
    ...[0, 1, 2].map((index) => around(Math.PI / 2, third(index))),
  ],
  /** Six: along every axis. */
  octahedral: [
    [0, 0, 1],
    [0, 0, -1],
    [1, 0, 0],
    [-1, 0, 0],
    [0, 1, 0],
    [0, -1, 0],
  ] as Point[],
};

/**
 * A bent molecule laid in the x–z plane, so it faces the default view rather than hiding one atom
 * behind the other: the two ligands `angle` apart below, the lone pairs above.
 */
const bent = (angle: number, pairs: number): { ligands: Point[]; lonePairs: Point[] } => {
  const half = angle / 2;
  const ligands: Point[] = [
    [Math.sin(half), 0, -Math.cos(half)],
    [-Math.sin(half), 0, -Math.cos(half)],
  ];
  if (pairs === 1) return { ligands, lonePairs: [[0, 0, 1]] };
  // A tetrahedron's other two corners, in the plane square to the ligands'.
  return {
    ligands,
    lonePairs: [
      [0, Math.sin(half), Math.cos(half)],
      [0, -Math.sin(half), Math.cos(half)],
    ],
  };
};

/**
 * Where each shape's ligands and lone pairs point, as unit directions from the central atom, at the
 * ideal VSEPR angles. A lone pair takes the place the shape's name leaves empty: the top of a
 * trigonal pyramid, the equator of a T or a see-saw, the axis of a square plane.
 */
export const moleculeDirections = (
  shape: MoleculeShape,
  lonePairs?: number,
): { ligands: Point[]; lonePairs: Point[] } => {
  const { linear, trigonal, tetrahedral, bipyramidal, octahedral } = DOMAINS;
  const split = (domains: Point[], pairs: number[]) => ({
    ligands: domains.filter((_, index) => !pairs.includes(index)),
    lonePairs: pairs.map((index) => domains[index]),
  });
  switch (shape) {
    case 'linear':
      // Three lone pairs (XeF₂) sit round the equator of a bipyramid, the two ligands on its axis.
      return lonePairs === 3 ? split(bipyramidal, [2, 3, 4]) : split(linear, []);
    case 'bent':
      return bent(lonePairs === 2 ? TETRAHEDRAL_TILT : (2 * Math.PI) / 3, lonePairs === 2 ? 2 : 1);
    case 'trigonal-planar':
      return split(trigonal, []);
    case 'trigonal-pyramidal':
      return split(tetrahedral, [0]);
    case 'tetrahedral':
      return split(tetrahedral, []);
    case 'trigonal-bipyramidal':
      return split(bipyramidal, []);
    case 'see-saw':
      return split(bipyramidal, [2]);
    case 't-shaped':
      return split(bipyramidal, [2, 3]);
    case 'square-planar':
      return split(octahedral, [0, 1]);
    case 'square-pyramidal':
      return split(octahedral, [1]);
    default:
      return split(octahedral, []);
  }
};

// ---------------------------------------------------------------------------
// Crystal lattices
// ---------------------------------------------------------------------------

/** One atom site of a unit cell: where it is, in cell edges, and how much of it the cell holds. */
export interface ILatticeSite {
  position: Point;
  /** 1 inside, 1/2 on a face, 1/6 at a hexagonal corner, 1/8 at a cubic corner. */
  share: number;
  kind: 'corner' | 'face' | 'body';
}

/** hcp's height over its side, for spheres packed as closely as they go. */
export const HCP_HEIGHT = Math.sqrt(8 / 3);

const cubeCorners = (): ILatticeSite[] =>
  [0, 1].flatMap((x) =>
    [0, 1].flatMap((y) => [0, 1].map((z) => ({ position: [x, y, z] as Point, share: 1 / 8, kind: 'corner' as const }))),
  );

const hcpSites = (): ILatticeSite[] => {
  const corners = [0, HCP_HEIGHT].flatMap((z) =>
    [0, 1, 2, 3, 4, 5].map((index) => ({
      position: [Math.cos((Math.PI / 3) * index), Math.sin((Math.PI / 3) * index), z] as Point,
      share: 1 / 6,
      kind: 'corner' as const,
    })),
  );
  const faces = [0, HCP_HEIGHT].map((z) => ({ position: [0, 0, z] as Point, share: 1 / 2, kind: 'face' as const }));
  // The middle layer sits over every other triangle of the hexagon below.
  const middle = [Math.PI / 6, (5 * Math.PI) / 6, (3 * Math.PI) / 2].map((angle) => ({
    position: [Math.cos(angle) / Math.sqrt(3), Math.sin(angle) / Math.sqrt(3), HCP_HEIGHT / 2] as Point,
    share: 1,
    kind: 'body' as const,
  }));
  return [...corners, ...faces, ...middle];
};

/**
 * The atom sites of one unit cell. A cubic cell runs from 0 to 1 on each axis; the hexagonal cell
 * has sides of 1 round the z axis and is `HCP_HEIGHT` tall.
 */
export const latticeSites = (cell: LatticeCell): ILatticeSite[] => {
  if (cell === 'hcp') return hcpSites();
  const sites = cubeCorners();
  if (cell === 'bcc') sites.push({ position: [0.5, 0.5, 0.5], share: 1, kind: 'body' });
  if (cell === 'fcc') {
    [0, 1, 2].forEach((axis) =>
      [0, 1].forEach((side) => {
        const position: Point = [0.5, 0.5, 0.5];
        position[axis] = side;
        sites.push({ position, share: 1 / 2, kind: 'face' });
      }),
    );
  }
  return sites;
};

/** The answer key for unit-cell questions: atoms per cell, neighbours of each atom, and how full the space is. */
export const LATTICE_FACTS: Readonly<
  Record<LatticeCell, { name: string; atoms: number; coordination: number; packing: number; radius: string }>
> = {
  sc: { name: 'simple cubic', atoms: 1, coordination: 6, packing: 0.524, radius: 'r = a/2' },
  bcc: { name: 'body-centred cubic', atoms: 2, coordination: 8, packing: 0.68, radius: 'r = √3a/4' },
  fcc: { name: 'face-centred cubic', atoms: 4, coordination: 12, packing: 0.74, radius: 'r = a/(2√2)' },
  hcp: { name: 'hexagonal close-packed', atoms: 6, coordination: 12, packing: 0.74, radius: 'r = a/2' },
};

/** The radius of an atom in each cell, in cell edges, when neighbouring atoms touch. */
export const LATTICE_RADIUS: Readonly<Record<LatticeCell, number>> = {
  sc: 0.5,
  bcc: Math.sqrt(3) / 4,
  fcc: Math.sqrt(2) / 4,
  hcp: 0.5,
};
