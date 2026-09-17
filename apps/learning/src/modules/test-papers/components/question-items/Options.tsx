import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { TextInput } from '@repo/ui/app';
import { RichTextContent } from '@repo/ui/core';
import { QuestionType } from '@enums';
import { type ISelectItem } from '@interfaces';
import { type IQuestion, useQuestionLookups } from '@stores';
import { Option } from './Option';

interface IProps {
  question: IQuestion;
  handleResponses: (responses: string[]) => void;
  selectedValues: string[];
  isDisabled: boolean;
  answers: string[];
}

export const Options = ({ question, handleResponses, selectedValues, isDisabled, answers }: IProps) => {
  const { getQuestionOptions } = useQuestionLookups();
  const questionOptions = getQuestionOptions(question._id);
  const questionType = question.questionType;
  const getOptionColor = (value: string) => {
    if (!isDisabled) return 'text-foreground';
    if (answers.includes(value)) return 'text-success';
    if (selectedValues.includes(value)) return 'text-destructive';
    return 'text-foreground';
  };

  const options: ISelectItem[] = questionOptions.map((option, index) => ({
    label: (
      <Option index={index}>
        <RichTextContent value={option.body} />
      </Option>
    ),
    value: option._id,
    color: getOptionColor(option._id),
  }));

  const handleClickRadioOption = (selectedValue: string) => {
    handleResponses([selectedValue]);
  };

  const handleClickCheckboxOption = (selectedValue: string) => {
    const newSelectedValues = selectedValues.includes(selectedValue)
      ? selectedValues.filter((value) => value !== selectedValue)
      : [...selectedValues, selectedValue];
    handleResponses(newSelectedValues);
  };

  const handleTextAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = `${event.target.value}`;
    if (!value) handleResponses([]);
    else handleResponses([value]);
  };

  if (questionType === QuestionType.BOOLEAN) {
    return (
      <RadioSelection
        label="Select one option"
        options={options}
        selectedValue={selectedValues[0]}
        handleClick={handleClickRadioOption}
        isDisabled={isDisabled}
      />
    );
  }
  if (questionType === QuestionType.SINGLE_CHOICE) {
    return (
      <RadioSelection
        label="Select one option"
        options={options}
        selectedValue={selectedValues[0]}
        handleClick={handleClickRadioOption}
        isDisabled={isDisabled}
      />
    );
  }
  if (questionType === QuestionType.MULTIPLE_CHOICE) {
    return (
      <CheckboxSelection
        label="Select one or more options"
        options={options}
        selectedValues={selectedValues}
        handleClick={handleClickCheckboxOption}
        isDisabled={isDisabled}
      />
    );
  }
  return (
    <TextInput
      type={questionType === QuestionType.INTEGER ? 'number' : 'text'}
      placeholder="Enter your answer"
      label="Enter Answer"
      onChange={handleTextAnswerChange}
      value={selectedValues[0] || ''}
      disabled={isDisabled}
    />
  );
};
