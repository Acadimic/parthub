import { type ISelectItem } from '@interfaces';
import { getRoot, type Instance, types as t } from 'mobx-state-tree';
import { QuestionType } from '../../enums';
import { type IStore } from '../root.store';
import { BaseOrgOwnerModel, BaseTimestampModel } from './base-models';
import { type IOption } from './option.model';
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
      isNew: t.optional(t.boolean, false),
      isBonus: t.optional(t.boolean, false),
    }),
  )
  .views((self) => ({
    get rootStore() {
      return getRoot<IStore>(self);
    },
  }))
  .views((self) => ({
    get optionItems(): ISelectItem[] {
      return self.rootStore.questionStore.getOptionsByIds(self.options).map((option) => ({
        label: option.option,
        value: option._id,
      }));
    },

    get optionObjects(): IOption[] {
      return self.rootStore.questionStore.getOptionsByIds(self.options);
    },
  }))
  .views((self) => ({
    get correctOptions(): IOption[] {
      return self.optionObjects.filter((option) => option.isCorrect);
    },
  }))
  .views((self) => ({
    get correctOptionIndexes(): number[] {
      return self.optionObjects.reduce((indexes: number[], option, index) => {
        if (option.isCorrect) indexes.push(index);
        return indexes;
      }, []);
    },
  }));

export type IQuestion = Instance<typeof Question>;
