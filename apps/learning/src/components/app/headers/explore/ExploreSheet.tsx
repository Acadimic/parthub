import { PositionType } from '@repo/shared/enums';
import { Link, Modal, TextInput } from '@repo/ui/app';
import { Tabs } from '@repo/ui/core';
import { BlankState } from '@components/others';
import { ArrowRightIcon, MagnifyingGlassIcon, XIcon } from '@phosphor-icons/react';
import { useSelectorLookups } from '@stores';
import { capitalize } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { groupStandards, type IExploreData, useExploreData, useWarmLogos } from './explore-data';
import { CourseRow, Heading, Tile } from './ExploreTiles';

interface IBodyProps {
  data: IExploreData;
  onPick: (query: Record<string, string>) => void;
  onOpenCourse: (courseId: string) => void;
}

/** The catalogue stacked for a thumb: matching courses first, then standards and subjects as tabs. */
const SheetBody = ({ data, onPick, onOpenCourse }: IBodyProps) => {
  const { query, standards, subjects, courses, counts, isEmpty } = data;
  const isWarm = useWarmLogos([...standards, ...subjects]);
  const logoOf = (row: { logo?: string | null }) => (isWarm ? row.logo : null);

  if (isEmpty) {
    return (
      <BlankState
        className="py-16"
        label={`Nothing matches “${query}”`}
        description="Try a shorter word, or search every course below."
        action={
          <Link href={`/courses?q=${encodeURIComponent(query)}`} isSecondary className="px-4 py-2">
            Search all courses
          </Link>
        }
      />
    );
  }

  const standardsTab = (
    <div className="flex flex-col divide-y divide-border">
      {groupStandards(standards).map(([group, rows]) => (
        <div key={group} className="px-2 py-4">
          <Heading>{capitalize(group)}</Heading>
          <div className="grid grid-cols-1 gap-1 min-[480px]:grid-cols-2">
            {rows.map((standard) => (
              <Tile
                key={standard._id}
                name={standard.name}
                logo={logoOf(standard)}
                count={counts.standards[standard._id] ?? 0}
                onClick={() => onPick({ standard: standard._id })}
              />
            ))}
          </div>
        </div>
      ))}
      {!standards.length ? <BlankState label="No standards match" /> : null}
    </div>
  );

  const subjectsTab = (
    <div className="px-2 py-4">
      <div className="grid grid-cols-1 gap-1 min-[480px]:grid-cols-2">
        {subjects.map((subject) => (
          <Tile
            key={subject._id}
            name={subject.name}
            logo={logoOf(subject)}
            count={counts.subjects[subject._id] ?? 0}
            onClick={() => onPick({ subject: subject._id })}
          />
        ))}
      </div>
      {!subjects.length ? <BlankState label="No subjects match" /> : null}
    </div>
  );

  return (
    <div className="flex flex-col">
      {courses.length ? (
        <div className="border-b border-border px-2 py-4">
          <Heading>Courses</Heading>
          <div className="grid grid-cols-1 gap-1 min-[480px]:grid-cols-2">
            {courses.map((course) => (
              <CourseRow key={course._id} course={course} onClick={() => onOpenCourse(course._id)} />
            ))}
          </div>
        </div>
      ) : null}
      <Tabs
        className="px-2"
        tabs={[
          { label: `Standards (${standards.length})`, component: standardsTab },
          { label: `Subjects (${subjects.length})`, component: subjectsTab },
        ]}
      />
    </div>
  );
};

/**
 * Explore for a phone or a narrow tablet: a bottom sheet with its own search box, opened from the
 * tab bar's centre button and from the header's search icon. Rendered once by `PageLayout`; the
 * open flag lives in the selector store so both openers reach it.
 */
export const ExploreSheet = () => {
  const { push, asPath } = useRouter();
  const { isExploreOpen, setIsExploreOpen } = useSelectorLookups();
  const [query, setQuery] = useState('');
  const data = useExploreData(query);

  const close = () => setIsExploreOpen(false);

  // A fresh sheet each time: the last search must not greet the next open.
  useEffect(() => {
    if (!isExploreOpen) setQuery('');
  }, [isExploreOpen]);

  useEffect(() => {
    close();
  }, [asPath]);

  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    const q = query.trim();
    close();
    push({ pathname: '/courses', query: q ? { q } : {} });
  };

  return (
    <Modal
      title="Explore"
      position={PositionType.BOTTOM}
      isOpen={isExploreOpen}
      onClose={close}
      className="max-h-[92vh]"
      childrenClassName="min-h-[70vh] px-0 py-0"
      component={
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background px-4 py-3">
            <form role="search" onSubmit={handleSubmit} className="flex-1">
              <TextInput
                name="q"
                type="search"
                className="[&::-webkit-search-cancel-button]:hidden"
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses, classes, subjects"
                aria-label="Search courses"
                leftsection={<MagnifyingGlassIcon weight="bold" className="h-4 w-4 text-muted-foreground" />}
                rightsection={
                  query ? (
                    <button type="button" aria-label="Clear search" onClick={() => setQuery('')}>
                      <XIcon weight="bold" className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ) : undefined
                }
              />
            </form>
            <Link
              href={data.query ? `/courses?q=${encodeURIComponent(data.query)}` : '/courses'}
              isSubtle
              aria-label="All courses"
              className="shrink-0 px-2 py-2 text-primary"
              rightsection={<ArrowRightIcon weight="bold" className="h-5 w-5" />}
            >
              <span className="sr-only">All courses</span>
            </Link>
          </div>
          <SheetBody
            data={data}
            onPick={(filter) => {
              close();
              push({ pathname: '/courses', query: filter });
            }}
            onOpenCourse={(courseId) => {
              close();
              push(`/courses/${courseId}/preview`);
            }}
          />
        </div>
      }
    />
  );
};
