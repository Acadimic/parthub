import { Instance, types as t } from 'mobx-state-tree';
import { CourseModel } from './models';

export const CourseStore = t
  .model('CourseStore', {
    courseMaps: t.map(CourseModel),
  })
  .views((self) => ({
    get courses() {
      return Array.from(self.courseMaps.values());
    },
  }))
  .actions((self) => ({
    addCourses: (courses: any[]) => {
      courses?.forEach((c: any) => {
        if (c?._id) self.courseMaps.set(c._id, c);
      });
    },
  }));

export type ICourseStore = Instance<typeof CourseStore>;
