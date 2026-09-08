import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Html } from '@components/others';
import { QuestionType } from '@enums';
import { type IQuestion, useQuestionLookups } from '@stores';

interface IProps {
  question: IQuestion;
}

export const Options = ({ question }: IProps) => {
  const questionStore = useQuestionLookups();
  const { getOptionItems } = questionStore;
  const { getOptionsByIds, getOptionById } = questionStore;

  return (
    <div>
      <div>
        {question.questionType === QuestionType.MULTIPLE_CHOICE ? (
          <CheckboxSelection
            selectedValues={getOptionsByIds(question.options ?? [])
              .filter((option) => option.isCorrect)
              .map((option) => option._id)}
            options={getOptionItems(question._id)}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-green-primary"
          />
        ) : question.questionType === QuestionType.SINGLE_CHOICE || question.questionType === QuestionType.BOOLEAN ? (
          <RadioSelection
            selectedValue={getOptionsByIds(question.options ?? []).find((option) => option.isCorrect)?._id}
            options={getOptionItems(question._id)}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-green-primary"
          />
        ) : (
          <div className="py-2 text-sm font-medium">
            <Html html={getOptionById((question.options ?? [])[0])?.option || ''} prefix="Ans:" />
          </div>
        )}
      </div>
    </div>
  );
};
