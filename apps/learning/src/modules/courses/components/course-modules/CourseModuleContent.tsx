import { type AttachmentDto } from '@repo/shared/contracts';
import { Button, SimpleAccordions } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { Attachment } from '@components/app/attachments';
import { Avatar } from '@components/app/avatars';
import { BlankState } from '@components/others';
import { CollectionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { useCourse } from '@hooks/course.hook';
import { CaretLeftIcon, CaretRightIcon, ClockIcon } from '@phosphor-icons/react';
import {
  type IMaterial,
  type ITestPaper,
  type IUser,
  useCourseLookups,
  useMeetLookups,
  useSelectedCourse,
  useSelectedMaterial,
  useSelectedTestPaper,
  useSelectorLookups,
  useUserLookups,
} from '@stores';
import { getPlural } from '@utils/helpers';
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

/** The content/attachment chips for a material. A test paper has none, so this renders nothing. */
const AttachmentsRow = ({
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
    <div className="flex flex-wrap items-center gap-2 py-1">
      <span className="mr-1 text-sm font-medium text-muted-foreground">Open:</span>
      <Button onClick={onClickContent} isSecondary={!hasSelectedContent} className="px-4 py-1" isRound>
        Lesson
      </Button>
      {material.attachments.map((attachment, index) => (
        <Button
          key={attachment.key}
          onClick={() => onClickAttachment(attachment)}
          isSecondary={selectedAttachmentKey !== attachment.key}
          className="!px-0 !py-0"
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

/** Who published the item, and the like / bookmark / share actions for it. */
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
  return (
    <div className="flex w-full flex-col justify-between gap-3 border-y border-border py-4 md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        {createdBy && (
          <>
            <div className="flex items-center gap-2 text-sm font-medium">
              <Avatar id={createdBy._id} name={createdBy.name || 'Teacher'} avatar={createdBy.photoUrl} />
              <div>
                <div className="text-sm font-medium">{createdBy.name}</div>
                <Followers user={createdBy} />
              </div>
            </div>
            <FollowButton user={createdBy} />
          </>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
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
  const { getModuleContentType, getCourseItems, getSelectedItemIndex, selectAdjacentItem } = useCourse();
  const { getMeetsByIds } = meetStore;

  const handleClickContent = () => {
    setSelectedContent(selectedMaterial?.content ?? null);
    removeSelectedAttachment();
  };

  const item: IMaterial | ITestPaper | undefined = selectedMaterial ?? selectedTestPaper;
  const createdBy = item?.createdBy ? getUserById(item.createdBy) : null;

  if (!selectedCourse || !selectedCourseId) return null;

  if (!item) {
    return (
      <BlankState
        label="Nothing to learn yet"
        description="This course has no lessons or tests published. Check back once your teacher adds content."
      />
    );
  }

  const moduleContentType = getModuleContentType(selectedMaterial, selectedTestPaper);
  const courseModule = getCourseModuleById(selectedCourseModuleId);
  const items = getCourseItems(selectedCourseId);
  const index = getSelectedItemIndex(selectedCourseId);
  const hasPrev = index > 0;
  const hasNext = index >= 0 && index < items.length - 1;
  const meets = getMeetsByIds(selectedCourse.meets ?? []);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative h-[55vh] min-h-[320px] w-full overflow-hidden rounded-xl border border-border bg-background md:h-[520px]">
        <Content
          material={selectedMaterial}
          testPaper={selectedTestPaper}
          courseId={selectedCourseId}
          courseModuleId={selectedCourseModuleId}
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button
          isSecondary
          className="px-3 py-1.5"
          disabled={!hasPrev}
          onClick={() => selectAdjacentItem(selectedCourseId, -1)}
          leftsection={<CaretLeftIcon weight="bold" className="h-4 w-4" />}
        >
          Previous
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1} / {items.length}
        </span>
        <Button
          isSecondary
          className="px-3 py-1.5"
          disabled={!hasNext}
          onClick={() => selectAdjacentItem(selectedCourseId, 1)}
          rightsection={<CaretRightIcon weight="bold" className="h-4 w-4" />}
        >
          Next
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary" className="capitalize">
              {moduleContentType}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon weight="bold" className="h-3.5 w-3.5" />
              {getDurationMins(selectedMaterial, selectedTestPaper)} min
            </span>
            {courseModule ? (
              <span className="truncate text-xs text-muted-foreground">
                · Module {courseModule.day}: {courseModule.name}
              </span>
            ) : null}
          </div>
          <h1 className="text-xl font-semibold md:text-2xl">{item.name}</h1>
        </div>
        <div className="shrink-0">
          <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
        </div>
      </div>

      <AttachmentsRow
        material={selectedMaterial}
        hasSelectedContent={Boolean(selectedContent)}
        selectedAttachmentKey={selectedAttachment?.key}
        onClickContent={handleClickContent}
        onClickAttachment={handleClickAttachment}
      />
      <ContentActionsRow
        createdBy={createdBy}
        item={item}
        isMaterial={Boolean(selectedMaterial)}
        courseId={selectedCourseId}
      />
      {meets.length ? (
        <div className="rounded-xl border border-border px-4">
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
        </div>
      ) : null}
    </div>
  );
};
