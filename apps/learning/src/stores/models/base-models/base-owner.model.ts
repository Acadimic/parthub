import { types as t } from 'mobx-state-tree';

export const BaseOwnerModel = t.model('BaseOwnerModel', {
  createdBy: t.string,
  updatedBy: t.string,
});
