import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SCENE3D_NODE } from '@repo/shared/utils';
import { Scene3DNodeView } from './Scene3DNodeView';

/** Buttons inside the card own their clicks; ProseMirror would otherwise move the selection. */
const nodeViewOptions = {
  stopEvent: ({ event }: { event: Event }) => !!(event.target as HTMLElement | null)?.closest('button'),
};

/**
 * A 3D scene block. `atom` keeps it indivisible, and `spec` holds the scene's JSON as one string,
 * because a node attribute must be a primitive. It arrives through Markdown import (a `scene3d`
 * fence); the template gallery that writes one in the editor is a later phase.
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
  }),

  parseHTML: () => [{ tag: 'div[data-scene3d]' }],

  renderHTML: ({ HTMLAttributes }) => ['div', mergeAttributes(HTMLAttributes, { 'data-scene3d': '' })],

  addNodeView: () => ReactNodeViewRenderer(Scene3DNodeView, nodeViewOptions),
});
