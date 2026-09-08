import { type Instance, types as t } from 'mobx-state-tree';
import { BaseOrgOwnerModel, BaseTimestampModel } from '../base-models';

export const UserBatchMapping = t.compose(
  BaseTimestampModel,
  BaseOrgOwnerModel,
  t.model('UserBatchMapping', {
    _id: t.identifier,
    user: t.string,
    batch: t.string,
  }),
);

export type IUserBatchMapping = Instance<typeof UserBatchMapping>;
