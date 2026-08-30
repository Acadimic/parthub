export interface IFullCalendarEvent {
  id: string;
  title: string;
  date?: string;
  start: Date;
  end: Date;
  timezone?: string;
  attendees?: string[];
  meetingLink?: string;
  borderColor: string;
  backgroundColor?: string;
  color?: string;
}
