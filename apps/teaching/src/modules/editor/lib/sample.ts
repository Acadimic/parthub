import type { IDocNode } from './types';

const paragraph = (content: IDocNode[]): IDocNode => ({ type: 'paragraph', content });
const heading = (level: number, value: string): IDocNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text: value }],
});
const text = (value: string): IDocNode => ({ type: 'text', text: value });
const code = (value: string): IDocNode => ({ type: 'text', text: value, marks: [{ type: 'code' }] });
const inlineMath = (latex: string): IDocNode => ({ type: 'inlineMath', attrs: { latex } });
const blockMath = (latex: string): IDocNode => ({ type: 'blockMath', attrs: { latex } });
const bullets = (items: IDocNode[][]): IDocNode => ({
  type: 'bulletList',
  content: items.map((content) => ({ type: 'listItem', content: [paragraph(content)] })),
});

/** A question as it would actually be authored: prose with equations inside it. */
export const QUESTION_DOC: IDocNode = {
  type: 'doc',
  content: [
    heading(1, 'Quadratic equations'),
    paragraph([
      text('Solve for '),
      inlineMath('x'),
      text(' in the equation '),
      inlineMath('x^2 + 5x + 6 = 0'),
      text('. Click any equation to edit it in place.'),
    ]),
    blockMath('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}'),
    paragraph([
      text(
        'The expression below nests a fraction inside a root — the case the previous editor needed a dialog inside a dialog for:',
      ),
    ]),
    blockMath('y = \\sqrt{\\frac{x + 1}{2}} + \\int_{0}^{1} x^2 \\, dx'),
    heading(2, 'Try it'),
    bullets([
      [text('Type '), code('$a^2+b^2$'), text(' to make an inline equation.')],
      [text('Type '), code('$$'), text(' then a space for a display equation.')],
      [
        text('Inside a field, type '),
        code('1/2'),
        text(', '),
        code('sqrt'),
        text(' or '),
        code('pi'),
        text(' and watch it become notation.'),
      ],
      [text('Press Tab to move between the empty boxes in a template.')],
      [
        text('Nest them: type '),
        code('sqrt'),
        text(' then '),
        code('1/2'),
        text(
          ' to get a fraction inside a root. Templates nest too — insert a fraction, then a root into its numerator.',
        ),
      ],
    ]),
  ],
};

/**
 * The expressions most likely to break something: deep nesting, matrices, a long expression that
 * must scroll rather than widen the page, and stacked limits. If KaTeX rejects anything the old
 * MathJax accepted, it shows up here first.
 */
export const STRESS_DOC: IDocNode = {
  type: 'doc',
  content: [
    heading(1, 'Rendering stress test'),
    paragraph([
      text(
        'Every equation below should render, and the wide one should scroll inside its own box rather than widening the page.',
      ),
    ]),
    heading(2, 'Nesting'),
    blockMath('\\sqrt{\\frac{1 + \\sqrt{\\frac{1 + \\sqrt{x}}{2}}}{3}}'),
    heading(2, 'Matrices and determinants'),
    blockMath(
      '\\begin{bmatrix} a & b & c \\\\ d & e & f \\\\ g & h & i \\end{bmatrix} \\times \\begin{vmatrix} 1 & 2 \\\\ 3 & 4 \\end{vmatrix}',
    ),
    heading(2, 'Calculus'),
    blockMath('\\lim_{n \\to \\infty} \\sum_{k=1}^{n} \\frac{1}{k^2} = \\frac{\\pi^2}{6}'),
    blockMath('\\frac{\\partial^2 u}{\\partial t^2} = c^2 \\frac{\\partial^2 u}{\\partial x^2}'),
    heading(2, 'Wide expression'),
    blockMath(
      'f(x) = a_0 + a_1x + a_2x^2 + a_3x^3 + a_4x^4 + a_5x^5 + a_6x^6 + a_7x^7 + a_8x^8 + a_9x^9 + a_{10}x^{10} + \\cdots + a_nx^n',
    ),
    heading(2, 'Arrays with rules'),
    blockMath('\\begin{array}{|c|c|} \\hline x & f(x) \\\\ \\hline 1 & 1 \\\\ 2 & 4 \\\\ \\hline \\end{array}'),
    heading(2, 'Cases'),
    blockMath('|x| = \\begin{cases} x & \\text{if } x \\geq 0 \\\\ -x & \\text{if } x < 0 \\end{cases}'),
  ],
};

