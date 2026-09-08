import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { type Marking, type QuestionType, SectionCategoryType, SectionType } from '../../enums';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export type MarkingType = {
  [key in Marking]: number;
};

export type DefaultMarkingType = {
  [key in QuestionType]: MarkingType;
};

export const TestPaperSection = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('TestPaperSection', {
      _id: t.identifier,
      name: t.string,
      description: t.maybeNull(t.string),
      sectionType: t.enumeration('SectionType', Object.values(SectionType)),
      sectionCategory: t.enumeration('SectionCategoryType', Object.values(SectionCategoryType)),
      defaultMarkings: t.frozen<DefaultMarkingType>(),
      subsections: t.optional(t.array(t.string), []),
      instruction: t.optional(t.string, ''),
      isNew: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    setName: (name: string) => {
      self.name = name;
    },

    setSectionType: (sectionType: SectionType) => {
      self.sectionType = sectionType;
    },

    setSectionCategory: (sectionCategory: SectionCategoryType) => {
      self.sectionCategory = sectionCategory;
    },

    setSubsections: (subsectionIds: string[]) => {
      self.subsections.replace(subsectionIds);
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setDefaultMarkings: (defaultMarkings: DefaultMarkingType) => {
      self.defaultMarkings = defaultMarkings;
    },
  }))
  .views((self) => ({
    get questions() {
      return self.rootStore.questionStore.getQuestionsBySectionId(self._id);
    },
  }));

export type ITestPaperSection = Instance<typeof TestPaperSection>;
