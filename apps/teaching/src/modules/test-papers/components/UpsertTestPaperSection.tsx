import { Button, TextInput } from '@repo/ui/app';
import { SectionCategoryType } from '@enums';
import { type ITestPaperSection } from '@stores';
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { DefaultMarkingsModal } from './DefaultMarkingsModal';

interface IProps {
  section: ITestPaperSection;
  isLoading: boolean;
}

export const UpsertTestPaperSection = observer(({ section, isLoading }: IProps) => {
  const [isOpenMarkings, setIsOpenMarkings] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    section.setName(e.target.value);
    section.setSectionCategory(SectionCategoryType.CUSTOM);
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
        onSave={(markings) => section.setDefaultMarkings(markings)}
      />
    </>
  );
});
