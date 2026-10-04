import { type AttachmentDto } from '@repo/shared/contracts';
import { Button, Tooltip } from '@repo/ui/app';
import { useLoadOnce } from '@repo/ui/hooks';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { Attachment } from '@components/app/attachments';
import { ContentKinds, ContentTypeBadge, type IContentKind, getMaterialKinds } from '@components/app/badges';
import { BlankState } from '@components/others';
import { CollectionType, type ModuleContentType } from '@enums';
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
} from '@stores';

import { useEffect, useRef, useState } from 'react';
import { BookmarkCourse } from './BookmarkCourse';
import { Content } from './content';
import { LikeCourse } from './LikeCourse';
import { MarkCompleteButton } from './MarkCompleteButton';
import { PrintCourse } from './PrintCourse';
import { ShareCourse } from './ShareCourse';
import { NextSessionBanner } from '@modules/sessions';

/** An item is a material or a test paper; both carry a duration, and only one is ever set. */
const getDurationMins = (material?: IMaterial, testPaper?: ITestPaper) =>
  material?.durationMins ?? testPaper?.durationMins ?? 0;

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-xl border border-border bg-background shadow-sm', className)}>{children}</section>
);

/**
 * The frame's footer, so everything a learner does with the lesson sits under it in view: the
 * sources the frame can show (only when there are any), then marking it done, reacting, full
 * screen, and the way to the next lesson.
 */
const FrameToolbar = ({
  material,
  hasSelectedContent,
  selectedAttachmentKey,
  onClickContent,
  onClickAttachment,
  onFullScreen,
  actions,
}: {
  material?: IMaterial;
  hasSelectedContent: boolean;
  selectedAttachmentKey?: string;
  onClickContent: () => void;
  onClickAttachment: (attachment: AttachmentDto) => void;
  /** `null` for a test paper, which has its own full-screen sitting. */
  onFullScreen: (() => void) | null;
  /** Mark complete and the reactions, on the footer's left. */
  actions: React.ReactNode;
}) => {
  const { selectedCourseId } = useSelectorLookups();
  const attachments = material?.attachments ?? [];

  return (
    <div className="border-t border-border">
      {/* The lesson and its attachments, scrolling sideways when there are many. */}
      {attachments.length ? (
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b border-border px-2 py-1.5 md:px-3">
          <Button
            onClick={onClickContent}
            isSecondary={!hasSelectedContent}
            className="shrink-0 px-3 py-1"
            isRound
            leftsection={<BookOpenTextIcon weight="bold" className="h-4 w-4" />}
          >
            Lesson
          </Button>
          {attachments.map((attachment, attachmentIndex) => (
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
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2 px-2 py-2 md:px-3">
        {actions}
        {/* A zero basis lets this end share the actions' line and shrink the next title to fit. */}
        <div className="flex min-w-0 flex-1 basis-0 items-center justify-end gap-1">
          {onFullScreen ? (
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
          ) : null}
          {selectedCourseId ? <LessonPager courseId={selectedCourseId} /> : null}
        </div>
      </div>
    </div>
  );
};

/** The item's display name, whichever kind it is. */
const getItemName = (item: ICourseModuleItem) => item.material?.name ?? item.testPaper?.name ?? '';

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
    <div className="flex shrink-0 items-center gap-x-3">
      {kinds.length > 1 ? <ContentKinds kinds={kinds} size="sm" /> : <ContentTypeBadge type={type} size="sm" />}
      {isCompleted ? (
        <Badge tone="success" className="gap-1">
          <CheckCircleIcon weight="fill" className="h-3 w-3" />
          Completed
        </Badge>
      ) : null}
      <Badge tone="warning" appearance="soft" className="gap-1">
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
  const { handleClickAttachment } = useAttachment();
  const { getModuleContentType } = useCourse();
  const { getMeetsByIds } = meetStore;

  const handleClickContent = () => {
    setSelectedContent(selectedMaterial?.content ?? null);
    removeSelectedAttachment();
  };

  const item: IMaterial | ITestPaper | undefined = selectedMaterial ?? selectedTestPaper;
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
        <div className="relative min-h-[240px] w-full flex-1">
          <div className="absolute inset-0">
            <Content
              material={selectedMaterial}
              testPaper={selectedTestPaper}
              courseId={selectedCourseId}
              courseModuleId={selectedCourseModuleId}
              isFullScreen={isFullScreen}
              onFullScreenChange={setIsFullScreen}
            />
          </div>
        </div>
        <FrameToolbar
          material={selectedMaterial}
          hasSelectedContent={Boolean(selectedContent)}
          selectedAttachmentKey={selectedAttachment?.key}
          onClickContent={handleClickContent}
          onClickAttachment={handleClickAttachment}
          onFullScreen={selectedMaterial ? () => setIsFullScreen(true) : null}
          actions={
            <>
              <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
              <div className="flex items-center gap-0.5 rounded-full bg-muted/60 p-1">
                <LikeCourse collectionItem={item} collectionRef={collectionRef} />
                <BookmarkCourse collectionItem={item._id} collectionRef={collectionRef} />
                <ShareCourse courseId={selectedCourseId} appearance="subtle" />
                <PrintCourse
                  courseId={selectedCourseId}
                  courseModuleId={selectedCourseModuleId}
                  testPaperId={selectedTestPaper?._id ?? null}
                />
              </div>
            </>
          }
        />
      </Card>
    </div>
  );
};

/**
 * Previous as an icon, the position in the course, and the next lesson named, so after marking a
 * lesson done the next one is a click away.
 */
const LessonPager = ({ courseId }: { courseId: string }) => {
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  const items = getCourseItems(courseId);
  const index = getSelectedItemIndex(courseId);
  const previous = items[index - 1];
  const next = items[index + 1];

  return (
    <>
      <div className="mx-1 hidden h-5 w-px bg-border sm:block" />
      <Tooltip title={previous ? `Previous: ${getItemName(previous)}` : 'Start of course'}>
        <Button
          isRound
          isSubtle
          aria-label={previous ? `Previous: ${getItemName(previous)}` : 'Start of course'}
          disabled={!previous}
          className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-foreground"
          onClick={() => selectAdjacentItem(courseId, -1)}
          leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        />
      </Tooltip>
      <span className="hidden shrink-0 px-1 font-mono text-xs text-muted-foreground sm:inline">
        {index + 1}/{items.length}
      </span>
      {next ? (
        // The tint sits on a wrapper: a subtle button's own background is transparent and wins.
        <span className="ml-1 flex min-w-0 max-w-[20rem] rounded-full bg-primary/[0.12] ring-1 ring-primary/20 transition-colors hover:bg-primary/20">
          <Button
            isRound
            isSubtle
            aria-label={`Next: ${getItemName(next)}`}
            className="h-9 min-w-0 pl-4 pr-3 text-primary [&>div]:min-w-0"
            labelClassName="min-w-0 truncate"
            onClick={() => selectAdjacentItem(courseId, 1)}
            rightsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
          >
            <span className="hidden text-xs font-semibold uppercase tracking-caps opacity-70 sm:inline">Next</span>
            <span className="mx-1.5 hidden opacity-40 sm:inline">·</span>
            <span className="text-sm font-semibold">{getItemName(next)}</span>
          </Button>
        </span>
      ) : (
        <span className="ml-1 shrink-0 text-xs font-medium text-muted-foreground">End of course</span>
      )}
    </>
  );
};
