import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Follower = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Follower', {
      _id: t.identifier,
      follower: t.string,
      following: t.string,
      _deleted: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    toggleDelete: () => {
      self._deleted = !self._deleted;
    },
  }));

export type IFollower = Instance<typeof Follower>;
