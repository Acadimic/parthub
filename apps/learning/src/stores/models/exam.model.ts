import { type ISubjectGraphData } from '@interfaces';
import { type Instance, getRoot, types as t } from 'mobx-state-tree';
import { Marking, PaperCategoryType, PaperType } from '../../enums';
import { getMinutesString, groupBy } from '../../utils/helpers';
import { type IStore } from '../root.store';
import { type IQuestion } from './question.model';
import { type ITestPaperSection } from './test-paper-section.model';

export interface IQuestionWiseTimeTakenMap {
  [questionId: string]: number; // time in seconds
}

export interface IResultMap {
  [questionId: string]: Marking;
}

export interface IAnswerMap {
  [questionId: string]: string[];
}

export interface ISectionWiseQuestionsMap {
  [questionId: string]: string[];
}

export type IResultCount = {
  [key in Marking]: number;
};

export interface ISummaryCount {
  notVisited: number;
  notAnswered: number;
  answered: number;
  markedForReview: number;
  answeredAndMarkedForReview: number;
}

export const Exam = t
  .model('Exam', {
    _id: t.identifier,
    testPaper: t.string,
    title: t.string,
    instruction: t.string,
    questionWiseSpendTime: t.map(t.number),
    questionWiseReplyTime: t.map(t.number),
    totalSpendTime: t.number,
    answerMaps: t.map(t.array(t.string)), // Maps question ID to an array of correct options IDs
    responseMaps: t.map(t.array(t.string)), // Maps question ID to an array of responded options IDs
    visited: t.array(t.string),
    markedForReviews: t.array(t.string),
    sectionWiseQuestionIdsMaps: t.map(t.array(t.string)), // Maps section ID to an array of question IDs
    numberOfQuestions: t.number,
    durationMins: t.number,
    maxMarks: t.number,
    year: t.number,
    sections: t.array(t.string),
    questions: t.array(t.string),
    standards: t.array(t.string),
    subjects: t.array(t.string),
    resultMaps: t.map(t.enumeration('Marking', Object.values(Marking))), // Maps question ID to its marking result
    isPractice: t.optional(t.boolean, false),
    isSubmitted: t.optional(t.boolean, false),
    paperCategory: t.enumeration('PaperCategoryType', Object.values(PaperCategoryType)),
    paperType: t.enumeration('PaperType', Object.values(PaperType)),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    get responses(): string[][] {
      return Array.from(self.responseMaps.values());
    },

    get results(): Marking[] {
      return Array.from(self.resultMaps.values());
    },
  }))
  .views((self) => ({
    getReplyTimeByQuestionId: (questionId: string): number => {
      return self.questionWiseReplyTime.get(questionId) ?? 0;
    },

    getTimeSpendByQuestionId: (questionId: string): number => {
      return self.questionWiseSpendTime.get(questionId) ?? 0;
    },

    getAnswersByQuestionId: (questionId: string): string[] => {
      return self.answerMaps.get(questionId) ?? [];
    },

    getResponsesByQuestionId: (questionId: string): string[] => {
      return self.responseMaps.get(questionId) ?? [];
    },

    getQuestionIdsBySectionId: (sectionId: string): string[] => {
      return self.sectionWiseQuestionIdsMaps.get(sectionId) ?? [];
    },

    getResultByQuestionId: (questionId: string): Marking => {
      return self.resultMaps.get(questionId) || Marking.UNATTEMPTED;
    },

    getQuestionIndexByQuestionId: (questionId: string): number => {
      return self.questions.indexOf(questionId);
    },
  }))
  .actions((self) => ({
    setTimeSpendByQuestionId: (questionId: string, timeSpend: number) => {
      self.questionWiseSpendTime.set(questionId, timeSpend);
    },

    setReplyTimeByQuestionId: (questionId: string, replyTime: number) => {
      self.questionWiseSpendTime.set(questionId, replyTime);
    },

    setResponsesByQuestionId: (questionId: string, responses: string[]) => {
      self.responseMaps.set(questionId, responses);
    },

    setResultByQuestionId: (questionId: string, marking: Marking) => {
      self.resultMaps.set(questionId, marking);
    },

    setVisited(questionId: string) {
      if (!self.visited.includes(questionId)) self.visited.push(questionId);
    },

    submitExam: () => {
      self.isSubmitted = true;
    },
  }))
  .actions((self) => ({
    addSpendTimeByQuestionId: (questionId: string, timeTaken: number) => {
      self.questionWiseSpendTime.set(questionId, timeTaken);
    },

    addReplyTimeByQuestionId: (questionId: string, timeTaken: number) => {
      self.questionWiseReplyTime.set(questionId, timeTaken);
    },

    setResult: () => {
      const selectedQuestion = self.rootStore.selectorStore.selectedQuestion;
      if (!selectedQuestion) return;
      const section = self.rootStore.testPaperStore.getTestPaperSectionById(selectedQuestion.section);
      if (!section) return;
      const responses = self.getResponsesByQuestionId(selectedQuestion._id);
      const answers = self.getAnswersByQuestionId(selectedQuestion._id);
      if (responses.length === 0) {
        self.setResultByQuestionId(selectedQuestion._id, Marking.UNATTEMPTED);
      } else if (answers.some((ans: string) => !responses.includes(ans)) || responses.length > answers.length) {
        self.setResultByQuestionId(selectedQuestion._id, Marking.INCORRECT);
      } else if (answers.length === responses.length) {
        self.setResultByQuestionId(selectedQuestion._id, Marking.CORRECT);
      } else {
        self.setResultByQuestionId(selectedQuestion._id, Marking.PARTIALLY_CORRECT);
      }
    },

    getObtainedMarksByQuestionId: (questionId: string): number => {
      const question = self.rootStore.questionStore.getQuestionById(questionId);
      if (!question) return 0;
      const markings = question.markings;
      if (question.isBonus) return markings[Marking.CORRECT];
      const markingResult = self.getResultByQuestionId(questionId);
      let marks = markings[markingResult];
      if (markingResult === Marking.PARTIALLY_CORRECT && (marks === undefined || marks === null)) {
        const correctMarks = markings[Marking.CORRECT];
        const ratio = correctMarks / question.correctOptions.length;
        const total = self.getResponsesByQuestionId(questionId).length;
        marks = Math.round(ratio * total * 100) / 100;
      }
      return marks;
    },

    increaseSelectedQuestionTimeSpend: () => {
      const selectedQuestion = self.rootStore.selectorStore.selectedQuestion;
      if (!selectedQuestion) return;
      self.totalSpendTime += 1;
      const questionId = selectedQuestion._id;
      const timeSpend = self.getTimeSpendByQuestionId(questionId);
      self.questionWiseSpendTime.set(questionId, timeSpend + 1);
      const responses = self.getResponsesByQuestionId(questionId);
      const answers = self.getAnswersByQuestionId(questionId);
      if (responses.length < answers.length) {
        self.questionWiseReplyTime.set(questionId, timeSpend + 1);
      }
    },

    selectNextQuestion: () => {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const index = self.questions.indexOf(selectedQuestionId);
      if (index < self.questions.length - 1) {
        const newQuestionId = self.questions[index + 1];
        self.setVisited(newQuestionId);
        self.rootStore.selectorStore.setSelectedQuestionId(newQuestionId);
      }
    },

    selectPrevQuestion: () => {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const index = self.questions.indexOf(selectedQuestionId);
      if (index > 0) {
        const newQuestionId = self.questions[index - 1];
        self.setVisited(newQuestionId);
        self.rootStore.selectorStore.setSelectedQuestionId(newQuestionId);
      }
    },

    toggleSelectedQuestionMarkForReview: () => {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const index = self.markedForReviews.indexOf(selectedQuestionId);
      if (index > -1) {
        self.markedForReviews.splice(index, 1);
      } else {
        self.markedForReviews.push(selectedQuestionId);
      }
    },

    clearResponse: () => {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      self.questionWiseReplyTime.set(selectedQuestionId, self.questionWiseSpendTime.get(selectedQuestionId) ?? 0);
      self.setResponsesByQuestionId(selectedQuestionId, []);
      self.setResultByQuestionId(selectedQuestionId, Marking.UNATTEMPTED);
    },

    resetResponse: () => {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      self.questionWiseReplyTime.set(selectedQuestionId, 0);
      self.questionWiseSpendTime.set(selectedQuestionId, 0);
      self.setResponsesByQuestionId(selectedQuestionId, []);
      self.setResultByQuestionId(selectedQuestionId, Marking.UNATTEMPTED);
    },
  }))
  .actions((self) => ({
    setResponse: (responses: string[]) => {
      self.setResponsesByQuestionId(self.rootStore.selectorStore.selectedQuestionId, responses);
      self.setResult();
    },
  }))
  .views((self) => ({
    isMarkedForReview: (questionId: string) => {
      return self.markedForReviews.includes(questionId);
    },

    isVisited: (questionId: string): boolean => {
      return self.visited.includes(questionId);
    },

    isResponded: (questionId: string): boolean => {
      return self.getResponsesByQuestionId(questionId).length > 0;
    },

    canShowAnswer: (questionId: string): boolean => {
      if (self.isSubmitted) return true;
      if (self.isPractice) {
        const answers = self.getAnswersByQuestionId(questionId);
        const responses = self.getResponsesByQuestionId(questionId);
        return responses.length === answers.length;
      }
      return false;
    },

    get sectionObjects(): ITestPaperSection[] {
      return self.rootStore.testPaperStore.getTestPaperSectionsByIds(self.sections);
    },

    get questionObjects(): IQuestion[] {
      return self.rootStore.questionStore.getQuestionsByIds(self.sections);
    },

    get isFirstQuestion(): boolean {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const index = self.questions.indexOf(selectedQuestionId);
      return index === 0;
    },

    get isLastQuestion(): boolean {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const index = self.questions.indexOf(selectedQuestionId);
      return index === self.questions.length - 1;
    },

    get marksObtained() {
      let totalMarksObtained = 0;
      Array.from(self.resultMaps.keys()).forEach((questionId) => {
        const question = self.rootStore.questionStore.getQuestionById(questionId);
        const marks = question?.markings[self.getResultByQuestionId(questionId)];
        if (marks) totalMarksObtained += marks;
      });
      return totalMarksObtained;
    },
  }))
  .views((self) => ({
    get isSelectedQuestionMarkedForReview(): boolean {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      return self.isMarkedForReview(selectedQuestionId);
    },

    get isSelectedQuestionResponded(): boolean {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const responses = self.getResponsesByQuestionId(selectedQuestionId);
      return responses.length > 0;
    },

    get summaryCounts(): ISummaryCount {
      const answered = self.responses.filter((responses) => responses.length > 0).length;
      const summaryCount: ISummaryCount = {
        notVisited: self.numberOfQuestions - self.visited.length,
        notAnswered: self.visited.length - answered,
        answered,
        markedForReview: self.markedForReviews.length,
        answeredAndMarkedForReview: self.markedForReviews.filter((questionId) => self.isResponded(questionId)).length,
      };
      return summaryCount;
    },

    get resultCounts(): IResultCount {
      const resultCount: IResultCount = {
        [Marking.CORRECT]: 0,
        [Marking.PARTIALLY_CORRECT]: 0,
        [Marking.INCORRECT]: 0,
        [Marking.UNATTEMPTED]: 0,
      };
      self.results.forEach((result: Marking) => {
        resultCount[result] += 1;
      });
      return resultCount;
    },

    get attemptedCount(): number {
      return self.responses.filter((values) => values.length > 0).length;
    },

    get currentQuestionIndex(): number {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      return self.getQuestionIndexByQuestionId(selectedQuestionId);
    },

    get timeLeft(): number {
      const totalTime = self.durationMins * 60;
      const timeSpent = self.totalSpendTime;
      return totalTime - timeSpent;
    },

    get percentage() {
      const marks = self.marksObtained;
      const totalMarks = self.maxMarks;
      return totalMarks ? Math.round((marks / totalMarks) * 100) : 0;
    },

    get accuracy() {
      let correct = 0;
      let incorrect = 0;
      self.results.forEach((result) => {
        if (result === Marking.CORRECT) {
          correct += 1;
        } else if (result === Marking.INCORRECT) {
          incorrect += 1;
        }
      });
      const total = correct + incorrect;
      return total ? Math.round((correct / total) * 100) : 0;
    },

    get subjectGraphData() {
      const questions = self.rootStore.questionStore.getQuestionsByIds(self.questions);
      const groups = groupBy(
        questions,
        (question) =>
          (question.subject && self.rootStore.standardStore.getSubjectById(question.subject)?.name) || 'Other',
      );
      const data: ISubjectGraphData[] = [];
      Object.keys(groups).forEach((key: string) => {
        const questionGroup = groups[key];
        const correct = questionGroup.filter((q) => self.getResultByQuestionId(q._id) === Marking.CORRECT).length;
        const incorrect = questionGroup.filter((q) => self.getResultByQuestionId(q._id) === Marking.INCORRECT).length;
        const unattempted = questionGroup.filter(
          (q) => self.getResultByQuestionId(q._id) === Marking.UNATTEMPTED,
        ).length;
        const partiallyCorrect = questionGroup.filter(
          (q) => self.getResultByQuestionId(q._id) === Marking.PARTIALLY_CORRECT,
        ).length;
        data.push({
          name: key,
          total: questionGroup.length,
          correct,
          incorrect,
          unattempted,
          partiallyCorrect,
        });
      });
      return data;
    },

    get isSelectedQuestionCompleted(): boolean {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      return self.canShowAnswer(selectedQuestionId);
    },
  }))
  .views((self) => ({
    get selectedQuestionReplyTime(): string {
      const selectedQuestionId = self.rootStore.selectorStore.selectedQuestionId;
      const seconds = self.getReplyTimeByQuestionId(selectedQuestionId);
      return self.isSelectedQuestionCompleted ? getMinutesString(seconds) : '';
    },
  }));

export interface IExam extends Instance<typeof Exam> {}
