import { types as t } from 'mobx-state-tree';

export const BaseDeleteModel = t.model('BaseDeleteModel', {
  _deleted: t.optional(t.boolean, false),
});
