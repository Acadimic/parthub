import { type CourseDto, type CourseModuleDto, type CourseStatsDto, type PlanDto } from '@repo/shared/contracts';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
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

/**
 * A course module, as the server sends and accepts it.
 *
 * `isNew` comes from `BaseOwnedDto` and is stripped from every request body, so a draft module is
 * typed exactly like a saved one.
 */
export type ICourseModule = CourseModuleDto;

/** The fetches this store tracks. `course` is the single-row read a deep link needs. */
type CourseFetch = 'courses' | 'course' | 'plans' | 'courseModules';

export interface ICourseState extends IRequestSlice<CourseFetch> {
  courseMap: Record<string, CourseDto>;
  planMap: Record<string, PlanDto>;
  courseModuleMap: Record<string, ICourseModule>;

  getCourseById: (courseId: string) => CourseDto | undefined;
  getPlanById: (planId: string) => PlanDto | undefined;
  getCourseModuleById: (courseModuleId: string) => ICourseModule | undefined;
  getCourses: () => CourseDto[];
  getPlans: () => PlanDto[];
  getCourseModules: () => ICourseModule[];
  getCourseModulesByCourseId: (courseId: string) => ICourseModule[];
  getPlansByCourseId: (courseId: string) => PlanDto[];
  /** A course's subjects as select items, led by a "None" entry. Was a view on the model. */
  getCourseSubjectItems: (courseId: string) => { label: string; value: string }[];

  /**
   * Merges rows into the ones held: `course/all` leaves out the AI syllabus arrays a read by id
   * carries. `isNew` is taken as sent, since the server never returns it and a saved row clears it.
   */
  addCourses: (courses: CourseDto[]) => void;
  /** Puts a row back exactly as given, dropping anything set since: what cancelling an edit needs. */
  restoreCourse: (course: CourseDto) => void;
  addPlans: (plans: PlanDto[]) => void;
  addCourseModules: (courseModules: ICourseModule[]) => void;
  patchCourse: (courseId: string, fields: Partial<CourseDto>) => void;
  patchPlan: (planId: string, fields: Partial<PlanDto>) => void;
  patchCourseModule: (courseModuleId: string, fields: Partial<ICourseModule>) => void;
  /** Renames a course module and keeps its slug in step. */
  renameCourseModule: (courseModuleId: string, name: string) => void;
  removeCourseById: (courseId: string) => void;
  removePlanById: (planId: string) => void;
  removeCourseModuleById: (courseModuleId: string) => void;

  /** Adds an unsaved course with its monthly and yearly plans; returns it for the caller to select. */
  createCourse: () => CourseDto;
  createPlan: (courseId: string, order: number, period: PeriodType) => PlanDto;
  /** Adds an unsaved module and returns it, for the caller to select. */
  createCourseModule: (courseId: string) => ICourseModule;
  /** Recomputes a course's roll-ups from its modules and stores them on the course. */
  calculateAndSetCourseStatsByCourseId: (courseId: string) => CourseStatsDto | undefined;

  /** Publishes a course or puts it back in draft, and keeps the saved row in the store. */
  setCoursePublished: (courseId: string, isPublished: boolean) => Promise<void>;
  /**
   * Moves a course one place up or down in the display order the learning catalogue follows.
   * The list is renumbered 0…n−1 on the way, so duplicate or missing orders heal themselves, and
   * only the courses whose number changed are saved.
   */
  moveCourse: (courseId: string, direction: CourseMoveDirection) => Promise<void>;
  /** Soft-deletes a course on the server, then drops it from the store. */
  deleteCourse: (courseId: string) => Promise<void>;
  /** Soft-deletes a module on the server, then drops it from the store. */
  deleteCourseModule: (courseModuleId: string) => Promise<void>;

  loadCourses: () => Promise<void>;
  /** One course by id, for a deep link or a refresh that lands with an empty store. */
  loadCourse: (courseId: string) => Promise<void>;
  loadCoursePlans: (courseId: string) => Promise<void>;
  loadCourseModules: (courseId: string) => Promise<void>;
  reset: () => void;
}

export type CourseMoveDirection = 'up' | 'down';

/** Saved courses in display order; ties keep the order they were created in. */
export const byDisplayOrder = (a: CourseDto, b: CourseDto): number =>
  (a.order ?? 0) - (b.order ?? 0) || String(a._id).localeCompare(String(b._id));

