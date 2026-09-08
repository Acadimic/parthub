import { BookOpenTextIcon, ClockIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { ITestPaper } from '@stores';

interface IProps {
  testPaper: ITestPaper;
}

export const TestPaperInfo = ({ testPaper }: IProps) => {
  return (
    <div className="flex items-center text-color-secondary w-full">
      <div className="flex items-center gap-4 font-medium w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <YoutubeLogoIcon weight="bold" className="w-auto h-4" />
            <div className="">{testPaper.totalQuestions}</div>
          </div>
          <div className="capitalize">
            <span className="">Ques</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <BookOpenTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{testPaper.maxMarks}</div>
          </div>
          <div className="capitalize">
            <span className="">Max Marks</span>
          </div>
        </div>
        {/* <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FileTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{testPaper.sections.length}</div>
          </div>
          <div className="capitalize">
            <span className=""> Sections</span>
          </div>
        </div> */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <ClockIcon weight="bold" className="w-auto h-4" />
            <div className="">{testPaper.durationMins}</div>
          </div>
          <div className="">
            <span className="">Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
