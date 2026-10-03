import { ChatsCircleIcon, HeadphonesIcon, PlayIcon, SpeakerHighIcon, StopIcon } from '@phosphor-icons/react';
import type { IRichTextNode } from '@repo/shared/interfaces';
import { docToPlainText, type ListeningMode, speechLanguageName } from '@repo/shared/utils';
import { type ReactNode, useId } from 'react';
import { cn } from '../lib/cn';
import { SPEECH_RATES } from './speech/player';
import { useSpeech, useVoiceAvailability } from './speech/use-speech';

export interface IListeningBlockProps {
  lang: string;
  mode: ListeningMode;
  audio: string;
  /** The block's paragraphs as stored, to know what to speak. */
  lines: IRichTextNode[];
  /** The same paragraphs rendered, one per line. */
  children: ReactNode[];
}

/** A dialogue line opens with its speaker in bold — "**Ana:**" — which is read, not spoken. */
const spokenText = (line: IRichTextNode, mode: ListeningMode): string => {
  const [first, ...rest] = line.content ?? [];
  const isSpeaker =
    mode === 'dialogue' &&
    first?.type === 'text' &&
    first.marks?.some((mark) => mark.type === 'bold') &&
    /:\s*$/.test(first.text ?? '');
  return docToPlainText(isSpeaker ? { type: 'paragraph', content: rest } : line);
};

const PILL_CLASS =
  'inline-flex h-8 items-center gap-1.5 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

/**
 * A listening passage or a dialogue: one card, one Play control for the whole, and the line being
 * spoken highlighted so a learner can follow along. In a dialogue each line can also be replayed
 * on its own, which is how a learner drills the line they missed.
 */
export const ListeningBlock = ({ lang, mode, audio, lines, children }: IListeningBlockProps) => {
  const id = useId();
  const all = useSpeech(`${id}:all`);
  const availability = useVoiceAvailability(lang, !!audio);
  const segments = lines.map((line) => spokenText(line, mode));
  const canPlay = availability !== 'unavailable';
  const isDialogue = mode === 'dialogue';
  const language = speechLanguageName(lang);
  const isPlaying = all.status !== 'idle';

  const playAll = (rate: number) => (isPlaying ? all.stop() : all.play({ segments, lang, audio, rate }));
  const Icon = isDialogue ? ChatsCircleIcon : HeadphonesIcon;

  return (
    <section
      className="my-5 border border-border bg-card text-card-foreground"
      aria-label={isDialogue ? `${language} dialogue` : `${language} listening passage`}
    >
      <header className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border bg-muted/40 px-3 py-2">
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-4 w-4" weight="bold" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold text-foreground">{isDialogue ? 'Dialogue' : 'Listening'}</span>
            <span className="text-xxs uppercase tracking-caps text-muted-foreground">{language}</span>
          </span>
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          {isPlaying && all.segment >= 0 ? (
            <span className="mr-1 font-mono text-xxs text-muted-foreground" aria-live="polite">
              {all.segment + 1} / {segments.length}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => playAll(SPEECH_RATES.normal)}
            disabled={!canPlay}
            className={cn(PILL_CLASS, 'bg-primary text-primary-foreground hover:bg-primary/90')}
          >
            {isPlaying ? (
              <StopIcon className="h-3.5 w-3.5" weight="fill" />
            ) : (
              <PlayIcon className="h-3.5 w-3.5" weight="fill" />
            )}
            {isPlaying ? 'Stop' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => playAll(SPEECH_RATES.slow)}
            disabled={!canPlay || isPlaying}
            className={cn(PILL_CLASS, 'border border-border bg-background text-foreground hover:bg-accent')}
          >
            Slow
          </button>
        </span>
      </header>
      {!canPlay ? (
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground">
          This device has no {language} voice, so this passage cannot be played here.
        </p>
      ) : null}
      <div className={cn('py-2', isDialogue && 'divide-y divide-border/60')}>
        {children.map((child, index) => (
          <ListeningLine
            key={index}
            isActive={isPlaying && all.segment === index}
            isDialogue={isDialogue}
            canPlay={canPlay}
            text={segments[index]}
            lang={lang}
          >
            {child}
          </ListeningLine>
        ))}
      </div>
    </section>
  );
};

interface IListeningLineProps {
  children: ReactNode;
  isActive: boolean;
  isDialogue: boolean;
  canPlay: boolean;
  text: string;
  lang: string;
}

/** One paragraph of the block; a dialogue line carries its own replay button. */
const ListeningLine = ({ children, isActive, isDialogue, canPlay, text, lang }: IListeningLineProps) => {
  const id = useId();
  const line = useSpeech(id);
  const isLinePlaying = line.status !== 'idle';
  const isHighlighted = isActive || isLinePlaying;

  return (
    <div
      className={cn(
        'group flex items-start gap-2 border-l-2 px-4 transition-colors [&>p]:my-1.5',
        isHighlighted ? 'border-primary bg-primary/10' : 'border-transparent',
      )}
    >
      <div className="min-w-0 flex-1" lang={lang}>
        {children}
      </div>
      {isDialogue && canPlay && text ? (
        <button
          type="button"
          onClick={() =>
            isLinePlaying ? line.stop() : line.play({ segments: [text], lang, audio: '', rate: SPEECH_RATES.normal })
          }
          aria-label={isLinePlaying ? 'Stop this line' : `Play line: ${text}`}
          className={cn(
            'mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isLinePlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary hover:bg-primary/20 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
          )}
        >
          {isLinePlaying ? (
            <StopIcon className="h-3 w-3" weight="fill" />
          ) : (
            <SpeakerHighIcon className="h-3 w-3" weight="bold" />
          )}
        </button>
      ) : null}
    </div>
  );
};
