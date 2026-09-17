import { type QuestionDto } from '@repo/shared/contracts';
import { type MarkingType } from '@repo/shared/interfaces';
import { RichTextContent } from '@repo/ui/core';

interface IProps {
  prefix?: string;
  question: QuestionDto;
  marks?: MarkingType;
}

export const Question = ({ question, prefix, marks }: IProps) => {
  return (
    <div className="relative">
      <div className="mt-2">
        <RichTextContent value={question.body} prefix={prefix} />
      </div>
      {marks && (
        <div className="absolute -top-4 text-[10px] font-bold flex items-center space-x-1.5">
          <div className="text-success">
            {marks.correct > 0 ? '+' : ''}
            {marks.correct}
          </div>
          <div className="text-destructive">
            {marks.incorrect > 0 ? '+' : ''}
            {marks.incorrect}
          </div>
          <div className="text-warning">
            {marks.unattempted > 0 ? '+' : ''}
            {marks.unattempted < 0 ? '-' : ''}
            {marks.unattempted}
          </div>
        </div>
      )}
    </div>
  );
};
