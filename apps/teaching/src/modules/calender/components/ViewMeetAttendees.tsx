import { AvatarWithName } from '@components/app/avatars';
import { isStudentUser, useUserLookups } from '@stores';

interface IProps {
  attendeeIds: string[];
  isStudents?: boolean;
  isTeachers?: boolean;
  noLabel?: boolean;
}

/** The session's people, as one group: teachers, students, or everyone. */
export const ViewMeetAttendees = ({ attendeeIds, isStudents, isTeachers, noLabel }: IProps) => {
  const { getUsersByIds } = useUserLookups();
  const attendees = getUsersByIds(attendeeIds).filter((attendee) => {
    if (isStudents) return isStudentUser(attendee);
    if (isTeachers) return !isStudentUser(attendee);
    return true;
  });

  let label = 'Attendees';
  if (isStudents) label = 'Students';
  else if (isTeachers) label = 'Teachers';

  return (
    <div className="min-w-0">
      {!noLabel ? (
        <p className="mb-1.5 text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          {label} · {attendees.length}
        </p>
      ) : null}
      {attendees.length ? (
        <div className="flex flex-wrap gap-2">
          {attendees.map((user) => (
            <AvatarWithName key={user._id} id={user._id} name={user.name} avatar={user.avatar} />
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">{noLabel ? '—' : `No ${label.toLowerCase()}`}</span>
      )}
    </div>
  );
};
