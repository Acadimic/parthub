import { type Instance, type SnapshotIn, type SnapshotOut, types as t } from 'mobx-state-tree';
import { BaseTimestampModel } from './base-models/base-timestamp.model';

export const Course = t.compose(
  BaseTimestampModel,
  t.model('Course', {
    _id: t.identifier,
    name: t.string,
    amount: t.number,
    actualAmount: t.number,
    currency: t.string,
    period: t.string,
    interval: t.number,
    isActive: t.optional(t.boolean, false),
  }),
);

export type ICourse = Instance<typeof Course>;
export type ICourseSnapshotIn = SnapshotIn<typeof Course>;
export type ICourseSnapshotOut = SnapshotOut<typeof Course>;
