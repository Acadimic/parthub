import { Instance, types as t } from 'mobx-state-tree';
import { Course, ICourse } from './models';

export const CourseStore = t
  .model({
    courseMaps: t.map(Course),
    isLoading: t.optional(t.boolean, false),
    isLoaded: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    addCourse: (course: ICourse) => {
      if (!course) return;
      const courseId = course._id;
      const isCourse = self.courseMaps.has(courseId);
      if (isCourse) self.courseMaps.set(courseId, course);
      else self.courseMaps.put(course);
    },
  }))
  .actions((self) => ({
    addCourses: (courses: ICourse[]) => {
      if (!courses) return;
      courses.forEach((course) => self.addCourse(course));
    },
  }))
  .actions((self) => ({
    // loadCourses: flow(function* () {
    //   self.isLoading = true;
    //   const courses = yield CourseService.getCourses();
    //   if (!courses) return;
    //   self.isLoading = false;
    //   self.addCourses(courses);
    // }),
  }))
  .views((self) => ({
    get courses() {
      return Array.from(self.courseMaps.values());
    },
  }));

export type ICourseStore = Instance<typeof CourseStore>;
