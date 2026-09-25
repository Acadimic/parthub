import { Badge, Button, Chip, Popover, ScrollArea } from '@repo/ui/core';
import { PresignedImage } from '@components/app/attachments';
import { type ICourseFilter } from '@interfaces';
import { FadersHorizontalIcon, XIcon } from '@phosphor-icons/react';
import { useCourseLookups, useStandardLookups } from '@stores';

interface IProps {
  filter: ICourseFilter;
  onChange: (filter: Partial<ICourseFilter>) => void;
}

/** One option on the chip row: what to show, and what it filters by. */
interface IChipOption {
  value: string;
  name: string;
  logo?: string | null;
}

/**
 * The logo tile, or nothing when the row carries no logo — the chip then reads as text alone.
 *
 * Decorative: the chip's own label already names the row, so the image carries no alt text and
 * needs no screen-reader twin.
 */
const Logo = ({ url, name }: { url?: string | null; name: string }) => {
  if (!url) return null;
  return (
    <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-background">
      <PresignedImage
        url={url}
        className="object-contain"
        noOpen
        fallback={<span className="text-xs font-semibold text-muted-foreground">{name.trim().charAt(0)}</span>}
      />
    </span>
  );
};

export const CourseFilters = ({ filter, onChange }: IProps) => {
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const { getStandardById, getSubjectById } = standardStore;
  const options = courseStore.getCourseFilterOptions(filter);
  const selectedCount = filter.standards.length + filter.subjects.length;

  // A row with no name loaded has nothing to render, so it is dropped rather than shown blank.
  const standardOptions: IChipOption[] = options.standards.flatMap((id) => {
    const standard = getStandardById(id);
    return standard ? [{ value: standard._id, name: standard.name, logo: standard.logo }] : [];
  });
  const subjectOptions: IChipOption[] = options.subjects.flatMap((id) => {
    const subject = getSubjectById(id);
    return subject ? [{ value: subject._id, name: subject.name, logo: subject.logo }] : [];
  });

  const toggle = (values: string[], value: string) =>
    values.includes(value) ? values.filter((current) => current !== value) : [...values, value];

  // A standard the learner deselects takes its subjects with it: a subject the narrowed list no
  // longer offers would keep filtering invisibly, so the grid and the controls would stop agreeing.
  const handleToggleStandard = (value: string) => {
    const standards = toggle(filter.standards, value);
    const next = courseStore.getCourseFilterOptions({ ...filter, standards });
    onChange({ standards, subjects: filter.subjects.filter((subjectId) => next.subjects.includes(subjectId)) });
  };

  const handleClear = () => onChange({ standards: [], subjects: [] });

  return (
    <div className="mb-8 flex items-center gap-3">
      {/* The standards scroll rather than wrap, so the row stays one line however many there are
          and the Filter button keeps its place at the end. */}
      <ScrollArea orientation="horizontal" className="flex-1">
        <div className="flex items-center gap-2 pb-2">
          <Chip label="All" isSelected={!filter.standards.length} onClick={handleClear} />
          {standardOptions.map((option) => (
            <Chip
              key={option.value}
              label={option.name}
              isSelected={filter.standards.includes(option.value)}
              leftSection={<Logo url={option.logo} name={option.name} />}
              onClick={() => handleToggleStandard(option.value)}
            />
          ))}
        </div>
      </ScrollArea>
      <Popover
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        trigger={
          <Chip
            label="Filter"
            isSelected={Boolean(filter.subjects.length)}
            rightSection={<FadersHorizontalIcon weight="bold" className="h-4 w-4" />}
          />
        }
      >
        <div className="w-[344px] max-w-[90vw] p-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</div>
          {subjectOptions.length ? (
            <ScrollArea className="max-h-[240px]">
              <div className="flex flex-wrap gap-2">
                {subjectOptions.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.name}
                    isSelected={filter.subjects.includes(option.value)}
                    leftSection={<Logo url={option.logo} name={option.name} />}
                    onClick={() => onChange({ subjects: toggle(filter.subjects, option.value) })}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <p className="text-xs text-muted-foreground">No subjects on these courses yet.</p>
          )}
        </div>
      </Popover>
      {selectedCount ? (
        <Button
          isSubtle
          className="px-2 py-1.5"
          leftSection={<XIcon weight="bold" className="h-4 w-4" />}
          onClick={handleClear}
        >
          <span className="flex items-center gap-2 text-sm">
            Clear
            <Badge tone="primary">{selectedCount}</Badge>
          </span>
        </Button>
      ) : null}
    </div>
  );
};
