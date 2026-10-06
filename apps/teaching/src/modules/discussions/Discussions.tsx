import { Select } from '@components/app/selects';
import { BookOpenTextIcon, ChatsCircleIcon, XIcon } from '@phosphor-icons/react';
import { CommentInboxStatus } from '@repo/shared/enums';
import { type CourseCommentDto } from '@repo/shared/contracts';
import { ALL } from '@repo/shared/utils';
import { Button } from '@repo/ui/app';
import { Card } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { type CommentScope, useCourseLookups, useDiscussionLookups, useDiscussionStore } from '@stores';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ThreadList, useSourceName } from './components';

/** A lesson or test paper the list is narrowed to, picked from a thread's chip. */
interface ILessonFilter {
  material: string | null;
  testPaper: string | null;
}

const NO_LESSON: ILessonFilter = { material: null, testPaper: null };

/**
 * The teacher's inbox: comments and doubts from every course the organization owns, newest first,
 * narrowed by answered state, course and lesson. Replies and removals happen in place.
 */
export const Discussions = () => {
  const router = useRouter();
  const { getCourses, shouldLoad, loadCourses } = useCourseLookups();
  const { needsReplyCount } = useDiscussionLookups();
  const getName = useSourceName();
  const [status, setStatus] = useState(CommentInboxStatus.NEEDS_REPLY);
  const [courseId, setCourseId] = useState<string>(ALL);
  const [lesson, setLesson] = useState<ILessonFilter>(NO_LESSON);

  const scope: CommentScope = {
    kind: 'inbox',
    filters: {
      status,
      ...(courseId === ALL ? {} : { course: courseId }),
      ...(lesson.material ? { material: lesson.material } : {}),
      ...(lesson.testPaper ? { testPaper: lesson.testPaper } : {}),
    },
  };
  const load = () => useDiscussionStore.getState().loadComments(scope);

  // A link from a course page or the home page may name the course to open on.
  useEffect(() => {
    if (typeof router.query.course === 'string') setCourseId(router.query.course);
  }, [router.query.course]);

  useEffect(() => {
    if (shouldLoad('courses')) loadCourses();
    useDiscussionStore.getState().loadNeedsReplyCount();
  }, []);

  useEffect(() => {
    load();
  }, [JSON.stringify(scope)]);

  const selectLesson = (comment: CourseCommentDto) => {
    setCourseId(comment.course);
    setLesson({ material: comment.material ?? null, testPaper: comment.testPaper ?? null });
  };

  const courseItems = [
    { label: 'All courses', value: ALL },
    ...getCourses()
      .filter((course) => !course.isNew)
      .map((course) => ({ label: course.name, value: course._id })),
  ];
  const lessonName = getName(lesson.material ?? lesson.testPaper);
  const statuses = [
    { key: CommentInboxStatus.NEEDS_REPLY, label: 'Needs reply', count: needsReplyCount },
    { key: CommentInboxStatus.ALL, label: 'All comments', count: 0 },
  ];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 pb-16">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ChatsCircleIcon weight="fill" className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-lg font-semibold">Discussions</h1>
          <p className="text-xs text-muted-foreground">
            Questions and comments from learners across your courses. Answer them here, or remove what does not belong.
          </p>
        </div>
      </div>
      <Card className="flex flex-col gap-3 rounded-lg border px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Which comments">
            {statuses.map((item) => (
              <Button
                key={item.key}
                role="tab"
                aria-selected={status === item.key}
                isSubtle={status !== item.key}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs',
                  status === item.key ? 'shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
                text={item.count ? `${item.label} · ${item.count}` : item.label}
                onClick={() => setStatus(item.key)}
              />
            ))}
          </div>
          <div className="ml-auto w-full sm:w-64">
            <Select
              items={courseItems}
              values={[courseId]}
              onChange={(values) => {
                setCourseId(values[0]?.value ?? ALL);
                setLesson(NO_LESSON);
              }}
              isSingleSelect
              noSort
              placeholder="All courses"
            />
          </div>
        </div>
        {lessonName ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            Showing comments on
            <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary">
              <BookOpenTextIcon weight="bold" className="h-3.5 w-3.5" />
              {lessonName}
              <button type="button" aria-label="Show every lesson" onClick={() => setLesson(NO_LESSON)}>
                <XIcon weight="bold" className="h-3 w-3" />
              </button>
            </span>
          </div>
        ) : null}
      </Card>
      <Card className="rounded-lg border px-4">
        <ThreadList
          isShowingCourse={courseId === ALL}
          onSelectLesson={selectLesson}
          emptyLabel={status === CommentInboxStatus.NEEDS_REPLY ? 'All caught up' : 'No comments yet'}
          emptyDescription={
            status === CommentInboxStatus.NEEDS_REPLY
              ? 'Every question from your learners has an answer.'
              : 'Comments learners post on your courses will appear here.'
          }
          onRetry={load}
        />
      </Card>
    </div>
  );
};
