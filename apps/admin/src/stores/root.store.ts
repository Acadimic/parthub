// import makeInspectable from 'mobx-devtools-mst';
import { Instance, applySnapshot, destroy, flow, types as t } from 'mobx-state-tree';
import { useMemo } from 'react';
import { CommonService } from '../services';
import { CourseStore, ICourseStore } from './course.store';
import { ISelectorStore, SelectorStore } from './selector.store';
import { IStandardStore, StandardStore } from './standard.store';

export const RootStore = t
  .model('RootStore', {
    standardStore: t.optional(StandardStore, {
      standardMaps: {},
      subjectMaps: {},
      standardSubjectMappingMaps: {},
    }),
    courseStore: t.optional(CourseStore, {
      courseMaps: {},
    }),
    selectorStore: t.optional(SelectorStore, {}),
    isLoading: t.optional(t.boolean, false),
    isLoaded: t.optional(t.boolean, false),
    isError: t.optional(t.boolean, false),
    isLoadingInitialData: t.optional(t.boolean, false),
    isLoadedInitialData: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    reset: () => {
      destroy(self.standardStore);
      destroy(self.courseStore);
      destroy(self.selectorStore);
      self.isLoadedInitialData = false;
    },

    setLoading: () => {
      self.isLoading = true;
      self.isError = false;
    },

    resetLoading: flow(function* () {
      self.isLoading = false;
      self.isLoaded = true;
      yield new Promise((resolve) => setTimeout(() => resolve(null), 2000));
      self.isLoaded = false;
    }),

    setError: () => {
      self.isError = true;
      self.isLoading = false;
    },

    loadInitialData: flow(function* () {
      self.isLoadingInitialData = true;
      const result = yield Promise.all([CommonService.getIntitalData()]);
      const data = result[0]?.data;
      if (data) {
        self.standardStore.addStandards(data.standards);
        self.standardStore.addSubjects(data.subjects);
        self.standardStore.addStandardSubjectMappings(data.mappings);
      }
      self.isLoadedInitialData = true;
      self.isLoadingInitialData = false;
    }),
  }));

export interface IStore {
  standardStore: IStandardStore;
  courseStore: ICourseStore;
  selectorStore: ISelectorStore;
  isLoading: boolean;
  isLoaded: boolean;
  isError: boolean;
  isLoadingInitialData: boolean;
  isLoadedInitialData: boolean;
  setLoading: () => void;
  resetLoading: () => void;
  setError: () => void;
}

export type IRootStore = Instance<typeof RootStore>;

let store: IRootStore | undefined;

export function initializeStore(snapshot = null) {
  const _store = store ?? RootStore.create({});

  // If your page has Next.js data fetching methods that use a Mobx store, it will
  // get hydrated here, check `pages/ssg.tsx` and `pages/ssr.tsx` for more details
  if (snapshot) {
    applySnapshot(_store, snapshot);
  }
  // For SSG and SSR always create a new store
  if (typeof window === 'undefined') return _store;
  // Create the store once in the client
  if (!store) store = _store;

  return store;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useStores(initialState?: any) {
  const store = useMemo(() => initializeStore(initialState), [initialState]);
  // makeInspectable(store);
  return store;
}

// Access store outside of react component
export const appStores = initializeStore();
