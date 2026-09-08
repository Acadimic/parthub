import {
  type ClientEntity,
  type CourseDto,
  type CourseStatsDto,
  type ICourseModuleFields,
  type IRequestSlice,
  type PlanDto,
  createRequestSlice,
} from '@repo/shared';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { CurrencyType, MaterialType, PeriodType } from '../enums';
import { CourseService, PlanService } from '../services';
import { capitalize, getObjectId, getSlug } from '../utils/helpers';
import { useMaterialStore } from './material.store';
import { useMeetStore } from './meet.store';
import { useSelectorStore } from './selector.store';
import { useStandardStore } from './standard.store';
import { useTestPaperStore } from './test-paper.store';

export type ICourse = ClientEntity<CourseDto>;
export type IPlan = ClientEntity<PlanDto>;
export type ICourseModule = ICourseModuleFields & { isNew?: boolean };
export type ICourseStats = CourseStatsDto;

/** The fetches this store tracks. */
type CourseFetch = 'courses' | 'plans' | 'courseModules';

export interface ICourseState extends IRequestSlice<CourseFetch> {
  courseMap: Record<string, ICourse>;
  planMap: Record<string, IPlan>;
  courseModuleMap: Record<string, ICourseModule>;

  getCourseById: (courseId: string) => ICourse | undefined;
  getCourseModuleById: (courseModuleId: string) => ICourseModule | undefined;
  getCourses: () => ICourse[];
  getPlans: () => IPlan[];
  getCourseModules: () => ICourseModule[];
  getCourseModulesByCourseId: (courseId: string) => ICourseModule[];
  getPlansByCourseId: (courseId: string) => IPlan[];
  /** A course's subjects as select items, led by a "None" entry. Was a view on the model. */
  getCourseSubjectItems: (courseId: string) => { label: string; value: string }[];

  addCourses: (courses: ICourse[]) => void;
  addPlans: (plans: IPlan[]) => void;
  addCourseModules: (courseModules: ICourseModule[]) => void;
  patchCourse: (courseId: string, fields: Partial<ICourse>) => void;
  patchPlan: (planId: string, fields: Partial<IPlan>) => void;
  patchCourseModule: (courseModuleId: string, fields: Partial<ICourseModule>) => void;
  /** Renames a course module and keeps its slug in step. */
  renameCourseModule: (courseModuleId: string, name: string) => void;
  removeCourseById: (courseId: string) => void;
  removeCourseModuleById: (courseModuleId: string) => void;

  /** Adds an unsaved course with its monthly and yearly plans; returns it for the caller to select. */
  createCourse: () => ICourse;
  createPlan: (courseId: string, order: number, period: PeriodType) => IPlan;
  /** Adds an unsaved module and returns it, for the caller to select. */
  createCourseModule: (courseId: string) => ICourseModule;
  /** Recomputes a course's roll-ups from its modules and stores them on the course. */
  calculateAndSetCourseStatsByCourseId: (courseId: string) => ICourseStats | undefined;

