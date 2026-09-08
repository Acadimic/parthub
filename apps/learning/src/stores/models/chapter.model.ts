import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Chapter = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Chapter', {
      _id: t.identifier,
      name: t.string,
      standard: t.string,
      subject: t.string,
      order: t.number,
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

    resetIsNew: () => {
      self.isNew = false;
    },

    setStandard: (standardId: string) => {
      self.standard = standardId;
    },

    setSubject: (subjectId: string) => {
      self.subject = subjectId;
    },
  }));

export type IChapter = Instance<typeof Chapter>;
