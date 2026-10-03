import { PlayIcon, StopIcon } from '@phosphor-icons/react';
import { useId } from 'react';
import { SPEECH_RATES } from '../../content/speech/player';
import { useSpeech, useVoiceAvailability } from '../../content/speech/use-speech';
import { cn } from '../../lib/cn';
import { CONTROL_CLASS, keepSelection } from '../toolbar/ToolbarButton';

interface IProps {
  segments: string[];
  lang: string;
  audio: string;
}

/**
 * Listen and Slow, for the author to hear what a learner will. Uses the reader's own player, so a
 * language with no voice on this device is flagged here, while there is still time to add audio.
 */
export const PreviewButtons = ({ segments, lang, audio }: IProps) => {
  const id = useId();
  const { status, play, stop } = useSpeech(id);
  const availability = useVoiceAvailability(lang, !!audio);
  const isBusy = status !== 'idle';
  const isEmpty = !segments.some((segment) => segment.trim());

  if (availability === 'unavailable') {
    return <span className="px-1 text-xs text-warning">No voice for this language on this device</span>;
  }

  const speak = (rate: number) => (isBusy ? stop() : play({ segments, lang, audio, rate }));

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onMouseDown={keepSelection}
        onClick={() => speak(SPEECH_RATES.normal)}
        disabled={isEmpty}
        className={cn(CONTROL_CLASS, 'gap-1 px-2 text-primary hover:bg-primary/10')}
      >
        {isBusy ? (
          <StopIcon className="h-3.5 w-3.5" weight="fill" />
        ) : (
          <PlayIcon className="h-3.5 w-3.5" weight="fill" />
        )}
        {isBusy ? 'Stop' : 'Listen'}
      </button>
      <button
        type="button"
        onMouseDown={keepSelection}
        onClick={() => speak(SPEECH_RATES.slow)}
        disabled={isEmpty || isBusy}
        className={cn(CONTROL_CLASS, 'px-2 text-muted-foreground hover:bg-accent hover:text-foreground')}
      >
        Slow
      </button>
    </span>
  );
};
