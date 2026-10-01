import { WarningCircleIcon, XCircleIcon } from '@phosphor-icons/react';
import { cn } from '@repo/ui/lib';
import { type IAiIssue } from '@utils/ai/common';

/** What is wrong with a model's reply, errors in red and warnings in amber, each pointing at its ref. */
export const AiIssueList = ({ issues }: { issues: IAiIssue[] }) => (
  <ul className="flex flex-col gap-1">
    {issues.map((issue, index) => (
      <li
        key={`${issue.path}-${index}`}
        className={cn(
          'flex items-start gap-2 rounded-md px-2.5 py-1.5 text-xs',
          issue.level === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-warning/15 text-foreground',
        )}
      >
        {issue.level === 'error' ? (
          <XCircleIcon weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : (
          <WarningCircleIcon weight="fill" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        )}
        <span>
          <span className="font-mono font-semibold">{issue.path}</span> — {issue.message}
        </span>
      </li>
    ))}
  </ul>
);
