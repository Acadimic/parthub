import { type QuestionDto } from '@repo/shared/contracts';
import { type IOptionFields, type ISolutionFields } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type ICreateQuestion, type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { QuestionType } from '../enums';
import { QuestionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';

export type IOption = IOptionFields & { isNew?: boolean };
export type ISolution = ISolutionFields & { isNew?: boolean };

/** The fetches this store tracks. */
type QuestionFetch = 'questions';

export interface IQuestionState extends IRequestSlice<QuestionFetch> {
  questionMap: Record<string, QuestionDto>;
  optionMap: Record<string, IOption>;
  solutionMap: Record<string, ISolution>;

  getQuestionById: (questionId: string) => QuestionDto | undefined;
  getOptionById: (optionId: string) => IOption | undefined;
  getSolutionById: (solutionId: string) => ISolution | undefined;
  getQuestions: () => QuestionDto[];
  getOptions: () => IOption[];
  getSolutions: () => ISolution[];
  getQuestionsByIds: (questionIds: string[]) => QuestionDto[];
  getOptionsByIds: (optionIds: string[]) => IOption[];
  getQuestionsBySectionId: (sectionId: string) => QuestionDto[];
  getQuestionsBySectionIds: (sectionIds: string[]) => QuestionDto[];
  getSolutionByQuestionId: (questionId: string) => ISolution | undefined;
  /** A question's options as select items. Was the `optionItems` view on the model. */
  getOptionItems: (questionId: string) => ISelectItem[];
  /** Rows the user has created and not yet saved — what an upsert posts. */
  getNewQuestions: () => QuestionDto[];
  getNewOptions: () => IOption[];
  getNewSolutions: () => ISolution[];

  addQuestions: (questions: QuestionDto[]) => void;
  addOptions: (options: IOption[]) => void;
  addSolutions: (solutions: ISolution[]) => void;
  patchQuestion: (questionId: string, fields: Partial<QuestionDto>) => void;
  patchOption: (optionId: string, fields: Partial<IOption>) => void;
  patchSolution: (solutionId: string, fields: Partial<ISolution>) => void;
  removeQuestionById: (questionId: string) => void;
  removeOptionById: (optionId: string) => void;
  removeSolutionById: (solutionId: string) => void;

  createOption: (questionId: string, option?: string, isCorrect?: boolean) => IOption;
  /** The starting options for a question type: two for boolean, four for choice, one otherwise. */
  createOptionsForQuestionType: (questionId: string, questionType: QuestionType) => IOption[];
  /** Adds an unsaved question with its options and returns it, for the caller to select. */
  createQuestion: (payload: ICreateQuestion) => QuestionDto;
  /** Returns the question's solution, creating an empty one first if it has none. */
  upsertSolution: (questionId: string, solution?: string) => ISolution;

  loadQuestions: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

/** How many options a single- or multiple-choice question starts with. */
const CHOICE_OPTION_COUNT = 4;

export const useQuestionStore = create<IQuestionState>()((set, get) => ({
  questionMap: {},
  optionMap: {},
  solutionMap: {},
  ...createRequestSlice(['questions'], set, get),

  getQuestionById: (questionId) => (questionId ? get().questionMap[questionId] : undefined),

  getOptionById: (optionId) => (optionId ? get().optionMap[optionId] : undefined),

  getSolutionById: (solutionId) => (solutionId ? get().solutionMap[solutionId] : undefined),

  getQuestions: () => Object.values(get().questionMap),

  getOptions: () => Object.values(get().optionMap),

  getSolutions: () => Object.values(get().solutionMap),

  getQuestionsByIds: (questionIds) => {
    const { questionMap } = get();
    return questionIds.map((id) => questionMap[id]).filter((row): row is QuestionDto => !!row);
  },

  getOptionsByIds: (optionIds) => {
    const { optionMap } = get();
    return optionIds.map((id) => optionMap[id]).filter((row): row is IOption => !!row);
  },

  getQuestionsBySectionId: (sectionId) =>
    sectionId
      ? get()
          .getQuestions()
          .filter((question) => question.section === sectionId)
      : [],

  getQuestionsBySectionIds: (sectionIds) =>
    sectionIds.length
      ? get()
          .getQuestions()
          .filter((question) => question.section && sectionIds.includes(question.section))
      : [],

  getSolutionByQuestionId: (questionId) =>
    questionId
      ? get()
          .getSolutions()
          .find((solution) => solution.question === questionId)
      : undefined,

  getOptionItems: (questionId) => {
    const question = get().getQuestionById(questionId);
    if (!question) return [];
    return get()
      .getOptionsByIds(question.options ?? [])
      .map((option) => ({ label: option.option, value: option._id }));
  },

  getNewQuestions: () =>
    get()
      .getQuestions()
      .filter((question) => question.isNew),

  getNewOptions: () =>
    get()
      .getOptions()
      .filter((option) => option.isNew),

  getNewSolutions: () =>
    get()
      .getSolutions()
      .filter((solution) => solution.isNew),

  addQuestions: (questions) => {
    set((state) => ({ questionMap: { ...state.questionMap, ...keyById(questions) } }));
  },

  addOptions: (options) => {
    set((state) => ({ optionMap: { ...state.optionMap, ...keyById(options) } }));
  },

  addSolutions: (solutions) => {
    set((state) => ({ solutionMap: { ...state.solutionMap, ...keyById(solutions) } }));
  },

  patchQuestion: (questionId, fields) => {
    set((state) => {
      const question = state.questionMap[questionId];
      if (!question) return state;
      return { questionMap: { ...state.questionMap, [questionId]: { ...question, ...fields } } };
    });
  },

  patchOption: (optionId, fields) => {
    set((state) => {
      const option = state.optionMap[optionId];
      if (!option) return state;
      return { optionMap: { ...state.optionMap, [optionId]: { ...option, ...fields } } };
    });
  },

  patchSolution: (solutionId, fields) => {
    set((state) => {
      const solution = state.solutionMap[solutionId];
      if (!solution) return state;
      return { solutionMap: { ...state.solutionMap, [solutionId]: { ...solution, ...fields } } };
    });
  },

  removeQuestionById: (questionId) => {
    set((state) => {
      const { [questionId]: removed, ...questionMap } = state.questionMap;
      return removed ? { questionMap } : state;
    });
  },

  removeOptionById: (optionId) => {
    set((state) => {
      const { [optionId]: removed, ...optionMap } = state.optionMap;
      return removed ? { optionMap } : state;
    });
  },

  removeSolutionById: (solutionId) => {
    set((state) => {
      const { [solutionId]: removed, ...solutionMap } = state.solutionMap;
      return removed ? { solutionMap } : state;
    });
  },

  createOption: (questionId, option, isCorrect) => {
    const row: IOption = {
      _id: getObjectId(),
      option: option ?? '',
      question: questionId,
      isCorrect: isCorrect ?? false,
      isNew: true,
    };
    get().addOptions([row]);
    return row;
  },

  createOptionsForQuestionType: (questionId, questionType) => {
    const { createOption } = get();
    if (questionType === QuestionType.BOOLEAN) {
      return [createOption(questionId, 'True'), createOption(questionId, 'False')];
    }
    if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE) {
      return Array.from({ length: CHOICE_OPTION_COUNT }, () => createOption(questionId));
    }
    // Anything else is answered directly, so its single option is the correct one.
    return [createOption(questionId, '', true)];
  },

  createQuestion: (payload) => {
    const questionId = getObjectId();
    const options = get().createOptionsForQuestionType(questionId, payload.questionType);
    const question: QuestionDto = {
      _id: questionId,
      question: '',
      options: options.map((option) => option._id),
      year: new Date().getFullYear(),
      isNew: true,
      ...payload,
    };
    get().addQuestions([question]);
    return question;
  },

  upsertSolution: (questionId, solution) => {
    const existing = get().getSolutionByQuestionId(questionId);
    if (existing) return existing;
    const row: ISolution = { _id: getObjectId(), solution: solution ?? '', question: questionId, isNew: true };
    get().addSolutions([row]);
    return row;
  },

  loadQuestions: () =>
    get().run('questions', async () => {
      const result = await QuestionService.getQuestions();
      if (result?.data) get().addQuestions(result.data);
    }),

  reset: () => {
    set({ questionMap: {}, optionMap: {}, solutionMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useQuestionLookups = (): IQuestionState => useQuestionStore(useShallow((state) => state));

/** The selected question, or `undefined`. Replaces `selectorStore.selectedQuestion`. */
export const useSelectedQuestion = (): QuestionDto | undefined => {
  const selectedQuestionId = useSelectorStore((state) => state.selectedQuestionId);
  return useQuestionStore((state) => (selectedQuestionId ? state.questionMap[selectedQuestionId] : undefined));
};

/** The selected solution, or `undefined`. Replaces `selectorStore.selectedSolution`. */
export const useSelectedSolution = (): ISolution | undefined => {
  const selectedSolutionId = useSelectorStore((state) => state.selectedSolutionId);
  return useQuestionStore((state) => (selectedSolutionId ? state.solutionMap[selectedSolutionId] : undefined));
};
