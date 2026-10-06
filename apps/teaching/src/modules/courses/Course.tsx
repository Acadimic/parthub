import { type CourseDto, type MeetDto } from '@repo/shared/contracts';
import { MeetItem } from '@components/common';
import { BlankState } from '@components/others';
import { PlusIcon } from '@phosphor-icons/react';
import { Button, Card, SoftConfirmModal, ExpandAllButton } from '@repo/ui/app';
import { useExpandedIds } from '@repo/ui/hooks';
import { Badge } from '@repo/ui/core';
import {
  type ICourseModule,
  useCourseLookups,
  useCourseStore,
  useMaterialLookups,
  useMeetLookups,
  useMeetStore,
  useSelectedCourse,
  useSelectorLookups,
  useTestPaperLookups,
  useTestPaperStore,
} from '@stores';
import { reportError, successToast } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useSetState } from 'react-use';
import {
  CourseHeader,
  CourseModuleCard,
  CourseSkeleton,
  UpsertCourseModal,
  UpsertCourseModuleModal,
  UpsertSessionsModal,
  AiCourseModulesDrawer,
  AiCourseSessionsDrawer,
  AiCourseReviewDrawer,
  CourseGenerationPanel,
} from './components';

interface IProps {
  courseId: string;
}

interface IState {
  isOpenUpsertCourseModuleModal: boolean;
  isOpenUpsertSessionsModal: boolean;
  isOpenEditCourse: boolean;
  isOpenContent: boolean;
  isOpenSessions: boolean;
  isOpenReview: boolean;
  /** The module the delete confirm is asking about, or undefined when it is closed. */
  moduleToDelete?: ICourseModule;
  isDeletingModule: boolean;
}

/**
 * The courses whose modules a course page shows. A course lists itself in `courses`, which is how a
 * bundle is represented; the course itself stands in when the list is somehow empty.
 */
const moduleCourseIds = (course: CourseDto | undefined): string[] => {
  if (!course) return [];
  return course.courses?.length ? course.courses : [course._id];
};

/** The course's live sessions, with their joining links, or a note that there are none yet. */
const SessionsSection = ({ meets, onAdd }: { meets: MeetDto[]; onAdd: () => void }) => (
  <section className="rounded-lg border border-border bg-background">
    <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
      <div className="flex min-w-[10rem] flex-1 items-center gap-2">
        <h2 className="text-sm font-semibold text-foreground">Sessions</h2>
        <Badge tone="neutral" appearance="soft" className="whitespace-nowrap px-1.5 py-0 text-xxs">
          {meets.length} {meets.length === 1 ? 'session' : 'sessions'}
        </Badge>
      </div>
      <div className="ml-auto">
        <Button
          isSecondary
          leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
          text="Add session"
          onClick={onAdd}
        />
      </div>
    </header>
    <div className="flex flex-col gap-2 p-3">
      {meets.length ? (
        meets.map((meet) => <MeetItem key={meet._id} meet={meet} />)
      ) : (
        <BlankState
          label="No sessions yet"
          description="Live sessions attached to this course show here, with their joining links."
          className="py-8"
        />
      )}
    </div>
  </section>
);

