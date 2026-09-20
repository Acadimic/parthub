import { type CourseDto, type CourseModuleDto, type MeetDto } from '@repo/shared/contracts';
import { type IAiSessionSpec } from '@repo/shared/interfaces';
import { AiDrawerFooter } from '@components/app/ai';
import { CalendarBlankIcon, VideoCameraIcon } from '@phosphor-icons/react';
import { DrawerSection, Modal, TextInput } from '@repo/ui/app';
import { Badge, Checkbox } from '@repo/ui/core';
import { MeetFrequency, PositionType } from '@enums';
import { CourseService, MeetService } from '@services';
import { useCourseLookups, useCourseStore, useMeetLookups } from '@stores';
import { addDaysToDate, addMinutesToDate, getFormattedDate, reportError, successToast } from '@utils/helpers';
import { useEffect, useMemo } from 'react';
import { useSetState } from 'react-use';
import { persistCourseStats } from './course-stats';

interface IProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseDto;
  modules: CourseModuleDto[];
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface IState {
  /** yyyy-mm-dd */
  startDate: string;
  /** HH:mm */
  time: string;
  teachingDays: number[];
  isSaving: boolean;
}

/** The next Monday, as the default first day of a course. */
const nextMonday = (): string => {
  const date = new Date();
  const ahead = (8 - date.getDay()) % 7 || 7;
  return addDaysToDate(date, ahead).toISOString().slice(0, 10);
};

const toLocalDate = (day: string, time: string): Date => {
  const [year, month, date] = day.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  return new Date(year, month - 1, date, hours || 0, minutes || 0, 0, 0);
};

interface IScheduledDay {
  courseModule: CourseModuleDto;
  date: Date;
  session?: { key: string; spec: IAiSessionSpec };
}

/** Each module takes the next teaching day in turn; a module with a planned session gets a meet on its day. */
const schedule = (modules: CourseModuleDto[], state: IState): IScheduledDay[] => {
  if (!state.teachingDays.length) return [];
  const ordered = [...modules].sort((a, b) => a.day - b.day);
  let cursor = toLocalDate(state.startDate, state.time);
  return ordered.map((courseModule) => {
    while (!state.teachingDays.includes(cursor.getDay())) cursor = addDaysToDate(cursor, 1);
    const date = cursor;
    cursor = addDaysToDate(cursor, 1);
    const pending = (courseModule.pending ?? []).find(
      (work) => work.kind === 'session' && work.status !== 'done' && work.status !== 'skipped',
    );
    return {
      courseModule,
      date,
      session: pending ? { key: pending.key, spec: pending.spec as IAiSessionSpec } : undefined,
    };
  });
};

const countLabel = (count: number, noun: string) => `${count} ${noun}${count === 1 ? '' : 's'}`;

/** A planned session as a one-off meet on its day, from the store's draft defaults. */
const meetFromSpec = (date: Date, spec: IAiSessionSpec, course: CourseDto, draft: MeetDto): MeetDto => ({
  ...draft,
  title: spec.title,
  description: (spec.agenda ?? []).map((line) => `• ${line}`).join('\n'),
  durationMins: spec.durationMins,
  endTime: addMinutesToDate(date, spec.durationMins).toISOString(),
  frequency: MeetFrequency.ONE_TIME,
  weekDays: [],
  standards: course.standards ?? [],
  isNew: false,
});

/** The course lists its sessions too; that is what the course header and the learner's view read. */
const attachMeetsToCourse = async (courseId: string, meetIds: string[]) => {
  const store = useCourseStore.getState();
  const current = store.getCourseById(courseId);
  if (!current || !meetIds.length) return;
  const withMeets = { ...current, meets: [...new Set([...(current.meets ?? []), ...meetIds])] };
  await CourseService.upsertCourse(withMeets);
  store.addCourses([withMeets]);
};

/**
 * Turns a course plan's live sessions into meets on the calendar. The teacher picks the first
 * teaching day, the time slot and which weekdays are teaching days; every module takes the next
 * teaching day in order, and each planned session lands on its module's day.
 */
