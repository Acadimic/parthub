import { type CourseDto, type PlanDto } from '@repo/shared/contracts';
import { type ICompletedModuleFields, type ICourseModuleFields } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type IGetCompletedModule } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { type CollectionType, PeriodType, CurrencyType } from '../enums';
import { CourseService, MeetService, PlanService } from '../services';
import { type ICourseModuleContents } from '../services/course.service';
import { capitalize, getObjectId } from '../utils/helpers';
import { useMaterialStore } from './material.store';
import { useMeetStore } from './meet.store';
import { useSelectorStore } from './selector.store';
import { useTestPaperStore } from './test-paper.store';
import { useUserStore } from './user.store';

/**
 * A course in the store. `isLoadedContents` is client-only — it records whether this course's
 * modules have been fetched — and `CLIENT_ONLY_KEYS` strips it from every request.
 */
export type ICourse = CourseDto & { isLoadedContents?: boolean };
export type ICourseModule = ICourseModuleFields & { isNew?: boolean };
export type ICourseStats = NonNullable<ICourse['stats']>;

/** The fetches this store tracks. */
type CourseFetch = 'courses' | 'plans' | 'courseModules' | 'completedModules';

export interface ICourseState extends IRequestSlice<CourseFetch> {
  courseMap: Record<string, ICourse>;
  planMap: Record<string, PlanDto>;
  courseModuleMap: Record<string, ICourseModule>;
  completedModuleMap: Record<string, ICompletedModuleFields>;

  getCourseById: (courseId: string) => ICourse | undefined;
  getCourseModuleById: (courseModuleId: string) => ICourseModule | undefined;
  getCourses: () => ICourse[];
  getPlans: () => PlanDto[];
  getCourseModules: () => ICourseModule[];
  getCompletedModules: () => ICompletedModuleFields[];
  getCoursesByIds: (courseIds: string[]) => ICourse[];
  getCourseModuleByCourseId: (courseId: string) => ICourseModule[];
  getPlansByCourseId: (courseId: string) => PlanDto[];
  /** Courses keyed by each standard they belong to; a course appears under every one of them. */
  getGroupedCoursesByStandardId: () => Record<string, ICourse[]>;
  getCompletedModule: (data: IGetCompletedModule) => ICompletedModuleFields | undefined;
  isCourseModuleItemCompleted: (data: IGetCompletedModule) => boolean;
  isCourseModuleItemSkipped: (data: IGetCompletedModule) => boolean;
  /** Whether a module's materials and test papers are all done, or only some. */
  isCourseModuleCompleted: (courseModuleId: string) => { isAllCompleted: boolean; isPartiallyCompleted: boolean };

  addCourses: (courses: ICourse[]) => void;
  addPlans: (plans: PlanDto[]) => void;
  addCourseModules: (courseModules: ICourseModule[]) => void;
  addCompletedModules: (completedModules: ICompletedModuleFields[]) => void;
  patchCourse: (courseId: string, fields: Partial<ICourse>) => void;
  patchCompletedModule: (completedModuleId: string, fields: Partial<ICompletedModuleFields>) => void;
  removeCourseById: (courseId: string) => void;
  removeCourseModuleById: (courseModuleId: string) => void;

  createPlan: (courseId: string, order: number, period: PeriodType) => PlanDto;
  createCompletedModule: (data: IGetCompletedModule, collectionRef: CollectionType) => ICompletedModuleFields;

