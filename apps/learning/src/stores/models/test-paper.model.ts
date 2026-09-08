import { type ISelectItem } from '@interfaces';
import { flow, getRoot, type Instance, types as t } from 'mobx-state-tree';
import { PaperCategoryType, PaperType } from '../../enums';
import { ReactionService } from '../../services';
import { getSlug } from '../../utils/helpers';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';
import { type ITestPaperSection } from './test-paper-section.model';

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
      paperType: t.enumeration('PaperType', Object.values(PaperType)),
      instruction: t.optional(t.string, ''),
      paperCategory: t.enumeration('PaperCategoryType', Object.values(PaperCategoryType)),
      isNew: t.optional(t.boolean, false),
      isLoadingReactionsCount: t.optional(t.boolean, false),
      isLoadedReactionsCount: t.optional(t.boolean, false),
      reactionsCount: t.optional(t.number, 0),
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

    setReactionsCount: (reactionsCount: number) => {
      self.reactionsCount = reactionsCount;
    },
  }))
  .actions((self) => ({
    loadReactionsCount: flow(function* () {
      if (!self._id) return;
      self.isLoadingReactionsCount = true;
      const result = yield ReactionService.getReactionsCount(self._id);
      console.log('followers count: ', result);
      self.setReactionsCount(result.data);
      self.isLoadingReactionsCount = false;
      self.isLoadedReactionsCount = true;
    }),
  }))
  .views((self) => ({
    get subjectItems() {
      const subjects: ISelectItem[] = [];
      self.rootStore.standardStore.getStandardsByIds(self.standards).forEach((standard) => {
        self.rootStore.standardStore.getSubjectsByIds(standard.subjects).forEach((subject) => {
          if (!subjects.some((item) => item.value === subject._id)) {
            subjects.push({ label: subject.name, value: subject._id });
          }
        });
      });
      return subjects;
    },

    get sectionObjects(): ITestPaperSection[] {
      return self.rootStore.testPaperStore.getTestPaperSectionsByIds(self.sections);
    },
  }));

export type ITestPaper = Instance<typeof TestPaper>;
