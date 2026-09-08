import { type IMaterialStat } from '@interfaces';
import { BookOpenTextIcon, ClockIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { MaterialType } from '@enums';

interface IProps {
  materialStat: IMaterialStat;
}

export const MaterialInfo = ({ materialStat }: IProps) => {
  return (
    <div className="flex items-center text-color-secondary w-full">
      <div className="flex items-center gap-4 font-medium w-full">
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <YoutubeLogoIcon weight="bold" className="w-auto h-4" />
            <div className="">{materialStat.count}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.VIDEO}s</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <BookOpenTextIcon weight="bold" className="w-auto h-4" />
            <div className="">{materialStat.count}</div>
          </div>
          <div className="capitalize">
            <span className="">{MaterialType.READING}s</span>
          </div>
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <ClockIcon weight="bold" className="w-auto h-4" />
            <div className="">{materialStat.durationMins}</div>
          </div>
          <div className="">
            <span className="">Minutes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
