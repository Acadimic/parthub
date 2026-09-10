import { Html } from '@components/others';
import { getAlphabet } from '@utils/helpers';

interface IProps {
  correctOptionIndexes: number[];
  solution?: string;
  answers: string[];
  isAnswer: boolean;
}

export const Answer = ({ correctOptionIndexes, solution, answers, isAnswer }: IProps) => {
  return (
    <>
      <div>
        <div className="flex font-semibold text-sm md:text-base items-center space-x-1">
          <div className="text-gradient">{correctOptionIndexes.length > 1 ? 'Answers' : 'Answer'} : </div>
          <div className="flex">
            {isAnswer
              ? `${answers.join(', ')}`
              : correctOptionIndexes.map((answerIndex: number, index: number) => {
                  const isLastIndex = index === correctOptionIndexes.length - 1;
                  return (
                    <div key={answerIndex}>
                      <span className="text-success">{getAlphabet(answerIndex)}</span>
                      <span className="text-gradient">{!isLastIndex ? ',' : ''}&nbsp;</span>
                    </div>
                  );
                })}
          </div>
        </div>
        <div className="mt-4">
          {solution ? (
            <div className="">
              {/* <LockOverlay isPaid={true}> */}
              <Html html={`${solution}`} prefix="Solution: " />
              {/* </LockOverlay> */}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};
