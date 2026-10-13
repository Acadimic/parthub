import { Popover } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { isVideoAttachment } from '@repo/shared/utils';
import { type ILessonPage } from '@interfaces';
import { CheckIcon, FilmStripIcon, PaperclipIcon } from '@phosphor-icons/react';
import { type IMaterial, useCourseLookups } from '@stores';

const PageIcon = ({ page }: { page: ILessonPage }) => {
  if (page.kind === 'section') return null;
  const Icon = isVideoAttachment(page.attachment) ? FilmStripIcon : PaperclipIcon;
  return <Icon weight="bold" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />;
};

/** A page's marker on the path: done, the one in hand, or still ahead. */
const PathNode = ({ index, isViewed, isCurrent }: { index: number; isViewed: boolean; isCurrent: boolean }) => (
  <span
    className={cn(
      'relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-xxs ring-2 ring-background transition-colors',
      isCurrent && 'bg-primary text-primary-foreground shadow-[0_0_0_3px] shadow-primary/25',
      !isCurrent && isViewed && 'bg-success text-success-foreground',
      !isCurrent && !isViewed && 'bg-muted text-muted-foreground',
    )}
  >
    {isViewed && !isCurrent ? <CheckIcon weight="bold" className="h-3 w-3" /> : index + 1}
  </span>
);

interface ITopicPathProps {
  material: IMaterial;
  pages: ILessonPage[];
  pageIndex: number;
  onPick: (index: number) => void;
}

/**
 * The lesson's pages as a path: a line through every page with the ones done ticked, the current
 * one lit, and a tap on any of them jumping there.
 */
export const TopicPath = ({ material, pages, pageIndex, onPick }: ITopicPathProps) => {
  const { isLessonPageViewed } = useCourseLookups();
  return (
    <ol className="relative max-h-[60vh] overflow-y-auto py-1">
      <span aria-hidden="true" className="absolute bottom-4 left-[19px] top-4 w-0.5 bg-border" />
      {pages.map((item, index) => {
        const isCurrent = index === pageIndex;
        return (
          <li key={item.key}>
            <button
              type="button"
              aria-current={isCurrent || undefined}
              className={cn(
                'flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted',
                isCurrent ? 'font-semibold text-primary' : 'text-foreground',
              )}
              onClick={() => onPick(index)}
            >
              <PathNode index={index} isViewed={isLessonPageViewed(material._id, item.key)} isCurrent={isCurrent} />
              <PageIcon page={item} />
              <span className={cn('min-w-0 flex-1 truncate', item.kind === 'section' && item.parentTitle && 'pl-3')}>
                {item.title || material.name}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

interface ITopicPickerProps extends ITopicPathProps {
  /** The control that opens the path; the pager and the full-screen bar each style their own. */
  trigger: React.ReactElement;
  triggerClassName: string;
}

/** The path in a popover above its trigger, closing once a page is picked. */
export const TopicPicker = ({ trigger, triggerClassName, onPick, ...path }: ITopicPickerProps) => (
  <Popover
    triggerClassName={triggerClassName}
    className="w-80 max-w-[calc(100vw-2rem)] p-1"
    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    trigger={trigger}
  >
    {({ handleClose }) => (
      <TopicPath
        {...path}
        onPick={(index) => {
          onPick(index);
          handleClose();
        }}
      />
    )}
  </Popover>
);
