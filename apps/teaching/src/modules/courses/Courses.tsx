import { type CourseDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import { DataTable } from '@components/app/tables';
import { BlankState } from '@components/others';
import { type IColumnData } from '@interfaces';
import { Badge } from '@repo/ui/core';
import { Button, SoftConfirmModal, TextInput } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import {
  ArrowClockwiseIcon,
  ArrowSquareOutIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { useCourseLookups, useCourseStore, useSelectorLookups, useStandardLookups } from '@stores';
import { ACTIONS, ALL } from '@utils/constants';
import { reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { useSetState } from 'react-use';
import { UpsertCourseModal } from './components';

interface IState {
  isOpenAddModal: boolean;
  search: string;
  /** The course the delete confirm is asking about, or undefined when it is closed. */
  courseToDelete?: CourseDto;
  isDeleting: boolean;
}

export const Courses = () => {
  const { push } = useRouter();
  const courseStore = useCourseLookups();
  const standardStore = useStandardLookups();
  const { setSelectedCourseId } = useSelectorLookups();
  const { createCourse, loadCourses, deleteCourse } = courseStore;
  const { getStandardNamesText, getSubjectNamesText } = standardStore;
  const courses = courseStore.getCourses();
  // Loads once on mount, retries after a failure, and reports the status the screen branches on.
  const { isLoading, isFailed, error } = useLoadOnce(useCourseStore, 'courses', (state) => state.loadCourses);
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
    search: '',
    isDeleting: false,
  });

  // The search box used to render with no handler at all, so typing in it did nothing. Filtering is
  // client-side because the whole collection is already in the store, and it covers the standard and
  // subject names, which are the columns you would actually hunt through. The two maps are in the
  // dependencies because the lookups are stable function references: without them a standard
  // arriving after the courses would leave this list matching against empty names.
  const visibleCourses = useMemo(() => {
    // A draft being typed into the drawer is not a row yet; it joins the list when the save lands.
    const saved = courses.filter((course) => !course.isNew);
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

  const onOpenEditCourseModal = (course: CourseDto) => {
    setSelectedCourseId(course._id);
    setState({ isOpenAddModal: true });
  };

  const onCloseAddModal = () => {
    setState({ isOpenAddModal: false });
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

  const columns: IColumnData<CourseDto>[] = [
    {
      label: 'Name',
      dataKey: 'name',
      width: 260,
      component: (row) => (
        <div className="flex items-center space-x-2">
          <div>
            {(row.attachments ?? []).length ? (
              <div className="w-6 h-6 p-1 rounded-full border border-border border-dashed">
                <PresignedImage url={(row.attachments ?? [])[0].url} noOpen />
              </div>
            ) : null}
          </div>
          <div className="flex-1 truncate">{row.name}</div>
        </div>
      ),
    },
    {
      label: 'Standards',
      dataKey: 'standards',
      valueFormatter: (row) => getStandardNamesText(row.standards ?? []),
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      valueFormatter: (row) => getSubjectNamesText(row.subjects ?? []) || ALL,
    },
    {
      label: 'Modules',
      dataKey: 'daysCount',
      width: 110,
      valueFormatter: (row) => row.stats?.daysCount ?? 0,
    },
    {
      label: 'Test Papers',
      dataKey: 'testsCount',
      width: 120,
      valueFormatter: (row) => row.stats?.testsCount ?? 0,
    },
    {
      label: 'Duration',
      dataKey: 'durationMins',
      width: 120,
      valueFormatter: (row) => {
        const stats = row.stats;
        if (!stats) return '0 mins';
        return `${stats.materialsDurationMins + stats.meetsDurationMins + stats.testsDurationMins} mins`;
      },
    },
    {
      label: 'Published',
      dataKey: 'isPublished',
      width: 120,
      valueFormatter: (row) =>
        row.isPublished ? <Badge tone="success">Published</Badge> : <Badge tone="neutral">Draft</Badge>,
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
          label: 'Delete',
          onClick: (row) => row && setState({ courseToDelete: row }),
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  const addCourseButton = (
    <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddCourseModal}>
      Add <span className="hidden sm:inline">Course</span>
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
            <BlankState label="No matching courses" description="Try a different name, standard or subject." />
          ) : (
            <BlankState
              label="No courses yet"
              description="A course groups modules of study material, test papers and live sessions."
              action={addCourseButton}
            />
          )
        }
      />
    );
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <div className="">
            <TextInput
              placeholder="Search Course"
              value={state.search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setState({ search: e.target.value })}
              leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
            />
          </div>
          <div>{addCourseButton}</div>
        </div>
        <div className="mt-4">{renderTable()}</div>
      </div>

      <UpsertCourseModal isOpen={state.isOpenAddModal} onClose={onCloseAddModal} />
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
