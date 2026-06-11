import { Instance, applySnapshot, destroy, flow, types as t } from 'mobx-state-tree';
import { useMemo } from 'react';
import { CommonService } from '../services';
import { CourseStore, ICourseStore } from './course.store';
import { IMaterialStore, MaterialStore } from './material.store';
import { ISelectorStore, SelectorStore } from './selector.store';
import { IToastStore, ToastStore } from './toast.store';
import { IUserStore, UserStore } from './user.store';

export const RootStore = t
  .model('RootStore', {
    userStore: t.optional(UserStore, { userMaps: {} }),
    courseStore: t.optional(CourseStore, { courseMaps: {} }),
    materialStore: t.optional(MaterialStore, { materialMaps: {} }),
    selectorStore: t.optional(SelectorStore, {}),
    toastStore: t.optional(ToastStore, { toasts: [] }),
    isLoading: t.optional(t.boolean, false),
    isLoaded: t.optional(t.boolean, false),
    isError: t.optional(t.boolean, false),
    isLoadingInitialData: t.optional(t.boolean, false),
    isLoadedInitialData: t.optional(t.boolean, false),
    isLoadingPublicData: t.optional(t.boolean, false),
    isLoadedPublicData: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    reset: () => {
      destroy(self.userStore);
      destroy(self.courseStore);
      destroy(self.materialStore);
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
      try {
        const result = yield Promise.all([CommonService.getInitialData()]);
        const data = result[0]?.data;
        if (data) {
          self.userStore.addUsers(data.collaborators || []);
        }
      } catch (e) {
        console.error(e);
      }
      self.isLoadedInitialData = true;
      self.isLoadingInitialData = false;
    }),
    loadPublicData: flow(function* () {
      self.isLoadingPublicData = true;
      try {
        const result = yield Promise.all([CommonService.getPublicData()]);
        const data = result[0]?.data;
        if (data) {
          self.courseStore.addCourses(data.courses || []);
        }
      } catch (e) {
        console.error(e);
      }
      self.isLoadedPublicData = true;
      self.isLoadingPublicData = false;
    }),
  }));

export interface IStore {
  userStore: IUserStore;
  courseStore: ICourseStore;
  materialStore: IMaterialStore;
  selectorStore: ISelectorStore;
  toastStore: IToastStore;
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
  if (snapshot) {
    applySnapshot(_store, snapshot);
  }
  if (typeof window === 'undefined') return _store;
  if (!store) store = _store;
  return store;
}

export function useStores(initialState?: any) {
  const store = useMemo(() => initializeStore(initialState), [initialState]);
  return store;
}

export const appStores = initializeStore();
