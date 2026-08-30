import { types as t } from 'mobx-state-tree';

export const BaseTimestampModel = t.model('BaseTimestampModel', {
  createdAt: t.string,
  updatedAt: t.string,
});
