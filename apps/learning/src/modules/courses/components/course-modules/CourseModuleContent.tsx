import { Button, Tooltip } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { ContentKinds, ContentTypeBadge, type IContentKind, getMaterialKinds } from '@components/app/badges';
import { BlankState } from '@components/others';
import { ReaderProgress } from '@components/tools';
import { CollectionType, type ModuleContentType } from '@enums';
import { useCourse } from '@hooks/course.hook';
import { ArrowsOutIcon, CaretRightIcon, CheckCircleIcon, ClockIcon } from '@phosphor-icons/react';
import {
  type ICourseModule,
  type IMaterial,
  type ITestPaper,
  useCourseLookups,
  useCourseStore,
  useMeetLookups,
  useResourceStore,
  useSelectedCourse,
  useSelectedMaterial,
  useSelectedTestPaper,
  useSelectorLookups,
} from '@stores';

import { useEffect, useRef, useState } from 'react';
import { BookmarkCourse } from './BookmarkCourse';
import { Content } from './content';
import { LikeCourse } from './LikeCourse';
import { MarkCompleteButton } from './MarkCompleteButton';
import { AskDoubtButton, LessonMoreMenu } from './LessonActions';
import { LessonPager } from './LessonPager';
import { NextSessionBanner } from '@modules/sessions';

/** An item is a material or a test paper; both carry a duration, and only one is ever set. */
const getDurationMins = (material?: IMaterial, testPaper?: ITestPaper) =>
  material?.durationMins ?? testPaper?.durationMins ?? 0;

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-xl border border-border bg-background shadow-sm', className)}>{children}</section>
);

/**
 * The frame's footer, two lines: the one Previous and Next over the lesson, then everything else
 * a learner does with it — marking it done, reacting, the ⋯ menu and full screen. The lesson's
 * sources have their own ⋯ in the progress strip above the content.
 */
const FrameToolbar = ({
  material,
  onFullScreen,
  actions,
}: {
  /** The lesson in the frame; undefined for a test paper, whose pager moves a lesson at a time. */
  material: IMaterial | undefined;
  onFullScreen: () => void;
  /** Mark complete and the reactions, on the second line's left. */
  actions: React.ReactNode;
}) => (
  <div className="bg-muted/20">
    <LessonPager material={material} />
    <div className="flex items-center gap-2 border-t border-border px-2 py-1.5 md:px-3">
      {actions}
      <div className="ml-auto flex shrink-0 items-center">
        <Tooltip title="Full screen">
          <Button
            isRound
            isSubtle
            aria-label="Full screen"
            className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
            onClick={onFullScreen}
            leftsection={<ArrowsOutIcon weight="bold" className="h-4 w-4" />}
          />
        </Tooltip>
      </div>
    </div>
  </div>
);

/**
 * One quiet line above the frame, read like a breadcrumb: the module, then the lesson's name
 * beside it, with its facts on the right. Nothing above the content is large enough to compete.
 */
const LessonHeader = ({
  item,
  type,
  kinds,
  isCompleted,
  courseModule,
  durationMins,
}: {
  item: IMaterial | ITestPaper;
  type: ModuleContentType;
  /** What the lesson is made of; empty for a test paper. */
  kinds: IContentKind[];
  isCompleted: boolean;
  courseModule: ICourseModule | undefined;
  durationMins: number;
}) => (
  <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-1">
    <div className="flex min-w-0 flex-1 items-center gap-1.5">
      {courseModule ? (
        <>
          <span className="truncate text-xs text-muted-foreground" title={courseModule.name}>
            <span className="font-semibold text-primary">Module {courseModule.day}</span> · {courseModule.name}
          </span>
          <CaretRightIcon weight="bold" className="h-3 w-3 shrink-0 text-muted-foreground" />
        </>
      ) : null}
      <h1 className="truncate text-sm font-semibold md:text-base" title={item.name}>
        {item.name}
      </h1>
    </div>
    {/* One row at one spacing: the kind chips, the tick when done, the duration, all 24px tall. */}
    <div className="flex shrink-0 items-center gap-1.5">
      {kinds.length > 1 ? <ContentKinds kinds={kinds} size="sm" /> : <ContentTypeBadge type={type} size="sm" />}
      {/* Done: a tile the size of the kind chips beside it, the word for screen readers only. The
          tooltip sits inside, on the icon — its inline wrapper around the tile would add line
          height and drop the tile a pixel below its neighbours. */}
      {isCompleted ? (
        <Badge tone="success" className="h-6 w-6 justify-center p-0">
          <Tooltip title="Completed">
            <CheckCircleIcon weight="fill" className="h-4 w-4" />
          </Tooltip>
          <span className="sr-only">Completed</span>
        </Badge>
      ) : null}
      <Badge tone="warning" appearance="soft" className="h-6 gap-1">
        <ClockIcon weight="bold" className="h-3 w-3" />
        {durationMins} min
      </Badge>
    </div>
  </header>
);

