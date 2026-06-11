import { types as t } from 'mobx-state-tree';

export const BaseModel = t.model('BaseModel', {
  _id: t.identifier,
  isDeleted: t.optional(t.boolean, false),
});
