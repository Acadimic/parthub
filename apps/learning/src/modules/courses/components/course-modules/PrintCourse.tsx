import { BookOpenTextIcon, CaretDownIcon, ClipboardTextIcon, PrinterIcon, StackIcon } from '@phosphor-icons/react';
import { Button, Menu, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMenuItem } from '@repo/ui/types';
import { useSelectorStore } from '@stores';

/** A printout opens in a tab of its own, where the print dialog opens by itself. */
const openPrint = (path: string) => window.open(path, '_blank');

/**
 * What can be printed from the lesson view: the whole course, the module on screen, or the quiz on
 * screen — after reading the whole course as pages on screen, which is the same document without
 * the paper. `courseModuleId` is '' before a module is selected; `testPaperId` is null on a lesson.
 */
export const getPrintMenuItems = (
  courseId: string,
  courseModuleId: string,
  testPaperId: string | null,
): IMenuItem[] => {
  const base = `/courses/${courseId}/print`;
  return [
    {
      label: 'Read whole course',
      onClick: () => useSelectorStore.getState().setIsCourseBookOpen(true),
      icon: <BookOpenTextIcon weight="bold" className="h-4 w-4" />,
    },
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
