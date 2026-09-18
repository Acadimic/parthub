import { ClockCounterClockwiseIcon, FunctionIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { useEffect, useMemo, useState } from 'react';
import { MathRender } from '../../content/MathRender';
import { Popover } from '../../core/Popover';
import { Tooltip } from '../../core/Tooltip';
import { PanelTrigger, PopoverHeading } from './panel-controls';
import { loadRecentSymbols, rememberSymbol } from './recent-symbols';
import { type ISymbol, type ISymbolGroup, SYMBOL_GROUPS, matchesSymbol, toPreviewLatex } from './symbols';

interface IProps {
  onInsert: (latex: string) => void;
}

/** One insertable symbol. The visible content is rendered maths, so the name lives on `aria-label`. */
const SymbolTile = ({ item, onInsert }: { item: ISymbol; onInsert: (item: ISymbol) => void }) => (
  <Tooltip title={item.label}>
    <button
      type="button"
      onClick={() => onInsert(item)}
      aria-label={item.label}
      className="flex h-10 min-w-10 items-center justify-center border border-border bg-background px-2 transition-colors hover:border-primary hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <MathRender latex={toPreviewLatex(item)} />
    </button>
  </Tooltip>
);

const SymbolGroup = ({ group, onInsert }: { group: ISymbolGroup; onInsert: (item: ISymbol) => void }) => (
  <div>
    <PopoverHeading>{group.name}</PopoverHeading>
    <div className="flex flex-wrap gap-1">
      {group.items.map((item) => (
        <SymbolTile key={`${group.name}:${item.latex}`} item={item} onInsert={onInsert} />
      ))}
    </div>
  </div>
);

/**
 * The symbol palette: every group from `SYMBOL_GROUPS`, searchable, with the author's recent picks
 * first.
 *
 * Recents are read on mount rather than at module load because they live in `localStorage`, which
 * the server render has no access to; the palette only ever mounts inside an open equation editor,
 * so the read is cheap and always client-side.
 */
export const SymbolPalette = ({ onInsert }: IProps) => {
  const [search, setSearch] = useState('');
  const [recent, setRecent] = useState<ISymbol[]>([]);

  useEffect(() => {
    setRecent(loadRecentSymbols());
  }, []);

  const groups = useMemo(() => {
    if (!search.trim()) return SYMBOL_GROUPS;
    return SYMBOL_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => matchesSymbol(item, search)),
    })).filter((group) => group.items.length);
  }, [search]);

  const insert = (item: ISymbol) => {
    setRecent(rememberSymbol(item));
    onInsert(item.latex);
  };

  return (
    <Popover
      className="flex w-[min(34rem,90vw)] max-h-[26rem] flex-col p-0"
      trigger={
        <PanelTrigger>
          <FunctionIcon className="h-4 w-4" />
          Symbols
        </PanelTrigger>
      }
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search symbols — fraction, alpha, integral…"
          aria-label="Search symbols"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
        />
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto p-3">
        {!search.trim() && recent.length ? (
          <div>
            <PopoverHeading>
              <span className="inline-flex items-center gap-1">
                <ClockCounterClockwiseIcon className="h-3 w-3" />
                Recent
              </span>
            </PopoverHeading>
            <div className="flex flex-wrap gap-1">
              {recent.map((item) => (
                <SymbolTile key={`recent:${item.latex}`} item={item} onInsert={insert} />
              ))}
            </div>
          </div>
        ) : null}
        {groups.map((group) => (
          <SymbolGroup key={group.name} group={group} onInsert={insert} />
        ))}
        {groups.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">No symbol matches “{search}”.</p>
        ) : null}
      </div>
    </Popover>
  );
};
