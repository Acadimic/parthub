import { RichTextView } from '@repo/ui/content';
import { type QuestionDto } from '@repo/shared/contracts';

interface IProps {
  prefix?: string;
  question: QuestionDto;
}

export const Solution = ({ question, prefix }: IProps) => (
  <RichTextView
    value={question.solution?.body}
    prefix={prefix}
    fallback={<span className="text-muted-foreground">No solution added</span>}
  />
);