/**
 * The script-coverage check. KaTeX ships its own fonts, which contain no Devanagari, Bengali,
 * Tamil or Arabic glyphs — so text *inside* `\text{}` is where tofu boxes appear if the font
 * fallback is wrong. Text outside an equation uses the app's own font stack and is fine; the two
 * cases are deliberately side by side here so the difference is visible.
 */
export const MULTILINGUAL_DOC: IDocNode = {
  type: 'doc',
  content: [
    heading(1, 'Multilingual content'),
    heading(2, 'हिन्दी'),
    paragraph([text('यदि '), inlineMath('x = 5'), text(' है, तो '), inlineMath('x + 10'), text(' का मान क्या होगा?')]),
    paragraph([text('निम्नलिखित समीकरण को हल कीजिए:')]),
    blockMath('x^2 + 5x + 6 = 0'),
    heading(2, 'संस्कृतम्'),
    paragraph([text('यदि '), inlineMath('x = 5'), text(', तर्हि '), inlineMath('x + 10'), text(' इत्यस्य मानं किम्?')]),
    heading(2, 'தமிழ்'),
    paragraph([inlineMath('x = 5'), text(' எனில், '), inlineMath('x + 10'), text(' இன் மதிப்பு என்ன?')]),
    heading(2, 'العربية'),
    paragraph([text('إذا كان '), inlineMath('x = 5'), text('، فما قيمة '), inlineMath('x + 10'), text('؟')]),
    heading(2, 'Devanagari inside an equation'),
    paragraph([
      text('This is the case that fails without a font fallback — the label is inside '),
      code('\\text{}'),
      text(', so it renders in a KaTeX font that has no Devanagari glyphs:'),
    ]),
    blockMath('\\text{क्षेत्रफल} = \\pi r^2'),
  ],
};

/** mhchem, which replaces the 317 hand-built lines of chemical-equation tables in the old editor. */
export const CHEMISTRY_DOC: IDocNode = {
  type: 'doc',
  content: [
    heading(1, 'Chemical equations'),
    paragraph([text('All of these come from mhchem, loaded as a KaTeX extension. No bespoke table markup.')]),
    heading(2, 'Decomposition'),
    blockMath('\\ce{CaCO3 ->[\\Delta] CaO + CO2(g)}'),
    heading(2, 'Reversible'),
    blockMath('\\ce{N2 + 3H2 <=> 2NH3}'),
    heading(2, 'Combustion'),
    blockMath('\\ce{CH4 + 2O2 -> CO2 + 2H2O}'),
    heading(2, 'Photosynthesis'),
    blockMath('\\ce{6CO2 + 6H2O ->[light] C6H12O6 + 6O2}'),
    heading(2, 'Ions and isotopes'),
    paragraph([
      text('Sulfate is '),
      inlineMath('\\ce{SO4^2-}'),
      text(' and carbon-14 is '),
      inlineMath('\\ce{^{14}_{6}C}'),
      text('.'),
    ]),
  ],
};

export const EMPTY_DOC: IDocNode = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export interface IPreset {
  key: string;
  label: string;
  description: string;
  doc: IDocNode;
}

/** What the demo page offers. Each one targets a different question the spike has to answer. */
export const PRESETS: IPreset[] = [
  {
    key: 'question',
    label: 'Question',
    description: 'Prose with equations inside it — the everyday case.',
    doc: QUESTION_DOC,
  },
  {
    key: 'stress',
    label: 'Stress test',
    description: 'Deep nesting, matrices, arrays and a very wide expression.',
    doc: STRESS_DOC,
  },
  {
    key: 'multilingual',
    label: 'Multilingual',
    description: 'Hindi, Sanskrit, Tamil, Arabic — and Devanagari inside \\text{}.',
    doc: MULTILINGUAL_DOC,
  },
  {
    key: 'chemistry',
    label: 'Chemistry',
    description: 'mhchem notation through the same pipeline.',
    doc: CHEMISTRY_DOC,
  },
  { key: 'empty', label: 'Blank', description: 'Start from nothing and author your own.', doc: EMPTY_DOC },
];

/** Kept as the default so the page opens with something to look at. */
export const SAMPLE_DOC = QUESTION_DOC;
