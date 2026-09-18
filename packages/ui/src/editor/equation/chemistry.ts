/**
 * The mhchem model behind `ChemistryEditor`: how a chemical equation is told apart from maths,
 * how a reaction splits into species and arrows, and how an arrow splits into direction and
 * condition. Pure functions, no React — `ChemistryEditor` is the only component that renders them.
 */

/** Is this equation mhchem notation, and if so what is inside the `\ce{...}`? */
export interface IChemicalEquation {
  isChemistry: boolean;
  /** The reaction itself, without the `\ce{}` wrapper. Empty when `isChemistry` is false. */
  body: string;
}

/**
 * It matters because MathLive cannot edit one. mhchem's body is not LaTeX maths — `2H2 + O2 ->
 * 2H2O` is a small language of its own — so the math field parses the whole thing as a single
 * indivisible atom: measured, the caret can only sit before it or after it, never inside. The body
 * is already close to plain text, so a chemical equation gets a text form and a live preview instead.
 */
export const parseChemicalEquation = (latex: string): IChemicalEquation => {
  const match = /^\s*\\ce\s*\{([\s\S]*)\}\s*$/.exec(latex);
  return match ? { isChemistry: true, body: match[1] } : { isChemistry: false, body: '' };
};

export const toChemicalEquationLatex = (body: string): string => `\\ce{${body}}`;

/** What a freshly inserted chemical equation holds: one arrow, so the form opens with two slots. */
export const EMPTY_REACTION_LATEX = toChemicalEquationLatex(' -> ');

/**
 * An arrow is a direction plus a condition you type.
 *
 * A fixed list of arrows cannot scale: a teacher wanting `->[H2SO4]` or `->[Δ, 450°C]` had to pick
 * the nearest wrong one. Direction is genuinely a small closed set; the text above the arrow is
 * not, and has to be free.
 */
export type ArrowDirection = '->' | '<=>' | '<-';

export const ARROW_DIRECTIONS: { token: ArrowDirection; label: string }[] = [
  { token: '->', label: 'Yields' },
  { token: '<=>', label: 'Reversible' },
  { token: '<-', label: 'Reverse' },
];

/** The conditions written above an arrow often enough to be one click. */
export const ARROW_CONDITIONS: { label: string; value: string }[] = [
  { label: 'Heat', value: '\\Delta' },
  { label: 'Light', value: 'light' },
  { label: 'Catalyst', value: 'catalyst' },
  { label: 'Electricity', value: 'electricity' },
  { label: 'Conc. H₂SO₄', value: 'conc. H2SO4' },
];

/**
 * Notation typed into a species that a keyboard does not offer directly. `insert` goes in at the
 * caret; `label` is what the chip says. Rendered by `ChemistryEditor` as one-click inserts.
 */
export interface IChemistryInsert {
  label: string;
  insert: string;
  /** LaTeX for the chip's rendered preview. */
  preview: string;
}

export const CHEMISTRY_INSERTS: IChemistryInsert[] = [
  { label: 'Solid', insert: '(s)', preview: '\\ce{(s)}' },
  { label: 'Liquid', insert: '(l)', preview: '\\ce{(l)}' },
  { label: 'Gas', insert: '(g)', preview: '\\ce{(g)}' },
  { label: 'Aqueous', insert: '(aq)', preview: '\\ce{(aq)}' },
  { label: 'Gas evolved', insert: ' ^', preview: '\\ce{^}' },
  { label: 'Precipitate', insert: ' v', preview: '\\ce{v}' },
  { label: 'Positive ion', insert: '^+', preview: '\\ce{Na^+}' },
  { label: 'Negative ion', insert: '^-', preview: '\\ce{Cl^-}' },
  { label: '2+ ion', insert: '^2+', preview: '\\ce{Ca^2+}' },
  { label: '2− ion', insert: '^2-', preview: '\\ce{SO4^2-}' },
  { label: 'Isotope', insert: '^{}_{}', preview: '\\ce{^{14}_{6}C}' },
  { label: 'Plus', insert: ' + ', preview: '+' },
];

