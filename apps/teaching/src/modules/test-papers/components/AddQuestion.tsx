import { RichTextEditor } from '@repo/ui/editor';
import { PlusIcon } from '@phosphor-icons/react';
import { QuestionType } from '@enums';
import { Button } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useQuestionLookups, useSelectedQuestion } from '@stores';
import { AddOption } from './AddOption';
import { SelectQuestionType } from './SelectQuestionType';

/** Question types whose answers are picked from a list, and so need option editors. */
const CHOICE_TYPES: QuestionType[] = [QuestionType.SINGLE_CHOICE, QuestionType.MULTIPLE_CHOICE];

export const AddQuestion = () => {
  const { patchQuestion, addOption, removeOption } = useQuestionLookups();
  const selectedQuestion = useSelectedQuestion();

  if (!selectedQuestion) return null;

  const options = selectedQuestion.options ?? [];
  const isChoiceQuestion = CHOICE_TYPES.includes(selectedQuestion.questionType as QuestionType);
  // True/false stays out of the editors above — its two options are not the author's to write — but
  // it is shown, because the answer step used to be the first place the options appeared at all.
  const isBooleanQuestion = selectedQuestion.questionType === QuestionType.BOOLEAN;

  return (
    <div className="flex w-full flex-col items-center justify-center">
      <div className="flex w-full justify-end">
        <SelectQuestionType />
      </div>
      <div className="flex w-full flex-col gap-4">
        <RichTextEditor
          label="Question"
          required
          value={selectedQuestion.body}
          onChange={(body) => patchQuestion(selectedQuestion._id, { body })}
          editorClassName="min-h-[11rem]"
        />

        {isChoiceQuestion ? (
          <div className="flex flex-col gap-3">
            {options.map((option, index) => (
              <AddOption
                key={option._id}
                questionId={selectedQuestion._id}
                option={option}
                index={index}
                onRemove={(optionId) => removeOption(selectedQuestion._id, optionId)}
                canRemove={options.length > 1 && index !== 0}
              />
            ))}
            <div className="flex justify-end pb-8 pt-2">
              <Button
                isSecondary
                text="Add Option"
                leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
                onClick={() => addOption(selectedQuestion._id)}
              />
            </div>
          </div>
        ) : null}

        {isBooleanQuestion ? (
          <div className="flex flex-col gap-2 pb-8">
            <p className="text-xs font-medium text-muted-foreground">
              The options are fixed for a true/false question. The correct one is chosen on the next step.
            </p>
            <div className="flex gap-2">
              {options.map((option) => (
                <Badge key={option._id} tone="neutral" appearance="outline">
                  {option.body.text}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
