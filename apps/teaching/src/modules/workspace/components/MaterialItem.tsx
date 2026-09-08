import { type IMaterialStat } from '@interfaces';
import { Card } from '@repo/ui/app';
import { MaterialInfo, StandardWithLogo } from '@components/common';
import { useStandardLookups, useMaterialLookups, useSelectorLookups } from '@stores';
import Link from 'next/link';

interface IProps {
  materialStat: IMaterialStat;
}

export const MaterialItem = ({ materialStat }: IProps) => {
  const selectorStore = useSelectorLookups();
  const materialStore = useMaterialLookups();
  const { getStandardById, getSubjectById } = useStandardLookups();
  const { setSelectedStandardId, setSelectedSubjectId } = selectorStore;
  const { getMaterialsStatsByMaterialIds } = materialStore;

  const handleClick = () => {
    setSelectedSubjectId(materialStat.subject);
    setSelectedStandardId(materialStat.standard);
  };

  const standard = getStandardById(materialStat.standard);
  const subject = getSubjectById(materialStat.subject);

  return (
    <Card className="rounded border-2 py-8">
      <Link href={`/study-materials/${materialStat.standard}/${materialStat.subject}`} onClick={handleClick}>
        <div className="flex flex-col space-y-2 w-full">
          <div className="h-40 w-full border-b border-color-border">
            <div className="flex justify-center items-center">
              <div className="h-28 w-auto">
                <img src="/images/materials.png" alt="materials" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
          <div className="p-3 flex flex-col space-y-3 px-4">
            <StandardWithLogo standard={standard} />
            <div className="max-w-full">
              <div className="font-medium line-clamp-1">
                {standard?.name} - {subject?.name}
              </div>
              <div className="text-sm text-color-secondary line-clamp-1">Material Description</div>
            </div>
            <div className="text-xs text-color-secondary w-full">
              <MaterialInfo materialStat={materialStat} />
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
};