export const CourseModuleContent = () => {
  const selectorStore = useSelectorLookups();
  const meetStore = useMeetLookups();
  const { getCourseModuleById, isCourseModuleItemCompleted } = useCourseLookups();
  // The like and save buttons read their state from these; nothing else loads them, so a reload
  // showed every item as unliked and unsaved until the learner clicked.
  useLoadOnce(useResourceStore, 'reactions', (state) => state.loadReactions);
  useLoadOnce(useResourceStore, 'bookmarks', (state) => state.loadBookmarks);
  const { selectedCourseId, selectedCourseModuleId, selectedUserId } = selectorStore;
  const selectedTestPaper = useSelectedTestPaper();
  const selectedCourse = useSelectedCourse();
  const selectedMaterial = useSelectedMaterial();
  const { getModuleContentType } = useCourse();
  const { getMeetsByIds } = meetStore;

  // Kept in the browser per learner, so it is read back once the learner is known.
  useEffect(() => {
    useCourseStore.getState().restoreViewedLessonPages();
  }, [selectedUserId]);

  const item: IMaterial | ITestPaper | undefined = selectedMaterial ?? selectedTestPaper;
  const topRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // The lesson's full screen takes the browser's too. Browsers allow that only from a tap, so it is
  // asked for here rather than in an effect, and a phone without the API keeps the in-page view.
  const changeFullScreen = (next: boolean) => {
    setIsFullScreen(next);
    if (next) document.documentElement.requestFullscreen?.().catch(() => undefined);
    else if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
  };

  // Leaving the browser's full screen by its own means (Escape, its control) leaves the lesson's.
  useEffect(() => {
    const onChange = () => !document.fullscreenElement && setIsFullScreen(false);
    document.addEventListener('fullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => undefined);
    };
  }, []);

  // A new lesson starts at its top. The column scrolls, not the page, so the nearest scroller is
  // the one to reset.
  useEffect(() => {
    topRef.current?.closest('.overflow-y-auto')?.scrollTo({ top: 0 });
  }, [item?._id]);

  if (!selectedCourse || !selectedCourseId) return null;

  if (!item) {
    return (
      <Card>
        <BlankState
          className="py-16"
          label="Nothing to learn yet"
          description="This course has no lessons or tests published. Check back once your teacher adds content."
        />
      </Card>
    );
  }

  const moduleContentType = getModuleContentType(selectedMaterial, selectedTestPaper);
  const collectionRef = selectedMaterial ? CollectionType.MATERIAL : CollectionType.TEST_PAPER;
  const courseModule = getCourseModuleById(selectedCourseModuleId);
  const meets = getMeetsByIds(selectedCourse.meets ?? []);

  const lessonProps = {
    courseId: selectedCourseId,
    courseModuleId: selectedCourseModuleId,
    material: selectedMaterial,
    testPaper: selectedTestPaper,
  };

  const isCompleted = isCourseModuleItemCompleted({
    course: selectedCourseId,
    courseModule: selectedCourseModuleId,
    collectionItem: item._id,
  });

  return (
    <div ref={topRef} className="flex flex-1 flex-col gap-4 md:gap-5">
      <NextSessionBanner meets={meets} />
      {/* One small line above the frame, so the content is the first thing with any weight. */}
      <LessonHeader
        item={item}
        type={moduleContentType}
        kinds={selectedMaterial ? getMaterialKinds(selectedMaterial) : []}
        isCompleted={isCompleted}
        courseModule={courseModule}
        durationMins={getDurationMins(selectedMaterial, selectedTestPaper)}
      />

      {/* The lesson takes the height left under the header and any banner, so the column itself
          never scrolls: only the content inside the frame does. */}
      <Card className="flex flex-1 flex-col overflow-hidden">
        {selectedMaterial ? <ReaderProgress material={selectedMaterial} /> : null}
        <div className="relative min-h-[240px] w-full flex-1">
          <div className="absolute inset-0">
            <Content
              material={selectedMaterial}
              testPaper={selectedTestPaper}
              courseId={selectedCourseId}
              courseModuleId={selectedCourseModuleId}
              isFullScreen={isFullScreen}
              onFullScreenChange={changeFullScreen}
            />
          </div>
        </div>
        <FrameToolbar
          material={selectedMaterial}
          onFullScreen={() => changeFullScreen(true)}
          actions={
            <>
              <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
              <AskDoubtButton />
              <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-1">
                <LikeCourse collectionItem={item} collectionRef={collectionRef} />
                <BookmarkCourse collectionItem={item._id} collectionRef={collectionRef} />
                <LessonMoreMenu {...lessonProps} />
              </div>
            </>
          }
        />
      </Card>
    </div>
  );
};
