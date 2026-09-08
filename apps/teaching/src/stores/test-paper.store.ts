import {
  type ClientEntity,
  type DefaultMarkingType,
  type IRequestSlice,
  type ITestPaperSectionFields,
  type TestPaperDto,
  createRequestSlice,
} from '@repo/shared';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { PaperType, type SectionCategoryType, type SectionType } from '../enums';
import { TestPaperService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useQuestionStore } from './question.store';
import { useSelectorStore } from './selector.store';

export type ITestPaper = ClientEntity<TestPaperDto>;
export type ITestPaperSection = ITestPaperSectionFields & { isNew?: boolean };

/** The fetches this store tracks. */
type TestPaperFetch = 'testPapers' | 'testPaperSections';

export interface ITestPaperState extends IRequestSlice<TestPaperFetch> {
  testPaperMap: Record<string, ITestPaper>;
  testPaperSectionMap: Record<string, ITestPaperSection>;

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
  patchTestPaperSection: (sectionId: string, fields: Partial<ITestPaperSection>) => void;
  removeTestPaper: (testPaperId: string) => void;
  removeTestPaperSection: (sectionId: string) => void;

  /** Adds an unsaved test paper and returns it, for the caller to select. */
  createTestPaper: () => ITestPaper;
  /** Adds an unsaved section and returns it, for the caller to select. */
  createTestPaperSection: (
    sectionType: SectionType,
    sectionCategory: SectionCategoryType,
    defaultMarkings: DefaultMarkingType,
  ) => ITestPaperSection;

  loadTestPapers: () => Promise<void>;
  /** Loads a paper's sections and, with them, the questions/options/solutions they contain. */
  loadTestPaperSectionsWithQuestions: (testPaperId: string) => Promise<void>;
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
    const testPaper: ITestPaper = {
      _id: getObjectId(),
      name: '',
      slug: '',
      standards: [],
      sections: [],
      paperType: PaperType.QUIZ,
      isNew: true,
    };
    get().addTestPapers([testPaper]);
    return testPaper;
  },

  createTestPaperSection: (sectionType, sectionCategory, defaultMarkings) => {
    const section: ITestPaperSection = {
      _id: getObjectId(),
      name: '',
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
      const { sections, questions, options, solutions } = result.data;
      get().addTestPaperSections(sections);
      // The questions come back with the sections, so this store fills the question store. A
      // one-way write between stores, which needs no subscription.
      const questionStore = useQuestionStore.getState();
      questionStore.addQuestions(questions);
      questionStore.addOptions(options);
      questionStore.addSolutions(solutions);
    }),

  reset: () => {
    set({ testPaperMap: {}, testPaperSectionMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useTestPaperLookups = (): ITestPaperState => useTestPaperStore(useShallow((state) => state));

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
