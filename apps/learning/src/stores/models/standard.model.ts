import { type ISelectItem } from '@interfaces';
import { type Instance, getRoot, types as t } from 'mobx-state-tree';
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
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
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
  .views((self) => ({
    get subjectItems() {
      const subjects: ISelectItem[] = [{ label: 'None', value: '' }];
      self.rootStore.standardStore.getSubjectsByIds(self.subjects).forEach((subject) => {
        if (!subjects.some((item) => item.value === subject._id)) {
          subjects.push({ label: subject.name, value: subject._id });
        }
      });
      return subjects;
    },
  }));

export type IStandard = Instance<typeof Standard>;
