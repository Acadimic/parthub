import { types as t } from 'mobx-state-tree';

export const MaterialModel = t.model('MaterialModel', {
  _id: t.identifier,
  name: t.optional(t.string, ''),
  type: t.optional(t.string, ''),
  url: t.optional(t.string, ''),
});
