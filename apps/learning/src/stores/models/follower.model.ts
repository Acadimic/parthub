import { getRoot, Instance, types as t } from 'mobx-state-tree';
import { IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Follower = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Follower', {
      _id: t.identifier,
      follower: t.string,
      following: t.string,
      isDeleted: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    toggleDelete: () => {
      self.isDeleted = !self.isDeleted;
    },
  }));

export type IFollower = Instance<typeof Follower>;
