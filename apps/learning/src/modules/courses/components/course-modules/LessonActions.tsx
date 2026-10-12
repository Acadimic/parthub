import { type ReportTarget, ReportDialog } from '@components/app/report';
import { TicketCategory } from '@enums';
import { ChatCircleDotsIcon, DotsThreeIcon, FlagIcon, ShareFatIcon } from '@phosphor-icons/react';
import { Button, Menu, Tooltip } from '@repo/ui/app';
import { useWindowDimensions } from '@hooks/dimensions.hook';
import { type IMaterial, type ITestPaper } from '@stores';
import { useState } from 'react';
import { getPrintMenuItems } from './PrintCourse';
import { shareCourse } from './ShareCourse';

interface IProps {
  courseId: string;
  courseModuleId: string;
  material: IMaterial | undefined;
  testPaper: ITestPaper | undefined;
}

/** Where a doubt or report from the lesson view points: the lesson in the frame, else its test. */
const getWhere = ({ courseId, courseModuleId, material, testPaper }: IProps): Omit<ReportTarget, 'category'> => ({
  course: courseId,
  courseModule: courseModuleId || null,
  material: material?._id ?? null,
  testPaper: material ? null : (testPaper?._id ?? null),
});

/** What each dialog from the lesson view says. */
const DIALOGS = {
  [TicketCategory.DOUBT]: {
    title: (thing: string) => `Ask a doubt about this ${thing}`,
    description: 'Only you and the course team see it. The reply shows under My Reports.',
  },
  [TicketCategory.CONTENT]: {
    title: (thing: string) => `Report a problem with this ${thing}`,
    description: 'Your teacher sees the report and can fix the content. You can follow it under My Reports.',
  },
};

type LessonDialog = keyof typeof DIALOGS;

/** The doubt or report dialog for the lesson in the frame, or nothing while `kind` is null. */
const LessonDialogs = ({ kind, onClose, ...props }: IProps & { kind: LessonDialog | null; onClose: () => void }) => {
  const thing = props.material ? 'lesson' : 'test';
  const copy = DIALOGS[kind ?? TicketCategory.CONTENT];
  return (
    <ReportDialog
      isOpen={Boolean(kind)}
      onClose={onClose}
      target={{ ...getWhere(props), category: kind ?? TicketCategory.CONTENT }}
      title={copy.title(thing)}
      description={copy.description}
    />
  );
};

/**
 * A labelled button, because a learner looking for help should not have to hunt an icon. A phone has
 * no room for it beside the other actions, so there it is an entry in the ⋯ menu instead.
 */
export const AskDoubtButton = (props: IProps) => {
  const { isSmallScreen } = useWindowDimensions();
  const [kind, setKind] = useState<LessonDialog | null>(null);
  if (isSmallScreen) return null;
  return (
    <>
      <Button
        isSecondary
        text="Ask a doubt"
        className="h-9 rounded-full px-3 text-sm"
        leftsection={<ChatCircleDotsIcon weight="bold" className="h-4 w-4" />}
        onClick={() => setKind(TicketCategory.DOUBT)}
      />
      <LessonDialogs {...props} kind={kind} onClose={() => setKind(null)} />
    </>
  );
};

/** The less frequent lesson actions behind one ⋯ button: share, print and report, plus the doubt on a phone. */
export const LessonMoreMenu = (props: IProps) => {
  const { isSmallScreen } = useWindowDimensions();
  const [kind, setKind] = useState<LessonDialog | null>(null);
  const menuItems = [
    ...(isSmallScreen
      ? [
          {
            label: 'Ask a doubt',
            onClick: () => setKind(TicketCategory.DOUBT),
            icon: <ChatCircleDotsIcon weight="bold" className="h-4 w-4" />,
          },
        ]
      : []),
    {
      label: 'Share course',
      onClick: () => shareCourse(props.courseId),
      icon: <ShareFatIcon weight="bold" className="h-4 w-4" />,
    },
    ...getPrintMenuItems(props.courseId, props.courseModuleId, props.testPaper?._id ?? null),
    {
      label: 'Report a problem',
      onClick: () => setKind(TicketCategory.CONTENT),
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
      <LessonDialogs {...props} kind={kind} onClose={() => setKind(null)} />
    </>
  );
};
