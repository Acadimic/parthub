import { Marking as MarkingResult, QuestionType } from '@repo/shared/enums';
import { type QuestionDocument } from '../question/question.schema';

/** Question types answered by typing, compared as text rather than by option id. */
const TYPED_QUESTION_TYPES = new Set<QuestionType>([
  QuestionType.INTEGER,
  QuestionType.FILL_IN_THE_BLANK,
  QuestionType.SUBJECTIVE,
]);

export interface IMarkedResponses {
  resultMaps: Record<string, MarkingResult>;
  answerMaps: Record<string, string[]>;
  marksObtained: number;
}

const normalise = (text: string) => text.trim().replace(/\s+/g, ' ').toLowerCase();

/** A typed answer matches when it equals any correct option's text, ignoring case and spacing. */
const markTyped = (responses: string[], correctTexts: string[]): MarkingResult => {
  if (!responses.length || !responses[0]?.trim()) return MarkingResult.UNATTEMPTED;
  const given = normalise(responses[0]);
  return correctTexts.some((text) => normalise(text) === given) ? MarkingResult.CORRECT : MarkingResult.INCORRECT;
};

/**
 * A choice answer is correct when it names exactly the correct options; partially correct when it
 * names some of them and nothing wrong; incorrect as soon as it includes a wrong one or too many.
 */
const markChoice = (responses: string[], correctIds: string[]): MarkingResult => {
  if (!responses.length) return MarkingResult.UNATTEMPTED;
  const hasWrong = responses.some((id) => !correctIds.includes(id)) || responses.length > correctIds.length;
  if (hasWrong) return MarkingResult.INCORRECT;
  return responses.length === correctIds.length ? MarkingResult.CORRECT : MarkingResult.PARTIALLY_CORRECT;
};

/**
 * Marks a sitting against the paper's questions. Runs on the server so the score comes from the
 * stored questions, never from what the client claims. `partiallyCorrect` is optional on a
 * question's markings, so a paper without it awards 0 for a partial answer.
 */
export const markResponses = (
  questions: QuestionDocument[],
  responseMaps: Record<string, string[]>,
): IMarkedResponses => {
  const marked: IMarkedResponses = { resultMaps: {}, answerMaps: {}, marksObtained: 0 };
  questions.forEach((question) => {
    const questionId = String(question._id);
    const correctOptions = (question.options ?? []).filter((option) => option.isCorrect);
    const correctIds = correctOptions.map((option) => String(option._id));
    const responses = responseMaps[questionId] ?? [];
    const result = TYPED_QUESTION_TYPES.has(question.questionType)
      ? markTyped(
          responses,
          correctOptions.map((option) => option.body?.text ?? ''),
        )
      : markChoice(responses, correctIds);
    marked.resultMaps[questionId] = result;
    marked.answerMaps[questionId] = correctIds;
    marked.marksObtained += question.markings?.[result] ?? 0;
  });
  return marked;
};
