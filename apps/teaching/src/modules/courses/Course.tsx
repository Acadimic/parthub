import { Accordions, Button, Loader, Menu, SplitButton } from '@repo/ui/app';
import { DownloadSimpleIcon, PencilIcon, PlusIcon } from '@phosphor-icons/react';
import { BlankState, TitleWithIcon } from '@components/others';
import { MaterialInfo } from '@modules/study-materials/components';
import {
  type ICourseModule,
  useCourseLookups,
  useMaterialLookups,
  useMeetLookups,
  useSelectedCourse,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { observer } from 'mobx-react-lite';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import { CourseModuleView, SessionsView, UpsertCourseModuleModal, UpsertSessionsModal } from './components';

interface IProps {
  courseId: string;
}

interface IState {
  isOpenUpsertCourseModuleModal: boolean;
  isOpenUpsertSessionsModal: boolean;
}

export const Course = observer(({ courseId }: IProps) => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const meetStore = useMeetLookups();
  const { selectedCourseId, setSelectedCourseModuleId } = selectorStore;
  const selectedCourse = useSelectedCourse();
  const { isCourseModuleLoading, getCourseModulesByCourseId, loadCourseModules, createCourseModule, getCourseById } =
    courseStore;
  const { loadStandardsMaterials } = materialStore;
  const isLoadingMaterials = materialStore.isLoading('materials');
  const { loadTestPapers } = testPaperStore;
  const isLoadingTestPapers = testPaperStore.isLoading('testPapers');
  const { loadMeets, getMeetsByIds } = meetStore;
  const [state, setState] = useSetState<IState>({
    isOpenUpsertCourseModuleModal: false,
    isOpenUpsertSessionsModal: false,
  });

  const onOpenUpsertCourseModuleModal = (courseId: string) => {
    createCourseModule(courseId);
    setState({ isOpenUpsertCourseModuleModal: true });
  };

  const onEditCourseModule = (courseModule: ICourseModule) => {
    setSelectedCourseModuleId(courseModule._id);
    setState({ isOpenUpsertCourseModuleModal: true });
  };

  const onCloseUpsertCourseModuleModal = () => {
    setState({ isOpenUpsertCourseModuleModal: false });
  };

  const onOpenUpsertSessionsModal = () => {
    setState({ isOpenUpsertSessionsModal: true });
  };

  const onCloseUpsertSessionsModal = () => {
    setState({ isOpenUpsertSessionsModal: false });
  };

  useEffect(() => {
    if (!selectedCourse) push('/courses');
    else {
      loadCourseModules(selectedCourseId);
      loadTestPapers();
      loadStandardsMaterials(selectedCourse?.standards);
      loadMeets();
    }
  }, []);

  if (!selectedCourse) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* <Card>
        <CourseDetails />
      </Card> */}
      <div className="flex flex-col gap-3">
        {selectedCourse.courses.map((courseId: string, index: number) => {
          const course = getCourseById(courseId);
          const courseModules = getCourseModulesByCourseId(courseId);
          if (!course) return null;
          return (
            <div key={courseId} className="flex flex-col gap-6">
              <div className="">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
                  <TitleWithIcon title={`Modules for ${course?.name}`} />
                  <SplitButton
                    onClick={() => onOpenUpsertCourseModuleModal(courseId)}
                    text="Add Module"
                    menuItems={[
                      {
                        label: 'Import Modules',
                        onClick: () => {},
                        icon: <DownloadSimpleIcon weight="bold" className="w-4 h-4" />,
                      },
                    ]}
                  />
                </div>
                <div>
                  {courseModules.length !== 0 ? (
                    <Accordions
                      openIndexes={[0]}
                      items={courseModules.map((courseModule) => ({
                        title: (
                          <div className="flex flex-col md:flex-row justify-between w-full items-center relative">
                            <div className="flex flex-col md:flex-row text-sm font-semibold justify-start items-start space-x-4">
                              <div>{courseModule.name}</div>{' '}
                              <div className="">
                                <MaterialInfo
                                  materialIds={courseModule.materials}
                                  testPaperIds={courseModule.testPapers}
                                />
                              </div>
                            </div>
                            <div className="absolute -right-4">
                              <Menu
                                menuItems={[
                                  {
                                    label: 'Edit',
                                    onClick: () => onEditCourseModule(courseModule),
                                    icon: <PencilIcon weight="bold" className="w-4 h-4" />,
                                  },
                                  {
                                    label: 'Add Study Materials',
                                    onClick: () => {},
                                    icon: <PlusIcon weight="bold" className="w-4 h-4" />,
                                  },
                                  {
                                    label: 'Add Test Papers',
                                    onClick: () => {},
                                    icon: <PlusIcon weight="bold" className="w-4 h-4" />,
                                  },
                                ]}
                                className=""
                              />
                            </div>
                          </div>
                        ),
                        component: <CourseModuleView courseModule={courseModule} />,
                      }))}
                    />
                  ) : isCourseModuleLoading || isLoadingTestPapers || isLoadingMaterials ? (
                    <Loader isLoading={isCourseModuleLoading || isLoadingTestPapers || isLoadingMaterials} />
                  ) : (
                    <div className="flex items-center justify-center w-full h-80">
                      <BlankState label="No modules found" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
                  <TitleWithIcon title={`Sessions for ${course?.name}`} />
                  <Button text="Add Session" onClick={onOpenUpsertSessionsModal} />
                </div>
                <SessionsView course={course} />
              </div>
            </div>
          );
        })}
      </div>
      <UpsertCourseModuleModal isOpen={state.isOpenUpsertCourseModuleModal} onClose={onCloseUpsertCourseModuleModal} />
      <UpsertSessionsModal isOpen={state.isOpenUpsertSessionsModal} onClose={onCloseUpsertSessionsModal} />
    </div>
  );
});
