import { EarIcon } from '@phosphor-icons/react';
import type { MouthPlace } from '@repo/shared/utils';
import { useState } from 'react';
import { cn } from '../../lib/cn';
import { ActivityFrame } from './ActivityFrame';
import { type ISoundBoardCell, Tile } from './SoundBoard';

/** How a column's sound is made, read from its header. */
export interface IManner {
  isPuff: boolean;
  isBuzz: boolean;
  isNose: boolean;
}

export interface ISoundMapRow {
  place: MouthPlace | null;
  label: ISoundBoardCell;
  cells: { cell: ISoundBoardCell; manner: IManner }[];
}

interface ISoundMapProps {
  header: ISoundBoardCell[];
  rows: ISoundMapRow[];
}

/** Where each place sits on the drawing (viewBox 0 0 260 220), and its name. */
const PLACES: Record<MouthPlace, { x: number; y: number; name: string }> = {
  throat: { x: 150, y: 150, name: 'throat' },
  palate: { x: 172, y: 96, name: 'palate' },
  roof: { x: 198, y: 92, name: 'roof' },
  teeth: { x: 223, y: 106, name: 'teeth' },
  lips: { x: 240, y: 119, name: 'lips' },
};

/**
 * A head in profile, facing right: the mouth from the throat to the lips. Drawn with theme tokens,
 * so it follows light and dark mode. The active place glows; a puff of air leaves the lips, a buzz
 * shakes the throat, air through the nose rises from the nose, as the sound asks.
 */
const Head = ({ place, manner }: { place: MouthPlace | null; manner: IManner | null }) => (
  <svg
    viewBox="0 0 260 220"
    className="h-auto w-full max-w-[17rem]"
    role="img"
    aria-label="A head in profile, showing the mouth from the throat to the lips"
  >
    {/* Head and neck. */}
    <path
      d="M60 205 L60 160 Q20 130 30 80 Q40 20 120 12 Q200 8 225 60 L238 88 L230 92 Q240 100 236 106 L244 118 Q246 124 238 126 L242 134 Q236 144 226 146 Q222 168 196 168 L170 170 L170 205 Z"
      className="fill-muted stroke-muted-foreground"
      strokeWidth="2"
    />
    {/* The mouth: roof above, tongue below. */}
    <path d="M140 150 Q140 100 170 94 Q205 86 230 104" className="fill-none stroke-foreground" strokeWidth="2.5" />
    <path
      d="M150 158 Q160 128 195 122 Q218 118 228 126"
      className="fill-none stroke-destructive/60"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <rect x="221" y="100" width="6" height="9" className="fill-background stroke-foreground" strokeWidth="1.5" />
    <rect x="221" y="122" width="6" height="8" className="fill-background stroke-foreground" strokeWidth="1.5" />
    {/* Every place, small; the active one large and glowing. */}
    {(Object.keys(PLACES) as MouthPlace[]).map((key) => {
      const { x, y } = PLACES[key];
      const isOn = key === place;
      return (
        <g key={key}>
          {isOn ? (
            <circle
              cx={x}
              cy={y}
              r="14"
              className="animate-ping fill-primary/30"
              style={{ transformOrigin: `${x}px ${y}px` }}
            />
          ) : null}
          <circle cx={x} cy={y} r={isOn ? 8 : 4} className={cn(isOn ? 'fill-primary' : 'fill-muted-foreground/50')} />
        </g>
      );
    })}
    {/* Puff: air leaves the lips. */}
    {manner?.isPuff ? (
      <g className="animate-pulse stroke-primary" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M248 112 q8 4 0 8" />
        <path d="M253 106 q12 8 0 20" />
      </g>
    ) : null}
    {/* Buzz: the throat vibrates. */}
    {manner?.isBuzz ? (
      <path
        d="M100 168 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6"
        className="animate-pulse fill-none stroke-primary"
        strokeWidth="2.5"
      />
    ) : null}
    {/* Nose: the air goes up and out through the nose. */}
    {manner?.isNose ? (
      <g className="animate-pulse fill-none stroke-primary" strokeWidth="2.5" strokeLinecap="round">
        <path d="M200 110 Q215 80 236 80" />
        <path d="M232 74 l6 6 l-8 3" />
      </g>
    ) : null}
  </svg>
);

/** " · puff of air · buzz" for the caption under the head. */
const mannerWords = ({ isPuff, isBuzz, isNose }: IManner): string =>
  [isPuff && 'puff of air', isBuzz && 'buzz in the throat', isNose && 'air through the nose']
    .filter(Boolean)
    .map((word) => ` · ${word}`)
    .join('');

/**
 * Where the sound is made: tap a letter and hear it, while its place lights up on the head and the
 * drawing shows a puff, a buzz or air through the nose. The rows are places from the throat to the
 * lips, so the table itself reads as a map of the mouth.
 */
export const SoundMap = ({ header, rows }: ISoundMapProps) => {
  const [active, setActive] = useState<{ row: number; col: number } | null>(null);
  const row = active ? rows[active.row] : null;
  const manner = active && row ? (row.cells[active.col]?.manner ?? null) : null;
  return (
    <ActivityFrame icon={EarIcon} title="Where the sound is made">
      <div className="flex flex-col items-center gap-3 md:flex-row md:items-start">
        {/* Pinned at the top on a phone, so the head stays in view while a lower row is tapped. */}
        <div className="sticky top-0 z-10 flex w-full shrink-0 flex-col items-center border-b border-border bg-card pb-1 md:static md:w-auto md:max-w-[13rem] md:border-b-0">
          <div className="w-full max-w-[9rem] md:max-w-[13rem]">
            <Head place={row?.place ?? null} manner={manner} />
          </div>
          <p className="mt-1 min-h-8 text-center text-xs text-muted-foreground" aria-live="polite">
            {row?.place ? (
              <>
                Made at: <span className="font-semibold text-primary">{row.place}</span>
                {manner ? mannerWords(manner) : ''}
              </>
            ) : (
              'Tap a letter to see where it is made.'
            )}
          </p>
        </div>
        <div className="w-full min-w-0 overflow-x-auto">
          <div
            className="grid min-w-max gap-1.5 md:min-w-0"
            style={{ gridTemplateColumns: `repeat(${Math.max(header.length, 1)}, minmax(2.6rem, 1fr))` }}
          >
            {header.map((cell, index) => (
              <div
                key={`h${index}`}
                className="flex min-h-8 items-end justify-center px-1 text-center text-xs font-semibold text-muted-foreground [&_p]:my-0"
              >
                {cell.content}
              </div>
            ))}
            {rows.flatMap((item, rowIndex) => [
              <div
                key={`r${rowIndex}`}
                className={cn(
                  'flex items-center justify-center px-1 text-center text-xs font-semibold [&_p]:my-0',
                  active?.row === rowIndex ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                {item.label.content}
              </div>,
              ...item.cells.map(({ cell }, col) => (
                <Tile
                  key={`${rowIndex}.${col}`}
                  cell={cell}
                  isActive={active?.row === rowIndex && active.col === col}
                  onPlay={() => setActive({ row: rowIndex, col })}
                />
              )),
            ])}
          </div>
        </div>
      </div>
    </ActivityFrame>
  );
};
