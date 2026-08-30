import { Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { getSlug } from '../../utils/helpers';
import { BaseTimestampModel } from './base-models/base-timestamp.model';

export const CourseModule = t
  .compose(
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
  )
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
      self.slug = getSlug(name);
    },

    setMaterials: (materialIds: string[]) => {
      self.materials.replace(materialIds);
    },

    setTestPapers: (testPaperIds: string[]) => {
      self.testPapers.replace(testPaperIds);
    },

    setMeets: (meetIds: string[]) => {
      self.meets.replace(meetIds);
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export interface ICourseModule extends Instance<typeof CourseModule> {}
export interface ICourseModuleSnapshotIn extends SnapshotIn<typeof CourseModule> {}
export interface ICourseModuleSnapshotOut extends SnapshotOut<typeof CourseModule> {}
