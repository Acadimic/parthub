import { BookOpenTextIcon, ClockIcon, FileTextIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { MaterialType } from '@enums';
import { ICourseStats } from '@stores';

interface IProps {
  courseStats: ICourseStats;
}

export const CourseInfo = ({ courseStats }: IProps) => {
  return (
    <div className="flex items-center text-color-secondary w-full">
      <div className="flex items-center gap-4 font-medium w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <YoutubeLogoIcon weight="bold" className="w-auto h-4" />
            <div className="">{courseStats.videosCount}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.VIDEO}s</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <BookOpenTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{courseStats.readingsCount}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.READING}s</span>
          </div>
        </div>
        {/* <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <div className="">{courseStats.materialsDurationMins}</div>
          </div>
          <div className="">
            <span className="">Mins</span>
          </div>
        </div> */}
        {/* <Divider orientation="vertical" className="h-10" /> */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FileTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{courseStats.testsCount}</div>
          </div>
          <div className="capitalize">
            <span className=""> Tests</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <ClockIcon weight="bold" className="w-auto h-4" />
            <div className="">{courseStats.testsDurationMins + courseStats.materialsDurationMins}</div>
          </div>
          <div className="">
            <span className="">Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
