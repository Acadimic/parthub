import { CircleNotchIcon, SpeakerHighIcon, SpeakerSimpleSlashIcon, StopIcon } from '@phosphor-icons/react';
import { type IPronunciationAttrs, speechLanguageName } from '@repo/shared/utils';
import { type KeyboardEvent, type ReactNode, useId, useState } from 'react';
import { cn } from '../lib/cn';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { SPEECH_RATES, type SpeechStatus } from './speech/player';
import { useSpeech, useVoiceAvailability } from './speech/use-speech';

export interface IPronouncedTextProps {
  /** The run as it reads, marks included. */
  children: ReactNode;
  /** The run as it is spoken. */
  text: string;
  pronunciation: IPronunciationAttrs;
}

/** A round icon control; inline, so it sits on the text's baseline without breaking the line. */
const SPEAKER_CLASS =
  'ml-1 inline-flex h-5 w-5 shrink-0 translate-y-[-1px] items-center justify-center rounded-full align-middle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const SpeakerIcon = ({ canPlay, status }: { canPlay: boolean; status: SpeechStatus }) => {
  if (!canPlay) return <SpeakerSimpleSlashIcon className="h-3 w-3" weight="bold" />;
  if (status === 'loading') return <CircleNotchIcon className="h-3 w-3 animate-spin" weight="bold" />;
  if (status === 'playing') return <StopIcon className="h-3 w-3" weight="fill" />;
  return <SpeakerHighIcon className="h-3 w-3" weight="bold" />;
};

/**
 * A pronounceable word, phrase or sentence.
 *
 * The speaker beside it plays at once — the common case is "how does this sound", and one tap
 * should answer it. The text itself opens a card with the transliteration, the IPA and a slow
 * replay, which is where a learner goes to study a word rather than hear it. Without a stored file
 * and without a device voice the speaker is shown struck through, and the card still teaches.
 */
export const PronouncedText = ({ children, text, pronunciation }: IPronouncedTextProps) => {
  const id = useId();
  const { lang, ipa, translit, audio } = pronunciation;
  const { status, play, stop } = useSpeech(id);
  const availability = useVoiceAvailability(lang, !!audio);
  const [isOpen, setIsOpen] = useState(false);
  const language = speechLanguageName(lang);
  const canPlay = availability !== 'unavailable';
  const isBusy = status !== 'idle';

  const speak = (rate: number) => (isBusy ? stop() : play({ segments: [text], lang, audio, rate }));

  const openOnKey = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    setIsOpen(true);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <span className="whitespace-normal">
        <PopoverTrigger asChild>
          <span
            role="button"
            tabIndex={0}
            onKeyDown={openOnKey}
            aria-label={`${text}: show pronunciation`}
            className={cn(
              'cursor-pointer underline decoration-dotted decoration-primary/60 decoration-2 underline-offset-4 transition-colors hover:bg-primary/5 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isBusy && 'bg-primary/10 decoration-primary',
            )}
          >
            {children}
          </span>
        </PopoverTrigger>
        <button
          type="button"
          onClick={() => speak(SPEECH_RATES.normal)}
          disabled={!canPlay}
          aria-label={canPlay ? `Play pronunciation: ${text}` : `No ${language} voice on this device`}
          title={canPlay ? `Listen (${language})` : `No ${language} voice on this device`}
          aria-pressed={isBusy}
          className={cn(
            SPEAKER_CLASS,
            canPlay && !isBusy && 'bg-primary/10 text-primary hover:bg-primary/20',
            isBusy && 'bg-primary text-primary-foreground',
            !canPlay && 'cursor-not-allowed bg-muted text-muted-foreground',
          )}
        >
          <SpeakerIcon canPlay={canPlay} status={status} />
        </button>
      </span>
      <PopoverContent align="start" className="w-auto min-w-[14rem] max-w-[20rem] p-0">
        <div className="flex flex-col gap-1 border-b border-border px-4 pb-3 pt-3.5">
          <span className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{language}</span>
          <span className="text-lg font-semibold leading-snug text-foreground" lang={lang}>
            {text}
          </span>
          {translit ? <span className="text-sm italic text-foreground/80">{translit}</span> : null}
          {ipa ? <span className="text-sm text-muted-foreground">/{ipa}/</span> : null}
        </div>
        {canPlay ? (
          <div className="flex gap-2 p-2">
            <button
              type="button"
              onClick={() => speak(SPEECH_RATES.normal)}
              className="flex h-9 flex-1 items-center justify-center gap-2 bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {isBusy ? (
                <StopIcon className="h-4 w-4" weight="fill" />
              ) : (
                <SpeakerHighIcon className="h-4 w-4" weight="bold" />
              )}
              {isBusy ? 'Stop' : 'Listen'}
            </button>
            <button
              type="button"
              onClick={() => speak(SPEECH_RATES.slow)}
              disabled={isBusy}
              className="flex h-9 flex-1 items-center justify-center gap-2 border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-40"
            >
              <SpeakerHighIcon className="h-4 w-4" />
              Slow
            </button>
          </div>
        ) : (
          <p className="px-4 py-3 text-xs text-muted-foreground">
            This device has no {language} voice. Read it from the transliteration and IPA above.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
};
