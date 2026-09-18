import { type OptionDto, type QuestionDto } from '@repo/shared/contracts';
import { type IRichText } from '@repo/shared/interfaces';
import { type IRequestSlice, createEmptyRichText, createRequestSlice, richTextFromMarkdown } from '@repo/shared/utils';
import { type ICreateQuestion, type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { QuestionType } from '../enums';
import { QuestionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';

/** The fetches this store tracks. */
type QuestionFetch = 'questions';

/**
 * Questions, and only questions.
 *
 * Options and the solution used to be entities here, in two parallel keyed maps with their own
 * create, patch, remove and "unsaved rows" getters — roughly half this file — because the server
 * stored them in their own collections and the client had to reassemble them. They are embedded
 * fields of a question now, so they are edited through `patchQuestion` like any other field and the
 * maps are gone.
 */
export interface IQuestionState extends IRequestSlice<QuestionFetch> {
  questionMap: Record<string, QuestionDto>;

  getQuestionById: (questionId: string) => QuestionDto | undefined;
  getQuestions: () => QuestionDto[];
  getQuestionsByIds: (questionIds: string[]) => QuestionDto[];
  getQuestionsBySectionId: (sectionId: string) => QuestionDto[];
  getQuestionsBySectionIds: (sectionIds: string[]) => QuestionDto[];
  /** A question's options as select items. */
  getOptionItems: (questionId: string) => ISelectItem[];
  /** Rows the user has created and not yet saved — what an upsert posts. */
  getNewQuestions: () => QuestionDto[];

  addQuestions: (questions: QuestionDto[]) => void;
  patchQuestion: (questionId: string, fields: Partial<QuestionDto>) => void;
  removeQuestionById: (questionId: string) => void;

  /** Edits one embedded option in place. */
  patchOption: (questionId: string, optionId: string, fields: Partial<OptionDto>) => void;
  addOption: (questionId: string) => void;
  removeOption: (questionId: string, optionId: string) => void;
  setSolution: (questionId: string, body: IRichText) => void;
  /**
   * Changes a question's type, rebuilding its options when the answer *shape* changes.
   *
   * The rule lives here rather than in the picker because it is about what a question is, not about
   * the control: single- and multiple-choice share a shape, so switching between them keeps the
   * options the author has already written; anything else starts again.
   */
  setQuestionType: (questionId: string, questionType: QuestionType) => void;

  /** The next free position in a section, or in a subsection when one is given. */
  getNextOrder: (section: string, subsection?: string) => number;
  /** Adds an unsaved question with its starting options and returns it, for the caller to select. */
  createQuestion: (payload: ICreateQuestion) => QuestionDto;

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

const createOption = (body?: IRichText, isCorrect = false): OptionDto => ({
  _id: getObjectId(),
  body: body ?? createEmptyRichText(),
  isCorrect,
});

/**
 * A boolean question's two options, whose text is fixed rather than authored.
 *
 * They used to be seeded blank, which left the answer step showing two unlabelled radios and no
 * editor anywhere to fill them in — the type was excluded from the option editors on purpose,
 * because "True" and "False" are not the author's to write.
 */
const BOOLEAN_OPTION_LABELS = ['True', 'False'];

/** The starting options for a question type: two for boolean, four for choice, one otherwise. */
const createOptionsForQuestionType = (questionType: QuestionType): OptionDto[] => {
  if (questionType === QuestionType.BOOLEAN) {
    return BOOLEAN_OPTION_LABELS.map((label) => createOption(richTextFromMarkdown(label)));
  }
  if (questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE) {
    return Array.from({ length: CHOICE_OPTION_COUNT }, () => createOption());
  }
  // Anything else is answered directly, so its single option is the correct one.
  return [createOption(undefined, true)];
};

export const useQuestionStore = create<IQuestionState>()((set, get) => ({
  questionMap: {},
  ...createRequestSlice(['questions'], set, get),

  getQuestionById: (questionId) => (questionId ? get().questionMap[questionId] : undefined),

  getQuestions: () => Object.values(get().questionMap),

  getQuestionsByIds: (questionIds) => {
    const { questionMap } = get();
    return questionIds.map((id) => questionMap[id]).filter((row): row is QuestionDto => !!row);
  },

  getQuestionsBySectionId: (sectionId) => (sectionId ? get().getQuestionsBySectionIds([sectionId]) : []),

  getQuestionsBySectionIds: (sectionIds) =>
    sectionIds.length
      ? get()
          .getQuestions()
          .filter((question) => question.section && sectionIds.includes(question.section))
          // `order` is the authority, not insertion order — the server sorts by it too.
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      : [],

  getOptionItems: (questionId) =>
    (get().getQuestionById(questionId)?.options ?? []).map((option) => ({
      label: option.body.text,
      value: option._id,
    })),

  getNewQuestions: () =>
    get()
      .getQuestions()
      .filter((question) => question.isNew),

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

  patchOption: (questionId, optionId, fields) => {
    const question = get().getQuestionById(questionId);
    if (!question) return;
    get().patchQuestion(questionId, {
      options: (question.options ?? []).map((option) => (option._id === optionId ? { ...option, ...fields } : option)),
    });
  },

  addOption: (questionId) => {
    const question = get().getQuestionById(questionId);
    if (!question) return;
    get().patchQuestion(questionId, { options: [...(question.options ?? []), createOption()] });
  },

  removeOption: (questionId, optionId) => {
    const question = get().getQuestionById(questionId);
    if (!question) return;
    get().patchQuestion(questionId, {
      options: (question.options ?? []).filter((option) => option._id !== optionId),
    });
  },

  setSolution: (questionId, body) => get().patchQuestion(questionId, { solution: { body } }),

  setQuestionType: (questionId, questionType) => {
    const question = get().getQuestionById(questionId);
    if (!question) return;
    const isChoice = (type?: QuestionType) =>
      type === QuestionType.SINGLE_CHOICE || type === QuestionType.MULTIPLE_CHOICE;
    const keepsOptions = isChoice(questionType) && isChoice(question.questionType);
    get().patchQuestion(questionId, {
      questionType,
      options: keepsOptions
        ? (question.options ?? []).map((option) => ({ ...option, isCorrect: false }))
        : createOptionsForQuestionType(questionType),
    });
  },

  getNextOrder: (section, subsection) => {
    // Position is within the subsection when there is one, otherwise within the section — the same
    // rule the server's `{ section: 1, order: 1 }` index sorts by.
    const siblings = get()
      .getQuestionsBySectionIds([section])
      .filter((question) => (question.subsection ?? undefined) === (subsection ?? undefined));
    return siblings.reduce((highest, question) => Math.max(highest, question.order ?? 0), -1) + 1;
  },

  createQuestion: (payload) => {
    const question: QuestionDto = {
      _id: getObjectId(),
      body: createEmptyRichText(),
      options: createOptionsForQuestionType(payload.questionType),
      year: new Date().getFullYear(),
      isNew: true,
      ...payload,
      // After the spread: the caller supplies where the question goes, never its position.
      order: get().getNextOrder(payload.section, payload.subsection),
    };
    get().addQuestions([question]);
    return question;
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

/** The selected question, or `undefined`. */
export const useSelectedQuestion = (): QuestionDto | undefined => {
  const selectedQuestionId = useSelectorStore((state) => state.selectedQuestionId);
  return useQuestionStore((state) => (selectedQuestionId ? state.questionMap[selectedQuestionId] : undefined));
};
