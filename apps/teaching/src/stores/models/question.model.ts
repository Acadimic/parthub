import { type ISelectItem } from '@interfaces';
import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { LevelType, QuestionType } from '../../enums';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';
import { type MarkingType } from './test-paper-section.model';

export const Question = t
  .compose(
    BaseTimestampModel,
    BaseOrgOwnerModel,
    t.model('Question', {
      _id: t.identifier,
      question: t.string,
      standard: t.string,
      subject: t.maybeNull(t.string),
      chapter: t.maybeNull(t.string),
      topic: t.maybeNull(t.string),
      year: t.optional(t.number, new Date().getFullYear()),
      tag: t.maybeNull(t.string),
      options: t.array(t.string),
      questionType: t.optional(t.enumeration('QuestionType', Object.values(QuestionType)), QuestionType.SINGLE_CHOICE),
      markings: t.frozen<MarkingType>(),
      section: t.string,
      subsection: t.maybeNull(t.string),
      level: t.maybeNull(t.enumeration('LevelType', Object.values(LevelType))),
      isNew: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .actions((self) => ({
    setQuestion: (question: string) => {
      self.question = question;
    },

    setYear: (year: number) => {
      self.year = year;
    },

    resetIsNew: () => {
      self.isNew = false;
    },

    setStandard: (standard: string) => {
      self.standard = standard;
    },

    setSubject: (subject: string) => {
      self.subject = subject ? subject : null;
    },

    setChapter: (chapter: string) => {
      self.chapter = chapter ? chapter : null;
    },

    setQuestionType: (questionType: QuestionType) => {
      self.questionType = questionType;
    },

    setSection: (sectionId: string) => {
      self.section = sectionId;
    },

    setSubsection: (subsectionId: string) => {
      self.subsection = subsectionId;
    },

    setMarkings: (markings: MarkingType) => {
      self.markings = markings;
    },

    setOptions: (options: string[]) => {
      self.options.replace(options);
    },

    addOption: (option: string) => {
      const newOptions = [...self.options, option];
      self.options.replace(newOptions);
    },

    removeOption: (option: string) => {
      const newOptions = [...self.options];
      const index = newOptions.indexOf(option);
      if (index > -1) newOptions.splice(index);
      self.options.replace(newOptions);
    },
  }))
  .views((self) => ({
    get optionItems(): ISelectItem[] {
      return self.rootStore.questionStore.getOptionsByIds(self.options).map((option) => ({
        label: option.option,
        value: option._id,
      }));
    },
  }));

export type IQuestion = Instance<typeof Question>;
