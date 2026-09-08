import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { CollectionType } from '../../enums';
import { type IStore } from '../root.store';
import { BaseOrgModel } from './base-models';
import { BaseTimestampModel } from './base-models/base-timestamp.model';

export const CompletedModule = t
  .compose(
    BaseOrgModel,
    BaseTimestampModel,
    t.model('CompletedModule', {
      _id: t.identifier,
      course: t.string,
      courseModule: t.string,
      collectionItem: t.string,
      collectionRef: t.enumeration(Object.values(CollectionType)),
      isCompleted: t.optional(t.boolean, false),
      isSkipped: t.optional(t.boolean, false),
    }),
  )
  .actions((self) => ({
    setIsCompleted(isCompleted: boolean) {
      self.isCompleted = isCompleted;
    },

    setIsSkipped(isSkipped: boolean) {
      self.isSkipped = isSkipped;
    },
  }))
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }));

export interface ICompletedModule extends Instance<typeof CompletedModule> {}
