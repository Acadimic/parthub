import { type QuestionDto } from '@repo/shared/contracts';
import { RichTextContent } from '@repo/ui/core';

interface IProps {
  prefix?: string;
  question: QuestionDto;
}

export const Solution = ({ question, prefix }: IProps) => (
  <RichTextContent
    value={question.solution?.body}
    prefix={prefix}
    fallback={<span className="text-muted-foreground">No solution added</span>}
  />
);
