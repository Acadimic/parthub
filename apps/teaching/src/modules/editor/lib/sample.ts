import type { IRichTextDoc, IRichTextNode } from '@repo/shared/interfaces';
import { richTextFromMarkdown } from '@repo/shared/utils';
import { APTITUDE_DOC, SCENES_DOC } from './scene-samples';

const paragraph = (content: IRichTextNode[]): IRichTextNode => ({ type: 'paragraph', content });
const heading = (level: number, value: string): IRichTextNode => ({
  type: 'heading',
  attrs: { level },
  content: [{ type: 'text', text: value }],
});
const text = (value: string): IRichTextNode => ({ type: 'text', text: value });
const code = (value: string): IRichTextNode => ({ type: 'text', text: value, marks: [{ type: 'code' }] });
const inlineMath = (latex: string): IRichTextNode => ({ type: 'inlineMath', attrs: { latex } });
const blockMath = (latex: string): IRichTextNode => ({ type: 'blockMath', attrs: { latex } });
/** An equation with a 3D graph: the LaTeX that is read, and the expression that is plotted. */
const graphMath = (
  type: 'inlineMath' | 'blockMath',
  latex: string,
  graph: string,
  graphView: string | null,
): IRichTextNode => ({
  type,
  attrs: { latex, graph, graphView },
});
const bullets = (items: IRichTextNode[][]): IRichTextNode => ({
  type: 'bulletList',
  content: items.map((content) => ({ type: 'listItem', content: [paragraph(content)] })),
});

