import { type StandardDto, type StandardSubjectMappingDto, type SubjectDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { create } from 'zustand';
import { CommonService, StandardService, SubjectService } from '../services';
import { STANDARD_GROUP_ORDER } from '../utils/constants';
import { getObjectId, getSlug } from '../utils/helpers';

/** The fetches this store tracks. `run`, `isLoading` and friends accept only these names. */
type StandardFetch = 'standards' | 'subjects' | 'mappings' | 'initialData';

export interface IStandardState extends IRequestSlice<StandardFetch> {
  standardMap: Record<string, StandardDto>;
  subjectMap: Record<string, SubjectDto>;
  mappingMap: Record<string, StandardSubjectMappingDto>;

  getStandardById: (standardId: string) => StandardDto | undefined;
  getSubjectById: (subjectId: string) => SubjectDto | undefined;
  getStandards: () => StandardDto[];
  getSubjects: () => SubjectDto[];
  getSubjectsByIds: (subjectIds: string[]) => SubjectDto[];
  getStandardSubjectMappings: (standardId: string) => StandardSubjectMappingDto[];
  /** The subject ids mapped to a standard, in mapping order. Was the `subjects` view on the model. */
  getStandardSubjectIds: (standardId: string) => string[];
  /** The distinct reference standards across a standard's mappings. Was a view on the model. */
  getReferenceStandardIds: (standardId: string) => string[];
  getNextStandardGroupOrder: (standardId: string, group: string) => number;
  /** Every standard's subject names as one comma-separated label, keyed by standard id. */
  getSubjectNamesByStandard: () => Record<string, string>;

  addStandards: (standards: StandardDto[]) => void;
  addSubjects: (subjects: SubjectDto[]) => void;
  addStandardSubjectMappings: (mappings: StandardSubjectMappingDto[]) => void;

  patchStandard: (standardId: string, fields: Partial<StandardDto>) => void;
  patchSubject: (subjectId: string, fields: Partial<SubjectDto>) => void;
  /** Renames a standard and keeps its slug in step — the model's `setName` did both. */
  renameStandard: (standardId: string, name: string) => void;
  renameSubject: (subjectId: string, name: string) => void;
  setReferenceStandards: (standardId: string, referenceStandardIds: string[]) => void;

  removeStandard: (standardId: string) => void;
  removeSubject: (subjectId: string) => void;
  removeStandardSubjectMappings: (mappings: StandardSubjectMappingDto[]) => void;

  /** Adds an unsaved standard and returns its id, for the caller to select. */
  createStandard: () => string;
  /** Adds an unsaved subject and returns its id, for the caller to select. */
  createSubject: () => string;
  createStandardSubjectMapping: (standardId: string, subjectId: string) => void;

  loadStandards: () => Promise<void>;
  loadSubjects: () => Promise<void>;
  loadStandardSubjectMappings: () => Promise<void>;
  /** All three collections in one request — what `_app` loads once after sign-in. */
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
  mappingMap: {},
  ...createRequestSlice(['standards', 'subjects', 'mappings', 'initialData'], set, get),

  getStandardById: (standardId) => (standardId ? get().standardMap[standardId] : undefined),

  getSubjectById: (subjectId) => (subjectId ? get().subjectMap[subjectId] : undefined),

  getStandards: () => Object.values(get().standardMap).sort(byOrder),

  getSubjects: () => Object.values(get().subjectMap),

  getSubjectsByIds: (subjectIds) => {
    const { subjectMap } = get();
    return subjectIds.map((subjectId) => subjectMap[subjectId]).filter((subject): subject is SubjectDto => !!subject);
  },

  getStandardSubjectMappings: (standardId) =>
    Object.values(get().mappingMap).filter((mapping) => mapping.standard === standardId),

  getStandardSubjectIds: (standardId) =>
    get()
      .getStandardSubjectMappings(standardId)
      .sort(byOrder)
      .map((mapping) => mapping.subject),

  getReferenceStandardIds: (standardId) => {
    const referenceStandards = get()
      .getStandardSubjectMappings(standardId)
      .sort(byOrder)
      .flatMap((mapping) => mapping.referenceStandards ?? []);
    return [...new Set(referenceStandards)];
  },

  getNextStandardGroupOrder: (standardId, group) => {
    const initialOrder = STANDARD_GROUP_ORDER[group];
    if (!initialOrder) return 0;
    const standards = get()
      .getStandards()
      .filter((standard) => standard.group === group && standard._id !== standardId);
    return standards.length + initialOrder;
  },

  getSubjectNamesByStandard: () =>
    get()
      .getStandards()
      .reduce<Record<string, string>>((names, standard) => {
        names[standard._id] = get()
          .getSubjectsByIds(get().getStandardSubjectIds(standard._id))
          .map((subject) => subject.name)
          .join(', ');
        return names;
      }, {}),

  addStandards: (standards) => {
    set((state) => ({ standardMap: { ...state.standardMap, ...keyById(standards) } }));
  },

  addSubjects: (subjects) => {
    set((state) => ({ subjectMap: { ...state.subjectMap, ...keyById(subjects) } }));
  },

  addStandardSubjectMappings: (mappings) => {
    set((state) => ({ mappingMap: { ...state.mappingMap, ...keyById(mappings) } }));
  },

  patchStandard: (standardId, fields) => {
    set((state) => {
      const standard = state.standardMap[standardId];
      if (!standard) return state;
      return { standardMap: { ...state.standardMap, [standardId]: { ...standard, ...fields } } };
    });
  },

  patchSubject: (subjectId, fields) => {
    set((state) => {
      const subject = state.subjectMap[subjectId];
      if (!subject) return state;
      return { subjectMap: { ...state.subjectMap, [subjectId]: { ...subject, ...fields } } };
    });
  },

  renameStandard: (standardId, name) => {
    get().patchStandard(standardId, { name, slug: getSlug(name) });
  },

  renameSubject: (subjectId, name) => {
    get().patchSubject(subjectId, { name, slug: getSlug(name) });
  },

  setReferenceStandards: (standardId, referenceStandardIds) => {
    const mappings = get().getStandardSubjectMappings(standardId);
    set((state) => ({
      mappingMap: {
        ...state.mappingMap,
        ...keyById(mappings.map((mapping) => ({ ...mapping, referenceStandards: referenceStandardIds }))),
      },
    }));
  },

  removeStandard: (standardId) => {
    set((state) => {
      const { [standardId]: removed, ...standardMap } = state.standardMap;
      return removed ? { standardMap } : state;
    });
  },

  removeSubject: (subjectId) => {
    set((state) => {
      const { [subjectId]: removed, ...subjectMap } = state.subjectMap;
      return removed ? { subjectMap } : state;
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

  createStandard: () => {
    const standard: StandardDto = { _id: getObjectId(), name: '', slug: '', group: undefined, order: 0, isNew: true };
    get().addStandards([standard]);
    return standard._id;
  },

  createSubject: () => {
    const subject: SubjectDto = { _id: getObjectId(), name: '', slug: '', isNew: true };
    get().addSubjects([subject]);
    return subject._id;
  },

  createStandardSubjectMapping: (standardId, subjectId) => {
    const mappings = get().getStandardSubjectMappings(standardId);
    if (mappings.some((mapping) => mapping.subject === subjectId)) return;
    get().addStandardSubjectMappings([
      { _id: getObjectId(), standard: standardId, subject: subjectId, order: mappings.length, isNew: true },
    ]);
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

  loadInitialData: () =>
    get().run('initialData', async () => {
      const result = await CommonService.getIntitalData();
      if (!result?.data) return;
      const { standards, subjects, mappings } = result.data;
      get().addStandards(standards);
      get().addSubjects(subjects);
      get().addStandardSubjectMappings(mappings);
    }),

  reset: () => {
    set({ standardMap: {}, subjectMap: {}, mappingMap: {} });
    get().resetRequests();
  },
}));