export const AiCourseSessionsDrawer = ({ isOpen, onClose, course, modules }: IProps) => {
  const courseStore = useCourseLookups();
  const meetStore = useMeetLookups();
  const [state, setState] = useSetState<IState>({
    startDate: nextMonday(),
    time: '17:00',
    teachingDays: [1, 2, 3, 4, 5],
    isSaving: false,
  });

  useEffect(() => {
    if (isOpen) setState({ startDate: nextMonday(), time: '17:00', teachingDays: [1, 2, 3, 4, 5] });
  }, [isOpen]);

  const days = useMemo(() => schedule(modules, state), [modules, state.startDate, state.time, state.teachingDays]);
  const sessions = days.filter((day) => day.session);

  const toggleDay = (index: number) =>
    setState({
      teachingDays: state.teachingDays.includes(index)
        ? state.teachingDays.filter((day) => day !== index)
        : [...state.teachingDays, index].sort(),
    });

  const createSessions = async () => {
    if (!sessions.length || state.isSaving) return;
    setState({ isSaving: true });
    const createdIds: string[] = [];
    try {
      for (const day of sessions) {
        if (!day.session) continue;
        const meet = meetFromSpec(day.date, day.session.spec, course, meetStore.createMeet(day.date));
        await MeetService.upsertMeet(meet);
        meetStore.addMeets([meet]);
        createdIds.push(meet._id);
        const linked = await CourseService.linkCourseModule({
          courseModule: day.courseModule._id,
          meets: [meet._id],
          done: [{ key: day.session.key, createdId: meet._id }],
        });
        if (linked?.data) courseStore.addCourseModules([linked.data]);
      }
      await attachMeetsToCourse(course._id, createdIds);
      successToast({ message: `${countLabel(createdIds.length, 'session')} scheduled.` });
      onClose();
      await courseStore.loadCourseModules(course._id);
      await persistCourseStats(course._id);
    } catch (error) {
      reportError(
        error,
        createdIds.length
          ? `${countLabel(createdIds.length, 'session')} scheduled before the failure.`
          : 'Could not schedule the sessions.',
      );
    } finally {
      setState({ isSaving: false });
    }
  };

  return (
    <Modal
      position={PositionType.RIGHT}
      className="w-full md:w-[48rem] md:max-w-[92%]"
      title="Schedule the course's live sessions"
      description="Pick the first teaching day, the time, and the weekdays you teach. Each day of the course takes the next teaching day; planned sessions land on their day."
      isOpen={isOpen}
      onClose={() => !state.isSaving && onClose()}
      component={
        <div className="flex flex-col gap-6">
          <DrawerSection title="When" isRequired>
            <div className="grid gap-3 sm:grid-cols-2">
              <TextInput
                label="First teaching day"
                type="date"
                value={state.startDate}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ startDate: event.target.value })}
              />
              <TextInput
                label="Session time"
                type="time"
                value={state.time}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setState({ time: event.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Teaching days</span>
              <div className="flex flex-wrap gap-2">
                {WEEK_DAYS.map((label, index) => (
                  <label
                    key={label}
                    htmlFor={`teaching-day-${index}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm"
                  >
                    <Checkbox
                      id={`teaching-day-${index}`}
                      checked={state.teachingDays.includes(index)}
                      onChange={() => toggleDay(index)}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          </DrawerSection>
          <DrawerSection
            title="The schedule"
            hint={
              sessions.length
                ? `${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'} will be created. Days without a planned session are shown for orientation only.`
                : 'No planned sessions are waiting; nothing will be created.'
            }
          >
            <ul className="flex flex-col gap-1">
              {days.map(({ courseModule, date, session }) => (
                <li
                  key={courseModule._id}
                  className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                    {getFormattedDate(date, 'ddd, D MMM')}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    <span className="text-xxs font-semibold uppercase tracking-caps text-primary">
                      Day {courseModule.day}
                    </span>{' '}
                    <span className="text-foreground">{courseModule.name}</span>
                  </span>
                  {session ? (
                    <Badge tone="success" appearance="soft" className="gap-1 px-1.5 py-0 text-xxs">
                      <VideoCameraIcon className="h-3 w-3" />
                      {session.spec.title} · {getFormattedDate(date, 'HH:mm')} · {session.spec.durationMins} min
                    </Badge>
                  ) : (
                    <CalendarBlankIcon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  )}
                </li>
              ))}
            </ul>
          </DrawerSection>
        </div>
      }
      footer={
        <AiDrawerFooter
          note={`${sessions.length} to schedule`}
          isFirstStep
          isLastStep
          nextLabel=""
          importLabel={
            state.isSaving
              ? 'Scheduling…'
              : `Schedule ${sessions.length} ${sessions.length === 1 ? 'session' : 'sessions'}`
          }
          canImport={sessions.length > 0}
          isImporting={state.isSaving}
          onClose={onClose}
          onBack={onClose}
          onNext={createSessions}
          onImport={createSessions}
        />
      }
    />
  );
};
