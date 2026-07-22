import { Instance, types as t } from 'mobx-state-tree';
import { BaseOrgOwnerModel, BaseTimestampModel } from '../base-models';

export const StudentStandardMapping = t.compose(
  BaseTimestampModel,
  BaseOrgOwnerModel,
  t.model('Chapter', {
    _id: t.identifier,
    student: t.string,
    standard: t.string,
    enrolledAt: t.string,
  }),
);

export type IStudentStandardMapping = Instance<typeof StudentStandardMapping>;
