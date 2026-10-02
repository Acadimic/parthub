import { mergeAttributes, Node } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { IMAGE_NODE, type ImageWidth } from '@repo/shared/utils';
import { type IUploadedImage } from '../../contexts/rich-text-media-context';
import { ImageNodeView } from './ImageNodeView';

export const IMAGE_NAME = IMAGE_NODE;

/** What a picture may be uploaded as. Anything else pasted or dropped is left to the browser. */
export const IMAGE_ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'];

export interface IImageAttrs {
  src: string;
  alt?: string;
  caption?: string;
  width?: ImageWidth;
}

export interface IImageOptions {
  /** Absent where the host cannot upload; pasting or dropping a file then does nothing special. */
  upload?: (file: File) => Promise<IUploadedImage>;
  onUploadError?: (error: unknown) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    image: {
      /** Inserts a picture as its own block at the caret. */
      insertImage: (attrs: IImageAttrs) => ReturnType;
    };
  }
}

const stringAttribute = (name: string, fallback: string) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${name}`) ?? fallback,
  renderHTML: (attributes: Record<string, unknown>) => ({ [`data-${name}`]: String(attributes[name] ?? fallback) }),
});

/** Inputs inside the view own their keystrokes; ProseMirror would otherwise treat them as edits. */
const nodeViewOptions = {
  stopEvent: ({ event }: { event: Event }) => {
    const target = event.target as HTMLElement | null;
    return !!target?.closest('input, textarea, button');
  },
};

const imageFiles = (files: FileList | null | undefined): File[] =>
  Array.from(files ?? []).filter((file) => IMAGE_ACCEPT.includes(file.type));

/**
 * A picture block. `atom` keeps it indivisible: a backspace at its edge removes the whole image or
 * nothing. The file itself lives in the bucket; the node holds its address, alt text, caption and
 * display width.
 */
export const ImageBlock = Node.create<IImageOptions>({
  name: IMAGE_NAME,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions: () => ({ upload: undefined, onUploadError: undefined }),

  addAttributes: () => ({
    src: stringAttribute('src', ''),
    alt: stringAttribute('alt', ''),
    caption: stringAttribute('caption', ''),
    width: stringAttribute('width', 'full'),
  }),

  parseHTML: () => [{ tag: 'figure[data-image]' }],

  renderHTML: ({ HTMLAttributes }) => ['figure', mergeAttributes(HTMLAttributes, { 'data-image': '' })],

  addNodeView: () => ReactNodeViewRenderer(ImageNodeView, nodeViewOptions),

  addCommands() {
    return {
      insertImage:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { alt: '', caption: '', width: 'full', ...attrs },
          }),
    };
  },

  addProseMirrorPlugins() {
    const { upload, onUploadError } = this.options;
    if (!upload) return [];
    const editor = this.editor;
    const insertUploads = (files: File[], at?: number) => {
      files.forEach(async (file) => {
        try {
          const { src } = await upload(file);
          const alt = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
          const content = { type: IMAGE_NAME, attrs: { src, alt, caption: '', width: 'full' } };
          if (at === undefined) editor.chain().focus().insertContent(content).run();
          // The document may have changed while the file uploaded, so the drop point is clamped to it.
          else editor.chain().focus().insertContentAt(Math.min(at, editor.state.doc.content.size), content).run();
        } catch (error) {
          onUploadError?.(error);
        }
      });
    };
    return [
      new Plugin({
        key: new PluginKey('imageUpload'),
        props: {
          handlePaste: (_view, event) => {
            const files = imageFiles(event.clipboardData?.files);
            if (!files.length) return false;
            insertUploads(files);
            return true;
          },
          handleDrop: (view, event) => {
            const files = imageFiles(event.dataTransfer?.files);
            if (!files.length) return false;
            const at = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
            insertUploads(files, at);
            return true;
          },
        },
      }),
    ];
  },
});
