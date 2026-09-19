import { type DefaultMarkingType, type MarkingType } from '@repo/shared/interfaces';
import { ArrowCounterClockwiseIcon } from '@phosphor-icons/react';
import { Button, TextInput } from '@repo/ui/app';
import { cn } from '@repo/ui/lib';
import { Marking, type QuestionType } from '@enums';
import { defaultMarkings as APP_DEFAULT_MARKINGS } from '@utils/constants';
import { useEffect, useRef, useState } from 'react';
import { QUESTION_TYPE_ORDER, QUESTION_TYPES } from './question-types';

interface IProps {
  value: DefaultMarkingType;
  onChange: (markings: DefaultMarkingType) => void;
  isDisabled?: boolean;
  className?: string;
}

const COLUMNS: { marking: Marking; label: string; tone: string }[] = [
  { marking: Marking.CORRECT, label: 'Correct', tone: 'text-success' },
  { marking: Marking.INCORRECT, label: 'Incorrect', tone: 'text-destructive' },
  { marking: Marking.UNATTEMPTED, label: 'Unattempted', tone: 'text-warning' },
];

/** The key an input carries in its `name`, and the key its text is held under. */
const inputKey = (questionType: QuestionType, marking: Marking) => `${questionType}-${marking}`;

/**
 * What the inputs hold: text, not numbers.
 *
 * A negative mark passes through "-" on its way to "-1", and a cleared field through "", neither of
 * which is a number. The text is kept here and the parsed table is what leaves through `onChange`,
 * so a half-typed value never has to round-trip through `Number`.
 */
type IInputs = Record<string, string>;

const toInputs = (markings: DefaultMarkingType): IInputs => {
  const inputs: IInputs = {};
  (Object.keys(markings) as QuestionType[]).forEach((questionType) => {
    Object.values(Marking).forEach((marking) => {
      const value = markings[questionType]?.[marking];
      inputs[inputKey(questionType, marking)] = value === undefined ? '' : String(value);
    });
  });
  return inputs;
};

/** Every key is written, an unparseable field as 0; `MarkingsDto` requires them all. */
const toMarkings = (inputs: IInputs, source: DefaultMarkingType): DefaultMarkingType => {
  const markings = structuredClone(source);
  (Object.keys(markings) as QuestionType[]).forEach((questionType) => {
    const row: MarkingType = markings[questionType];
    Object.values(Marking).forEach((marking) => {
      const parsed = parseFloat(inputs[inputKey(questionType, marking)] ?? '');
      row[marking] = Number.isFinite(parsed) ? parsed : 0;
    });
  });
  return markings;
};

/** The types the table has rows for, in the order the type picker shows them. */
const rowTypes = (markings: DefaultMarkingType): QuestionType[] =>
  QUESTION_TYPE_ORDER.filter((type) => type in markings);

/**
 * The marks a question of each type is worth, as an editable grid: one row per type, one column
 * per outcome. Used inline wherever a section's defaults are set — it used to live behind a button
 * in a second modal, which hid the one thing a section is for and, rendered inside a centred
 * modal's transform, came out a third of its intended width.
 */
export const DefaultMarkingsTable = ({ value, onChange, isDisabled, className }: IProps) => {
  const [inputs, setInputs] = useState<IInputs>(() => toInputs(value));
  // The table the last change produced. The parent hands it straight back as `value`, and re-seeding
  // from it would turn a half-typed "-" into "0" under the author's cursor, so only a table that
  // came from somewhere else — a different section, a reset by the parent — re-seeds the inputs.
  const lastEmitted = useRef<DefaultMarkingType | null>(null);

  useEffect(() => {
    if (value !== lastEmitted.current) setInputs(toInputs(value));
  }, [value]);

  const emit = (next: IInputs, source: DefaultMarkingType) => {
    const markings = toMarkings(next, source);
    lastEmitted.current = markings;
    onChange(markings);
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value: text } = event.target;
    const next = { ...inputs, [name]: text };
    setInputs(next);
    emit(next, value);
  };

  const reset = () => {
    const defaults = structuredClone(APP_DEFAULT_MARKINGS);
    setInputs(toInputs(defaults));
    emit(toInputs(defaults), defaults);
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="overflow-x-auto rounded-lg border border-border">
        {/* Fixed layout: a number input reports a wide intrinsic width, and an auto table would grow
            each column to it and overflow a phone; here the header widths win and the inputs fill them. */}
        <table className="w-full table-fixed border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-2 py-2 text-left text-xxs font-semibold uppercase tracking-caps text-muted-foreground sm:px-3">
                Type
              </th>
              {COLUMNS.map(({ marking, label, tone }) => (
                <th
                  key={marking}
                  className={cn(
                    'w-[5rem] px-1 py-2 text-right text-xs font-semibold sm:w-32 sm:px-3 sm:text-xxs sm:uppercase sm:tracking-caps',
                    tone,
                  )}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowTypes(value).map((questionType) => {
              const meta = QUESTION_TYPES[questionType];
              const Icon = meta.icon;
              return (
                <tr key={questionType} className="border-b border-border last:border-b-0">
                  <td className="px-2 py-1.5 sm:px-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium sm:gap-2 sm:whitespace-nowrap sm:text-sm">
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      {meta.label}
                    </span>
                  </td>
                  {COLUMNS.map(({ marking, label }) => (
                    <td key={marking} className="px-1 py-1.5 sm:px-2">
                      <div className="min-w-0">
                        <TextInput
                          name={inputKey(questionType, marking)}
                          value={inputs[inputKey(questionType, marking)] ?? ''}
                          type="number"
                          step="0.5"
                          className="h-8 px-2 text-right font-mono"
                          onChange={handleChange}
                          placeholder="0"
                          disabled={isDisabled}
                          aria-label={`${meta.label}: ${label} marks`}
                        />
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {isDisabled ? null : (
        <div className="flex justify-end">
          <Button
            isSubtle
            className="px-2 py-1 text-xs"
            text="Reset to defaults"
            leftsection={<ArrowCounterClockwiseIcon className="h-3.5 w-3.5" />}
            onClick={reset}
          />
        </div>
      )}
    </div>
  );
};
