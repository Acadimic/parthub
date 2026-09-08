import { type Instance, flow, getRoot, types as t } from 'mobx-state-tree';
import { QuestionType } from '../enums';
import { QuestionService } from '../services';
import { getObjectId } from '../utils/helpers';
import { type IOption, type IQuestion, type ISolution, Option, Question, Solution } from './models';
import { type IStore } from './root.store';

export const QuestionStore = t
  .model({
    questionMaps: t.map(Question),
    optionMaps: t.map(Option),
    solutionMaps: t.map(Solution),
    isLoadingQuestions: t.optional(t.boolean, false),
    isLoadedQuestions: t.optional(t.boolean, false),
    isLoadingOptions: t.optional(t.boolean, false),
    isLoadedOptions: t.optional(t.boolean, false),
  })
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },

    getQuestionById(questionId: string): IQuestion | undefined {
      return questionId ? self.questionMaps.get(questionId) : undefined;
    },

    getOptionById(optionId: string): IOption | undefined {
      return optionId ? self.optionMaps.get(optionId) : undefined;
    },

    get questions(): IQuestion[] {
      return Array.from(self.questionMaps.values());
    },

    get options(): IOption[] {
      return Array.from(self.optionMaps.values());
    },

    get solutions(): ISolution[] {
      return Array.from(self.solutionMaps.values());
    },
  }))
  .views((self) => ({
    getQuestionsByIds(ids: string[]): IQuestion[] {
      const items: IQuestion[] = [];
      ids.forEach((id) => {
        const item = self.getQuestionById(id);
        if (item) items.push(item);
      });
      return items;
    },

    getOptionsByIds(ids: string[]): IOption[] {
      const items: IOption[] = [];
      ids.forEach((id) => {
        const item = self.getOptionById(id);
        if (item) items.push(item);
      });
      return items;
    },

    getQuestionsBySectionId(sectionId: string): IQuestion[] {
      return sectionId ? self.questions.filter((question) => question.section === sectionId) : [];
    },

    getQuestionsBySectionIds(sectionIds: string[]): IQuestion[] {
      return sectionIds.length ? self.questions.filter((question) => sectionIds.includes(question.section)) : [];
    },

    getSolutionByQuestionId(questionId: string): ISolution | undefined {
      return questionId ? self.solutions.find((solution) => solution.question === questionId) : undefined;
    },

    getSolutionById(id: string): ISolution | undefined {
      return id ? self.solutionMaps.get(id) : undefined;
    },
  }))
  .actions((self) => ({
    addQuestion: (obj: IQuestion) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.questionMaps.has(objId);
      if (isObj) self.questionMaps.set(objId, obj);
      else self.questionMaps.put(obj);
    },

    addOption: (obj: IOption) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.optionMaps.has(objId);
      if (isObj) self.optionMaps.set(objId, obj);
      else self.optionMaps.put(obj);
    },

    addSolution: (obj: ISolution) => {
      if (!obj) return;
      const objId = obj._id;
      const isObj = self.solutionMaps.has(objId);
      if (isObj) self.solutionMaps.set(objId, obj);
      else self.solutionMaps.put(obj);
    },

    removeQuestionById: (id: string) => {
      self.questionMaps.delete(id);
    },

    removeOptionById: (id: string) => {
      self.optionMaps.delete(id);
    },
  }))
  .actions((self) => ({
    addQuestions: (objects: IQuestion[]) => {
      objects.forEach((obj) => self.addQuestion(obj));
    },

    addOptions: (objects: IOption[]) => {
      objects.forEach((obj) => self.addOption(obj));
    },

    addSolutions: (objects: ISolution[]) => {
      objects.forEach((obj) => self.addSolution(obj));
    },
  }))
  .actions((self) => ({
    loadQuestions: flow(function* () {
      self.isLoadingOptions = true;
      const result = yield QuestionService.getQuestions();
      if (result?.data) self.addQuestions(result.data);
      self.isLoadingOptions = false;
      self.isLoadedOptions = true;
    }),

    createOption: (question: string, optionString?: string, isCorrect?: boolean) => {
      const option = Option.create({
        _id: getObjectId(),
        option: optionString || '',
        question,
        isCorrect: isCorrect || false,
        isNew: true,
        ...self.rootStore.selectorStore.selectedData,
      });
      self.addOption(option);
      return option;
    },
  }))
  .actions((self) => ({
    getNewOptions: (questionId: string, questionType: QuestionType): IOption[] => {
      const options =
        questionType === QuestionType.BOOLEAN
          ? [self.createOption(questionId, 'True'), self.createOption(questionId, 'False')]
          : questionType === QuestionType.SINGLE_CHOICE || questionType === QuestionType.MULTIPLE_CHOICE
            ? Array.from({ length: 4 }, () => self.createOption(questionId))
            : [self.createOption(questionId, '', true)];
      return options;
    },
  }));

export type IQuestionStore = Instance<typeof QuestionStore>;
