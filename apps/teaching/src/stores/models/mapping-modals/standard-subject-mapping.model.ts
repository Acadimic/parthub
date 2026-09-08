import { type Instance, types as t } from 'mobx-state-tree';

export const StandardSubjectMapping = t.model('StandardSubjectMapping', {
  _id: t.identifier,
  standard: t.string,
  subject: t.string,
  order: t.number,
  referenceStandards: t.optional(t.array(t.string), []),
});

export type IStandardSubjectMapping = Instance<typeof StandardSubjectMapping>;
