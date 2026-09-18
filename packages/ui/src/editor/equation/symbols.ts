/**
 * One insertable symbol or template in the equation palette.
 *
 * `latex` is what goes into the field. `#?` marks a placeholder box: the caret lands in the first
 * one and Tab moves to the next, which is how a nested expression is typed rather than assembled
 * through a dialog tree.
 */
export interface ISymbol {
  label: string;
  latex: string;
  /** Rendered on the palette tile. Falls back to `latex` with the placeholders drawn as boxes. */
  preview?: string;
  /** Extra words the palette search matches, for the names a teacher actually uses. */
  keywords?: string[];
}

export interface ISymbolGroup {
  name: string;
  items: ISymbol[];
}

/** A symbol with no placeholder: the preview is the symbol itself. */
const symbol = (label: string, latex: string, keywords?: string[]): ISymbol => ({
  label,
  latex,
  preview: latex,
  keywords,
});

/**
 * Grouped by what a teacher is trying to write rather than by LaTeX primitive — a maths teacher
 * reaches for "fraction", not for a control sequence. The groups follow §5.3 of the content editor
 * plan; the chemistry group covers the notation that has no home in a maths field (state symbols,
 * charges, isotopes) and is what `ChemistryEditor` draws its quick inserts from.
 */
export const SYMBOL_GROUPS: ISymbolGroup[] = [
  {
    name: 'Basic',
    items: [
      symbol('Plus or minus', '\\pm', ['plus minus', '+-']),
      symbol('Minus or plus', '\\mp'),
      symbol('Multiply', '\\times', ['times', 'cross']),
      symbol('Dot product', '\\cdot', ['dot']),
      symbol('Divide', '\\div'),
      symbol('Infinity', '\\infty', ['infinite']),
      symbol('Degree', '^{\\circ}', ['degrees']),
      symbol('Percent', '\\%'),
      symbol('Ellipsis', '\\ldots', ['dots']),
      { label: 'Absolute value', latex: '\\left| #? \\right|', preview: '|x|', keywords: ['modulus'] },
    ],
  },
  {
    name: 'Fractions & roots',
    items: [
      { label: 'Fraction', latex: '\\frac{#?}{#?}', preview: '\\frac{a}{b}', keywords: ['divide', 'over'] },
      { label: 'Mixed number', latex: '#?\\frac{#?}{#?}', preview: '2\\frac{1}{2}' },
      { label: 'Square root', latex: '\\sqrt{#?}', preview: '\\sqrt{x}', keywords: ['radical'] },
      { label: 'Cube root', latex: '\\sqrt[3]{#?}', preview: '\\sqrt[3]{x}' },
      { label: 'Nth root', latex: '\\sqrt[#?]{#?}', preview: '\\sqrt[n]{x}' },
    ],
  },
  {
    name: 'Powers & indices',
    items: [
      { label: 'Power', latex: '#?^{#?}', preview: 'x^{2}', keywords: ['superscript', 'exponent', 'squared'] },
      { label: 'Subscript', latex: '#?_{#?}', preview: 'x_{1}', keywords: ['index'] },
      { label: 'Subscript and power', latex: '#?_{#?}^{#?}', preview: 'x_{1}^{2}' },
      { label: 'Exponential', latex: 'e^{#?}', preview: 'e^{x}' },
      { label: 'Logarithm', latex: '\\log_{#?} #?', preview: '\\log_{a} x', keywords: ['log'] },
      { label: 'Natural log', latex: '\\ln #?', preview: '\\ln x' },
      {
        label: 'Scientific notation',
        latex: '#? \\times 10^{#?}',
        preview: '3 \\times 10^{8}',
        keywords: ['standard form'],
      },
    ],
  },
  {
    name: 'Relations & operators',
    items: [
      symbol('Equals', '='),
      symbol('Not equal', '\\neq', ['!=']),
      symbol('Approximately', '\\approx', ['approx']),
      symbol('Equivalent', '\\equiv', ['congruent modulo']),
      symbol('Proportional to', '\\propto'),
      symbol('Less than', '<'),
      symbol('Greater than', '>'),
      symbol('Less or equal', '\\leq', ['<=']),
      symbol('Greater or equal', '\\geq', ['>=']),
      symbol('Much less', '\\ll'),
      symbol('Much greater', '\\gg'),
      symbol('Implies', '\\Rightarrow', ['therefore arrow']),
      symbol('If and only if', '\\Leftrightarrow', ['iff']),
      symbol('Arrow', '\\to', ['->', 'tends to']),
      symbol('Therefore', '\\therefore'),
      symbol('Because', '\\because'),
    ],
  },
  {
    name: 'Brackets',
    items: [
      { label: 'Parentheses', latex: '\\left( #? \\right)', preview: '(x)', keywords: ['round brackets'] },
      { label: 'Square brackets', latex: '\\left[ #? \\right]', preview: '[x]' },
      { label: 'Braces', latex: '\\left\\{ #? \\right\\}', preview: '\\{x\\}', keywords: ['curly'] },
      { label: 'Angle brackets', latex: '\\left\\langle #? \\right\\rangle', preview: '\\langle x \\rangle' },
      { label: 'Floor', latex: '\\left\\lfloor #? \\right\\rfloor', preview: '\\lfloor x \\rfloor' },
      { label: 'Ceiling', latex: '\\left\\lceil #? \\right\\rceil', preview: '\\lceil x \\rceil' },
    ],
  },
  {
    name: 'Greek letters',
    items: [
      symbol('alpha', '\\alpha'),
      symbol('beta', '\\beta'),
      symbol('gamma', '\\gamma'),
      symbol('delta', '\\delta'),
      symbol('epsilon', '\\epsilon'),
      symbol('theta', '\\theta'),
      symbol('lambda', '\\lambda'),
      symbol('mu', '\\mu'),
      symbol('pi', '\\pi'),
      symbol('rho', '\\rho'),
      symbol('sigma', '\\sigma'),
      symbol('tau', '\\tau'),
      symbol('phi', '\\phi'),
      symbol('omega', '\\omega'),
      symbol('Delta', '\\Delta', ['change in']),
      symbol('Sigma', '\\Sigma'),
      symbol('Omega', '\\Omega', ['ohm']),
      symbol('Pi', '\\Pi'),
    ],
  },
  {
    name: 'Trigonometry',
    items: [
      { label: 'sin', latex: '\\sin #?', preview: '\\sin\\theta' },
      { label: 'cos', latex: '\\cos #?', preview: '\\cos\\theta' },
      { label: 'tan', latex: '\\tan #?', preview: '\\tan\\theta' },
      { label: 'cosec', latex: '\\csc #?', preview: '\\csc\\theta', keywords: ['csc'] },
      { label: 'sec', latex: '\\sec #?', preview: '\\sec\\theta' },
      { label: 'cot', latex: '\\cot #?', preview: '\\cot\\theta' },
      { label: 'Inverse sin', latex: '\\sin^{-1} #?', preview: '\\sin^{-1} x', keywords: ['arcsin'] },
      { label: 'Inverse cos', latex: '\\cos^{-1} #?', preview: '\\cos^{-1} x', keywords: ['arccos'] },
      { label: 'Inverse tan', latex: '\\tan^{-1} #?', preview: '\\tan^{-1} x', keywords: ['arctan'] },
    ],
  },
  {
    name: 'Calculus',
    items: [
      { label: 'Limit', latex: '\\lim_{#? \\to #?} #?', preview: '\\lim_{x \\to 0}' },
      { label: 'Sum', latex: '\\sum_{#?}^{#?} #?', preview: '\\sum_{n=1}^{\\infty}', keywords: ['sigma', 'series'] },
      { label: 'Product', latex: '\\prod_{#?}^{#?} #?', preview: '\\prod_{i=1}^{n}' },
      { label: 'Integral', latex: '\\int #? \\, d#?', preview: '\\int f(x) \\, dx' },
      { label: 'Definite integral', latex: '\\int_{#?}^{#?} #? \\, d#?', preview: '\\int_{a}^{b}' },
      { label: 'Derivative', latex: '\\frac{d#?}{d#?}', preview: '\\frac{dy}{dx}' },
      { label: 'Second derivative', latex: '\\frac{d^2 #?}{d#?^2}', preview: '\\frac{d^2 y}{dx^2}' },
      {
        label: 'Partial derivative',
        latex: '\\frac{\\partial #?}{\\partial #?}',
        preview: '\\frac{\\partial f}{\\partial x}',
      },
      { label: 'Prime', latex: "#?'", preview: "f'(x)" },
      symbol('Nabla', '\\nabla', ['gradient', 'del']),
    ],
  },
  {
    name: 'Matrices & determinants',
    items: [
      {
        label: 'Matrix 2×2',
        latex: '\\begin{bmatrix} #? & #? \\\\ #? & #? \\end{bmatrix}',
        preview: '\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}',
      },
      {
        label: 'Matrix 3×3',
        latex: '\\begin{bmatrix} #? & #? & #? \\\\ #? & #? & #? \\\\ #? & #? & #? \\end{bmatrix}',
        preview: '\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix}',
      },
      {
        label: 'Determinant 2×2',
        latex: '\\begin{vmatrix} #? & #? \\\\ #? & #? \\end{vmatrix}',
        preview: '\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}',
      },
      {
        label: 'Determinant 3×3',
        latex: '\\begin{vmatrix} #? & #? & #? \\\\ #? & #? & #? \\\\ #? & #? & #? \\end{vmatrix}',
        preview: '\\begin{vmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{vmatrix}',
      },
      {
        label: 'Column vector',
        latex: '\\begin{pmatrix} #? \\\\ #? \\end{pmatrix}',
        preview: '\\begin{pmatrix} x \\\\ y \\end{pmatrix}',
      },
      {
        label: 'Cases',
        latex: '\\begin{cases} #? & #? \\\\ #? & #? \\end{cases}',
        preview: '\\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}',
        keywords: ['piecewise'],
      },
    ],
  },
  {
    name: 'Vectors',
    items: [
      { label: 'Vector', latex: '\\vec{#?}', preview: '\\vec{v}' },
      { label: 'Unit vector', latex: '\\hat{#?}', preview: '\\hat{n}' },
      { label: 'Bar', latex: '\\bar{#?}', preview: '\\bar{x}', keywords: ['mean', 'overline'] },
      { label: 'Magnitude', latex: '\\left| \\vec{#?} \\right|', preview: '|\\vec{v}|' },
      symbol('Dot product', '\\cdot'),
      symbol('Cross product', '\\times'),
      symbol('Unit i', '\\hat{i}'),
      symbol('Unit j', '\\hat{j}'),
      symbol('Unit k', '\\hat{k}'),
    ],
  },
  {
    name: 'Sets & logic',
    items: [
      symbol('Element of', '\\in', ['belongs to']),
      symbol('Not element of', '\\notin'),
      symbol('Subset', '\\subseteq'),
      symbol('Proper subset', '\\subset'),
      symbol('Union', '\\cup'),
      symbol('Intersection', '\\cap'),
      symbol('Empty set', '\\varnothing', ['null set', 'phi']),
      symbol('For all', '\\forall'),
      symbol('There exists', '\\exists'),
      symbol('Not', '\\neg'),
      symbol('And', '\\land'),
      symbol('Or', '\\lor'),
      symbol('Natural numbers', '\\mathbb{N}'),
      symbol('Integers', '\\mathbb{Z}'),
      symbol('Rationals', '\\mathbb{Q}'),
      symbol('Reals', '\\mathbb{R}'),
      { label: 'Set builder', latex: '\\{ #? \\mid #? \\}', preview: '\\{ x \\mid x > 0 \\}' },
    ],
  },
  {
    name: 'Geometry',
    items: [
      { label: 'Angle', latex: '\\angle #?', preview: '\\angle ABC' },
      { label: 'Triangle', latex: '\\triangle #?', preview: '\\triangle ABC' },
      symbol('Parallel', '\\parallel'),
      symbol('Perpendicular', '\\perp'),
      symbol('Congruent', '\\cong'),
      symbol('Similar', '\\sim'),
      { label: 'Line segment', latex: '\\overline{#?}', preview: '\\overline{AB}' },
      { label: 'Arc', latex: '\\overset{\\frown}{#?}', preview: '\\overset{\\frown}{AB}' },
      symbol('Degree', '^{\\circ}'),
      symbol('Pi', '\\pi'),
    ],
  },
  {
    name: 'Chemistry',
    items: [
      { label: 'Reaction', latex: '\\ce{#? -> #?}', preview: '\\ce{A -> B}', keywords: ['yields', 'arrow'] },
      { label: 'Reversible reaction', latex: '\\ce{#? <=> #?}', preview: '\\ce{A <=> B}', keywords: ['equilibrium'] },
      { label: 'Formula', latex: '\\ce{#?}', preview: '\\ce{H2O}', keywords: ['compound', 'molecule'] },
      { label: 'Ion', latex: '\\ce{#?^{#?}}', preview: '\\ce{SO4^2-}', keywords: ['charge'] },
      { label: 'Isotope', latex: '\\ce{^{#?}_{#?}#?}', preview: '\\ce{^{14}_{6}C}', keywords: ['nuclide'] },
      { label: 'Gas evolved', latex: '\\ce{#? ^}', preview: '\\ce{CO2 ^}' },
      { label: 'Precipitate', latex: '\\ce{#? v}', preview: '\\ce{AgCl v}' },
      { label: 'Heat', latex: '\\Delta', preview: '\\Delta', keywords: ['delta'] },
    ],
  },
  {
    name: 'Units',
    items: [
      { label: 'Unit', latex: '\\,\\mathrm{#?}', preview: '5\\,\\mathrm{kg}' },
      {
        label: 'Per',
        latex: '\\mathrm{#?}\\,\\mathrm{#?}^{-1}',
        preview: '\\mathrm{m}\\,\\mathrm{s}^{-1}',
        keywords: ['rate'],
      },
      symbol('Degrees Celsius', '^{\\circ}\\mathrm{C}', ['temperature']),
      symbol('Micro', '\\mu'),
      symbol('Ohm', '\\Omega'),
      symbol('Angstrom', '\\text{\\AA}'),
    ],
  },
];

/** Every palette symbol, flattened — for search and for recovering a label from its LaTeX. */
export const ALL_SYMBOLS: ISymbol[] = SYMBOL_GROUPS.flatMap((group) => group.items);

/**
 * KaTeX has no notion of MathLive's `#?` tab stops, so a template needs substituting before it can
 * be previewed. `\placeholder{}` renders as an empty box, which is what the author will see once
 * the template is in the field.
 */
export const toPreviewLatex = (item: Pick<ISymbol, 'latex' | 'preview'>): string =>
  item.preview ?? item.latex.replace(/#\?/g, '\\placeholder{}');

/** Case-insensitive match on label, keywords and the LaTeX itself, so `\frac` finds "Fraction". */
export const matchesSymbol = (item: ISymbol, term: string): boolean => {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return [item.label, item.latex, ...(item.keywords ?? [])].some((text) => text.toLowerCase().includes(needle));
};
