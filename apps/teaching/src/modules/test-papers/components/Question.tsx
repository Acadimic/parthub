import { RichTextView } from '@repo/ui/content';
import { type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { Badge } from '@repo/ui/core';

interface IProps {
  prefix?: string;
  question: QuestionDto;
  marks?: MarkingType;
}

/**
 * The mark as it is written on a paper.
 *
 * A negative number already carries its sign, so only a positive one needs one drawn. The
 * unattempted mark used to have a `-` prefixed to it as well as its own, and rendered as `--1`.
 */
const withSign = (value: number) => (value > 0 ? `+${value}` : String(value));

export const Question = ({ question, prefix, marks }: IProps) => {
  return (
    <div className="relative">
      <div className="mt-2">
        <RichTextView value={question.body} prefix={prefix} />
      </div>
      {marks && (
        <div
          className="absolute -top-4 flex items-center gap-1"
          title={`${withSign(marks.correct)} correct, ${withSign(marks.incorrect)} incorrect, ${withSign(
            marks.unattempted,
          )} unattempted`}
        >
          <Badge tone="success" appearance="soft" className="px-1.5 py-0 text-xxs font-mono">
            {withSign(marks.correct)}
          </Badge>
          <Badge tone="destructive" appearance="soft" className="px-1.5 py-0 text-xxs font-mono">
            {withSign(marks.incorrect)}
          </Badge>
          <Badge tone="warning" appearance="soft" className="px-1.5 py-0 text-xxs font-mono">
            {withSign(marks.unattempted)}
          </Badge>
        </div>
      )}
    </div>
  );
};
