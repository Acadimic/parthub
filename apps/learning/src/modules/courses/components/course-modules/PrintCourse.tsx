import { BookOpenTextIcon, CaretDownIcon, ClipboardTextIcon, PrinterIcon, StackIcon } from '@phosphor-icons/react';
import { Button, Menu, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMenuItem } from '@repo/ui/types';
import { openCourseBook } from '@utils/course-book';
import { type ReactNode } from 'react';

/** A lesson action with a fixed label and icon, so it can be drawn as a button as well as a menu entry. */
export interface ILessonMenuItem extends IMenuItem {
  label: string;
  icon: ReactNode;
}

/** A printout opens in a tab of its own, where the print dialog opens by itself. */
const openPrint = (path: string) => window.open(path, '_blank');

/** Reading the whole course as pages: the printout's document on screen, without the paper. */
export const READ_COURSE_ITEM: ILessonMenuItem = {
  label: 'Read whole course',
  onClick: openCourseBook,
  icon: <BookOpenTextIcon weight="bold" className="h-4 w-4" />,
};

/**
 * What can be printed from the lesson view: the whole course, the module on screen, or the quiz on
 * screen. `courseModuleId` is '' before a module is selected; `testPaperId` is null on a lesson.
 */
export const getPrintOnlyItems = (
  courseId: string,
  courseModuleId: string,
  testPaperId: string | null,
): ILessonMenuItem[] => {
  const base = `/courses/${courseId}/print`;
  return [
    {
      label: 'Print course',
      onClick: () => openPrint(base),
      icon: <PrinterIcon weight="bold" className="h-4 w-4" />,
    },
    ...(courseModuleId
      ? [
          {
            label: 'Print this module',
            onClick: () => openPrint(`${base}?module=${courseModuleId}`),
            icon: <StackIcon weight="bold" className="h-4 w-4" />,
          },
        ]
      : []),
    ...(testPaperId
      ? [
          {
            label: 'Print this quiz',
            onClick: () => openPrint(`${base}?quiz=${testPaperId}`),
            icon: <ClipboardTextIcon weight="bold" className="h-4 w-4" />,
          },
        ]
      : []),
  ];
};

/** The print choices led by reading the whole course, for a menu that holds them all. */
export const getPrintMenuItems = (
  courseId: string,
  courseModuleId: string,
  testPaperId: string | null,
): ILessonMenuItem[] => [READ_COURSE_ITEM, ...getPrintOnlyItems(courseId, courseModuleId, testPaperId)];

/**
 * A visible way to print from the learning view's top bar: a soft pill in the primary tone with
 * the duotone printer, the word, and a caret for the choices behind it — the same ones as the
 * lesson's ⋯ menu. On a phone it is the printer alone, in a circle: a hidden label would still
 * keep its slot and push the icon off centre.
 */
export const PrintButton = ({
  courseId,
  courseModuleId,
  testPaperId,
}: {
  courseId: string;
  courseModuleId: string;
  testPaperId: string | null;
}) => {
  const { isSmallScreen } = useWindowDimensions();
  const pill =
    'bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 transition-colors hover:bg-primary/15 hover:text-primary';
  return (
    <Tooltip title="Print the course, this module or this quiz">
      <Menu
        menuItems={getPrintMenuItems(courseId, courseModuleId, testPaperId)}
        className="px-0"
        component={
          isSmallScreen ? (
            <Button
              isSubtle
              isRound
              aria-label="Print"
              className={cn('h-8 w-8 p-0', pill)}
              leftsection={<PrinterIcon weight="duotone" className="h-[18px] w-[18px]" />}
            />
          ) : (
            <Button
              isSubtle
              isRound
              aria-label="Print"
              className={cn('h-8 px-2.5 text-xs font-semibold', pill)}
              leftsection={<PrinterIcon weight="duotone" className="h-[18px] w-[18px]" />}
              rightsection={<CaretDownIcon weight="bold" className="h-3 w-3 opacity-70" />}
            >
              Print
            </Button>
          )
        }
      />
    </Tooltip>
  );
};
