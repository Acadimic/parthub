import { MagnifyingGlassIcon, SparkleIcon } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { MathRender } from '../../content/MathRender';
import { Popover } from '../../core/Popover';
import { cn } from '../../lib/cn';
import { FORMULA_SUBJECTS, FORMULAS, type FormulaSubject, type IFormula, searchFormulas } from './formulas';
import { PanelTrigger } from './panel-controls';

interface IProps {
  onInsert: (latex: string) => void;
  /** Override the built-in list — the hook for a gallery seeded per standard and subject. */
  formulas?: IFormula[];
}

/**
 * The formula gallery: complete, named formulas inserted whole and then edited in place.
 *
 * Searchable and filterable by subject, because at fifty entries a flat list is already too long to
 * scan, and the list is meant to grow from the support app.
 */
export const FormulaGallery = ({ onInsert, formulas = FORMULAS }: IProps) => {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState<FormulaSubject | null>(null);

  const visible = useMemo(() => {
    const matched = searchFormulas(search, formulas);
    return subject ? matched.filter((formula) => formula.subject === subject) : matched;
  }, [search, subject, formulas]);

  return (
    <Popover
      className="flex w-[min(30rem,90vw)] max-h-[26rem] flex-col p-0"
      trigger={
        <PanelTrigger>
          <SparkleIcon className="h-4 w-4" />
          Formulas
        </PanelTrigger>
      }
    >
      {({ handleClose }) => (
        <>
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search formulas — quadratic, Ohm, gas…"
              aria-label="Search formulas"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
          </div>
          <div className="flex gap-1 border-b border-border px-3 py-2" role="group" aria-label="Subject">
            {[null, ...FORMULA_SUBJECTS].map((option) => (
              <button
                key={option ?? 'all'}
                type="button"
                onClick={() => setSubject(option)}
                aria-pressed={subject === option}
                className={cn(
                  'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                  subject === option
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {option ?? 'All'}
              </button>
            ))}
          </div>
          <div className="flex flex-col overflow-y-auto">
            {visible.map((formula) => (
              <button
                key={formula.label}
                type="button"
                onClick={() => {
                  onInsert(formula.latex);
                  handleClose();
                }}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{formula.label}</span>
                  <span className="block text-xxs uppercase tracking-caps text-muted-foreground">
                    {formula.subject}
                  </span>
                </span>
                <MathRender latex={formula.latex} className="shrink-0 text-sm" />
              </button>
            ))}
            {visible.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">No formula matches “{search}”.</p>
            ) : null}
          </div>
        </>
      )}
    </Popover>
  );
};
