// The read-only half of authored content: what a student downloads. KaTeX only — no ProseMirror,
// no MathLive. The authoring half is `@repo/ui/editor`, which imports from here and never the
// reverse.
export { MathRender, renderLatex } from './MathRender';
export type { IMathRenderProps } from './MathRender';
export { RichTextView } from './RichTextView';
export type { IRichTextViewProps } from './RichTextView';
