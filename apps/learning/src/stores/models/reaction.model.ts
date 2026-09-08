import { getRoot, Instance, types as t } from 'mobx-state-tree';
import { CollectionType } from '../../enums';
import { IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Reaction = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Reaction', {
      _id: t.identifier,
      collectionItem: t.string,
      collectionRef: t.enumeration(Object.values(CollectionType)),
      course: t.string,
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

export type IReaction = Instance<typeof Reaction>;
