import { RichTextView } from '@repo/ui/content';
import { Badge } from '@repo/ui/core';
import { type IRichText } from '@repo/shared/interfaces';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { getAlphabet } from '@utils/helpers';

interface IProps {
  correctOptionIndexes: number[];
  solution?: IRichText;
  answers: IRichText[];
  /** A typed answer (integer, text) rather than a picked option, so it is shown as text. */
  isAnswer: boolean;
}

/** The correct answer and the worked solution, shown once the question is marked. */
export const Answer = ({ correctOptionIndexes, solution, answers, isAnswer }: IProps) => {
  return (
    <div className="rounded-xl border border-success/30 bg-success/5 p-4">
      <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
        <CheckCircleIcon weight="fill" className="h-5 w-5 text-success" />
        <span>{correctOptionIndexes.length > 1 ? 'Answers' : 'Answer'}</span>
        {isAnswer ? (
          <span className="font-medium">{answers.map((answer) => answer.text).join(', ')}</span>
        ) : (
          correctOptionIndexes.map((answerIndex) => (
            <Badge key={answerIndex} tone="success" appearance="solid">
              {getAlphabet(answerIndex)}
            </Badge>
          ))
        )}
      </div>
      {solution ? (
        <div className="mt-3 border-t border-success/20 pt-3 text-sm">
          <p className="font-semibold">Solution</p>
          <RichTextView value={solution} className="[&>:first-child]:mt-1" />
        </div>
      ) : null}
    </div>
  );
};
