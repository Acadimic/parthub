import { Html } from '@components/others';
import { type IQuestion, useQuestionLookups } from '@stores';

interface IProps {
  prefix?: string;
  question: IQuestion;
}

export const Solution = ({ question, prefix }: IProps) => {
  const questionStore = useQuestionLookups();
  const { getSolutionByQuestionId } = questionStore;
  const solution = getSolutionByQuestionId(question._id);

  const emptyText = '<span class="text-color-secondary">No solution added</span>';

  return <Html html={solution?.solution || emptyText} prefix={prefix} />;
};
