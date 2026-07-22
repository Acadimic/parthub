import { Instance, types as t } from 'mobx-state-tree';

export const Solution = t.model('Solution', {
  _id: t.identifier,
  solution: t.string,
  question: t.string,
  isNew: t.optional(t.boolean, false),
});

export type ISolution = Instance<typeof Solution>;
