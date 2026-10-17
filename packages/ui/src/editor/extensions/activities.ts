import { mergeAttributes, Node, type JSONContent } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import {
  CONCEPT_NODE,
  CHECK_NODE,
  CHECK_OPTION_NODE,
  CHECK_PROMPT_NODE,
  CHECK_WHY_NODE,
  FLASHCARD_BACK_NODE,
  FLASHCARD_FRONT_NODE,
  FLASHCARD_NODE,
  FLASHCARDS_NODE,
  REVEAL_ANSWER_NODE,
  REVEAL_NODE,
  REVEAL_PROMPT_NODE,
  PICTURE_LABEL_NODE,
  PICTURE_NODE,
  SAY_NODE,
  SENTENCE_NODE,
  SENTENCE_TILE_NODE,
  SENTENCE_VARIANT_NODE,
  SOUNDBOARD_NODE,
  SOUNDMAP_NODE,
  STEP_NODE,
  STEPS_NODE,
} from '@repo/shared/utils';
import { CheckOptionNodeView } from './CheckOptionNodeView';

export type ActivityKind = 'reveal' | 'check' | 'soundboard' | 'cards' | 'say' | 'steps' | 'concept';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    activity: {
      /** Inserts an interactive block with placeholder text to replace. */
      insertActivity: (kind: ActivityKind) => ReturnType;
    };
  }
}

/**
 * How the author sees a block or a part of one: a labelled frame around ordinary editable text.
 * The label sits in a `data-label` attribute shown with a CSS `before:`, so it is never part of
 * the document.
 */
const FRAME =
  'relative my-4 border border-dashed border-primary/40 px-3 pb-2 pt-6 before:absolute before:left-2 before:top-1 before:text-xxs before:font-semibold before:uppercase before:tracking-caps before:text-primary before:content-[attr(data-label)]';
const PART =
  'relative my-2 border-l-2 border-border pl-3 pt-4 before:absolute before:left-3 before:top-0 before:text-xxs before:uppercase before:tracking-caps before:text-muted-foreground before:content-[attr(data-label)]';

interface IFrameSpec {
  name: string;
  content: string;
  label: string;
  isPart: boolean;
}

/** One schema node per block and per part; `defining` keeps a paste from dissolving the frame. */
const frameNode = ({ name, content, label, isPart }: IFrameSpec) =>
  Node.create({
    name,
    group: isPart ? undefined : 'block',
    content,
    defining: true,
    isolating: true,
    parseHTML: () => [{ tag: `div[data-activity="${name}"]` }],
    renderHTML: ({ HTMLAttributes }) => [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-activity': name, 'data-label': label, class: isPart ? PART : FRAME }),
      0,
    ],
  });

const paragraph = (text: string): JSONContent => ({ type: 'paragraph', content: [{ type: 'text', text }] });

const TEMPLATES: Record<ActivityKind, JSONContent> = {
  reveal: {
    type: REVEAL_NODE,
    content: [
      { type: REVEAL_PROMPT_NODE, content: [paragraph('The question to think about')] },
      { type: REVEAL_ANSWER_NODE, content: [paragraph('The answer, and why')] },
    ],
  },
  check: {
    type: CHECK_NODE,
    content: [
      { type: CHECK_PROMPT_NODE, content: [paragraph('The question')] },
      { type: CHECK_OPTION_NODE, attrs: { correct: true }, content: [paragraph('A right answer')] },
      { type: CHECK_OPTION_NODE, attrs: { correct: false }, content: [paragraph('A wrong answer')] },
      { type: CHECK_OPTION_NODE, attrs: { correct: false }, content: [paragraph('Another wrong answer')] },
      { type: CHECK_WHY_NODE, content: [paragraph('Why the right answer is right')] },
    ],
  },
  soundboard: {
    type: SOUNDBOARD_NODE,
    content: [
      {
        type: 'table',
        attrs: { bordered: true },
        content: [
          {
            type: 'tableRow',
            content: ['', 'Column', 'Column'].map((text) => ({
              type: 'tableHeader',
              content: [text ? paragraph(text) : { type: 'paragraph' }],
            })),
          },
          {
            type: 'tableRow',
            content: ['Row', 'Pronounce me', 'Pronounce me'].map((text) => ({
              type: 'tableCell',
              content: [paragraph(text)],
            })),
          },
        ],
      },
    ],
  },
  cards: {
    type: FLASHCARDS_NODE,
    content: [1, 2].map(() => ({
      type: FLASHCARD_NODE,
      content: [
        { type: FLASHCARD_FRONT_NODE, content: [paragraph('Word (mark it as pronounced)')] },
        { type: FLASHCARD_BACK_NODE, content: [paragraph('Its meaning')] },
      ],
    })),
  },
  say: { type: SAY_NODE, content: [paragraph('A line to say aloud (mark it as pronounced)')] },
  concept: {
    type: CONCEPT_NODE,
    attrs: { title: 'The idea' },
    content: [paragraph('Explain the idea in plain words, with two or three examples and one common mistake.')],
  },
  steps: {
    type: STEPS_NODE,
    content: [
      { type: STEP_NODE, content: [paragraph('First form (bold the part that changes)'), paragraph('What it is')] },
      { type: STEP_NODE, content: [paragraph('Next form'), paragraph('What changed, and why')] },
    ],
  },
};

