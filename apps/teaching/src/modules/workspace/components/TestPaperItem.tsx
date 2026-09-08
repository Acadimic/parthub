import { Card } from '@repo/ui/app';
import { StandardWithLogo, TestPaperInfo } from '@components/common';
import { TestPaperIconSvg } from '@components/images';
import { type ITestPaper, useStores } from '@stores';
import { observer } from 'mobx-react-lite';
import Link from 'next/link';

interface IProps {
  testPaper: ITestPaper;
}

export const TestPaperItem = observer(({ testPaper }: IProps) => {
  const { standardStore, selectorStore } = useStores();
  const { getStandardsByIds } = standardStore;
  const { setSelectedTestPaperId } = selectorStore;

  const handleClick = () => {
    setSelectedTestPaperId(testPaper._id);
  };

  return (
    <Card className="rounded border-2 py-8">
      <Link href={`/test-papers/${testPaper._id}`} onClick={handleClick}>
        <div className="flex flex-col space-y-2 w-full">
          <div className="h-40 w-full border-b border-color-border">
            <div className="flex justify-center items-center">
              <div className="h-24 w-24">
                <TestPaperIconSvg />
              </div>
            </div>
          </div>
          <div className="p-3 flex flex-col space-y-3 px-4">
            <StandardWithLogo standard={getStandardsByIds(testPaper.standards)[0]} />
            <div className="max-w-full">
              <div className="font-medium line-clamp-1">{testPaper.name}</div>
              <div className="text-sm text-color-secondary line-clamp-1">Test Paper Description</div>
            </div>
            <div className="text-xs text-color-secondary w-full">
              <TestPaperInfo testPaper={testPaper} />
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
});
