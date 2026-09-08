import { BookOpenTextIcon, FileTextIcon, YoutubeLogoIcon } from '@phosphor-icons/react';
import { MaterialType } from '@enums';
import { useMaterialLookups, useTestPaperLookups } from '@stores';
import { useMemo } from 'react';

interface IProps {
  materialIds: string[];
  testPaperIds: string[];
}

export const MaterialInfo = ({ materialIds, testPaperIds }: IProps) => {
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const { getMaterialsStatsByMaterialIds } = materialStore;
  const { getTestPapersByIds } = testPaperStore;

  const materialsInfo = useMemo(() => {
    return getMaterialsStatsByMaterialIds(materialIds);
  }, [materialIds]);

  const testPapersDuration = useMemo(() => {
    const testPapers = getTestPapersByIds(testPaperIds);
    return testPapers.reduce((total, paper) => total + (paper.durationMins || 0), 0);
  }, [testPaperIds]);

  return (
    <div className="flex items-center text-color-secondary">
      (
      <div className="flex items-center gap-2 text-sm font-medium">
        <div className="flex gap-2">
          <div className="flex items-center gap-1">
            <YoutubeLogoIcon weight="bold" className="w-auto h-4" />
            <div className="capitalize">
              {materialsInfo.types[MaterialType.VIDEO]} <span className="">{MaterialType.VIDEO}s</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <BookOpenTextIcon weight="bold" className="w-auto h-4" />
            <div className="capitalize">
              {materialsInfo.types[MaterialType.READING]} <span className="">{MaterialType.READING}s</span>
            </div>
          </div>
        </div>
        <div>
          {materialsInfo.durationMins} <span className="">Mins</span>,
        </div>
        <div className="flex gap-1">
          <div className="flex items-center gap-1">
            <FileTextIcon weight="bold" className="w-auto h-4" />
            <div className="capitalize">
              {testPaperIds.length}
              <span className=""> Tests</span>
            </div>
          </div>
          <div>
            {testPapersDuration} <span className="">Mins</span>
          </div>
        </div>
      </div>
      )
    </div>
  );
};
