import { ArrowBendDownRightIcon, ChatCircleIcon, PencilSimpleIcon, TrashIcon } from '@phosphor-icons/react';
import { type CourseCommentDto } from '@repo/shared/contracts';
import { CollectionType } from '@enums';
import { DISCUSSION_LIMITS } from '@repo/shared/utils';
import { Button, Menu, SoftConfirmModal, TextArea } from '@repo/ui/app';
import { ExpandableText } from '@repo/ui/core';
import { type IMenuItem } from '@repo/ui/types';
import { useDiscussionLookups, useDiscussionStore, useSelectedUser } from '@stores';
import { useState } from 'react';
import { CommentAttachments } from './CommentAttachments';
import { CommentComposer } from './CommentComposer';
import { CommentSource } from './CommentSource';
import { LikeButton } from './LikeButton';
import { DiscussionAuthorLine } from './DiscussionAuthorLine';

/** Replies shown before "View earlier replies". */
const VISIBLE_REPLIES = 2;

const saveComment = (comment: CourseCommentDto, fields: Partial<CourseCommentDto>) =>
  useDiscussionStore.getState().saveComment({ ...comment, ...fields });

/** The comment's text with an inline editor in its place while the author edits it. */
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
    const isSaved = await saveComment(comment, { body: draft.trim() });
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

/** A top-level comment's replies, the latest few first in view, and the box to add one. */
const Replies = ({
  comment,
  authorName,
  isReplying,
  onCloseReply,
}: {
  comment: CourseCommentDto;
  authorName: string;
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
        <CommentItem key={reply._id} comment={reply} isReply />
      ))}
      {isReplying ? (
        <CommentComposer
          courseId={comment.course}
          parentId={comment._id}
          placeholder={`Reply to ${authorName}…`}
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
  /** A reply cannot be replied to: threads are one level deep. */
  isReply: boolean;
}

export const CommentItem = ({ comment, isReply }: IProps) => {
  const selectedUser = useSelectedUser();
  const { getAuthor, getReplies } = useDiscussionLookups();
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const author = comment.createdBy ? getAuthor(comment.createdBy) : undefined;
  const isMine = Boolean(selectedUser && comment.createdBy === selectedUser._id);
  const replyCount = isReply ? 0 : getReplies(comment._id).length;

  const remove = async () => {
    setIsDeleting(true);
    const isDeleted = await saveComment(comment, { _deleted: true });
    setIsDeleting(false);
    if (isDeleted) setIsConfirmingDelete(false);
  };

  const menuItems: IMenuItem[] = [
    { label: 'Edit', icon: <PencilSimpleIcon className="h-4 w-4" />, onClick: () => setIsEditing(true) },
    { label: 'Delete', icon: <TrashIcon className="h-4 w-4" />, onClick: () => setIsConfirmingDelete(true) },
  ];

  return (
    <div className="flex flex-col">
      <DiscussionAuthorLine
        userId={comment.createdBy ?? comment._id}
        author={author}
        isMine={isMine}
        createdAt={comment.createdAt}
        isEdited={Boolean(comment.editedAt)}
        trailing={isMine && !isEditing ? <Menu menuItems={menuItems} /> : null}
      />
      <div className="flex flex-col pl-[42px]">
        <CommentSource comment={comment} />
        <CommentBody
          key={String(isEditing)}
          comment={comment}
          isEditing={isEditing}
          onClose={() => setIsEditing(false)}
        />
        <CommentAttachments attachments={comment.attachments} />
        {isReply ? (
          <div className="mt-1.5 flex items-center">
            <LikeButton itemId={comment._id} collectionRef={CollectionType.COURSE_COMMENT} />
          </div>
        ) : (
          <>
            <div className="mt-1.5 flex items-center gap-4">
              <LikeButton itemId={comment._id} collectionRef={CollectionType.COURSE_COMMENT} />
              <button
                type="button"
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary"
              >
                <ChatCircleIcon weight="bold" className="h-3.5 w-3.5" />
                Reply
              </button>
              {replyCount ? (
                <span className="text-xs text-muted-foreground">
                  {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                </span>
              ) : null}
            </div>
            <Replies
              comment={comment}
              authorName={author?.name ?? 'this comment'}
              isReplying={isReplying}
              onCloseReply={() => setIsReplying(false)}
            />
          </>
        )}
      </div>
      <SoftConfirmModal
        isOpen={isConfirmingDelete}
        isDestructive
        isLoading={isDeleting}
        confirmText="Delete"
        title={isReply ? 'Delete reply' : 'Delete comment'}
        description={
          replyCount ? 'Its replies will be removed with it. This cannot be undone.' : 'This cannot be undone.'
        }
        onCancel={() => setIsConfirmingDelete(false)}
        onConfirm={remove}
      />
    </div>
  );
};
