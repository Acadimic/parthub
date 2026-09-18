import { type QuestionDto, type TestPaperDto, type TestPaperSectionDto } from '@repo/shared/contracts';
import { type DefaultMarkingType } from '@repo/shared/interfaces';
import { type IRequestSlice, createEmptyRichText, createRequestSlice } from '@repo/shared/utils';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PaperCategoryType, PaperType, type SectionCategoryType, type SectionType } from '../enums';
import { TestPaperService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useQuestionStore } from './question.store';
import { useStandardStore } from './standard.store';
import { useSelectorStore } from './selector.store';

/**
 * A section in the store. `defaultMarkings` and `sectionCategory` are required here because the
 * model declared them so and every screen reads them, so each read narrows before use.
 */
export type ITestPaperSection = TestPaperSectionDto &
  Required<Pick<TestPaperSectionDto, 'defaultMarkings' | 'sectionCategory'>>;

/** The fetches this store tracks. */
type TestPaperFetch = 'testPapers' | 'testPaperSections';

export interface ITestPaperState extends IRequestSlice<TestPaperFetch> {
  testPaperMap: Record<string, TestPaperDto>;
  testPaperSectionMap: Record<string, ITestPaperSection>;

  getTestPaperById: (testPaperId: string) => TestPaperDto | undefined;
  getTestPaperSectionById: (sectionId: string) => ITestPaperSection | undefined;
  getTestPapers: () => TestPaperDto[];
  getTestPaperSections: () => ITestPaperSection[];
  getTestPapersByIds: (testPaperIds: string[]) => TestPaperDto[];
  getTestPaperSectionsByIds: (sectionIds: string[]) => ITestPaperSection[];
  getTestPapersByStandardIds: (standardIds: string[]) => TestPaperDto[];
  /** A section's questions. Was the `questions` view on the section model. */
  getSectionQuestions: (sectionId: string) => QuestionDto[];
  /** A paper's subjects as select items. Was a view on the model. */
  getTestPaperSubjectItems: (testPaperId: string) => ISelectItem[];
  /** A paper's standards as select items. Was a view on the model. */
  getTestPaperStandardItems: (testPaperId: string) => ISelectItem[];

  addTestPapers: (testPapers: TestPaperDto[]) => void;
  addTestPaperSections: (sections: ITestPaperSection[]) => void;
  patchTestPaper: (testPaperId: string, fields: Partial<TestPaperDto>) => void;
  patchTestPaperSection: (sectionId: string, fields: Partial<ITestPaperSection>) => void;
  removeTestPaper: (testPaperId: string) => void;
  removeTestPaperSection: (sectionId: string) => void;

  /** Adds an unsaved test paper and returns it, for the caller to select. */
  createTestPaper: () => TestPaperDto;
  /** Adds an unsaved section and returns it, for the caller to select. */
  createTestPaperSection: (
    sectionType: SectionType,
    sectionCategory: SectionCategoryType,
    defaultMarkings: DefaultMarkingType,
    /** Required by the server, so it is set at creation rather than patched in afterwards. */
    name: string,
  ) => ITestPaperSection;

