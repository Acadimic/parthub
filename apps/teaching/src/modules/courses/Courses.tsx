import { DataTable } from '@components/app/tables';
import { type IColumnData } from '@interfaces';
import { Button, FullScreenLoader, TextInput } from '@repo/ui/app';
import { PresignedImage } from '@components/app/attachments';
import { MagnifyingGlassIcon, PencilIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { type ICourse, useStores } from '@stores';
import { ACTIONS, ALL } from '@utils/constants';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { UpsertCourseModal } from './components';

interface IState {
  isOpenAddModal: boolean;
}

export const Courses = observer(() => {
  const { push } = useRouter();
  const { courseStore, selectorStore, standardStore } = useStores();
  const { setSelectedCourseId } = selectorStore;
  const { isCourseLoading, isCourseLoaded, courses, createCourse, loadCourses } = courseStore;
  const { getStandardsByIds, getSubjectsByIds } = standardStore;
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

  const onClickCourse = (course: ICourse) => {
    setSelectedCourseId(course._id);
    setTimeout(() => {
      push({ pathname: `/courses/${course._id}`, query: { name: course.name } }, `/courses/${course._id}`);
    }, 200);
  };

  const onOpenEditCourseModal = (course: ICourse) => {
    setSelectedCourseId(course._id);
    setState({ isOpenAddModal: true });
  };

  const columns: IColumnData<ICourse>[] = [
    {
      label: 'Name',
      dataKey: 'name',
      valueFormatter: (row: ICourse) => {
        return (
          <div className="flex items-center space-x-2">
            <div>
              {row.attachments.length ? (
                <div className="w-6 h-6 p-1 rounded-full border border-color-secondary border-dashed">
                  <PresignedImage url={row.attachments[0].url} />
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
      valueFormatter: (row: ICourse) =>
        getStandardsByIds(row.standards)
          .map((standard) => standard.name)
          .join(', '),
    },
    {
      label: 'Subjects',
      dataKey: 'subjects',
      valueFormatter: (row: ICourse) =>
        getSubjectsByIds(row.subjects)
          .map((subject) => subject.name)
          .join(', ') || ALL,
    },
    {
      label: 'Total Modules',
      dataKey: 'daysCount',
      valueFormatter: (row: ICourse) => row.stats.daysCount,
    },
    {
      label: 'Total Test Papers',
      dataKey: 'testsCount',
      valueFormatter: (row: ICourse) => row.stats.testsCount,
    },
    {
      label: 'Total Readings',
      dataKey: 'readingsCount',
      valueFormatter: (row: ICourse) => row.stats.readingsCount,
    },
    {
      label: 'Total Videos',
      dataKey: 'videosCount',
      valueFormatter: (row: ICourse) => row.stats.videosCount,
    },
    {
      label: 'Total Meets',
      dataKey: 'meetsCount',
      valueFormatter: (row: ICourse) => row.stats.meetsCount,
    },
    {
      label: 'Total Duration Mins',
      dataKey: 'durationsMins',
      valueFormatter: (row: ICourse) => {
        return `${row.stats.materialsDurationMins + row.stats.meetsDurationMins + row.stats.testsDurationMins} mins`;
      },
    },
    {
      label: 'Is Published',
      dataKey: 'isPublished',
      valueFormatter: (row: ICourse) => (row.isPublished ? 'Yes' : 'No'),
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
});
