import { Button, Dropdown, Menu } from '@components/app';
import { CaretLeft, CaretRight, GridFour, GridNine, ListBullets, Plus, Rows } from '@phosphor-icons/react';
import { CalenderType, FCCalenderType } from '@enums';
import { CalenderTypeMap } from '@utils/constants';
import {
  addDaysToDate,
  addMonthsToDate,
  addWeeksToDate,
  capitalize,
  getEndOfWeek,
  getFormattedDate,
  getStartOfWeek,
  subtractDaysFromDate,
  subtractMonthsFromDate,
  subtractWeeksFromDate,
} from '@utils/helpers';

interface IProps {
  calendarRef: React.RefObject<any>;
  setCalenderType: (calenderType: CalenderType) => void;
  calendarType: CalenderType;
  setDate: (date: number) => void;
  selectedDate: number;
  handleCreateMeet: (date: Date) => void;
}

export const CalenderViewIconMap = {
  [FCCalenderType.DAY]: <Rows weight="bold" size={16} />,
  [FCCalenderType.WEEK]: <GridFour weight="bold" size={16} />,
  [FCCalenderType.MONTH]: <GridNine weight="bold" size={16} />,
  [FCCalenderType.LIST]: <ListBullets weight="bold" size={16} />,
};

export const CustomToolbar = ({
  calendarRef,
  setCalenderType,
  setDate,
  handleCreateMeet,
  calendarType,
  selectedDate,
}: IProps) => {
  if (!calendarRef.current) return;

  const date = new Date(selectedDate);

  const handleToday = () => {
    calendarRef.current.getApi().today();
    setDate(Date.now());
  };

  const handlePrev = () => {
    let prevDate = date;
    if (calendarType === CalenderType.DAY) {
      calendarRef.current.getApi().prev();
      prevDate = subtractDaysFromDate(prevDate, 1);
    } else if (calendarType === CalenderType.WEEK || calendarType === CalenderType.LIST) {
      prevDate = subtractWeeksFromDate(prevDate, 1);
      calendarRef.current.getApi().gotoDate(prevDate);
    } else if (calendarType === CalenderType.MONTH) {
      prevDate = subtractMonthsFromDate(prevDate, 1);
      calendarRef.current.getApi().gotoDate(prevDate);
    }
    setDate(Date.parse(prevDate.toISOString()));
  };

  const handleNext = () => {
    let nextDate = date;
    if (calendarType === CalenderType.DAY) {
      calendarRef.current.getApi().next();
      nextDate = addDaysToDate(nextDate, 1);
    } else if (calendarType === CalenderType.WEEK || calendarType === CalenderType.LIST) {
      nextDate = addWeeksToDate(nextDate, 1);
      calendarRef.current.getApi().gotoDate(nextDate);
    } else if (calendarType === CalenderType.MONTH) {
      nextDate = addMonthsToDate(nextDate, 1);
      calendarRef.current.getApi().gotoDate(nextDate);
    }
    setDate(Date.parse(nextDate.toISOString()));
  };

  const handleViewChange = (view: FCCalenderType) => {
    calendarRef.current.getApi().changeView(view);
    setCalenderType(CalenderTypeMap[view]);
  };

  const viewItems = Object.values(FCCalenderType).map((view) => ({
    label: capitalize(CalenderTypeMap[view]),
    onClick: () => handleViewChange(view),
    icon: CalenderViewIconMap[view],
  }));

  return (
    <div className="flex items-center justify-between pb-3 md:pb-3">
      <div className="flex md:justify-start flex-col md:flex-row md:items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          <button onClick={handleToday} className="px-4 py-1 md:py-2 text-sm bg-color-light font-medium">
            Today
          </button>
          <button className="p-1 rounded hover:bg-background-secondary" onClick={handlePrev}>
            <CaretLeft className="w-5 h-5" />
          </button>
          <button className="p-1 rounded hover:bg-background-secondary" onClick={handleNext}>
            <CaretRight className="w-5 h-5" />
          </button>
          <div className="font-semibold text-md md:text-lg truncate max-w-[120px] md:max-w-full">
            {calendarType === CalenderType.DAY ? (
              <div className="flex gap-3 items-center">
                <p>{getFormattedDate(date, 'D MMMM YYYY')}</p>
              </div>
            ) : calendarType === CalenderType.WEEK ? (
              getFormattedDate(getStartOfWeek(date), 'MMM D') +
              ' - ' +
              getFormattedDate(getEndOfWeek(date), 'MMM D, YYYY')
            ) : calendarType === CalenderType.MONTH ? (
              getFormattedDate(date, 'MMMM YYYY')
            ) : calendarType === CalenderType.LIST ? (
              getFormattedDate(getStartOfWeek(date), 'MMM D') +
              ' - ' +
              getFormattedDate(getEndOfWeek(date), 'MMM D, YYYY')
            ) : (
              ''
            )}
          </div>
        </div>
        <div className="w-full flex justify-between md:justify-end items-center gap-3 md:gap-5">
          <Button leftsection={<Plus weight="bold" size={16} />} onClick={() => handleCreateMeet(date)}>
            <span className="block md:block">Create</span>
          </Button>
          <div className="flex items-center gap-2 md:gap-2">
            <Dropdown menuItems={viewItems} selected={capitalize(calendarType)} />
            <Menu menuItems={[]} className="px-1.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
