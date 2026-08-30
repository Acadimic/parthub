import { Instance, types as t } from 'mobx-state-tree';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const Option = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Option', {
      _id: t.identifier,
      option: t.string,
      question: t.string,
      isCorrect: t.boolean,
      isNew: t.optional(t.boolean, false),
    }),
  )
  .actions((self) => ({
    setOption: (option: string) => {
      self.option = option;
    },

    setIsCorrect: (isCorrect: boolean) => {
      self.isCorrect = isCorrect;
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export type IOption = Instance<typeof Option>;
