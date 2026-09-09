import { type BatchDto, type UserBatchMappingDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type ISelectItem } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { BatchService, MappingService } from '../services';
import { getObjectId } from '../utils/helpers';
import { useSelectorStore } from './selector.store';
import { type IUser, isStudentUser, useUserStore } from './user.store';

/** The fetches this store tracks. */
type BatchFetch = 'batchesData';

export interface IBatchState extends IRequestSlice<BatchFetch> {
  batchMap: Record<string, BatchDto>;
  userBatchMap: Record<string, UserBatchMappingDto>;

  getBatchById: (batchId: string) => BatchDto | undefined;
  getBatches: () => BatchDto[];
  getBatchesByIds: (batchIds: string[]) => BatchDto[];
  getBatchesByStandardId: (standardId: string) => BatchDto[];
  getBatchesByStandardIds: (standardIds: string[]) => BatchDto[];
  getUserBatchMappings: () => UserBatchMappingDto[];
  getBatchItems: () => ISelectItem[];
  /** Every user mapped to a batch, students and staff alike. Reads the user store. */
  getBatchMembers: (batchId: string) => IUser[];
  /** Non-student members of a batch. Reads the user store — see `useBatchLookups`. */
  getBatchCollaborators: (batchId: string) => IUser[];
  getBatchCollaboratorIds: (batchId: string) => string[];
  /** Student members of a batch. Reads the user store — see `useBatchLookups`. */
  getBatchStudents: (batchId: string) => IUser[];
  getBatchStudentIds: (batchId: string) => string[];

  addBatches: (batches: BatchDto[]) => void;
  addUserBatchMappings: (mappings: UserBatchMappingDto[]) => void;
  patchBatch: (batchId: string, fields: Partial<BatchDto>) => void;
  removeBatchById: (batchId: string) => void;
  removeUserBatchMappingByUserIdAndBatchId: (userId: string, batchId: string) => void;

  /** Adds an unsaved batch and returns it, for the caller to select. */
  createBatch: (name: string, standardId: string) => BatchDto;

  loadBatchesData: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useBatchStore = create<IBatchState>()((set, get) => ({
  batchMap: {},
  userBatchMap: {},
  ...createRequestSlice(['batchesData'], set, get),

  getBatchById: (batchId) => (batchId ? get().batchMap[batchId] : undefined),

  getBatches: () => Object.values(get().batchMap),

  getBatchesByIds: (batchIds) => {
    const { batchMap } = get();
    return batchIds.map((batchId) => batchMap[batchId]).filter((batch): batch is BatchDto => !!batch);
  },

  getBatchesByStandardId: (standardId) =>
    get()
      .getBatches()
      .filter((batch) => batch.standard === standardId),

  getBatchesByStandardIds: (standardIds) =>
    get()
      .getBatches()
      .filter((batch) => batch.standard && standardIds.includes(batch.standard)),

  getUserBatchMappings: () => Object.values(get().userBatchMap),

  getBatchItems: () =>
    get()
      .getBatches()
      .map((batch) => ({ label: batch.name, value: batch._id, group: batch.standard })),

  getBatchMembers: (batchId) => {
    const userIds = get()
      .getUserBatchMappings()
      .filter((mapping) => mapping.batch === batchId)
      .map((mapping) => mapping.user);
    return useUserStore.getState().getUsersByIds(userIds);
  },

  getBatchCollaborators: (batchId) =>
    get()
      .getBatchMembers(batchId)
      .filter((user) => !isStudentUser(user)),

  getBatchCollaboratorIds: (batchId) =>
    get()
      .getBatchCollaborators(batchId)
      .map((user) => user._id),

  getBatchStudents: (batchId) =>
    get()
      .getBatchMembers(batchId)
      .filter((user) => isStudentUser(user)),

  getBatchStudentIds: (batchId) =>
    get()
      .getBatchStudents(batchId)
      .map((user) => user._id),

  addBatches: (batches) => {
    set((state) => ({ batchMap: { ...state.batchMap, ...keyById(batches) } }));
  },

  addUserBatchMappings: (mappings) => {
    set((state) => ({ userBatchMap: { ...state.userBatchMap, ...keyById(mappings) } }));
  },

  patchBatch: (batchId, fields) => {
    set((state) => {
      const batch = state.batchMap[batchId];
      if (!batch) return state;
      return { batchMap: { ...state.batchMap, [batchId]: { ...batch, ...fields } } };
    });
  },

  removeBatchById: (batchId) => {
    set((state) => {
      const { [batchId]: removed, ...batchMap } = state.batchMap;
      return removed ? { batchMap } : state;
    });
  },

  removeUserBatchMappingByUserIdAndBatchId: (userId, batchId) => {
    const mapping = get()
      .getUserBatchMappings()
      .find((item) => item.user === userId && item.batch === batchId);
    if (!mapping) return;
    set((state) => {
      const { [mapping._id]: removed, ...userBatchMap } = state.userBatchMap;
      return removed ? { userBatchMap } : state;
    });
  },

  createBatch: (name, standardId) => {
    const batch: BatchDto = {
      _id: getObjectId(),
      name,
      standard: standardId,
      year: new Date().getFullYear(),
      isNew: true,
    };
    get().addBatches([batch]);
    return batch;
  },

  loadBatchesData: () =>
    get().run('batchesData', async () => {
      // Two requests, because two routes. This used to call `batch/all` alone and destructure
      // `{ batches, userBatchMappings }` from it — that route returns a plain array, so both were
      // `undefined` and a guard swallowed it: batches never loaded at all.
      const [batches, mappings] = await Promise.all([
        BatchService.getBatches(),
        MappingService.getOrgUserBatchMappings(),
      ]);
      if (batches?.data) get().addBatches(batches.data);
      if (mappings?.data) get().addUserBatchMappings(mappings.data);
    }),

  reset: () => {
    set({ batchMap: {}, userBatchMap: {} });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the state they read.
 *
 * `getBatchCollaborators` and `getBatchStudents` resolve users through the user store, so this
 * subscribes to **both**: subscribing only to this store would leave a member list stale when a
 * user is loaded or renamed. See decision 4 in the migration plan.
 */
export const useBatchLookups = (): IBatchState => {
  useUserStore(useShallow((state) => state.userMap));
  return useBatchStore(useShallow((state) => state));
};

/** The selected batch, or `undefined`. Replaces `selectorStore.selectedBatch`. */
export const useSelectedBatch = (): BatchDto | undefined => {
  const selectedBatchId = useSelectorStore((state) => state.selectedBatchId);
  return useBatchStore((state) => (selectedBatchId ? state.batchMap[selectedBatchId] : undefined));
};
