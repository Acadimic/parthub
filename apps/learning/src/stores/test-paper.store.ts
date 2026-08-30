import { Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { Marking } from '../enums';
import { TestPaperService } from '../services';
import { getObjectId } from '../utils/helpers';
import {
  Exam,
  IAnswerMap,
  IQuestionWiseTimeTakenMap,
  IResultMap,
  ISectionWiseQuestionsMap,
  ITestPaper,
  ITestPaperSection,
  TestPaper,
  TestPaperSection,
} from './models';
import { IStore } from './root.store';

export const TestPaperStore = t
  .model({
    testPaperMaps: t.map(TestPaper),
    testPaperSectionMaps: t.map(TestPaperSection),
    isLoadingTestPapers: t.optional(t.boolean, false),
    isLoadedTestPapers: t.optional(t.boolean, false),
    isLoadingTestPaperSections: t.optional(t.boolean, false),
    isLoadedTestPaperSections: t.optional(t.boolean, false),
    isSettingExam: t.optional(t.boolean, false),
    exam: t.maybeNull(Exam),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getTestPaperById(testPaperId: string): ITestPaper | undefined {
      return testPaperId ? self.testPaperMaps.get(testPaperId) : undefined;
    },

    getTestPaperSectionById(testPaperSectionId: string): ITestPaperSection | undefined {
      return testPaperSectionId ? self.testPaperSectionMaps.get(testPaperSectionId) : undefined;
    },

    get testPapers(): ITestPaper[] {
      return Array.from(self.testPaperMaps.values());
    },

    get testPaperSections(): ITestPaperSection[] {
      return Array.from(self.testPaperSectionMaps.values());
    },
  }))
  .views((self) => ({
    getTestPapersByIds(ids: string[]): ITestPaper[] {
      const items: ITestPaper[] = [];
      ids.forEach((id) => {
        const item = self.getTestPaperById(id);
        if (item) items.push(item);
      });
      return items;
    },

    getTestPaperSectionsByIds(ids: string[]): ITestPaperSection[] {
      const items: ITestPaperSection[] = [];
      ids.forEach((id) => {
        const item = self.getTestPaperSectionById(id);
        if (item) items.push(item);
      });
      return items;
    },

    getTestPapersByStandardIds(standardIds: string[]): ITestPaper[] {
      const items: ITestPaper[] = [];
      self.testPapers.forEach((item) => {
        if (item.standards.some((standardId) => standardIds.includes(standardId))) items.push(item);
      });
      return items;
    },
  }))
  .actions((self) => ({
    addTestPaper: (obj: ITestPaper) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.testPaperMaps.has(objId);
      if (isObj) self.testPaperMaps.set(objId, obj);
      else self.testPaperMaps.put(obj);
    },

    addTestPaperSection: (obj: ITestPaperSection) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.testPaperSectionMaps.has(objId);
      if (isObj) self.testPaperSectionMaps.set(objId, obj);
      else self.testPaperSectionMaps.put(obj);
    },

    removeTestPaper: (id: string) => {
      self.testPaperMaps.delete(id);
    },

    removeTestPaperCategory: (id: string) => {
      self.testPaperSectionMaps.delete(id);
    },
  }))
  .actions((self) => ({
    addTestPapers: (objects: ITestPaper[]) => {
      objects.forEach((obj) => self.addTestPaper(obj));
    },

    addTestPaperSections: (objects: ITestPaperSection[]) => {
      objects.forEach((obj) => self.addTestPaperSection(obj));
    },
  }))
  .actions((self) => ({
    loadTestPapers: flow(function* () {
      if (self.isLoadingTestPapers) return;
      self.isLoadingTestPapers = true;
      const result = yield TestPaperService.getTestPapers();
      console.log('result: ', result.data);
      if (result?.data) self.addTestPapers(result.data);
      self.isLoadingTestPapers = false;
      self.isLoadedTestPapers = true;
    }),

    loadTestPaperSectionsWithQuestions: flow(function* (testPaperId: string) {
      self.isLoadingTestPaperSections = true;
      const result = yield TestPaperService.getTestPaperSectionsWithQuestions(testPaperId);
      if (result?.data) {
        const { sections, questions, options, solutions } = result.data;
        self.addTestPaperSections(sections);
        self.rootStore.questionStore.addQuestions(questions);
        self.rootStore.questionStore.addOptions(options);
        self.rootStore.questionStore.addSolutions(solutions);
      }
      self.isLoadingTestPaperSections = false;
      self.isLoadedTestPaperSections = true;
    }),
  }))
  .actions((self) => ({
    loadAndSetExam: flow(function* (testPaperId: string, isPractice: boolean) {
      self.isSettingExam = true;
      self.exam = null;
      yield self.loadTestPaperSectionsWithQuestions(testPaperId);
      const testPaper = self.getTestPaperById(testPaperId);
      if (!testPaper) return;
      const questions = self.rootStore.questionStore.getQuestionsBySectionIds(testPaper.sections);
      if (questions.length === 0) {
        self.isSettingExam = false;
        return;
      }
      const sectionWiseQuestionIdsMaps = testPaper.sections.reduce((acc: ISectionWiseQuestionsMap, section) => {
        const questions = self.rootStore.questionStore.getQuestionsBySectionId(section);
        const questionIds = questions.map((question) => question._id);
        acc[section] = questionIds;
        return acc;
      }, {});
      const questionIds = Object.values(sectionWiseQuestionIdsMaps).flat();
      const firstQuestionId = questionIds[0];
      self.rootStore.selectorStore.setSelectedQuestionId(firstQuestionId);
      const questionWiseSpendTime = questions.reduce((acc: IQuestionWiseTimeTakenMap, question) => {
        acc[question._id] = 0;
        return acc;
      }, {});
      const answerMaps = questions.reduce((acc: IAnswerMap, question) => {
        acc[question._id] = question.correctOptions.map((option) => option._id);
        return acc;
      }, {});
      const responseMaps = questions.reduce((acc: IAnswerMap, question) => {
        acc[question._id] = [];
        return acc;
      }, {});
      const resultMaps = questions.reduce((acc: IResultMap, question) => {
        acc[question._id] = Marking.UNATTEMPTED;
        return acc;
      }, {});
      const exam = Exam.create({
        _id: getObjectId(),
        testPaper: testPaperId,
        title: testPaper.name,
        questionWiseSpendTime,
        questionWiseReplyTime: questionWiseSpendTime,
        totalSpendTime: 0,
        answerMaps,
        responseMaps,
        visited: [firstQuestionId],
        markedForReviews: [],
        numberOfQuestions: questions.length,
        durationMins: testPaper.durationMins,
        maxMarks: testPaper.maxMarks,
        sections: [...testPaper.sections],
        isPractice,
        isSubmitted: false,
        resultMaps,
        sectionWiseQuestionIdsMaps,
        questions: questionIds,
        standards: [...testPaper.standards],
        subjects: [...testPaper.subjects],
        instruction: testPaper.instruction,
        paperType: testPaper.paperType,
        paperCategory: testPaper.paperCategory,
        year: testPaper.year,
      });
      self.exam = exam;
      self.isSettingExam = false;
    }),

    unsetExam: () => {
      self.exam = null;
      self.isSettingExam = false;
    },
  }));

export type ITestPaperStore = Instance<typeof TestPaperStore>;