  loadCourses: () => Promise<void>;
  loadCoursePlans: (courseId: string) => Promise<void>;
  loadCourseModules: (courseId: string) => Promise<void>;
  loadCompletedModules: () => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

/**
 * A module arrives with its test papers, materials and meets embedded. Each collection goes to the
 * store that owns it, and the module keeps only ids — which is what the rest of the app reads.
 */
const distributeCourseModule = (courseModule: ICourseModuleContents) => {
  useTestPaperStore.getState().addTestPapers(courseModule.testPapers);
  useMaterialStore.getState().addMaterials(courseModule.materials);
  useMeetStore.getState().addMeets(courseModule.meets);
  return {
    ...courseModule,
    testPapers: courseModule.testPapers.map((testPaper) => testPaper._id),
    materials: courseModule.materials.map((material) => material._id),
    meets: courseModule.meets.map((meet) => meet._id),
  };
};

export const useCourseStore = create<ICourseState>()((set, get) => ({
  courseMap: {},
  planMap: {},
  courseModuleMap: {},
  completedModuleMap: {},
  ...createRequestSlice(['courses', 'plans', 'courseModules', 'completedModules'], set, get),

  getCourseById: (courseId) => (courseId ? get().courseMap[courseId] : undefined),

  getCourseModuleById: (courseModuleId) => (courseModuleId ? get().courseModuleMap[courseModuleId] : undefined),

  getCourses: () => Object.values(get().courseMap),

  getPlans: () => Object.values(get().planMap),

  getCourseModules: () => Object.values(get().courseModuleMap),

  getCompletedModules: () => Object.values(get().completedModuleMap),

  getCoursesByIds: (courseIds) => {
    const { courseMap } = get();
    return courseIds.map((id) => courseMap[id]).filter((course): course is ICourse => !!course);
  },

  getCourseModuleByCourseId: (courseId) =>
    get()
      .getCourseModules()
      .filter((courseModule) => courseModule.course === courseId),

  getPlansByCourseId: (courseId) =>
    get()
      .getPlans()
      .filter((plan) => (plan.courses ?? []).includes(courseId)),

  getGroupedCoursesByStandardId: () =>
    get()
      .getCourses()
      .reduce<Record<string, ICourse[]>>((grouped, course) => {
        (course.standards ?? []).forEach((standardId) => {
          grouped[standardId] = [...(grouped[standardId] ?? []), course];
        });
        return grouped;
      }, {}),

  getCompletedModule: ({ course, courseModule, collectionItem }) =>
    get()
      .getCompletedModules()
      .find(
        (item) =>
          item.course === course && item.courseModule === courseModule && item.collectionItem === collectionItem,
      ),

  isCourseModuleItemCompleted: (data) => get().getCompletedModule(data)?.isCompleted ?? false,

  isCourseModuleItemSkipped: (data) => get().getCompletedModule(data)?.isSkipped ?? false,

  isCourseModuleCompleted: (courseModuleId) => {
    const courseModule = get().getCourseModuleById(courseModuleId);
    if (!courseModule) return { isAllCompleted: false, isPartiallyCompleted: false };
    const items = [...(courseModule.materials ?? []), ...(courseModule.testPapers ?? [])];
    let isAllCompleted = true;
    let isPartiallyCompleted = false;
    items.forEach((collectionItem) => {
      const isCompleted = get().isCourseModuleItemCompleted({
        course: courseModule.course,
        courseModule: courseModule._id,
        collectionItem,
      });
      if (isCompleted) isPartiallyCompleted = true;
      else isAllCompleted = false;
    });
    return { isAllCompleted, isPartiallyCompleted };
  },

  addCourses: (courses) => {
    set((state) => ({ courseMap: { ...state.courseMap, ...keyById(courses) } }));
  },

  addPlans: (plans) => {
    set((state) => ({ planMap: { ...state.planMap, ...keyById(plans) } }));
  },

  addCourseModules: (courseModules) => {
    set((state) => ({ courseModuleMap: { ...state.courseModuleMap, ...keyById(courseModules) } }));
  },

  addCompletedModules: (completedModules) => {
    set((state) => ({ completedModuleMap: { ...state.completedModuleMap, ...keyById(completedModules) } }));
  },

  patchCourse: (courseId, fields) => {
    set((state) => {
      const course = state.courseMap[courseId];
      if (!course) return state;
      return { courseMap: { ...state.courseMap, [courseId]: { ...course, ...fields } } };
    });
  },

  patchCompletedModule: (completedModuleId, fields) => {
    set((state) => {
      const completedModule = state.completedModuleMap[completedModuleId];
      if (!completedModule) return state;
      return {
        completedModuleMap: {
          ...state.completedModuleMap,
          [completedModuleId]: { ...completedModule, ...fields },
        },
      };
    });
  },

  removeCourseById: (courseId) => {
    set((state) => {
      const { [courseId]: removed, ...courseMap } = state.courseMap;
      return removed ? { courseMap } : state;
    });
  },

  removeCourseModuleById: (courseModuleId) => {
    set((state) => {
      const { [courseModuleId]: removed, ...courseModuleMap } = state.courseModuleMap;
      return removed ? { courseModuleMap } : state;
    });
  },

  createPlan: (courseId, order, period) => {
    const plan: PlanDto = {
      _id: getObjectId(),
      name: capitalize(period),
      courses: [courseId],
      meets: [],
      amount: 0,
      realAmount: 0,
      currency: CurrencyType.INR,
      interval: 1,
      period,
      order,
      isRecommended: period === PeriodType.YEARLY,
      isNew: true,
    };
    get().addPlans([plan]);
    return plan;
  },

  createCompletedModule: (data, collectionRef) => {
    const completedModule: ICompletedModuleFields = {
      ...data,
      _id: getObjectId(),
      collectionRef,
      isCompleted: true,
      isSkipped: false,
    };
    get().addCompletedModules([completedModule]);
    return completedModule;
  },

  loadCourses: () =>
    get().run('courses', async () => {
      // The learner's courses are the ones on the standards they are enrolled on.
      const selectedUserId = useSelectorStore.getState().selectedUserId;
      const standardIds = useUserStore
        .getState()
        .getStudentStandardMappingsByStudentId(selectedUserId)
        .map((mapping) => mapping.standard);
      const result = await CourseService.getCoursesByStandardIds(standardIds);
      if (result?.data) get().addCourses(result.data);
    }),

  loadCoursePlans: (courseId) =>
    get().run('plans', async () => {
      const result = await PlanService.getCoursePlans(courseId);
      if (result?.data) get().addPlans(result.data);
    }),

  loadCourseModules: (courseId) =>
    get().run('courseModules', async () => {
      const course = get().getCourseById(courseId);
      if (!course) return;
      const [modulesResult, meetsResult] = await Promise.all([
        CourseService.getCourseModulesContentsByCourseId(courseId),
        MeetService.getMeetsByIds(courseId, course.meets ?? []),
      ]);
      if (!modulesResult?.data || !meetsResult?.data) return;
      // The modules arrive with their test papers, materials and meets embedded. Each collection
      // goes to the store that owns it and the module keeps only ids, which is what the rest of the
      // app reads.
      const courseModules = modulesResult.data.map(distributeCourseModule);
      useMeetStore.getState().addMeets(meetsResult.data);
      get().addCourseModules(courseModules);
      const firstModuleId = courseModules[0]?._id;
      if (firstModuleId) useSelectorStore.getState().setSelectedCourseModuleId(firstModuleId);
      get().patchCourse(courseId, { isLoadedContents: true });
    }),

  loadCompletedModules: () =>
    get().run('completedModules', async () => {
      const result = await CourseService.getCompletedModules();
      if (!result?.data) return;
      get().addCompletedModules(result.data);
      const selectedUserId = useSelectorStore.getState().selectedUserId;
      if (selectedUserId) useUserStore.getState().patchUser(selectedUserId, { isLoadedCompletedModules: true });
    }),

  reset: () => {
    set({ courseMap: {}, planMap: {}, courseModuleMap: {}, completedModuleMap: {} });
    get().resetRequests();
  },
}));

/** The store's lookups, subscribed to its state. */
export const useCourseLookups = (): ICourseState => useCourseStore(useShallow((state) => state));

/** The selected course, or `undefined`. Replaces `selectorStore.selectedCourse`. */
export const useSelectedCourse = (): ICourse | undefined => {
  const selectedCourseId = useSelectorStore((state) => state.selectedCourseId);
  return useCourseStore((state) => (selectedCourseId ? state.courseMap[selectedCourseId] : undefined));
};

/** The selected course module, or `undefined`. Replaces `selectorStore.selectedCourseModule`. */
export const useSelectedCourseModule = (): ICourseModule | undefined => {
  const selectedId = useSelectorStore((state) => state.selectedCourseModuleId);
  return useCourseStore((state) => (selectedId ? state.courseModuleMap[selectedId] : undefined));
};

/** The selected course's plans. Replaces `selectorStore.selectedCoursePlans`. */
export const useSelectedCoursePlans = (): PlanDto[] => {
  const selectedCourseId = useSelectorStore((state) => state.selectedCourseId);
  return useCourseStore(useShallow((state) => state.getPlansByCourseId(selectedCourseId)));
};
