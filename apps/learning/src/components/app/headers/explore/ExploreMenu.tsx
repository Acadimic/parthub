import { Button, Link } from '@repo/ui/app';
import { Popover, ScrollArea } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { BlankState } from '@components/others';
import { ArrowRightIcon, CaretDownIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { capitalize } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useCourseStore } from '@stores';
import {
  EXPLORE_SEARCH_ATTRIBUTE,
  groupStandards,
  type IExploreData,
  useExploreData,
  useWarmLogos,
} from './explore-data';
import { CourseRow, Heading, Tile } from './ExploreTiles';

interface IPanelProps {
  data: IExploreData;
  onPick: (query: Record<string, string>) => void;
  onOpenCourse: (courseId: string) => void;
}

const ExplorePanel = ({ data, onPick, onOpenCourse }: IPanelProps) => {
  const { query, standards, subjects, courses, counts, isEmpty } = data;
  const isWarm = useWarmLogos([...standards, ...subjects]);
  const logoOf = (row: { logo?: string | null }) => (isWarm ? row.logo : null);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">
            {query ? (
              <>
                Results for <span className="text-primary">“{query}”</span>
              </>
            ) : (
              'Explore the catalogue'
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {query ? 'Press Enter to search every course.' : 'Pick a class or exam, or browse by subject.'}
          </div>
        </div>
        <Link
          href={query ? `/courses?q=${encodeURIComponent(query)}` : '/courses'}
          isSubtle
          className="shrink-0 px-2 py-1 text-sm text-primary"
          rightsection={<ArrowRightIcon weight="bold" className="h-4 w-4" />}
        >
          All courses
        </Link>
      </div>
      {isEmpty ? (
        <BlankState
          label={`Nothing matches “${query}”`}
          description="Try a shorter word, or press Enter to search course content."
        />
      ) : (
        <div className="flex flex-col">
          {courses.length ? (
            <div className="border-b border-border p-3 pb-4">
              <Heading>Courses</Heading>
              <div className="grid gap-1 sm:grid-cols-2">
                {courses.map((course) => (
                  <CourseRow key={course._id} course={course} onClick={() => onOpenCourse(course._id)} />
                ))}
              </div>
            </div>
          ) : null}
          <div className="grid md:grid-cols-[3fr_2fr] md:divide-x md:divide-border">
            <ScrollArea className={cn('max-h-[60vh]', !standards.length && 'hidden')}>
              {/* One block per group, separated by a rule and a gap, so the groups read as
                  sections rather than one long list. */}
              <div className="flex flex-col divide-y divide-border">
                {groupStandards(standards).map(([group, rows]) => (
                  <div key={group} className="p-3 pb-4">
                    <Heading>{capitalize(group)}</Heading>
                    <div className="grid gap-1 sm:grid-cols-2">
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
              </div>
            </ScrollArea>
            <ScrollArea className={cn('max-h-[60vh]', !subjects.length && 'hidden')}>
              <div className="p-3 pb-4">
                <Heading>Subjects</Heading>
                <div className="grid gap-1">
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
              </div>
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
};

interface IProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** What the header's search box holds; narrows every section, and lists matching courses. */
  query: string;
}

/**
 * The catalogue at a glance, as a wide popover under the header: every standard by group on the
 * left, every subject on the right, each leading to the course grid filtered to it. Controlled by
 * the header, because the search box beside it opens the panel as the learner types. Small screens
 * get `ExploreSheet` instead.
 */
export const ExploreMenu = ({ isOpen, onOpenChange, query }: IProps) => {
  const { push } = useRouter();
  const data = useExploreData(query);
  const close = () => onOpenChange(false);

  return (
    <Popover
      open={isOpen}
      onOpenChange={onOpenChange}
      autoFocus={false}
      onInteractOutside={(event) => {
        // The search box drives this panel from outside it; a click there must not close it.
        const target = event.target as Element | null;
        if (target?.closest(`[${EXPLORE_SEARCH_ATTRIBUTE}]`)) event.preventDefault();
      }}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      className="w-[min(920px,calc(100vw-2rem))] overflow-hidden rounded-xl shadow-xl"
      trigger={
        <Button
          isSubtle
          aria-expanded={isOpen}
          className={cn('px-3 py-1.5 text-foreground', isOpen && 'bg-accent')}
          leftsection={<SquaresFourIcon weight="bold" className="h-4 w-4 text-primary" />}
          rightsection={<CaretDownIcon weight="bold" className="h-3.5 w-3.5 text-muted-foreground" />}
        >
          Explore
        </Button>
      }
    >
      <ExplorePanel
        data={data}
        onPick={(filter) => {
          close();
          push({ pathname: '/courses', query: filter });
        }}
        onOpenCourse={(courseId) => {
          close();
          push(useCourseStore.getState().getCoursePathById(courseId));
        }}
      />
    </Popover>
  );
};
