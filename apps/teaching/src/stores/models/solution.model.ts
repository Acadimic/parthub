import { type Instance, types as t } from 'mobx-state-tree';

export const Solution = t
  .model('Solution', {
    _id: t.identifier,
    solution: t.string,
    question: t.string,
    isNew: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    setSolution: (solution: string) => {
      self.solution = solution;
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export type ISolution = Instance<typeof Solution>;