/** A question as it would actually be authored: prose with equations inside it. */
export const QUESTION_DOC: IRichTextDoc = {
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
export const STRESS_DOC: IRichTextDoc = {
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
export const MULTILINGUAL_DOC: IRichTextDoc = {
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
export const CHEMISTRY_DOC: IRichTextDoc = {
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

/** A language lesson as the AI writes it, through the same Markdown import a generated course uses. */
export const PRONUNCIATION_DOC: IRichTextDoc = richTextFromMarkdown(
  [
    '## Greetings',
    'Click the dotted words to see how they are said, or the speaker to hear them. Select a word in the editor and press Ctrl/⌘ + Alt + P to mark it.',
    '| Spanish | English |',
    '| --- | --- |',
    '| [Hola]{lang=es-ES ipa=ˈola} | Hello |',
    '| [Buenos días]{lang=es-ES ipa="ˈbwenos ˈdias"} | Good morning |',
    '| [¿Cómo estás?]{lang=es-ES ipa="ˈkomo esˈtas"} | How are you? |',
    'In Sanskrit, [नमस्ते]{lang=sa translit=namaste ipa=nɐmɐsteː} is said with folded hands, and in Hindi [धन्यवाद]{lang=hi-IN translit=dhanyavād} means thank you.',
    '::: listening lang=es-ES mode=dialogue',
    '**Ana:** Hola, Luis. ¿Cómo estás?',
    '',
    '**Luis:** Muy bien, gracias. ¿Y tú?',
    '',
    '**Ana:** Bien también. ¡Hasta luego!',
    ':::',
    '::: listening lang=es-ES mode=passage',
    'Madrid es la capital de España. Es una ciudad grande y muy bonita.',
    '',
    'Muchas personas visitan el Museo del Prado cada año.',
    ':::',
  ].join('\n'),
).doc;

export const EMPTY_DOC: IRichTextDoc = {
  type: 'doc',
  content: [{ type: 'paragraph' }],
};

export interface IPreset {
  key: string;
  label: string;
  description: string;
  doc: IRichTextDoc;
}

/** What the demo page offers. Each one targets a different question the spike has to answer. */
/** Equations that carry 3D graphs: surfaces, sliders, curves, inline and in answer options. */
export const GRAPHS_DOC: IRichTextDoc = {
  type: 'doc',
  content: [
    heading(1, '3D graphs of equations'),
    paragraph([
      text('An equation with a cube beside it opens as a 3D graph. A ripple spreads out from the origin and fades: '),
      graphMath(
        'inlineMath',
        'z = \\cos\\left(a\\sqrt{x^2+y^2}\\right) e^{-(x^2+y^2)/10}',
        'cos(a*sqrt(x^2+y^2)) * exp(-(x^2+y^2)/10)',
        'a=1.5[0.5..4]',
      ),
      text('. Drag the slider for '),
      inlineMath('a'),
      text(' to tighten the rings.'),
    ]),
    heading(2, 'Surfaces'),
    paragraph([
      text('A saddle: curving up along one axis and down along the other. Its steepness is '),
      inlineMath('a'),
      text('.'),
    ]),
    graphMath('blockMath', 'z = a\\left(x^2 - y^2\\right)', 'a*(x^2 - y^2)', 'x=-2..2 y=-2..2'),
    paragraph([
      text('Two sliders: '),
      inlineMath('a'),
      text(' sets the height of the waves and '),
      inlineMath('b'),
      text(' how many there are.'),
    ]),
    graphMath('blockMath', 'z = a \\sin(b x) \\cos(y)', 'a*sin(b*x)*cos(y)', null),
    paragraph([
      text('A dome: it is defined only inside a circle of radius 3, and outside it there is nothing to draw.'),
    ]),
    graphMath('blockMath', 'z = \\sqrt{9 - x^2 - y^2}', 'sqrt(9 - x^2 - y^2)', null),
    heading(2, 'Curves'),
    paragraph([text('A helix climbs as it turns; '), inlineMath('a'), text(' sets how fast it rises.')]),
    graphMath(
      'blockMath',
      '\\vec r(t) = \\left(\\cos t,\\ \\sin t,\\ \\frac{a t}{4}\\right)',
      '(cos(t), sin(t), a*t/4)',
      't=0..18.85',
    ),
    paragraph([text('A trefoil knot, coloured from start to end:')]),
    graphMath(
      'blockMath',
      '\\vec r(t) = \\left(\\sin t + 2\\sin 2t,\\ \\cos t - 2\\cos 2t,\\ -\\sin 3t\\right)',
      '(sin(t) + 2sin(2t), cos(t) - 2cos(2t), -sin(3t))',
      null,
    ),
    heading(2, 'Solids and closed surfaces'),
    paragraph([text('A shape given by two parameters u and v is drawn true to scale. A sphere of radius 3:')]),
    graphMath('blockMath', 'x^2 + y^2 + z^2 = 9', '(3*cos(u)*sin(v),3*sin(u)*sin(v),3*cos(v))', 'v=0..pi'),
    paragraph([text('A cone of base radius 3; the slider '), inlineMath('a'), text(' sets its height to 4a.')]),
    graphMath(
      'blockMath',
      '\\vec r(u, v) = \\left(3(1-v)\\cos u,\\ 3(1-v)\\sin u,\\ 4av\\right)',
      '(3*(1-v)*cos(u),3*(1-v)*sin(u),4*a*v)',
      'v=0..1 a=1[0.25..2]',
    ),
    paragraph([text('A torus; the slider '), inlineMath('a'), text(' is the radius of its tube.')]),
    graphMath(
      'blockMath',
      '\\vec r(u, v) = \\left((2 + a\\cos v)\\cos u,\\ (2 + a\\cos v)\\sin u,\\ a\\sin v\\right)',
      '((2+a*cos(v))*cos(u),(2+a*cos(v))*sin(u),a*sin(v))',
      'a=1[0.2..1.8]',
    ),
    paragraph([text('The shape of a 2p orbital: two lobes along the z-axis, coloured by height.')]),
    graphMath(
      'blockMath',
      'r = |\\cos\\theta|',
      '(abs(cos(v))*sin(v)*cos(u),abs(cos(v))*sin(v)*sin(u),abs(cos(v))*cos(v))',
      'v=0..pi',
    ),
    paragraph([text('A helicoid — the ribbon a DNA ladder twists into, its edges the two strands:')]),
    graphMath(
      'blockMath',
      '\\vec r(u, v) = \\left(v\\cos u,\\ v\\sin u,\\ u/2\\right)',
      '(v*cos(u),v*sin(u),u/2)',
      'u=0..12.57 v=-1..1',
    ),
    heading(2, 'In a question'),
    paragraph([text('Which surface has a single highest point at the origin?')]),
    bullets([
      [text('(A) '), graphMath('inlineMath', 'z = x^2 + y^2', 'x^2 + y^2', 'x=-2..2 y=-2..2')],
      [text('(B) '), graphMath('inlineMath', 'z = 4 - x^2 - y^2', '4 - x^2 - y^2', 'x=-2..2 y=-2..2')],
      [text('(C) '), graphMath('inlineMath', 'z = x^2 - y^2', 'x^2 - y^2', 'x=-2..2 y=-2..2')],
    ]),
    heading(2, 'Add one yourself'),
    paragraph([
      text(
        'This equation has no graph yet. Click it, press the cube in its header, and the expression fills in from the equation: ',
      ),
    ]),
    blockMath('z = \\frac{x y}{x^2 + y^2 + 1}'),
  ],
};

export const PRESETS: IPreset[] = [
  {
    key: 'question',
    label: 'Question',
    description: 'Prose with equations inside it — the everyday case.',
    doc: QUESTION_DOC,
  },
  {
    key: 'graphs',
    label: '3D graphs',
    description: 'Equations that open as 3D graphs: surfaces with sliders, curves, and answer options.',
    doc: GRAPHS_DOC,
  },
  {
    key: 'scenes',
    label: '3D scenes',
    description: 'Solids, planes, vectors and angles that open in 3D, with sliders.',
    doc: SCENES_DOC,
  },
  {
    key: 'aptitude',
    label: 'Aptitude',
    description: 'Cube nets, dice and painted cubes: a picture with each question, and a solution that works it out.',
    doc: APTITUDE_DOC,
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
  {
    key: 'pronunciation',
    label: 'Pronunciation',
    description: 'Spanish vocabulary, Sanskrit and Hindi words, a dialogue and a listening passage.',
    doc: PRONUNCIATION_DOC,
  },
  { key: 'empty', label: 'Blank', description: 'Start from nothing and author your own.', doc: EMPTY_DOC },
];

/** Kept as the default so the page opens with something to look at. */
export const SAMPLE_DOC = QUESTION_DOC;
