import { create } from 'zustand';
import { type IStandard, type ISubject, useStandardStore } from './standard.store';

/**
 * What the user currently has selected. Ids only — the entities themselves live in the store that
 * owns them.
 *
 * This store deliberately holds no cross-store reads. Under MST, `selectedStandard` was a view that
 * reached into `standardStore`, which is why the two had to migrate together: a MobX view cannot
 * track Zustand state, so an `observer` reading it would have gone stale silently. The composed
 * hooks below replace those views and subscribe to both stores properly.
 */
export interface ISelectorState {
  selectedSubjectId: string;
  selectedStandardId: string;
  setSelectedSubjectId: (subjectId: string) => void;
  setSelectedStandardId: (standardId: string) => void;
  reset: () => void;
}

export const useSelectorStore = create<ISelectorState>()((set) => ({
  selectedSubjectId: '',
  selectedStandardId: '',

  setSelectedSubjectId: (subjectId) => {
    set({ selectedSubjectId: subjectId });
  },

  setSelectedStandardId: (standardId) => {
    set({ selectedStandardId: standardId });
  },

  reset: () => {
    set({ selectedSubjectId: '', selectedStandardId: '' });
  },
}));

/**
 * The selected standard, or `undefined` when nothing is selected.
 *
 * Two subscriptions on purpose: one for the id, one for the row. The result is the object held in
 * the store's map, so its reference only changes when that standard is actually patched — no
 * `useShallow` needed, and no re-render when an unrelated standard changes.
 */
export const useSelectedStandard = (): IStandard | undefined => {
  const selectedStandardId = useSelectorStore((state) => state.selectedStandardId);
  return useStandardStore((state) => (selectedStandardId ? state.standardMap[selectedStandardId] : undefined));
};

/** The selected subject, or `undefined` when nothing is selected. See `useSelectedStandard`. */
export const useSelectedSubject = (): ISubject | undefined => {
  const selectedSubjectId = useSelectorStore((state) => state.selectedSubjectId);
  return useStandardStore((state) => (selectedSubjectId ? state.subjectMap[selectedSubjectId] : undefined));
};
