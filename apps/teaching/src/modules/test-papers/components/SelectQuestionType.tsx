import { Select } from '@components/app/selects';
import { ArticleIcon } from '@phosphor-icons/react';
import { QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { useQuestionLookups, useSelectorLookups } from '@stores';
import { splitCamelCase } from '@utils/helpers';
import { observer } from 'mobx-react-lite';

export const SelectQuestionType = observer(() => {
  const selectorStore = useSelectorLookups();
  const questionStore = useQuestionLookups();
  const { patchQuestion } = questionStore;
  const { patchOption } = questionStore;
  const { selectedQuestion, selectedQuestionType, setSelectedQuestionType, setSelectedUpsertQuestionStep } =
    selectorStore;
  const { getOptionsByIds, getNewOptions } = questionStore;

  const onChangeQuestionType = (values: ISelectItem[]) => {
    if (!selectedQuestion) return;
    const value = values[0].value as QuestionType;
    const previousQuestionType = selectedQuestion.questionType;
    patchQuestion(selectedQuestion._id, { questionType: value });
    getOptionsByIds(selectedQuestion.options).forEach((option) => patchOption(option._id, { isCorrect: false }));
    setSelectedQuestionType(value);
    if (
      (value === QuestionType.SINGLE_CHOICE || value === QuestionType.MULTIPLE_CHOICE) &&
      (previousQuestionType === QuestionType.SINGLE_CHOICE || previousQuestionType === QuestionType.MULTIPLE_CHOICE)
    ) {
      return;
    }
    const options = getNewOptions(selectedQuestion._id, value);
    selectedQuestion.setOptions(options.map((item) => item._id));
    setSelectedUpsertQuestionStep(0);
  };

  if (!selectedQuestion) return null;

  return (
    <div>
      {selectedQuestion.isNew ? (
        <div className="w-[190px]">
          <Select
            onChange={onChangeQuestionType}
            items={Object.values(QuestionType).map((type) => ({ label: splitCamelCase(type), value: type }))}
            isSingleSelect
            values={[selectedQuestionType]}
            leftsection={<ArticleIcon weight="bold" className="w-5 h-5" />}
            placeholder="Select question type"
          />
        </div>
      ) : null}
    </div>
  );
});
