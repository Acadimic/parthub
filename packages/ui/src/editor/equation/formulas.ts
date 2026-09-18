/** A complete, named formula inserted whole and then edited in place. */
export interface IFormula {
  label: string;
  latex: string;
  /** The subject it is filed under in the gallery. */
  subject: FormulaSubject;
  /** Extra words the gallery search matches. */
  keywords?: string[];
}

export type FormulaSubject = 'Mathematics' | 'Physics' | 'Chemistry';

export const FORMULA_SUBJECTS: FormulaSubject[] = ['Mathematics', 'Physics', 'Chemistry'];

/**
 * The formula gallery.
 *
 * Separate from the symbol palette on purpose: a teacher thinks "I need the quadratic formula", not
 * "I need a fraction containing a plus-minus and a square root". Hard-coded for now; the plan has
 * it becoming data seeded per standard and subject from `apps/support`, at which point this list
 * is the seed and `IFormula` is the row shape.
 */
export const FORMULAS: IFormula[] = [
  // Mathematics
  {
    label: 'Quadratic formula',
    latex: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    subject: 'Mathematics',
    keywords: ['roots'],
  },
  {
    label: "Pythagoras' theorem",
    latex: 'a^2 + b^2 = c^2',
    subject: 'Mathematics',
    keywords: ['right triangle', 'hypotenuse'],
  },
  { label: 'Area of a circle', latex: 'A = \\pi r^2', subject: 'Mathematics' },
  { label: 'Circumference of a circle', latex: 'C = 2 \\pi r', subject: 'Mathematics', keywords: ['perimeter'] },
  { label: 'Area of a triangle', latex: 'A = \\frac{1}{2} b h', subject: 'Mathematics' },
  {
    label: "Heron's formula",
    latex: 'A = \\sqrt{s(s-a)(s-b)(s-c)}',
    subject: 'Mathematics',
    keywords: ['triangle area'],
  },
  { label: 'Volume of a sphere', latex: 'V = \\frac{4}{3} \\pi r^3', subject: 'Mathematics' },
  { label: 'Volume of a cylinder', latex: 'V = \\pi r^2 h', subject: 'Mathematics' },
  {
    label: 'Slope of a line',
    latex: 'm = \\frac{y_2 - y_1}{x_2 - x_1}',
    subject: 'Mathematics',
    keywords: ['gradient'],
  },
  { label: 'Distance formula', latex: 'd = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}', subject: 'Mathematics' },
  {
    label: 'Midpoint',
    latex: 'M = \\left( \\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2} \\right)',
    subject: 'Mathematics',
  },
  {
    label: 'nth term of an AP',
    latex: 'a_n = a + (n - 1)d',
    subject: 'Mathematics',
    keywords: ['arithmetic progression'],
  },
  {
    label: 'Sum of an AP',
    latex: 'S_n = \\frac{n}{2}\\left[2a + (n-1)d\\right]',
    subject: 'Mathematics',
    keywords: ['arithmetic series'],
  },
  { label: 'nth term of a GP', latex: 'a_n = a r^{n-1}', subject: 'Mathematics', keywords: ['geometric progression'] },
  {
    label: 'Sum of a GP',
    latex: 'S_n = \\frac{a(r^n - 1)}{r - 1}',
    subject: 'Mathematics',
    keywords: ['geometric series'],
  },
  {
    label: 'Binomial expansion',
    latex: '(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^{k}',
    subject: 'Mathematics',
  },
  {
    label: 'Trigonometric identity',
    latex: '\\sin^2\\theta + \\cos^2\\theta = 1',
    subject: 'Mathematics',
    keywords: ['pythagorean identity'],
  },
  { label: 'Compound interest', latex: 'A = P\\left(1 + \\frac{r}{100}\\right)^{n}', subject: 'Mathematics' },
  { label: 'Simple interest', latex: 'SI = \\frac{P \\times R \\times T}{100}', subject: 'Mathematics' },
  {
    label: 'Derivative of a power',
    latex: '\\frac{d}{dx} x^n = n x^{n-1}',
    subject: 'Mathematics',
    keywords: ['power rule'],
  },
  { label: 'Integral of a power', latex: '\\int x^n \\, dx = \\frac{x^{n+1}}{n+1} + C', subject: 'Mathematics' },
  // Physics
  { label: 'Equation of motion (velocity)', latex: 'v = u + at', subject: 'Physics', keywords: ['kinematics'] },
  {
    label: 'Equation of motion (displacement)',
    latex: 's = ut + \\frac{1}{2} a t^2',
    subject: 'Physics',
    keywords: ['kinematics'],
  },
  {
    label: 'Equation of motion (velocity squared)',
    latex: 'v^2 = u^2 + 2as',
    subject: 'Physics',
    keywords: ['kinematics'],
  },
  { label: "Newton's second law", latex: 'F = ma', subject: 'Physics', keywords: ['force'] },
  { label: 'Weight', latex: 'W = mg', subject: 'Physics' },
  { label: 'Kinetic energy', latex: 'KE = \\frac{1}{2} m v^2', subject: 'Physics' },
  { label: 'Potential energy', latex: 'PE = mgh', subject: 'Physics' },
  { label: 'Work done', latex: 'W = F d \\cos\\theta', subject: 'Physics' },
  { label: 'Power', latex: 'P = \\frac{W}{t}', subject: 'Physics' },
  { label: 'Density', latex: '\\rho = \\frac{m}{V}', subject: 'Physics' },
  { label: 'Pressure', latex: 'P = \\frac{F}{A}', subject: 'Physics' },
  { label: "Ohm's law", latex: 'V = IR', subject: 'Physics', keywords: ['resistance', 'current'] },
  { label: 'Electrical power', latex: 'P = VI', subject: 'Physics' },
  { label: "Coulomb's law", latex: 'F = k \\frac{q_1 q_2}{r^2}', subject: 'Physics', keywords: ['electrostatic'] },
  { label: 'Universal gravitation', latex: 'F = G \\frac{m_1 m_2}{r^2}', subject: 'Physics', keywords: ['gravity'] },
  { label: 'Wave speed', latex: 'v = f \\lambda', subject: 'Physics', keywords: ['frequency', 'wavelength'] },
  { label: 'Mass–energy equivalence', latex: 'E = mc^2', subject: 'Physics' },
  {
    label: 'Lens formula',
    latex: '\\frac{1}{f} = \\frac{1}{v} - \\frac{1}{u}',
    subject: 'Physics',
    keywords: ['optics'],
  },
  // Chemistry
  { label: 'Ideal gas law', latex: 'PV = nRT', subject: 'Chemistry' },
  { label: 'Moles from mass', latex: 'n = \\frac{m}{M}', subject: 'Chemistry', keywords: ['molar mass'] },
  { label: 'Molarity', latex: 'M = \\frac{n}{V}', subject: 'Chemistry', keywords: ['concentration'] },
  { label: 'pH', latex: '\\mathrm{pH} = -\\log_{10}[\\mathrm{H^+}]', subject: 'Chemistry', keywords: ['acid'] },
  { label: 'Photosynthesis', latex: '\\ce{6CO2 + 6H2O ->[light] C6H12O6 + 6O2}', subject: 'Chemistry' },
  {
    label: 'Combustion of methane',
    latex: '\\ce{CH4 + 2O2 -> CO2 + 2H2O}',
    subject: 'Chemistry',
    keywords: ['burning'],
  },
  { label: 'Neutralisation', latex: '\\ce{HCl + NaOH -> NaCl + H2O}', subject: 'Chemistry', keywords: ['acid base'] },
  {
    label: 'Haber process',
    latex: '\\ce{N2 + 3H2 <=>[Fe][450 ^\\circ C] 2NH3}',
    subject: 'Chemistry',
    keywords: ['ammonia'],
  },
  {
    label: 'Thermal decomposition',
    latex: '\\ce{CaCO3 ->[\\Delta] CaO + CO2 ^}',
    subject: 'Chemistry',
    keywords: ['limestone'],
  },
  { label: 'Electrolysis of water', latex: '\\ce{2H2O ->[electricity] 2H2 ^ + O2 ^}', subject: 'Chemistry' },
  {
    label: 'Rusting',
    latex: '\\ce{4Fe + 3O2 + 6H2O -> 4Fe(OH)3}',
    subject: 'Chemistry',
    keywords: ['corrosion', 'iron'],
  },
];

/** Formulas matching a search term, or all of them for an empty term. Matches label, subject, keywords and LaTeX. */
export const searchFormulas = (term: string, formulas: IFormula[] = FORMULAS): IFormula[] => {
  const needle = term.trim().toLowerCase();
  if (!needle) return formulas;
  return formulas.filter((formula) =>
    [formula.label, formula.subject, formula.latex, ...(formula.keywords ?? [])].some((text) =>
      text.toLowerCase().includes(needle),
    ),
  );
};
