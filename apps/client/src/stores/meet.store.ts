import { Instance, getRoot, types as t } from 'mobx-state-tree';
import { IMeet, Meet } from './models';
import { IStore } from './root.store';

export const MeetStore = t
  .model({
    meetMaps: t.map(Meet),
    isLoadingMeets: t.optional(t.boolean, false),
    isLoadedMeets: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getMeetById(meetId: string): IMeet | undefined {
      return meetId ? self.meetMaps.get(meetId) : undefined;
    },

    get meets(): IMeet[] {
      return Array.from(self.meetMaps.values());
    },
  }))
  .views((self) => ({
    getMeetsByIds(ids: string[]): IMeet[] {
      const items: IMeet[] = [];
      ids.forEach((id) => {
        const item = self.getMeetById(id);
        if (item) items.push(item);
      });
      return items;
    },
  }))
  .actions((self) => ({
    addMeet: (obj: IMeet) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.meetMaps.has(objId);
      if (isObj) self.meetMaps.set(objId, obj);
      else self.meetMaps.put(obj);
    },

    removeMeetById: (id: string) => {
      self.meetMaps.delete(id);
    },
  }))
  .actions((self) => ({
    addMeets: (objects: IMeet[]) => {
      objects.forEach((obj) => self.addMeet(obj));
    },
  }));

export type IMeetStore = Instance<typeof MeetStore>;
