import {
  ArrowCounterClockwiseIcon,
  CrosshairIcon,
  DownloadSimpleIcon,
  PauseIcon,
  PlayIcon,
} from '@phosphor-icons/react';
import { formatGraphNumber } from '@repo/shared/utils';
import { Button } from '../core/Button';
import { Progress } from '../core/Progress';
import { Spinner } from '../core/Spinner';
import { Tooltip } from '../core/Tooltip';
import { cn } from '../lib/cn';
import { GIF_RECORDING_SHARE } from './gif';
import type { IStagePoint } from './stage';

/** The pieces the graph viewer and the 3D scene viewer share: toolbar, read-out, progress, titles. */

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{children}</p>
);

/** Reads a token's colour off a hidden element, so the WebGL lines follow the page's theme. */
export const readColour = (element: HTMLElement | null): string =>
  element ? getComputedStyle(element).color : 'rgb(128, 128, 128)';

/** Which download is being made, if any; the other buttons wait for it. */
export type Saving = 'image' | 'gif' | null;

export interface IStageToolbarProps {
  isSpinning: boolean;
  onSpin: () => void;
  onReset: () => void;
  onDownloadImage: () => void;
  onDownloadGif: () => void;
  saving: Saving;
}

interface IToolbarButtonProps {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  isPressed?: boolean;
  isBusy?: boolean;
  isDisabled?: boolean;
}

const ToolbarButton = ({ label, onClick, children, isPressed, isBusy, isDisabled }: IToolbarButtonProps) => (
  <Tooltip title={label}>
    <Button
      isSubtle
      aria-label={label}
      aria-pressed={isPressed}
      aria-busy={isBusy}
      disabled={isDisabled}
      onClick={onClick}
      className={cn('flex h-8 min-w-8 items-center justify-center px-2 py-0', isPressed && 'text-primary')}
    >
      {isBusy ? <Spinner size="sm" /> : children}
    </Button>
  </Tooltip>
);

/** A download arrow and the file format it saves; both download buttons use it so they read as a pair. */
const FormatLabel = ({ children }: { children: string }) => (
  <span className="flex items-center gap-1">
    <DownloadSimpleIcon weight="bold" className="h-3.5 w-3.5" />
    <span className="text-[10px] font-bold leading-none tracking-tighter">{children}</span>
  </span>
);

export const StageToolbar = ({
  isSpinning,
  onSpin,
  onReset,
  onDownloadImage,
  onDownloadGif,
  saving,
}: IStageToolbarProps) => (
  <div className="absolute right-3 top-3 flex items-center gap-1 border border-border bg-card/90 p-1 shadow-sm">
    <ToolbarButton
      label={isSpinning ? 'Stop turning' : 'Turn slowly'}
      onClick={onSpin}
      isPressed={isSpinning}
      isDisabled={saving === 'gif'}
    >
      {isSpinning ? <PauseIcon weight="bold" className="h-4 w-4" /> : <PlayIcon weight="bold" className="h-4 w-4" />}
    </ToolbarButton>
    <ToolbarButton label="Reset view" onClick={onReset} isDisabled={saving === 'gif'}>
      <ArrowCounterClockwiseIcon weight="bold" className="h-4 w-4" />
    </ToolbarButton>
    <ToolbarButton
      label="Download as PNG image"
      onClick={onDownloadImage}
      isBusy={saving === 'image'}
      isDisabled={saving !== null}
    >
      <FormatLabel>PNG</FormatLabel>
    </ToolbarButton>
    <ToolbarButton
      label="Download as animated GIF"
      onClick={onDownloadGif}
      isBusy={saving === 'gif'}
      isDisabled={saving !== null}
    >
      <FormatLabel>GIF</FormatLabel>
    </ToolbarButton>
  </div>
);

/** Shown over the view while a GIF records: it turns or steps underneath, so input is held off. */
export const GifProgress = ({ fraction }: { fraction: number }) => (
  <div className="absolute inset-0 flex items-end justify-center p-4" aria-live="polite">
    <div className="flex w-64 max-w-full flex-col gap-2 border border-border bg-card/95 px-3 py-2.5 text-xs shadow-sm">
      <span className="font-semibold">
        {fraction < GIF_RECORDING_SHARE ? 'Recording the turn…' : 'Making the GIF…'} {Math.round(fraction * 100)}%
      </span>
      <Progress value={fraction * 100} />
    </div>
  </div>
);

export const Readout = ({ point }: { point: IStagePoint | null }) => (
  <div className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5 text-xs shadow-sm">
    {point ? (
      <>
        <CrosshairIcon weight="bold" className="h-3.5 w-3.5 text-primary" />
        <span className="font-mono tabular-nums">
          <span className="font-serif italic text-muted-foreground">x</span> {formatGraphNumber(point.x)}
          <span className="ml-2.5 font-serif italic text-muted-foreground">y</span> {formatGraphNumber(point.y)}
          <span className="ml-2.5 font-serif italic text-muted-foreground">z</span> {formatGraphNumber(point.z)}
        </span>
      </>
    ) : (
      <span className="text-muted-foreground">
        <span className="hidden md:inline">Drag to turn · scroll or pinch to zoom · point to read a value</span>
        <span className="md:hidden">Drag to turn · pinch to zoom · tap to read</span>
      </span>
    )}
  </div>
);
