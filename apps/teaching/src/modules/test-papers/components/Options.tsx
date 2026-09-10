import { type QuestionDto } from '@repo/shared/contracts';
import { CheckboxSelection, RadioSelection } from '@components/app/selections';
import { Html } from '@components/others';
import { QuestionType } from '@enums';
import { useQuestionLookups } from '@stores';

interface IProps {
  question: QuestionDto;
}

export const Options = ({ question }: IProps) => {
  const questionStore = useQuestionLookups();
  const { getOptionItems } = questionStore;
  const { getOptionsByIds, getOptionById } = questionStore;
  const isMultipleChoice = question.questionType === QuestionType.MULTIPLE_CHOICE;
  const isSingleOrBoolean =
    question.questionType === QuestionType.SINGLE_CHOICE || question.questionType === QuestionType.BOOLEAN;

  return (
    <div>
      <div>
        {isMultipleChoice && (
          <CheckboxSelection
            selectedValues={getOptionsByIds(question.options ?? [])
              .filter((option) => option.isCorrect)
              .map((option) => option._id)}
            options={getOptionItems(question._id)}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-success"
          />
        )}
        {isSingleOrBoolean && (
          <RadioSelection
            selectedValue={getOptionsByIds(question.options ?? []).find((option) => option.isCorrect)?._id}
            options={getOptionItems(question._id)}
            handleClick={() => {}}
            isDisabled
            isHtml
            selectedClassName="text-success"
          />
        )}
        {!isMultipleChoice && !isSingleOrBoolean && (
          <div className="py-2 text-sm font-medium">
            <Html html={getOptionById((question.options ?? [])[0])?.option || ''} prefix="Ans:" />
          </div>
        )}
      </div>
    </div>
  );
};
