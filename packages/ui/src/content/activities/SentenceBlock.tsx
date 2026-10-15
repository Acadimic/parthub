import { ArrowRightIcon, ArrowsLeftRightIcon } from '@phosphor-icons/react';
import { type SentenceRole, WORD_GENDER_NAMES } from '@repo/shared/utils';
import { type ReactNode, useState } from 'react';
import { cn } from '../../lib/cn';
import { GENDER_TEXT } from '../gender';
import { ActivityFrame, type ISpoken } from './ActivityFrame';
import { StepNav } from './StepNav';

export interface ISentenceTile {
  role: SentenceRole;
  word: ReactNode;
  meaning: ReactNode | null;
  spoken: ISpoken | null;
  /** The word as plain text, to tell which tiles changed between sentences. */
  text: string;
}

export interface ISentenceVariant {
  tiles: ISentenceTile[];
  /** The whole sentence and its meaning, under the tiles. */
  caption: ReactNode | null;
}

/** What each role asks, and its colour: a band on the tile, always beside its name. */
const ROLES: Record<SentenceRole, { question: string; band: string }> = {
  doer: { question: 'Who?', band: 'border-t-chart-3' },
  action: { question: 'Does what?', band: 'border-t-primary' },
  object: { question: 'What? Whom?', band: 'border-t-chart-5' },
  place: { question: 'Where?', band: 'border-t-chart-2' },
  time: { question: 'When?', band: 'border-t-chart-1' },
  with: { question: 'With what?', band: 'border-t-chart-4' },
  for: { question: 'For whom?', band: 'border-t-chart-4' },
  from: { question: 'From where?', band: 'border-t-chart-4' },
  whose: { question: 'Whose?', band: 'border-t-chart-4' },
};

const SentenceTile = ({ tile, isChanged }: { tile: ISentenceTile; isChanged: boolean }) => {
  const gender = tile.spoken?.pronunciation.gender ?? '';
  return (
    <div
      className={cn(
        'flex min-w-[6.5rem] flex-col items-center gap-0.5 border border-t-4 bg-background px-3 py-2 text-center [&_p]:my-0',
        ROLES[tile.role].band,
        isChanged
          ? 'border-x-primary border-b-primary bg-primary/10 animate-pop-in'
          : 'border-x-border border-b-border',
      )}
    >
      <span className="text-xxs font-semibold uppercase tracking-caps text-muted-foreground">
        {ROLES[tile.role].question}
      </span>
      <span
        className={cn('text-xl leading-tight', gender && GENDER_TEXT[gender])}
        lang={tile.spoken?.pronunciation.lang}
      >
        {tile.word}
      </span>
      {tile.spoken?.pronunciation.translit ? (
        <span className="text-xxs italic text-muted-foreground">{tile.spoken.pronunciation.translit}</span>
      ) : null}
      {tile.meaning ? <span className="text-xs text-foreground">{tile.meaning}</span> : null}
      {gender ? (
        <span className={cn('text-xxs font-semibold', GENDER_TEXT[gender])}>{WORD_GENDER_NAMES[gender]}</span>
      ) : null}
    </div>
  );
};

/**
 * A sentence as a picture of who does what to what: one tile per role, in the sentence's order,
 * each headed by the question it answers. Switching to the next sentence lights up the tiles that
 * changed, so a learner sees an ending move with the doer, or a verb follow its subject.
 */
export const SentenceBlock = ({ variants }: { variants: ISentenceVariant[] }) => {
  const [index, setIndex] = useState(0);
  const variant = variants[index];
  if (!variant) return null;
  const previous = index > 0 ? variants[index - 1] : null;
  const changed = (tile: ISentenceTile, at: number) => !!previous && previous.tiles[at]?.text !== tile.text;

  return (
    <ActivityFrame
      icon={ArrowsLeftRightIcon}
      title={variants.length > 1 ? `Sentence picture · ${index + 1} of ${variants.length}` : 'Sentence picture'}
    >
      <div key={index} className="flex flex-wrap items-center justify-center gap-1.5">
        {variant.tiles.map((tile, at) => (
          <div key={`${index}.${at}`} className="flex items-center gap-1.5">
            {at > 0 ? <ArrowRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" weight="bold" /> : null}
            <SentenceTile tile={tile} isChanged={changed(tile, at)} />
          </div>
        ))}
      </div>
      {variant.caption ? (
        <div className="mt-3 text-center text-base animate-fade-in [&_p]:my-0">{variant.caption}</div>
      ) : null}
      {variants.length > 1 ? (
        <div className="mt-3 flex flex-col items-center gap-1.5">
          <StepNav index={index} count={variants.length} onChange={setIndex} noun="sentence" />
          <span className="text-xs text-muted-foreground print:hidden">
            {previous ? 'The lit tiles changed.' : 'Next sentence: watch which tiles change.'}
          </span>
        </div>
      ) : null}
    </ActivityFrame>
  );
};
