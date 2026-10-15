import { ChatsCircleIcon, EyeIcon, HeadphonesIcon, PlayIcon, SpeakerHighIcon, StopIcon } from '@phosphor-icons/react';
import type { IRichTextNode } from '@repo/shared/interfaces';
import { docToPlainText, type ListeningMode, speechLanguageName } from '@repo/shared/utils';
import { type ReactNode, useId, useState } from 'react';
import { cn } from '../lib/cn';
import { SPEECH_RATES } from './speech/player';
import { useSpeech, useVoiceAvailability } from './speech/use-speech';

export interface IListeningBlockProps {
  lang: string;
  mode: ListeningMode;
  audio: string;
  /** One stored address per line, newline-separated, or `''`; see `IListeningAttrs.lineAudio`. */
  lineAudio: string;
  /** A listening task: the text stays folded away until the learner chooses to check it. */
  isTranscriptHidden?: boolean;
  /** The block's paragraphs as stored, to know what to speak. */
  lines: IRichTextNode[];
  /** The same paragraphs rendered, one per line. */
  children: ReactNode[];
  /**
   * A dialogue's lines split into speaker and words, for the comic layout; empty when the lines
   * carry no speakers, which then read as a plain list.
   */
  bubbles: IDialogueBubble[];
}

export interface IDialogueBubble {
  speaker: string;
  /** The line without its "**Name:**" label. */
  content: ReactNode;
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

const blockTitle = (isDialogue: boolean, isTask: boolean): string => {
  if (isTask) return 'Listen';
  return isDialogue ? 'Dialogue' : 'Listening';
};

/** In place of the lines of a listening task: what to do, and a way to check the text afterwards. */
const HiddenText = ({ isDialogue, onReveal }: { isDialogue: boolean; onReveal: () => void }) => (
  <div className="flex flex-wrap items-center gap-3 px-4 py-4 print:hidden">
    <p className="flex-1 text-sm text-muted-foreground">
      Listen to the {isDialogue ? 'conversation' : 'recording'} as many times as you like, then answer. The text is
      hidden so you train your ear.
    </p>
    <button
      type="button"
      onClick={onReveal}
      className={cn(PILL_CLASS, 'border border-border bg-background text-foreground hover:bg-accent')}
    >
      <EyeIcon className="h-3.5 w-3.5" />
      Show text
    </button>
  </div>
);

/**
 * A listening passage or a dialogue: one card, one Play control for the whole, and the line being
 * spoken highlighted so a learner can follow along. Each line can also be replayed on its own,
 * which is how a learner drills the line or the word they missed.
 */
export const ListeningBlock = ({
  lang,
  mode,
  audio,
  lineAudio,
  isTranscriptHidden,
  lines,
  children,
  bubbles,
}: IListeningBlockProps) => {
  const id = useId();
  const [isRevealed, setIsRevealed] = useState(false);
  const isTextHidden = !!isTranscriptHidden && !isRevealed;
  const all = useSpeech(`${id}:all`);
  const availability = useVoiceAvailability(lang, !!audio);
  const segments = lines.map((line) => spokenText(line, mode));
  // Only while there is one file per line: after a line is added or removed they no longer match.
  const lineFiles = lineAudio ? lineAudio.split('\n') : [];
  const lineAudios = lineFiles.length === lines.length ? lineFiles : [];
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
            <span className="text-xs font-semibold text-foreground">
              {blockTitle(isDialogue, !!isTranscriptHidden)}
            </span>
            <span className="text-xxs uppercase tracking-caps text-muted-foreground">{language}</span>
          </span>
        </span>
        <span className="ml-auto flex items-center gap-1.5 print:hidden">
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
        <p className="border-b border-border px-4 py-2 text-xs text-muted-foreground print:hidden">
          This device has no {language} voice, so this passage cannot be played here.
        </p>
      ) : null}
      {isTextHidden ? <HiddenText isDialogue={isDialogue} onReveal={() => setIsRevealed(true)} /> : null}
      <ListeningBody
        isDialogue={isDialogue}
        bubbles={bubbles}
        lines={children}
        activeIndex={isPlaying ? all.segment : -1}
        canPlay={canPlay}
        segments={segments}
        lang={lang}
        lineAudios={lineAudios}
        className={cn(isTextHidden && 'hidden print:block')}
      />
    </section>
  );
};

interface IListeningLineProps {
  children: ReactNode;
  isActive: boolean;
  canPlay: boolean;
  text: string;
  lang: string;
  /** This line's own stored file, or `''` for the device voice. */
  audio: string;
}

