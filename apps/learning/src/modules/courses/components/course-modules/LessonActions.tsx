import { type ReportTarget, ReportDialog } from '@components/app/report';
import { CourseOutlineTab, TicketCategory } from '@enums';
import { ChatCircleDotsIcon, DotsThreeIcon, FlagIcon, PrinterIcon, ShareFatIcon } from '@phosphor-icons/react';
import { Button, Menu, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMaterial, type ITestPaper, useSelectorLookups } from '@stores';
import { useState } from 'react';
import { type ILessonMenuItem, READ_COURSE_ITEM, getPrintOnlyItems } from './PrintCourse';
import { shareCourse } from './ShareCourse';

interface IProps {
  courseId: string;
  courseModuleId: string;
  material: IMaterial | undefined;
  testPaper: ITestPaper | undefined;
}

/** Where a report from the lesson view points: the lesson in the frame, else its test. */
const getWhere = ({ courseId, courseModuleId, material, testPaper }: IProps): Omit<ReportTarget, 'category'> => ({
  course: courseId,
  courseModule: courseModuleId || null,
  material: material?._id ?? null,
  testPaper: material ? null : (testPaper?._id ?? null),
});

/** The report dialog for the lesson in the frame. */
const ReportLessonDialog = ({ isOpen, onClose, ...props }: IProps & { isOpen: boolean; onClose: () => void }) => (
  <ReportDialog
    isOpen={isOpen}
    onClose={onClose}
    target={{ ...getWhere(props), category: TicketCategory.CONTENT }}
    title={`Report a problem with this ${props.material ? 'lesson' : 'test'}`}
    description="Your teacher sees the report and can fix the content. You can follow it under My Reports."
  />
);

/**
 * Opens the outline pane on its Doubts tab, where the doubt is written: unfolds the pane where it
 * is inline, opens the contents drawer where it is not. The split is the `lg` breakpoint the
 * learning view lays the pane out on, not the toolbar's own small-screen cutoff.
 */
const useOpenDoubts = () => {
  const { setSelectedCourseOutlineTab, setIsCourseOutlineHidden, setIsCourseMenuOpen } = useSelectorLookups();
  return () => {
    setSelectedCourseOutlineTab(CourseOutlineTab.DOUBTS);
    if (window.matchMedia('(min-width: 1024px)').matches) setIsCourseOutlineHidden(false);
    else setIsCourseMenuOpen(true);
  };
};

/**
 * A labelled button, because a learner looking for help should not have to hunt an icon. A phone has
 * no room for it beside the other actions, so there it is an entry in the ⋯ menu instead.
 */
export const AskDoubtButton = () => {
  const { isSmallScreen } = useWindowDimensions();
  const openDoubts = useOpenDoubts();
  if (isSmallScreen) return null;
  return (
    <Button
      isSecondary
      text="Ask a doubt"
      className="h-9 rounded-full px-3 text-sm"
      leftsection={<ChatCircleDotsIcon weight="bold" className="h-4 w-4" />}
      onClick={openDoubts}
    />
  );
};

/** A round icon button the size of the reactions beside it. */
const ICON_BUTTON_CLASS =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground';

/** One lesson action as an icon button, named by its tooltip. */
const LessonActionButton = ({ item }: { item: ILessonMenuItem }) => (
  <Tooltip title={item.label}>
    <Button
      isRound
      isSubtle
      aria-label={item.label}
      className={cn(ICON_BUTTON_CLASS, 'p-0')}
      onClick={() => item.onClick()}
      leftsection={item.icon}
    />
  </Tooltip>
);

/**
 * The less frequent lesson actions: share, read, print and report. Where the toolbar has room they
 * are icon buttons beside the reactions; otherwise they sit behind one ⋯ button, and on a phone the
 * doubt joins them.
 */
export const LessonMoreMenu = (props: IProps) => {
  const { isSmallScreen, width } = useWindowDimensions();
  const { isCourseOutlineHidden } = useSelectorLookups();
  // From `lg` the outline pane takes 360px beside the lesson, and below 1200 the buttons would push
  // full screen off the toolbar; folding the pane, or a wider screen, makes the room again.
  const hasRoom = !isSmallScreen && (width < 1024 || width >= 1200 || isCourseOutlineHidden);
  const openDoubts = useOpenDoubts();
  const [isReporting, setIsReporting] = useState(false);
  const shareItem: ILessonMenuItem = {
    label: 'Share course',
    onClick: () => shareCourse(props.courseId),
    icon: <ShareFatIcon weight="bold" className="h-4 w-4" />,
  };
  const reportItem: ILessonMenuItem = {
    label: 'Report a problem',
    onClick: () => setIsReporting(true),
    icon: <FlagIcon weight="bold" className="h-4 w-4" />,
  };
  const printItems = getPrintOnlyItems(props.courseId, props.courseModuleId, props.testPaper?._id ?? null);
  const reportDialog = <ReportLessonDialog {...props} isOpen={isReporting} onClose={() => setIsReporting(false)} />;

  if (hasRoom) {
    // The print choices share one printer icon, so the toolbar holds one button per kind of action.
    return (
      <>
        <LessonActionButton item={shareItem} />
        <LessonActionButton item={READ_COURSE_ITEM} />
        <Tooltip title="Print">
          <Menu
            menuItems={printItems}
            className="px-0"
            component={
              <span role="button" aria-label="Print" className={ICON_BUTTON_CLASS}>
                <PrinterIcon weight="bold" className="h-4 w-4" />
              </span>
            }
          />
        </Tooltip>
        <LessonActionButton item={reportItem} />
        {reportDialog}
      </>
    );
  }

  const menuItems: ILessonMenuItem[] = [
    ...(isSmallScreen
      ? [{ label: 'Ask a doubt', onClick: openDoubts, icon: <ChatCircleDotsIcon weight="bold" className="h-4 w-4" /> }]
      : []),
    shareItem,
    READ_COURSE_ITEM,
    ...printItems,
    reportItem,
  ];

  return (
    <>
      <Tooltip title="More">
        <Menu
          menuItems={menuItems}
          className="px-0"
          component={
            <span role="button" aria-label="More actions" className={ICON_BUTTON_CLASS}>
              <DotsThreeIcon weight="bold" className="h-5 w-5" />
            </span>
          }
        />
      </Tooltip>
      {reportDialog}
    </>
  );
};
