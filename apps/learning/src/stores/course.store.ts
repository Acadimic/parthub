import { type CourseDto, type PlanDto } from '@repo/shared/contracts';
import { type ICompletedModuleFields, type ICourseModuleFields } from '@repo/shared/interfaces';
import { type IRequestSlice, createRequestSlice } from '@repo/shared/utils';
import { type ICourseFilter, type ICourseFilterOptions, type IGetCompletedModule } from '@interfaces';
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import { type CollectionType, PeriodType, CurrencyType, Subdomain } from '../enums';
import { CourseService, MeetService, PlanService } from '../services';
import { type ICourseModuleContents } from '../services/course.service';
import { capitalize, getObjectId, getToken, onceInFlight, seedPresignedUrlCache } from '../utils/helpers';
import { useMaterialStore } from './material.store';
import { useMeetStore } from './meet.store';
import { useSelectorStore } from './selector.store';
import { useTestPaperStore } from './test-paper.store';
import { useUserStore } from './user.store';

/**
 * A course in the store. `isLoadedContents` and `isLoadedOutline` are client-only — whether this
 * course's modules have been fetched whole, or as a syllabus with no lesson bodies — and
 * `CLIENT_ONLY_KEYS` strips them from every request.
 */
export type ICourse = CourseDto & { isLoadedContents?: boolean; isLoadedOutline?: boolean };
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
  /** The catalogue narrowed by the learner's filters; an empty list on a field does not filter it. */
  getFilteredCourses: (filter: ICourseFilter) => ICourse[];
  /** What each filter may offer, given the ones above it. */
  getCourseFilterOptions: (filter: ICourseFilter) => ICourseFilterOptions;
  /** Courses keyed by each standard they belong to; a course appears under every one of them. */
  getGroupedCoursesByStandardId: (filter?: ICourseFilter) => Record<string, ICourse[]>;
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
  /** The syllabus alone. Enough for a preview or a list; the learning view needs the whole thing. */
  loadCourseOutline: (courseId: string) => Promise<void>;
  loadCompletedModules: () => Promise<void>;
  reset: () => void;
}

/** The distinct values in first-seen order; the filter options are built from these. */
const distinct = (values: string[]): string[] => [...new Set(values)];

/** Whether a course's values meet a filter. Nothing selected means the filter is not applied. */
const matchesFilter = (values: string[] | undefined, selected: string[]): boolean =>
  !selected.length || (values ?? []).some((value) => selected.includes(value));

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

/**
 * Fetches a course's modules, whole or as an outline, and files each embedded collection with the
 * store that owns it. The one request key covers both shapes: a screen only ever waits on one.
 */
const loadModules = (courseId: string, shape: 'contents' | 'outline'): Promise<void> =>
  useCourseStore.getState().run('courseModules', async () => {
    const store = useCourseStore.getState();
    const course = store.getCourseById(courseId);
    if (!course) return;
    const meetIds = course.meets ?? [];
    const [modulesResult, meetsResult] = await Promise.all([
      shape === 'outline'
        ? CourseService.getCourseModulesOutlineByCourseId(courseId)
        : CourseService.getCourseModulesContentsByCourseId(courseId),
      // `meet/by-ids` requires a non-empty list, and a course with no sessions has nothing to ask
      // for. Skipping keeps a 400 out of a page that is not showing sessions anyway.
      meetIds.length ? MeetService.getMeetsByIds(meetIds) : Promise.resolve(null),
    ]);
    // The sessions are a separate concern from the syllabus: this used to bail when either call
    // came back empty, so a failed meets fetch threw away modules that had loaded perfectly.
    if (!modulesResult?.data) return;
    // The modules arrive with their test papers, materials and meets embedded. Each collection
    // goes to the store that owns it and the module keeps only ids, which is what the rest of the
    // app reads.
    const courseModules = modulesResult.data.map(distributeCourseModule);
    if (meetsResult?.data) useMeetStore.getState().addMeets(meetsResult.data);
    store.addCourseModules(courseModules);
    // Only when nothing in this course is selected: the preview picks an item and then opens the
    // learning view, which loads the contents, and that pick must survive the load.
    const selector = useSelectorStore.getState();
    const isSelectionInCourse = courseModules.some(
      (courseModule) => courseModule._id === selector.selectedCourseModuleId,
    );
    const firstModuleId = courseModules[0]?._id;
    if (!isSelectionInCourse && firstModuleId) selector.setSelectedCourseModuleId(firstModuleId);
    // An outline never downgrades a course whose whole contents are already here.
    store.patchCourse(
      courseId,
      shape === 'outline' ? { isLoadedOutline: true } : { isLoadedContents: true, isLoadedOutline: true },
    );
  });

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

  getFilteredCourses: (filter) =>
    get()
      .getCourses()
      .filter(
        (course) =>
          matchesFilter(course.standards, filter.standards) && matchesFilter(course.subjects, filter.subjects),
      ),

  // Subjects are drawn from the courses the standard filter has already kept, so a learner is never
  // offered one that would empty the grid.
  getCourseFilterOptions: (filter) => {
    const { getCourses, getFilteredCourses } = get();
    const byStandard = getFilteredCourses({ ...filter, subjects: [] });
    return {
      standards: distinct(getCourses().flatMap((course) => course.standards ?? [])),
      subjects: distinct(byStandard.flatMap((course) => course.subjects ?? [])),
    };
  },

  getGroupedCoursesByStandardId: (filter) =>
    (filter ? get().getFilteredCourses(filter) : get().getCourses()).reduce<Record<string, ICourse[]>>(
      (grouped, course) => {
        // Only the standards the filter kept: a course on two standards would otherwise still show
        // up under the one the learner filtered out.
        const standardIds = filter?.standards.length
          ? (course.standards ?? []).filter((standardId) => filter.standards.includes(standardId))
          : (course.standards ?? []);
        standardIds.forEach((standardId) => {
          grouped[standardId] = [...(grouped[standardId] ?? []), course];
        });
        return grouped;
      },
      {},
    ),

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

  // The catalogue is every published course, whichever organization authored it, so this needs no
  // session and no standard filter. It replaced a call to `course/standards`, a route the server
  // does not have — it 404'd, and the course list was empty for everyone as a result.
  loadCourses: () =>
    onceInFlight('courses', () =>
      get().run('courses', async () => {
        // A visitor with no session cannot sign the covers, so the response carries them.
        const result = await CourseService.getPublishedCourses({ signed: !getToken(Subdomain.LEARN) });
        if (!result?.data) return;
        seedPresignedUrlCache(result.data.presignedUrls);
        get().addCourses(result.data.courses);
      }),
    ),

  loadCoursePlans: (courseId) =>
    onceInFlight(`coursePlans:${courseId}`, () =>
      get().run('plans', async () => {
        const result = await PlanService.getCoursePlans(courseId);
        if (result?.data) get().addPlans(result.data);
      }),
    ),

  loadCourseModules: (courseId) => onceInFlight(`courseModules:${courseId}`, () => loadModules(courseId, 'contents')),

  loadCourseOutline: (courseId) => onceInFlight(`courseOutline:${courseId}`, () => loadModules(courseId, 'outline')),

  loadCompletedModules: () =>
    onceInFlight('completedModules', () =>
      get().run('completedModules', async () => {
        const result = await CourseService.getCompletedModules();
        if (!result?.data) return;
        get().addCompletedModules(result.data);
        const selectedUserId = useSelectorStore.getState().selectedUserId;
        if (selectedUserId) useUserStore.getState().patchUser(selectedUserId, { isLoadedCompletedModules: true });
      }),
    ),

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
