import { Button } from '@repo/ui/app';
import { useStores } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  openSubmitSummary: () => void;
  openResultPage: () => void;
}

export const SubmitButton = observer(({ openSubmitSummary, openResultPage }: IProps) => {
  const { testPaperStore } = useStores();
  const { exam } = testPaperStore;
  if (!exam) return null;

  const { isSubmitted, isPractice } = exam;

  return (
    <>
      <Button
        text={isSubmitted ? 'View Result' : isPractice ? 'View Analytics' : 'Submit Test'}
        onClick={isSubmitted || isPractice ? openResultPage : openSubmitSummary}
        isRound
      />
    </>
  );
});