/** One paragraph of the block, with its own replay button. */
const ListeningLine = ({ children, isActive, canPlay, text, lang, audio }: IListeningLineProps) => {
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
      {canPlay && text ? (
        <button
          type="button"
          onClick={() =>
            isLinePlaying ? line.stop() : line.play({ segments: [text], lang, audio, rate: SPEECH_RATES.normal })
          }
          aria-label={isLinePlaying ? 'Stop this line' : `Play line: ${text}`}
          className={cn(
            'mt-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isLinePlaying
              ? 'bg-primary text-primary-foreground'
              : 'bg-primary/10 text-primary hover:bg-primary/20 md:opacity-60 md:group-hover:opacity-100 md:focus-visible:opacity-100',
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

/** Speakers take colours in the order they first speak; categorical tokens, and each has a name too. */
const SPEAKER_COLOURS = ['bg-chart-3', 'bg-chart-5', 'bg-chart-1', 'bg-chart-4', 'bg-chart-2'];

interface IDialogueComicProps {
  bubbles: IDialogueBubble[];
  /** The line the whole-dialogue playback is on, or -1. */
  activeIndex: number;
  canPlay: boolean;
  segments: string[];
  lang: string;
  lineAudios: string[];
  className?: string;
}

/**
 * A dialogue drawn as a comic strip: each line a speech bubble beside its speaker, the first
 * speaker on the left and the others on the right, the line being spoken lit up.
 */
const DialogueComic = ({
  bubbles,
  activeIndex,
  canPlay,
  segments,
  lang,
  lineAudios,
  className,
}: IDialogueComicProps) => {
  const speakers = bubbles.reduce<string[]>(
    (list, { speaker }) => (list.includes(speaker) ? list : [...list, speaker]),
    [],
  );
  return (
    <ol className={cn('m-0 flex list-none flex-col gap-3 px-3 py-4', className)}>
      {bubbles.map((bubble, index) => {
        const who = speakers.indexOf(bubble.speaker);
        return (
          <DialogueBubble
            key={index}
            bubble={bubble}
            isRight={who > 0}
            colour={SPEAKER_COLOURS[who % SPEAKER_COLOURS.length]}
            isActive={activeIndex === index}
            canPlay={canPlay}
            text={segments[index]}
            lang={lang}
            audio={lineAudios[index] ?? ''}
          />
        );
      })}
    </ol>
  );
};

interface IDialogueBubbleProps {
  bubble: IDialogueBubble;
  isRight: boolean;
  colour: string;
  isActive: boolean;
  canPlay: boolean;
  text: string;
  lang: string;
  audio: string;
}

const DialogueBubble = ({ bubble, isRight, colour, isActive, canPlay, text, lang, audio }: IDialogueBubbleProps) => {
  const id = useId();
  const line = useSpeech(id);
  const isLinePlaying = line.status !== 'idle';
  const isLit = isActive || isLinePlaying;
  return (
    <li className={cn('flex items-end gap-2', isRight && 'flex-row-reverse')}>
      <span className="flex w-12 shrink-0 flex-col items-center gap-0.5">
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-background',
            colour,
          )}
          aria-hidden="true"
        >
          {bubble.speaker.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-full truncate text-xxs text-muted-foreground">{bubble.speaker}</span>
      </span>
      <div
        className={cn(
          'group relative flex max-w-[80%] items-start gap-2 border px-3 py-2 transition-colors [&_p]:my-0',
          isLit ? 'border-primary bg-primary/10 animate-pop-in' : 'border-border bg-background',
        )}
        lang={lang}
      >
        <div className="min-w-0 text-base">{bubble.content}</div>
        {canPlay && text ? (
          <button
            type="button"
            onClick={() =>
              isLinePlaying ? line.stop() : line.play({ segments: [text], lang, audio, rate: SPEECH_RATES.normal })
            }
            aria-label={isLinePlaying ? 'Stop this line' : `Play line: ${text}`}
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors print:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isLinePlaying ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary hover:bg-primary/20',
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
    </li>
  );
};

interface IListeningBodyProps {
  isDialogue: boolean;
  bubbles: IDialogueBubble[];
  lines: ReactNode[];
  activeIndex: number;
  canPlay: boolean;
  segments: string[];
  lang: string;
  lineAudios: string[];
  className?: string;
}

/** The lines: a comic strip when every line of a dialogue names its speaker, a list otherwise. */
const ListeningBody = ({
  isDialogue,
  bubbles,
  lines,
  activeIndex,
  canPlay,
  segments,
  lang,
  lineAudios,
  className,
}: IListeningBodyProps) => {
  const isComic = isDialogue && bubbles.length === lines.length && bubbles.every((bubble) => bubble.speaker);
  if (isComic) {
    return (
      <DialogueComic
        bubbles={bubbles}
        activeIndex={activeIndex}
        canPlay={canPlay}
        segments={segments}
        lang={lang}
        lineAudios={lineAudios}
        className={className}
      />
    );
  }
  return (
    <div className={cn('py-2', isDialogue && 'divide-y divide-border/60', className)}>
      {lines.map((child, index) => (
        <ListeningLine
          key={index}
          isActive={activeIndex === index}
          canPlay={canPlay}
          text={segments[index]}
          lang={lang}
          audio={lineAudios[index] ?? ''}
        >
          {child}
        </ListeningLine>
      ))}
    </div>
  );
};
