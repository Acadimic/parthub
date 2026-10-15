import { SpeakerHighIcon, SquaresFourIcon } from '@phosphor-icons/react';
import { type ReactNode, useId } from 'react';
import { cn } from '../../lib/cn';
import { GENDER_TEXT } from '../gender';
import { SPEECH_RATES } from '../speech/player';
import { useSpeech } from '../speech/use-speech';
import { ActivityFrame, type ISpoken } from './ActivityFrame';

export interface ISoundBoardCell {
  isHeader: boolean;
  /** The cell as written, for a cell with nothing to say (a label, an empty corner). */
  content: ReactNode;
  spoken: ISpoken | null;
}

interface ISoundBoardProps {
  rows: ISoundBoardCell[][];
}

/** One tile: tap and it speaks, straight away, with no card in between. `onPlay` hears the tap too. */
export const Tile = ({
  cell,
  onPlay,
  isActive,
}: {
  cell: ISoundBoardCell;
  onPlay?: () => void;
  isActive?: boolean;
}) => {
  const id = useId();
  const { status, play, stop } = useSpeech(id);
  const { spoken } = cell;
  if (!spoken) {
    return (
      <div className="flex min-h-14 items-center justify-center p-1 text-center text-sm [&_p]:my-0">{cell.content}</div>
    );
  }
  const isBusy = status !== 'idle';
  const { pronunciation, text } = spoken;
  return (
    <button
      type="button"
      onClick={() => {
        onPlay?.();
        return isBusy
          ? stop()
          : play({ segments: [text], lang: pronunciation.lang, audio: pronunciation.audio, rate: SPEECH_RATES.normal });
      }}
      aria-label={`Play ${text}${pronunciation.translit ? `, ${pronunciation.translit}` : ''}`}
      className={cn(
        'group flex min-h-14 min-w-0 flex-col items-center justify-center gap-0.5 border px-1 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        // Colour only, no scale: a tile that grew would spill out of the scrolling grid and add scrollbars.
        isBusy || isActive ? 'border-primary bg-primary/15' : 'border-border bg-background hover:bg-accent',
      )}
    >
      <span
        lang={pronunciation.lang}
        className={cn(
          'text-xl leading-tight',
          pronunciation.gender ? GENDER_TEXT[pronunciation.gender] : 'text-foreground',
        )}
      >
        {text}
      </span>
      {pronunciation.translit ? (
        <span className="text-xxs italic text-muted-foreground">{pronunciation.translit}</span>
      ) : null}
      <SpeakerHighIcon
        className={cn(
          'h-3 w-3 print:hidden',
          isBusy ? 'text-primary' : 'text-muted-foreground/60 group-hover:text-primary',
        )}
        weight="bold"
      />
    </button>
  );
};

/**
 * A table turned into a board of tiles that speak when tapped: the varṇamālā as something to play
 * with, a letter with every vowel sign, a table of word forms where each cell can be heard. Header
 * cells stay labels. The columns keep their order on a phone and the board scrolls sideways if it
 * has to, so a row never breaks across lines.
 */
export const SoundBoard = ({ rows }: ISoundBoardProps) => {
  const columns = Math.max(...rows.map((row) => row.length), 1);
  const [header, ...body] = rows;
  // A row of labels over one row of tiles is a set of labelled tiles: each label stays with its
  // tile and the set wraps on a narrow screen instead of scrolling sideways.
  const isLabelledSet = body.length === 1 && !!header?.every((cell) => cell.isHeader && !cell.spoken);
  if (isLabelledSet) {
    return (
      <ActivityFrame icon={SquaresFourIcon} title="Tap to hear">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-2">
          {body[0].map((cell, index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className="text-center text-xs font-semibold text-muted-foreground [&_p]:my-0">
                {header[index]?.content}
              </span>
              <Tile cell={cell} />
            </div>
          ))}
        </div>
      </ActivityFrame>
    );
  }
  return (
    <ActivityFrame icon={SquaresFourIcon} title="Tap to hear">
      <div className="overflow-x-auto">
        <div
          className="grid min-w-max gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(4rem, 1fr))` }}
          role="grid"
        >
          {rows.flatMap((row, rowIndex) =>
            row.map((cell, cellIndex) =>
              cell.isHeader && !cell.spoken ? (
                <div
                  key={`${rowIndex}.${cellIndex}`}
                  className="flex min-h-8 items-center justify-center px-1 text-center text-xs font-semibold text-muted-foreground [&_p]:my-0"
                >
                  {cell.content}
                </div>
              ) : (
                <Tile key={`${rowIndex}.${cellIndex}`} cell={cell} />
              ),
            ),
          )}
        </div>
      </div>
    </ActivityFrame>
  );
};
