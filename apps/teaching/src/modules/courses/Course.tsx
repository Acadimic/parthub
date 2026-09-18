import { Accordions, Button, Loader, Menu, SoftConfirmModal } from '@repo/ui/app';
import { PencilIcon, TrashIcon } from '@phosphor-icons/react';
import { BlankState, TitleWithIcon } from '@components/others';
import { MaterialInfo } from '@modules/study-materials/components';
import {
  type ICourseModule,
  useCourseLookups,
  useCourseStore,
  useMaterialLookups,
  useMeetLookups,
  useSelectedCourse,
  useSelectorLookups,
  useTestPaperLookups,
} from '@stores';
import { reportError, successToast } from '@utils/helpers';
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
  /** The module the delete confirm is asking about, or undefined when it is closed. */
  moduleToDelete?: ICourseModule;
  isDeletingModule: boolean;
}

export const Course = ({ courseId }: IProps) => {
  const { push } = useRouter();
  const selectorStore = useSelectorLookups();
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const meetStore = useMeetLookups();
  const { setSelectedCourseId, setSelectedCourseModuleId } = selectorStore;
  const selectedCourse = useSelectedCourse();
  const {
    getCourseModulesByCourseId,
    loadCourseModules,
    createCourseModule,
    deleteCourseModule,
    getCourseById,
    loadCourse,
  } = courseStore;
  const { loadStandardsMaterials } = materialStore;
  const isLoadingMaterials = materialStore.isLoading('materials');
  const { loadTestPapers } = testPaperStore;
  const isLoadingTestPapers = testPaperStore.isLoading('testPapers');
  const { loadMeets } = meetStore;
  const isLoadingCourse = courseStore.isLoading('course');
  const [state, setState] = useSetState<IState>({
    isOpenUpsertCourseModuleModal: false,
    isOpenUpsertSessionsModal: false,
    isDeletingModule: false,
  });

  const onOpenUpsertCourseModuleModal = (id: string) => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // module is left behind.
    setSelectedCourseModuleId(createCourseModule(id)._id);
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

  const onConfirmDeleteModule = async () => {
    const courseModule = state.moduleToDelete;
    if (!courseModule) return;
    try {
      setState({ isDeletingModule: true });
      await deleteCourseModule(courseModule._id);
      successToast({ message: 'Module deleted.' });
      setState({ moduleToDelete: undefined });
    } catch (error) {
      reportError(error, 'Could not delete the module.');
    } finally {
      setState({ isDeletingModule: false });
    }
  };

  useEffect(() => {
    if (!courseId) return;
    setSelectedCourseId(courseId);
    const loadCourseData = async () => {
      // A refresh or a deep link arrives with an empty store, so the course is fetched before the
      // screen decides the id is wrong. The effect used to read the selection instead and bounced
      // straight back to the list on every reload.
      if (!useCourseStore.getState().getCourseById(courseId)) await loadCourse(courseId);
      const course = useCourseStore.getState().getCourseById(courseId);
      if (!course) {
        push('/courses');
        return;
      }
      loadCourseModules(courseId);
      loadTestPapers();
      loadStandardsMaterials(course.standards ?? []);
      loadMeets();
    };
    loadCourseData();
  }, [courseId]);

  if (!selectedCourse) return <Loader isLoading={isLoadingCourse} />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3">
        {(selectedCourse.courses ?? []).map((id: string) => {
          const course = getCourseById(id);
          const courseModules = getCourseModulesByCourseId(id);
          if (!course) return null;
          return (
            <div key={id} className="flex flex-col gap-6">
              <div className="">
                <div className="flex flex-col md:flex-row justify-between items-center gap-3 mb-4">
                  <TitleWithIcon title={`Modules for ${course?.name}`} />
                  <Button text="Add Module" onClick={() => onOpenUpsertCourseModuleModal(id)} />
                </div>
                <div>
                  {courseModules.length !== 0 && (
                    <Accordions
                      openIndexes={[0]}
                      items={courseModules.map((courseModule) => ({
                        title: (
                          <div className="flex flex-col md:flex-row justify-between w-full items-center relative">
                            <div className="flex flex-col md:flex-row text-sm font-semibold justify-start items-start space-x-4">
                              <div>{courseModule.name}</div>{' '}
                              <div className="">
                                <MaterialInfo
                                  materialIds={courseModule.materials ?? []}
                                  testPaperIds={courseModule.testPapers ?? []}
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
                                    label: 'Delete',
                                    onClick: () => setState({ moduleToDelete: courseModule }),
                                    icon: <TrashIcon weight="bold" className="w-4 h-4" />,
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
                  )}
                  {courseModules.length === 0 &&
                    (courseStore.isLoading('courseModules') || isLoadingTestPapers || isLoadingMaterials) && (
                      <Loader
                        isLoading={courseStore.isLoading('courseModules') || isLoadingTestPapers || isLoadingMaterials}
                      />
                    )}
                  {courseModules.length === 0 &&
                    !courseStore.isLoading('courseModules') &&
                    !isLoadingTestPapers &&
                    !isLoadingMaterials && (
                      <div className="flex items-center justify-center w-full h-80">
                        <BlankState
                          label="No modules yet"
                          description="A module is one day of study material, test papers and sessions."
                          action={<Button text="Add Module" onClick={() => onOpenUpsertCourseModuleModal(id)} />}
                        />
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
      <SoftConfirmModal
        isOpen={!!state.moduleToDelete}
        title="Delete module?"
        description={`"${state.moduleToDelete?.name || 'This module'}" will be removed from the course.`}
        confirmText="Delete"
        isDestructive
        isLoading={state.isDeletingModule}
        onConfirm={onConfirmDeleteModule}
        onCancel={() => setState({ moduleToDelete: undefined })}
      />
    </div>
  );
};
