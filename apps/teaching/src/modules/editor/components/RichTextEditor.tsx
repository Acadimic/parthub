import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import { BlockMath, InlineMath } from '../extensions/math';
import type { IDocNode } from '../lib/types';
import { EditorToolbar } from './EditorToolbar';

interface IProps {
  initialContent?: IDocNode;
  onChange: (doc: IDocNode) => void;
}

export const RichTextEditor = ({ initialContent, onChange }: IProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Levels 1–3 only. A document that can nest six deep is a document nobody navigates, and
        // the Markdown mapping has to cover every level we admit.
        heading: { levels: [1, 2, 3] },
      }),
      InlineMath,
      BlockMath,
    ],
    content: initialContent,
    // Required under the Pages Router: Tiptap renders to the DOM, so letting it render during SSR
    // produces markup React then disagrees with on hydration.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose-editor max-w-none min-h-[22rem] px-4 py-3 text-[0.95rem] leading-7 focus:outline-none [&_p]:my-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_pre]:bg-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre]:overflow-x-auto [&_hr]:my-6 [&_hr]:border-border',
      },
    },
    onUpdate: ({ editor: instance }) => onChange(instance.getJSON() as IDocNode),
  });

  // Keyboard shortcuts for the two equation nodes. Registered here rather than in the extensions so
  // both live in one place while the bindings are still being chosen.
  useEffect(() => {
    if (!editor) return undefined;
    const handler = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'e') return;
      event.preventDefault();
      if (event.shiftKey) editor.chain().focus().insertBlockMath().run();
      else editor.chain().focus().insertInlineMath().run();
    };
    const dom = editor.view.dom;
    dom.addEventListener('keydown', handler);
    return () => dom.removeEventListener('keydown', handler);
  }, [editor]);

  /**
   * The editor owns its scrolling so the toolbar can stay put.
   *
   * With the surrounding card as the scroller, toolbar and document scrolled together and the
   * controls left the screen as soon as the author moved down the page — exactly when a long
   * document most needs them. Here the toolbar is a fixed-height row and only the content scrolls
   * beneath it, which also keeps the toolbar opaque rather than relying on a sticky element
   * floating over text.
   */
  return (
    <div className="flex h-full min-h-0 flex-col border border-border bg-background">
      <div className="shrink-0">
        <EditorToolbar editor={editor} />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};
