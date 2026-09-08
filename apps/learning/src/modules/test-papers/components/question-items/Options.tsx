import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { TextInput } from '@parthhub/ui/app';
import { Html } from '@components/others';
import { QuestionType } from '@enums';
import { ISelectItem } from '@interfaces';
import { IQuestion } from '@stores';
import { observer } from 'mobx-react-lite';
import { Option } from './Option';

interface IProps {
  question: IQuestion;
  handleResponses: (responses: string[]) => void;
  selectedValues: string[];
  isDisabled: boolean;
  answers: string[];
}

export const Options = observer(({ question, handleResponses, selectedValues, isDisabled, answers }: IProps) => {
  const optionsItems = question.optionItems;
  const questionType = question.questionType;
  const options: ISelectItem[] = optionsItems.map((option, index) => ({
    label: (
      <Option index={index}>
        <Html html={option.label as string} />
      </Option>
    ) as unknown as string,
    value: option.value,
    color: isDisabled
      ? answers.includes(option.value)
        ? 'text-green-primary'
        : selectedValues.includes(option.value)
          ? 'text-red-primary'
          : 'text-blue-primary'
      : 'text-blue-primary',
  }));

  const handleClickRadioOption = (selectedValue: string) => {
    console.log('Selected Value:', selectedValue);
    handleResponses([selectedValue]);
  };

  const handleClickCheckboxOption = (selectedValue: string) => {
    const newSelectedValues = selectedValues.includes(selectedValue)
      ? selectedValues.filter((value) => value !== selectedValue)
      : [...selectedValues, selectedValue];
    console.log('newSelectedValues: ', newSelectedValues);
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
});
