import { Placeholder } from '@tiptap/extensions';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { RichTextFormat } from '@repo/shared/enums';
import type { IRichText, IRichTextDoc } from '@repo/shared/interfaces';
import { docToPlainText } from '@repo/shared/utils';
import { Label } from '../core/Label';
import { cn } from '../lib/cn';
import { MathExtensions } from './extensions/math-nodes';
import { EditorToolbar } from './toolbar/EditorToolbar';

export interface IRichTextEditorProps {
  /** The stored value. Only its `doc` is loaded — the editor owns the projection. */
  value?: IRichText | null;
  /**
   * Fires with a complete `IRichText`, not a bare document.
   *
   * The plain-text projection is computed here rather than by each caller: it has to stay in step
   * with `doc` on every keystroke, and four call sites each remembering to recompute it is four
   * places for search and list previews to go stale.
   */
  onChange: (value: IRichText) => void;
  /** Field label, asterisk and error text — the same contract every input wrapper here uses. */
  label?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  /** Shown in an empty document. */
  placeholder?: string;
  className?: string;
  /** Classes for the editor frame; `className` styles the wrapper around it. */
  editorClassName?: string;
}

const DEFAULT_PLACEHOLDER = 'Start writing. Ctrl/⌘ + E adds an equation, or type $x^2$';

/**
 * The document typography, applied to the ProseMirror content area. The reading view
 * (`RichTextView`) renders the same node types with the same classes, so what an author edits is
 * what a reader sees.
 */
const DOCUMENT_CLASS = [
  'prose-editor max-w-none min-h-full px-4 py-3 text-[0.95rem] leading-7 focus:outline-none',
  '[&_p]:my-3',
  '[&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3',
  '[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2.5',
  '[&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground',
  '[&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto',
  '[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em]',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
  '[&_hr]:my-6 [&_hr]:border-border',
  // The placeholder is Tiptap's `data-placeholder` on the first empty paragraph, drawn as a
  // floated pseudo-element so it takes no space and the caret sits on top of it.
  '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)] [&_p.is-editor-empty:first-child]:before:float-left [&_p.is-editor-empty:first-child]:before:h-0 [&_p.is-editor-empty:first-child]:before:pointer-events-none [&_p.is-editor-empty:first-child]:before:text-muted-foreground',
].join(' ');

/**
 * The authoring editor: a Tiptap document with equations as first-class atomic nodes.
 *
 * Keyboard shortcuts, input rules and paste rules for equations live on the math extensions, not
 * here, so a second host of the same extensions gets the same behaviour. This component owns the
 * frame, the toolbar, the placeholder and the projection.
 */
export const RichTextEditor = ({
  value,
  onChange,
  label,
  required,
  error,
  helperText,
  placeholder = DEFAULT_PLACEHOLDER,
  className,
  editorClassName,
}: IRichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Levels 1–3 only. A document that can nest six deep is a document nobody navigates, and
        // the Markdown mapping has to cover every level we admit.
        heading: { levels: [1, 2, 3] },
        // A pasted URL becomes a link, but a typed one is left alone until the author means it.
        link: { openOnClick: false, autolink: true, linkOnPaste: true },
      }),
      Placeholder.configure({ placeholder }),
      ...MathExtensions,
    ],
    content: value?.doc ?? null,
    // Required under the Pages Router: Tiptap renders to the DOM, so letting it render during SSR
    // produces markup React then disagrees with on hydration.
    immediatelyRender: false,
    editorProps: { attributes: { class: DOCUMENT_CLASS } },
    onUpdate: ({ editor: instance }) => {
      const doc = instance.getJSON() as IRichTextDoc;
      onChange({ format: RichTextFormat.DOC_V1, doc, text: docToPlainText(doc) });
    },
  });

  /**
   * The editor owns its scrolling so the toolbar can stay put: the toolbar is a fixed-height row
   * and only the content scrolls beneath it, which also keeps the toolbar opaque rather than
   * relying on a sticky element floating over text.
   */
  return (
    <div className={cn('flex min-h-0 flex-col', className)}>
      {label ? <Label label={label} required={required} /> : null}
      <div
        className={cn(
          // A default height, overridable per caller through `editorClassName`.
          'flex min-h-0 flex-1 flex-col border bg-background',
          'min-h-[9rem]',
          error ? 'border-destructive' : 'border-border',
          editorClassName,
        )}
      >
        <div className="shrink-0">
          <EditorToolbar editor={editor} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
      {helperText ? (
        <p className={cn('mt-1 text-xs', error ? 'text-destructive' : 'text-muted-foreground')}>{helperText}</p>
      ) : null}
    </div>
  );
};
