import { type ReportTarget, ReportDialog } from '@components/app/report';
import { CourseOutlineTab, TicketCategory } from '@enums';
import { ChatCircleDotsIcon, DotsThreeIcon, FlagIcon, ShareFatIcon } from '@phosphor-icons/react';
import { Button, Menu, Tooltip } from '@repo/ui/app';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMaterial, type ITestPaper, useSelectorLookups } from '@stores';
import { useState } from 'react';
import { getPrintMenuItems } from './PrintCourse';
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

/** The less frequent lesson actions behind one ⋯ button: share, print and report, plus the doubt on a phone. */
export const LessonMoreMenu = (props: IProps) => {
  const { isSmallScreen } = useWindowDimensions();
  const openDoubts = useOpenDoubts();
  const [isReporting, setIsReporting] = useState(false);
  const menuItems = [
    ...(isSmallScreen
      ? [{ label: 'Ask a doubt', onClick: openDoubts, icon: <ChatCircleDotsIcon weight="bold" className="h-4 w-4" /> }]
      : []),
    {
      label: 'Share course',
      onClick: () => shareCourse(props.courseId),
      icon: <ShareFatIcon weight="bold" className="h-4 w-4" />,
    },
    ...getPrintMenuItems(props.courseId, props.courseModuleId, props.testPaper?._id ?? null),
    {
      label: 'Report a problem',
      onClick: () => setIsReporting(true),
      icon: <FlagIcon weight="bold" className="h-4 w-4" />,
    },
  ];
  return (
    <>
      <Tooltip title="More">
        <Menu
          menuItems={menuItems}
          className="px-0"
          component={
            <span
              role="button"
              aria-label="More actions"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <DotsThreeIcon weight="bold" className="h-5 w-5" />
            </span>
          }
        />
      </Tooltip>
      <ReportLessonDialog {...props} isOpen={isReporting} onClose={() => setIsReporting(false)} />
    </>
  );
};
