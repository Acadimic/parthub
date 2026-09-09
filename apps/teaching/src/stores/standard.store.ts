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
import { useSelectorStore } from './selector.store';
import { STANDARD_GROUP_ORDER } from '../utils/constants';
import { getObjectId } from '../utils/helpers';

/** The fetches this store tracks. `run`, `isLoading` and friends accept only these names. */
type StandardFetch = 'standards' | 'subjects' | 'mappings' | 'chapters' | 'initialData';

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
  /** The subject ids mapped to a standard, in mapping order. Was the `subjects` view on the model. */
  getStandardSubjectIds: (standardId: string) => string[];
  getStandardSubjects: (standardId: string) => SubjectDto[];
  getStandardSubjectChapters: (standardId: string, subjectId: string) => ChapterDto[];
  getNextStandardGroupOrder: (standardId: string, group: string) => number;
  getStandardItems: () => ISelectItem[];
  /** The given standards as grouped select items — a subset of `getStandardItems`. */
  getStandardItemsByIds: (standardIds: string[]) => ISelectItem[];
  /** A standard/subject's chapters as select items. */
  getChapterItems: (standardId: string, subjectId: string) => ISelectItem[];
  /** These standards' names as one comma-separated label, for a table cell or a detail line. */
  getStandardNamesText: (standardIds: string[]) => string;
  /** These subjects' names as one comma-separated label. */
  getSubjectNamesText: (subjectIds: string[]) => string;
  /** A standard's subjects as select items, led by a "None" entry. Was a view on the model. */
  getStandardSubjectItems: (standardId: string) => ISelectItem[];
  getStandardsSubjectItems: (standardIds: string[]) => ISelectItem[];

  addStandards: (standards: StandardDto[]) => void;
  addSubjects: (subjects: SubjectDto[]) => void;
  addChapters: (chapters: ChapterDto[]) => void;
  addStandardSubjectMappings: (mappings: StandardSubjectMappingDto[]) => void;

  patchChapter: (chapterId: string, fields: Partial<ChapterDto>) => void;
  removeChapterById: (chapterId: string) => void;

  /** Adds an unsaved chapter and returns it, for the caller to select. */
  createChapter: (standardId: string, subjectId: string) => ChapterDto;

  loadStandards: () => Promise<void>;
  loadSubjects: () => Promise<void>;
  loadStandardSubjectMappings: () => Promise<void>;
  loadStandardSubjectChapters: (query: IStandardSubjectQuery) => Promise<void>;
  loadOrgChapters: () => Promise<void>;
  /** All three reference collections in one request — what the sidebar loads after sign-in. */
  loadInitialData: () => Promise<void>;

  reset: () => void;
}

