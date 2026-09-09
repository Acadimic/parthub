import {
  type ChapterDto,
  type StandardDto,
  type StandardSubjectMappingDto,
  type SubjectDto,
} from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type ISelectItem, type IStandardSubjectQuery } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { ChapterService, CommonService, StandardService, SubjectService } from '../services';
import { STANDARD_GROUP_ORDER } from '../utils/constants';

/** The fetches this store tracks. */
type StandardFetch = 'standards' | 'subjects' | 'mappings' | 'chapters' | 'initialData' | 'publicData';

export interface IStandardState extends IRequestSlice<StandardFetch> {
  standardMap: Record<string, StandardDto>;
  subjectMap: Record<string, SubjectDto>;
  chapterMap: Record<string, ChapterDto>;
  mappingMap: Record<string, StandardSubjectMappingDto>;

  getStandardById: (standardId: string) => StandardDto | undefined;
  getSubjectById: (subjectId: string) => SubjectDto | undefined;
  getChapterById: (chapterId: string) => ChapterDto | undefined;
  getStandards: () => StandardDto[];
  getSubjects: () => SubjectDto[];
  getChapters: () => ChapterDto[];
  getStandardsByIds: (standardIds: string[]) => StandardDto[];
  getSubjectsByIds: (subjectIds: string[]) => SubjectDto[];
  getStandardSubjectMappings: (standardId: string) => StandardSubjectMappingDto[];
  getStandardSubjects: (standardId: string) => SubjectDto[];
  getStandardSubjectChapters: (standardId: string, subjectId: string) => ChapterDto[];
  getNextStandardGroupOrder: (standardId: string, group: string) => number;
  getStandardItems: () => ISelectItem[];

  addStandards: (standards: StandardDto[]) => void;
  addSubjects: (subjects: SubjectDto[]) => void;
  addChapters: (chapters: ChapterDto[]) => void;
  addStandardSubjectMappings: (mappings: StandardSubjectMappingDto[]) => void;
  removeStandardById: (standardId: string) => void;
  removeSubjectById: (subjectId: string) => void;
  removeChapterById: (chapterId: string) => void;
  removeStandardSubjectMappings: (mappings: StandardSubjectMappingDto[]) => void;

  loadStandards: () => Promise<void>;
  loadSubjects: () => Promise<void>;
  loadStandardSubjectMappings: () => Promise<void>;
  loadStandardSubjectChapters: (query: IStandardSubjectQuery) => Promise<void>;
  /** The reference data a signed-in learner needs, in one request. */
  loadInitialData: () => Promise<void>;
  /** The same, for a visitor who is not signed in. */
  loadPublicData: () => Promise<void>;
  reset: () => void;
}

const byOrder = (a: { order?: number }, b: { order?: number }): number => (a.order ?? 0) - (b.order ?? 0);

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

const removeById = <T>(map: Record<string, T>, id: string): Record<string, T> | undefined => {
  const { [id]: removed, ...rest } = map;
  return removed ? rest : undefined;
};

