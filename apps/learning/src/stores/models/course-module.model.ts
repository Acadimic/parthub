import { type Instance, type SnapshotIn, type SnapshotOut, types as t } from 'mobx-state-tree';
import { BaseTimestampModel } from './base-models/base-timestamp.model';

export const CourseModule = t.compose(
  BaseTimestampModel,
  t.model('CourseModule', {
    _id: t.identifier,
    course: t.string,
    name: t.string,
    slug: t.string,
    description: t.maybeNull(t.string),
    day: t.number,
    materials: t.optional(t.array(t.string), []),
    testPapers: t.optional(t.array(t.string), []),
    meets: t.optional(t.array(t.string), []),
    isNew: t.optional(t.boolean, false),
  }),
);

export interface ICourseModule extends Instance<typeof CourseModule> {}
export interface ICourseModuleSnapshotIn extends SnapshotIn<typeof CourseModule> {}
export interface ICourseModuleSnapshotOut extends SnapshotOut<typeof CourseModule> {}
