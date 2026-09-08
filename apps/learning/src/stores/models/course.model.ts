import type { CourseDto } from '@repo/shared';
import { ISelectItem } from '@interfaces';
import { getRoot, Instance, SnapshotIn, SnapshotOut, types as t } from 'mobx-state-tree';
import { IStore } from '../root.store';
import { BaseOrgModel } from './base-models';
import { BaseTimestampModel } from './base-models/base-timestamp.model';
import { Attachment } from './material.model';

export const Stats = t.model('Stats', {
  daysCount: t.number,
  videosCount: t.number,
  readingsCount: t.number,
  testsCount: t.number,
  meetsCount: t.number,
  testsDurationMins: t.number,
  materialsDurationMins: t.number,
  meetsDurationMins: t.number,
});

export const Course = t
  .compose(
    BaseOrgModel,
    BaseTimestampModel,
    t.model('Course', {
      _id: t.identifier,
      name: t.string,
      slug: t.optional(t.string, ''),
      description: t.maybeNull(t.string),
      standards: t.array(t.string),
      subjects: t.array(t.string),
      isPublished: t.optional(t.boolean, false),
      publishedDate: t.maybeNull(t.string),
      order: t.optional(t.number, 0),
      tag: t.maybeNull(t.string),
      isNew: t.optional(t.boolean, false),
      courses: t.array(t.string),
      meets: t.optional(t.array(t.string), []),
      attachments: t.optional(t.array(Attachment), []),
      stats: t.frozen<SnapshotOut<typeof Stats>>({
        daysCount: 0,
        videosCount: 0,
        readingsCount: 0,
        testsCount: 0,
        meetsCount: 0,
        testsDurationMins: 0,
        materialsDurationMins: 0,
        meetsDurationMins: 0,
      }),
      isLoadedContents: t.optional(t.boolean, false),
    }),
  )
  .actions((self) => ({
    setIsLoadedContents(isLoaded: boolean) {
      self.isLoadedContents = isLoaded;
    },
  }))
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .views((self) => ({
    get subjectItems() {
      const subjects: ISelectItem[] = [{ label: 'None', value: '' }];
      self.rootStore.standardStore.getSubjectsByIds(self.subjects).forEach((subject) => {
        if (!subjects.some((item) => item.value === subject._id)) {
          subjects.push({ label: subject.name, value: subject._id });
        }
      });
      return subjects;
    },
  }));

export interface ICourse extends Instance<typeof Course> {}
export interface ICourseStats extends Instance<typeof Stats> {}
export interface ICourseSnapshotIn extends SnapshotIn<typeof Course> {}
export interface ICourseSnapshotOut extends SnapshotOut<typeof Course> {}

/**
 * Compile-time guard: everything the API sends must fit this model's snapshot. If the contract
 * gains a required field, renames one, or changes a type, this line stops compiling.
 */
const _assertCourseWireShape: (dto: CourseDto) => ICourseSnapshotIn = (dto) => dto;
void _assertCourseWireShape;
