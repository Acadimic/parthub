import dynamic from 'next/dynamic';

// Tiptap, ProseMirror and KaTeX load when a form opens, not with the list page that holds the form.
export const RichTextEditor = dynamic(() => import('@repo/ui/editor').then((m) => m.RichTextEditor));
