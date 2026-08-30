import { Instance, getRoot, types as t } from 'mobx-state-tree';
import { IStandard, ISubject } from './models';
import { IStore } from './root.store';

export const SelectorStore = t
  .model({
    selectedSubjectId: t.optional(t.string, ''),
    selectedStandardId: t.optional(t.string, ''),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    setSelectedSubjectId: (subjectId: string) => {
      self.selectedSubjectId = subjectId;
    },

    setSelectedStandardId: (standardId: string) => {
      self.selectedStandardId = standardId;
    },
  }))
  .views((self) => ({
    get selectedSubject(): ISubject | undefined {
      return self.rootStore.standardStore.getSubjectById(self.selectedSubjectId);
    },

    get selectedStandard(): IStandard | undefined {
      return self.rootStore.standardStore.getStandardById(self.selectedStandardId);
    },
  }));

export type ISelectorStore = Instance<typeof SelectorStore>;