const byOrder = (a: { order?: number }, b: { order?: number }): number => (a.order ?? 0) - (b.order ?? 0);

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useStandardStore = create<IStandardState>()((set, get) => ({
  standardMap: {},
  subjectMap: {},
  chapterMap: {},
  mappingMap: {},
  ...createRequestSlice(['standards', 'subjects', 'mappings', 'chapters', 'initialData'], set, get),

  getStandardById: (standardId) => (standardId ? get().standardMap[standardId] : undefined),

  getSubjectById: (subjectId) => (subjectId ? get().subjectMap[subjectId] : undefined),

  getChapterById: (chapterId) => (chapterId ? get().chapterMap[chapterId] : undefined),

  getStandards: () => Object.values(get().standardMap).sort(byOrder),

  getSubjects: () => Object.values(get().subjectMap),

  getChapters: () => Object.values(get().chapterMap),

  getStandardsByIds: (standardIds) => {
    const { standardMap } = get();
    return standardIds.map((standardId) => standardMap[standardId]).filter((row): row is StandardDto => !!row);
  },

  getSubjectsByIds: (subjectIds) => {
    const { subjectMap } = get();
    return subjectIds.map((subjectId) => subjectMap[subjectId]).filter((row): row is SubjectDto => !!row);
  },

  getStandardSubjectMappings: (standardId) =>
    Object.values(get().mappingMap).filter((mapping) => mapping.standard === standardId),

  getStandardSubjectIds: (standardId) =>
    get()
      .getStandardSubjectMappings(standardId)
      .sort(byOrder)
      .map((mapping) => mapping.subject),

  getStandardSubjects: (standardId) => get().getSubjectsByIds(get().getStandardSubjectIds(standardId)),

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
    get().getStandardItemsByIds(
      get()
        .getStandards()
        .map((standard) => standard._id),
    ),

  getStandardItemsByIds: (standardIds) =>
    get()
      .getStandardsByIds(standardIds)
      .map((standard) => ({ label: standard.name, value: standard._id, group: standard.group })),

  getChapterItems: (standardId, subjectId) =>
    get()
      .getStandardSubjectChapters(standardId, subjectId)
      .map((chapter) => ({ label: chapter.name, value: chapter._id })),

  getStandardNamesText: (standardIds) =>
    get()
      .getStandardsByIds(standardIds)
      .map((standard) => standard.name)
      .join(', '),

  getSubjectNamesText: (subjectIds) =>
    get()
      .getSubjectsByIds(subjectIds)
      .map((subject) => subject.name)
      .join(', '),

  getStandardSubjectItems: (standardId) => {
    const items: ISelectItem[] = [{ label: 'None', value: '' }];
    get()
      .getStandardSubjects(standardId)
      .forEach((subject) => {
        if (!items.some((item) => item.value === subject._id)) {
          items.push({ label: subject.name, value: subject._id });
        }
      });
    return items;
  },

  getStandardsSubjectItems: (standardIds) => {
    const subjectIds = get()
      .getStandardsByIds(standardIds)
      .flatMap((standard) => get().getStandardSubjectIds(standard._id));
    return get()
      .getSubjectsByIds([...new Set(subjectIds)])
      .map((subject) => ({ label: subject.name, value: subject._id }));
  },

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

  patchChapter: (chapterId, fields) => {
    set((state) => {
      const chapter = state.chapterMap[chapterId];
      if (!chapter) return state;
      return { chapterMap: { ...state.chapterMap, [chapterId]: { ...chapter, ...fields } } };
    });
  },

  removeChapterById: (chapterId) => {
    set((state) => {
      const { [chapterId]: removed, ...chapterMap } = state.chapterMap;
      return removed ? { chapterMap } : state;
    });
  },

  createChapter: (standardId, subjectId) => {
    // No `org` / `createdBy` stamped here: they are optional on a draft and the server's
    // change-tracking plugin overwrites whatever a client sends anyway.
    const chapter: ChapterDto = {
      _id: getObjectId(),
      name: '',
      standard: standardId,
      subject: subjectId,
      order: get().getStandardSubjectChapters(standardId, subjectId).length,
      isNew: true,
    };
    get().addChapters([chapter]);
    return chapter;
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

  loadOrgChapters: () =>
    get().run('chapters', async () => {
      const result = await ChapterService.getOrgChapters();
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
    }),

  reset: () => {
    set({ standardMap: {}, subjectMap: {}, chapterMap: {}, mappingMap: {} });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the maps they read.
 *
 * A lookup such as `getStandardById` is a stable function reference, so selecting one on its own
 * would never invalidate the component when the row it reads changes — the screen would go stale
 * with nothing to show for it. This subscribes to every reference map as well, which is what makes
 * a lookup safe to call during render.
 *
 * The whole state is the selector's result, shallow-compared: every write in this store replaces a
 * top-level key (a map, or `requests`), so a shallow compare sees all of them. Returning the
 * snapshot rather than `getState()` also keeps the render consistent with what React subscribed to.
 *
 * The maps are loaded once after sign-in and rarely change, so this costs nothing in practice. For a
 * lookup in an event handler use `useStandardStore.getState()` instead: no subscription is wanted
 * there.
 */
export const useStandardLookups = (): IStandardState => useStandardStore(useShallow((state) => state));

/** The selected standard, or `undefined`. Replaces `selectorStore.selectedStandard`. */
export const useSelectedStandard = (): StandardDto | undefined => {
  const selectedStandardId = useSelectorStore((state) => state.selectedStandardId);
  return useStandardStore((state) => (selectedStandardId ? state.standardMap[selectedStandardId] : undefined));
};

/** The selected subject, or `undefined`. Replaces `selectorStore.selectedSubject`. */
export const useSelectedSubject = (): SubjectDto | undefined => {
  const selectedSubjectId = useSelectorStore((state) => state.selectedSubjectId);
  return useStandardStore((state) => (selectedSubjectId ? state.subjectMap[selectedSubjectId] : undefined));
};

/** The selected chapter, or `undefined`. Replaces `selectorStore.selectedChapter`. */
export const useSelectedChapter = (): ChapterDto | undefined => {
  const selectedChapterId = useSelectorStore((state) => state.selectedChapterId);
  return useStandardStore((state) => (selectedChapterId ? state.chapterMap[selectedChapterId] : undefined));
};
