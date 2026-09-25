import { type AttachmentDto } from '@repo/shared/contracts';
import { Button, SimpleAccordions } from '@repo/ui/app';
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
import { BookOpenTextIcon, CaretLeftIcon, CaretRightIcon, ClockIcon } from '@phosphor-icons/react';
import {
  type IMaterial,
  type ITestPaper,
  type IUser,
  useCourseLookups,
  useMeetLookups,
  useResourceStore,
  useSelectedCourse,
  useSelectedMaterial,
  useSelectedTestPaper,
  useSelectorLookups,
  useUserLookups,
} from '@stores';
import { getPlural } from '@utils/helpers';
import { useEffect, useRef } from 'react';
import { BookmarkCourse } from './BookmarkCourse';
import { Content } from './content';
import { FollowButton } from './FollowButton';
import { Followers } from './Followers';
import { LikeCourse } from './LikeCourse';
import { MarkCompleteButton } from './MarkCompleteButton';
import { Sessions } from './Sessions';
import { ShareCourse } from './ShareCourse';

/** An item is a material or a test paper; both carry a duration, and only one is ever set. */
const getDurationMins = (material?: IMaterial, testPaper?: ITestPaper) =>
  material?.durationMins ?? testPaper?.durationMins ?? 0;

const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <section className={cn('rounded-xl border border-border bg-background shadow-sm', className)}>{children}</section>
);

/**
 * What the frame can show for a material: the written lesson, then each attachment. A test paper
 * has one thing to show, so the strip is left out.
 */
const SourceStrip = ({
  material,
  hasSelectedContent,
  selectedAttachmentKey,
  onClickContent,
  onClickAttachment,
}: {
  material?: IMaterial;
  hasSelectedContent: boolean;
  selectedAttachmentKey?: string;
  onClickContent: () => void;
  onClickAttachment: (attachment: AttachmentDto) => void;
}) => {
  if (!material?.attachments?.length) return null;
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-border px-3 py-2 no-scrollbar">
      <Button
        onClick={onClickContent}
        isSecondary={!hasSelectedContent}
        className="shrink-0 px-3 py-1"
        isRound
        leftsection={<BookOpenTextIcon weight="bold" className="h-4 w-4" />}
      >
        Lesson
      </Button>
      {material.attachments.map((attachment, index) => (
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
            index={index}
          />
        </Button>
      ))}
    </div>
  );
};

