/** One insertable item in the equation palette. */
export interface IPaletteItem {
  label: string;
  /** LaTeX to insert. `#?` marks a placeholder box the author tabs between. */
  latex: string;
  /** Rendered in the palette button. Falls back to `latex` with placeholders filled in. */
  preview?: string;
}

export interface IPaletteGroup {
  name: string;
  items: IPaletteItem[];
}

/**
 * Grouped by what a teacher is trying to write rather than by LaTeX primitive — a maths teacher
 * reaches for "fraction", not for a control sequence. The grouping mirrors `FunctionType` in
 * `@repo/shared/enums`, which the previous editor used and which encodes the real subject list.
 *
 * Every item inserts a template with `#?` placeholders. That is the mechanism that replaces the
 * old modal-per-function flow: the caret lands in the first box and Tab moves to the next, so a
 * nested expression is typed rather than assembled through a dialog tree.
 */
export const PALETTE_GROUPS: IPaletteGroup[] = [
  {
    name: 'Basic',
    items: [
      { label: 'Plus / minus', latex: '\\pm', preview: '\\pm' },
      { label: 'Multiply', latex: '\\times', preview: '\\times' },
      { label: 'Divide', latex: '\\div', preview: '\\div' },
      { label: 'Not equal', latex: '\\neq', preview: '\\neq' },
      { label: 'Less or equal', latex: '\\leq', preview: '\\leq' },
      { label: 'Greater or equal', latex: '\\geq', preview: '\\geq' },
      { label: 'Approximately', latex: '\\approx', preview: '\\approx' },
      { label: 'Degree', latex: '^{\\circ}', preview: '90^{\\circ}' },
    ],
  },
  {
    name: 'Fractions & roots',
    items: [
      { label: 'Fraction', latex: '\\frac{#?}{#?}', preview: '\\frac{a}{b}' },
      { label: 'Square root', latex: '\\sqrt{#?}', preview: '\\sqrt{x}' },
      { label: 'Nth root', latex: '\\sqrt[#?]{#?}', preview: '\\sqrt[3]{x}' },
      { label: 'Mixed number', latex: '#?\\frac{#?}{#?}', preview: '2\\frac{1}{2}' },
    ],
  },
  {
    name: 'Powers & indices',
    items: [
      { label: 'Power', latex: '#?^{#?}', preview: 'x^{2}' },
      { label: 'Subscript', latex: '#?_{#?}', preview: 'x_{1}' },
      { label: 'Both', latex: '#?_{#?}^{#?}', preview: 'x_{1}^{2}' },
      { label: 'Exponential', latex: 'e^{#?}', preview: 'e^{x}' },
    ],
  },
  {
    name: 'Greek',
    items: [
      { label: 'alpha', latex: '\\alpha', preview: '\\alpha' },
      { label: 'beta', latex: '\\beta', preview: '\\beta' },
      { label: 'gamma', latex: '\\gamma', preview: '\\gamma' },
      { label: 'theta', latex: '\\theta', preview: '\\theta' },
      { label: 'lambda', latex: '\\lambda', preview: '\\lambda' },
      { label: 'mu', latex: '\\mu', preview: '\\mu' },
      { label: 'pi', latex: '\\pi', preview: '\\pi' },
      { label: 'sigma', latex: '\\sigma', preview: '\\sigma' },
      { label: 'omega', latex: '\\omega', preview: '\\omega' },
      { label: 'Delta', latex: '\\Delta', preview: '\\Delta' },
    ],
  },
  {
    name: 'Trigonometry',
    items: [
      { label: 'sin', latex: '\\sin(#?)', preview: '\\sin\\theta' },
      { label: 'cos', latex: '\\cos(#?)', preview: '\\cos\\theta' },
      { label: 'tan', latex: '\\tan(#?)', preview: '\\tan\\theta' },
      { label: 'Angle', latex: '\\angle #?', preview: '\\angle ABC' },
      { label: 'Triangle', latex: '\\triangle #?', preview: '\\triangle' },
    ],
  },
  {
    name: 'Calculus',
    items: [
      { label: 'Limit', latex: '\\lim_{#? \\to #?} #?', preview: '\\lim_{x \\to 0}' },
      { label: 'Sum', latex: '\\sum_{#?}^{#?} #?', preview: '\\sum_{n=1}^{\\infty}' },
      { label: 'Product', latex: '\\prod_{#?}^{#?} #?', preview: '\\prod_{i=1}^{n}' },
      { label: 'Integral', latex: '\\int_{#?}^{#?} #? \\, d#?', preview: '\\int_{a}^{b}' },
      { label: 'Derivative', latex: '\\frac{d#?}{d#?}', preview: '\\frac{dy}{dx}' },
      { label: 'Infinity', latex: '\\infty', preview: '\\infty' },
    ],
  },
  {
    name: 'Matrices',
    items: [
      {
        label: 'Matrix 2×2',
        latex: '\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}',
        preview: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
      },
      {
        label: 'Determinant',
        latex: '\\begin{vmatrix} #? & #? \\\\ #? & #? \\end{vmatrix}',
        preview: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
      },
      { label: 'Vector', latex: '\\vec{#?}', preview: '\\vec{v}' },
      { label: 'Unit vector', latex: '\\hat{#?}', preview: '\\hat{n}' },
    ],
  },
];

/**
 * Complete, named formulas inserted whole and then edited in place.
 *
 * Separate from the palette on purpose: a teacher thinks "I need the quadratic formula", not "I
 * need a fraction containing a plus-minus and a square root". This list is hard-coded for the
 * spike; the plan has it becoming data seeded per standard and subject from `apps/support`.
 */