const ActivityCommands = Node.create({
  name: 'activityCommands',
  addCommands: () => ({
    insertActivity:
      (kind) =>
      ({ commands }) =>
        commands.insertContent(TEMPLATES[kind]),
  }),
});

const dataAttribute = (name: string, fallback: string | number) => ({
  default: fallback,
  parseHTML: (element: HTMLElement) => {
    const value = element.getAttribute(`data-${name}`);
    if (value === null) return fallback;
    return typeof fallback === 'number' ? Number(value) : value;
  },
  renderHTML: (attributes: Record<string, unknown>) => ({ [`data-${name}`]: String(attributes[name] ?? fallback) }),
});

/**
 * A picture with labelled points. The picture and the points' positions come from Markdown (the
 * course agent draws the figure and knows where things are); in the editor the labels' words and
 * meanings are edited as text and the positions are kept.
 */
const Picture = Node.create({
  name: PICTURE_NODE,
  group: 'block',
  content: `${PICTURE_LABEL_NODE}+`,
  defining: true,
  isolating: true,
  addAttributes: () => ({
    src: dataAttribute('src', ''),
    alt: dataAttribute('alt', ''),
    mode: dataAttribute('mode', 'explore'),
  }),
  parseHTML: () => [{ tag: `div[data-activity="${PICTURE_NODE}"]` }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, {
      'data-activity': PICTURE_NODE,
      'data-label': `Picture with labels (${String(HTMLAttributes['data-mode'] ?? 'explore')}) — one label per point`,
      class: FRAME,
    }),
    0,
  ],
});

const PictureLabel = Node.create({
  name: PICTURE_LABEL_NODE,
  content: 'paragraph paragraph?',
  defining: true,
  addAttributes: () => ({ x: dataAttribute('x', 50), y: dataAttribute('y', 50) }),
  parseHTML: () => [{ tag: `div[data-activity="${PICTURE_LABEL_NODE}"]` }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, {
      'data-activity': PICTURE_LABEL_NODE,
      'data-label': `Point at ${String(HTMLAttributes['data-x'] ?? 50)}% across, ${String(HTMLAttributes['data-y'] ?? 50)}% down — word, then meaning`,
      class: PART,
    }),
    0,
  ],
});

/** A sentence tile: its role (who, does what…) kept as an attribute; word, then meaning. */
const SentenceTile = Node.create({
  name: SENTENCE_TILE_NODE,
  content: 'paragraph paragraph?',
  defining: true,
  addAttributes: () => ({ role: dataAttribute('role', 'doer') }),
  parseHTML: () => [{ tag: `div[data-activity="${SENTENCE_TILE_NODE}"]` }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, {
      'data-activity': SENTENCE_TILE_NODE,
      'data-label': `Tile — ${String(HTMLAttributes['data-role'] ?? 'doer')}: word, then meaning`,
      class: PART,
    }),
    0,
  ],
});

/** A check option: one paragraph and whether it is a right answer, toggled from its node view. */
const CheckOption = Node.create({
  name: CHECK_OPTION_NODE,
  content: 'paragraph',
  defining: true,
  addAttributes: () => ({
    correct: {
      default: false,
      parseHTML: (element: HTMLElement) => element.getAttribute('data-correct') === 'true',
      renderHTML: (attributes: Record<string, unknown>) => ({ 'data-correct': String(attributes.correct === true) }),
    },
  }),
  parseHTML: () => [{ tag: `div[data-activity="${CHECK_OPTION_NODE}"]` }],
  renderHTML: ({ HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, { 'data-activity': CHECK_OPTION_NODE }),
    0,
  ],
  addNodeView: () =>
    ReactNodeViewRenderer(CheckOptionNodeView, {
      stopEvent: ({ event }: { event: Event }) => !!(event.target as HTMLElement | null)?.closest('button'),
    }),
});