/** Who published the item, and the like / save / share actions for it. */
const ContentActionsRow = ({
  createdBy,
  item,
  isMaterial,
  courseId,
}: {
  createdBy?: IUser | null;
  item: IMaterial | ITestPaper;
  isMaterial: boolean;
  courseId: string;
}) => {
  const collectionRef = isMaterial ? CollectionType.MATERIAL : CollectionType.TEST_PAPER;
  // The buttons below read their state from these; nothing else loads them, so a reload showed
  // every item as unliked, unsaved and unfollowed until the learner clicked.
  useLoadOnce(useResourceStore, 'reactions', (state) => state.loadReactions);
  useLoadOnce(useResourceStore, 'bookmarks', (state) => state.loadBookmarks);
  useLoadOnce(useResourceStore, 'followings', (state) => state.loadFollowings);
  return (
    <div className="flex w-full flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
      {createdBy ? (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar id={createdBy._id} name={createdBy.name || 'Teacher'} avatar={createdBy.photoUrl} size={44} />
          <div className="min-w-0">
            <div className="text-xs font-semibold uppercase tracking-caps text-muted-foreground">Teacher</div>
            <div className="truncate text-sm font-semibold">{createdBy.name}</div>
            <Followers user={createdBy} />
          </div>
          <div className="ml-2 shrink-0">
            <FollowButton user={createdBy} />
          </div>
        </div>
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2 md:justify-end">
        <LikeCourse collectionItem={item} collectionRef={collectionRef} />
        <BookmarkCourse collectionItem={item._id} collectionRef={collectionRef} />
        <ShareCourse courseId={courseId} />
      </div>
    </div>
  );
};

export const CourseModuleContent = () => {
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const meetStore = useMeetLookups();
  const { getCourseModuleById } = useCourseLookups();
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
  const courseModule = getCourseModuleById(selectedCourseModuleId);
  const meets = getMeetsByIds(selectedCourse.meets ?? []);

  return (
    <div ref={topRef} className="flex flex-col gap-4 md:gap-5">
      <Card className="overflow-hidden">
        <SourceStrip
          material={selectedMaterial}
          hasSelectedContent={Boolean(selectedContent)}
          selectedAttachmentKey={selectedAttachment?.key}
          onClickContent={handleClickContent}
          onClickAttachment={handleClickAttachment}
        />
        <div className="relative h-[55vh] min-h-[320px] w-full md:h-[560px]">
          <Content
            material={selectedMaterial}
            testPaper={selectedTestPaper}
            courseId={selectedCourseId}
            courseModuleId={selectedCourseModuleId}
          />
        </div>
      </Card>

      <Card className="p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Badge tone="primary" className="capitalize">
                {moduleContentType}
              </Badge>
              {courseModule ? (
                <span className="truncate text-xs text-muted-foreground">
                  Module {courseModule.day} · {courseModule.name}
                </span>
              ) : null}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <ClockIcon weight="bold" className="h-3.5 w-3.5" />
                {getDurationMins(selectedMaterial, selectedTestPaper)} min
              </span>
            </div>
            <h1 className="text-xl font-semibold md:text-2xl">{item.name}</h1>
          </div>
          <div className="shrink-0">
            <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
          </div>
        </div>
      </Card>

      <Card>
        <ContentActionsRow
          createdBy={createdBy}
          item={item}
          isMaterial={Boolean(selectedMaterial)}
          courseId={selectedCourseId}
        />
      </Card>

      {meets.length ? (
        <Card className="px-4 md:px-5">
          <SimpleAccordions
            openIndexes={[0]}
            items={[
              {
                title: (
                  <span>
                    Live sessions{' '}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({meets.length} {getPlural(meets.length, 'session')})
                    </span>
                  </span>
                ),
                component: (
                  <div className="pb-4">
                    <Sessions meets={meets} isSmallJoinable isCopyIconOnly />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      ) : null}
    </div>
  );
};

/** The item's display name, whichever kind it is. */
const getItemName = (item: ICourseModuleItem) => item.material?.name ?? item.testPaper?.name ?? '';

/** One height for both buttons whatever their variant or label, so the bar never looks lopsided. */
const NAV_BUTTON_CLASS = 'h-10 min-w-0 max-w-[40%] px-3 py-0 md:h-12';

/**
 * The button's text: a plain word on a phone, and from `md` up the word as an eyebrow over the
 * lesson it leads to. Both forms are vertically centred in the fixed-height button.
 */
const NavLabel = ({ eyebrow, title, align }: { eyebrow: string; title: string; align: 'left' | 'right' }) => (
  <span
    className={cn('flex min-w-0 flex-col justify-center leading-tight', align === 'right' ? 'text-right' : 'text-left')}
  >
    <span className="md:hidden">{eyebrow}</span>
    <span className="hidden text-xxs font-medium uppercase tracking-caps opacity-80 md:block">{eyebrow}</span>
    <span className="hidden truncate md:block">{title}</span>
  </span>
);

/**
 * Previous / Next, pinned under the lesson column so it is reachable without scrolling. Each side
 * names the lesson it leads to; the middle says where the learner is in the course.
 */
export const LessonNav = () => {
  const { selectedCourseId } = useSelectorLookups();
  const { getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  if (!selectedCourseId) return null;
  const items = getCourseItems(selectedCourseId);
  const index = getSelectedItemIndex(selectedCourseId);
  if (index < 0) return null;
  const previous = items[index - 1];
  const next = items[index + 1];

  return (
    <div className="mx-auto flex max-w-5xl items-center gap-3 px-3 py-2.5 md:px-6">
      <Button
        isSecondary
        className={NAV_BUTTON_CLASS}
        disabled={!previous}
        onClick={() => selectAdjacentItem(selectedCourseId, -1)}
        leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4 shrink-0" />}
      >
        <NavLabel eyebrow="Previous" title={previous ? getItemName(previous) : 'Start of course'} align="left" />
      </Button>
      <div className="flex-1 text-center font-mono text-xs text-muted-foreground">
        {index + 1} / {items.length}
      </div>
      <Button
        className={NAV_BUTTON_CLASS}
        isSecondary={!next}
        disabled={!next}
        onClick={() => selectAdjacentItem(selectedCourseId, 1)}
        rightsection={<CaretRightIcon weight="bold" className="h-4 w-4 shrink-0" />}
      >
        <NavLabel eyebrow="Next" title={next ? getItemName(next) : 'End of course'} align="right" />
      </Button>
    </div>
  );
};
