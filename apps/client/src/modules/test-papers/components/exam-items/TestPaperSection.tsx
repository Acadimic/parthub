import { Tooltip } from '@components/app';
import { ITestPaperSection } from '@stores';
import { observer } from 'mobx-react-lite';

interface IProps {
  section: ITestPaperSection;
}

export const TestPaperSection = observer(({ section }: IProps) => {
  return (
    <Tooltip title={section.name}>
      <div
        className="bg-gradient max-w-[200px] truncate px-2 text-[11px] font-medium rounded-full border border-color-border text-pink-primary"
        key={section._id}
      >
        {section.name}
      </div>
    </Tooltip>
  );
});