const keyById = <T extends { _id: string }>(rows: T[]): Record<string, T> =>
  rows.reduce<Record<string, T>>((map, row) => {
    map[row._id] = row;
    return map;
  }, {});

export const useCourseStore = create<ICourseState>()((set, get) => ({
  courseMap: {},
  planMap: {},
  courseModuleMap: {},
  ...createRequestSlice(['courses', 'course', 'plans', 'courseModules'], set, get),

  getCourseById: (courseId) => (courseId ? get().courseMap[courseId] : undefined),

  getPlanById: (planId) => (planId ? get().planMap[planId] : undefined),

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
    set((state) => {
      const courseMap = { ...state.courseMap };
      for (const course of courses) {
        courseMap[course._id] = { ...courseMap[course._id], ...course, isNew: course.isNew };
      }
      return { courseMap };
    });
  },

  restoreCourse: (course) => {
    set((state) => ({ courseMap: { ...state.courseMap, [course._id]: course } }));
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

  removePlanById: (planId) => {
    set((state) => {
      const { [planId]: removed, ...planMap } = state.planMap;
      return removed ? { planMap } : state;
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

  createCourse: () => {
    const courseId = getObjectId();
    const course: CourseDto = {
      _id: courseId,
      name: '',
      slug: '',
      standards: [],
      subjects: [],
      // A course lists itself, which is how a bundle of courses is represented.
      courses: [courseId],
      meets: [],
      order: get().getCourses().length,
      // The defaults the model supplied through `t.optional`; a draft must be as complete as a
      // fetched row now that the store type says these are always present.
      isPublished: false,
      attachments: [],
      stats: {
        daysCount: 0,
        videosCount: 0,
        readingsCount: 0,
        testsCount: 0,
        meetsCount: 0,
        testsDurationMins: 0,
        materialsDurationMins: 0,
        meetsDurationMins: 0,
      },
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
    const stats: CourseStatsDto = {
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

  setCoursePublished: async (courseId, isPublished) => {
    const course = get().getCourseById(courseId);
    if (!course) return;
    // `publishedDate` is when the course last went live, so going back to draft leaves it alone.
    const next: CourseDto = {
      ...course,
      isPublished,
      publishedDate: isPublished ? new Date().toISOString() : course.publishedDate,
    };
    const result = await CourseService.upsertCourse(next);
    get().addCourses([result?.data ?? next]);
  },

  moveCourse: async (courseId, direction) => {
    const ordered = get()
      .getCourses()
      .filter((course) => !course.isNew)
      .sort(byDisplayOrder);
    const from = ordered.findIndex((course) => course._id === courseId);
    const to = direction === 'up' ? from - 1 : from + 1;
    if (from < 0 || to < 0 || to >= ordered.length) return;
    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    const changed = ordered
      .map((course, index) => ({ ...course, order: index }))
      .filter((course) => course.order !== get().getCourseById(course._id)?.order);
    // Shown at once, then saved; a failed save reloads the list so the table never lies.
    get().addCourses(changed);
    try {
      for (const course of changed) await CourseService.upsertCourse(course);
    } catch (error) {
      await get().loadCourses();
      throw error;
    }
  },

  deleteCourse: async (courseId) => {
    const course = get().getCourseById(courseId);
    if (!course) return;
    // Soft delete: the row stays for auditing and every read filters it out, so the store drops it
    // rather than waiting for a refetch.
    await CourseService.upsertCourse({ ...course, _deleted: true });
    get().removeCourseById(courseId);
  },

  deleteCourseModule: async (courseModuleId) => {
    const courseModule = get().getCourseModuleById(courseModuleId);
    if (!courseModule) return;
    await CourseService.upsertCourseModule({ ...courseModule, _deleted: true });
    get().removeCourseModuleById(courseModuleId);
  },

  loadCourses: () =>
    get().run('courses', async () => {
      const result = await CourseService.getCourses();
      if (result?.data) get().addCourses(result.data);
    }),

  loadCourse: (courseId) =>
    get().run('course', async () => {
      const result = await CourseService.getCourseById(courseId);
      if (result?.data) get().addCourses([result.data]);
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
export const useSelectedCourse = (): CourseDto | undefined => {
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
