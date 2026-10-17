// Interactive blocks in authored content (.claude/plans/INTERACTIVE_LESSONS.md §3). Each is a
// container whose text stays ordinary rich text, so pronunciation marks, generated audio and the
// topic reader work inside it unchanged.

/** Show answer: a prompt, then an answer the learner reveals in place. */
export const REVEAL_NODE = 'reveal';
export const REVEAL_PROMPT_NODE = 'revealPrompt';
export const REVEAL_ANSWER_NODE = 'revealAnswer';

/** Quick check: a prompt, 2–6 options (any number may be right), and an optional "why". */
export const CHECK_NODE = 'check';
export const CHECK_PROMPT_NODE = 'checkPrompt';
export const CHECK_OPTION_NODE = 'checkOption';
export const CHECK_WHY_NODE = 'checkWhy';

/** Sound board: a table whose cells are tiles that speak when tapped. */
export const SOUNDBOARD_NODE = 'soundboard';

/** Flashcards: a deck of cards, each a front (usually Sanskrit) and a back (its meaning). */
export const FLASHCARDS_NODE = 'flashcards';
export const FLASHCARD_NODE = 'flashcard';
export const FLASHCARD_FRONT_NODE = 'flashcardFront';
export const FLASHCARD_BACK_NODE = 'flashcardBack';

/** Say it: lines to say, each with Listen, Record and Play mine. */
export const SAY_NODE = 'sayIt';

/** Build it, step by step: a short sequence; each step shows a line big and a caption under it. */
export const STEPS_NODE = 'steps';
export const STEP_NODE = 'step';

/** Picture with labels: an image with numbered points; tapping one shows and plays its word. */
export const PICTURE_NODE = 'picture';
export const PICTURE_LABEL_NODE = 'pictureLabel';
/** `explore`: tap any point. `find`: the learner is asked to tap each word in turn. */
export const PICTURE_MODES = ['explore', 'find'] as const;
export type PictureMode = (typeof PICTURE_MODES)[number];

/**
 * Where the sound is made: a head in profile beside a table of letters. Each row is a place in the
 * mouth (its first cell names it: throat, palate, roof, teeth, lips); tapping a letter plays it and
 * lights its place up. Column headers that say "puff", "buzz" or "nose" mark how the sound is made.
 */
export const SOUNDMAP_NODE = 'soundmap';
export const MOUTH_PLACES = ['throat', 'palate', 'roof', 'teeth', 'lips'] as const;
export type MouthPlace = (typeof MOUTH_PLACES)[number];

/**
 * Sentence picture: a sentence as role tiles (who, does what, to what, where…), and alternative
 * sentences the learner switches between to see which endings change.
 */
export const SENTENCE_NODE = 'sentence';
export const SENTENCE_VARIANT_NODE = 'sentenceVariant';
export const SENTENCE_TILE_NODE = 'sentenceTile';
export const SENTENCE_ROLES = ['doer', 'action', 'object', 'place', 'time', 'with', 'for', 'from', 'whose'] as const;
export type SentenceRole = (typeof SENTENCE_ROLES)[number];

/**
 * Concept: a short reading that teaches one idea before the learner practises it — the rule in plain
 * words, a few examples, a small table, a common mistake. Holds any blocks; `title` names the idea.
 */
export const CONCEPT_NODE = 'concept';

/** The Markdown fence name of each block: `::: check` … `:::`. */
export const ACTIVITY_FENCES = {
  reveal: REVEAL_NODE,
  check: CHECK_NODE,
  soundboard: SOUNDBOARD_NODE,
  cards: FLASHCARDS_NODE,
  say: SAY_NODE,
  steps: STEPS_NODE,
  picture: PICTURE_NODE,
  soundmap: SOUNDMAP_NODE,
  sentence: SENTENCE_NODE,
  concept: CONCEPT_NODE,
} as const;

export type ActivityFence = keyof typeof ACTIVITY_FENCES;

export const ACTIVITY_FENCE_NAMES = Object.keys(ACTIVITY_FENCES) as ActivityFence[];
