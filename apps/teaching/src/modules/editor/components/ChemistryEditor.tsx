import { CaretDownIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { MathRender, Popover, TextInput, Tooltip } from '@repo/ui/core';
import { cn } from '@repo/ui/lib';
import { useState } from 'react';
import { ARROW_DIRECTIONS, arrowLabel, buildArrow, joinChain, parseArrow, splitChain } from '../lib/palette';

interface IProps {
  /** The inside of `\ce{…}` — the reaction itself, without the wrapper. */
  body: string;
  onChange: (body: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="mb-1 block text-xxs font-semibold uppercase tracking-caps text-muted-foreground">{children}</span>
);

interface IConnectorProps {
  token: string;
  onChange: (token: string) => void;
  onRemove?: () => void;
}

/**
 * The arrow between two species, as a row of its own.
 *
 * Delete sits at the right-hand end of that row, inside the connector's own border. Two earlier
 * placements were each wrong in one way: a bare `×` floating between two controls said nothing
 * about what it would remove, and burying it in the popover made it so hard to find that the first
 * question asked of the design was "how do I delete a step?". Inside the row it is visible without
 * a click, and the border says what it belongs to.
 */
const Connector = ({ token, onChange, onRemove }: IConnectorProps) => {
  const arrow = parseArrow(token);
  const set = (patch: Partial<typeof arrow>) => onChange(buildArrow({ ...arrow, ...patch }));

  return (
    <div className="flex h-9 items-stretch border border-border bg-muted/40">
      <Popover
        triggerClassName="min-w-0 flex-1"
        className="w-64 p-3"
        trigger={
          <button
            type="button"
            aria-label={`Arrow: ${arrowLabel(token)}`}
            className="flex h-full w-full items-center gap-2.5 px-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <MathRender latex={`\\ce{${token}}`} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{arrowLabel(token)}</span>
            <CaretDownIcon className="h-3 w-3 shrink-0 text-muted-foreground" weight="bold" />
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <div>
            <FieldLabel>Direction</FieldLabel>
            <div className="flex border border-border">
              {ARROW_DIRECTIONS.map((option) => (
                <button
                  key={option.token}
                  type="button"
                  onClick={() => set({ direction: option.token })}
                  aria-label={option.label}
                  aria-pressed={option.token === arrow.direction}
                  title={option.label}
                  className={cn(
                    'flex flex-1 items-center justify-center border-r border-border py-1.5 transition-colors last:border-r-0',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring',
                    option.token === arrow.direction ? 'bg-primary/10 text-primary' : 'hover:bg-accent',
                  )}
                >
                  <MathRender latex={`\\ce{${option.token}}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Above the arrow</FieldLabel>
            <TextInput
              value={arrow.condition}
              onChange={(event) => set({ condition: event.target.value })}
              placeholder="light, heat, a catalyst…"
              inputClassName="font-mono text-sm"
              aria-label="Condition above the arrow"
            />
          </div>
        </div>
      </Popover>

      {onRemove ? (
        <Tooltip title="Remove this step">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove this step"
            // `h-full` is what centres the icon. `Tooltip` puts a wrapper span between this button
            // and the flex row, so `items-stretch` stretches the span rather than the button — with
            // no height of its own the button collapsed to the 14px icon and sat against the top of
            // a 36px row.
            className="flex h-full w-9 items-center justify-center border-l border-border text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </Tooltip>
      ) : null}
    </div>
  );
};

/**
 * The editor for a chemical equation.
 *
 * Modelled on what a reaction is — an alternating chain of species and arrows — rather than on the
 * notation that encodes it. Nothing on screen is mhchem: formulas go in as `CaCO3` and `CaO + CO2`,
 * exactly as they would be written on a board, and the parts that are not guessable (the arrow and
 * its condition) are controls rather than punctuation.
 *
 * Laid out as a stack rather than a row. Side by side, a third species left each field about two
 * characters wide in a 540px panel and wrapped "Products" onto a second line — which breaks the one
 * thing the ordering carries, that the reaction runs in sequence. Stacked, the chain always reads
 * in order and a fourth step costs a row rather than the layout.
 */
export const ChemistryEditor = ({ body, onChange, onSubmit, onCancel }: IProps) => {
  const chain = splitChain(body);
  const update = (next: typeof chain) => onChange(joinChain(next));
  /**
   * Which slot should take the caret when it mounts. Adding a step appends a field below the fold
   * of a scrolling chain, so without this the author presses "Add step", sees nothing move, and has
   * to scroll down to find the empty box they just asked for. Focusing it also scrolls it into view.
   */
  const [focusIndex, setFocusIndex] = useState(0);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      onSubmit();
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      onCancel();
    }
  };

  const setSpecies = (index: number, value: string) => {
    const species = [...chain.species];
    species[index] = value;
    update({ ...chain, species });
  };

  const setArrow = (index: number, token: string) => {
    const arrows = [...chain.arrows];
    arrows[index] = token;
    update({ ...chain, arrows });
  };

  /** Seeds the space before the new arrow here, since `joinChain` deliberately adds nothing. */
  const addStep = () => {
    const species = [...chain.species];
    const last = species.length - 1;
    if (species[last] && !/\s$/.test(species[last])) species[last] = `${species[last]} `;
    setFocusIndex(species.length);
    update({ species: [...species, ''], arrows: [...chain.arrows, '->'] });
  };

  const removeStep = (index: number) =>
    update({
      species: chain.species.filter((_, i) => i !== index + 1),
      arrows: chain.arrows.filter((_, i) => i !== index),
    });

  const isChain = chain.species.length > 1;

  /**
   * Chemistry's own words, not the data structure's. A lone species is a formula; a reaction starts
   * with reactants and ends with products, and only the slots in between are numbered steps —
   * calling the right-hand side of `A -> B` "Step 1" would be the chain model leaking out.
   */
  const slotLabel = (index: number) => {
    if (!isChain) return 'Formula';
    if (index === 0) return 'Reactants';
    if (index === chain.species.length - 1) return 'Products';
    return `Step ${index}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* The chain scrolls; the preview and "Add step" below it do not. A four-step reaction makes
          this panel taller than the pane it opens in, and the first thing to be pushed off the
          bottom was the rendered result — the one part that tells the author whether any of it is
          right. Growth is absorbed here instead. */}
      <div className="flex max-h-[13rem] flex-col gap-2 overflow-y-auto">
        {chain.species.map((value, index) => (
          // Index is the identity here: these are positions in a sequence, not entities, and a
          // reordered chain is a different chain rather than the same rows moved about.
          <div key={index} className="flex flex-col gap-2">
            <div>
              <FieldLabel>{slotLabel(index)}</FieldLabel>
              <TextInput
                value={value}
                onChange={(event) => setSpecies(index, event.target.value)}
                onKeyDown={onKeyDown}
                autoFocus={index === focusIndex}
                placeholder={index === 0 ? 'CaCO3' : 'CaO + CO2'}
                inputClassName="font-mono text-sm"
                aria-label={slotLabel(index)}
              />
            </div>

            {index < chain.arrows.length ? (
              <Connector
                token={chain.arrows[index]}
                onChange={(token) => setArrow(index, token)}
                onRemove={chain.arrows.length > 1 ? () => removeStep(index) : undefined}
              />
            ) : null}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addStep}
        className="flex h-8 items-center justify-center gap-1 border border-dashed border-border text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <PlusIcon className="h-3.5 w-3.5" weight="bold" />
        Add step
      </button>

      {/* A heavier ground than the connectors above it: this is the result, not another control. */}
      <div
        data-chemistry-preview
        className="mt-1 flex min-h-[3.25rem] items-center justify-center overflow-x-auto border border-border bg-muted px-3 py-2"
      >
        {body.trim() ? (
          <MathRender latex={`\\ce{${body}}`} displayMode />
        ) : (
          <span className="text-xs text-muted-foreground">Your equation appears here</span>
        )}
      </div>
    </div>
  );
};
