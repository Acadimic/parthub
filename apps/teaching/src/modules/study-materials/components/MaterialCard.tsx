import { type MaterialDto } from '@repo/shared/contracts';
import {
  CaretDownIcon,
  ClockIcon,
  PaperclipIcon,
  PencilSimpleIcon,
  SparkleIcon,
  TrashIcon,
  WrenchIcon,
} from '@phosphor-icons/react';
import { Collapse, Menu } from '@repo/ui/app';
import { Badge } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { memo, useState } from 'react';
import { StudyMaterialView } from './StudyMaterialView';

interface IProps {
  material: MaterialDto;
  /** 1-based position on the page. */
  number: number;
  isExpanded: boolean;
  /** Take their subject rather than being bound per row, so the memo below holds. */
  onToggle: (materialId: string) => void;
  onEdit: (material: MaterialDto) => void;
  onGenerate: (material: MaterialDto) => void;
  /** Re-reads the content for equations that arrived broken, and saves the fixed version. */
  onRepair: (material: MaterialDto) => void;
  onDelete: (material: MaterialDto) => void;
}

/**
 * One piece of content: a header line that reads at a glance, and the content itself underneath
 * once opened. Same shape as a question card on a paper, so the two pages feel like one app.
 */
export const MaterialCard = memo(function MaterialCard({
  material,
  number,
  isExpanded,
  onToggle,
  onEdit,
  onGenerate,
  onRepair,
  onDelete,
}: IProps) {
  const attachmentCount = (material.attachments ?? []).length;
  // `Collapse` renders its children open or shut, so the content mounts on first expand and stays.
  // Derived during render: `Collapse` measures in an effect, and a later mount measures as nothing.
  const [hasOpened, setHasOpened] = useState(isExpanded);
  if (isExpanded && !hasOpened) setHasOpened(true);

  return (
    <article
      className={cn(
        'relative rounded-lg border bg-background transition-colors',
        isExpanded ? 'border-primary/40' : 'border-border',
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(material._id)}
        aria-expanded={isExpanded}
        className="flex w-full flex-col gap-1.5 rounded-lg px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex w-full items-start gap-2">
          <span className="whitespace-nowrap text-xs font-semibold uppercase leading-5 tracking-caps text-primary">
            Content {number}
          </span>
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
            {material.type ? (
              <Badge tone="neutral" appearance="soft" className="px-1.5 py-0 text-xxs capitalize">
                {material.type}
              </Badge>
            ) : null}
            <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
              <ClockIcon className="h-3 w-3" />
              {material.durationMins ?? 0} min
            </span>
            <span className="inline-flex items-center gap-1 text-xxs text-muted-foreground">
              <PaperclipIcon className="h-3 w-3" />
              {attachmentCount} {attachmentCount === 1 ? 'attachment' : 'attachments'}
            </span>
          </span>
          <CaretDownIcon
            className={cn(
              'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              isExpanded && 'rotate-180',
            )}
            weight="bold"
          />
          {/* A spacer the width of the menu trigger, so the caret is not hidden under it. */}
          <span className="w-7 shrink-0" aria-hidden="true" />
        </span>
        <span className="block text-base font-semibold leading-6 text-foreground">{material.name}</span>
      </button>
      {/* Over the header row's spacer: a menu inside the toggle button would nest interactive elements. */}
      <div className="absolute right-3 top-2.5">
        <Menu
          menuItems={[
            {
              label: 'Edit content',
              onClick: () => onEdit(material),
              icon: <PencilSimpleIcon weight="bold" className="h-4 w-4" />,
            },
            {
              label: 'Generate from document',
              onClick: () => onGenerate(material),
              icon: <SparkleIcon weight="bold" className="h-4 w-4" />,
            },
            {
              label: 'Repair equations',
              onClick: () => onRepair(material),
              icon: <WrenchIcon weight="bold" className="h-4 w-4" />,
            },
            {
              label: 'Delete content',
              onClick: () => onDelete(material),
              icon: <TrashIcon weight="bold" className="h-4 w-4" />,
            },
          ]}
          className="px-1"
        />
      </div>
      <Collapse isOpen={isExpanded}>
        {hasOpened ? (
          <div className="border-t border-border px-4 py-4">
            <StudyMaterialView material={material} />
          </div>
        ) : null}
      </Collapse>
    </article>
  );
});