export const FORMULA_GALLERY: IPaletteItem[] = [
  { label: 'Quadratic formula', latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: "Pythagoras' theorem", latex: 'a^2 + b^2 = c^2' },
  { label: 'Area of a circle', latex: 'A = \\pi r^2' },
  { label: 'Circumference', latex: 'C = 2 \\pi r' },
  { label: 'Slope', latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}' },
  { label: 'Distance formula', latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}' },
  { label: 'Compound interest', latex: 'A = P\\left(1 + \\frac{r}{n}\\right)^{nt}' },
  { label: 'Trig identity', latex: '\\sin^2\\theta + \\cos^2\\theta = 1' },
  { label: 'nth term of an AP', latex: 'a_n = a_1 + (n - 1)d' },
  { label: "Ohm's law", latex: 'V = IR' },
  { label: 'Equation of motion', latex: 'v = u + at' },
  { label: 'Mass–energy', latex: 'E = mc^2' },
  { label: 'Ideal gas law', latex: 'PV = nRT' },
  { label: 'Photosynthesis', latex: '\\ce{6CO2 + 6H2O ->[light] C6H12O6 + 6O2}' },
];

/**
 * KaTeX has no notion of MathLive's `#?` tab stops, so a template needs substituting before it can
 * be previewed. `\placeholder{}` renders as an empty box, which is what the author will see once
 * the template is in the field.
 */
export const toPreviewLatex = (item: IPaletteItem): string =>
  item.preview ?? item.latex.replace(/#\?/g, '\\placeholder{}');

/**
 * Is this equation mhchem notation, and if so what is inside the `\ce{...}`?
 *
 * It matters because MathLive cannot edit one. mhchem's body is not LaTeX maths — `2H2 + O2 ->
 * 2H2O` is a small language of its own — so the math field parses the whole thing as a single
 * indivisible atom: measured, the caret can only sit before it or after it, never inside. Clicking
 * into the middle of a reaction does nothing at all.
 *
 * That is not a defect to work around so much as a signal about the right control. The body is
 * already close to plain text, so it is far quicker to type than to navigate structurally — which
 * is why a chemical equation gets a text input and a live preview instead of a math field.
 */
export const parseChemistry = (latex: string): { isChemistry: boolean; body: string } => {
  const match = /^\s*\\ce\s*\{([\s\S]*)\}\s*$/.exec(latex);
  return match ? { isChemistry: true, body: match[1] } : { isChemistry: false, body: '' };
};

export const toChemistryLatex = (body: string): string => `\\ce{${body}}`;

/**
 * An arrow is a direction plus a condition you type.
 *
 * A fixed list of arrows cannot scale: the six presets this replaces meant a teacher wanting
 * `->[H2SO4]` or `->[Δ, 450°C]` had to pick the nearest wrong one — the photosynthesis reaction
 * ended up labelled "cat." because "light" was not offered in the right combination. Direction is
 * genuinely a small closed set; the text above the arrow is not, and has to be free.
 */
export type ArrowDirection = '->' | '<=>' | '<-';

export const ARROW_DIRECTIONS: { token: ArrowDirection; label: string }[] = [
  { token: '->', label: 'Yields' },
  { token: '<=>', label: 'Reversible' },
  { token: '<-', label: 'Reverse' },
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
 * Matches an mhchem arrow, longest form first so `->[\\Delta]` is not read as a bare `->` with
 * stray text after it.
 */
const ARROW_PATTERN = /(<=>\[[^\]]*\]|->\[[^\]]*\]|<-\[[^\]]*\]|<=>|->|<-)/;

/**
 * A reaction as an alternating chain: species, arrow, species, arrow, species…
 *
 * The two-sided form this replaces could only say `A -> B`, which is most school chemistry and
 * none of organic: `CH4 -> CH3Cl -> CH2Cl2` needs three species and two arrows. Modelling the chain
 * rather than the special case costs nothing — a single-arrow reaction is just a chain of length
 * two — and the author still never types an arrow.
 *
 * Splitting is lossless: the body is exactly `species[0] + arrows[0] + species[1] + …`, so the form
 * round-trips anything it can parse, including arrows carrying conditions.
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
 * a trailing space was deleted the instant it was pressed, so `2H2 + O2` could only ever be typed
 * as `2H2+O2`. Whitespace therefore stays exactly where it was put — the species carry their own
 * spacing and the arrows are the bare matched token.
 */
export const splitChain = (body: string): IReactionChain => {
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
 * Pure concatenation, and it has to stay that way.
 *
 * An earlier version inserted a separating space around the arrow when one seemed to be missing.
 * That is not idempotent: the next `splitChain` hands the inserted space back as part of the
 * neighbouring species, which then gains another on the following keystroke, so a field being typed
 * into slowly filled with spaces. Whatever spacing the author wants, they type — and it survives,
 * because nothing here rewrites it. "Add step" seeds its own spacing instead.
 */
export const joinChain = ({ species, arrows }: IReactionChain): string =>
  species.map((value, index) => (index < arrows.length ? `${value}${arrows[index]}` : value)).join('');

/** A spoken description of an arrow, for the trigger's accessible name. */
export const arrowLabel = (token: string): string => {
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
  const chemistry = parseChemistry(latex);
  if (!chemistry.isChemistry) return !latex.trim();
  return splitChain(chemistry.body).species.every((value) => !value.trim());
};
