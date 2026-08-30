import { Instance, types as t } from 'mobx-state-tree';

export const StandardSubjectMapping = t
  .model('StandardSubjectMapping', {
    _id: t.identifier,
    standard: t.string,
    subject: t.string,
    order: t.number,
    referenceStandards: t.optional(t.array(t.string), []),
    isNew: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    resetIsNew: () => {
      self.isNew = false;
    },

    addReferenceStandards: (standardIds: string[]) => {
      self.referenceStandards.replace(standardIds);
    },
  }));

export type IStandardSubjectMapping = Instance<typeof StandardSubjectMapping>;
