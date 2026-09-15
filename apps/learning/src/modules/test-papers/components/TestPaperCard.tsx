import { Button } from '@repo/ui/app';
import { DotsNineIcon } from '@phosphor-icons/react';
import { type ITestPaper } from '@stores';

interface IProps {
  paper: ITestPaper;
  handleOpen: (isPractice?: boolean) => void;
}

const InfoItem = ({ name, value }: { name: string; value: string | number }) => {
  return (
    <div className="flex text-gradient flex-col text-center">
      <div className="text-sm font-bold">{value}</div>
      <div className="text-xs font-semibold">{name}</div>
    </div>
  );
};

export const TestPaperCard = ({ paper, handleOpen }: IProps) => {
  // const onClickAttempt = () => {
  //   const pathname = '/attempt';
  //   const params = { pathname, query: { id: paper._id } };
  //   push(params, pathname);
  // };

  // const onClickPractice = () => {
  //   const pathname = '/practice';
  //   const params = { pathname, query: { id: paper._id, isPractice: true } };
  //   push(params, pathname);
  // };

  const onClickAttempt = () => {
    handleOpen(false);
  };

  const onClickPractice = () => {
    handleOpen(true);
  };

  return (
    <>
      <div className="box-shadow border border-border rounded-sm flex flex-col space-y-6 p-4 bg-background">
        <div className="flex justify-start items-center space-x-3">
          <div className="w-5 h-5">
            <DotsNineIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="text-sm font-semibold truncate">{paper.name}</div>
        </div>
        <div className="flex justify-center space-x-8 items-center">
          <InfoItem name="Ques" value={paper.totalQuestions ?? 0} />
          <InfoItem name="Marks" value={paper.maxMarks ?? 0} />
          <InfoItem name="Mins" value={paper.durationMins ?? 0} />
        </div>
        <div className="flex justify-around">
          <Button text="Practice" onClick={onClickPractice} />
          <Button text="Attempt" onClick={onClickAttempt} />
        </div>
      </div>
    </>
  );
};
