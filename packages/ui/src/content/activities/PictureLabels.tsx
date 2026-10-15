import {
  ArrowCounterClockwiseIcon,
  CheckCircleIcon,
  MapPinIcon,
  SpeakerHighIcon,
  StopIcon,
} from '@phosphor-icons/react';
import { type PictureMode, WORD_GENDER_NAMES } from '@repo/shared/utils';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '../../lib/cn';
import { GENDER_FILL, GENDER_TEXT } from '../gender';
import { useResolvedImageUrl } from '../RichTextImage';
import { SPEECH_RATES } from '../speech/player';
import { useSpeech } from '../speech/use-speech';
import { ActivityFrame, type ISpoken, OUTLINE_PILL } from './ActivityFrame';

export interface IPictureLabel {
  /** Where the point sits, as a percentage of the picture's width and height. */
  x: number;
  y: number;
  word: ReactNode;
  meaning: ReactNode | null;
  /** The meaning as plain text, for the "find" prompt. */
  meaningText: string;
  spoken: ISpoken | null;
}

interface IPictureLabelsProps {
  src: string;
  alt: string;
  mode: PictureMode;
  labels: IPictureLabel[];
}

const usePlay = () => {
  const id = useId();
  const speech = useSpeech(id);
  const play = (spoken: ISpoken | null) =>
    spoken &&
    speech.play({
      segments: [spoken.text],
      lang: spoken.pronunciation.lang,
      audio: spoken.pronunciation.audio,
      rate: SPEECH_RATES.normal,
    });
  return { ...speech, playSpoken: play };
};

/** The card under the picture: the word, its sound, its gender and its meaning. */
const LabelCard = ({ label, number }: { label: IPictureLabel; number: number }) => {
  const { status, stop, playSpoken } = usePlay();
  const isBusy = status !== 'idle';
  const gender = label.spoken?.pronunciation.gender ?? '';
  return (
    <div className="flex items-center gap-3 border border-border bg-background px-3 py-2 animate-fade-in">
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background',
          gender ? GENDER_FILL[gender] : 'bg-foreground',
        )}
      >
        {number}
      </span>
      <div className="min-w-0 flex-1 [&_p]:my-0">
        {label.spoken ? (
          <span lang={label.spoken.pronunciation.lang} className={cn('text-xl', gender && GENDER_TEXT[gender])}>
            {label.spoken.text}
          </span>
        ) : (
          label.word
        )}
        <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {label.spoken?.pronunciation.translit ? (
            <span className="italic">{label.spoken.pronunciation.translit}</span>
          ) : null}
          {gender ? (
            <span className={cn('font-semibold', GENDER_TEXT[gender])}>{WORD_GENDER_NAMES[gender]}</span>
          ) : null}
          {label.meaning ? <span>{label.meaning}</span> : null}
        </div>
      </div>
      {label.spoken ? (
        <button
          type="button"
          onClick={() => (isBusy ? stop() : playSpoken(label.spoken))}
          aria-label={isBusy ? 'Stop' : `Play ${label.spoken.text}`}
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border transition-colors hover:bg-accent',
            isBusy && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          {isBusy ? (
            <StopIcon className="h-4 w-4" weight="fill" />
          ) : (
            <SpeakerHighIcon className="h-4 w-4" weight="bold" />
          )}
        </button>
      ) : null}
    </div>
  );
};

/**
 * A picture with numbered points. Explore: tap a point to see its word, hear it and see its gender.
 * Find: the learner is asked for each word in turn (by its meaning, with its sound) and taps where
 * it is. The points sit on the picture by percentage, so they stay put at any width.
 */
