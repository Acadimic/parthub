import { Button } from '@repo/ui/app';
import { useTestPaperLookups } from '@stores';

interface IProps {
  openSubmitSummary: () => void;
  openResultPage: () => void;
}

export const SubmitButton = ({ openSubmitSummary, openResultPage }: IProps) => {
  const testPaperStore = useTestPaperLookups();
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
};
