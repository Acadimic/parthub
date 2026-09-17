import { type QuestionDto } from '@repo/shared/contracts';
import { RichTextContent } from '@repo/ui/core';
import { type ISelectItem } from '@repo/ui/types';
import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { QuestionType } from '@enums';

interface IProps {
  question: QuestionDto;
}

export const Options = ({ question }: IProps) => {
  const options = question.options ?? [];
  const isMultipleChoice = question.questionType === QuestionType.MULTIPLE_CHOICE;
  const isSingleOrBoolean =
    question.questionType === QuestionType.SINGLE_CHOICE || question.questionType === QuestionType.BOOLEAN;

  // A rendered node rather than a string, so an option keeps its equations in the list.
  const optionItems: ISelectItem[] = options.map((option) => ({
    label: <RichTextContent value={option.body} />,
    value: option._id,
  }));

  if (isMultipleChoice) {
    return (
      <CheckboxSelection
        selectedValues={options.filter((option) => option.isCorrect).map((option) => option._id)}
        options={optionItems}
        handleClick={() => {}}
        isDisabled
        selectedClassName="text-success"
      />
    );
  }

  if (isSingleOrBoolean) {
    return (
      <RadioSelection
        selectedValue={options.find((option) => option.isCorrect)?._id}
        options={optionItems}
        handleClick={() => {}}
        isDisabled
        selectedClassName="text-success"
      />
    );
  }

  return (
    <div className="py-2 text-sm font-medium">
      <RichTextContent value={options[0]?.body} prefix="Ans:" />
    </div>
  );
};
