import { Tooltip } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { type ITestPaperSection } from '@stores';

interface IProps {
  section: ITestPaperSection;
}

export const TestPaperSection = ({ section }: IProps) => {
  return (
    <Tooltip title={section.name}>
      <Badge tone="neutral" appearance="outline" className="max-w-[200px]">
        <span className="truncate">{section.name}</span>
      </Badge>
    </Tooltip>
  );
};
