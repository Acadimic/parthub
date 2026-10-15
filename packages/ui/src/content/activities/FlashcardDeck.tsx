import {
  ArrowsClockwiseIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CardsIcon,
  SpeakerHighIcon,
  StopIcon,
} from '@phosphor-icons/react';
import { type ReactNode, useId, useState } from 'react';
import { WORD_GENDER_NAMES } from '@repo/shared/utils';
import { cn } from '../../lib/cn';
import { GENDER_TEXT } from '../gender';
import { SPEECH_RATES } from '../speech/player';
import { useSpeech } from '../speech/use-speech';
import { ActivityFrame, type ISpoken, OUTLINE_PILL } from './ActivityFrame';

export interface IFlashcard {
  front: ReactNode;
  back: ReactNode;
  /** What the front says, when it is a pronounced word. */
  spoken: ISpoken | null;
}

const ICON_BUTTON =
  'flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40';

const SpeakButton = ({ spoken }: { spoken: ISpoken }) => {
  const id = useId();
  const { status, play, stop } = useSpeech(id);
  const isBusy = status !== 'idle';
  const { pronunciation, text } = spoken;
  return (
    <button
      type="button"
      onClick={(event) => {
        // The card flips on a tap; the speaker must not flip it too.
        event.stopPropagation();
        if (isBusy) {
          stop();
          return;
        }
        play({ segments: [text], lang: pronunciation.lang, audio: pronunciation.audio, rate: SPEECH_RATES.normal });
      }}
      aria-label={isBusy ? 'Stop' : `Play ${text}`}
      className={cn(ICON_BUTTON, isBusy && 'border-primary bg-primary text-primary-foreground hover:bg-primary/90')}
    >
      {isBusy ? <StopIcon className="h-4 w-4" weight="fill" /> : <SpeakerHighIcon className="h-4 w-4" weight="bold" />}
    </button>
  );
};

/**
 * A small deck: the front shows the word (and plays it), a tap turns the card to its meaning, and
 * the arrows move through the deck. It replaces a list of key terms with something to practise.
 * Print lists every card as front — back.
 */
export const FlashcardDeck = ({ cards }: { cards: IFlashcard[] }) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const card = cards[index];
  if (!card) return null;

  const go = (step: number) => {
    setIndex((current) => (current + step + cards.length) % cards.length);
    setIsFlipped(false);
  };

  return (
    <ActivityFrame icon={CardsIcon} title={`Flashcards · ${cards.length}`}>
      <div className="print:hidden">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsFlipped((flipped) => !flipped)}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            setIsFlipped((flipped) => !flipped);
          }}
          aria-label={isFlipped ? 'Show the front' : 'Show the meaning'}
          className={cn(
            'relative flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 border px-4 py-5 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_p]:my-0',
            isFlipped ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-accent/50',
          )}
        >
          <span className="absolute left-3 top-2 font-mono text-xxs text-muted-foreground">
            {index + 1} / {cards.length}
          </span>
          {isFlipped ? (
            <div key="back" className="text-base animate-fade-in">
              {card.back}
            </div>
          ) : (
            <div key="front" className="flex items-center gap-3 text-2xl animate-fade-in">
              <span>
                {card.spoken ? (
                  <span
                    lang={card.spoken.pronunciation.lang}
                    className={card.spoken.pronunciation.gender ? GENDER_TEXT[card.spoken.pronunciation.gender] : ''}
                  >
                    {card.spoken.text}
                  </span>
                ) : (
                  card.front
                )}
              </span>
              {card.spoken ? <SpeakButton spoken={card.spoken} /> : null}
            </div>
          )}
          {!isFlipped && card.spoken?.pronunciation.gender ? (
            <span className={cn('text-xs font-semibold', GENDER_TEXT[card.spoken.pronunciation.gender])}>
              {WORD_GENDER_NAMES[card.spoken.pronunciation.gender]}
            </span>
          ) : null}
          {!isFlipped && card.spoken?.pronunciation.translit ? (
            <span className="text-sm italic text-muted-foreground">{card.spoken.pronunciation.translit}</span>
          ) : null}
          <span className="mt-1 flex items-center gap-1 text-xxs uppercase tracking-caps text-muted-foreground">
            <ArrowsClockwiseIcon className="h-3 w-3" weight="bold" />
            Tap to turn
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => go(-1)}
            disabled={cards.length < 2}
            className={ICON_BUTTON}
            aria-label="Previous card"
          >
            <CaretLeftIcon className="h-4 w-4" weight="bold" />
          </button>
          <button type="button" onClick={() => setIsFlipped((flipped) => !flipped)} className={OUTLINE_PILL}>
            {isFlipped ? 'Front' : 'Meaning'}
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            disabled={cards.length < 2}
            className={ICON_BUTTON}
            aria-label="Next card"
          >
            <CaretRightIcon className="h-4 w-4" weight="bold" />
          </button>
        </div>
      </div>
      <ul className="hidden list-none p-0 print:block">
        {cards.map((item, cardIndex) => (
          <li key={cardIndex} className="flex gap-2 py-0.5 [&_p]:my-0">
            <span className="font-semibold">{item.front}</span>
            <span>—</span>
            <span>{item.back}</span>
          </li>
        ))}
      </ul>
    </ActivityFrame>
  );
};
