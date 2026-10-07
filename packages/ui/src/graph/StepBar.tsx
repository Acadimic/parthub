import { CaretLeftIcon, CaretRightIcon, PauseIcon, PlayIcon } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { Button } from '../core/Button';

/** How long Play rests on a step once it has finished changing, before moving to the next. */
const PLAY_REST_MS = 1300;

/**
 * Which step is showing and whether Play is running. Play moves on at once, then every `stepMs`
 * plus a rest, and stops at the last step; pressing it there starts again from the first. Choosing
 * a step by hand stops it.
 */
export const useSteps = (count: number, stepMs: number, onStep: (index: number) => void) => {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => onStep(index), [index, onStep]);

  useEffect(() => {
    if (!isPlaying) return undefined;
    if (index >= count - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setIndex((current) => current + 1), stepMs + PLAY_REST_MS);
    return () => window.clearTimeout(timer);
  }, [isPlaying, index, count, stepMs]);

  const choose = (next: number) => {
    setIsPlaying(false);
    setIndex(Math.max(0, Math.min(count - 1, next)));
  };
  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    setIndex((current) => (current >= count - 1 ? 0 : current + 1));
    setIsPlaying(true);
  };
  return { index, choose, isPlaying, togglePlay };
};

export interface IStepBarProps {
  labels: string[];
  index: number;
  onChange: (index: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  isDisabled: boolean;
}

/** Previous, the step's number and label, Next, and Play — under a scene that has steps. */
export const StepBar = ({ labels, index, onChange, isPlaying, onTogglePlay, isDisabled }: IStepBarProps) => {
  const isFirst = index === 0;
  const isLast = index === labels.length - 1;
  return (
    <div className="flex items-center gap-2 border border-t-0 border-border bg-card px-2 py-2 md:px-3">
      <Button
        isSubtle
        aria-label="Previous step"
        disabled={isFirst || isDisabled}
        onClick={() => onChange(index - 1)}
        className="h-9 w-9 shrink-0 justify-center p-0"
      >
        <CaretLeftIcon weight="bold" className="h-4 w-4" />
      </Button>
      <div className="flex min-w-0 flex-1 flex-col items-center text-center" aria-live="polite">
        <span className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
          Step {index + 1} of {labels.length}
        </span>
        <span className="w-full truncate text-sm font-medium text-foreground">{labels[index]}</span>
      </div>
      <Button
        isSubtle
        aria-label="Next step"
        disabled={isLast || isDisabled}
        onClick={() => onChange(index + 1)}
        className="h-9 w-9 shrink-0 justify-center p-0"
      >
        <CaretRightIcon weight="bold" className="h-4 w-4" />
      </Button>
      <Button
        onClick={onTogglePlay}
        disabled={isDisabled}
        aria-pressed={isPlaying}
        className="h-9 shrink-0 px-3 text-sm"
        leftSection={
          isPlaying ? <PauseIcon weight="bold" className="h-4 w-4" /> : <PlayIcon weight="bold" className="h-4 w-4" />
        }
        text={isPlaying ? 'Pause' : 'Play'}
      />
    </div>
  );
};
