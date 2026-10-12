import { ChatCircleDotsIcon, FlagIcon } from '@phosphor-icons/react';
import { TicketCategory } from '@repo/shared/enums';
import { Button, Tooltip } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { useState } from 'react';
import { type ReportTarget, ReportDialog } from './ReportDialog';

interface IProps {
  target: ReportTarget;
  /** The dialog's heading, e.g. "Report this question". */
  title: string;
  description: string;
  /** Shows "Report" (or "Ask a doubt") beside the icon; a dense toolbar shows the icon alone. */
  isLabelled: boolean;
  className?: string;
}

/**
 * Opens the report dialog for one question, lesson or purchase: a flag for a problem, a speech
 * bubble for a doubt.
 */
export const ReportButton = ({ target, title, description, isLabelled, className }: IProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isDoubt = target.category === TicketCategory.DOUBT;
  const Icon = isDoubt ? ChatCircleDotsIcon : FlagIcon;
  const label = isDoubt ? 'Ask a doubt' : 'Report';
  const button = (
    <Button
      isSubtle
      aria-label={title}
      text={isLabelled ? label : undefined}
      className={cn('gap-1.5 text-muted-foreground hover:text-foreground', className)}
      leftsection={<Icon className="h-4 w-4" />}
      onClick={() => setIsOpen(true)}
    />
  );
  return (
    <>
      {isLabelled ? button : <Tooltip title={title}>{button}</Tooltip>}
      <ReportDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        target={target}
        title={title}
        description={description}
      />
    </>
  );
};
