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

  let buttonText = 'Submit Test';
  if (isSubmitted) buttonText = 'View Result';
  else if (isPractice) buttonText = 'View Analytics';

  return (
    <>
      <Button text={buttonText} onClick={isSubmitted || isPractice ? openResultPage : openSubmitSummary} isRound />
    </>
  );
};
