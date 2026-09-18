import { Select } from '@components/app/selects';
import { ArticleIcon } from '@phosphor-icons/react';
import { QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { useQuestionLookups, useSelectedQuestion, useSelectedTestPaperSection, useSelectorLookups } from '@stores';
import { splitCamelCase } from '@utils/helpers';

export const SelectQuestionType = () => {
  const selectorStore = useSelectorLookups();
  const { setQuestionType, patchQuestion } = useQuestionLookups();
  const { selectedQuestionType, setSelectedQuestionType, setSelectedUpsertQuestionStep } = selectorStore;
  const selectedQuestion = useSelectedQuestion();
  const selectedTestPaperSection = useSelectedTestPaperSection();

  const onChangeQuestionType = (values: ISelectItem[]) => {
    if (!selectedQuestion) return;
    const value = values[0].value as QuestionType;
    setQuestionType(selectedQuestion._id, value);
    // The marks belong to the type, not to the question: switching from a 4/-1 single choice to an
    // integer used to keep the -1, because only the options were rebuilt.
    const typeMarkings = selectedTestPaperSection?.defaultMarkings[value];
    if (typeMarkings) patchQuestion(selectedQuestion._id, { markings: { ...typeMarkings } });
    setSelectedQuestionType(value);
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
};
