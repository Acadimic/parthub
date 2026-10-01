import { LevelType, Marking } from '@enums';
import { type IExam, type IResultCount, useQuestionLookups, useStandardLookups, useTestPaperLookups } from '@stores';
import {
  type Grouping,
  type IMarksSplit,
  type IOutcomeGroup,
  type IQuestionOutcome,
  countOutcomes,
  getAccuracy,
  getInsights,
  groupOutcomes,
  splitMarks,
  timeByMarking,
} from './analytics';

const LEVEL_NAMES: Record<LevelType, string> = {
  [LevelType.EASY]: 'Easy',
  [LevelType.MEDIUM]: 'Medium',
  [LevelType.HARD]: 'Hard',
};

const GROUPINGS: Grouping[] = ['section', 'subject', 'chapter', 'level'];

export interface IResultAnalytics {
  exam: IExam;
  questions: IQuestionOutcome[];
  counts: IResultCount;
  marksObtained: number;
  percent: number;
  accuracy: number;
  attempted: number;
  marks: IMarksSplit;
  timeSpentByMarking: IResultCount;
  /** Seconds per answered question; 0 when nothing was answered. */
  averageTime: number;
  /** The groupings worth a chart: those that split the paper into at least two groups. */
  groupings: Grouping[];
  groups: Record<Grouping, IOutcomeGroup[]>;
  insights: string[];
}

/**
 * Everything the result page shows, derived from the sitting and the stores it reads. A few
 * hundred questions at most, so it is recomputed on every render rather than memoised against
 * three stores' worth of dependencies.
 */
export const useResultAnalytics = (): IResultAnalytics | null => {
  const testPaperStore = useTestPaperLookups();
  const { getQuestionById } = useQuestionLookups();
  const { getSubjectById, getChapterById } = useStandardLookups();
  const { exam, getResultByQuestionId, getObtainedMarksByQuestionId, getTestPaperSectionById } = testPaperStore;
  if (!exam) return null;

  const sectionOf: Record<string, string> = {};
  Object.entries(exam.sectionWiseQuestionIdsMaps).forEach(([sectionId, questionIds]) => {
    questionIds.forEach((questionId) => {
      sectionOf[questionId] = sectionId;
    });
  });

  const questions: IQuestionOutcome[] = exam.questions.flatMap((questionId, index) => {
    const question = getQuestionById(questionId);
    if (!question) return [];
    const sectionId = sectionOf[questionId] ?? question.section;
    return [
      {
        id: questionId,
        number: index + 1,
        sectionId,
        sectionName: getTestPaperSectionById(sectionId)?.name ?? 'Paper',
        subjectName: (question.subject && getSubjectById(question.subject)?.name) || 'Other',
        chapterName: (question.chapter && getChapterById(question.chapter)?.name) || 'Other',
        levelName: question.level ? LEVEL_NAMES[question.level] : 'Unrated',
        marking: getResultByQuestionId(questionId),
        marks: getObtainedMarksByQuestionId(questionId),
        maxMarks: question.markings[Marking.CORRECT],
        timeSpent: exam.questionWiseSpendTime[questionId] ?? 0,
      },
    ];
  });

  const counts = countOutcomes(questions);
  const attempted = questions.length - counts[Marking.UNATTEMPTED];
  const marksObtained = Math.round(questions.reduce((sum, question) => sum + question.marks, 0) * 10) / 10;
  const answeredTime = questions
    .filter((question) => question.marking !== Marking.UNATTEMPTED)
    .reduce((sum, question) => sum + question.timeSpent, 0);

  const groups = GROUPINGS.reduce(
    (map, grouping) => ({ ...map, [grouping]: groupOutcomes(questions, grouping) }),
    {} as Record<Grouping, IOutcomeGroup[]>,
  );

  return {
    exam,
    questions,
    counts,
    marksObtained,
    percent: exam.maxMarks ? Math.round((marksObtained / exam.maxMarks) * 100) : 0,
    accuracy: getAccuracy(counts),
    attempted,
    marks: splitMarks(questions),
    timeSpentByMarking: timeByMarking(questions),
    averageTime: attempted ? Math.round(answeredTime / attempted) : 0,
    groupings: GROUPINGS.filter((grouping) => groups[grouping].length > 1),
    groups,
    insights: getInsights(questions, groups.subject),
  };
};
