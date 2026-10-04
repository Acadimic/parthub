import { Menu, Tooltip } from '@repo/ui/app';
import { BookOpenIcon, ClipboardTextIcon, PrinterIcon, StackIcon } from '@phosphor-icons/react';

interface IProps {
  courseId: string;
  /** The module on screen, or '' when none is selected yet. */
  courseModuleId: string;
  /** The quiz on screen, or null when a lesson is open. */
  testPaperId: string | null;
}

/** A printout opens in a tab of its own, where the print dialog opens by itself. */
const openPrint = (path: string) => window.open(path, '_blank');

/** The print menu: the whole course, the module on screen, or the quiz on screen. */
export const PrintCourse = ({ courseId, courseModuleId, testPaperId }: IProps) => {
  const base = `/courses/${courseId}/print`;
  const menuItems = [
    {
      label: 'Print course',
      onClick: () => openPrint(base),
      icon: <BookOpenIcon weight="bold" className="h-4 w-4" />,
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
  return (
    <Tooltip title="Print">
      <Menu
        menuItems={menuItems}
        className="px-0"
        component={
          <span
            role="button"
            aria-label="Print"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PrinterIcon weight="bold" className="h-4 w-4" />
          </span>
        }
      />
    </Tooltip>
  );
};
