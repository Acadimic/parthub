import { type MarkingType } from '@repo/shared';
import { Html } from '@components/others';
import { type IQuestion } from '@stores';

interface IProps {
  prefix?: string;
  question: IQuestion;
  marks?: MarkingType;
}

export const Question = ({ question, prefix, marks }: IProps) => {
  return (
    <div className="relative">
      <div className="mt-2">
        <Html html={question.question} prefix={prefix} />
      </div>
      {marks && (
        <div className="absolute -top-4 text-[10px] font-bold flex items-center space-x-1.5">
          <div className="text-green-primary">
            {marks.correct > 0 ? '+' : ''}
            {marks.correct}
          </div>
          <div className="text-red-primary">
            {marks.incorrect > 0 ? '+' : ''}
            {marks.incorrect}
          </div>
          <div className="text-yellow-primary">
            {marks.unattempted === 0 ? '' : marks.unattempted > 0 ? '+' : '-'}
            {marks.unattempted}
          </div>
        </div>
      )}
    </div>
  );
};
