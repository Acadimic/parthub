// The authoring half of authored content. Heavy — Tiptap and MathLive — so the apps reach it
// through `next/dynamic` where a screen can be read without it; the reading view is
// `@repo/ui/content` and depends on KaTeX alone.
export { RichTextEditor } from './RichTextEditor';
export type { IRichTextEditorProps } from './RichTextEditor';

export { toRichText, collectEquations } from './document';
export { docToMarkdown } from './markdown/doc-to-markdown';

export { InlineMath, BlockMath, MathExtensions } from './extensions/math-nodes';
export { INLINE_MATH_NAME, BLOCK_MATH_NAME } from './extensions/math-names';
export { ImageBlock, IMAGE_NAME, IMAGE_ACCEPT } from './extensions/image';
export type { IImageAttrs, IImageOptions } from './extensions/image';
export { BorderedTable, FlatTableCell, FlatTableHeader, TableExtensions, TABLE_NAME } from './extensions/table';
export type { ITableInsertOptions } from './extensions/table';

export { EquationEditor } from './equation/EquationEditor';
export type { IEquationEditorProps } from './equation/EquationEditor';
export { ChemistryEditor } from './equation/ChemistryEditor';
export type { IChemistryEditorProps } from './equation/ChemistryEditor';

export { SYMBOL_GROUPS, ALL_SYMBOLS, toPreviewLatex, matchesSymbol } from './equation/symbols';
export type { ISymbol, ISymbolGroup } from './equation/symbols';
export { FORMULAS, FORMULA_SUBJECTS, searchFormulas } from './equation/formulas';
export type { IFormula, FormulaSubject } from './equation/formulas';
export {
  parseChemicalEquation,
  toChemicalEquationLatex,
  isBlankEquation,
  splitReaction,
  joinReaction,
  parseArrow,
  buildArrow,
  describeArrow,
  ARROW_DIRECTIONS,
  ARROW_CONDITIONS,
  CHEMISTRY_INSERTS,
  EMPTY_REACTION_LATEX,
} from './equation/chemistry';
export type { IChemicalEquation, IReactionChain, IArrow, ArrowDirection, IChemistryInsert } from './equation/chemistry';
