import { type ISelectItem } from '@interfaces';
import { type Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { BatchService } from '../services';
import { getBatchSelectItem, getObjectId } from '../utils/helpers';
import { Batch, type IBatch, type IUser, type IUserBatchMapping, UserBatchMapping } from './models';
import { type IStore } from './root.store';

export interface IBatchStat {
  standard: string;
  subject: string;
  count: number;
  lastUpdatedAt: string;
}

export const BatchStore = t
  .model({
    batchMaps: t.map(Batch),
    userBatchMaps: t.map(UserBatchMapping),
    isLoadingBatchesData: t.optional(t.boolean, false),
    isLoadedBatchesData: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get batches(): IBatch[] {
      return Array.from(self.batchMaps.values());
    },

    get userBatchMappings(): IUserBatchMapping[] {
      return Array.from(self.userBatchMaps.values());
    },

    getBatchById(batchId: string): IBatch | undefined {
      return batchId ? self.batchMaps.get(batchId) : undefined;
    },
  }))
  .actions((self) => ({
    addBatch: (batch: IBatch) => {
      if (!batch) return;
      const batchId = batch._id;
      const isBatch = self.batchMaps.has(batchId);
      if (isBatch) self.batchMaps.set(batchId, batch);
      else self.batchMaps.put(batch);
    },

    addUserBatchMapping: (userBatchMapping: IUserBatchMapping) => {
      if (!userBatchMapping) return;
      const userBatchMappingId = userBatchMapping._id;
      const isUserBatchMapping = self.userBatchMaps.has(userBatchMappingId);
      if (isUserBatchMapping) self.userBatchMaps.set(userBatchMappingId, userBatchMapping);
      else self.userBatchMaps.put(userBatchMapping);
    },

    removeUserBatchMappingByUserIdAndBatchId: (userId: string, batchId: string) => {
      const userBatchMapping = self.userBatchMappings.find(
        (mapping) => mapping.user === userId && mapping.batch === batchId,
      );
      if (userBatchMapping) self.userBatchMaps.delete(userBatchMapping._id);
    },

    removeBatchById: (batchId: string) => {
      const batch = self.batchMaps.get(batchId);
      if (batch) self.batchMaps.delete(batchId);
    },
  }))
  .actions((self) => ({
    addBatches: (batches: IBatch[]) => {
      if (!batches) return;
      batches.forEach((batch) => self.addBatch(batch));
    },

    addUserBatchMappings: (userBatchMappings: IUserBatchMapping[]) => {
      if (!userBatchMappings) return;
      userBatchMappings.forEach((mapping) => self.addUserBatchMapping(mapping));
    },
  }))
  .actions((self) => ({
    loadBatchesData: flow(function* () {
      self.isLoadingBatchesData = true;
      const result = yield BatchService.getBatchesData();
      if (!result?.data) {
        self.isLoadingBatchesData = false;
        return;
      }
      const { batches, userBatchMappings } = result.data;
      self.addBatches(batches);
      self.addUserBatchMappings(userBatchMappings);
      self.isLoadedBatchesData = true;
      self.isLoadingBatchesData = false;
    }),

    createBatch: (name: string, standard: string) => {
      const batch = Batch.create({
        _id: getObjectId(),
        name,
        isNew: true,
        standard,
        year: new Date().getFullYear(),
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addBatch(batch);
      self.rootStore.selectorStore.setSelectedBatchId(batch._id);
      return batch;
    },
  }))
  .views((self) => ({
    getBatchesByIds(ids: string[]): IBatch[] {
      const items: IBatch[] = [];
      ids.forEach((id) => {
        const item = self.getBatchById(id);
        if (item) items.push(item);
      });
      return items;
    },

    getBatchesByStandardIds(standardIds: string[]): IBatch[] {
      return self.batches.filter((batch) => standardIds.includes(batch.standard));
    },

    getBatchesByStandardId(standard: string): IBatch[] {
      return self.batches.filter((batch) => batch.standard === standard);
    },

    getBatchCollaborators(batchId: string): IUser[] {
      const maps = self.userBatchMappings.filter((mapping) => mapping.batch === batchId);
      const users = getRoot<IStore>(self).userStore.getUsersByIds(maps.map((mapping) => mapping.user));
      return users.filter((user) => !user.isStudent);
    },

    getBatchStudents(batchId: string): IUser[] {
      const maps = self.userBatchMappings.filter((mapping) => mapping.batch === batchId);
      const users = getRoot<IStore>(self).userStore.getUsersByIds(maps.map((mapping) => mapping.user));
      return users.filter((user) => user.isStudent);
    },

    get batchItems(): ISelectItem[] {
      return self.batches.map((batch) => getBatchSelectItem(batch));
    },
  }))
  .views((self) => ({
    getBatchCollaboratorIds(batchId: string): string[] {
      return self.getBatchCollaborators(batchId).map((user) => user._id);
    },
    getBatchStudentIds(batchId: string): string[] {
      const maps = self.userBatchMappings.filter((mapping) => mapping.batch === batchId);
      const users = getRoot<IStore>(self).userStore.getUsersByIds(maps.map((mapping) => mapping.user));
      return users.filter((user) => user.isStudent).map((user) => user._id);
    },
  }));

export type IBatchStore = Instance<typeof BatchStore>;
