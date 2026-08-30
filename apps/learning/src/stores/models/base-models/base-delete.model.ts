import { types as t } from 'mobx-state-tree';

export const BaseDeleteModel = t.model('BaseDeleteModel', {
  isDeleted: t.optional(t.boolean, false),
});
