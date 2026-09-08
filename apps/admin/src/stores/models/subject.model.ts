import { type Instance, types as t } from 'mobx-state-tree';
import { getSlug } from '../../utils/helpers';

export const Subject = t
  .model('Subject', {
    _id: t.identifier,
    name: t.string,
    slug: t.string,
    description: t.maybeNull(t.string),
    logo: t.maybeNull(t.string),
    isNew: t.optional(t.boolean, false),
  })
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
      self.slug = getSlug(name);
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setLogo: (logo: string) => {
      self.logo = logo;
    },

    removeLogo: () => {
      self.logo = null;
    },
  }));

export type ISubject = Instance<typeof Subject>;
