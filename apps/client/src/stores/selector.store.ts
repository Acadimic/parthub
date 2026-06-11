import { Instance, types as t } from 'mobx-state-tree';

export const SelectorStore = t
  .model('SelectorStore', {
    selectedStandard: t.optional(t.string, ''),
    selectedSubject: t.optional(t.string, ''),
  })
  .actions((self) => ({
    setSelectedStandard: (id: string) => {
      self.selectedStandard = id;
    },
    setSelectedSubject: (id: string) => {
      self.selectedSubject = id;
    },
  }));

export type ISelectorStore = Instance<typeof SelectorStore>;
