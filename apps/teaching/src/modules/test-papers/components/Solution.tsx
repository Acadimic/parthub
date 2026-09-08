import { Html } from '@components/others';
import { type IQuestion, useQuestionLookups } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  prefix?: string;
  question: IQuestion;
}

export const Solution = observer(({ question, prefix }: IProps) => {
  const questionStore = useQuestionLookups();
  const { getSolutionByQuestionId } = questionStore;
  const solution = getSolutionByQuestionId(question._id);

  const emptyText = '<span class="text-color-secondary">No solution added</span>';

  return <Html html={solution?.solution || emptyText} prefix={prefix} />;
});
