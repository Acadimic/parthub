import { Avatar } from '@components/app/avatars';
import { DiscussionAuthorLine as SharedAuthorLine } from '@repo/ui/app';
import { type IDiscussionAuthor } from '@repo/shared/interfaces';
import { useSelectedUser } from '@stores';
import { type ReactNode } from 'react';

interface IProps {
  userId: string;
  author: IDiscussionAuthor | undefined;
  isMine: boolean;
  createdAt: string | undefined;
  isEdited: boolean;
  trailing: ReactNode;
}

/** The shared author line, with this app's avatar and the signed-in learner standing in for themself. */
export const DiscussionAuthorLine = ({ userId, author, isMine, createdAt, isEdited, trailing }: IProps) => {
  const selectedUser = useSelectedUser();
  // A row the learner has just posted arrives before its page lists them as an author.
  const me = isMine && selectedUser ? { name: selectedUser.name, avatar: selectedUser.avatar } : null;
  const name = author?.name || me?.name || 'Learner';
  const avatar = author ? author.avatar : (me?.avatar ?? null);
  return (
    <SharedAuthorLine
      avatar={<Avatar id={userId} name={name} avatar={avatar} size={32} className="text-xs" />}
      name={name}
      isTeacher={author?.isTeacher ?? false}
      isMine={isMine}
      createdAt={createdAt}
      isEdited={isEdited}
      context={null}
      trailing={trailing}
    />
  );
};

/** Whether a review was changed after it was posted, allowing for the moment the write itself took. */
export const isEdited = (row: { createdAt?: string; updatedAt?: string }): boolean =>
  Boolean(row.createdAt && row.updatedAt) &&
  new Date(row.updatedAt ?? 0).getTime() - new Date(row.createdAt ?? 0).getTime() > 60_000;
