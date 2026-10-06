import { type ReactNode } from 'react';
import { Badge } from '../../core/Badge';
import { getRelativeTime } from '../../lib/date-time';

interface IProps {
  /** The app's avatar, which signs the picture's address itself. */
  avatar: ReactNode;
  name: string;
  isTeacher: boolean;
  isMine: boolean;
  createdAt: string | undefined;
  isEdited: boolean;
  /** Sits under the name: the course and lesson in a teacher's inbox, say. */
  context: ReactNode;
  /** Sits at the end of the line: the row's menu, or its stars. */
  trailing: ReactNode;
}

/** The avatar, name, badges and age that head a comment or a review. */
export const DiscussionAuthorLine = ({
  avatar,
  name,
  isTeacher,
  isMine,
  createdAt,
  isEdited,
  context,
  trailing,
}: IProps) => (
  <div className="flex items-start gap-2.5">
    {avatar}
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span className="truncate text-sm font-semibold text-foreground">{name}</span>
        {isTeacher ? (
          <Badge tone="primary" appearance="solid" className="px-1.5 py-0 text-xxs">
            Teacher
          </Badge>
        ) : null}
        {isMine ? <span className="text-xxs font-medium text-muted-foreground">(you)</span> : null}
      </div>
      <div className="text-xxs text-muted-foreground">
        {createdAt ? getRelativeTime(createdAt) : 'just now'}
        {isEdited ? ' · edited' : ''}
      </div>
      {context}
    </div>
    {trailing}
  </div>
);
