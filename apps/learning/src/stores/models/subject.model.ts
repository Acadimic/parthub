import { Instance, types as t } from 'mobx-state-tree';

export const Subject = t.model('Subject', {
  _id: t.identifier,
  name: t.string,
  slug: t.string,
});

export type ISubject = Instance<typeof Subject>;
