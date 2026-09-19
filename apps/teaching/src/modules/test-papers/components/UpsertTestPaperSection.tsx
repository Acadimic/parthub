import { TextInput, DrawerSection } from '@repo/ui/app';
import { SectionCategoryType } from '@enums';
import { type ITestPaperSection, useTestPaperLookups } from '@stores';
import { defaultMarkings as APP_DEFAULT_MARKINGS } from '@utils/constants';
import { DefaultMarkingsTable } from './DefaultMarkingsTable';

interface IProps {
  section: ITestPaperSection;
  isLoading: boolean;
}

/**
 * The section drawer: a name, and the marks a question of each type gets by default.
 *
 * The table is inline. It used to sit behind a "View | Modify Markings" button that opened a
 * second modal over the first, so the one setting a section actually carries was the one an
 * author was least likely to see, let alone check before saving.
 */
export const UpsertTestPaperSection = ({ section, isLoading }: IProps) => {
  const { patchTestPaperSection } = useTestPaperLookups();

  const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // One patch, not two: each call replaces the row, so the second would drop the first.
    patchTestPaperSection(section._id, {
      name: event.target.value,
      sectionCategory: SectionCategoryType.CUSTOM,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <DrawerSection title="Name" isRequired hint="How the section is labelled on the paper.">
        <TextInput
          value={section.name}
          onChange={onNameChange}
          disabled={isLoading}
          placeholder="Physics, or Section A"
          autoFocus={section.isNew}
          aria-label="Section name"
        />
      </DrawerSection>
      <DrawerSection
        title="Default marks"
        hint="Filled in for every new question of that type. A question can still set its own marks."
      >
        <DefaultMarkingsTable
          value={section.defaultMarkings ?? APP_DEFAULT_MARKINGS}
          onChange={(markings) => patchTestPaperSection(section._id, { defaultMarkings: markings })}
          isDisabled={isLoading}
        />
      </DrawerSection>
    </div>
  );
};
