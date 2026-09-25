import { type MeetDto } from '@repo/shared/contracts';
import { MeetStatus } from '@enums';
import { useLoadOnce } from '@repo/ui/hooks';
import { RectangleSkeleton } from '@repo/ui/app';
import { BlankState, Container } from '@components/others';
import { useMeetStore } from '@stores';
import { useShallow } from 'zustand/react/shallow';
import { SessionCard } from './components/SessionCard';

const isPast = (meet: MeetDto) => {
  if (meet.status === MeetStatus.COMPLETED || meet.status === MeetStatus.CANCELLED) return true;
  const end = meet.endTime ?? meet.startTime;
  return !!end && new Date(end).getTime() < Date.now();
};

const SessionGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <RectangleSkeleton key={index} height={180} />
    ))}
  </div>
);

const SessionGroup = ({ title, meets }: { title: string; meets: MeetDto[] }) => (
  <div className="flex flex-col space-y-4">
    <div className="border-b border-border py-2 text-base font-medium md:text-lg">
      {title} <span className="text-muted-foreground">({meets.length})</span>
    </div>
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {meets.map((meet) => (
        <SessionCard key={meet._id} meet={meet} />
      ))}
    </div>
  </div>
);

export const Sessions = () => {
  const meets = useMeetStore(useShallow((state) => state.getMyMeetsSorted()));
  const { isLoading, isFailed, error } = useLoadOnce(useMeetStore, 'meets', (state) => state.loadMyMeets);

  const upcoming = meets.filter((meet) => !isPast(meet));
  const past = meets.filter(isPast);

  const renderSessions = () => {
    if (isFailed) {
      return <BlankState label="Could not load your sessions" description={error || 'Please try again in a moment.'} />;
    }
    if (isLoading) return <SessionGridSkeleton />;
    if (!meets.length) {
      return (
        <BlankState
          label="No sessions scheduled"
          description="Live sessions for your courses will appear here once your teacher schedules them."
        />
      );
    }
    return (
      <div className="flex flex-col space-y-10">
        {upcoming.length > 0 && <SessionGroup title="Upcoming" meets={upcoming} />}
        {past.length > 0 && <SessionGroup title="Past" meets={past.reverse()} />}
      </div>
    );
  };

  return (
    <Container>
      <div className="py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Sessions</h1>
          <p className="mt-1 text-muted-foreground">Your scheduled live classes.</p>
        </div>
        {renderSessions()}
      </div>
    </Container>
  );
};
