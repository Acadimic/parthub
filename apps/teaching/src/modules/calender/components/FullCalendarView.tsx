import { ErrorBoundary } from 'react-error-boundary';

import { ErrorBoundaryFallback } from '@repo/ui/app';
import { CalendarXIcon } from '@phosphor-icons/react';
import { CalendarType } from '@enums';
import { type DayCellContentArg, type DayHeaderContentArg, type EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IFullCalendarEvent } from '@interfaces';
import { useUserLookups, useMeetLookups, useSelectorLookups } from '@stores';
import { getEventColor } from '@themes';
import { CalendarViewMap } from '@utils/constants';
import { getFormattedTime } from '@utils/helpers';
import { useEffect, useRef } from 'react';
import { CustomToolbar, getDayEvents, getMonthEvents, getWeekEvents } from '.';

export const DayHeaderContent = ({ date }: DayHeaderContentArg) => {
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);

  return (
    <div className="flex flex-col items-center py-2">
      <p className="text-sm font-medium">{dayName}</p>
    </div>
  );
};

export const DayCellContent = ({ dayNumberText, view: { type } }: DayCellContentArg) => {
  if (type !== 'dayGridMonth') return null;

  return <div className="p-3">{dayNumberText}</div>;
};

const EmptyListView = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-12 px-4">
      <CalendarXIcon className="w-12 h-12 text-text-secondary mb-4" />
      <h6 className="text-lg font-semibold text-text-primary mb-2">No Events Scheduled</h6>
      <p className="text-sm text-text-secondary text-center max-w-md">
        There are no events scheduled for this time period. Click the + create button to add a new event.
      </p>
    </div>
  );
};

const EventContentDefaultView = ({ event, calenderType }: { event: EventInput; calenderType: CalendarType }) => {
  const userStore = useUserLookups();
  const { getUsersByIds } = userStore;
  const attendees = getUsersByIds(event.extendedProps?.attendees || []);
  const mode =
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark') ? 'dark' : 'light';
  const color = getEventColor(mode, event.backgroundColor);

  return (
    <div
      style={{ background: color, border: `1px solid ${color}` }}
      className={`px-2 flex flex-col items-start justify-center text-white text-sm h-full w-full`}
    >
      <div className="flex items-center gap-2 font-medium w-full">
        <div>{getFormattedTime(event.start as Date)}</div>
        <div className="w-1 h-1 rounded-full bg-background" />
        <div className="truncate flex-1">{event.title}</div>
      </div>
      {calenderType === CalendarType.DAY ? (
        <>
          <div className="flex flex-nowrap line-clamp-1 items-center gap-2">
            {attendees.map((attendee) => (
              <div key={attendee._id}>
                <div className="text-xs font-medium max-w-20 truncate">{attendee.name}</div>
              </div>
            ))}
          </div>
          <div className="text-xs">{event.extendedProps?.meetingLink}</div>
        </>
      ) : null}
    </div>
  );
};

interface IProps {
  onEventClick: (event: IFullCalendarEvent) => void;
  onDateClick: (date: Date) => void;
}

export const FullCalendarView = ({ onEventClick, onDateClick }: IProps) => {
  const selectorStore = useSelectorLookups();
  const meetStore = useMeetLookups();
  const { selectedCalenderType, setSelectedCalenderType, setSelectedCalenderDate, selectedCalenderDate } =
    selectorStore;
  const meets = meetStore.getMeets();
  const { isSmallScreen } = useWindowDimensions();

  const now = new Date();
  const startTime = '00:00:00';
  const endTime = '23:59:59';
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:00`;
  const calendarRef = useRef<FullCalendar | null>(null);
  const date = new Date(selectedCalenderDate);
  let events = getWeekEvents({ date, meets });
  if (selectedCalenderType === CalendarType.DAY) events = getDayEvents({ date, meets });
  else if (selectedCalenderType === CalendarType.MONTH) events = getMonthEvents({ date, meets });

  useEffect(() => {
    // Initialize calendar with current view and date
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.changeView(CalendarViewMap[selectedCalenderType]);
      calendar.gotoDate(selectedCalenderDate);
    }
  }, [selectedCalenderType, selectedCalenderDate]);

  const handleError = () => {
    return <ErrorBoundaryFallback />;
  };

  return (
    <div className="h-full flex flex-col bg-background">
      <CustomToolbar
        calendarRef={calendarRef}
        setCalenderType={setSelectedCalenderType}
        setDate={setSelectedCalenderDate}
        calendarType={selectedCalenderType}
        selectedDate={selectedCalenderDate}
        handleCreateMeet={onDateClick}
      />
      <div className="grow">
        <ErrorBoundary FallbackComponent={handleError}>
          <FullCalendar
            viewClassNames={`${selectedCalenderType === CalendarType.DAY ? 'fc-day-grid-day-frame' : ''}`}
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView={CalendarViewMap[selectedCalenderType]}
            initialDate={now}
            nowIndicator
            height={`${isSmallScreen ? 'calc(100vh - 174px)' : 'calc(100vh - 144px)'}`}
            headerToolbar={false}
            allDaySlot={false}
            dayHeaders={true}
            allDayText=""
            dayHeaderContent={DayHeaderContent}
            dayCellContent={DayCellContent}
            slotMinTime={startTime}
            slotMaxTime={endTime}
            scrollTime={currentTime}
            events={events}
            eventContent={({ event }: { event: EventInput }) => {
              return <EventContentDefaultView event={event} calenderType={selectedCalenderType} />;
            }}
            moreLinkDidMount={(info) => {
              const link = info.el;
              link.setAttribute('aria-expanded', 'false');
              link.setAttribute('aria-controls', `view-${info.num}`);
              link.setAttribute('role', 'button');
            }}
            slotEventOverlap={false}
            eventColor="transparent"
            eventBorderColor="transparent"
            snapDuration={'00:15'}
            eventDurationEditable={false}
            dayMaxEventRows={4}
            locale={'en-US'}
            slotLabelFormat={{
              hour: 'numeric',
            }}
            eventClick={({ event }) =>
              onEventClick({
                id: event.id,
                title: event.title,
                start: event.start as Date,
                end: event.end as Date,
                color: event.extendedProps?.color,
                timezone: event.extendedProps?.timezone,
                attendees: event.extendedProps?.attendees,
                meetingLink: event.extendedProps?.meetingLink,
                backgroundColor: event.extendedProps?.backgroundColor,
                borderColor: event.extendedProps?.borderColor,
              })
            }
            dateClick={({ date }) => onDateClick(date)}
            noEventsContent={<EmptyListView />}
            scrollTimeReset={false}
            datesSet={({ view }) => {
              // Update the calendar type based on the current view
              const viewType = view.type;
              const calendarType = Object.values(CalendarType).find((value) => value === viewType);
              if (calendarType && calendarType !== selectedCalenderType) {
                setSelectedCalenderType(calendarType);
              }
              // Update the selected date
              setSelectedCalenderDate(view.currentStart.getTime());
            }}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
};