export const Course = ({ courseId }: IProps) => {
  const { push } = useRouter();
  const { setSelectedCourseId, setSelectedCourseModuleId } = useSelectorLookups();
  const courseStore = useCourseLookups();
  const materialStore = useMaterialLookups();
  const testPaperStore = useTestPaperLookups();
  const meetStore = useMeetLookups();
  const selectedCourse = useSelectedCourse();
  const { getCourseModulesByCourseId, loadCourseModules, createCourseModule, deleteCourseModule, loadCourse } =
    courseStore;
  const isLoadingModules =
    courseStore.isLoading('courseModules') ||
    testPaperStore.isLoading('testPapers') ||
    materialStore.isLoading('materials');
  const [state, setState] = useSetState<IState>({
    isOpenUpsertCourseModuleModal: false,
    isOpenUpsertSessionsModal: false,
    isOpenEditCourse: false,
    isOpenContent: false,
    isOpenSessions: false,
    isOpenReview: false,
    isDeletingModule: false,
  });

  const courseIds = moduleCourseIds(selectedCourse);
  const courseModules = courseIds.flatMap((id) => getCourseModulesByCourseId(id));
  const { isExpanded, isAllExpanded, toggle, toggleAll } = useExpandedIds(
    courseModules.map((courseModule) => courseModule._id),
  );
  const meets = meetStore.getMeetsByIds(selectedCourse?.meets ?? []);

  const onOpenUpsertCourseModuleModal = () => {
    // Select the draft the store just made: without this the drawer opens on nothing and the blank
    // module is left behind.
    setSelectedCourseModuleId(createCourseModule(courseIds[0] ?? courseId)._id);
    setState({ isOpenUpsertCourseModuleModal: true });
  };

  const onEditCourseModule = (courseModule: ICourseModule) => {
    setSelectedCourseModuleId(courseModule._id);
    setState({ isOpenUpsertCourseModuleModal: true });
  };

  const onCloseEditCourse = () => {
    setState({ isOpenEditCourse: false });
    // The course drawer clears the selection on its way out, and this page reads from it.
    setSelectedCourseId(courseId);
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
      // Always read by id: the list row lacks the syllabus the course review checks against, and a
      // refresh or a deep link arrives with an empty store. A list row, when there is one, shows
      // meanwhile; the effect used to read the selection instead and bounced back on every reload.
      await loadCourse(courseId);
      const course = useCourseStore.getState().getCourseById(courseId);
      if (!course) {
        push('/courses');
        return;
      }
      loadCourseModules(courseId);
      // Org-wide lists, loaded once per session; the course's own modules and lessons refresh per visit.
      if (useTestPaperStore.getState().shouldLoad('testPapers')) testPaperStore.loadTestPapers();
      materialStore.loadStandardsMaterials(course.standards ?? []);
      if (useMeetStore.getState().shouldLoad('meets')) meetStore.loadMeets();
    };
    loadCourseData();
  }, [courseId]);

  if (!selectedCourse) return <CourseSkeleton />;

  // Lessons and quizzes an AI plan still owes, across every module.
  const pendingCount = courseModules.reduce(
    (sum, courseModule) =>
      sum + (courseModule.pending ?? []).filter((work) => work.status !== 'done' && work.status !== 'skipped').length,
    0,
  );

  const renderModules = () => {
    if (!courseModules.length && isLoadingModules) return <CourseSkeleton />;
    if (!courseModules.length) {
      return (
        <BlankState
          label="No modules yet"
          description="A module is one day of study material, test papers and sessions. Add the first one to start building the course."
          className="rounded-lg border border-border bg-background py-12"
          action={
            <Button
              leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
              text="Add module"
              onClick={onOpenUpsertCourseModuleModal}
            />
          }
        />
      );
    }
    return (
      <section className="rounded-lg border border-border bg-background">
        <header className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-[10rem] flex-1 items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">Modules</h2>
            <Badge tone="neutral" appearance="soft" className="whitespace-nowrap px-1.5 py-0 text-xxs">
              {courseModules.length} {courseModules.length === 1 ? 'module' : 'modules'}
            </Badge>
            {pendingCount ? (
              <Badge tone="warning" appearance="soft" className="whitespace-nowrap px-1.5 py-0 text-xxs">
                {pendingCount} {pendingCount === 1 ? 'item' : 'items'} to generate
              </Badge>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {courseModules.length > 1 ? <ExpandAllButton isAllExpanded={isAllExpanded} onClick={toggleAll} /> : null}
            <Button
              isSecondary
              leftsection={<PlusIcon weight="bold" className="h-4 w-4" />}
              text="Add module"
              onClick={onOpenUpsertCourseModuleModal}
            />
          </div>
        </header>
        <div className="flex flex-col gap-2 p-3">
          {courseModules.map((courseModule, index) => (
            <CourseModuleCard
              key={courseModule._id}
              courseModule={courseModule}
              number={index + 1}
              isExpanded={isExpanded(courseModule._id)}
              onToggle={() => toggle(courseModule._id)}
              onEdit={() => onEditCourseModule(courseModule)}
              onDelete={() => setState({ moduleToDelete: courseModule })}
            />
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <Card className="px-5 py-5 border rounded-lg">
        <CourseHeader
          course={selectedCourse}
          moduleCount={courseModules.length}
          onEdit={() => setState({ isOpenEditCourse: true })}
          onAddModule={onOpenUpsertCourseModuleModal}
        />
      </Card>
      <CourseGenerationPanel
        modules={courseModules}
        onGenerateContent={() => setState({ isOpenContent: true })}
        onScheduleSessions={() => setState({ isOpenSessions: true })}
        onReview={() => setState({ isOpenReview: true })}
      />
      {renderModules()}
      <SessionsSection meets={meets} onAdd={() => setState({ isOpenUpsertSessionsModal: true })} />
      <AiCourseModulesDrawer
        isOpen={state.isOpenContent}
        onClose={() => setState({ isOpenContent: false })}
        course={selectedCourse}
        modules={courseModules}
      />
      <AiCourseSessionsDrawer
        isOpen={state.isOpenSessions}
        onClose={() => setState({ isOpenSessions: false })}
        course={selectedCourse}
        modules={courseModules}
      />
      <AiCourseReviewDrawer
        isOpen={state.isOpenReview}
        onClose={() => setState({ isOpenReview: false })}
        course={selectedCourse}
        modules={courseModules}
      />
      <UpsertCourseModuleModal
        isOpen={state.isOpenUpsertCourseModuleModal}
        onClose={() => setState({ isOpenUpsertCourseModuleModal: false })}
      />
      <UpsertSessionsModal
        isOpen={state.isOpenUpsertSessionsModal}
        onClose={() => setState({ isOpenUpsertSessionsModal: false })}
      />
      {/* Mounted only while open: its close clears the course selection this page depends on. */}
      {state.isOpenEditCourse ? <UpsertCourseModal isOpen onClose={onCloseEditCourse} /> : null}
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
