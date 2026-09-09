import {
  type ClientEntityWith,
  type IOptionFields,
  type IRequestSlice,
  type ISolutionFields,
  type MarkingType,
  type QuestionDto,
  createRequestSlice,
} from '@repo/shared';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { QuestionType } from '../enums';
import { QuestionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';

/**
 * A question in the store. `markings` is the client's `MarkingType` rather than the DTO's
 * `MarkingsDto`: the two agree on the three required keys, and this one also allows the optional
 * `partiallyCorrect` the exam marking reads. `isBonus` and `topic` are client-only and stripped
 * from every request by `CLIENT_ONLY_KEYS`.
 */
export type IQuestion = ClientEntityWith<
  QuestionDto,
  'question' | 'standard' | 'options' | 'questionType' | 'section' | 'year'
> & { markings: MarkingType; isBonus?: boolean; topic?: string | null };
export type IOption = IOptionFields & { isNew?: boolean };
export type ISolution = ISolutionFields & { isNew?: boolean };

/** The fetches this store tracks. */
type QuestionFetch = 'questions';

export interface IQuestionState extends IRequestSlice<QuestionFetch> {
  questionMap: Record<string, IQuestion>;
  optionMap: Record<string, IOption>;
  solutionMap: Record<string, ISolution>;

  getQuestionById: (questionId: string) => IQuestion | undefined;
  getOptionById: (optionId: string) => IOption | undefined;
  getSolutionById: (solutionId: string) => ISolution | undefined;
  getQuestions: () => IQuestion[];
  getOptions: () => IOption[];
  getSolutions: () => ISolution[];
  getQuestionsByIds: (questionIds: string[]) => IQuestion[];
  getOptionsByIds: (optionIds: string[]) => IOption[];
  getQuestionsBySectionId: (sectionId: string) => IQuestion[];
  getQuestionsBySectionIds: (sectionIds: string[]) => IQuestion[];
  getSolutionByQuestionId: (questionId: string) => ISolution | undefined;
  /** A question's options. Was the `optionObjects` view on the model. */
  getQuestionOptions: (questionId: string) => IOption[];
  /** The options marked correct. Was the `correctOptions` view on the model. */
  getCorrectOptions: (questionId: string) => IOption[];
  /** The positions of the correct options. Was the `correctOptionIndexes` view. */
  getCorrectOptionIndexes: (questionId: string) => number[];
  /** A question's options as select items. Was the `optionItems` view. */
  getOptionItems: (questionId: string) => ISelectItem[];

  addQuestions: (questions: IQuestion[]) => void;
  addOptions: (options: IOption[]) => void;
  addSolutions: (solutions: ISolution[]) => void;
  patchQuestion: (questionId: string, fields: Partial<IQuestion>) => void;
  patchOption: (optionId: string, fields: Partial<IOption>) => void;
  removeQuestionById: (questionId: string) => void;
  removeOptionById: (optionId: string) => void;

  createOption: (questionId: string, option?: string, isCorrect?: boolean) => IOption;
  /** The starting options for a question type: two for boolean, four for choice, one otherwise. */
  getNewOptions: (questionId: string, questionType: QuestionType) => IOption[];

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
    return questionIds.map((id) => questionMap[id]).filter((row): row is IQuestion => !!row);
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
          .filter((question) => sectionIds.includes(question.section))
      : [],

  getSolutionByQuestionId: (questionId) =>
    questionId
      ? get()
          .getSolutions()
          .find((solution) => solution.question === questionId)
      : undefined,

  getQuestionOptions: (questionId) => {
    const question = get().getQuestionById(questionId);
    return question ? get().getOptionsByIds(question.options) : [];
  },

  getCorrectOptions: (questionId) =>
    get()
      .getQuestionOptions(questionId)
      .filter((option) => option.isCorrect),

  getCorrectOptionIndexes: (questionId) =>
    get()
      .getQuestionOptions(questionId)
      .reduce<number[]>((indexes, option, index) => {
        if (option.isCorrect) indexes.push(index);
        return indexes;
      }, []),

  getOptionItems: (questionId) =>
    get()
      .getQuestionOptions(questionId)
      .map((option) => ({ label: option.option, value: option._id })),

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

  getNewOptions: (questionId, questionType) => {
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
export const useSelectedQuestion = (): IQuestion | undefined => {
  const selectedQuestionId = useSelectorStore((state) => state.selectedQuestionId);
  return useQuestionStore((state) => (selectedQuestionId ? state.questionMap[selectedQuestionId] : undefined));
};
