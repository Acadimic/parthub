import { Badge, Button, Chip, Popover, TextInput } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { PresignedImage } from '@components/app/attachments';
import { type ICourseFilter } from '@interfaces';
import { CheckIcon, FadersHorizontalIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useCourseLookups, useStandardLookups } from '@stores';
import { useState } from 'react';

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

/** Past this many subjects the popover gets a search box, so a long list can be narrowed. */
const SEARCHABLE_FROM = 8;

/**
 * The subjects as a scrolling list of rows rather than wrapped chips: rows stay legible at any
 * count, the chosen ones float to the top, and a search box appears once the list is long.
 */
const SubjectList = ({
  options,
  selected,
  onToggle,
}: {
  options: IChipOption[];
  selected: string[];
  onToggle: (value: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const needle = search.trim().toLowerCase();
  const visible = options
    .filter((option) => !needle || option.name.toLowerCase().includes(needle))
    .sort((a, b) => Number(selected.includes(b.value)) - Number(selected.includes(a.value)));

  if (!options.length) return <p className="text-xs text-muted-foreground">No subjects on these courses yet.</p>;

  return (
    <div className="flex flex-col gap-2">
      {options.length >= SEARCHABLE_FROM ? (
        <TextInput
          type="search"
          value={search}
          placeholder="Search subjects"
          aria-label="Search subjects"
          leftSection={<MagnifyingGlassIcon weight="bold" className="h-4 w-4 text-muted-foreground" />}
          onChange={(event) => setSearch(event.target.value)}
        />
      ) : null}
      <ul role="listbox" aria-multiselectable="true" className="-mx-1 max-h-[280px] overflow-y-auto">
        {visible.length ? (
          visible.map((option) => {
            const isSelected = selected.includes(option.value);
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => onToggle(option.value)}
                  className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent"
                >
                  <Logo url={option.logo} name={option.name} />
                  <span className="min-w-0 flex-1 truncate">{option.name}</span>
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
                      isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-input',
                    )}
                  >
                    {isSelected ? <CheckIcon weight="bold" className="h-3 w-3" /> : null}
                  </span>
                </button>
              </li>
            );
          })
        ) : (
          <li className="px-2 py-3 text-xs text-muted-foreground">No subject matches “{search.trim()}”.</li>
        )}
      </ul>
    </div>
  );
};

/**
 * The bar above the catalogue: the standards as one scrolling row of chips, the subjects behind a
 * Filter button, and the chosen subjects listed beneath so each can be dropped on its own.
 */
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
  const selectedSubjects: IChipOption[] = filter.subjects.flatMap((id) => {
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 md:gap-3">
        {/* The standards scroll rather than wrap, so the row stays one line however many there are
            and the Filter button keeps its place at the end. The edges fade so a clipped chip reads
            as "more this way" rather than as a cut. */}
        <div
          className="relative min-w-0 flex-1"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 24px), transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 24px), transparent)',
          }}
        >
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-3 py-1">
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
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* Hidden rather than removed while nothing is chosen, so its slot stays and nothing jumps. */}
          <Button
            isSubtle
            aria-label="Clear all filters"
            aria-hidden={!selectedCount}
            tabIndex={selectedCount ? undefined : -1}
            className={cn('hidden px-2 py-1.5 sm:flex', !selectedCount && 'invisible')}
            leftSection={<XIcon weight="bold" className="h-4 w-4" />}
            onClick={handleClear}
          >
            Clear
          </Button>
          <Popover
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            className="w-auto"

            trigger={
              <Chip
                label={
                  <span className="flex items-center gap-1.5">
                    <span className="hidden sm:inline">Filter</span>
                    {/* Always in the layout, so the chip keeps its width and the row does not shift. */}
                    <Badge
                      tone="primary"
                      appearance="solid"
                      aria-hidden={!filter.subjects.length}
                      className={cn('w-5 justify-center px-0 tabular-nums', !filter.subjects.length && 'invisible')}
                    >
                      {filter.subjects.length || 0}
                    </Badge>
                  </span>
                }
                isSelected={Boolean(filter.subjects.length)}
                leftSection={<FadersHorizontalIcon weight="bold" className="ml-1.5 h-4 w-4" />}
                className="pl-1.5 pr-2.5 sm:pr-3.5"
              />
            }
          >
            <div className="w-[360px] max-w-[calc(100vw-2rem)] p-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <div className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">
                  Subjects{subjectOptions.length ? ` · ${subjectOptions.length}` : ''}
                </div>
                {filter.subjects.length ? (
                  <button
                    type="button"
                    className="text-xs font-medium text-primary hover:underline"
                    onClick={() => onChange({ subjects: [] })}
                  >
                    Clear
                  </button>
                ) : null}
              </div>
              <SubjectList
                options={subjectOptions}
                selected={filter.subjects}
                onToggle={(value) => onChange({ subjects: toggle(filter.subjects, value) })}
              />
            </div>
          </Popover>
        </div>
      </div>
      {selectedSubjects.length ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Showing</span>
          {selectedSubjects.map((subject) => (
            <Chip
              key={subject.value}
              isSelected
              label={subject.name}
              rightSection={<XIcon weight="bold" className="h-3.5 w-3.5" />}
              className="py-1 pl-3 pr-2 text-xs"
              onClick={() => onChange({ subjects: toggle(filter.subjects, subject.value) })}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};
