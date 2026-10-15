import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  QuestionIcon,
  SpeakerHighIcon,
  StopIcon,
  XCircleIcon,
} from '@phosphor-icons/react';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { GENDER_TEXT } from '../gender';
import { SPEECH_RATES } from '../speech/player';
import { useSpeech } from '../speech/use-speech';
import { ActivityFrame, type ISpoken, OUTLINE_PILL } from './ActivityFrame';

export interface ICheckOption {
  isCorrect: boolean;
  content: ReactNode;
  /**
   * When the option holds pronounced text: its words as plain text and what they say. The option is
   * itself a button, so a pronounced word inside it cannot be its own button; it gets a speaker
   * beside the option instead.
   */
  spoken: (ISpoken & { label: string }) | null;
}

/** The speaker beside a pronounced option. */
const OptionSpeaker = ({ spoken }: { spoken: ISpoken }) => {
  const id = useId();
  const { status, play, stop } = useSpeech(id);
  const isBusy = status !== 'idle';
  return (
    <button
      type="button"
      onClick={() =>
        isBusy
          ? stop()
          : play({
              segments: [spoken.text],
              lang: spoken.pronunciation.lang,
              audio: spoken.pronunciation.audio,
              rate: SPEECH_RATES.normal,
            })
      }
      aria-label={isBusy ? 'Stop' : `Hear ${spoken.text}`}
      className={cn(
        'flex w-10 shrink-0 items-center justify-center border border-l-0 border-border transition-colors print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isBusy ? 'bg-primary text-primary-foreground' : 'bg-background text-primary hover:bg-primary/10',
      )}
    >
      {isBusy ? <StopIcon className="h-4 w-4" weight="fill" /> : <SpeakerHighIcon className="h-4 w-4" weight="bold" />}
    </button>
  );
};

/** What an option says: a pronounced word as plain text with its IAST, or the option as written. */
const OptionLabel = ({ option }: { option: ICheckOption }) => {
  const { spoken } = option;
  if (!spoken) return <>{option.content}</>;
  const { pronunciation, label, text } = spoken;
  return (
    <span className="flex flex-col">
      <span
        lang={pronunciation.lang}
        className={cn('text-base', pronunciation.gender && GENDER_TEXT[pronunciation.gender])}
      >
        {label}
      </span>
      {pronunciation.translit && label === text ? (
        <span className="text-xxs italic text-muted-foreground">{pronunciation.translit}</span>
      ) : null}
    </span>
  );
};

interface IOptionRowProps {
  option: ICheckOption;
  isPicked: boolean;
  isSolved: boolean;
  onPick: () => void;
}

/** One option: the button that answers, and a speaker beside it when the option is pronounced. */
const OptionRow = ({ option, isPicked, isSolved, onPick }: IOptionRowProps) => {
  const isShownRight = isPicked && option.isCorrect;
  const isShownWrong = isPicked && !option.isCorrect;
  return (
    <div className="flex">
      <button
        type="button"
        onClick={onPick}
        aria-pressed={isPicked}
        className={cn(
          'flex min-h-11 min-w-0 flex-1 items-center gap-2 border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_p]:my-0',
          isShownRight && 'border-success bg-success/15 animate-pop-in',
          isShownWrong && 'border-destructive bg-destructive/10',
          !isPicked && 'border-border bg-background hover:bg-accent',
          isSolved && !isPicked && 'opacity-60',
          // In print the right answers are marked, since nobody can tap a page.
          option.isCorrect && 'print:border-success print:bg-success/15',
        )}
      >
        <span className="min-w-0 flex-1">
          <OptionLabel option={option} />
        </span>
        {isShownRight ? <CheckCircleIcon className="h-5 w-5 shrink-0 text-success" weight="fill" /> : null}
        {isShownWrong ? <XCircleIcon className="h-5 w-5 shrink-0 text-destructive" weight="fill" /> : null}
      </button>
      {option.spoken ? <OptionSpeaker spoken={option.spoken} /> : null}
    </div>
  );
};

interface ICheckBlockProps {
  prompt: ReactNode;
  options: ICheckOption[];
  /** Shown once the learner has found a right answer; also explains a wrong pick. */
  why: ReactNode | null;
}

/**
 * A question answered on the spot: a tap marks the option right or wrong at once, the explanation
 * opens beside it, and a wrong pick can be tried again. Any option marked correct counts, so a
 * question with two valid answers accepts both. Nothing is scored or stored.
 */
export const CheckBlock = ({ prompt, options, why }: ICheckBlockProps) => {
  const [picked, setPicked] = useState<number[]>([]);
  const last = picked[picked.length - 1];
  const isSolved = last !== undefined && options[last]?.isCorrect;
  const isWrong = last !== undefined && !options[last]?.isCorrect;

  const pick = (index: number) => {
    if (isSolved || picked.includes(index)) return;
    setPicked((current) => [...current, index]);
  };

  return (
    <ActivityFrame
      icon={QuestionIcon}
      title="Quick check"
      actions={
        picked.length ? (
          <button type="button" onClick={() => setPicked([])} className={OUTLINE_PILL}>
            <ArrowCounterClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
            Again
          </button>
        ) : null
      }
    >
      <div className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">{prompt}</div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option, index) => (
          <OptionRow
            key={index}
            option={option}
            isPicked={picked.includes(index)}
            isSolved={!!isSolved}
            onPick={() => pick(index)}
          />
        ))}
      </div>
      {/* Always there, so the card does not change height when a wrong answer is picked. */}
      <p className="mt-3 min-h-5 text-sm text-muted-foreground print:hidden" aria-live="polite">
        {isWrong ? 'Not this one. Try another.' : ''}
      </p>
      {why ? (
        <div
          aria-live="polite"
          className={cn(
            'mt-3 border-l-2 border-success bg-success/10 px-3 py-2 text-sm animate-fade-in [&>*:first-child]:mt-0 [&>*:last-child]:mb-0',
            !isSolved && 'hidden print:block',
          )}
        >
          {why}
        </div>
      ) : null}
    </ActivityFrame>
  );
};
