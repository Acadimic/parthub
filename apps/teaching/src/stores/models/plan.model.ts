import { type Instance, type SnapshotIn, type SnapshotOut, types as t } from 'mobx-state-tree';
import { CurrencyType, PeriodType } from '../../enums';
import { BaseTimestampModel } from './base-models/base-timestamp.model';

export const Plan = t
  .compose(
    BaseTimestampModel,
    t.model('Plan', {
      _id: t.identifier,
      name: t.string,
      description: t.maybeNull(t.string),
      courses: t.array(t.string),
      meets: t.array(t.string),
      amount: t.number,
      realAmount: t.number,
      currency: t.enumeration('CurrencyType', Object.values(CurrencyType)),
      interval: t.number,
      period: t.enumeration('PeriodType', Object.values(PeriodType)),
      order: t.number,
      isRecommended: t.optional(t.boolean, false),
      tag: t.maybeNull(t.string),
      isNew: t.optional(t.boolean, false),
    }),
  )
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
    },

    setCourses: (courses: string[]) => {
      self.courses.replace(courses);
    },

    setMeets: (meets: string[]) => {
      self.meets.replace(meets);
    },

    setAmount: (amount: number) => {
      self.amount = amount;
    },

    setRealAmount: (amount: number) => {
      self.realAmount = amount;
    },

    resetIsNew: () => {
      self.isNew = false;
    },
  }));

export interface IPlan extends Instance<typeof Plan> {}
export interface IPlanSnapshotIn extends SnapshotIn<typeof Plan> {}
export interface IPlanSnapshotOut extends SnapshotOut<typeof Plan> {}