  loadTestPapers: () => Promise<void>;
  /** Loads a paper's sections and, with them, the questions/options/solutions they contain. */
  loadTestPaperSectionsWithQuestions: (testPaperId: string) => Promise<void>;
  /**
   * Re-reads one paper, for the totals the server recomputed.
   *
   * Deliberately outside `run`: the `testPapers` request is the list screen's own fetch state, and
   * flipping it to `loading` after a question save would blank the detail screen it was called
   * from. Nothing renders a spinner for this — the totals simply arrive.
   */
  reloadTestPaper: (testPaperId: string) => Promise<void>;
  /** Soft-deletes a paper on the server, then drops it from the store. */
  deleteTestPaper: (testPaperId: string) => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useTestPaperStore = create<ITestPaperState>()((set, get) => ({
  testPaperMap: {},
  testPaperSectionMap: {},
  ...createRequestSlice(['testPapers', 'testPaperSections'], set, get),

  getTestPaperById: (testPaperId) => (testPaperId ? get().testPaperMap[testPaperId] : undefined),

  getTestPaperSectionById: (sectionId) => (sectionId ? get().testPaperSectionMap[sectionId] : undefined),

  getTestPapers: () => Object.values(get().testPaperMap),

  getTestPaperSections: () => Object.values(get().testPaperSectionMap),

  getTestPapersByIds: (testPaperIds) => {
    const { testPaperMap } = get();
    return testPaperIds.map((id) => testPaperMap[id]).filter((row): row is TestPaperDto => !!row);
  },

  getTestPaperSectionsByIds: (sectionIds) => {
    const { testPaperSectionMap } = get();
    return sectionIds.map((id) => testPaperSectionMap[id]).filter((row): row is ITestPaperSection => !!row);
  },

  getTestPapersByStandardIds: (standardIds) =>
    get()
      .getTestPapers()
      .filter((testPaper) => (testPaper.standards ?? []).some((standardId) => standardIds.includes(standardId))),

  getSectionQuestions: (sectionId) => useQuestionStore.getState().getQuestionsBySectionId(sectionId),

  getTestPaperSubjectItems: (testPaperId) => {
    const testPaper = get().getTestPaperById(testPaperId);
    if (!testPaper) return [];
    return useStandardStore
      .getState()
      .getSubjectsByIds(testPaper.subjects ?? [])
      .map((subject) => ({ label: subject.name, value: subject._id }));
  },

  getTestPaperStandardItems: (testPaperId) => {
    const testPaper = get().getTestPaperById(testPaperId);
    if (!testPaper) return [];
    return useStandardStore.getState().getStandardItemsByIds(testPaper.standards ?? []);
  },

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

  patchTestPaperSection: (sectionId, fields) => {
    set((state) => {
      const section = state.testPaperSectionMap[sectionId];
      if (!section) return state;
      return { testPaperSectionMap: { ...state.testPaperSectionMap, [sectionId]: { ...section, ...fields } } };
    });
  },

  removeTestPaper: (testPaperId) => {
    set((state) => {
      const { [testPaperId]: removed, ...testPaperMap } = state.testPaperMap;
      return removed ? { testPaperMap } : state;
    });
  },

  removeTestPaperSection: (sectionId) => {
    set((state) => {
      const { [sectionId]: removed, ...testPaperSectionMap } = state.testPaperSectionMap;
      return removed ? { testPaperSectionMap } : state;
    });
  },

  createTestPaper: () => {
    const testPaper: TestPaperDto = {
      _id: getObjectId(),
      name: '',
      slug: '',
      standards: [],
      sections: [],
      paperType: PaperType.QUIZ,
      subjects: [],
      totalQuestions: 0,
      durationMins: 60,
      year: new Date().getFullYear(),
      maxMarks: 0,
      instruction: createEmptyRichText(),
      paperCategory: PaperCategoryType.CUSTOM,
      isPublished: false,
      webLink: '',
      appLink: '',
      isNew: true,
    };
    get().addTestPapers([testPaper]);
    return testPaper;
  },

  createTestPaperSection: (sectionType, sectionCategory, defaultMarkings, name) => {
    const section: ITestPaperSection = {
      _id: getObjectId(),
      name,
      sectionType,
      sectionCategory,
      defaultMarkings,
      isNew: true,
    };
    get().addTestPaperSections([section]);
    return section;
  },

  loadTestPapers: () =>
    get().run('testPapers', async () => {
      const result = await TestPaperService.getTestPapers();
      if (result?.data) get().addTestPapers(result.data);
    }),

  loadTestPaperSectionsWithQuestions: (testPaperId) =>
    get().run('testPaperSections', async () => {
      const result = await TestPaperService.getTestPaperSectionsWithQuestions(testPaperId);
      if (!result?.data) return;
      const { sections, questions } = result.data;
      get().addTestPaperSections(sections);
      // The questions come back with the sections, so this store fills the question store. A
      // one-way write between stores, which needs no subscription.
      const questionStore = useQuestionStore.getState();
      // Options and the solution arrive embedded in each question, so there is nothing else to
      // distribute — two arrays where there used to be four.
      questionStore.addQuestions(questions);
    }),

  reloadTestPaper: async (testPaperId) => {
    if (!testPaperId) return;
    const result = await TestPaperService.getTestPaperById(testPaperId);
    // `callAuthApi` resolves with `{ data: undefined }` when the caller opted out of the throw, so
    // the guard is what keeps an undefined row out of the keyed map.
    if (result?.data) get().addTestPapers([result.data]);
  },

  deleteTestPaper: async (testPaperId) => {
    const testPaper = get().getTestPaperById(testPaperId);
    if (!testPaper) return;
    // A draft has never reached the server, so there is nothing to soft-delete — dropping the local
    // row is the whole operation.
    if (!testPaper.isNew) await TestPaperService.upsertTestPaper({ ...testPaper, _deleted: true });
    get().removeTestPaper(testPaperId);
  },

  reset: () => {
    set({ testPaperMap: {}, testPaperSectionMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useTestPaperLookups = (): ITestPaperState => {
  // `getSectionQuestions` and the item builders read the question and standard stores.
  useQuestionStore(useShallow((state) => state.questionMap));
  useStandardStore(useShallow((state) => [state.standardMap, state.subjectMap]));
  return useTestPaperStore(useShallow((state) => state));
};

/** The selected test paper, or `undefined`. Replaces `selectorStore.selectedTestPaper`. */
export const useSelectedTestPaper = (): TestPaperDto | undefined => {
  const selectedTestPaperId = useSelectorStore((state) => state.selectedTestPaperId);
  return useTestPaperStore((state) => (selectedTestPaperId ? state.testPaperMap[selectedTestPaperId] : undefined));
};

/** The selected section, or `undefined`. Replaces `selectorStore.selectedTestPaperSection`. */
export const useSelectedTestPaperSection = (): ITestPaperSection | undefined => {
  const selectedId = useSelectorStore((state) => state.selectedTestPaperSectionId);
  return useTestPaperStore((state) => (selectedId ? state.testPaperSectionMap[selectedId] : undefined));
};
