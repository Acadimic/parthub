import { Tooltip } from '@repo/ui/app';
import { type ITestPaperSection } from '@stores';

interface IProps {
  section: ITestPaperSection;
}

export const TestPaperSection = ({ section }: IProps) => {
  return (
    <Tooltip title={section.name}>
      <div
        className="bg-gradient max-w-[200px] truncate px-2 text-[11px] font-medium rounded-full border border-border text-chart-5"
        key={section._id}
      >
        {section.name}
      </div>
    </Tooltip>
  );
};
