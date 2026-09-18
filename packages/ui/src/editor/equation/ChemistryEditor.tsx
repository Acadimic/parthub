import { CaretDownIcon, PlusIcon, TrashIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { MathRender } from '../../content/MathRender';
import { Popover } from '../../core/Popover';
import { TextInput } from '../../core/TextInput';
import { Tooltip } from '../../core/Tooltip';
import { cn } from '../../lib/cn';
import {
  ARROW_CONDITIONS,
  ARROW_DIRECTIONS,
  buildArrow,
  CHEMISTRY_INSERTS,
  describeArrow,
  joinReaction,
  parseArrow,
  splitReaction,
} from './chemistry';
import { InsertChip } from './panel-controls';

export interface IChemistryEditorProps {
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
 * Delete sits at the right-hand end of that row, inside the connector's own border, so it is
 * visible without a click and the border says what it belongs to. The popover offers the direction
 * and the condition above the arrow, with the conditions written often enough to be one click.
 */
const Connector = ({ token, onChange, onRemove }: IConnectorProps) => {
  const arrow = parseArrow(token);
  const set = (patch: Partial<typeof arrow>) => onChange(buildArrow({ ...arrow, ...patch }));

  return (
    <div className="flex h-9 items-stretch border border-border bg-muted/40">
      <Popover
        triggerClassName="min-w-0 flex-1"
        className="w-72 p-3"
        trigger={
          <button
            type="button"
            aria-label={`Arrow: ${describeArrow(token)}`}
            className="flex h-full w-full items-center gap-2.5 px-2.5 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <MathRender latex={`\\ce{${token}}`} />
            <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{describeArrow(token)}</span>
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
            <div className="mt-1.5 flex flex-wrap gap-1">
              {ARROW_CONDITIONS.map((condition) => (
                <InsertChip
                  key={condition.value}
                  label={condition.label}
                  onClick={() => set({ condition: condition.value })}
                />
              ))}
            </div>
          </div>
        </div>
      </Popover>

      {onRemove ? (
        <Tooltip title="Remove this step">
          <button
            type="button"
            onClick={onRemove}
            aria-label="Remove this step"
            // `h-full` is what centres the icon: `Tooltip` puts a wrapper span between this button
            // and the flex row, so `items-stretch` stretches the span rather than the button.
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
 * notation that encodes it. Formulas go in as `CaCO3` and `CaO + CO2`, exactly as they would be
 * written on a board; the arrow and its condition are controls rather than punctuation; and the
 * notation a keyboard does not offer — state symbols, charges, an evolved gas — is a row of chips
 * that insert at the caret of the species last typed into.
 *
 * Stacked rather than side by side, so the chain always reads in order and a fourth step costs a
 * row rather than the layout.
 */
export const ChemistryEditor = ({ body, onChange, onSubmit, onCancel }: IChemistryEditorProps) => {
  const chain = splitReaction(body);
  const update = (next: typeof chain) => onChange(joinReaction(next));
  /**
   * Which slot should take the caret when it mounts. Adding a step appends a field below the fold
   * of a scrolling chain; focusing the new one also scrolls it into view.
   */
  const [focusIndex, setFocusIndex] = useState(0);
  /** The species the chips insert into: the one last focused, defaulting to the first. */
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  /** Inserts at the caret of the active species, then puts the caret after what was inserted. */
  const insertToken = (token: string) => {
    const index = Math.min(activeIndex, chain.species.length - 1);
    const input = inputRefs.current[index];
    const current = chain.species[index] ?? '';
    const start = input?.selectionStart ?? current.length;
    const end = input?.selectionEnd ?? current.length;
    setSpecies(index, `${current.slice(0, start)}${token}${current.slice(end)}`);
    // The value lands on the next render; the caret is set once the input has it.
    requestAnimationFrame(() => {
      input?.focus();
      input?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const setArrow = (index: number, token: string) => {
    const arrows = [...chain.arrows];
    arrows[index] = token;
    update({ ...chain, arrows });
  };

  /** Seeds the space before the new arrow here, since `joinReaction` deliberately adds nothing. */
  const addStep = () => {
    const species = [...chain.species];
    const last = species.length - 1;
    if (species[last] && !/\s$/.test(species[last])) species[last] = `${species[last]} `;
    setFocusIndex(species.length);
    setActiveIndex(species.length);
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
   * with reactants and ends with products, and only the slots in between are numbered steps.
   */
  const slotLabel = (index: number) => {
    if (!isChain) return 'Formula';
    if (index === 0) return 'Reactants';
    if (index === chain.species.length - 1) return 'Products';
    return `Step ${index}`;
  };

  return (
    <div className="flex flex-col gap-2">
      {/* The chain scrolls; the chips, preview and "Add step" below it do not, so the rendered
          result — the one part that says whether any of it is right — is never pushed off screen. */}
      <div className="flex max-h-[13rem] flex-col gap-2 overflow-y-auto">
        {chain.species.map((value, index) => (
          // Index is the identity here: these are positions in a sequence, not entities.
          <div key={index} className="flex flex-col gap-2">
            <div>
              <FieldLabel>{slotLabel(index)}</FieldLabel>
              <TextInput
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                value={value}
                onChange={(event) => setSpecies(index, event.target.value)}
                onKeyDown={onKeyDown}
                onFocus={() => setActiveIndex(index)}
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

      <div className="flex flex-wrap gap-1" role="group" aria-label="Insert notation">
        {CHEMISTRY_INSERTS.map((item) => (
          <InsertChip key={item.label} label={item.label} onClick={() => insertToken(item.insert)}>
            <MathRender latex={item.preview} />
          </InsertChip>
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
