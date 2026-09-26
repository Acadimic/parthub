import { type AttachmentDto } from '@repo/shared/contracts';
import { Button } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Attachment } from '@components/app/attachments';
import { Avatar } from '@components/app/avatars';
import { BlankState } from '@components/others';
import { CollectionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { useCourse } from '@hooks/course.hook';
import { type ICourseModuleItem } from '@interfaces';
import {
  ArrowsOutIcon,
  BookOpenTextIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@phosphor-icons/react';
import {
  type ICourseModule,
  type IMaterial,
  type ITestPaper,
  useCourseLookups,
  useMeetLookups,
  useResourceStore,
  useSelectedCourse,
  useSelectedMaterial,
  useSelectedTestPaper,
  useSelectorLookups,
  useUserLookups,
} from '@stores';

import { useEffect, useRef, useState } from 'react';
import { BookmarkCourse } from './BookmarkCourse';
import { Content } from './content';
import { FollowButton } from './FollowButton';
import { Followers } from './Followers';
import { LikeCourse } from './LikeCourse';
import { MarkCompleteButton } from './MarkCompleteButton';
import { ShareCourse } from './ShareCourse';
import { CourseSessions, NextSessionBanner } from '@modules/sessions';

/** An item is a material or a test paper; both carry a duration, and only one is ever set. */
const getDurationMins = (material?: IMaterial, testPaper?: ITestPaper) =>
  material?.durationMins ?? testPaper?.durationMins ?? 0;

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-xl border border-border bg-background shadow-sm', className)}>{children}</section>
);

/** The frame's toolbar, under the lesson: what the frame can show, full screen, and where next. */
const FrameToolbar = ({
  material,
  hasSelectedContent,
  selectedAttachmentKey,
  onClickContent,
  onClickAttachment,
  onFullScreen,
}: {
  material?: IMaterial;
  hasSelectedContent: boolean;
  selectedAttachmentKey?: string;
  onClickContent: () => void;
  onClickAttachment: (attachment: AttachmentDto) => void;
  /** `null` for a test paper, which has its own full-screen sitting. */
  onFullScreen: (() => void) | null;
}) => {
  const { selectedCourseId } = useSelectorLookups();
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  const items = selectedCourseId ? getCourseItems(selectedCourseId) : [];
  const index = selectedCourseId ? getSelectedItemIndex(selectedCourseId) : -1;
  const previous = items[index - 1];
  const next = items[index + 1];
  const hasSources = Boolean(material?.attachments?.length);

  return (
    <div className="flex items-center gap-2 border-t border-border px-2 py-2 md:px-3">
      {/* The lesson and its attachments, scrolling sideways when there are many. */}
      <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
        {hasSources && material ? (
          <>
            <Button
              onClick={onClickContent}
              isSecondary={!hasSelectedContent}
              className="shrink-0 px-3 py-1"
              isRound
              leftsection={<BookOpenTextIcon weight="bold" className="h-4 w-4" />}
            >
              Lesson
            </Button>
            {(material.attachments ?? []).map((attachment, attachmentIndex) => (
              <Button
                key={attachment.key}
                onClick={() => onClickAttachment(attachment)}
                isSecondary={selectedAttachmentKey !== attachment.key}
                className="shrink-0 !px-0 !py-0"
                isRound
              >
                <Attachment
                  fileName={attachment.fileName}
                  extension={attachment.fileExtension}
                  url={attachment.url}
                  index={attachmentIndex}
                />
              </Button>
            ))}
          </>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onFullScreen ? (
          <Button
            isSubtle
            aria-label="Full screen"
            className="px-2 py-1.5 text-muted-foreground"
            labelClassName="hidden md:block"
            onClick={onFullScreen}
            leftsection={<ArrowsOutIcon weight="bold" className="h-4 w-4" />}
          >
            Full screen
          </Button>
        ) : null}
        <div className="mx-1 h-5 w-px bg-border" />
        <Button
          isSubtle
          aria-label={previous ? `Previous: ${getItemName(previous)}` : 'Start of course'}
          title={previous ? getItemName(previous) : undefined}
          className="px-2 py-1.5"
          disabled={!previous}
          onClick={() => selectedCourseId && selectAdjacentItem(selectedCourseId, -1)}
          leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        />
        <span className="min-w-[3.5rem] text-center font-mono text-xs text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <Button
          isSubtle
          aria-label={next ? `Next: ${getItemName(next)}` : 'End of course'}
          title={next ? getItemName(next) : undefined}
          className="px-2 py-1.5"
          disabled={!next}
          onClick={() => selectedCourseId && selectAdjacentItem(selectedCourseId, 1)}
          leftsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
        />
      </div>
    </div>
  );
};

/** The item's display name, whichever kind it is. */
const getItemName = (item: ICourseModuleItem) => item.material?.name ?? item.testPaper?.name ?? '';

/** The lesson's name and its place in the course, unboxed above the frame. */
const LessonHeader = ({
  item,
  type,
  isCompleted,
  courseModule,
  durationMins,
}: {
  item: IMaterial | ITestPaper;
  type: string;
  isCompleted: boolean;
  courseModule: ICourseModule | undefined;
  durationMins: number;
}) => (
  <header className="flex flex-col gap-1.5 px-1">
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <Badge tone="primary" className="capitalize">
        {type}
      </Badge>
      {isCompleted ? (
        <Badge tone="success" className="gap-1">
          <CheckCircleIcon weight="fill" className="h-3 w-3" />
          Completed
        </Badge>
      ) : null}
      {courseModule ? (
        <span className="truncate text-xs text-muted-foreground">
          Module {courseModule.day} · {courseModule.name}
        </span>
      ) : null}
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <ClockIcon weight="bold" className="h-3.5 w-3.5" />
        {durationMins} min
      </span>
    </div>
    <h1 className="text-xl font-semibold leading-tight md:text-2xl">{item.name}</h1>
  </header>
);

export const CourseModuleContent = () => {
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const meetStore = useMeetLookups();
  const { getCourseModuleById, isCourseModuleItemCompleted } = useCourseLookups();
  // The like, save and follow buttons read their state from these; nothing else loads them, so a
  // reload showed every item as unliked, unsaved and unfollowed until the learner clicked.
  useLoadOnce(useResourceStore, 'reactions', (state) => state.loadReactions);
  useLoadOnce(useResourceStore, 'bookmarks', (state) => state.loadBookmarks);
  useLoadOnce(useResourceStore, 'followings', (state) => state.loadFollowings);
  const {
    selectedCourseId,
    selectedAttachment,
    selectedCourseModuleId,
    selectedContent,
    setSelectedContent,
    removeSelectedAttachment,
  } = selectorStore;
  const selectedTestPaper = useSelectedTestPaper();
  const selectedCourse = useSelectedCourse();
  const selectedMaterial = useSelectedMaterial();
  const { getUserById } = userStore;
  const { handleClickAttachment } = useAttachment();
  const { getModuleContentType } = useCourse();
  const { getMeetsByIds } = meetStore;

  const handleClickContent = () => {
    setSelectedContent(selectedMaterial?.content ?? null);
    removeSelectedAttachment();
  };

  const item: IMaterial | ITestPaper | undefined = selectedMaterial ?? selectedTestPaper;
  const createdBy = item?.createdBy ? getUserById(item.createdBy) : null;
  const topRef = useRef<HTMLDivElement>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

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

  const isCompleted = isCourseModuleItemCompleted({
    course: selectedCourseId,
    courseModule: selectedCourseModuleId,
    collectionItem: item._id,
  });

  return (
    <div ref={topRef} className="flex flex-col gap-4 md:gap-5">
      <NextSessionBanner meets={meets} />
      {/* The lesson's name and place come first, unboxed, so the frame below is the first thing
          with any weight on the screen. */}
      <LessonHeader
        item={item}
        type={moduleContentType}
        isCompleted={isCompleted}
        courseModule={courseModule}
        durationMins={getDurationMins(selectedMaterial, selectedTestPaper)}
      />

      <Card className="overflow-hidden">
        <div className="relative h-[62vh] min-h-[360px] w-full md:h-[640px]">
          <Content
            material={selectedMaterial}
            testPaper={selectedTestPaper}
            courseId={selectedCourseId}
            courseModuleId={selectedCourseModuleId}
            isFullScreen={isFullScreen}
            onFullScreenChange={setIsFullScreen}
          />
        </div>
        <FrameToolbar
          material={selectedMaterial}
          hasSelectedContent={Boolean(selectedContent)}
          selectedAttachmentKey={selectedAttachment?.key}
          onClickContent={handleClickContent}
          onClickAttachment={handleClickAttachment}
          onFullScreen={selectedMaterial ? () => setIsFullScreen(true) : null}
        />
      </Card>

      {/* One row for everything that is not the lesson: mark it done, react to it, and who made it. */}
      <Card className="flex flex-col gap-4 p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
          <div className="flex items-center gap-2 md:justify-end">
            <LikeCourse collectionItem={item} collectionRef={collectionRef} />
            <BookmarkCourse collectionItem={item._id} collectionRef={collectionRef} />
            <ShareCourse courseId={selectedCourseId} />
          </div>
        </div>
        {createdBy ? (
          <div className="flex min-w-0 items-center gap-3 border-t border-border pt-4">
            <Avatar id={createdBy._id} name={createdBy.name || 'Teacher'} avatar={createdBy.photoUrl} size={40} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">Teacher</div>
              <div className="truncate text-sm font-semibold">{createdBy.name}</div>
              <Followers user={createdBy} />
            </div>
            <div className="shrink-0">
              <FollowButton user={createdBy} />
            </div>
          </div>
        ) : null}
      </Card>

      <UpNext />

      <CourseSessions meets={meets} />
    </div>
  );
};

/**
 * The end of the lesson column: where the reading flow lands after marking a lesson done, so the
 * next lesson is one click away without scrolling back up.
 */
const UpNext = () => {
  const { selectedCourseId } = useSelectorLookups();
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  if (!selectedCourseId) return null;
  const items = getCourseItems(selectedCourseId);
  const index = getSelectedItemIndex(selectedCourseId);
  const previous = items[index - 1];
  const next = items[index + 1];
  if (!previous && !next) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {previous ? (
        <button
          type="button"
          onClick={() => selectAdjacentItem(selectedCourseId, -1)}
          className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <CaretLeftIcon weight="bold" className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0">
            <span className="block text-xxs font-semibold uppercase tracking-caps text-muted-foreground">Previous</span>
            <span className="block truncate text-sm font-semibold">{getItemName(previous)}</span>
          </span>
        </button>
      ) : (
        <div className="hidden sm:block" />
      )}
      {next ? (
        <button
          type="button"
          onClick={() => selectAdjacentItem(selectedCourseId, 1)}
          className="flex items-center justify-end gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4 text-right transition-colors hover:bg-primary/10"
        >
          <span className="min-w-0">
            <span className="block text-xxs font-semibold uppercase tracking-caps text-primary">Up next</span>
            <span className="block truncate text-sm font-semibold">{getItemName(next)}</span>
          </span>
          <CaretRightIcon weight="bold" className="h-4 w-4 shrink-0 text-primary" />
        </button>
      ) : null}
    </div>
  );
};
