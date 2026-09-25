import { Button } from '@repo/ui/app';
import { type ISelectItem } from '@repo/ui/types';
import { Select } from '@components/app/selects';
import { type ICourseFilter } from '@interfaces';
import { FunnelSimpleIcon, XIcon } from '@phosphor-icons/react';
import { useCourseLookups, useStandardLookups } from '@stores';

interface IProps {
  filter: ICourseFilter;
  onChange: (filter: Partial<ICourseFilter>) => void;
}

/** An id with no row loaded has no name to show, so it is dropped rather than rendered blank. */
const toItems = (values: string[], toItem: (value: string) => ISelectItem | undefined): ISelectItem[] =>
  values.map(toItem).filter((item): item is ISelectItem => !!item);

export const CourseFilters = ({ filter, onChange }: IProps) => {
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const { getStandardById, getSubjectById } = standardStore;
  const options = courseStore.getCourseFilterOptions(filter);
  const isFiltering = Boolean(filter.standards.length || filter.subjects.length || filter.topics.length);

  const standardItems = toItems(options.standards, (standardId) => {
    const standard = getStandardById(standardId);
    return standard && { label: standard.name, value: standard._id, group: standard.group };
  });
  const subjectItems = toItems(options.subjects, (subjectId) => {
    const subject = getSubjectById(subjectId);
    return subject && { label: subject.name, value: subject._id };
  });
  const topicItems = options.topics.map((topic) => ({ label: topic, value: topic }));

  /** The topics still on offer once the standards and subjects above them have been settled. */
  const keptTopics = (standards: string[], subjects: string[]) => {
    const { topics } = courseStore.getCourseFilterOptions({ standards, subjects, topics: [] });
    return filter.topics.filter((topic) => topics.includes(topic));
  };

  // A standard the learner deselects takes its subjects and topics with it: a selection the
  // narrowed list no longer offers would keep filtering invisibly, so the grid and the controls
  // would stop agreeing.
  const handleStandardsChange = (items: ISelectItem[]) => {
    const standards = items.map((item) => item.value);
    const options = courseStore.getCourseFilterOptions({ ...filter, standards });
    const subjects = filter.subjects.filter((subjectId) => options.subjects.includes(subjectId));
    onChange({ standards, subjects, topics: keptTopics(standards, subjects) });
  };

  const handleSubjectsChange = (items: ISelectItem[]) => {
    const subjects = items.map((item) => item.value);
    onChange({ subjects, topics: keptTopics(filter.standards, subjects) });
  };

  const handleClear = () => onChange({ standards: [], subjects: [], topics: [] });

  return (
    <div className="mb-8 flex flex-col gap-3 rounded border border-border p-4 md:flex-row md:items-end">
      <div className="flex items-center gap-2 pb-2 text-sm font-medium text-muted-foreground md:pb-3">
        <FunnelSimpleIcon weight="bold" className="h-4 w-4" />
        <span>Filter</span>
      </div>
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          label="Standard"
          placeholder="All standards"
          items={standardItems}
          values={filter.standards}
          onChange={handleStandardsChange}
          isDisabled={!standardItems.length}
          isGrouped
          withInPortal
        />
        <Select
          label="Subject"
          placeholder="All subjects"
          items={subjectItems}
          values={filter.subjects}
          onChange={handleSubjectsChange}
          isDisabled={!subjectItems.length}
          withInPortal
        />
        <Select
          label="Topic"
          placeholder="All topics"
          items={topicItems}
          values={filter.topics}
          onChange={(items) => onChange({ topics: items.map((item) => item.value) })}
          isDisabled={!topicItems.length}
          withInPortal
        />
      </div>
      {isFiltering ? (
        <Button isSubtle text="Clear" leftsection={<XIcon weight="bold" className="h-4 w-4" />} onClick={handleClear} />
      ) : null}
    </div>
  );
};
