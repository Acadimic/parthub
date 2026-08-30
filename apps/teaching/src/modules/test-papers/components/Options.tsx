import { CheckboxSelection, RadioSelection } from '@components/app';
import { Html } from '@components/others';
import { QuestionType } from '@enums';
import { IQuestion, useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  question: IQuestion;
}

export const Options = observer(({ question }: IProps) => {
  const { questionStore } = useStores();
  const { getOptionsByIds, getOptionById } = questionStore;

  return (
    <div>
      <div>
        {question.questionType === QuestionType.MULTIPLE_CHOICE ? (
          <CheckboxSelection
            selectedValues={getOptionsByIds(question.options)
              .filter((option) => option.isCorrect)
              .map((option) => option._id)}
            options={question.optionItems}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-green-primary"
          />
        ) : question.questionType === QuestionType.SINGLE_CHOICE || question.questionType === QuestionType.BOOLEAN ? (
          <RadioSelection
            selectedValue={getOptionsByIds(question.options).find((option) => option.isCorrect)?._id}
            options={question.optionItems}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-green-primary"
          />
        ) : (
          <div className="py-2 text-sm font-medium">
            <Html html={getOptionById(question.options[0])?.option || ''} prefix="Ans:" />
          </div>
        )}
      </div>
    </div>
  );
});
