import { MaterialInfo, StandardWithLogo } from '@components/common';
import { type IMaterialStat } from '@interfaces';
import { Card } from '@repo/ui/app';
import { useSelectorLookups, useStandardLookups } from '@stores';
import Link from 'next/link';

interface IProps {
  materialStat: IMaterialStat;
}

export const MaterialItem = ({ materialStat }: IProps) => {
  const selectorStore = useSelectorLookups();
  const { getStandardById, getSubjectById } = useStandardLookups();
  const { setSelectedStandardId, setSelectedSubjectId } = selectorStore;

  const handleClick = () => {
    setSelectedSubjectId(materialStat.subject);
    setSelectedStandardId(materialStat.standard);
  };

  const standard = getStandardById(materialStat.standard);
  const subject = getSubjectById(materialStat.subject);

  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-lg border border-border transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
      <Link
        href={`/study-materials/${materialStat.standard}/${materialStat.subject}`}
        onClick={handleClick}
        className="flex h-full flex-col"
      >
        <div className="flex h-40 w-full shrink-0 items-center justify-center border-b border-border bg-muted">
          <img src="/images/materials.png" alt="" className="h-24 w-auto object-contain" />
        </div>
        <div className="flex flex-1 flex-col gap-2 p-3">
          <StandardWithLogo standard={standard} />
          <div className="max-w-full">
            <div className="line-clamp-1 font-medium group-hover:text-primary">
              {standard?.name} - {subject?.name}
            </div>
            {/* "Material Description" used to ship here as visible placeholder text. A stat row has
                no description of its own, so the counts below are the detail. */}
          </div>
          <div className="mt-auto w-full text-xs text-muted-foreground">
            <MaterialInfo materialStat={materialStat} />
          </div>
        </div>
      </Link>
    </Card>
  );
};
