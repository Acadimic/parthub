import { type AttachmentDto } from '@repo/shared/contracts';
import { Attachment } from '@components/app/attachments';
import { Avatar } from '@components/app/avatars';
import { Button, Card, SimpleAccordions } from '@repo/ui/app';
import { DynamicSubtitle } from '@components/common';
import { CollectionType } from '@enums';
import { useAttachment } from '@hooks/attachment.hook';
import { useCourse } from '@hooks/course.hook';
import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';
import {
  type IMaterial,
  type ITestPaper,
  type IUser,
  useMeetLookups,
  useSelectedCourse,
  useSelectedMaterial,
  useSelectedTestPaper,
  useSelectorLookups,
  useUserLookups,
} from '@stores';
import { getPlural } from '@utils/helpers';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
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
  selectedAttachmentId,
  onClickContent,
  onClickAttachment,
}: {
  material?: IMaterial;
  hasSelectedContent: boolean;
  selectedAttachmentId?: string;
  onClickContent: () => void;
  onClickAttachment: (attachment: AttachmentDto) => void;
}) => {
  if (!material) return null;
  return (
    <div>
      <div className="flex gap-3 items-center flex-wrap py-4">
        <div className="text-sm font-medium">Attachments :</div>
        <div className="flex gap-3 items-center">
          <div className="border border-border rounded-full">
            <Button onClick={onClickContent} isSecondary={!hasSelectedContent} className="px-4 py-1" isRound>
              Content
            </Button>
          </div>
          {(material.attachments ?? []).map((attachment, index) => (
            <Button
              key={attachment._id}
              onClick={() => onClickAttachment(attachment)}
              isSecondary={selectedAttachmentId !== attachment._id}
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
      </div>
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
    <div className="flex justify-start flex-col md:flex-row md:justify-between py-4 gap-3 w-full border-y border-border">
      <div className="flex items-center gap-6">
        {createdBy && (
          <>
            <div className="flex items-center space-x-2 text-sm font-medium">
              <div>
                <Avatar id={createdBy._id} name={createdBy.name} />
              </div>
              <div>
                <div className="text-sm font-medium">{createdBy.name}</div>
                <Followers user={createdBy} />
              </div>
            </div>
            <div>
              <FollowButton user={createdBy} />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <LikeCourse collectionItem={item} collectionRef={collectionRef} />
        <BookmarkCourse collectionItem={item._id} collectionRef={collectionRef} />
        <ShareCourse courseId={courseId} />
      </div>
    </div>
  );
};

export const CourseContent = () => {
  const selectorStore = useSelectorLookups();
  const userStore = useUserLookups();
  const meetStore = useMeetLookups();
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
  const { push } = useRouter();

  const handleClickContent = () => {
    setSelectedContent(selectedMaterial?.content || '');
    removeSelectedAttachment();
  };

  const item: IMaterial | ITestPaper | undefined = selectedMaterial ?? selectedTestPaper;
  const createdBy = item?.createdBy ? getUserById(item.createdBy) : null;

  const moduleContentType = useMemo(() => {
    return getModuleContentType(selectedMaterial, selectedTestPaper);
  }, [selectedCourseId, selectedMaterial?._id, selectedTestPaper?._id]);

  if (!item || !selectedCourseId || !selectedCourse) {
    if (selectedCourseId) {
      push(`/courses/${selectedCourseId}/preview`);
    } else {
      push('/courses');
    }
    return;
  }

  const meets = getMeetsByIds(selectedCourse.meets ?? []);

  return (
    <div>
      <div className="flex flex-col space-y-1 py-2 h-full w-full">
        <div
          className={`relative overflow-auto w-full h-[50vh] md:h-[500px] border border-border ${selectedContent ? '' : 'bg-cross-vector'}`}
        >
          <Content
            material={selectedMaterial}
            testPaper={selectedTestPaper}
            courseId={selectedCourseId}
            courseModuleId={selectedCourseModuleId}
          />
        </div>
        <div className="flex justify-between items-cente space-x-3">
          <Button
            className="px-0 blue-gradient"
            isSubtle
            leftsection={<CaretLeftIcon weight="bold" className="w-4 h-4 text-primary" />}
          >
            Prev
          </Button>
          <Button
            className="px-0 blue-gradient"
            isSubtle
            rightsection={<CaretRightIcon weight="bold" className="w-4 h-4 text-primary" />}
          >
            Next
          </Button>
        </div>
        <div className="flex flex-col md:flex-row md:items-start justify-between w-full py-2">
          <div className="flex flex-col justify-center-center gap-0 w-full md:max-w-[75%] flex-wrap">
            <div className="font-semibold text-base md:text-lg flex flex-col md:flex-row md:items-center md:justify-between gap-2 w-full">
              <div className=" flex-wrap">{item.name}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground flex items-center space-x-1">
                <span className="capitalize">{moduleContentType}</span>
                <span className="mx-1 text-xs">•</span>
                <span>{getDurationMins(selectedMaterial, selectedTestPaper)} mins</span>
              </div>
            </div>
          </div>
          <MarkCompleteButton testPaper={selectedTestPaper} material={selectedMaterial} />
        </div>
        <div className="w-full">
          <AttachmentsRow
            material={selectedMaterial}
            hasSelectedContent={Boolean(selectedContent)}
            selectedAttachmentId={selectedAttachment?._id}
            onClickContent={handleClickContent}
            onClickAttachment={handleClickAttachment}
          />
          <ContentActionsRow
            createdBy={createdBy}
            item={item}
            isMaterial={Boolean(selectedMaterial)}
            courseId={selectedCourseId}
          />
          <Card className="py-4 bg-transparent">
            <div className="px-2 bg-background">
              <SimpleAccordions
                items={[
                  {
                    title: (
                      <DynamicSubtitle
                        title={getPlural(meets.length, 'Session')}
                        subtitle="Schedule"
                        count={meets.length}
                      />
                    ),
                    component: <Sessions meets={meets} />,
                  },
                ]}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
