import { type TestPaperDto } from '@repo/shared/contracts';
import { StandardWithLogo, TestPaperInfo } from '@components/common';
import { TestPaperIconSvg } from '@components/images';
import { Card } from '@repo/ui/app';
import { useSelectorLookups, useStandardLookups } from '@stores';
import Link from 'next/link';

interface IProps {
  testPaper: TestPaperDto;
}

export const TestPaperItem = ({ testPaper }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { getStandardsByIds } = useStandardLookups();
  const { setSelectedTestPaperId } = selectorStore;

  const handleClick = () => {
    setSelectedTestPaperId(testPaper._id);
  };

  return (
    <Card className="group flex h-full flex-col overflow-hidden border border-border transition-colors hover:border-primary">
      <Link href={`/test-papers/${testPaper._id}`} onClick={handleClick} className="flex h-full flex-col">
        <div className="flex h-40 w-full shrink-0 items-center justify-center border-b border-border bg-muted">
          <div className="h-20 w-20">
            <TestPaperIconSvg />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <StandardWithLogo standard={getStandardsByIds(testPaper.standards ?? [])[0]} />
          <div className="max-w-full">
            <div className="line-clamp-1 font-medium group-hover:text-primary">{testPaper.name}</div>
            {/* No description exists on a test paper; the stats row below carries the detail. The
                literal string "Test Paper Description" used to ship here as visible placeholder. */}
          </div>
          <div className="mt-auto w-full text-xs text-muted-foreground">
            <TestPaperInfo testPaper={testPaper} />
          </div>
        </div>
      </Link>
    </Card>
  );
};