export interface IArrow {
  direction: ArrowDirection;
  /** Rendered above the arrow — a catalyst, a temperature, "light". */
  condition: string;
  /**
   * Rendered below the arrow. Not offered in the form because it is vanishingly rare in school
   * chemistry, but preserved verbatim so opening such an equation never silently discards it.
   */
  below: string;
}

const ARROW_PARTS = /^(<=>|->|<-)(?:\[([^\]]*)\])?(?:\[([^\]]*)\])?$/;

export const parseArrow = (token: string): IArrow => {
  const match = ARROW_PARTS.exec(token.trim());
  if (!match) return { direction: '->', condition: '', below: '' };
  return { direction: match[1] as ArrowDirection, condition: match[2] ?? '', below: match[3] ?? '' };
};

export const buildArrow = ({ direction, condition, below }: IArrow): string => {
  // `trim` decides whether a bracket is needed; it never rewrites what was typed, or a space in
  // "hot gas" would vanish as it was pressed.
  if (!condition.trim() && !below.trim()) return direction;
  return `${direction}[${condition}]${below.trim() ? `[${below}]` : ''}`;
};

/**
 * Matches an mhchem arrow, longest form first so `->[\Delta]` is not read as a bare `->` with
 * stray text after it.
 */
const ARROW_PATTERN =
  /(<=>\[[^\]]*\](?:\[[^\]]*\])?|->\[[^\]]*\](?:\[[^\]]*\])?|<-\[[^\]]*\](?:\[[^\]]*\])?|<=>|->|<-)/;

/**
 * A reaction as an alternating chain: species, arrow, species, arrow, species…
 *
 * A single-arrow reaction is a chain of length two; `CH4 -> CH3Cl -> CH2Cl2` is three species and
 * two arrows. Splitting is lossless: the body is exactly `species[0] + arrows[0] + species[1] + …`,
 * so the form round-trips anything it can parse, including arrows carrying conditions.
 */
export interface IReactionChain {
  /** n species and n-1 arrows. A lone species (an ion, an isotope) is a chain of length one. */
  species: string[];
  arrows: string[];
}

/**
 * Splitting and joining must be exactly inverse, whitespace included.
 *
 * The fields are controlled from `body`, so every keystroke goes value → join → split → value. Any
 * normalisation in that loop is applied *while the author is still typing*: trimming the ends meant
 * a trailing space was deleted the instant it was pressed. Whitespace therefore stays exactly where
 * it was put — the species carry their own spacing and the arrows are the bare matched token.
 */
export const splitReaction = (body: string): IReactionChain => {
  const parts = body.split(new RegExp(ARROW_PATTERN.source, 'g'));
  const species: string[] = [];
  const arrows: string[] = [];
  parts.forEach((part, index) => {
    if (index % 2 === 0) species.push(part ?? '');
    else arrows.push(part ?? '');
  });
  return { species, arrows };
};

/**
 * Pure concatenation, and it has to stay that way: inserting a separating space here is not
 * idempotent under the value → join → split → value loop, so a field being typed into slowly filled
 * with spaces. Whatever spacing the author wants, they type. "Add step" seeds its own.
 */
export const joinReaction = ({ species, arrows }: IReactionChain): string =>
  species.map((value, index) => (index < arrows.length ? `${value}${arrows[index]}` : value)).join('');

/** A spoken description of an arrow, for a trigger's accessible name. */
export const describeArrow = (token: string): string => {
  const { direction, condition } = parseArrow(token);
  const name = ARROW_DIRECTIONS.find((option) => option.token === direction)?.label ?? 'Yields';
  return condition ? `${name}, ${condition}` : name;
};

/**
 * Has this equation no content yet?
 *
 * "Empty LaTeX" is not the whole story once chemistry seeds a node with a bare arrow: `\ce{ -> }`
 * is a non-empty string that nonetheless says nothing. The distinction drives two behaviours that
 * must agree — a blank equation opens straight into its editor, and a blank equation is deleted
 * rather than committed, so abandoning one never leaves a stray arrow in the document.
 */
export const isBlankEquation = (latex: string): boolean => {
  const chemistry = parseChemicalEquation(latex);
  if (!chemistry.isChemistry) return !latex.trim();
  return splitReaction(chemistry.body).species.every((value) => !value.trim());
};
