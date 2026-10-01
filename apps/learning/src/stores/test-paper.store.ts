import { type TestPaperDto, type TestPaperResultDto, type TestPaperSectionDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { Marking } from '../enums';
import { ReactionService, TestPaperService } from '../services';
import { getMinutesString, onceInFlight } from '../utils/helpers';
import { useQuestionStore } from './question.store';
import { markResponse, toResultPayload } from './exam.marking';
import { buildExam } from './exam.sitting';
import { useSelectorStore } from './selector.store';

/**
 * A test paper in the store. `reactionsCount` and `isLoadedReactionsCount` are client-only and are
 * stripped from every request by `CLIENT_ONLY_KEYS`.
 */
export type ITestPaper = TestPaperDto & {
  reactionsCount?: number;
  isLoadedReactionsCount?: boolean;
  isLoadingReactionsCount?: boolean;
};

export type ITestPaperSection = TestPaperSectionDto &
  Required<Pick<TestPaperSectionDto, 'defaultMarkings' | 'sectionCategory'>> & { isNew?: boolean };

export * from './exam.types';
import { type IExam, type IResultCount, type ISummaryCount } from './exam.types';

/** The fetches this store tracks. */
type TestPaperFetch = 'testPapers' | 'testPaperSections' | 'exam' | 'results' | 'submitResult';

export interface ITestPaperState extends IRequestSlice<TestPaperFetch> {
  testPaperMap: Record<string, ITestPaper>;
  testPaperSectionMap: Record<string, ITestPaperSection>;
  /** The sitting in progress, or `null` between exams. */
  exam: IExam | null;
  /** The learner's saved sittings, by id. */
  resultMap: Record<string, TestPaperResultDto>;

  getTestPaperById: (testPaperId: string) => ITestPaper | undefined;
  getTestPaperSectionById: (sectionId: string) => ITestPaperSection | undefined;
  getTestPapers: () => ITestPaper[];
  getTestPaperSections: () => ITestPaperSection[];
  getTestPapersByIds: (testPaperIds: string[]) => ITestPaper[];
  getTestPaperSectionsByIds: (sectionIds: string[]) => ITestPaperSection[];
  getTestPapersByStandardIds: (standardIds: string[]) => ITestPaper[];

  addTestPapers: (testPapers: ITestPaper[]) => void;
  addTestPaperSections: (sections: ITestPaperSection[]) => void;
  patchTestPaper: (testPaperId: string, fields: Partial<ITestPaper>) => void;
  removeTestPaper: (testPaperId: string) => void;
  removeTestPaperCategory: (sectionId: string) => void;
  /** Fetches a paper's reaction count into its row. Was `loadReactionsCount` on the model. */
  loadReactionsCount: (testPaperId: string) => Promise<void>;

  loadTestPapers: () => Promise<void>;
  loadTestPaperSectionsWithQuestions: (testPaperId: string) => Promise<void>;

  // ---- the exam sitting ----
  /** Loads a paper and builds a fresh sitting from it. */
  loadAndSetExam: (testPaperId: string, isPractice: boolean) => Promise<void>;
  unsetExam: () => void;
  patchExam: (fields: Partial<IExam>) => void;
  getResponsesByQuestionId: (questionId: string) => string[];
  getAnswersByQuestionId: (questionId: string) => string[];
  getResultByQuestionId: (questionId: string) => Marking;
  getReplyTimeByQuestionId: (questionId: string) => number;
  getTimeSpendByQuestionId: (questionId: string) => number;
  getQuestionIdsBySectionId: (sectionId: string) => string[];
  getQuestionIndexByQuestionId: (questionId: string) => number;
  /** The marks the learner earned on a question, splitting them when partially correct. */
  getObtainedMarksByQuestionId: (questionId: string) => number;
  isMarkedForReview: (questionId: string) => boolean;
  isVisited: (questionId: string) => boolean;
  isResponded: (questionId: string) => boolean;
  /** Whether the answer may be revealed: after submission, or in practice once fully answered. */
  canShowAnswer: (questionId: string) => boolean;
  setVisited: (questionId: string) => void;
  /** Records the learner's picks for the selected question and re-marks it. */
  setResponse: (responses: string[]) => void;
  clearResponse: () => void;
  resetResponse: () => void;
  selectNextQuestion: () => void;
  selectPrevQuestion: () => void;
  toggleSelectedQuestionMarkForReview: () => void;
  /** Adds a second to the selected question, and to its reply time while it is still unanswered. */
  increaseSelectedQuestionTimeSpend: () => void;
  /** Marks the sitting submitted and saves it; the server's marking then replaces the client's. */
  submitExam: () => Promise<void>;
  addResults: (results: TestPaperResultDto[]) => void;
  loadMyResults: () => Promise<void>;
  /** The learner's real attempts at a paper, newest first — practice sittings are left out. */
  getMyAttemptsByTestPaperId: (testPaperId: string) => TestPaperResultDto[];
  getSummaryCounts: () => ISummaryCount;
  getResultCounts: () => IResultCount;
  getMarksObtained: () => number;
  getAttemptedCount: () => number;
  getCurrentQuestionIndex: () => number;
  getTimeLeft: () => number;
  getPercentage: () => number;
  getAccuracy: () => number;
  isFirstQuestion: () => boolean;
  isLastQuestion: () => boolean;
  isSelectedQuestionMarkedForReview: () => boolean;
  isSelectedQuestionResponded: () => boolean;
  isSelectedQuestionCompleted: () => boolean;
  getSelectedQuestionReplyTime: () => string;

  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

const selectedQuestionId = (): string => useSelectorStore.getState().selectedQuestionId;

/**
 * Which `loadAndSetExam` call is the current one. The layout's mount effect runs twice in
 * development, and both runs fetch; without this the slower one finished a second or two after the
 * first and replaced the sitting with a fresh one, wiping whatever the learner had answered.
 */
let examLoadToken = 0;

export const useTestPaperStore = create<ITestPaperState>()((set, get) => ({
  testPaperMap: {},
  testPaperSectionMap: {},
  exam: null,
  resultMap: {},
  ...createRequestSlice(['testPapers', 'testPaperSections', 'exam', 'results', 'submitResult'], set, get),

  getTestPaperById: (testPaperId) => (testPaperId ? get().testPaperMap[testPaperId] : undefined),

  getTestPaperSectionById: (sectionId) => (sectionId ? get().testPaperSectionMap[sectionId] : undefined),

  getTestPapers: () => Object.values(get().testPaperMap),

  getTestPaperSections: () => Object.values(get().testPaperSectionMap),

  getTestPapersByIds: (testPaperIds) => {
    const { testPaperMap } = get();
    return testPaperIds.map((id) => testPaperMap[id]).filter((row): row is ITestPaper => !!row);
  },

  getTestPaperSectionsByIds: (sectionIds) => {
    const { testPaperSectionMap } = get();
    return sectionIds.map((id) => testPaperSectionMap[id]).filter((row): row is ITestPaperSection => !!row);
  },

  getTestPapersByStandardIds: (standardIds) =>
    get()
      .getTestPapers()
      .filter((testPaper) => (testPaper.standards ?? []).some((standardId) => standardIds.includes(standardId))),

  addTestPapers: (testPapers) => {
    set((state) => ({ testPaperMap: { ...state.testPaperMap, ...keyById(testPapers) } }));
  },

  addTestPaperSections: (sections) => {
    set((state) => ({ testPaperSectionMap: { ...state.testPaperSectionMap, ...keyById(sections) } }));
  },

  patchTestPaper: (testPaperId, fields) => {
    set((state) => {
      const testPaper = state.testPaperMap[testPaperId];
      if (!testPaper) return state;
      return { testPaperMap: { ...state.testPaperMap, [testPaperId]: { ...testPaper, ...fields } } };
    });
  },

  removeTestPaper: (testPaperId) => {
    set((state) => {
      const { [testPaperId]: removed, ...testPaperMap } = state.testPaperMap;
      return removed ? { testPaperMap } : state;
    });
  },

  removeTestPaperCategory: (sectionId) => {
    set((state) => {
      const { [sectionId]: removed, ...testPaperSectionMap } = state.testPaperSectionMap;
      return removed ? { testPaperSectionMap } : state;
    });
  },

  loadReactionsCount: async (testPaperId) => {
    if (!testPaperId) return;
    get().patchTestPaper(testPaperId, { isLoadingReactionsCount: true });
    const result = await ReactionService.getReactionsCount(testPaperId);
    get().patchTestPaper(testPaperId, {
      reactionsCount: result?.data ?? 0,
      isLoadedReactionsCount: true,
      isLoadingReactionsCount: false,
    });
  },

  loadTestPapers: () =>
    get().run('testPapers', async () => {
      const result = await TestPaperService.getTestPapers();
      if (result?.data) get().addTestPapers(result.data);
    }),

  loadTestPaperSectionsWithQuestions: (testPaperId) =>
    onceInFlight(`testPaperSections:${testPaperId}`, () =>
      get().run('testPaperSections', async () => {
        // The course on screen, when there is one: a paper in a course another organization
        // published is only readable through that course.
        const courseId = useSelectorStore.getState().selectedCourseId || undefined;
        const result = await TestPaperService.getTestPaperSectionsWithQuestions(testPaperId, courseId);
        if (!result?.data) return;
        const { sections, questions } = result.data;
        get().addTestPaperSections(sections);
        // The questions arrive with the sections, so this store fills the question store — a one-way
        // write between stores, which needs no subscription.
        const questionStore = useQuestionStore.getState();
        questionStore.addQuestions(questions);
      }),
    ),

  loadAndSetExam: (testPaperId, isPractice) =>
    onceInFlight(`exam:${testPaperId}:${isPractice}`, async () => {
      examLoadToken += 1;
      const token = examLoadToken;
      await get().run('exam', async () => {
        set({ exam: null });
        await get().loadTestPaperSectionsWithQuestions(testPaperId);
        // A newer load has started since; its sitting is the one that counts.
        if (token !== examLoadToken) return;
        const testPaper = get().getTestPaperById(testPaperId);
        if (!testPaper) return;
        const exam = buildExam(testPaperId, testPaper, isPractice);
        if (exam) set({ exam });
      });
      // A newer load is still running: its finish sets the final status, not this stale one's,
      // which would otherwise read as "loaded" with no sitting for a moment.
      if (token !== examLoadToken) get().setRequest('exam', { status: 'loading' });
    }),

  unsetExam: () => {
    set({ exam: null });
    get().setRequest('exam', { status: 'idle' });
  },

  patchExam: (fields) => {
    set((state) => (state.exam ? { exam: { ...state.exam, ...fields } } : state));
  },

  getResponsesByQuestionId: (questionId) => get().exam?.responseMaps[questionId] ?? [],

  getAnswersByQuestionId: (questionId) => get().exam?.answerMaps[questionId] ?? [],

  getResultByQuestionId: (questionId) => get().exam?.resultMaps[questionId] ?? Marking.UNATTEMPTED,

  getReplyTimeByQuestionId: (questionId) => get().exam?.questionWiseReplyTime[questionId] ?? 0,

  getTimeSpendByQuestionId: (questionId) => get().exam?.questionWiseSpendTime[questionId] ?? 0,

  getQuestionIdsBySectionId: (sectionId) => get().exam?.sectionWiseQuestionIdsMaps[sectionId] ?? [],

  getQuestionIndexByQuestionId: (questionId) => get().exam?.questions.indexOf(questionId) ?? -1,

  getObtainedMarksByQuestionId: (questionId) => {
    const question = useQuestionStore.getState().getQuestionById(questionId);
    if (!question) return 0;
    const markings = question.markings;
    // A bonus question awards full marks however it was answered.
    if (question.isBonus) return markings[Marking.CORRECT];
    const result = get().getResultByQuestionId(questionId);
    const marks = markings[result];
    if (result === Marking.PARTIALLY_CORRECT && marks == null) {
      // No explicit partial mark, so split the correct mark across the options answered.
      const correctCount = useQuestionStore.getState().getCorrectOptions(questionId).length;
      if (!correctCount) return 0;
      const ratio = markings[Marking.CORRECT] / correctCount;
      const responded = get().getResponsesByQuestionId(questionId).length;
      return Math.round(ratio * responded * 100) / 100;
    }
    return marks ?? 0;
  },

  isMarkedForReview: (questionId) => !!get().exam?.markedForReviews.includes(questionId),

  isVisited: (questionId) => !!get().exam?.visited.includes(questionId),

  isResponded: (questionId) => get().getResponsesByQuestionId(questionId).length > 0,

  canShowAnswer: (questionId) => {
    const exam = get().exam;
    if (!exam) return false;
    if (exam.isSubmitted) return true;
    if (!exam.isPractice) return false;
    return get().getResponsesByQuestionId(questionId).length === get().getAnswersByQuestionId(questionId).length;
  },

  setVisited: (questionId) => {
    const exam = get().exam;
    if (!exam || exam.visited.includes(questionId)) return;
    get().patchExam({ visited: [...exam.visited, questionId] });
  },

  setResponse: (responses) => {
    const questionId = selectedQuestionId();
    const exam = get().exam;
    if (!exam || !questionId) return;
    const answers = get().getAnswersByQuestionId(questionId);
    // Mark it in the same breath as recording the response, which is what `setResult` did.
    // The server marks the same way on submit (`test-paper-result.marking.ts`).
    const result = markResponse(questionId, responses, answers);
    get().patchExam({
      responseMaps: { ...exam.responseMaps, [questionId]: responses },
      resultMaps: { ...exam.resultMaps, [questionId]: result },
    });
  },

  clearResponse: () => {
    const questionId = selectedQuestionId();
    const exam = get().exam;
    if (!exam || !questionId) return;
    get().patchExam({
      // The reply clock stops where the question's own clock is.
      questionWiseReplyTime: {
        ...exam.questionWiseReplyTime,
        [questionId]: exam.questionWiseSpendTime[questionId] ?? 0,
      },
      responseMaps: { ...exam.responseMaps, [questionId]: [] },
      resultMaps: { ...exam.resultMaps, [questionId]: Marking.UNATTEMPTED },
    });
  },

  resetResponse: () => {
    const questionId = selectedQuestionId();
    const exam = get().exam;
    if (!exam || !questionId) return;
    get().patchExam({
      questionWiseReplyTime: { ...exam.questionWiseReplyTime, [questionId]: 0 },
      questionWiseSpendTime: { ...exam.questionWiseSpendTime, [questionId]: 0 },
      responseMaps: { ...exam.responseMaps, [questionId]: [] },
      resultMaps: { ...exam.resultMaps, [questionId]: Marking.UNATTEMPTED },
    });
  },

  selectNextQuestion: () => {
    const exam = get().exam;
    if (!exam) return;
    const index = exam.questions.indexOf(selectedQuestionId());
    const nextId = index > -1 ? exam.questions[index + 1] : undefined;
    if (!nextId) return;
    get().setVisited(nextId);
    useSelectorStore.getState().setSelectedQuestionId(nextId);
  },

  selectPrevQuestion: () => {
    const exam = get().exam;
    if (!exam) return;
    const index = exam.questions.indexOf(selectedQuestionId());
    const prevId = index > 0 ? exam.questions[index - 1] : undefined;
    if (!prevId) return;
    get().setVisited(prevId);
    useSelectorStore.getState().setSelectedQuestionId(prevId);
  },

  toggleSelectedQuestionMarkForReview: () => {
    const questionId = selectedQuestionId();
    const exam = get().exam;
    if (!exam || !questionId) return;
    const marked = exam.markedForReviews.includes(questionId);
    get().patchExam({
      markedForReviews: marked
        ? exam.markedForReviews.filter((id) => id !== questionId)
        : [...exam.markedForReviews, questionId],
    });
  },

  increaseSelectedQuestionTimeSpend: () => {
    const questionId = selectedQuestionId();
    const exam = get().exam;
    if (!exam || !questionId) return;
    const timeSpend = (exam.questionWiseSpendTime[questionId] ?? 0) + 1;
    const responses = get().getResponsesByQuestionId(questionId);
    const answers = get().getAnswersByQuestionId(questionId);
    get().patchExam({
      totalSpendTime: exam.totalSpendTime + 1,
      questionWiseSpendTime: { ...exam.questionWiseSpendTime, [questionId]: timeSpend },
      // The reply clock only runs while the question is still short of a full answer.
      ...(responses.length < answers.length
        ? { questionWiseReplyTime: { ...exam.questionWiseReplyTime, [questionId]: timeSpend } }
        : {}),
    });
  },

  submitExam: () =>
    get().run('submitResult', async () => {
      const exam = get().exam;
      if (!exam) return;
      get().patchExam({ isSubmitted: true });
      const payload = toResultPayload(exam, get().getMarksObtained());
      const result = await TestPaperService.upsertTestPaperResult(payload);
      if (!result?.data) return;
      get().addResults([result.data]);
      // The server marked the sitting from the stored questions; its verdict is the one shown.
      get().patchExam({ resultMaps: result.data.resultMaps, answerMaps: result.data.answerMaps });
    }),

  addResults: (results) => {
    set((state) => ({ resultMap: { ...state.resultMap, ...keyById(results) } }));
  },

  loadMyResults: () =>
    get().run('results', async () => {
      const result = await TestPaperService.getMyTestPaperResults();
      if (result?.data) get().addResults(result.data);
    }),

  getMyAttemptsByTestPaperId: (testPaperId) =>
    Object.values(get().resultMap)
      .filter((row) => row.testPaper === testPaperId && !row.isPractice && !row._deleted)
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? '')),

  getSummaryCounts: () => {
    const exam = get().exam;
    if (!exam) {
      return { notVisited: 0, notAnswered: 0, answered: 0, markedForReview: 0, answeredAndMarkedForReview: 0 };
    }
    const answered = Object.values(exam.responseMaps).filter((responses) => responses.length > 0).length;
    return {
      notVisited: exam.numberOfQuestions - exam.visited.length,
      notAnswered: exam.visited.length - answered,
      answered,
      markedForReview: exam.markedForReviews.length,
      answeredAndMarkedForReview: exam.markedForReviews.filter((questionId) => get().isResponded(questionId)).length,
    };
  },

  getResultCounts: () => {
    const counts: IResultCount = {
      [Marking.CORRECT]: 0,
      [Marking.PARTIALLY_CORRECT]: 0,
      [Marking.INCORRECT]: 0,
      [Marking.UNATTEMPTED]: 0,
    };
    Object.values(get().exam?.resultMaps ?? {}).forEach((result) => {
      counts[result] += 1;
    });
    return counts;
  },

  getMarksObtained: () => {
    const resultMaps = get().exam?.resultMaps ?? {};
    return Object.keys(resultMaps).reduce((total, questionId) => {
      const question = useQuestionStore.getState().getQuestionById(questionId);
      const marks = question?.markings[get().getResultByQuestionId(questionId)];
      return marks ? total + marks : total;
    }, 0);
  },

  getAttemptedCount: () =>
    Object.values(get().exam?.responseMaps ?? {}).filter((responses) => responses.length > 0).length,

  getCurrentQuestionIndex: () => get().getQuestionIndexByQuestionId(selectedQuestionId()),

  getTimeLeft: () => {
    const exam = get().exam;
    return exam ? exam.durationMins * 60 - exam.totalSpendTime : 0;
  },

  getPercentage: () => {
    const maxMarks = get().exam?.maxMarks ?? 0;
    return maxMarks ? Math.round((get().getMarksObtained() / maxMarks) * 100) : 0;
  },

  getAccuracy: () => {
    const counts = get().getResultCounts();
    const total = counts[Marking.CORRECT] + counts[Marking.INCORRECT];
    return total ? Math.round((counts[Marking.CORRECT] / total) * 100) : 0;
  },

  isFirstQuestion: () => get().getCurrentQuestionIndex() === 0,

  isLastQuestion: () => {
    const exam = get().exam;
    return !!exam && get().getCurrentQuestionIndex() === exam.questions.length - 1;
  },

  isSelectedQuestionMarkedForReview: () => get().isMarkedForReview(selectedQuestionId()),

  isSelectedQuestionResponded: () => get().isResponded(selectedQuestionId()),

  isSelectedQuestionCompleted: () => get().canShowAnswer(selectedQuestionId()),

  getSelectedQuestionReplyTime: () => {
    const questionId = selectedQuestionId();
    const seconds = get().getReplyTimeByQuestionId(questionId);
    return get().isSelectedQuestionCompleted() ? getMinutesString(seconds) : '';
  },

  reset: () => {
    set({ testPaperMap: {}, testPaperSectionMap: {}, exam: null });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the state they read.
 *
 * Everything about the sitting depends on which question is selected, and the marking reads the
 * question store, so this subscribes to all three — otherwise moving between questions would leave
 * the exam UI stale.
 */
export const useTestPaperLookups = (): ITestPaperState => {
  useSelectorStore(useShallow((state) => state.selectedQuestionId));
  useQuestionStore(useShallow((state) => state.questionMap));
  return useTestPaperStore(useShallow((state) => state));
};

/** The selected test paper, or `undefined`. Replaces `selectorStore.selectedTestPaper`. */
export const useSelectedTestPaper = (): ITestPaper | undefined => {
  const selectedTestPaperId = useSelectorStore((state) => state.selectedTestPaperId);
  return useTestPaperStore((state) => (selectedTestPaperId ? state.testPaperMap[selectedTestPaperId] : undefined));
};

/** The selected section, or `undefined`. Replaces `selectorStore.selectedTestPaperSection`. */
export const useSelectedTestPaperSection = (): ITestPaperSection | undefined => {
  const selectedId = useSelectorStore((state) => state.selectedTestPaperSectionId);
  return useTestPaperStore((state) => (selectedId ? state.testPaperSectionMap[selectedId] : undefined));
};

/** The sitting in progress, subscribed. */
export const useExam = (): IExam | null => useTestPaperStore((state) => state.exam);
