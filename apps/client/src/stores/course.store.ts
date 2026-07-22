import { Instance, flow, getRoot, types as t } from 'mobx-state-tree';

const capitalize = (str: string) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');
import { IGetCompletedModule } from '@interfaces';
import { CollectionType, CurrencyType, PeriodType } from '../enums';
import { CourseService, MeetService, PlanService } from '../services';
import { getObjectId } from '../utils/helpers';
import {
  CompletedModule,
  Course,
  CourseModule,
  ICompletedModule,
  ICourse,
  ICourseModule,
  IMaterial,
  IMeet,
  IPlan,
  ITestPaper,
  Plan,
} from './models';
import { IStore } from './root.store';

export const CourseStore = t
  .model({
    courseMaps: t.map(Course),
    planMaps: t.map(Plan),
    courseModuleMaps: t.map(CourseModule),
    completedModuleMaps: t.map(CompletedModule),
    isCourseLoading: t.optional(t.boolean, false),
    isCourseLoaded: t.optional(t.boolean, false),
    isPlanLoading: t.optional(t.boolean, false),
    isCourseModuleLoading: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get courses() {
      return Array.from(self.courseMaps.values());
    },

    get plans() {
      return Array.from(self.planMaps.values());
    },

    get courseModules() {
      return Array.from(self.courseModuleMaps.values());
    },

    get completedModules() {
      return Array.from(self.completedModuleMaps.values());
    },
  }))
  .views((self) => ({
    getCourseById(courseId: string): ICourse | undefined {
      return courseId ? self.courseMaps.get(courseId) : undefined;
    },

    getCourseModuleById(courseModuleId: string): ICourseModule | undefined {
      return courseModuleId ? self.courseModuleMaps.get(courseModuleId) : undefined;
    },

    getCourseModuleByCourseId(courseId: string): ICourseModule[] {
      return self.courseModules.filter((courseModule) => courseModule.course === courseId);
    },

    getCompletedModule({ course, courseModule, collectionItem }: IGetCompletedModule): ICompletedModule | undefined {
      return self.completedModules.find(
        (completedModule) =>
          completedModule.course === course &&
          completedModule.courseModule === courseModule &&
          completedModule.collectionItem === collectionItem,
      );
    },
  }))
  .actions((self) => ({
    addCourse: (course: ICourse) => {
      if (!course) return;
      const courseId = course._id;
      const isCourse = self.courseMaps.has(courseId);
      if (isCourse) self.courseMaps.set(courseId, course);
      else self.courseMaps.put(course);
    },

    addPlan: (plan: IPlan) => {
      if (!plan) return;
      const planId = plan._id;
      const isPlan = self.planMaps.has(planId);
      if (isPlan) self.planMaps.set(planId, plan);
      else self.planMaps.put(plan);
    },

    addCourseModule: (courseModule: ICourseModule) => {
      if (!courseModule) return;
      const courseModuleId = courseModule._id;
      const isPresent = self.courseModuleMaps.has(courseModuleId);
      if (isPresent) self.courseModuleMaps.set(courseModuleId, courseModule);
      else self.courseModuleMaps.put(courseModule);
    },

    addCompletedModule: (completedModule: ICompletedModule) => {
      if (!completedModule) return;
      const completedModuleId = completedModule._id;
      const isPresent = self.completedModuleMaps.has(completedModuleId);
      if (isPresent) self.completedModuleMaps.set(completedModuleId, completedModule);
      else self.completedModuleMaps.put(completedModule);
    },
  }))
  .actions((self) => ({
    addCourses: (courses: ICourse[]) => {
      if (!courses) return;
      courses.forEach((course) => self.addCourse(course));
    },

    addPlans: (plans: IPlan[]) => {
      if (!plans) return;
      plans.forEach((plan) => self.addPlan(plan));
    },

    addCourseModules: (courseModules: ICourseModule[]) => {
      if (!courseModules) return;
      courseModules.forEach((courseModule) => self.addCourseModule(courseModule));
    },

    addCompletedModules: (completedModules: ICompletedModule[]) => {
      if (!completedModules) return;
      completedModules.forEach((completedModule) => self.addCompletedModule(completedModule));
    },

    removeCourseById: (courseId: string) => {
      self.courseMaps.delete(courseId);
    },

    removeCourseModuleById: (courseModuleId: string) => {
      self.courseModuleMaps.delete(courseModuleId);
    },
  }))
  .views((self) => ({
    getCoursesByIds(ids: string[]): ICourse[] {
      const items: ICourse[] = [];
      ids.forEach((id) => {
        const item = self.getCourseById(id);
        if (item) items.push(item);
      });
      return items;
    },

    isCourseModuleItemCompleted(data: IGetCompletedModule): boolean {
      const item = self.getCompletedModule(data);
      return item?.isCompleted ?? false;
    },

    isCourseModuleItemSkipped(data: IGetCompletedModule): boolean {
      const item = self.getCompletedModule(data);
      return item?.isSkipped ?? false;
    },
  }))
  .actions((self) => ({
    loadCourses: flow(function* () {
      self.isCourseLoading = true;
      const selectedUserId = self.rootStore.selectorStore.selectedUserId;
      const standardIds = self.rootStore.userStore
        .getStudentStandardMappingsByStudentId(selectedUserId)
        .map((obj) => obj.standard);
      const result = yield CourseService.getCoursesByStandardIds(standardIds);
      if (!result?.data) {
        self.isCourseLoading = false;
        return;
      }
      self.addCourses(result.data);
      self.isCourseLoading = false;
      self.isCourseLoaded = true;
    }),

    loadCoursePlans: flow(function* (courseId: string) {
      self.isPlanLoading = true;
      const result = yield PlanService.getCoursePlans(courseId);
      if (!result?.data) {
        self.isPlanLoading = false;
        return;
      }
      self.addPlans(result.data);
      self.isPlanLoading = false;
    }),

    loadCourseModules: flow(function* (courseId: string) {
      const course = self.getCourseById(courseId);
      if (!course) return;
      self.isCourseModuleLoading = true;
      const [modulesResult, meetsResult] = yield Promise.all([
        CourseService.getCourseModulesContentsByCourseId(courseId),
        MeetService.getMeetsByIds(courseId, course.meets),
      ]);
      if (!modulesResult?.data || !meetsResult?.data) {
        self.isCourseModuleLoading = false;
        return;
      }
      const modules = modulesResult.data;
      const meets = meetsResult.data;
      interface IRawCourseModule {
        testPapers: ITestPaper[] | string[];
        materials: IMaterial[] | string[];
        meets: IMeet[] | string[];
        [key: string]: unknown;
      }
      (modules as IRawCourseModule[]).forEach((courseModule) => {
        self.rootStore.testPaperStore.addTestPapers(courseModule.testPapers as ITestPaper[]);
        self.rootStore.materialStore.addMaterials(courseModule.materials as IMaterial[]);
        self.rootStore.meetStore.addMeets(courseModule.meets as IMeet[]);
        courseModule.testPapers = (courseModule.testPapers as ITestPaper[]).map((testPaper) => testPaper._id);
        courseModule.materials = (courseModule.materials as IMaterial[]).map((material) => material._id);
        courseModule.meets = (courseModule.meets as IMeet[]).map((meet) => meet._id);
      });
      self.rootStore.meetStore.addMeets(meets);
      self.addCourseModules(modules);
      self.rootStore.selectorStore.setSelectedCourseModuleId(modules[0]?._id);
      self.isCourseModuleLoading = false;
      course.setIsLoadedContents(true);
    }),

    loadCompletedModules: flow(function* () {
      const result = yield CourseService.getCompletedModules();
      if (!result?.data) return;
      self.addCompletedModules(result.data);
      self.rootStore.selectorStore.selectedUser?.setIsLoadedCompletedModules(true);
    }),
  }))
  .actions((self) => ({
    createPlan: (courseId: string, order: number, period: PeriodType) => {
      const plan = Plan.create({
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
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addPlan(plan);
      return plan;
    },

    createCompletedModule: (data: IGetCompletedModule, collectionRef: CollectionType): ICompletedModule => {
      const completedModule = CompletedModule.create({
        ...data,
        _id: getObjectId(),
        collectionRef,
        isCompleted: true,
        isSkipped: false,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addCompletedModule(completedModule);
      return completedModule;
    },
  }))
  .views((self) => ({
    plansByCourseId(courseId: string) {
      return self.plans.filter((plan) => plan.courses.includes(courseId));
    },

    get groupedCoursesByStandardId(): Record<string, ICourse[]> {
      const groupedCourses: Record<string, ICourse[]> = {};
      self.courses.forEach((course) => {
        const standards = course.standards;
        standards.forEach((standard) => {
          if (!groupedCourses[standard]) {
            groupedCourses[standard] = [];
          }
          groupedCourses[standard].push(course);
        });
      });
      return groupedCourses;
    },

    isCourseModuleCompleted(courseModuleId: string): { isAllCompleted: boolean; isPartiallyCompleted: boolean } {
      const courseModule = self.getCourseModuleById(courseModuleId);
      if (!courseModule) return { isAllCompleted: false, isPartiallyCompleted: false };
      let isAllCompleted = true;
      let isPartiallyCompleted = false;
      courseModule.materials.forEach((materialId) => {
        const isCompleted = self.isCourseModuleItemCompleted({
          course: courseModule.course,
          courseModule: courseModule._id,
          collectionItem: materialId,
        });
        if (!isCompleted) {
          isAllCompleted = false;
        } else {
          isPartiallyCompleted = true;
        }
      });
      courseModule.testPapers.forEach((testPaperId) => {
        const isCompleted = self.isCourseModuleItemCompleted({
          course: courseModule.course,
          courseModule: courseModule._id,
          collectionItem: testPaperId,
        });
        if (!isCompleted) {
          isAllCompleted = false;
        } else {
          isPartiallyCompleted = true;
        }
      });
      return { isAllCompleted, isPartiallyCompleted };
    },
  }));

export type ICourseStore = Instance<typeof CourseStore>;
