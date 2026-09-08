import { ISelectItem } from '@interfaces';
import { Instance, SnapshotIn, getRoot, types as t } from 'mobx-state-tree';
import { PaperCategoryType, PaperType } from '../../enums';
import { getSlug } from '../../utils/helpers';
import { IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';

export const TestPaper = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('TestPaper', {
      _id: t.identifier,
      name: t.string,
      slug: t.string,
      standards: t.array(t.string),
      subjects: t.optional(t.array(t.string), []),
      isPublished: t.optional(t.boolean, false),
      publishedDate: t.maybeNull(t.string),
      webLink: t.optional(t.string, ''),
      appLink: t.optional(t.string, ''),
      sections: t.array(t.string),
      totalQuestions: t.optional(t.number, 0),
      durationMins: t.optional(t.number, 60),
      year: t.optional(t.number, new Date().getFullYear()),
      maxMarks: t.optional(t.number, 0),
      paperType: t.optional(t.enumeration('PaperType', [...Object.values(PaperType), '']), ''),
      instruction: t.optional(t.string, ''),
      paperCategory: t.optional(
        t.enumeration('PaperCategoryType', Object.values(PaperCategoryType)),
        PaperCategoryType.CUSTOM,
      ),
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
      self.slug = getSlug(name);
    },

    setYear: (year: number) => {
      self.year = year;
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setStandards: (standardIds: string[]) => {
      self.standards.replace(standardIds);
    },

    setSubjects: (subjectIds: string[]) => {
      self.subjects.replace(subjectIds);
    },

    setPaperType: (paperType: PaperType) => {
      self.paperType = paperType;
    },

    setSections: (sectionIds: string[]) => {
      self.sections.replace(sectionIds);
    },

    setDurationMins: (durationMins: number) => {
      self.durationMins = durationMins;
    },

    updateTotalQuestionsAndMarks: () => {
      const questions = self.rootStore.questionStore.getQuestionsBySectionIds(self.sections);
      const totalQuestions = questions.length;
      const maxMarks = questions.reduce((acc, question) => {
        const correctMarks = question.markings.correct;
        return acc + correctMarks;
      }, 0);
      self.totalQuestions = totalQuestions;
      self.maxMarks = maxMarks;
    },
  }))
  .views((self) => ({
    get subjectItems(): ISelectItem[] {
      return self.rootStore.standardStore
        .getSubjectsByIds(self.subjects)
        .map((subject) => ({ label: subject.name, value: subject._id }));
    },

    get standardItems(): ISelectItem[] {
      return self.rootStore.standardStore.getStandardsByIds(self.standards).map((standard) => {
        return { label: standard.name, value: standard._id };
      });
    },
  }));

export type ITestPaper = Instance<typeof TestPaper>;

/** The plain object shape the API must supply for TestPaper.create(). */
export type ITestPaperSnapshotIn = SnapshotIn<typeof TestPaper>;
