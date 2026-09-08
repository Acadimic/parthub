import { type StandardGroup } from '@enums';
import { type Instance, getRoot, types as t } from 'mobx-state-tree';
import { getSlug } from '../../utils/helpers';
import { type IStore } from '../root.store';

export const Standard = t
  .model('Standard', {
    _id: t.identifier,
    name: t.string,
    description: t.maybeNull(t.string),
    logo: t.maybeNull(t.string),
    order: t.number,
    group: t.string,
    slug: t.string,
    alias: t.optional(t.string, ''),
    isNew: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get subjects(): string[] {
      const standardSubjectMappings = getRoot<IStore>(self)
        .standardStore.standardSubjectMappings.filter((mapping) => mapping.standard === self._id)
        .sort((a, b) => a.order - b.order);
      const subjectIds = standardSubjectMappings.map((mapping) => mapping.subject);
      return subjectIds;
    },

    get referenceStandards(): string[] {
      const standardSubjectMappings = getRoot<IStore>(self)
        .standardStore.standardSubjectMappings.filter((mapping) => mapping.standard === self._id)
        .sort((a, b) => a.order - b.order);
      const referenceStandards = standardSubjectMappings.map((mapping) => mapping.referenceStandards).flat();
      return [...new Set(referenceStandards)];
    },
  }))
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
      self.slug = getSlug(name);
    },

    setAlias: (alias: string) => {
      self.alias = alias;
    },

    setOrder: (order: string) => {
      if (!order) self.order = 0;
      else self.order = Number(order);
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setGroup: (group: StandardGroup) => {
      self.group = group;
    },

    setLogo: (logo: string) => {
      self.logo = logo;
    },

    removeLogo: () => {
      self.logo = null;
    },
  }));

export type IStandard = Instance<typeof Standard>;
