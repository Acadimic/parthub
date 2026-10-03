import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { type IListeningAttrs, LISTENING_NODE } from '@repo/shared/utils';
import { lastLanguage } from '../pronunciation/last-language';
import { ListeningNodeView } from './ListeningNodeView';

export const LISTENING_NAME = LISTENING_NODE;

export interface IListeningOptions {
  defaultLanguage: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    listening: {
      /** Wraps the selected paragraphs in a listening passage or a dialogue. */
      setListening: (attrs?: Partial<IListeningAttrs>) => ReturnType;
      /** Turns the block back into plain paragraphs. */
      unsetListening: () => ReturnType;
    };
  }
}

const stringAttribute = (name: string, fallback: string) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${name}`) ?? fallback,
  renderHTML: (attributes: Record<string, unknown>) => ({ [`data-${name}`]: String(attributes[name] ?? fallback) }),
});

/**
 * A listening passage or a dialogue. It holds paragraphs only, so everything inside stays ordinary
 * text that edits, exports and imports like any other; a dialogue line is a paragraph opening with
 * its speaker in bold.
 */
export const ListeningNode = Node.create<IListeningOptions>({
  name: LISTENING_NAME,
  group: 'block',
  content: 'paragraph+',
  defining: true,

  addOptions: () => ({ defaultLanguage: '' }),

  addAttributes: () => ({
    lang: stringAttribute('lang', ''),
    mode: stringAttribute('mode', 'passage'),
    transcript: stringAttribute('transcript', 'shown'),
    audio: stringAttribute('audio', ''),
  }),

  parseHTML: () => [{ tag: 'section[data-listening]' }],

  renderHTML: ({ HTMLAttributes }) => ['section', mergeAttributes(HTMLAttributes, { 'data-listening': '' }), 0],

  addNodeView: () => ReactNodeViewRenderer(ListeningNodeView),

  addCommands() {
    return {
      setListening:
        (attrs = {}) =>
        ({ commands }) =>
          commands.wrapIn(this.name, {
            mode: 'passage',
            transcript: 'shown',
            audio: '',
            ...attrs,
            lang: attrs.lang || this.options.defaultLanguage || lastLanguage.get(),
          }),
      unsetListening:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