export const useStandardStore = create<IStandardState>()((set, get) => ({
  standardMap: {},
  subjectMap: {},
  chapterMap: {},
  mappingMap: {},
  ...createRequestSlice(['standards', 'subjects', 'mappings', 'chapters', 'initialData', 'publicData'], set, get),

  getStandardById: (standardId) => (standardId ? get().standardMap[standardId] : undefined),

  getSubjectById: (subjectId) => (subjectId ? get().subjectMap[subjectId] : undefined),

  getChapterById: (chapterId) => (chapterId ? get().chapterMap[chapterId] : undefined),

  getStandards: () => Object.values(get().standardMap).sort(byOrder),

  getSubjects: () => Object.values(get().subjectMap),

  getChapters: () => Object.values(get().chapterMap),

  getStandardsByIds: (standardIds) => {
    const { standardMap } = get();
    return standardIds.map((id) => standardMap[id]).filter((row): row is StandardDto => !!row);
  },

  getSubjectsByIds: (subjectIds) => {
    const { subjectMap } = get();
    return subjectIds.map((id) => subjectMap[id]).filter((row): row is SubjectDto => !!row);
  },

  getStandardSubjectMappings: (standardId) =>
    Object.values(get().mappingMap).filter((mapping) => mapping.standard === standardId),

  getStandardSubjects: (standardId) =>
    get().getSubjectsByIds(
      get()
        .getStandardSubjectMappings(standardId)
        .sort(byOrder)
        .map((mapping) => mapping.subject),
    ),

  getStandardSubjectChapters: (standardId, subjectId) =>
    get()
      .getChapters()
      .filter((chapter) => chapter.standard === standardId && chapter.subject === subjectId),

  getNextStandardGroupOrder: (standardId, group) => {
    const initialOrder = STANDARD_GROUP_ORDER[group];
    if (!initialOrder) return 0;
    const standards = get()
      .getStandards()
      .filter((standard) => standard.group === group && standard._id !== standardId);
    return standards.length + initialOrder;
  },

  getStandardItems: () =>
    get()
      .getStandards()
      .map((standard) => ({ label: standard.name, value: standard._id, group: standard.group })),

  addStandards: (standards) => {
    set((state) => ({ standardMap: { ...state.standardMap, ...keyById(standards) } }));
  },

  addSubjects: (subjects) => {
    set((state) => ({ subjectMap: { ...state.subjectMap, ...keyById(subjects) } }));
  },

  addChapters: (chapters) => {
    set((state) => ({ chapterMap: { ...state.chapterMap, ...keyById(chapters) } }));
  },

  addStandardSubjectMappings: (mappings) => {
    set((state) => ({ mappingMap: { ...state.mappingMap, ...keyById(mappings) } }));
  },

  removeStandardById: (standardId) => {
    set((state) => {
      const standardMap = removeById(state.standardMap, standardId);
      return standardMap ? { standardMap } : state;
    });
  },

  removeSubjectById: (subjectId) => {
    set((state) => {
      const subjectMap = removeById(state.subjectMap, subjectId);
      return subjectMap ? { subjectMap } : state;
    });
  },

  removeChapterById: (chapterId) => {
    set((state) => {
      const chapterMap = removeById(state.chapterMap, chapterId);
      return chapterMap ? { chapterMap } : state;
    });
  },

  removeStandardSubjectMappings: (mappings) => {
    if (!mappings.length) return;
    const removedIds = new Set(mappings.map((mapping) => mapping._id));
    set((state) => ({
      mappingMap: Object.fromEntries(
        Object.entries(state.mappingMap).filter(([mappingId]) => !removedIds.has(mappingId)),
      ),
    }));
  },

  loadStandards: () =>
    get().run('standards', async () => {
      const result = await StandardService.getStandards();
      if (result?.data) get().addStandards(result.data);
    }),

  loadSubjects: () =>
    get().run('subjects', async () => {
      const result = await SubjectService.getSubjects();
      if (result?.data) get().addSubjects(result.data);
    }),

  loadStandardSubjectMappings: () =>
    get().run('mappings', async () => {
      const result = await StandardService.getStandardSubjectMappings();
      if (result?.data) get().addStandardSubjectMappings(result.data);
    }),

  loadStandardSubjectChapters: (query) =>
    get().run('chapters', async () => {
      const result = await ChapterService.getStandardSubjectChapters(query);
      if (result?.data) get().addChapters(result.data);
    }),

  loadInitialData: () =>
    get().run('initialData', async () => {
      const result = await CommonService.getInitialData();
      if (!result?.data) return;
      const { standards, subjects, mappings } = result.data;
      get().addStandards(standards);
      get().addSubjects(subjects);
      get().addStandardSubjectMappings(mappings);
      // This used to read `data.collaborators` and `data.studentStandardMaps`, which the endpoint
      // has never sent: `undefined.forEach` threw, `isLoadedInitialData` never flipped, and `_app`
      // returned null for the whole app. Neither collection has a route the LEARN subdomain can
      // call -- `user/all` and `mapping/student-standard/all` are both TEACH-only -- so they are
      // not loaded here. `courseStore.loadCourses` depends on the student-standard mappings and
      // will return nothing until such a route exists.
    }),

  loadPublicData: () =>
    get().run('publicData', async () => {
      const result = await CommonService.getPublicData();
      if (!result?.data) return;
      // `common/public-data` returns standards and subjects only. This also read
      // `standardSubjectMappings` and `courses`, which it does not send.
      const { standards, subjects } = result.data;
      get().addStandards(standards);
      get().addSubjects(subjects);
    }),

  reset: () => {
    set({ standardMap: {}, subjectMap: {}, chapterMap: {}, mappingMap: {} });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the maps they read.
 *
 * A lookup is a stable function reference, so selecting one alone would never invalidate the
 * component when the row it reads changes. See decision 4 in the migration plan.
 */
export const useStandardLookups = (): IStandardState => useStandardStore(useShallow((state) => state));
