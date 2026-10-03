import { Mark, mergeAttributes } from '@tiptap/core';
import type { EditorState } from '@tiptap/pm/state';
import { type IPronunciationAttrs, PRONUNCIATION_MARK } from '@repo/shared/utils';
import { lastLanguage } from '../pronunciation/last-language';

export const PRONUNCIATION_NAME = PRONUNCIATION_MARK;

export interface IPronunciationOptions {
  /** The course's language; new marks start in it. Without one, the language last picked. */
  defaultLanguage: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pronunciation: {
      /** Marks the selection — or, with none, the word at the caret — as pronounceable. */
      setPronunciation: (attrs?: Partial<IPronunciationAttrs>) => ReturnType;
      /** Changes the attributes of the whole run the caret is in. */
      updatePronunciation: (attrs: Partial<IPronunciationAttrs>) => ReturnType;
      /** Removes the mark from the whole run the caret is in. */
      unsetPronunciation: () => ReturnType;
      togglePronunciation: () => ReturnType;
    };
  }
}

const stringAttribute = (name: string) => ({
  default: '',
  parseHTML: (element: HTMLElement) => element.getAttribute(`data-${name}`) ?? '',
  renderHTML: (attributes: Record<string, unknown>) => ({ [`data-${name}`]: String(attributes[name] ?? '') }),
});

/** A letter, a combining mark (Devanagari vowel signs are marks) or a digit; also an apostrophe inside a word. */
const WORD_CHAR = /[\p{L}\p{M}\p{N}'’-]/u;

/** The word around the caret, or null when the caret is not in one. */
const wordAtCaret = (state: EditorState): { from: number; to: number } | null => {
  const { $from } = state.selection;
  // Leaves count as one position, so they are replaced by one character to keep offsets aligned.
  const text = $from.parent.textBetween(0, $from.parent.content.size, undefined, '￼');
  let start = $from.parentOffset;
  let end = $from.parentOffset;
  while (start > 0 && WORD_CHAR.test(text[start - 1])) start -= 1;
  while (end < text.length && WORD_CHAR.test(text[end])) end += 1;
  if (start === end) return null;
  return { from: $from.start() + start, to: $from.start() + end };
};

/**
 * A pronounceable run of text: its language, and optionally its IPA, transliteration and a stored
 * recording. `inclusive: false` so typing on after "Hola" does not extend it to the next word.
 */
export const Pronunciation = Mark.create<IPronunciationOptions>({
  name: PRONUNCIATION_NAME,
  inclusive: false,

  addOptions: () => ({ defaultLanguage: '' }),

  addAttributes: () => ({
    lang: stringAttribute('lang'),
    ipa: stringAttribute('ipa'),
    translit: stringAttribute('translit'),
    audio: stringAttribute('audio'),
  }),

  parseHTML: () => [{ tag: 'span[data-pronunciation]' }],

  renderHTML: ({ HTMLAttributes }) => ['span', mergeAttributes(HTMLAttributes, { 'data-pronunciation': '' }), 0],

  addCommands() {
    return {
      setPronunciation:
        (attrs = {}) =>
        ({ state, chain }) => {
          const range = state.selection.empty ? wordAtCaret(state) : state.selection;
          if (!range) return false;
          const lang = attrs.lang || this.options.defaultLanguage || lastLanguage.get();
          return chain()
            .setTextSelection({ from: range.from, to: range.to })
            .setMark(this.name, { ipa: '', translit: '', audio: '', ...attrs, lang })
            .run();
        },
      updatePronunciation:
        (attrs) =>
        ({ chain }) =>
          chain().extendMarkRange(this.name).updateAttributes(this.name, attrs).run(),
      unsetPronunciation:
        () =>
        ({ chain }) =>
          chain().extendMarkRange(this.name).unsetMark(this.name).run(),
      togglePronunciation:
        () =>
        ({ editor, commands }) =>
          editor.isActive(this.name) ? commands.unsetPronunciation() : commands.setPronunciation(),
    };
  },

  addKeyboardShortcuts() {
    return { 'Mod-Alt-p': () => this.editor.commands.togglePronunciation() };
  },
});
