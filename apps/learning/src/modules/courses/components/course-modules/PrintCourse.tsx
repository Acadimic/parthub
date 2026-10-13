import { Button, Menu } from '@repo/ui/app';
import { ClipboardTextIcon, PrinterIcon, StackIcon } from '@phosphor-icons/react';
import { type IMenuItem } from '@repo/ui/types';

/** A printout opens in a tab of its own, where the print dialog opens by itself. */
const openPrint = (path: string) => window.open(path, '_blank');

/**
 * What can be printed from the lesson view: the whole course, the module on screen, or the quiz on
 * screen. `courseModuleId` is '' before a module is selected; `testPaperId` is null on a lesson.
 */
export const getPrintMenuItems = (
  courseId: string,
  courseModuleId: string,
  testPaperId: string | null,
): IMenuItem[] => {
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

/**
 * A visible way to print from the learning view's top bar, opening the same choices as the
 * lesson's ⋯ menu. The word hides on a phone, where the printer alone says it.
 */
export const PrintButton = ({
  courseId,
  courseModuleId,
  testPaperId,
}: {
  courseId: string;
  courseModuleId: string;
  testPaperId: string | null;
}) => (
  <Menu
    menuItems={getPrintMenuItems(courseId, courseModuleId, testPaperId)}
    className="px-0"
    component={
      <Button
        isSecondary
        aria-label="Print"
        className="px-3 py-1.5"
        labelClassName="hidden sm:block"
        leftsection={<PrinterIcon weight="bold" className="h-4 w-4" />}
      >
        Print
      </Button>
    }
  />
);
