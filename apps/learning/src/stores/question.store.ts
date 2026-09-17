import { type OptionDto, type QuestionDto } from '@repo/shared/contracts';
import { type IRichText, type MarkingType } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { QuestionService } from '../services';
import { useSelectorStore } from './selector.store';

/**
 * A question in the store. `markings` is the client's `MarkingType` rather than the DTO's
 * `MarkingsDto`: the two agree on the three required keys, and this one also allows the optional
 * `partiallyCorrect` the exam marking reads. `isBonus` and `topic` are client-only and stripped
 * from every request by `CLIENT_ONLY_KEYS`.
 */
export type IQuestion = QuestionDto & { markings: MarkingType; isBonus?: boolean; topic?: string | null };
/** An option is an embedded field of its question now, not an entity of its own. */
export type IOption = OptionDto;

/** The fetches this store tracks. */
type QuestionFetch = 'questions';

export interface IQuestionState extends IRequestSlice<QuestionFetch> {
  questionMap: Record<string, IQuestion>;

  getQuestionById: (questionId: string) => IQuestion | undefined;
  getQuestions: () => IQuestion[];
  getQuestionsByIds: (questionIds: string[]) => IQuestion[];
  getQuestionsBySectionId: (sectionId: string) => IQuestion[];
  getQuestionsBySectionIds: (sectionIds: string[]) => IQuestion[];
  /** The question's solution body, or `undefined`. Embedded, so no lookup by id. */
  getSolutionByQuestionId: (questionId: string) => IRichText | undefined;
  /** A question's options. Was the `optionObjects` view on the model. */
  getQuestionOptions: (questionId: string) => IOption[];
  /** The options marked correct. Was the `correctOptions` view on the model. */
  getCorrectOptions: (questionId: string) => IOption[];
  /** The positions of the correct options. Was the `correctOptionIndexes` view. */
  getCorrectOptionIndexes: (questionId: string) => number[];
  /** A question's options as select items. Was the `optionItems` view. */
  getOptionItems: (questionId: string) => ISelectItem[];

  addQuestions: (questions: IQuestion[]) => void;
  patchQuestion: (questionId: string, fields: Partial<IQuestion>) => void;
  removeQuestionById: (questionId: string) => void;

  loadQuestions: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useQuestionStore = create<IQuestionState>()((set, get) => ({
  questionMap: {},
  ...createRequestSlice(['questions'], set, get),

  getQuestionById: (questionId) => (questionId ? get().questionMap[questionId] : undefined),

  getQuestions: () => Object.values(get().questionMap),

  getQuestionsByIds: (questionIds) => {
    const { questionMap } = get();
    return questionIds.map((id) => questionMap[id]).filter((row): row is IQuestion => !!row);
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
          .filter((question) => !!question.section && sectionIds.includes(question.section))
      : [],

  getSolutionByQuestionId: (questionId) => get().getQuestionById(questionId)?.solution?.body,

  getQuestionOptions: (questionId) => get().getQuestionById(questionId)?.options ?? [],

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
      .map((option) => ({ label: option.body.text, value: option._id })),

  addQuestions: (questions) => {
    set((state) => ({ questionMap: { ...state.questionMap, ...keyById(questions) } }));
  },

  patchQuestion: (questionId, fields) => {
    set((state) => {
      const question = state.questionMap[questionId];
      if (!question) return state;
      return { questionMap: { ...state.questionMap, [questionId]: { ...question, ...fields } } };
    });
  },

  removeQuestionById: (questionId) => {
    set((state) => {
      const { [questionId]: removed, ...questionMap } = state.questionMap;
      return removed ? { questionMap } : state;
    });
  },

  loadQuestions: () =>
    get().run('questions', async () => {
      const result = await QuestionService.getQuestions();
      if (result?.data) get().addQuestions(result.data);
    }),

  reset: () => {
    set({ questionMap: {} });
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
