import { ALL_SYMBOLS, type ISymbol } from './symbols';

const STORAGE_KEY = 'parthhub.editor.recent-symbols';
/** In practice a maths teacher uses about fifteen symbols for a whole term; twelve fit one row. */
export const RECENT_SYMBOL_LIMIT = 12;

const readStored = (): string[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    // Storage can be blocked or full; recents are a convenience, not state anything depends on.
    return [];
  }
};

/**
 * The most recently inserted palette symbols, newest first, as full items so the palette can
 * render them. A LaTeX string that no longer matches a symbol (the palette changed) is dropped.
 */
export const loadRecentSymbols = (): ISymbol[] =>
  readStored()
    .map((latex) => ALL_SYMBOLS.find((item) => item.latex === latex))
    .filter((item): item is ISymbol => Boolean(item));

/** Moves a symbol to the front of the recents and persists the list. Returns the new list. */
export const rememberSymbol = (item: ISymbol): ISymbol[] => {
  const next = [item.latex, ...readStored().filter((latex) => latex !== item.latex)].slice(0, RECENT_SYMBOL_LIMIT);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Same as above: a failed write only means the list does not survive the session.
  }
  return loadRecentSymbols();
};
