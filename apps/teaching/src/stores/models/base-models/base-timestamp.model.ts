import { type Instance, types as t } from 'mobx-state-tree';
import { BaseDeleteModel } from './base-delete.model';

export const BaseTimestampModel = t.compose(
  BaseDeleteModel,
  t.model('BaseTimestampModel', {
    createdAt: t.string,
    updatedAt: t.string,
  }),
);

export interface IBaseTimestampModel extends Instance<typeof BaseTimestampModel> {}
