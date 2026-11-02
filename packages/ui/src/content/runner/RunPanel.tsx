import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  CheckIcon,
  CircleNotchIcon,
  PencilSimpleIcon,
  PlayIcon,
  StopIcon,
  WarningIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { Button } from '../../core/Button';
import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';
import { Textarea } from '../../ui/textarea';
import type { IRunResult } from './run-result';

export type RunStatus = 'idle' | 'loading' | 'running' | 'done';

/** The classes every button in a code block's header shares. */
export const HEADER_BUTTON =
  'flex h-7 shrink-0 items-center justify-center gap-1 bg-transparent px-2 text-xs font-semibold text-code-header-foreground hover:bg-code hover:text-code-foreground';

interface IRunButtonsProps {
  isEdited: boolean;
  isEditing: boolean;
  isBusy: boolean;
  onReset: () => void;
  onToggleEdit: () => void;
  onRun: () => void;
  onStop: () => void;
}

/** Reset (once the code is changed), Edit and Run or Stop, for a code block's header. */
export const RunButtons = ({ isEdited, isEditing, isBusy, onReset, onToggleEdit, onRun, onStop }: IRunButtonsProps) => (
  <>
    {isEdited ? (
      <Tooltip title="Back to the lesson's code">
        <Button isSubtle aria-label="Reset code" onClick={onReset} className={HEADER_BUTTON}>
          <ArrowCounterClockwiseIcon className="h-4 w-4" />
        </Button>
      </Tooltip>
    ) : null}
    <Tooltip title={isEditing ? 'Done editing' : 'Edit the code'}>
      <Button
        isSubtle
        aria-label={isEditing ? 'Done editing' : 'Edit the code'}
        onClick={onToggleEdit}
        className={HEADER_BUTTON}
      >
        {isEditing ? <CheckIcon weight="bold" className="h-4 w-4" /> : <PencilSimpleIcon className="h-4 w-4" />}
      </Button>
    </Tooltip>
    <Button
      isSubtle
      aria-label={isBusy ? 'Stop' : 'Run the code'}
      onClick={isBusy ? onStop : onRun}
      className={HEADER_BUTTON}
      leftSection={
        isBusy ? (
          <StopIcon weight="fill" className="h-4 w-4 text-code-meta" />
        ) : (
          <PlayIcon weight="fill" className="h-4 w-4 text-code-string" />
        )
      }
      text={isBusy ? 'Stop' : 'Run'}
    />
  </>
);

/** The values a program reads with input() or prompt(), one per line. */
export const RunInput = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
  <div className="border-t border-code-header px-3 py-2">
    <span className="text-xs font-semibold uppercase tracking-caps text-code-header-foreground">Input</span>
    <Textarea
      aria-label="Program input, one value per line"
      placeholder="One value per line, in the order the program asks"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={2}
      className="mt-1 min-h-0 border-code-header bg-code font-mono text-xs text-code-foreground placeholder:text-code-comment sm:text-sm"
    />
  </div>
);

const STATUS_TEXT: Record<RunStatus, string> = {
  idle: '',
  loading: 'Loading Python (first run only)…',
  running: 'Running…',
  done: '',
};

type Outcome = 'busy' | 'ok' | 'error' | 'stopped';

/** How a run ended, which colours the panel's edge and icon. */
const OUTCOME = {
  busy: {
    label: '',
    edge: 'border-l-code-comment',
    icon: CircleNotchIcon,
    iconClass: 'animate-spin text-code-comment',
  },
  ok: { label: 'Ran', edge: 'border-l-code-string', icon: CheckCircleIcon, iconClass: 'text-code-string' },
  error: { label: 'Error', edge: 'border-l-code-meta', icon: XCircleIcon, iconClass: 'text-code-meta' },
  stopped: { label: 'Stopped', edge: 'border-l-code-type', icon: WarningIcon, iconClass: 'text-code-type' },
} as const;

const outcomeOf = (status: RunStatus, result: IRunResult | null): Outcome => {
  if (!result || status !== 'done') return 'busy';
  if (result.isStopped) return 'stopped';
  return result.error ? 'error' : 'ok';
};

/**
 * What the learner's run printed, its error and whether it was stopped. It shares an Output block's
 * header bar, but sits on a recessed surface with its left edge and icon coloured by how the run ended.
 */
export const RunResult = ({ status, result }: { status: RunStatus; result: IRunResult | null }) => {
  const outcome = OUTCOME[outcomeOf(status, result)];
  const Icon = outcome.icon;
  return (
    <div className={cn('border-l-4 border-t border-t-code-header bg-code-header/40', outcome.edge)} aria-live="polite">
      <div className="flex items-center gap-2 bg-code-header px-3 py-1.5 text-code-header-foreground">
        <Icon weight="fill" className={cn('h-4 w-4 shrink-0', outcome.iconClass)} />
        <span className="text-xs font-semibold uppercase tracking-caps">Result</span>
        <span className="text-xs">{STATUS_TEXT[status] || outcome.label}</span>
      </div>
      {result ? (
        <pre className="overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-relaxed sm:text-sm">
          {result.stdout.replace(/\n+$/, '')}
          {result.error ? <span className="block text-code-meta">{result.error}</span> : null}
          {result.isStopped ? (
            <span className="block text-code-type">Stopped: it ran too long. Does a loop never end?</span>
          ) : null}
          {!result.stdout && !result.error && !result.isStopped ? (
            <span className="text-code-comment">(nothing printed)</span>
          ) : null}
        </pre>
      ) : null}
    </div>
  );
};
