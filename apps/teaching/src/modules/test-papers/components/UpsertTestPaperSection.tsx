import { Button, TextInput } from '@repo/ui/app';
import { SectionCategoryType } from '@enums';
import { type ITestPaperSection, useTestPaperLookups } from '@stores';
import { useState } from 'react';
import { DefaultMarkingsModal } from './DefaultMarkingsModal';

interface IProps {
  section: ITestPaperSection;
  isLoading: boolean;
}

export const UpsertTestPaperSection = ({ section, isLoading }: IProps) => {
  const { patchTestPaperSection } = useTestPaperLookups();
  const [isOpenMarkings, setIsOpenMarkings] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // One patch, not two: each call replaces the row, so the second would drop the first.
    patchTestPaperSection(section._id, {
      name: e.target.value,
      sectionCategory: SectionCategoryType.CUSTOM,
    });
  };

  const openMarkingsModal = () => {
    setIsOpenMarkings(true);
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <TextInput label="Section Name" required value={section.name} onChange={onChange} disabled={isLoading} />
        <div className="py-2">
          <Button
            text="View | Modify Markings"
            disabled={isLoading}
            className="text-center w-full flex justify-center font-medium text-xs"
            onClick={openMarkingsModal}
          />
        </div>
      </div>
      <DefaultMarkingsModal
        isOpen={isOpenMarkings}
        isLoading={isLoading}
        onClose={() => setIsOpenMarkings(false)}
        defaultMarkings={section.defaultMarkings}
        onSave={(markings) => patchTestPaperSection(section._id, { defaultMarkings: markings })}
      />
    </>
  );
};
