import {
  ArrowBendDownRightIcon,
  ChatCircleIcon,
  CheckCircleIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import { type CourseCommentDto } from '@repo/shared/contracts';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { Button, LikeToggle, Menu, SoftConfirmModal, TextArea } from '@repo/ui/app';
import { Badge, ExpandableText } from '@repo/ui/core';
import { type IMenuItem } from '@repo/ui/types';
import { useDiscussionLookups, useDiscussionStore, useSelectedUser } from '@stores';
import { useState } from 'react';
import { CommentAuthor, CommentFiles, SourceChips, StaffComposer } from './DiscussionParts';

/** Replies shown before "View earlier replies". */
const VISIBLE_REPLIES = 3;

/** The comment's text, with an editor in its place while the teacher edits their own. */
const CommentBody = ({
  comment,
  isEditing,
  onClose,
}: {
  comment: CourseCommentDto;
  isEditing: boolean;
  onClose: () => void;
}) => {
  const [draft, setDraft] = useState(comment.body);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!draft.trim() && !comment.attachments.length) return;
    setIsSaving(true);
    const isSaved = await useDiscussionStore.getState().saveComment({ ...comment, body: draft.trim() });
    setIsSaving(false);
    if (isSaved) onClose();
  };

  if (!isEditing) {
    if (!comment.body) return null;
    return (
      <ExpandableText text={comment.body} className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground" />
    );
  }
  return (
    <div className="mt-2 flex flex-col gap-2">
      <TextArea
        value={draft}
        autoFocus
        rows={3}
        maxLength={DISCUSSION_LIMITS.MAX_BODY_LENGTH}
        onChange={(event) => setDraft(event.target.value)}
        className="resize-none"
      />
      <div className="flex justify-end gap-1.5">
        <Button isSubtle className="px-3 py-1.5 text-xs" text="Cancel" onClick={onClose} />
        <Button className="px-3 py-1.5 text-xs" text="Save" isLoading={isSaving} onClick={save} />
      </div>
    </div>
  );
};

/** Answered or not, at a glance, on a learner's thread; a staff thread waits on nobody. */
const ThreadStatus = ({ comment }: { comment: CourseCommentDto }) => {
  if (comment.isStaff) return null;
  return comment.isAnswered ? (
    <Badge tone="success" appearance="soft" className="shrink-0 gap-1 px-1.5 py-0 text-xxs">
      <CheckCircleIcon weight="fill" className="h-3 w-3" />
      Answered
    </Badge>
  ) : (
    <Badge tone="warning" appearance="soft" withDot className="shrink-0 px-1.5 py-0 text-xxs">
      Needs reply
    </Badge>
  );
};

/** A thread's replies, the latest few in view, and the box for the teacher's answer. */
const Replies = ({
  comment,
  isReplying,
  onCloseReply,
}: {
  comment: CourseCommentDto;
  isReplying: boolean;
  onCloseReply: () => void;
}) => {
  const { getReplies } = useDiscussionLookups();
  const [isShowingAll, setIsShowingAll] = useState(false);
  const replies = getReplies(comment._id);
  const visible = isShowingAll ? replies : replies.slice(-VISIBLE_REPLIES);
  const hiddenCount = replies.length - visible.length;
  if (!replies.length && !isReplying) return null;
  return (
    <div className="mt-3 flex flex-col gap-4 border-l-2 border-border pl-3">
      {hiddenCount > 0 ? (
        <button
          type="button"
          onClick={() => setIsShowingAll(true)}
          className="flex items-center gap-1 self-start text-xs font-semibold text-primary hover:underline"
        >
          <ArrowBendDownRightIcon weight="bold" className="h-3.5 w-3.5" />
          View {hiddenCount} earlier {hiddenCount === 1 ? 'reply' : 'replies'}
        </button>
      ) : null}
      {visible.map((reply) => (
        <DiscussionThread key={reply._id} comment={reply} isReply isShowingCourse={false} onSelectLesson={null} />
      ))}
      {isReplying ? (
        <StaffComposer
          courseId={comment.course}
          parentId={comment._id}
          placeholder="Write your answer…"
          isAutoFocus
          onPosted={() => {
            onCloseReply();
            setIsShowingAll(true);
          }}
          onCancel={onCloseReply}
        />
      ) : null}
    </div>
  );
};

interface IProps {
  comment: CourseCommentDto;
  isReply: boolean;
  /** The inbox names the course on every thread; a course's own page does not need to. */
  isShowingCourse: boolean;
  onSelectLesson: ((comment: CourseCommentDto) => void) | null;
}

/**
 * One comment as staff see it: who wrote it and where, its files and likes, and Reply, Edit (their
 * own) and Delete (anyone's). A top-level comment carries its replies and whether it is answered.
 */
export const DiscussionThread = ({ comment, isReply, isShowingCourse, onSelectLesson }: IProps) => {
  const selectedUser = useSelectedUser();
  const { getReplies, likeMap } = useDiscussionLookups();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isMine = Boolean(selectedUser && comment.createdBy === selectedUser._id);
  const replies = isReply ? [] : getReplies(comment._id);

  const remove = async () => {
    setIsDeleting(true);
    const isRemoved = await useDiscussionStore.getState().removeComment(comment);
    setIsDeleting(false);
    if (isRemoved) setIsConfirmingDelete(false);
  };

  const menuItems: IMenuItem[] = [
    ...(isMine
      ? [{ label: 'Edit', icon: <PencilSimpleIcon className="h-4 w-4" />, onClick: () => setIsEditing(true) }]
      : []),
    { label: 'Delete', icon: <TrashIcon className="h-4 w-4" />, onClick: () => setIsConfirmingDelete(true) },
  ];

  return (
    <div className="flex flex-col">
      <CommentAuthor
        row={comment}
        isEdited={Boolean(comment.editedAt)}
        context={
          isReply ? null : (
            <SourceChips comment={comment} isShowingCourse={isShowingCourse} onSelectLesson={onSelectLesson} />
          )
        }
        trailing={
          <div className="flex shrink-0 items-center gap-1">
            {isReply ? null : <ThreadStatus comment={comment} />}
            {isEditing ? null : <Menu menuItems={menuItems} />}
          </div>
        }
      />
      <div className="flex flex-col pl-[42px]">
        <CommentBody
          key={String(isEditing)}
          comment={comment}
          isEditing={isEditing}
          onClose={() => setIsEditing(false)}
        />
        <CommentFiles attachments={comment.attachments} />
        <div className="mt-1.5 flex items-center gap-4">
          <LikeToggle
            count={likeMap[comment._id] ?? 0}
            isLiked={false}
            disabledHint="Learners like comments from the learning app"
            onToggle={() => undefined}
          />
          {isReply ? null : (
            <button
              type="button"
              onClick={() => setIsReplying(!isReplying)}
              className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
            >
              <ChatCircleIcon weight="bold" className="h-3.5 w-3.5" />
              Reply
            </button>
          )}
        </div>
        <Replies comment={comment} isReplying={isReplying} onCloseReply={() => setIsReplying(false)} />
      </div>
      <SoftConfirmModal
        isOpen={isConfirmingDelete}
        isDestructive
        isLoading={isDeleting}
        confirmText="Delete"
        title={isReply ? 'Delete reply' : 'Delete comment'}
        description={
          replies.length
            ? 'The comment and its replies will be removed for everyone. This cannot be undone.'
            : 'It will be removed for everyone. This cannot be undone.'
        }
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
};