/** A concept to read: any blocks, under a title kept as an attribute (`::: concept title="…"`). */
const Concept = Node.create({
  name: CONCEPT_NODE,
  group: 'block',
  content: 'block+',
  defining: true,
  isolating: true,
  addAttributes: () => ({
    title: {
      default: '',
      parseHTML: (element) => element.getAttribute('data-title') ?? '',
      renderHTML: (attrs) => ({ 'data-title': attrs.title }),
    },
  }),
  parseHTML: () => [{ tag: `div[data-activity="${CONCEPT_NODE}"]` }],
  renderHTML: ({ node, HTMLAttributes }) => [
    'div',
    mergeAttributes(HTMLAttributes, {
      'data-activity': CONCEPT_NODE,
      'data-label': `Concept: ${String(node.attrs.title || 'untitled')}`,
      class: FRAME,
    }),
    0,
  ],
});

/**
 * The interactive blocks of `@repo/shared/utils` activity.util: show answer, quick check, sound
 * board, flashcards and say it. Without these a lesson holding one would lose it on the first save.
 */
export const ActivityExtensions = [
  ActivityCommands,
  frameNode({
    name: REVEAL_NODE,
    content: `${REVEAL_PROMPT_NODE} ${REVEAL_ANSWER_NODE}`,
    label: 'Show answer',
    isPart: false,
  }),
  frameNode({ name: REVEAL_PROMPT_NODE, content: 'block+', label: 'Question', isPart: true }),
  frameNode({ name: REVEAL_ANSWER_NODE, content: 'block+', label: 'Answer (hidden until shown)', isPart: true }),
  frameNode({
    name: CHECK_NODE,
    content: `${CHECK_PROMPT_NODE} ${CHECK_OPTION_NODE}{2,6} ${CHECK_WHY_NODE}?`,
    label: 'Quick check',
    isPart: false,
  }),
  frameNode({ name: CHECK_PROMPT_NODE, content: 'block+', label: 'Question', isPart: true }),
  CheckOption,
  frameNode({ name: CHECK_WHY_NODE, content: 'block+', label: 'Why (shown when answered right)', isPart: true }),
  frameNode({
    name: SOUNDBOARD_NODE,
    content: 'table',
    label: 'Sound board — every pronounced cell plays when tapped',
    isPart: false,
  }),
  frameNode({ name: FLASHCARDS_NODE, content: `${FLASHCARD_NODE}+`, label: 'Flashcards', isPart: false }),
  frameNode({
    name: FLASHCARD_NODE,
    content: `${FLASHCARD_FRONT_NODE} ${FLASHCARD_BACK_NODE}`,
    label: 'Card',
    isPart: true,
  }),
  frameNode({ name: FLASHCARD_FRONT_NODE, content: 'paragraph', label: 'Front', isPart: true }),
  frameNode({ name: FLASHCARD_BACK_NODE, content: 'paragraph', label: 'Back', isPart: true }),
  frameNode({
    name: STEPS_NODE,
    content: `${STEP_NODE}{2,12}`,
    label: 'Step by step — each step: the form (bold what changes), then a caption',
    isPart: false,
  }),
  frameNode({ name: STEP_NODE, content: 'block+', label: 'Step', isPart: true }),
  Picture,
  PictureLabel,
  frameNode({
    name: SOUNDMAP_NODE,
    content: 'table',
    label: 'Where the sound is made — rows: throat, palate, roof, teeth, lips; columns may say puff, buzz, nose',
    isPart: false,
  }),
  frameNode({
    name: SENTENCE_NODE,
    content: `${SENTENCE_VARIANT_NODE}{1,8}`,
    label: 'Sentence picture — one sentence per part; tiles changed from the one before light up',
    isPart: false,
  }),
  frameNode({
    name: SENTENCE_VARIANT_NODE,
    content: `${SENTENCE_TILE_NODE}+ paragraph?`,
    label: 'Sentence',
    isPart: true,
  }),
  SentenceTile,
  Concept,
  frameNode({
    name: SAY_NODE,
    content: 'paragraph+',
    label: 'Say it — each line gets Listen, Record and My voice',
    isPart: false,
  }),
];