  loadCourses: () => Promise<void>;
  loadCoursePlans: (courseId: string) => Promise<void>;
  loadCourseModules: (courseId: string) => Promise<void>;
  reset: () => void;
}

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useCourseStore = create<ICourseState>()((set, get) => ({
  courseMap: {},
  planMap: {},
  courseModuleMap: {},
  ...createRequestSlice(['courses', 'plans', 'courseModules'], set, get),

  getCourseById: (courseId) => (courseId ? get().courseMap[courseId] : undefined),

  getCourseModuleById: (courseModuleId) => (courseModuleId ? get().courseModuleMap[courseModuleId] : undefined),

  getCourses: () => Object.values(get().courseMap),

  getPlans: () => Object.values(get().planMap),

  getCourseModules: () => Object.values(get().courseModuleMap),

  getCourseModulesByCourseId: (courseId) =>
    get()
      .getCourseModules()
      .filter((courseModule) => courseModule.course === courseId),

  getPlansByCourseId: (courseId) =>
    get()
      .getPlans()
      .filter((plan) => (plan.courses ?? []).includes(courseId)),

  getCourseSubjectItems: (courseId) => {
    const course = get().getCourseById(courseId);
    const items = [{ label: 'None', value: '' }];
    if (!course) return items;
    // Subjects resolve through the standard store; see `useCourseLookups` for the subscription.
    useStandardStore
      .getState()
      .getSubjectsByIds(course.subjects ?? [])
      .forEach((subject) => {
        if (!items.some((item) => item.value === subject._id)) items.push({ label: subject.name, value: subject._id });
      });
    return items;
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

  patchCourse: (courseId, fields) => {
    set((state) => {
      const course = state.courseMap[courseId];
      if (!course) return state;
      return { courseMap: { ...state.courseMap, [courseId]: { ...course, ...fields } } };
    });
  },

  patchPlan: (planId, fields) => {
    set((state) => {
      const plan = state.planMap[planId];
      if (!plan) return state;
      return { planMap: { ...state.planMap, [planId]: { ...plan, ...fields } } };
    });
  },

  patchCourseModule: (courseModuleId, fields) => {
    set((state) => {
      const courseModule = state.courseModuleMap[courseModuleId];
      if (!courseModule) return state;
      return { courseModuleMap: { ...state.courseModuleMap, [courseModuleId]: { ...courseModule, ...fields } } };
    });
  },

  renameCourseModule: (courseModuleId, name) => {
    get().patchCourseModule(courseModuleId, { name, slug: getSlug(name) });
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
    const plan: IPlan = {
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

  createCourse: () => {
    const courseId = getObjectId();
    const course: ICourse = {
      _id: courseId,
      name: '',
      slug: '',
      standards: [],
      subjects: [],
      // A course lists itself, which is how a bundle of courses is represented.
      courses: [courseId],
      meets: [],
      order: get().getCourses().length,
      isNew: true,
    };
    get().addCourses([course]);
    get().createPlan(courseId, 0, PeriodType.MONTHLY);
    get().createPlan(courseId, 1, PeriodType.YEARLY);
    return course;
  },

  createCourseModule: (courseId) => {
    const courseModule: ICourseModule = {
      _id: getObjectId(),
      course: courseId,
      name: '',
      slug: '',
      day: get().getCourseModulesByCourseId(courseId).length + 1,
      materials: [],
      testPapers: [],
      meets: [],
      isNew: true,
    };
    get().addCourseModules([courseModule]);
    return courseModule;
  },

  calculateAndSetCourseStatsByCourseId: (courseId) => {
    const course = get().getCourseById(courseId);
    if (!course) return undefined;
    const courseModules = get().getCourseModulesByCourseId(courseId);
    const materialIds = courseModules.flatMap((courseModule) => courseModule.materials ?? []);
    const testPaperIds = courseModules.flatMap((courseModule) => courseModule.testPapers ?? []);
    // Read-once cross-store reads: this runs from a handler, never during render.
    const testPapers = useTestPaperStore.getState().getTestPapersByIds(testPaperIds);
    const materialsStats = useMaterialStore.getState().getMaterialsStatsByMaterialIds(materialIds);
    const meetsDurationMins = useMeetStore
      .getState()
      .getMeetsByIds(course.meets ?? [])
      .reduce((total, meet) => total + (meet.durationMins ?? 0), 0);
    const stats: ICourseStats = {
      daysCount: courseModules.length,
      videosCount: materialsStats.types[MaterialType.VIDEO],
      readingsCount: materialsStats.types[MaterialType.READING],
      testsCount: testPaperIds.length,
      meetsCount: (course.meets ?? []).length,
      testsDurationMins: testPapers.reduce((total, testPaper) => total + (testPaper.durationMins ?? 0), 0),
      materialsDurationMins: materialsStats.durationMins,
      meetsDurationMins,
    };
    get().patchCourse(courseId, { stats });
    return stats;
  },

  loadCourses: () =>
    get().run('courses', async () => {
      const result = await CourseService.getCourses();
      if (result?.data) get().addCourses(result.data);
    }),

  loadCoursePlans: (courseId) =>
    get().run('plans', async () => {
      const result = await PlanService.getCoursePlans(courseId);
      if (result?.data) get().addPlans(result.data);
    }),

  loadCourseModules: (courseId) =>
    get().run('courseModules', async () => {
      const result = await CourseService.getCourseModulesByCourseId(courseId);
      if (result?.data) get().addCourseModules(result.data);
    }),

  reset: () => {
    set({ courseMap: {}, planMap: {}, courseModuleMap: {} });
    get().resetRequests();
  },
}));

/**
 * The store's lookups, subscribed to the state they read.
 *
 * `getCourseSubjectItems` resolves subjects through the standard store, so this subscribes to both.
 */
export const useCourseLookups = (): ICourseState => {
  useStandardStore(useShallow((state) => state.subjectMap));
  return useCourseStore(useShallow((state) => state));
};

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
export const useSelectedCoursePlans = (): IPlan[] => {
  const selectedCourseId = useSelectorStore((state) => state.selectedCourseId);
  return useCourseStore(useShallow((state) => state.getPlansByCourseId(selectedCourseId)));
};
