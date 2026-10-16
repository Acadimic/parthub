import { QuestionType } from '@repo/shared/enums';
import type { IRichText, IRichTextNode } from '@repo/shared/interfaces';

export interface IQuestionKind {
  label: string;
  /**
   * Where the answer goes: picked from lettered options, typed into a box (the first option holds
   * the expected value), or written out on ruled lines and marked by hand.
   */
  response: 'choices' | 'box' | 'lines';
}

const QUESTION_KINDS: Record<QuestionType, IQuestionKind> = {
  [QuestionType.SINGLE_CHOICE]: { label: 'Single choice', response: 'choices' },
  [QuestionType.MULTIPLE_CHOICE]: { label: 'Multiple choice · one or more correct', response: 'choices' },
  [QuestionType.BOOLEAN]: { label: 'True / False', response: 'choices' },
  [QuestionType.INTEGER]: { label: 'Integer', response: 'box' },
  [QuestionType.FILL_IN_THE_BLANK]: { label: 'Fill in the blank', response: 'box' },
  [QuestionType.SUBJECTIVE]: { label: 'Written answer', response: 'lines' },
};

/** A type off the wire, falling back to single choice the way the paper screen does. */
export const getQuestionKind = (type: QuestionType | undefined): IQuestionKind =>
  QUESTION_KINDS[type ?? QuestionType.SINGLE_CHOICE] ?? QUESTION_KINDS[QuestionType.SINGLE_CHOICE];

export const OPTION_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Options this short set two to a row; anything longer, or with a picture or table, stacks. */
const SHORT_OPTION_CHARS = 36;
/** What a line of text is made of; anything else — a picture, a table, a 3D scene — needs the width. */
const TEXT_NODES = new Set(['doc', 'paragraph', 'text', 'hardBreak', 'inlineMath']);

const isTextOnly = (node: IRichTextNode): boolean =>
  TEXT_NODES.has(node.type) && (node.content ?? []).every(isTextOnly);

export const isShortOption = (body: IRichText | undefined): boolean =>
  !body || (body.text.length <= SHORT_OPTION_CHARS && isTextOnly(body.doc));

/** Ruled lines for a written answer, scaled by its marks so a long answer gets room. */
export const getAnswerLineCount = (marks: number): number => Math.min(14, Math.max(4, marks * 2));
