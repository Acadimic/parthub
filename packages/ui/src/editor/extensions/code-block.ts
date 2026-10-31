import CodeBlock from '@tiptap/extension-code-block';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { CodeBlockNodeView } from './CodeBlockNodeView';

/**
 * StarterKit's code block with a language picker above it. The node name and its `language`
 * attribute are unchanged, so stored documents and the Markdown mapping read it as before.
 */
export const CodeBlockWithLanguage = CodeBlock.extend({
  addNodeView: () => ReactNodeViewRenderer(CodeBlockNodeView),
});
