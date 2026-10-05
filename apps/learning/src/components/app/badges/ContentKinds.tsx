import { Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { DocumentType } from '@enums';
import {
  BookOpenTextIcon,
  FileTextIcon,
  LinkSimpleIcon,
  type Icon,
  SpeakerHighIcon,
  VideoIcon,
} from '@phosphor-icons/react';
import { type IMaterial } from '@stores';
import { VIDEO_LINK_TYPES } from '@repo/shared/utils';

/** What a lesson is made of. One lesson can hold several: written content plus videos and links. */
export type ContentKind = 'reading' | 'video' | 'document' | 'link' | 'audio';

export interface IContentKind {
  kind: ContentKind;
  count: number;
}

interface IKindStyle {
  icon: Icon;
  /** Text colour, for the outline's bare icons. */
  text: string;
  /** Tinted chip, for the lesson header. */
  chip: string;
  label: (count: number) => string;
}

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`;

/** Reading and video keep their kind's colour from `ContentTypeBadge`; the rest borrow theme tones. */
const KIND_STYLES: Record<ContentKind, IKindStyle> = {
  reading: {
    icon: BookOpenTextIcon,
    text: 'text-content-reading',
    chip: 'bg-content-reading/15 text-content-reading border-content-reading/25',
    label: () => 'Reading lesson',
  },
  video: {
    icon: VideoIcon,
    text: 'text-content-video',
    chip: 'bg-content-video/15 text-content-video border-content-video/25',
    label: (count) => plural(count, 'video', 'videos'),
  },
  document: {
    icon: FileTextIcon,
    text: 'text-chart-3',
    chip: 'bg-chart-3/15 text-chart-3 border-chart-3/25',
    label: (count) => plural(count, 'document', 'documents'),
  },
  link: {
    icon: LinkSimpleIcon,
    text: 'text-info',
    chip: 'bg-info/15 text-info border-info/25',
    label: (count) => plural(count, 'link', 'links'),
  },
  audio: {
    icon: SpeakerHighIcon,
    text: 'text-chart-5',
    chip: 'bg-chart-5/15 text-chart-5 border-chart-5/25',
    label: (count) => plural(count, 'audio clip', 'audio clips'),
  },
};

const KIND_ORDER: ContentKind[] = ['reading', 'video', 'document', 'link', 'audio'];

/** Every kind of content in a material, in a fixed order, with how many of each. */
export const getMaterialKinds = (material: IMaterial): IContentKind[] => {
  const counts: Record<ContentKind, number> = {
    reading: material.content ? 1 : 0,
    video: 0,
    document: 0,
    link: 0,
    audio: 0,
  };
  (material.attachments ?? []).forEach((attachment) => {
    if (attachment.documentType === DocumentType.VIDEO) counts.video += 1;
    else if (attachment.documentType === DocumentType.AUDIO) counts.audio += 1;
    else if (attachment.documentType === DocumentType.FILE) counts.document += 1;
    else if (attachment.linkType && VIDEO_LINK_TYPES.includes(attachment.linkType)) counts.video += 1;
    else counts.link += 1;
  });
  return KIND_ORDER.filter((kind) => counts[kind] > 0).map((kind) => ({ kind, count: counts[kind] }));
};

interface IProps {
  kinds: IContentKind[];
  /** `xs` sits in the outline row's meta line; `sm` is a row of chips in the lesson header. */
  size: 'xs' | 'sm';
  className?: string;
}

/** One icon per kind of content in a lesson, each naming itself in a tooltip. */
export const ContentKinds = ({ kinds, size, className }: IProps) => (
  <span className={cn('flex shrink-0 items-center', size === 'xs' ? 'gap-1' : 'gap-1.5', className)}>
    {kinds.map(({ kind, count }) => {
      const style = KIND_STYLES[kind];
      const KindIcon = style.icon;
      const label = style.label(count);
      return (
        <Tooltip key={kind} title={label}>
          {size === 'xs' ? (
            <KindIcon weight="bold" aria-label={label} className={cn('h-3 w-3', style.text)} />
          ) : (
            <span
              aria-label={label}
              className={cn('flex h-6 w-6 items-center justify-center rounded-md border', style.chip)}
            >
              <KindIcon weight="bold" className="h-3.5 w-3.5" />
            </span>
          )}
        </Tooltip>
      );
    })}
  </span>
);
