import { type IStandard, type ISubject } from '@stores';
import { getStringFormattedDateWithTime } from '@utils/helpers';

interface IProps {
  standard: IStandard;
  subject: ISubject;
  count: number;
  lastUpdatedAt?: string;
}

export const StudyMaterialDetails = ({ standard, subject, count, lastUpdatedAt }: IProps) => {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col justify-center items-center gap-1">
        <div>
          <h1 className="font-semibold text-lg md:text-lg text-center">{standard.name}</h1>
        </div>
        <div className="text-sm font-medium">{subject.name}</div>
      </div>
      <div className="flex justify-between flex-wrap w-full text-sm font-semibold items-center gap-4">
        {/* <div className="w-[200px] flex space-x-2">
          <div>
            <Copy weight="bold" className="w-5 h-5" />
          </div>
          <div className="truncate">link</div>
        </div> */}
        <div className="w-[200px] flex space-x-2">
          <div className="font-medium text-color-secondary">Number of contents:</div>
          <div>{count}</div>
        </div>
        <div className="flex space-x-2">
          <div className="font-medium text-color-secondary">Last updated at: </div>
          <div>{lastUpdatedAt ? getStringFormattedDateWithTime(lastUpdatedAt) : 'None'}</div>
        </div>
      </div>
    </div>
  );
};