export const PictureLabels = ({ src, alt, mode, labels }: IPictureLabelsProps) => {
  const { url } = useResolvedImageUrl(src);
  const [selected, setSelected] = useState(-1);
  const [target, setTarget] = useState(0);
  const [found, setFound] = useState<number[]>([]);
  const [missed, setMissed] = useState(-1);
  const { playSpoken } = usePlay();
  const isFind = mode === 'find';
  const isDone = isFind && found.length === labels.length;

  const tap = (index: number) => {
    if (!isFind) {
      setSelected(index);
      playSpoken(labels[index].spoken);
      return;
    }
    if (isDone) return;
    if (index !== target) {
      setMissed(index);
      return;
    }
    setMissed(-1);
    setFound((current) => [...current, index]);
    playSpoken(labels[index].spoken);
    setSelected(index);
    setTarget((current) => current + 1);
  };

  const restart = () => {
    setFound([]);
    setTarget(0);
    setSelected(-1);
    setMissed(-1);
  };

  return (
    <ActivityFrame
      icon={MapPinIcon}
      title={isFind ? `Find it · ${found.length} of ${labels.length}` : 'Tap the picture'}
      actions={
        isFind && found.length ? (
          <button type="button" onClick={restart} className={OUTLINE_PILL}>
            <ArrowCounterClockwiseIcon className="h-3.5 w-3.5" weight="bold" />
            Again
          </button>
        ) : null
      }
    >
      {isFind ? (
        <FindPrompt
          isDone={isDone}
          prompt={labels[target]}
          isMissed={missed >= 0}
          onHear={() => playSpoken(labels[target]?.spoken ?? null)}
        />
      ) : null}
      <div className="relative mx-auto w-fit max-w-full">
        {url ? (
          <img
            src={url}
            alt={alt}
            className={cn(
              'block h-auto max-h-[min(60vh,28rem)] w-auto max-w-full',
              // A drawn figure inverts in dark mode like any other; a photo stays as it is.
              /\.svg(\?|#|$)/i.test(src) && 'dark:hue-rotate-180 dark:invert',
            )}
          />
        ) : (
          <div className="h-48 w-80 max-w-full animate-pulse bg-muted" aria-label={alt} />
        )}
        {labels.map((label, index) => (
          <PicturePoint
            key={index}
            label={label}
            number={index + 1}
            isRevealed={!isFind || found.includes(index)}
            isFound={found.includes(index)}
            isSelected={selected === index}
            isMissed={missed === index}
            onTap={() => tap(index)}
          />
        ))}
      </div>
      <div className="mt-3 print:hidden">
        {selected >= 0 && labels[selected] ? (
          <LabelCard key={selected} label={labels[selected]} number={selected + 1} />
        ) : (
          !isFind && <p className="text-center text-xs text-muted-foreground">Tap a number on the picture.</p>
        )}
      </div>
      <ol className="mt-3 hidden list-decimal pl-5 print:block [&_p]:my-0">
        {labels.map((label, index) => (
          <li key={index}>
            {label.word} {label.meaning ? <>— {label.meaning}</> : null}
          </li>
        ))}
      </ol>
    </ActivityFrame>
  );
};

interface IFindPromptProps {
  isDone: boolean;
  prompt: IPictureLabel | undefined;
  isMissed: boolean;
  onHear: () => void;
}

/** "Tap: boy", with the word's sound, until every point is found. */
const FindPrompt = ({ isDone, prompt, isMissed, onHear }: IFindPromptProps) => (
  <div className="mb-3 flex min-h-9 items-center gap-2 print:hidden" aria-live="polite">
    {isDone ? (
      <span className="flex items-center gap-2 text-sm font-semibold text-success">
        <CheckCircleIcon className="h-5 w-5" weight="fill" />
        All found.
      </span>
    ) : (
      <>
        <span className="text-sm text-muted-foreground">Tap:</span>
        <span className="text-base font-semibold">{prompt?.meaningText || prompt?.spoken?.text}</span>
        {prompt?.spoken ? (
          <button
            type="button"
            onClick={onHear}
            aria-label="Hear the word"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
          >
            <SpeakerHighIcon className="h-4 w-4" weight="bold" />
          </button>
        ) : null}
        {isMissed ? <span className="text-xs text-destructive">Not that one.</span> : null}
      </>
    )}
  </div>
);

interface IPicturePointProps {
  label: IPictureLabel;
  number: number;
  /** In find mode a point says nothing about itself until it is found. */
  isRevealed: boolean;
  isFound: boolean;
  isSelected: boolean;
  isMissed: boolean;
  onTap: () => void;
}

/** A numbered point on the picture, in its word's gender colour once revealed. */
const PicturePoint = ({ label, number, isRevealed, isFound, isSelected, isMissed, onTap }: IPicturePointProps) => {
  const gender = label.spoken?.pronunciation.gender ?? '';
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={isRevealed && label.spoken ? `${number}: ${label.spoken.text}` : 'A point on the picture'}
      style={{ left: `${label.x}%`, top: `${label.y}%` }}
      className={cn(
        'absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background text-xxs font-bold text-background shadow-md transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8 sm:w-8 sm:text-xs',
        isRevealed && gender ? GENDER_FILL[gender] : 'bg-foreground/80',
        isSelected && 'scale-125 ring-2 ring-primary',
        isMissed && 'bg-destructive animate-pop-in',
        isFound && 'animate-pop-in',
      )}
    >
      {isFound ? <CheckCircleIcon className="h-4 w-4" weight="fill" /> : null}
      {/* In find mode the numbers would give the order away, so a point is blank until found. */}
      {!isFound && isRevealed ? number : null}
    </button>
  );
};
