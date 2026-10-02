import { type CourseDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { type IColumnData, type ISelectItem } from '@interfaces';
import { Badge } from '@repo/ui/core';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import {
  ArrowClockwiseIcon,
  ArrowCounterClockwiseIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  RocketLaunchIcon,
  SparkleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import {
  byDisplayOrder,
  type CourseMoveDirection,
  useCourseLookups,
  useCourseStore,
  useSelectorLookups,
  useStandardLookups,
} from '@stores';
import { ACTIONS, ALL } from '@repo/shared/utils';
import { reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { UpsertCourseModal, AiCourseDrawer } from './components';

interface IState {
  isOpenAddModal: boolean;
  isOpenAi: boolean;
  search: string;
  /** The course the delete confirm is asking about, or undefined when it is closed. */
  courseToDelete?: CourseDto;
  isDeleting: boolean;
  /** The course the publish confirm is asking about, or undefined when it is closed. */
  courseToPublish?: CourseDto;
  isPublishing: boolean;
}

export const Courses = () => {
  const router = useRouter();
  const { push } = router;
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const { setSelectedCourseId } = useSelectorLookups();
  const { createCourse, loadCourses, deleteCourse, setCoursePublished, moveCourse } = courseStore;
  const { getStandardNamesText, getSubjectNamesText } = standardStore;
  const courses = courseStore.getCourses();
  const standardOptions: ISelectItem[] = standardStore
    .getStandards()
    .map((standard) => ({ label: standard.name, value: standard._id }));
  const subjectOptions: ISelectItem[] = standardStore.getStandardsSubjectItems(
    standardOptions.map((option) => option.value),
  );
  /** A course with no subjects, or the ALL marker, covers every subject of its standards, so it matches any of them. */
  const courseSubjectIds = (course: CourseDto) => {
    const subjects = (course.subjects ?? []).filter((id) => id !== ALL);
    if (subjects.length) return subjects;
    return standardStore.getStandardsSubjectItems(course.standards ?? []).map((item) => item.value);
  };
  const totalDuration = (course: CourseDto) => {
    const stats = course.stats;
    return stats ? stats.materialsDurationMins + stats.meetsDurationMins + stats.testsDurationMins : 0;
  };
  // Loads once on mount, retries after a failure, and reports the status the screen branches on.
  const { isLoading, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
    isOpenAi: false,
    search: '',
    isDeleting: false,
    isPublishing: false,
  });

  // The search box used to render with no handler at all, so typing in it did nothing. Filtering is
  // client-side because the whole collection is already in the store, and it covers the standard and
  // subject names, which are the columns you would actually hunt through. The two maps are in the
  // dependencies because the lookups are stable function references: without them a standard
  // arriving after the courses would leave this list matching against empty names.
  const visibleCourses = useMemo(() => {
    // A draft being typed into the drawer is not a row yet; it joins the list when the save lands.
    // In display order — the order learners see in the catalogue — until a column header re-sorts.
    const saved = courses.filter((course) => !course.isNew).sort(byDisplayOrder);
    const term = state.search.trim().toLowerCase();
    if (!term) return saved;
    return saved.filter((course) =>
      `${course.name} ${course.description ?? ''} ${getStandardNamesText(course.standards ?? [])} ${getSubjectNamesText(
        course.subjects ?? [],
      )}`
        .toLowerCase()
        .includes(term),
    );
  }, [courses, state.search, standardStore.standardMap, standardStore.subjectMap]);

  const openCourse = (course: CourseDto) => {
    setSelectedCourseId(course._id);
    push({ pathname: `/courses/${course._id}`, query: { name: course.name } }, `/courses/${course._id}`);
  };

  const onOpenAddCourseModal = () => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // row stays in the table.
    setSelectedCourseId(createCourse()._id);
    setState({ isOpenAddModal: true });
  };

  // `?add=true` arrives from the home page's quick actions: open the create drawer once, then drop
  // the flag from the address so a refresh or a back navigation does not reopen it.
  useEffect(() => {
    if (router.query.add !== 'true') return;
    onOpenAddCourseModal();
    router.replace(router.pathname, undefined, { shallow: true });
  }, [router.query.add]);

  const onOpenEditCourseModal = (course: CourseDto) => {
    setSelectedCourseId(course._id);
    setState({ isOpenAddModal: true });
  };

  const onCloseAddModal = () => {
    setState({ isOpenAddModal: false });
  };

  const onConfirmPublish = async () => {
    const course = state.courseToPublish;
    if (!course) return;
    const isPublished = !course.isPublished;
    try {
      setState({ isPublishing: true });
      await setCoursePublished(course._id, isPublished);
      successToast({ message: isPublished ? `"${course.name}" is published.` : `"${course.name}" is back in draft.` });
      setState({ courseToPublish: undefined });
    } catch (error) {
      reportError(error, 'Could not change the course status.');
    } finally {
      setState({ isPublishing: false });
    }
  };

  const onMoveCourse = async (course: CourseDto, direction: CourseMoveDirection) => {
    try {
      await moveCourse(course._id, direction);
    } catch (error) {
      reportError(error, 'Could not change the course order.');
    }
  };

  const onConfirmDelete = async () => {
    const course = state.courseToDelete;
    if (!course) return;
    try {
      setState({ isDeleting: true });
      await deleteCourse(course._id);
      successToast({ message: 'Course deleted.' });
      setState({ courseToDelete: undefined });
    } catch (error) {
      reportError(error, 'Could not delete the course.');
    } finally {
      setState({ isDeleting: false });
    }
  };

  /** The second line under a course's name: its standards and subjects, which used to be two columns. */
  const describeScope = (row: CourseDto) => {
    const standards = getStandardNamesText(row.standards ?? []) || 'No standard';
    const subjects = getSubjectNamesText((row.subjects ?? []).filter((id) => id !== ALL)) || 'All subjects';
    return `${standards} · ${subjects}`;
  };

  const columns: IColumnData<CourseDto>[] = [
    {
      label: 'Course',
      dataKey: 'name',
      width: 320,
      isSortable: true,
      filters: [
        { key: 'standard', label: 'Standard', options: standardOptions, getValues: (row) => row.standards ?? [] },
        { key: 'subject', label: 'Subject', options: subjectOptions, getValues: courseSubjectIds },
      ],
      component: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
            {(row.attachments ?? []).length ? (
              <PresignedImage url={(row.attachments ?? [])[0].url} noOpen />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">{row.name.slice(0, 1).toUpperCase()}</span>
            )}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-foreground">{row.name}</span>
            <span className="truncate text-xs text-muted-foreground">{describeScope(row)}</span>
          </div>
        </div>
      ),
    },
    {
      label: 'Modules',
      dataKey: 'daysCount',
      width: 110,
      align: 'right',
      sortValue: (row) => row.stats?.daysCount ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.stats?.daysCount ?? 0}</span>,
    },
    {
      label: 'Tests',
      dataKey: 'testsCount',
      width: 100,
      align: 'right',
      sortValue: (row) => row.stats?.testsCount ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.stats?.testsCount ?? 0}</span>,
    },
    {
      label: 'Sessions',
      dataKey: 'meetsCount',
      width: 110,
      align: 'right',
      sortValue: (row) => row.stats?.meetsCount ?? 0,
      valueFormatter: (row) => <span className="font-mono">{row.stats?.meetsCount ?? 0}</span>,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 120,
      align: 'right',
      sortValue: totalDuration,
      valueFormatter: (row) => <span className="font-mono">{totalDuration(row)} min</span>,
    },
    {
      label: 'Status',
      dataKey: 'isPublished',
      width: 125,
      sortValue: (row) => (row.isPublished ? 1 : 0),
      filters: [
        {
          key: 'status',
          label: 'Status',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Draft', value: 'draft' },
          ],
          getValues: (row) => (row.isPublished ? 'published' : 'draft'),
        },
      ],
      valueFormatter: (row) => (
        <Badge tone={row.isPublished ? 'success' : 'neutral'} appearance="soft" withDot>
          {row.isPublished ? 'Published' : 'Draft'}
        </Badge>
      ),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Open',
          onClick: (row) => row && openCourse(row),
          icon: <ArrowSquareOutIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Edit',
          onClick: (row) => row && onOpenEditCourseModal(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          // Read off the row: one menu serves every row, and the wording has to follow the status.
          label: (row) => (row?.isPublished ? 'Unpublish' : 'Publish'),
          onClick: (row) => row && setState({ courseToPublish: row }),
          icon: (row) =>
            row?.isPublished ? (
              <ArrowCounterClockwiseIcon weight="bold" className="w-4 h-4" />
            ) : (
              <RocketLaunchIcon weight="bold" className="w-4 h-4" />
            ),
        },
        {
          // Moves the course in the learning catalogue's order, which this table shows by default.
          label: 'Move up',
          onClick: (row) => row && onMoveCourse(row, 'up'),
          icon: <ArrowUpIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Move down',
          onClick: (row) => row && onMoveCourse(row, 'down'),
          icon: <ArrowDownIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: (row) => row && setState({ courseToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 90,
    },
  ];

  const addCourseButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddCourseModal}>
      Add <span className="hidden sm:inline">course</span>
    </Button>
  );
  const generateButton = (
    <Button
      isSecondary
      leftsection={<SparkleIcon weight="bold" className="w-4 h-4" />}
      onClick={() => setState({ isOpenAi: true })}
    >
      Generate <span className="hidden sm:inline">with AI</span>
    </Button>
  );

  const renderTable = () => {
    // The failure branch comes first: `DataTable`'s empty state would otherwise read "no courses"
    // when the truth is that the request never landed.
    if (isFailed) {
      return (
        <div className="flex h-[calc(100vh-148px)] items-center justify-center rounded-lg border border-border">
          <BlankState
            label="Could not load courses"
            description={error ?? 'The request failed.'}
            action={
              <Button
                isSecondary
                leftsection={<ArrowClockwiseIcon weight="bold" className="w-4 h-4" />}
                onClick={() => loadCourses()}
              >
                Retry
              </Button>
            }
          />
        </div>
      );
    }
    return (
      <DataTable
        rows={visibleCourses}
        columns={columns}
        isLoading={isLoading}
        onRowClick={openCourse}
        emptyState={
          state.search ? (
            <BlankState
              label="No matching courses"
              description="Try a different name, standard or subject."
              action={<Button isSecondary text="Clear search" onClick={() => setState({ search: '' })} />}
            />
          ) : (
            <BlankState
              label="No courses yet"
              description="Let AI lay a syllabus across weeks of study days, reusing your lessons and tests, or build a course by hand."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {generateButton}
                  {addCourseButton}
                </div>
              }
            />
          )
        }
      />
    );
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-full sm:w-72">
            <TextInput
              placeholder="Search courses"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              aria-label="Search courses"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {visibleCourses.length} {visibleCourses.length === 1 ? 'course' : 'courses'}
            <span className="hidden md:inline"> · Filter by standard, subject or status from the column headers.</span>
          </p>
          <div className="ml-auto flex items-center gap-2">
            {generateButton}
            {addCourseButton}
          </div>
        </div>
        {renderTable()}
      </div>

      <UpsertCourseModal isOpen={state.isOpenAddModal} onClose={onCloseAddModal} />
      <AiCourseDrawer isOpen={state.isOpenAi} onClose={() => setState({ isOpenAi: false })} />
      <SoftConfirmModal
        isOpen={!!state.courseToPublish}
        title={state.courseToPublish?.isPublished ? 'Unpublish this course?' : 'Publish this course?'}
        description={
          state.courseToPublish?.isPublished
            ? `"${state.courseToPublish?.name}" will no longer be visible to learners. Its modules and sessions are kept.`
            : `Learners in the course’s standards will be able to see "${state.courseToPublish?.name}" and enrol.`
        }
        confirmText={state.courseToPublish?.isPublished ? 'Unpublish' : 'Publish'}
        isLoading={state.isPublishing}
        onConfirm={onConfirmPublish}
        onCancel={() => !state.isPublishing && setState({ courseToPublish: undefined })}
      />
      <SoftConfirmModal
        isOpen={!!state.courseToDelete}
        title="Delete course?"
        description={`"${state.courseToDelete?.name || 'This course'}" and its plans will no longer be visible to students.`}
        confirmText="Delete"
        isDestructive
        isLoading={state.isDeleting}
        onConfirm={onConfirmDelete}
        onCancel={() => setState({ courseToDelete: undefined })}
      />
    </>
  );
};
