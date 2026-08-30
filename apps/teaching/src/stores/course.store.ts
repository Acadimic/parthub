import { Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { CurrencyType, MaterialType, PeriodType } from '../enums';
import { CourseService, PlanService } from '../services';
import { capitalize, getObjectId } from '../utils/helpers';
import { Course, CourseModule, ICourse, ICourseModule, ICourseStats, IPlan, Plan } from './models';
import { IStore } from './root.store';

export const CourseStore = t
  .model({
    courseMaps: t.map(Course),
    planMaps: t.map(Plan),
    courseModuleMaps: t.map(CourseModule),
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
  }))
  .views((self) => ({
    getCourseById(courseId: string): ICourse | undefined {
      return courseId ? self.courseMaps.get(courseId) : undefined;
    },

    getCourseModuleById(courseModuleId: string): ICourseModule | undefined {
      return courseModuleId ? self.courseModuleMaps.get(courseModuleId) : undefined;
    },

    getCourseModulesByCourseId(courseId: string): ICourseModule[] {
      return self.courseModules.filter((courseModule) => courseModule.course === courseId);
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

    removeCourseById: (courseId: string) => {
      self.courseMaps.delete(courseId);
    },

    removeCourseModuleById: (courseModuleId: string) => {
      self.courseModuleMaps.delete(courseModuleId);
    },
  }))
  .actions((self) => ({
    loadCourses: flow(function* () {
      self.isCourseLoading = true;
      const result = yield CourseService.getCourses();
      console.log('###result: ', result);
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
      self.isCourseModuleLoading = true;
      const result = yield CourseService.getCourseModulesByCourseId(courseId);
      if (!result?.data) {
        self.isCourseModuleLoading = false;
        return;
      }
      self.addCourseModules(result.data);
      self.isCourseModuleLoading = false;
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
  }))
  .actions((self) => ({
    createCourse: () => {
      const order = self.courses.length;
      const id = getObjectId();
      const course = Course.create({
        _id: id,
        name: '',
        slug: '',
        standards: [],
        subjects: [],
        courses: [id],
        meets: [],
        order,
        isNew: true,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addCourse(course);
      self.createPlan(course._id, 0, PeriodType.MONTHLY);
      self.createPlan(course._id, 1, PeriodType.YEARLY);
      self.rootStore.selectorStore.setSelectedCourseId(course._id);
      return course;
    },

    createCourseModule: (courseId: string) => {
      const courseModulesLength = self.getCourseModulesByCourseId(courseId).length;
      const courseModule = CourseModule.create({
        _id: getObjectId(),
        course: courseId,
        name: '',
        slug: '',
        day: courseModulesLength + 1,
        materials: [],
        testPapers: [],
        isNew: true,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addCourseModule(courseModule);
      self.rootStore.selectorStore.setSelectedCourseModuleId(courseModule._id);
      return courseModule;
    },

    calculateAndSetCourseStatsByCourseId(courseId: string): ICourseStats | undefined {
      const course = self.getCourseById(courseId);
      if (!course) return;
      const courseModules = self.getCourseModulesByCourseId(courseId);
      const materialsIds = courseModules.map((courseModule) => courseModule.materials).flat();
      const testsIds = courseModules.map((courseModule) => courseModule.testPapers).flat();
      const testPapers = self.rootStore.testPaperStore.getTestPapersByIds(testsIds);
      const testsDurationMins = testPapers.reduce((total, testPaper) => total + testPaper.durationMins, 0);
      const materialsStats = self.rootStore.materialStore.getMaterialsStatsByMaterialIds(materialsIds);
      const meetsDurationMins = self.rootStore.meetStore
        .getMeetsByIds(course.meets)
        .reduce((total, meet) => total + meet.durationMins, 0);
      const stats = {
        daysCount: courseModules.length,
        videosCount: materialsStats.types[MaterialType.VIDEO],
        readingsCount: materialsStats.types[MaterialType.READING],
        testsCount: testsIds.length,
        meetsCount: course.meets.length,
        testsDurationMins,
        materialsDurationMins: materialsStats.durationMins,
        meetsDurationMins,
      };
      course.stats = stats;
      return stats;
    },
  }))
  .views((self) => ({
    plansByCourseId(courseId: string) {
      return self.plans.filter((plan) => plan.courses.includes(courseId));
    },
  }));

export type ICourseStore = Instance<typeof CourseStore>;
