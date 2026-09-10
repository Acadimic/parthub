import { AvatarWithName } from '@components/app/avatars';
import { Label } from '@repo/ui/app';
import { UserIcon } from '@phosphor-icons/react';
import { isStudentUser, useUserLookups } from '@stores';

interface IProps {
  attendeeIds: string[];
  isStudents?: boolean;
  isTeachers?: boolean;
  noLabel?: boolean;
}

export const ViewMeetAttendees = ({ attendeeIds, isStudents, isTeachers, noLabel }: IProps) => {
  const userStore = useUserLookups();
  const { getUsersByIds } = userStore;
  const attendees = getUsersByIds(attendeeIds);

  const filteredAttendees = attendees.filter((attendee) => {
    if (isStudents) return isStudentUser(attendee);
    if (isTeachers) return !isStudentUser(attendee);
    return true;
  });

  let label = 'Attendees';
  if (isStudents) label = 'Students';
  else if (isTeachers) label = 'Teachers';

  return (
    <div>
      <div className="flex items-center text-sm text-color-secondary">
        {!noLabel && (
          <div className="flex items-center gap-2">
            <UserIcon weight="bold" className="w-4 h-4" />
            <Label label={label} />
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 py-2">
        {filteredAttendees.map((user) => (
          <div key={user._id}>
            <AvatarWithName id={user._id} name={user.name} avatar={user.photoUrl} />
          </div>
        ))}
      </div>
    </div>
  );
};
