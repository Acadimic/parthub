// // components/TiptapEditor.tsx
// // 'use client';

// import Color from '@tiptap/extension-color';
// import Link from '@tiptap/extension-link';
// import TextStyle from '@tiptap/extension-text-style';
// import Underline from '@tiptap/extension-underline';
// import { EditorContent, useEditor } from '@tiptap/react';
// import StarterKit from '@tiptap/starter-kit';
// import { useEffect } from 'react';
// // import lowlight from 'lowlight';

// // import './editor.css'; // Create and style this as needed

// const MenuBar = ({ editor }: { editor: any }) => {
//   if (!editor) return null;

//   return (
//     <div className="flex flex-wrap gap-2 mb-4">
//       <button
//         onClick={() => editor.chain().focus().toggleBold().run()}
//         className={editor.isActive('bold') ? 'active' : ''}
//       >
//         Bold
//       </button>
//       <button
//         onClick={() => editor.chain().focus().toggleItalic().run()}
//         className={editor.isActive('italic') ? 'active' : ''}
//       >
//         Italic
//       </button>
//       <button
//         onClick={() => editor.chain().focus().toggleUnderline().run()}
//         className={editor.isActive('underline') ? 'active' : ''}
//       >
//         Underline
//       </button>
//       <button onClick={() => editor.chain().focus().toggleBulletList().run()}>Bullet List</button>
//       <button onClick={() => editor.chain().focus().toggleOrderedList().run()}>Ordered List</button>
//       <button onClick={() => editor.chain().focus().toggleCodeBlock().run()}>Code Block</button>
//       <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</button>
//       <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
//       <button
//         onClick={() =>
//           editor
//             .chain()
//             .focus()
//             .setLink({ href: prompt('Enter URL') || '' })
//             .run()
//         }
//       >
//         Link
//       </button>
//     </div>
//   );
// };

// export function HtmlEditor3({ content, onChange }: { content?: string; onChange?: (html: string) => void }) {
//   const editor = useEditor({
//     extensions: [
//       StarterKit,
//       Underline,
//       Link,
//       TextStyle,
//       Color,
//       // CodeBlockLowlight.configure({
//       //   lowlight,
//       // }),
//     ],
//     content: content || '<p>Hello World</p>',
//     onUpdate: ({ editor }) => {
//       const html = editor.getHTML();
//       onChange?.(html);
//     },
//   });

//   useEffect(() => {
//     if (content) {
//       editor?.commands.setContent(content);
//     }
//   }, [content]);

//   return (
//     <div className="border p-4 rounded">
//       <MenuBar editor={editor} />
//       <EditorContent editor={editor} className="prose min-h-[300px]" />
//     </div>
//   );
// }
