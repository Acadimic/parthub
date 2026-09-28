import { type TestPaperDto } from '@repo/shared/contracts';
import { createEmptyRichText } from '@repo/shared/utils';
import { Marking } from '../enums';
import { getObjectId } from '../utils/helpers';
import { type IAnswerMap, type IExam, type ISectionWiseQuestionsMap } from './exam.types';
import { useQuestionStore } from './question.store';
import { useSelectorStore } from './selector.store';

type QuestionStore = ReturnType<typeof useQuestionStore.getState>;

/** Section id to its question ids, in section order. */
const toSectionWiseQuestionIds = (sections: string[], questionStore: QuestionStore): ISectionWiseQuestionsMap =>
  sections.reduce<ISectionWiseQuestionsMap>((maps, sectionId) => {
    maps[sectionId] = questionStore.getQuestionsBySectionId(sectionId).map((question) => question._id);
    return maps;
  }, {});

/** Question id to the ids of its correct options — the key the exam marks responses against. */
const toAnswerMaps = (questions: { _id: string }[], questionStore: QuestionStore): IAnswerMap =>
  questions.reduce<IAnswerMap>((answers, question) => {
    answers[question._id] = questionStore.getCorrectOptions(question._id).map((option) => option._id);
    return answers;
  }, {});

/** One entry per question, all set to `value`. */
const perQuestion = <T>(questions: { _id: string }[], value: () => T): Record<string, T> =>
  questions.reduce<Record<string, T>>((map, question) => {
    map[question._id] = value();
    return map;
  }, {});

/**
 * A fresh sitting of a paper whose sections and questions are already in their stores, or `null`
 * when the paper cannot be sat: `TestPaperDto` leaves the marks and type optional because one
 * class serves both directions, and a paper with no questions has nothing to show. Selects the
 * first question as a side effect, so the exam opens on it.
 */
export const buildExam = (testPaperId: string, testPaper: TestPaperDto, isPractice: boolean): IExam | null => {
  const { durationMins, maxMarks, paperCategory, paperType } = testPaper;
  if (durationMins == null || maxMarks == null || !paperCategory || !paperType) return null;
  const questionStore = useQuestionStore.getState();
  const sections = testPaper.sections ?? [];
  const questions = questionStore.getQuestionsBySectionIds(sections);
  if (!questions.length) return null;

  const sectionWiseQuestionIdsMaps = toSectionWiseQuestionIds(sections, questionStore);
  const questionIds = Object.values(sectionWiseQuestionIdsMaps).flat();
  const firstQuestionId = questionIds[0];
  if (firstQuestionId) useSelectorStore.getState().setSelectedQuestionId(firstQuestionId);

  return {
    _id: getObjectId(),
    testPaper: testPaperId,
    course: useSelectorStore.getState().selectedCourseId,
    title: testPaper.name,
    instruction: testPaper.instruction ?? createEmptyRichText(),
    questionWiseSpendTime: perQuestion<number>(questions, () => 0),
    questionWiseReplyTime: perQuestion<number>(questions, () => 0),
    totalSpendTime: 0,
    answerMaps: toAnswerMaps(questions, questionStore),
    responseMaps: perQuestion<string[]>(questions, () => []),
    visited: firstQuestionId ? [firstQuestionId] : [],
    markedForReviews: [],
    sectionWiseQuestionIdsMaps,
    numberOfQuestions: questions.length,
    durationMins,
    maxMarks,
    year: testPaper.year ?? 0,
    sections: [...sections],
    questions: questionIds,
    standards: [...(testPaper.standards ?? [])],
    subjects: [...(testPaper.subjects ?? [])],
    resultMaps: perQuestion<Marking>(questions, () => Marking.UNATTEMPTED),
    isPractice,
    isSubmitted: false,
    paperCategory,
    paperType,
  };
};
