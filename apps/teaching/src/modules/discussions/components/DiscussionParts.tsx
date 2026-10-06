import { PresignedImage } from '@components/app/attachments';
import { Avatar } from '@components/app/avatars';
import { FileDropZone } from '@components/app/selects';
import { useAttachment } from '@hooks/attachment.hook';
import { BookOpenTextIcon, ClipboardTextIcon, GridFourIcon } from '@phosphor-icons/react';
import { type AttachmentDto, type CourseCommentDto } from '@repo/shared/contracts';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { CommentAttachments, CommentComposer, DiscussionAuthorLine } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import {
  useCourseLookups,
  useDiscussionLookups,
  useDiscussionStore,
  useMaterialLookups,
  useSelectedUser,
  useTestPaperLookups,
} from '@stores';
import { getObjectId } from '@utils/helpers';
import { type ReactNode } from 'react';

/** A name for something a comment cites: the inbox's own list first, then whatever the stores hold. */
export const useSourceName = () => {
  const { sourceMap } = useDiscussionLookups();
  const { getCourseById } = useCourseLookups();
  const { getMaterialById } = useMaterialLookups();
  const { getTestPaperById } = useTestPaperLookups();
  return (id: string | null | undefined): string | null => {
    if (!id) return null;
    return (
      sourceMap[id]?.name ?? getCourseById(id)?.name ?? getMaterialById(id)?.name ?? getTestPaperById(id)?.name ?? null
    );
  };
};

interface ISourceChipsProps {
  comment: CourseCommentDto;
  isShowingCourse: boolean;
  /** Filters the list down to the lesson's comments; null where there is no list to filter. */
  onSelectLesson: ((comment: CourseCommentDto) => void) | null;
}

/** Where a comment was written: its course, in the inbox, and the lesson or test paper it was on. */
export const SourceChips = ({ comment, isShowingCourse, onSelectLesson }: ISourceChipsProps) => {
  const getName = useSourceName();
  const courseName = isShowingCourse ? getName(comment.course) : null;
  const lessonId = comment.material ?? comment.testPaper;
  const lessonName = getName(lessonId);
  if (!courseName && !lessonName) return null;
  const LessonIcon = comment.testPaper ? ClipboardTextIcon : BookOpenTextIcon;
  const chip =
    'flex max-w-full items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xxs font-medium text-muted-foreground';
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5">
      {courseName ? (
        <span className={chip}>
          <GridFourIcon weight="bold" className="h-3 w-3 shrink-0" />
          <span className="truncate">{courseName}</span>
        </span>
      ) : null}
      {lessonName ? (
        <button
          type="button"
          disabled={!onSelectLesson}
          title={onSelectLesson ? `Show only comments on ${lessonName}` : lessonName}
          onClick={() => onSelectLesson?.(comment)}
          className={cn(chip, onSelectLesson && 'transition-colors hover:bg-accent hover:text-foreground')}
        >
          <LessonIcon weight="bold" className="h-3 w-3 shrink-0" />
          <span className="truncate">{lessonName}</span>
        </button>
      ) : null}
    </div>
  );
};

/** What the author line reads from a comment or a review. */
interface IAuthoredRow {
  _id: string;
  createdBy?: string;
  createdAt?: string;
  isStaff?: boolean;
}

interface IAuthorProps {
  row: IAuthoredRow;
  isEdited: boolean;
  context: ReactNode;
  trailing: ReactNode;
}

/** The shared author line with this app's avatar. */
export const CommentAuthor = ({ row, isEdited, context, trailing }: IAuthorProps) => {
  const selectedUser = useSelectedUser();
  const { authorMap } = useDiscussionLookups();
  const userId = row.createdBy ?? row._id;
  const isMine = Boolean(selectedUser && row.createdBy === selectedUser._id);
  const author = authorMap[userId];
  // A reply the teacher has just posted arrives before any page lists them as an author.
  const name = author?.name || (isMine ? selectedUser?.name : null) || 'Learner';
  const myAvatar = isMine ? (selectedUser?.avatar ?? null) : null;
  const avatar = author ? author.avatar : myAvatar;
  return (
    <DiscussionAuthorLine
      avatar={<Avatar id={userId} name={name} avatar={avatar} size={32} className="text-xs" />}
      name={name}
      isTeacher={author?.isTeacher ?? Boolean(row.isStaff)}
      isMine={isMine}
      createdAt={row.createdAt}
      isEdited={isEdited}
      context={context}
      trailing={trailing}
    />
  );
};

/** A comment's files, signed through this app's presigned-URL cache. */
export const CommentFiles = ({ attachments }: { attachments: AttachmentDto[] }) => {
  const { getPresignedUrls } = useAttachment();
  const openFile = async (attachment: AttachmentDto) => {
    const [url] = await getPresignedUrls([attachment.url]);
    if (url) window.open(url, '_blank', 'noopener');
  };
  return (
    <CommentAttachments
      attachments={attachments}
      renderImage={(image) => <PresignedImage url={image.url} className="object-cover" />}
      onOpenFile={openFile}
    />
  );
};

interface IComposerProps {
  courseId: string;
  /** The thread this replies to, or null to start one: an announcement to the course's learners. */
  parentId: string | null;
  placeholder: string;
  isAutoFocus: boolean;
  onPosted: () => void;
  onCancel: (() => void) | null;
}

/** The shared composer, posting as staff through this app's upload. */
export const StaffComposer = ({ courseId, parentId, placeholder, isAutoFocus, onPosted, onCancel }: IComposerProps) => {
  const { uploadFilesToS3 } = useAttachment();

  const submit = async (body: string, files: File[]) => {
    const _id = getObjectId();
    // The upload removes what it sent and toasts the reason when any file fails.
    const attachments = await uploadFilesToS3(_id, files).catch(() => null);
    if (!attachments) return false;
    const isSaved = await useDiscussionStore
      .getState()
      .saveComment({ _id, course: courseId, parent: parentId, body, attachments });
    if (isSaved) onPosted();
    return isSaved;
  };

  return (
    <CommentComposer
      placeholder={placeholder}
      submitLabel={parentId ? 'Reply' : 'Post'}
      rows={parentId ? 2 : 3}
      isAutoFocus={isAutoFocus}
      onSubmit={submit}
      onCancel={onCancel}
      renderFilePicker={(trigger, onPick) => (
        <FileDropZone
          selectedFiles={[]}
          setSelectedFiles={onPick}
          maxFiles={DISCUSSION_LIMITS.MAX_ATTACHMENTS}
          hidePreview
          isImage
          isPdf
        >
          {trigger}
        </FileDropZone>
      )}
    />
  );
};
