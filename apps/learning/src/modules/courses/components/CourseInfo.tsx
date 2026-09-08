import { MaterialType } from '@enums';
import { BookOpenTextIcon, ClockIcon, FileTextIcon, VideoCameraIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { type ICourseStats } from '@stores';
import { getTwoDigit } from '@utils/helpers';

interface IProps {
  courseStats: ICourseStats;
}

export const CourseInfo = ({ courseStats }: IProps) => {
  return (
    <div className="flex items-center text-color-secondary w-full">
      <div className="flex items-center md:gap-4 gap-3 font-medium w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <YoutubeLogoIcon weight="bold" className="w-auto h-4" />
            <div className="">{getTwoDigit(courseStats.videosCount)}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.VIDEO}s</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <BookOpenTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{getTwoDigit(courseStats.readingsCount)}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.READING}s</span>
          </div>
        </div>
        {/* <Divider orientation="vertical" className="h-10" /> */}
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <FileTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{getTwoDigit(courseStats.testsCount)}</div>
          </div>
          <div className="capitalize">
            <span className=""> Tests</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <VideoCameraIcon weight="bold" className="w-auto h-4" />
            <div className="">{getTwoDigit(courseStats.meetsCount)}</div>
          </div>
          <div className="capitalize">
            <span className=""> Sessions</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <ClockIcon weight="bold" className="w-auto h-4" />
            <div className="">
              {getTwoDigit(
                courseStats.testsDurationMins + courseStats.materialsDurationMins + courseStats.meetsDurationMins,
              )}
            </div>
          </div>
          <div className="">
            <span className="">Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
