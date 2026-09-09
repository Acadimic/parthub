import { type CourseDto } from '@repo/shared/contracts';
import { DataTable } from '@components/app/tables';
import { type IColumnData } from '@interfaces';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { PresignedImage } from '@components/app/attachments';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useStandardLookups, useCourseLookups, useSelectorLookups } from '@stores';
import { ACTIONS, ALL } from '@utils/constants';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { UpsertCourseModal } from './components';

interface IState {
  isOpenAddModal: boolean;
}

export const Courses = () => {
  const { push } = useRouter();
  const courseStore = useCourseLookups();
  const selectorStore = useSelectorLookups();
  const { setSelectedCourseId } = selectorStore;
  const { createCourse, loadCourses } = courseStore;
  const isCourseLoading = courseStore.isLoading('courses');
  const isCourseLoaded = courseStore.isLoaded('courses');
  const courses = courseStore.getCourses();
  const { getStandardNamesText, getSubjectNamesText } = useStandardLookups();
  const [state, setState] = useSetState<IState>({
    isOpenAddModal: false,
  });

  const onOpenAddCourseModal = () => {
    createCourse();
    setState({ isOpenAddModal: true });
  };

  const onCloseAddModal = () => {
    setState({ isOpenAddModal: false });
  };

  const onClickCourse = (course: CourseDto) => {
    setSelectedCourseId(course._id);
    setTimeout(() => {
      push({ pathname: `/courses/${course._id}`, query: { name: course.name } }, `/courses/${course._id}`);
    }, 200);
  };

  const onOpenEditCourseModal = (course: CourseDto) => {
    setSelectedCourseId(course._id);
    setState({ isOpenAddModal: true });
  };

  const columns: IColumnData<CourseDto>[] = [
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: CourseDto) => {
        return (
          <div className="flex items-center space-x-2">
            <div>
              {(row.attachments ?? []).length ? (
                <div className="w-6 h-6 p-1 rounded-full border border-color-secondary border-dashed">
                  <PresignedImage url={(row.attachments ?? [])[0].url} />
                </div>
              ) : null}
            </div>
            <div className="flex-1 truncate text-blue-primary cursor-pointer" onClick={() => onClickCourse(row)}>
              {row.name}
            </div>
          </div>
        );
      },
    },
    {
      label: 'Description',
      dataKey: 'description',
    },
    {
      label: 'Standards',
      dataKey: 'standards',
      valueFormatter: (row: CourseDto) => getStandardNamesText(row.standards ?? []),
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      valueFormatter: (row: CourseDto) => getSubjectNamesText(row.subjects ?? []) || ALL,
    },
    {
      label: 'Total Modules',
      dataKey: 'daysCount',
      valueFormatter: (row: CourseDto) => row.stats?.daysCount ?? 0,
    },
    {
      label: 'Total Test Papers',
      dataKey: 'testsCount',
      valueFormatter: (row: CourseDto) => row.stats?.testsCount ?? 0,
    },
    {
      label: 'Total Readings',
      dataKey: 'readingsCount',
      valueFormatter: (row: CourseDto) => row.stats?.readingsCount ?? 0,
    },
    {
      label: 'Total Videos',
      dataKey: 'videosCount',
      valueFormatter: (row: CourseDto) => row.stats?.videosCount ?? 0,
    },
    {
      label: 'Total Meets',
      dataKey: 'meetsCount',
      valueFormatter: (row: CourseDto) => row.stats?.meetsCount ?? 0,
    },
    {
      label: 'Total Duration Mins',
      dataKey: 'durationsMins',
      valueFormatter: (row: CourseDto) => {
        const stats = row.stats;
        if (!stats) return '0 mins';
        return `${stats.materialsDurationMins + stats.meetsDurationMins + stats.testsDurationMins} mins`;
      },
    },
    {
      label: 'Is Published',
      dataKey: 'isPublished',
      valueFormatter: (row: CourseDto) => (row.isPublished ? 'Yes' : 'No'),
    },
    {
      label: 'Actions',
      dataKey: ACTIONS,
      menuItems: [
        {
          label: 'Add Modules',
          onClick: (row) => row && onClickCourse(row),
          icon: <PlusIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Edit Course',
          onClick: (row) => row && onOpenEditCourseModal(row),
          icon: <PencilIcon weight="bold" className="w-4 h-4" />,
        },
        {
          label: 'Delete',
          onClick: () => {},
          icon: <TrashIcon weight="bold" className="w-4 h-4" />,
        },
      ],
      width: 96,
    },
  ];

  useEffect(() => {
    if (!isCourseLoading) loadCourses();
  }, []);

  return (
    <>
      {isCourseLoaded ? (
        <div>
          <div className="flex justify-between items-center">
            <div className="">
              <TextInput
                placeholder="Search Course"
                leftsection={<MagnifyingGlassIcon weight="bold" className="w-4 h-4" />}
              />
            </div>
            <div>
              <Button leftsection={<PlusIcon weight="bold" className="w-4 h-4" />} onClick={onOpenAddCourseModal}>
                Add <span className="hidden sm:inline">Course</span>
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <DataTable rows={courses} columns={columns} />
          </div>
        </div>
      ) : (
        <FullScreenLoader withHeader loading={isCourseLoading} />
      )}

      <UpsertCourseModal isOpen={state.isOpenAddModal} onClose={onCloseAddModal} />
    </>
  );
};
