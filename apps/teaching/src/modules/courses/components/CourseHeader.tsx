import { type CourseDto } from '@repo/shared/contracts';
import { PresignedImage } from '@components/app/attachments';
import {
  ClockIcon,
  FileTextIcon,
  PencilSimpleIcon,
  PlusIcon,
  RocketLaunchIcon,
  StackIcon,
  VideoCameraIcon,
} from '@phosphor-icons/react';
import { Button, SoftConfirmModal, StatTile } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { useCourseStore, useStandardLookups } from '@stores';
import { ALL } from '@repo/shared/utils';
import { reportError, successToast } from '@utils/helpers';
import { useSetState } from 'react-use';

interface IProps {
  course: CourseDto;
  moduleCount: number;
  onEdit: () => void;
  onAddModule: () => void;
}

interface IState {
  isOpenPublishConfirm: boolean;
  isPublishing: boolean;
}

/** Four figures in the order someone sizing up a course asks them: modules, papers, sessions, minutes. */
const CourseStats = ({ course, moduleCount }: { course: CourseDto; moduleCount: number }) => {
  const stats = course.stats;
  const durationMins = stats ? stats.materialsDurationMins + stats.meetsDurationMins + stats.testsDurationMins : 0;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile icon={StackIcon} value={moduleCount} label={moduleCount === 1 ? 'module' : 'modules'} />
      <StatTile icon={FileTextIcon} value={stats?.testsCount ?? 0} label="test papers" />
      <StatTile icon={VideoCameraIcon} value={stats?.meetsCount ?? 0} label="sessions" />
      <StatTile icon={ClockIcon} value={durationMins} label="minutes" />
    </div>
  );
};

/** The course's picture, or its initial when none was uploaded. */
const CourseThumbnail = ({ course }: { course: CourseDto }) => {
  const thumbnail = (course.attachments ?? [])[0]?.url;
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
      {thumbnail ? (
        <PresignedImage url={thumbnail} noOpen />
      ) : (
        <span className="text-xl font-semibold text-muted-foreground">{course.name.slice(0, 1).toUpperCase()}</span>
      )}
    </div>
  );
};

/**
 * The head of a course page: what the course is, how much is in it, and the actions a teacher comes
 * here for. The old page had no header at all — it opened straight onto "Modules for X".
 */
export const CourseHeader = ({ course, moduleCount, onEdit, onAddModule }: IProps) => {
  const { getStandardNamesText, getSubjectNamesText } = useStandardLookups();
  const setCoursePublished = useCourseStore((state) => state.setCoursePublished);
  const [state, setState] = useSetState<IState>({ isOpenPublishConfirm: false, isPublishing: false });
  const { isPublished } = course;
  const standards = getStandardNamesText(course.standards ?? []) || 'No standard';
  const subjects = getSubjectNamesText((course.subjects ?? []).filter((id) => id !== ALL)) || 'All subjects';

  const togglePublished = async () => {
    try {
      setState({ isPublishing: true });
      await setCoursePublished(course._id, !isPublished);
      successToast({ message: isPublished ? `"${course.name}" is back in draft.` : `"${course.name}" is published.` });
      setState({ isOpenPublishConfirm: false });
    } catch (error) {
      reportError(error, 'Could not change the course status.');
    } finally {
      setState({ isPublishing: false });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <CourseThumbnail course={course} />
          <div className="min-w-0 flex-1">
            <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">Course</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-semibold text-foreground sm:truncate">{course.name}</h1>
              <Badge tone={isPublished ? 'success' : 'neutral'} appearance="soft" withDot>
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {standards} · {subjects}
            </p>
            {course.description ? (
              <p className="mt-1.5 line-clamp-2 text-sm text-foreground/80">{course.description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            isSecondary
            text="Edit"
            leftsection={<PencilSimpleIcon className="h-4 w-4" weight="bold" />}
            onClick={onEdit}
          />
          <Button
            isSecondary
            text="Add module"
            leftsection={<PlusIcon className="h-4 w-4" weight="bold" />}
            onClick={onAddModule}
          />
          <Button
            text={isPublished ? 'Unpublish' : 'Publish'}
            isSecondary={isPublished}
            leftsection={isPublished ? undefined : <RocketLaunchIcon className="h-4 w-4" weight="bold" />}
            onClick={() => setState({ isOpenPublishConfirm: true })}
          />
        </div>
      </div>
      <CourseStats course={course} moduleCount={moduleCount} />
      <SoftConfirmModal
        title={isPublished ? 'Unpublish this course?' : 'Publish this course?'}
        description={
          isPublished
            ? 'Learners will no longer be able to see or enrol in it. Its modules and sessions are kept.'
            : 'Learners in the course’s standards will be able to see it and enrol.'
        }
        isOpen={state.isOpenPublishConfirm}
        isLoading={state.isPublishing}
        confirmText={isPublished ? 'Unpublish' : 'Publish'}
        onCancel={() => !state.isPublishing && setState({ isOpenPublishConfirm: false })}
        onConfirm={togglePublished}
      />
    </div>
  );
};
