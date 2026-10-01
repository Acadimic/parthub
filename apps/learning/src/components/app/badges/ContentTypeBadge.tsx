import { cn } from '@repo/ui/lib';
import { ModuleContentType } from '@enums';
import { BookOpenTextIcon, CheckIcon, ClipboardTextIcon, VideoIcon } from '@phosphor-icons/react';

export const CONTENT_TYPE_ICONS = {
  [ModuleContentType.VIDEO]: VideoIcon,
  [ModuleContentType.READING]: BookOpenTextIcon,
  [ModuleContentType.TEST_PAPER]: ClipboardTextIcon,
  [ModuleContentType.COMPLETED]: CheckIcon,
};

/**
 * Each kind's colour, in every shape it takes: the soft tint and solid fill of the outline's row
 * marks, the micro pill under a row, and the regular badge over the lesson. One place, so the kind
 * looks the same wherever it is named. Written out in full so Tailwind's purge keeps every class.
 */
export const CONTENT_TYPE_TONES = {
  [ModuleContentType.VIDEO]: {
    soft: 'bg-content-video/15 text-content-video ring-1 ring-inset ring-content-video/25',
    solid: 'bg-content-video text-content-video-foreground',
    pill: 'bg-content-video/10 text-content-video',
    badge: 'bg-content-video/15 text-content-video border-content-video/25',
  },
  [ModuleContentType.READING]: {
    soft: 'bg-content-reading/15 text-content-reading ring-1 ring-inset ring-content-reading/25',
    solid: 'bg-content-reading text-content-reading-foreground',
    pill: 'bg-content-reading/10 text-content-reading',
    badge: 'bg-content-reading/15 text-content-reading border-content-reading/25',
  },
  [ModuleContentType.TEST_PAPER]: {
    soft: 'bg-content-test/15 text-content-test ring-1 ring-inset ring-content-test/25',
    solid: 'bg-content-test text-content-test-foreground',
    pill: 'bg-content-test/10 text-content-test',
    badge: 'bg-content-test/15 text-content-test border-content-test/25',
  },
  [ModuleContentType.COMPLETED]: {
    soft: 'bg-muted text-muted-foreground',
    solid: 'bg-primary text-primary-foreground',
    pill: 'bg-muted text-muted-foreground',
    badge: 'bg-muted text-muted-foreground border-border',
  },
};

interface IProps {
  type: ModuleContentType;
  /** `xs` is the micro label under an outline row; `sm` is a regular pill carrying the kind's icon. */
  size: 'xs' | 'sm';
  className?: string;
}

/** Names a lesson's kind in that kind's colour, matching the outline's row marks. */
export const ContentTypeBadge = ({ type, size, className }: IProps) => {
  if (size === 'xs') {
    return (
      <span
        className={cn(
          'px-1 py-0.5 text-[0.5625rem] font-semibold uppercase leading-none tracking-caps',
          CONTENT_TYPE_TONES[type].pill,
          className,
        )}
      >
        {type}
      </span>
    );
  }
  const Icon = CONTENT_TYPE_ICONS[type];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium capitalize',
        CONTENT_TYPE_TONES[type].badge,
        className,
      )}
    >
      <Icon weight="bold" className="h-3 w-3" />
      {type}
    </span>
  );
};
