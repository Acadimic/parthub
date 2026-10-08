import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SCENE3D_NODE } from '@repo/shared/utils';
import { Scene3DNodeView } from './Scene3DNodeView';

/** Buttons inside the card own their clicks; ProseMirror would otherwise move the selection. */
const nodeViewOptions = {
  stopEvent: ({ event }: { event: Event }) => !!(event.target as HTMLElement | null)?.closest('button'),
};

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    scene3d: {
      /** Inserts a 3D scene as its own block at the caret. */
      insertScene: (attrs: { spec: string; template: string }) => ReturnType;
    };
  }
}

/**
 * A 3D scene block. `atom` keeps it indivisible, and `spec` holds the scene's JSON as one string,
 * because a node attribute must be a primitive. It comes from the toolbar's template gallery
 * (`SceneDialog`) or from Markdown import (a `scene3d` fence).
 */
export const Scene3DBlock = Node.create({
  name: SCENE3D_NODE,
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes: () => ({
    spec: {
      default: '',
      parseHTML: (element: HTMLElement) => element.getAttribute('data-spec') ?? '',
      renderHTML: (attributes: Record<string, unknown>) => ({ 'data-spec': String(attributes.spec ?? '') }),
    },
    // The template and form values it was made from (see `originToAttr`), so Edit reopens the form.
    // Markdown does not carry it: an imported scene edits as JSON.
    template: {
      default: '',
      parseHTML: (element: HTMLElement) => element.getAttribute('data-template') ?? '',
      renderHTML: (attributes: Record<string, unknown>) => ({ 'data-template': String(attributes.template ?? '') }),
    },
  }),

  addCommands() {
    return {
      insertScene:
        (attrs) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs }),
    };
  },

  parseHTML: () => [{ tag: 'div[data-scene3d]' }],

  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-scene3d': '' })],

  addNodeView: () => ReactNodeViewRenderer(Scene3DNodeView, nodeViewOptions),
});
