import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Batch = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Batch', {
      _id: t.identifier,
      name: t.string,
      standard: t.string,
      year: t.number,
      isNew: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
    },

    setYear: (year: number) => {
      self.year = year;
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setStandard: (standardId: string) => {
      self.standard = standardId;
    },
  }));

export type IBatch = Instance<typeof Batch>;
