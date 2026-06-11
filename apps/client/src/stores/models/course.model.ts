import { types as t } from 'mobx-state-tree';

export const CourseModel = t.model('CourseModel', {
  _id: t.identifier,
  name: t.optional(t.string, ''),
  description: t.optional(t.string, ''),
  thumbnail: t.optional(t.string, ''),
  status: t.optional(t.string, 'draft'),
});
